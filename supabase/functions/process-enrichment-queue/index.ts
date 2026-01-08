import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 5;
const MAX_PROCESSING_TIME_MS = 25000; // Leave buffer before timeout
const EMBEDDING_MODEL = 'text-embedding-3-small';

interface QueueItem {
  id: string;
  user_id: string;
  profile_id: string | null;
  enrichment_type: string;
  source_type: string;
  source_id: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  metadata: Record<string, unknown>;
}

async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://api.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: [text],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.data[0].embedding;
}

// deno-lint-ignore no-explicit-any
async function getContentForSource(
  supabase: any,
  sourceType: string,
  sourceId: string
): Promise<{ content: string; profileId: string | null } | null> {
  switch (sourceType) {
    case 'messages': {
      const { data } = await supabase
        .from('messages')
        .select('content, conversation_id, conversations!inner(profile_id)')
        .eq('id', sourceId)
        .single();
      if (!data?.content) return null;
      return { 
        content: data.content, 
        profileId: data.conversations?.profile_id ?? null
      };
    }
    case 'documents': {
      const { data } = await supabase
        .from('documents')
        .select('title, description, extracted_text, profile_id')
        .eq('id', sourceId)
        .single();
      if (!data) return null;
      const content = [data.title, data.description, data.extracted_text]
        .filter(Boolean)
        .join('\n\n');
      return { content, profileId: data.profile_id };
    }
    case 'contact_observations': {
      const { data } = await supabase
        .from('contact_observations')
        .select('observation, context, profile_id')
        .eq('id', sourceId)
        .single();
      if (!data?.observation) return null;
      const content = data.context 
        ? `${data.context}: ${data.observation}`
        : data.observation;
      return { content, profileId: data.profile_id };
    }
    default:
      return null;
  }
}

// deno-lint-ignore no-explicit-any
async function processQueueItem(
  supabase: any,
  item: QueueItem
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mark as processing
    await supabase
      .from('enrichment_queue')
      .update({ 
        status: 'processing', 
        started_at: new Date().toISOString(),
        attempts: item.attempts + 1,
      })
      .eq('id', item.id);

    // Get content based on source type
    const sourceData = await getContentForSource(
      supabase, 
      item.source_type, 
      item.source_id
    );

    if (!sourceData || !sourceData.content || sourceData.content.length < 20) {
      // Content too short or not found, mark as completed (skip)
      await supabase
        .from('enrichment_queue')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          metadata: { ...item.metadata, skipped: true, reason: 'content_too_short' },
        })
        .eq('id', item.id);
      return { success: true };
    }

    // Generate embedding
    const embedding = await generateEmbedding(sourceData.content);

    // Store in document_embeddings
    const summary = sourceData.content.length > 200 
      ? sourceData.content.substring(0, 200) + '...' 
      : sourceData.content;

    const { error: upsertError } = await supabase
      .from('document_embeddings')
      .upsert({
        user_id: item.user_id,
        profile_id: sourceData.profileId || item.profile_id,
        source_type: item.source_type,
        source_id: item.source_id,
        content: sourceData.content,
        content_summary: summary,
        embedding_vector: `[${embedding.join(',')}]`,
        metadata: {
          model: EMBEDDING_MODEL,
          dimensions: embedding.length,
          generated_at: new Date().toISOString(),
          auto_enriched: true,
        },
      }, {
        onConflict: 'user_id,source_type,source_id',
      });

    if (upsertError) {
      throw new Error(`Upsert failed: ${upsertError.message}`);
    }

    // Mark as completed
    await supabase
      .from('enrichment_queue')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if we should retry
    if (item.attempts + 1 >= item.max_attempts) {
      await supabase
        .from('enrichment_queue')
        .update({ 
          status: 'failed', 
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    } else {
      // Schedule retry with exponential backoff
      const backoffMinutes = Math.pow(2, item.attempts);
      await supabase
        .from('enrichment_queue')
        .update({ 
          status: 'pending',
          error_message: errorMessage,
          scheduled_for: new Date(Date.now() + backoffMinutes * 60000).toISOString(),
        })
        .eq('id', item.id);
    }

    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Optional: allow manual triggering with auth
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id ?? null;
    }

    // Fetch pending items (optionally filtered by user)
    let query = supabase
      .from('enrichment_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(BATCH_SIZE);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: items, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch queue: ${fetchError.message}`);
    }

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No items to process',
        processed: 0,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process items until time limit
    const results: { id: string; success: boolean; error?: string }[] = [];
    
    for (const item of items as QueueItem[]) {
      // Check time limit
      if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
        console.log('[process-enrichment-queue] Time limit reached, stopping');
        break;
      }

      const result = await processQueueItem(supabase, item);
      results.push({ id: item.id, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[process-enrichment-queue] Processed ${results.length} items: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      successCount,
      failCount,
      results,
      durationMs: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[process-enrichment-queue] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
