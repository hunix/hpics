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

// Generate embedding for query using Lovable AI Gateway
async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

// Cross-encoder re-ranking using AI
async function rerankResults(
  query: string,
  results: RAGResult[],
  aiConfig: any,
  userId: string
): Promise<RAGResult[]> {
  if (results.length <= 1) return results;

  try {
    // Prepare passages for re-ranking
    const passages = results.map((r, i) => ({
      index: i,
      content: r.content.substring(0, 500), // Limit content length
    }));

    const response = await callAI({
      model: aiConfig.speedModel,
      messages: [
        {
          role: 'system',
          content: `You are a relevance scoring system. Score each passage's relevance to the query on a scale of 0-100. Return ONLY a JSON array of objects with "index" and "score" fields, ordered by score descending. No other text.`,
        },
        {
          role: 'user',
          content: `Query: "${query}"\n\nPassages:\n${passages.map(p => `[${p.index}]: ${p.content}`).join('\n\n')}\n\nReturn JSON array with relevance scores:`,
        },
      ],
      userId,
      functionName: 'rag-query-rerank',
      temperature: 0.1,
      maxTokens: 500,
    });

    // Parse re-ranking scores
    const scoreMatch = response.content.match(/\[[\s\S]*\]/);
    if (!scoreMatch) return results;

    const scores = JSON.parse(scoreMatch[0]) as Array<{ index: number; score: number }>;
    
    // Apply new scores and re-sort
    const rerankedResults = [...results];
    for (const { index, score } of scores) {
      if (index >= 0 && index < rerankedResults.length) {
        rerankedResults[index].relevance_score = score / 100;
      }
    }

    return rerankedResults.sort((a, b) => b.relevance_score - a.relevance_score);
  } catch (error) {
    console.error('Re-ranking error:', error);
    return results; // Fall back to original order
  }
}

