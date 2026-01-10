import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface ExtractedEntity {
  type: 'person' | 'company' | 'location' | 'product' | 'event' | 'date' | 'money';
  name: string;
  normalizedName: string;
  context: string;
  confidence: number;
  sentiment?: number;
}

async function extractEntities(text: string): Promise<ExtractedEntity[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  const response = await fetch(LOVABLE_AI_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'system',
          content: `You are an entity extraction system. Extract all named entities from the text and return them as JSON.

For each entity, provide:
- type: one of "person", "company", "location", "product", "event", "date", "money"
- name: the exact text as it appears
- normalizedName: lowercase, standardized version
- context: the surrounding sentence or phrase (max 200 chars)
- confidence: 0-1 score of how confident you are
- sentiment: -1 to 1 score if the mention has emotional tone, null otherwise

Return format:
{
  "entities": [
    {"type": "person", "name": "John Smith", "normalizedName": "john smith", "context": "...", "confidence": 0.95, "sentiment": 0.2}
  ]
}

Focus on business-relevant entities. Skip common words and generic references.`
        },
        {
          role: 'user',
          content: text.substring(0, 4000)
        }
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT: Too many requests');
    }
    if (response.status === 402) {
      throw new Error('BUDGET_EXCEEDED: AI budget exceeded');
    }
    console.error('Entity extraction API error:', await response.text());
    return [];
  }

  const data = await response.json();
  try {
    const content = data.choices[0].message.content;
    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.entities || [];
    }
    return [];
  } catch {
    return [];
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
      text, 
      sourceType, 
      sourceId, 
      profileId,
      processExisting = false,
      limit = 50
    } = await req.json();

    let totalExtracted = 0;
    const errors: string[] = [];

    if (text && sourceType && sourceId) {
      // Process single text
      const entities = await extractEntities(text);
      
      for (const entity of entities) {
        const { error } = await supabase.from('entity_mentions').insert({
          user_id: user.id,
          entity_type: entity.type,
          entity_name: entity.name,
          normalized_name: entity.normalizedName,
          source_type: sourceType,
          source_id: sourceId,
          mentioned_in_profile_id: profileId,
          context: entity.context,
          sentiment: entity.sentiment,
          confidence: entity.confidence
        });

        if (error) {
          errors.push(`Failed to insert entity: ${entity.name}`);
        } else {
          totalExtracted++;
        }
      }
    } else if (processExisting) {
      // Process existing documents that don't have entities yet
      const sources = [
        { table: 'messages', contentField: 'content', type: 'message', hasProfileId: false },
        { table: 'contact_observations', contentField: 'observation_text', type: 'observation', hasProfileId: true },
        { table: 'voice_insights', contentField: 'transcription', type: 'voice', hasProfileId: true }
      ];

      for (const source of sources) {
        let query;
        
        if (source.table === 'messages') {
          // Messages need to join with conversations to get profile_id
          query = supabase
            .from('messages')
            .select('id, content, conversations!inner(profile_id)')
            .eq('conversations.user_id', user.id)
            .limit(limit);
        } else {
          query = supabase
            .from(source.table)
            .select('*')
            .eq('user_id', user.id)
            .limit(limit);
        }

        const { data: records } = await query;

        for (const record of (records || []) as any[]) {
          const content = record[source.contentField];
          if (!content || content.length < 50) continue;

          // Check if already processed
          const { data: existing } = await supabase
            .from('entity_mentions')
            .select('id')
            .eq('source_type', source.type)
            .eq('source_id', record.id)
            .limit(1);

          if (existing && existing.length > 0) continue;

          const entities = await extractEntities(content);
          const recordProfileId = source.table === 'messages' 
            ? record.conversations?.profile_id 
            : record.profile_id;

          for (const entity of entities) {
            const { error: insertErr } = await supabase.from('entity_mentions').insert({
              user_id: user.id,
              entity_type: entity.type,
              entity_name: entity.name,
              normalized_name: entity.normalizedName,
              source_type: source.type,
              source_id: record.id,
              mentioned_in_profile_id: recordProfileId,
              context: entity.context,
              sentiment: entity.sentiment,
              confidence: entity.confidence
            });

            if (!insertErr) totalExtracted++;
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      entitiesExtracted: totalExtracted,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Entity extraction error:', error);
    
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
