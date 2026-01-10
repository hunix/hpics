import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';

// Data sources to embed with their configurations
const DATA_SOURCES = [
  { 
    table: 'messages', 
    contentField: 'content',
    sourceType: 'message',
    joinQuery: 'JOIN conversations c ON c.id = messages.conversation_id',
    userIdPath: 'c.user_id',
    profileIdPath: 'c.profile_id',
    priority: 'high',
    minLength: 30
  },
  { 
    table: 'voice_insights', 
    contentField: 'transcription',
    sourceType: 'voice_transcription',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'high',
    minLength: 20
  },
  { 
    table: 'device_captures', 
    contentField: 'extracted_data',
    sourceType: 'social_capture',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'high',
    isJson: true
  },
  { 
    table: 'contact_observations', 
    contentField: 'observation_text',
    sourceType: 'observation',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'high',
    minLength: 10
  },
  { 
    table: 'ai_analyses', 
    contentField: 'result',
    sourceType: 'ai_analysis',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'medium',
    isJson: true
  },
  { 
    table: 'email_messages', 
    contentField: 'body',
    sourceType: 'email',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'medium',
    additionalFields: ['subject']
  },
  { 
    table: 'documents', 
    contentField: 'content',
    sourceType: 'document',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'medium',
    additionalFields: ['title', 'ocr_text']
  },
  { 
    table: 'media', 
    contentField: 'ai_metadata',
    sourceType: 'media_metadata',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'low',
    isJson: true,
    additionalFields: ['caption', 'tags', 'description']
  },
  { 
    table: 'behavioral_analyses', 
    contentField: 'behavioral_patterns',
    sourceType: 'behavioral_analysis',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'low',
    isJson: true
  },
  { 
    table: 'meeting_recordings', 
    contentField: 'transcription',
    sourceType: 'meeting_transcription',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'high',
    additionalFields: ['summary', 'notes']
  },
  { 
    table: 'psychological_profiles', 
    contentField: 'profile_data',
    sourceType: 'psychological_profile',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'medium',
    isJson: true
  },
  { 
    table: 'voice_recording_sessions', 
    contentField: 'transcription',
    sourceType: 'voice_recording',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'high'
  },
  { 
    table: 'screenshot_imports', 
    contentField: 'extracted_data',
    sourceType: 'screenshot',
    userIdPath: 'user_id',
    profileIdPath: 'profile_id',
    priority: 'medium',
    isJson: true
  }
];

// Semantic chunking configuration
const CHUNK_CONFIG = {
  maxTokens: 8192,
  overlapTokens: 200,
  avgCharsPerToken: 4
};

async function generateEmbedding(text: string): Promise<number[] | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY is not configured');
    return null;
  }

  try {
    const response = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, CHUNK_CONFIG.maxTokens * CHUNK_CONFIG.avgCharsPerToken)
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('Rate limit exceeded for embeddings');
        return null;
      }
      if (response.status === 402) {
        console.error('Budget exceeded for embeddings');
        return null;
      }
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

function extractTextFromJson(data: any): string {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return '';
  if (Array.isArray(data)) {
    return data.map(item => extractTextFromJson(item)).join(' ');
  }
  if (typeof data === 'object') {
    return Object.entries(data)
      .filter(([key, val]) => val && !['id', 'user_id', 'profile_id', 'created_at', 'updated_at'].includes(key))
      .map(([key, val]) => `${key}: ${extractTextFromJson(val)}`)
      .join('. ');
  }
  return String(data);
}

function chunkText(text: string, metadata: any): { content: string; chunkIndex: number }[] {
  const maxChars = CHUNK_CONFIG.maxTokens * CHUNK_CONFIG.avgCharsPerToken;
  
  if (text.length <= maxChars) {
    return [{ content: text, chunkIndex: 0 }];
  }

  const chunks: { content: string; chunkIndex: number }[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChars) {
      if (currentChunk) {
        chunks.push({ content: currentChunk.trim(), chunkIndex });
        chunkIndex++;
      }
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), chunkIndex });
  }

  return chunks;
}

