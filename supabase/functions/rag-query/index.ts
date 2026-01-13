import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";
import { getAIConfig, getRAGConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGResult {
  source_type: string;
  source_id: string;
  content: string;
  relevance_score: number;
  metadata: Record<string, any>;
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

    const { 
      query, 
      profileId = null, 
      sourceTypes = null,
      maxResults = 10,
      includeAnswer = true,
      modelTier = 'balanced'
    } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Get RAG config from platform settings
    const ragConfig = await getRAGConfig(supabase, user.id);
    const effectiveMaxResults = maxResults || ragConfig.maxResults;

    // Search across multiple data sources
    const results: RAGResult[] = [];

    // 1. Search document embeddings (if available)
    const { data: embeddings } = await supabase.rpc('search_document_embeddings', {
      p_user_id: user.id,
      p_profile_id: profileId,
      p_source_type: sourceTypes?.[0] || null,
      p_limit: effectiveMaxResults,
    });

    if (embeddings) {
      for (const doc of embeddings) {
        results.push({
          source_type: doc.source_type,
          source_id: doc.source_id,
          content: doc.content_summary || doc.content?.substring(0, 1000) || '',
          relevance_score: 0.8, // Default for embedding matches
          metadata: doc.metadata || {},
        });
      }
    }

    // 2. Search messages (keyword-based fallback)
    let messageQuery = supabase
      .from('messages')
      .select('id, content, sent_at, is_from_contact, conversation_id, conversations!inner(profile_id, platform)')
      .eq('conversations.user_id', user.id)
      .ilike('content', `%${query}%`)
      .order('sent_at', { ascending: false })
      .limit(effectiveMaxResults);

    if (profileId) {
      messageQuery = messageQuery.eq('conversations.profile_id', profileId);
    }

    const { data: messages } = await messageQuery;
    if (messages) {
      for (const msg of messages) {
        results.push({
          source_type: 'message',
          source_id: msg.id,
          content: msg.content,
          relevance_score: 0.7,
          metadata: {
            sent_at: msg.sent_at,
            platform: (msg.conversations as any)?.platform,
            from_contact: msg.is_from_contact,
          },
        });
      }
    }

    // 3. Search communications
    let commQuery = supabase
      .from('communications')
      .select('id, subject, content, occurred_at, channel, direction')
      .eq('user_id', user.id)
      .or(`subject.ilike.%${query}%,content.ilike.%${query}%`)
      .order('occurred_at', { ascending: false })
      .limit(effectiveMaxResults);

    if (profileId) {
      commQuery = commQuery.eq('profile_id', profileId);
    }

    const { data: comms } = await commQuery;
    if (comms) {
      for (const comm of comms) {
        results.push({
          source_type: 'communication',
          source_id: comm.id,
          content: `${comm.subject ? `Subject: ${comm.subject}\n` : ''}${comm.content || ''}`,
          relevance_score: 0.7,
          metadata: {
            channel: comm.channel,
            direction: comm.direction,
            occurred_at: comm.occurred_at,
          },
        });
      }
    }

    // 4. Search AI analyses
    let analysisQuery = supabase
      .from('ai_analyses')
      .select('id, analysis_type, result, generated_at, profile_id, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })
      .limit(effectiveMaxResults);

    if (profileId) {
      analysisQuery = analysisQuery.eq('profile_id', profileId);
    }

    const { data: analyses } = await analysisQuery;
    if (analyses) {
      for (const analysis of analyses) {
        const resultStr = JSON.stringify(analysis.result);
        if (resultStr.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            source_type: 'analysis',
            source_id: analysis.id,
            content: resultStr.substring(0, 1000),
            relevance_score: 0.6,
            metadata: {
              analysis_type: analysis.analysis_type,
              generated_at: analysis.generated_at,
              profile_name: analysis.profiles ? `${(analysis.profiles as any).first_name} ${(analysis.profiles as any).last_name}` : null,
            },
          });
        }
      }
    }

    // 5. Search observations
    let obsQuery = supabase
      .from('contact_observations')
      .select('id, category, observation_text, created_at, profile_id, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .ilike('observation_text', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(effectiveMaxResults);

    if (profileId) {
      obsQuery = obsQuery.eq('profile_id', profileId);
    }

    const { data: observations } = await obsQuery;
    if (observations) {
      for (const obs of observations) {
        results.push({
          source_type: 'observation',
          source_id: obs.id,
          content: obs.observation_text,
          relevance_score: 0.75,
          metadata: {
            category: obs.category,
            created_at: obs.created_at,
            profile_name: obs.profiles ? `${(obs.profiles as any).first_name} ${(obs.profiles as any).last_name}` : null,
          },
        });
      }
    }

    // Filter by similarity threshold from config
    const filteredResults = results.filter(r => r.relevance_score >= ragConfig.similarityThreshold);

    // Sort by relevance and limit
    const sortedResults = filteredResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, effectiveMaxResults);

    let answer = null;
    let citations: any[] = [];

    // Generate AI answer if requested and we have results
    if (includeAnswer && sortedResults.length > 0) {
      try {
        // Get AI config from platform settings
        const aiConfig = await getAIConfig(supabase, user.id);
        
        const contextChunks = sortedResults.map((r, i) => 
          `[Source ${i + 1} - ${r.source_type}]: ${r.content}`
        ).join('\n\n');

        const aiResponse = await callAI({
          model: aiConfig.defaultModel,
          messages: [
            {
              role: 'system',
              content: `You are a helpful AI assistant with access to the user's personal relationship data. Answer questions using the provided context. Always cite your sources using [Source N] format. Be concise and accurate. If the context doesn't contain enough information to answer, say so.`,
            },
            {
              role: 'user',
              content: `Context from user's data:\n\n${contextChunks}\n\nQuestion: ${query}\n\nProvide a helpful answer based on the context above. Cite sources using [Source N] format.`,
            },
          ],
          userId: user.id,
          functionName: 'rag-query',
          profileId: profileId || undefined,
          temperature: 0.3,
          maxTokens: 1000,
          metadata: { 
            query_length: query.length,
            context_sources: sortedResults.length,
          },
        });

        answer = aiResponse.content;

        // Extract citations from answer
        const citationMatches = answer.match(/\[Source (\d+)\]/g) || [];
        const citedIndices = [...new Set(citationMatches.map((m: string) => parseInt(m.match(/\d+/)![0]) - 1))];
        citations = citedIndices
          .filter(i => i >= 0 && i < sortedResults.length)
          .map(i => ({
            index: i + 1,
            source: sortedResults[i],
          }));

      } catch (aiError) {
        console.error('AI answer generation error:', aiError);
        answer = 'Unable to generate answer. Please review the search results below.';
      }
    }

    return new Response(JSON.stringify({
      success: true,
      query,
      answer,
      citations,
      results: sortedResults,
      total_results: sortedResults.length,
      searched_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG query error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