// Reciprocal Rank Fusion for combining vector and keyword results
function reciprocalRankFusion(
  vectorResults: RAGResult[],
  keywordResults: RAGResult[],
  alpha: number,
  k = 60
): RAGResult[] {
  const scores = new Map<string, { score: number; result: RAGResult }>();

  // Score vector results (weighted by alpha)
  vectorResults.forEach((result, rank) => {
    const key = `${result.source_type}:${result.source_id}`;
    const rrfScore = alpha * (1 / (k + rank + 1));
    scores.set(key, { score: rrfScore, result });
  });

  // Score keyword results (weighted by 1-alpha)
  keywordResults.forEach((result, rank) => {
    const key = `${result.source_type}:${result.source_id}`;
    const rrfScore = (1 - alpha) * (1 / (k + rank + 1));
    const existing = scores.get(key);
    if (existing) {
      existing.score += rrfScore;
    } else {
      scores.set(key, { score: rrfScore, result });
    }
  });

  // Convert to array and sort by combined score
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ result, score }) => ({ ...result, relevance_score: score }));
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
      maxResults = null,
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

    // Get configs from platform settings
    const [ragConfig, aiConfig] = await Promise.all([
      getRAGConfig(supabase, user.id),
      getAIConfig(supabase, user.id),
    ]);
    
    const effectiveMaxResults = maxResults || ragConfig.maxResults;

    // ========== VECTOR SEARCH ==========
    const vectorResults: RAGResult[] = [];
    
    // Generate query embedding for vector search
    const queryEmbedding = await generateQueryEmbedding(query);
    
    if (queryEmbedding) {
      // Use match_documents_v2 RPC for true vector similarity search
      const { data: vectorDocs, error: vectorError } = await supabase.rpc('match_documents_v2', {
        query_embedding: queryEmbedding,
        match_threshold: ragConfig.similarityThreshold,
        match_count: effectiveMaxResults,
        p_user_id: user.id,
        p_profile_id: profileId,
      });

      if (!vectorError && vectorDocs) {
        for (const doc of vectorDocs) {
          vectorResults.push({
            source_type: doc.source_type || 'document',
            source_id: doc.id,
            content: doc.content || doc.content_summary || '',
            relevance_score: doc.similarity || 0.8,
            metadata: {
              ...doc.metadata,
              search_type: 'vector',
            },
          });
        }
      } else if (vectorError) {
        console.log('Vector search not available, falling back:', vectorError.message);
      }
    }

    // ========== KEYWORD SEARCH ==========
    const keywordResults: RAGResult[] = [];

    // 1. Search messages (keyword-based)
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
        keywordResults.push({
          source_type: 'message',
          source_id: msg.id,
          content: msg.content,
          relevance_score: 0.7,
          metadata: {
            sent_at: msg.sent_at,
            platform: (msg.conversations as any)?.platform,
            from_contact: msg.is_from_contact,
            search_type: 'keyword',
          },
        });
      }
    }

    // 2. Search communications
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
        keywordResults.push({
          source_type: 'communication',
          source_id: comm.id,
          content: `${comm.subject ? `Subject: ${comm.subject}\n` : ''}${comm.content || ''}`,
          relevance_score: 0.7,
          metadata: {
            channel: comm.channel,
            direction: comm.direction,
            occurred_at: comm.occurred_at,
            search_type: 'keyword',
          },
        });
      }
    }

    // 3. Search AI analyses
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
          keywordResults.push({
            source_type: 'analysis',
            source_id: analysis.id,
            content: resultStr.substring(0, 1000),
            relevance_score: 0.6,
            metadata: {
              analysis_type: analysis.analysis_type,
              generated_at: analysis.generated_at,
              profile_name: analysis.profiles ? `${(analysis.profiles as any).first_name} ${(analysis.profiles as any).last_name}` : null,
              search_type: 'keyword',
            },
          });
        }
      }
    }

    // 4. Search observations
    let obsQuery = supabase
      .from('contact_observations')
      .select('id, category, observation, created_at, profile_id, profiles(first_name, last_name)')
      .eq('user_id', user.id)
      .ilike('observation', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(effectiveMaxResults);

    if (profileId) {
      obsQuery = obsQuery.eq('profile_id', profileId);
    }

    const { data: observations } = await obsQuery;
    if (observations) {
      for (const obs of observations) {
        keywordResults.push({
          source_type: 'observation',
          source_id: obs.id,
          content: obs.observation,
          relevance_score: 0.75,
          metadata: {
            category: obs.category,
            created_at: obs.created_at,
            profile_name: obs.profiles ? `${(obs.profiles as any).first_name} ${(obs.profiles as any).last_name}` : null,
            search_type: 'keyword',
          },
        });
      }
    }

    // ========== HYBRID FUSION ==========
    let combinedResults: RAGResult[];
    
    if (vectorResults.length > 0 && keywordResults.length > 0) {
      // Use RRF to combine vector and keyword results
      combinedResults = reciprocalRankFusion(
        vectorResults,
        keywordResults,
        ragConfig.hybridSearchAlpha
      );
    } else if (vectorResults.length > 0) {
      combinedResults = vectorResults;
    } else {
      combinedResults = keywordResults;
    }

    // Filter by similarity threshold
    let filteredResults = combinedResults.filter(r => r.relevance_score >= ragConfig.similarityThreshold * 0.5);

    // ========== CROSS-ENCODER RE-RANKING ==========
    if (ragConfig.rerankEnabled && filteredResults.length > 1) {
      filteredResults = await rerankResults(query, filteredResults, aiConfig, user.id);
    }

    // Limit to max results
    const sortedResults = filteredResults.slice(0, effectiveMaxResults);

    let answer = null;
    let citations: any[] = [];

    // Generate AI answer if requested and we have results
    if (includeAnswer && sortedResults.length > 0) {
      try {
        // Truncate context to configured token limit
        let contextChunks = '';
        let tokenEstimate = 0;
        const maxContextTokens = ragConfig.contextWindowTokens;

        for (let i = 0; i < sortedResults.length; i++) {
          const chunk = `[Source ${i + 1} - ${sortedResults[i].source_type}]: ${sortedResults[i].content}\n\n`;
          const chunkTokens = chunk.length / 4; // Rough token estimate
          
          if (tokenEstimate + chunkTokens > maxContextTokens) break;
          
          contextChunks += chunk;
          tokenEstimate += chunkTokens;
        }

        const systemPrompt = ragConfig.citationRequired
          ? `You are a helpful AI assistant with access to the user's personal relationship data. Answer questions using the provided context. Always cite your sources using [Source N] format. Be concise and accurate. If the context doesn't contain enough information to answer, say so.`
          : `You are a helpful AI assistant with access to the user's personal relationship data. Answer questions using the provided context. Be concise and accurate. If the context doesn't contain enough information to answer, say so.`;

        const aiResponse = await callAI({
          model: aiConfig.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Context from user's data:\n\n${contextChunks}\n\nQuestion: ${query}\n\nProvide a helpful answer based on the context above.${ragConfig.citationRequired ? ' Cite sources using [Source N] format.' : ''}`,
            },
          ],
          userId: user.id,
          functionName: 'rag-query',
          profileId: profileId || undefined,
          temperature: aiConfig.temperature,
          maxTokens: 1000,
          metadata: { 
            query_length: query.length,
            context_sources: sortedResults.length,
            vector_results: vectorResults.length,
            keyword_results: keywordResults.length,
            reranked: ragConfig.rerankEnabled,
          },
        });

        answer = aiResponse.content;

        // Extract citations from answer
        if (ragConfig.citationRequired) {
          const citationMatches = answer.match(/\[Source (\d+)\]/g) || [];
          const citedIndices = [...new Set(citationMatches.map((m: string) => parseInt(m.match(/\d+/)![0]) - 1))];
          citations = citedIndices
            .filter(i => i >= 0 && i < sortedResults.length)
            .map(i => ({
              index: i + 1,
              source: sortedResults[i],
            }));
        }

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
      search_stats: {
        vector_results: vectorResults.length,
        keyword_results: keywordResults.length,
        hybrid_alpha: ragConfig.hybridSearchAlpha,
        reranked: ragConfig.rerankEnabled,
      },
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