async function processSource(
  supabase: any,
  userId: string,
  source: typeof DATA_SOURCES[0],
  options: { profileId?: string; forceRefresh?: boolean; limit?: number }
): Promise<{ processed: number; errors: number; skipped: number }> {
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  try {
    // Build query based on source configuration
    let query;
    
    if (source.table === 'messages') {
      query = supabase
        .from(source.table)
        .select(`id, ${source.contentField}, sent_at, conversation_id, conversations!inner(user_id, profile_id)`)
        .eq('conversations.user_id', userId);
      
      if (options.profileId) {
        query = query.eq('conversations.profile_id', options.profileId);
      }
    } else {
      const selectFields = [`id`, source.contentField, 'created_at'];
      if (source.profileIdPath === 'profile_id') {
        selectFields.push('profile_id');
      }
      if (source.additionalFields) {
        selectFields.push(...source.additionalFields);
      }
      
      query = supabase
        .from(source.table)
        .select(selectFields.join(', '))
        .eq('user_id', userId);

      if (options.profileId && source.profileIdPath === 'profile_id') {
        query = query.eq('profile_id', options.profileId);
      }
    }

    query = query.limit(options.limit || 500);

    const { data: records, error } = await query;

    if (error) {
      console.error(`Error fetching from ${source.table}:`, error);
      return { processed: 0, errors: 1, skipped: 0 };
    }

    if (!records || records.length === 0) {
      return { processed: 0, errors: 0, skipped: 0 };
    }

    for (const record of records) {
      try {
        // Extract content
        let content = record[source.contentField];
        
        if (!content) {
          skipped++;
          continue;
        }

        if (source.isJson) {
          content = extractTextFromJson(content);
        }

        // Add additional fields if configured
        if (source.additionalFields) {
          for (const field of source.additionalFields) {
            if (record[field]) {
              const fieldContent = typeof record[field] === 'object' 
                ? extractTextFromJson(record[field]) 
                : record[field];
              content = `${field}: ${fieldContent}\n${content}`;
            }
          }
        }

        // Skip if too short
        if (content.length < (source.minLength || 10)) {
          skipped++;
          continue;
        }

        // Check if already embedded (unless force refresh)
        if (!options.forceRefresh) {
          const { data: existing } = await supabase
            .from('document_embeddings')
            .select('id')
            .eq('source_type', source.sourceType)
            .eq('source_id', record.id)
            .single();

          if (existing) {
            skipped++;
            continue;
          }
        }

        // Chunk the content
        const chunks = chunkText(content, { sourceType: source.sourceType });
        
        // Get profile_id based on source configuration
        const profileId = source.table === 'messages' 
          ? record.conversations?.profile_id 
          : record.profile_id;

        for (const chunk of chunks) {
          // Generate embedding
          const embedding = await generateEmbedding(chunk.content);
          
          if (!embedding) {
            errors++;
            continue;
          }

          // Generate summary for longer content
          const contentSummary = chunk.content.length > 500 
            ? chunk.content.substring(0, 500) + '...'
            : chunk.content;

          // Store embedding
          const { error: insertError } = await supabase
            .from('document_embeddings')
            .upsert({
              user_id: userId,
              profile_id: profileId,
              source_type: source.sourceType,
              source_id: record.id,
              content: chunk.content,
              content_summary: contentSummary,
              embedding_vector: embedding,
              metadata: {
                table: source.table,
                chunk_index: chunk.chunkIndex,
                chunk_total: chunks.length,
                priority: source.priority,
                processed_at: new Date().toISOString()
              }
            }, {
              onConflict: 'source_type,source_id'
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            errors++;
          } else {
            processed++;
          }
        }
      } catch (recordError) {
        console.error(`Error processing record ${record.id}:`, recordError);
        errors++;
      }
    }
  } catch (sourceError) {
    console.error(`Error processing source ${source.table}:`, sourceError);
    errors++;
  }

  return { processed, errors, skipped };
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

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      profileId, 
      sourceTypes, 
      forceRefresh = false, 
      limit = 100 
    } = await req.json();

    // Filter sources if specified
    const sourcesToProcess = sourceTypes 
      ? DATA_SOURCES.filter(s => sourceTypes.includes(s.sourceType))
      : DATA_SOURCES;

    const results: Record<string, { processed: number; errors: number; skipped: number }> = {};
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    for (const source of sourcesToProcess) {
      console.log(`Processing source: ${source.table}`);
      
      const result = await processSource(supabase, user.id, source, {
        profileId,
        forceRefresh,
        limit
      });

      results[source.sourceType] = result;
      totalProcessed += result.processed;
      totalErrors += result.errors;
      totalSkipped += result.skipped;
    }

    return new Response(JSON.stringify({
      success: true,
      totalProcessed,
      totalErrors,
      totalSkipped,
      breakdown: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Universal embedding processor error:', error);
    
    if (error?.message?.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
