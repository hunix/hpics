import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 10;
const EMBEDDING_MODEL = 'text-embedding-3-small';

interface EmbeddingRequest {
  texts: string[];
  sourceType: string;
  sourceIds: string[];
  profileId?: string;
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
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
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  return result.data.map((item: { embedding: number[] }) => item.embedding);
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { texts, sourceType, sourceIds, profileId } = await req.json() as EmbeddingRequest;

    if (!texts?.length || !sourceType || !sourceIds?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (texts.length !== sourceIds.length) {
      return new Response(JSON.stringify({ error: 'texts and sourceIds must have same length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process in batches
    const results: { sourceId: string; success: boolean; error?: string }[] = [];
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const batchIds = sourceIds.slice(i, i + BATCH_SIZE);
      
      try {
        // Generate embeddings for batch
        const embeddings = await generateEmbeddings(batchTexts);
        
        // Upsert to document_embeddings
        for (let j = 0; j < batchTexts.length; j++) {
          const text = batchTexts[j];
          const sourceId = batchIds[j];
          const embedding = embeddings[j];
          
          // Create summary (first 200 chars)
          const summary = text.length > 200 ? text.substring(0, 200) + '...' : text;
          
          const { error: upsertError } = await supabase
            .from('document_embeddings')
            .upsert({
              user_id: user.id,
              profile_id: profileId,
              source_type: sourceType,
              source_id: sourceId,
              content: text,
              content_summary: summary,
              embedding_vector: `[${embedding.join(',')}]`,
              metadata: {
                model: EMBEDDING_MODEL,
                dimensions: embedding.length,
                generated_at: new Date().toISOString(),
              },
            }, {
              onConflict: 'user_id,source_type,source_id',
            });

          if (upsertError) {
            results.push({ sourceId, success: false, error: upsertError.message });
          } else {
            results.push({ sourceId, success: true });
          }
        }
      } catch (batchError) {
        // Mark all in batch as failed
        for (const sourceId of batchIds) {
          results.push({ sourceId, success: false, error: String(batchError) });
        }
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`[generate-embeddings] Processed ${texts.length} texts: ${successCount} success, ${failCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      processed: texts.length,
      successCount,
      failCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-embeddings] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
