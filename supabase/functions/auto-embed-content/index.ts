import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_EMBED_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';

interface EmbeddingRequest {
  sourceType: 'message' | 'observation' | 'voice' | 'analysis' | 'document';
  sourceId: string;
  content: string;
  profileId?: string;
  metadata?: Record<string, any>;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY is not configured');
    return null;
  }

  try {
    const response = await fetch(LOVABLE_AI_EMBED_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000) // Limit to avoid token overflow
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMIT: Too many requests');
      }
      if (response.status === 402) {
        throw new Error('BUDGET_EXCEEDED: AI budget exceeded');
      }
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function generateSummary(text: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY || text.length < 200) return text.substring(0, 200);

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Summarize this text in 1-2 sentences. Focus on key facts and entities.' },
          { role: 'user', content: text.substring(0, 4000) }
        ],
        max_tokens: 150,
      }),
    });

    if (!response.ok) return text.substring(0, 200);
    const data = await response.json();
    return data.choices[0].message.content || text.substring(0, 200);
  } catch {
    return text.substring(0, 200);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      items,
      backfillType,
      batchSize = 50 
    }: { 
      items?: EmbeddingRequest[];
      backfillType?: 'messages' | 'observations' | 'voice' | 'all';
      batchSize?: number;
    } = await req.json();

    let processedCount = 0;
    let errorCount = 0;
    const results: any[] = [];

    if (items && items.length > 0) {
      // Process specific items
      for (const item of items) {
        if (!item.content || item.content.length < 20) continue;

        try {
          const embedding = await generateEmbedding(item.content);
          if (!embedding) continue;

          const summary = await generateSummary(item.content);

          const { error } = await supabase.from('document_embeddings').upsert({
            user_id: user.id,
            profile_id: item.profileId || null,
            source_type: item.sourceType,
            source_id: item.sourceId,
            content: item.content,
            content_summary: summary,
            embedding: JSON.stringify(embedding),
            metadata: item.metadata || {},
            last_embedded_at: new Date().toISOString()
          }, {
            onConflict: 'source_type,source_id,user_id'
          });

          if (error) {
            console.error('Insert error:', error);
            errorCount++;
          } else {
            processedCount++;
          }
        } catch (err) {
          console.error('Processing error:', err);
          errorCount++;
        }
      }
    } else if (backfillType) {
      // Backfill mode - process existing content without embeddings
      const sources = [];
      
      if (backfillType === 'messages' || backfillType === 'all') {
        sources.push({ table: 'messages', contentField: 'content', type: 'message' });
      }
      if (backfillType === 'observations' || backfillType === 'all') {
        sources.push({ table: 'contact_observations', contentField: 'observation', type: 'observation' });
      }
      if (backfillType === 'voice' || backfillType === 'all') {
        sources.push({ table: 'voice_insights', contentField: 'transcription', type: 'voice' });
      }

      for (const source of sources) {
        // Find items not yet embedded
        let query;
        if (source.table === 'messages') {
          query = supabase
            .from('messages')
            .select('id, content, conversations!inner(profile_id, user_id)')
            .eq('conversations.user_id', user.id)
            .limit(batchSize);
        } else {
          query = supabase
            .from(source.table)
            .select('*')
            .eq('user_id', user.id)
            .limit(batchSize);
        }

        const { data: records } = await query;

        for (const record of (records || []) as any[]) {
          const content = record[source.contentField];
          if (!content || content.length < 20) continue;

          // Check if already embedded
          const { data: existing } = await supabase
            .from('document_embeddings')
            .select('id')
            .eq('source_type', source.type)
            .eq('source_id', record.id)
            .eq('user_id', user.id)
            .limit(1);

          if (existing && existing.length > 0) continue;

          try {
            const embedding = await generateEmbedding(content);
            if (!embedding) continue;

            const summary = await generateSummary(content);
            const profileId = source.table === 'messages' 
              ? record.conversations?.profile_id 
              : record.profile_id;

            const { error } = await supabase.from('document_embeddings').insert({
              user_id: user.id,
              profile_id: profileId || null,
              source_type: source.type,
              source_id: record.id,
              content: content,
              content_summary: summary,
              embedding: JSON.stringify(embedding),
              metadata: { source_table: source.table },
              last_embedded_at: new Date().toISOString()
            });

            if (error) {
              errorCount++;
            } else {
              processedCount++;
              results.push({ id: record.id, type: source.type });
            }
          } catch (err) {
            errorCount++;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: processedCount,
      errors: errorCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Auto-embed error:', error);
    
    if (error?.message?.includes('RATE_LIMIT')) {
      return new Response(JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (error?.message?.includes('BUDGET_EXCEEDED')) {
      return new Response(JSON.stringify({ error: 'AI budget exceeded. Please add credits.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
