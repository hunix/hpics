import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentSource {
  id: string;
  content: string;
  source_type: string;
  profile_id?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { documentIds, sourceType = 'document', batchSize = 10 } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let documents: DocumentSource[] = [];

    // Fetch documents based on source type
    if (sourceType === 'document' && documentIds) {
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, content, description, profile_id, document_type')
        .eq('user_id', user.id)
        .in('id', documentIds);

      documents = (docs || []).map(d => ({
        id: d.id,
        content: `${d.title}\n\n${d.description || ''}\n\n${d.content || ''}`,
        source_type: 'document',
        profile_id: d.profile_id,
        metadata: { document_type: d.document_type },
      }));
    } else if (sourceType === 'message') {
      // Get recent messages without embeddings
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, sent_at, conversation_id, conversations!inner(profile_id)')
        .eq('conversations.user_id', user.id)
        .not('content', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(batchSize);

      documents = (messages || []).map(m => ({
        id: m.id,
        content: m.content,
        source_type: 'message',
        profile_id: (m.conversations as any)?.profile_id,
        metadata: { sent_at: m.sent_at },
      }));
    } else if (sourceType === 'observation') {
      const { data: observations } = await supabase
        .from('contact_observations')
        .select('id, observation_text, category, profile_id')
        .eq('user_id', user.id)
        .not('observation_text', 'is', null)
        .limit(batchSize);

      documents = (observations || []).map(o => ({
        id: o.id,
        content: o.observation_text,
        source_type: 'observation',
        profile_id: o.profile_id,
        metadata: { category: o.category },
      }));
    }

    if (documents.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        processed: 0,
        message: 'No documents to process',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processed = 0;
    const errors: string[] = [];

    // Process each document
    for (const doc of documents) {
      try {
        // Generate summary using AI
        const summaryResponse = await callAI({
          model: selectModel('speed'),
          messages: [
            {
              role: 'system',
              content: 'Generate a concise summary (2-3 sentences) of the following content. Focus on key facts, entities, and actionable information.',
            },
            {
              role: 'user',
              content: doc.content.substring(0, 2000),
            },
          ],
          userId: user.id,
          functionName: 'process-document-embeddings',
          profileId: doc.profile_id,
          temperature: 0.3,
          maxTokens: 200,
        });

        // Check if embedding already exists
        const { data: existing } = await supabase
          .from('document_embeddings')
          .select('id')
          .eq('source_id', doc.id)
          .eq('source_type', doc.source_type)
          .maybeSingle();

        if (existing) {
          // Update existing
          await supabase
            .from('document_embeddings')
            .update({
              content: doc.content.substring(0, 10000),
              content_summary: summaryResponse.content,
              metadata: doc.metadata,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase.from('document_embeddings').insert({
            user_id: user.id,
            profile_id: doc.profile_id || null,
            source_type: doc.source_type,
            source_id: doc.id,
            content: doc.content.substring(0, 10000),
            content_summary: summaryResponse.content,
            metadata: doc.metadata,
          });
        }

        processed++;
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        errors.push(`${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed,
      total: documents.length,
      errors: errors.length > 0 ? errors : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Document embedding error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
