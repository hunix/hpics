import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/embeddings';

interface RAGQueryOptions {
  query: string;
  profileId?: string;
  sourceTypes?: string[];
  crossContact?: boolean;
  threshold?: number;
  topK?: number;
  includeMetadata?: boolean;
  hybridSearch?: boolean;
}

interface RAGResult {
  id: string;
  profileId?: string;
  profileName?: string;
  sourceType: string;
  content: string;
  summary?: string;
  similarity: number;
  metadata?: any;
}

async function generateQueryEmbedding(query: string): Promise<number[] | null> {
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
        input: query
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
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

// Expand query with synonyms and related terms using AI
async function expandQueryWithAI(query: string): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return [query];
  }

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
          {
            role: 'system',
            content: 'Generate 2-3 alternative phrasings or related search terms for the given query. Return only the terms, one per line, no numbering or bullets.'
          },
          { role: 'user', content: query }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return [query];
    }

    const data = await response.json();
    const expansions = data.choices[0].message.content
      .split('\n')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    return [query, ...expansions].slice(0, 4);
  } catch {
    return [query];
  }
}

// Reciprocal Rank Fusion for combining search results
function reciprocalRankFusion(
  semanticResults: RAGResult[],
  keywordResults: RAGResult[],
  k: number = 60
): RAGResult[] {
  const scores = new Map<string, { score: number; result: RAGResult }>();
  
  // Score semantic results
  semanticResults.forEach((result, rank) => {
    const rrf = 1 / (k + rank + 1);
    const existing = scores.get(result.id);
    if (existing) {
      existing.score += rrf;
    } else {
      scores.set(result.id, { score: rrf, result });
    }
  });
  
  // Score keyword results
  keywordResults.forEach((result, rank) => {
    const rrf = 1 / (k + rank + 1);
    const existing = scores.get(result.id);
    if (existing) {
      existing.score += rrf;
    } else {
      scores.set(result.id, { score: rrf, result });
    }
  });
  
  // Sort by combined score
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(s => ({ ...s.result, similarity: s.score }));
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

    const options: RAGQueryOptions = await req.json();
    const {
      query,
      profileId,
      sourceTypes,
      crossContact = false,
      threshold = 0.5,
      topK = 20,
      includeMetadata = true,
      hybridSearch = true
    } = options;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    
    if (!queryEmbedding) {
      return new Response(JSON.stringify({ error: 'Failed to generate query embedding' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Semantic search using vector similarity
    const { data: semanticResults, error: semanticError } = await supabase.rpc(
      'match_documents',
      {
        p_user_id: user.id,
        p_query_embedding: queryEmbedding,
        p_match_threshold: threshold,
        p_match_count: topK * 2, // Get more for fusion
        p_profile_id: crossContact ? null : profileId,
        p_source_types: sourceTypes || null
      }
    );

    if (semanticError) {
      console.error('Semantic search error:', semanticError);
    }

    let results: RAGResult[] = [];

    if (hybridSearch) {
      // Keyword search for hybrid retrieval
      const { data: keywordResults, error: keywordError } = await supabase.rpc(
        'keyword_search_documents',
        {
          search_query: query,
          p_user_id: user.id,
          p_profile_id: crossContact ? null : profileId,
          p_source_types: sourceTypes || null,
          match_count: topK * 2
        }
      );

      if (keywordError) {
        console.error('Keyword search error:', keywordError);
      }

      // Format results for fusion
      const formattedSemantic: RAGResult[] = (semanticResults || []).map((r: any) => ({
        id: r.id,
        profileId: r.profile_id,
        sourceType: r.source_type,
        content: r.content,
        summary: r.content_summary,
        similarity: r.similarity,
        metadata: r.metadata
      }));

      const formattedKeyword: RAGResult[] = (keywordResults || []).map((r: any) => ({
        id: r.id,
        profileId: r.profile_id,
        sourceType: r.source_type,
        content: r.content,
        summary: null,
        similarity: r.rank,
        metadata: r.metadata
      }));

      // Apply RRF fusion
      results = reciprocalRankFusion(formattedSemantic, formattedKeyword);
    } else {
      results = (semanticResults || []).map((r: any) => ({
        id: r.id,
        profileId: r.profile_id,
        sourceType: r.source_type,
        content: r.content,
        summary: r.content_summary,
        similarity: r.similarity,
        metadata: r.metadata
      }));
    }

    // Limit to topK
    results = results.slice(0, topK);

    // Enrich with profile names if cross-contact
    if (crossContact && results.length > 0) {
      const profileIds = [...new Set(results.filter(r => r.profileId).map(r => r.profileId))];
      
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', profileIds);

        const profileMap = new Map(
          (profiles || []).map((p: any) => [p.id, `${p.first_name || ''} ${p.last_name || ''}`.trim()])
        );

        results = results.map(r => ({
          ...r,
          profileName: r.profileId ? profileMap.get(r.profileId) || 'Unknown' : undefined
        }));
      }
    }

    // Build context string for AI consumption
    const contextBlocks = results.map((r, i) => {
      let block = `[Source ${i + 1}: ${r.sourceType}`;
      if (r.profileName) block += ` - ${r.profileName}`;
      block += ` (relevance: ${(r.similarity * 100).toFixed(1)}%)]`;
      block += `\n${r.content}`;
      return block;
    });

    return new Response(JSON.stringify({
      success: true,
      query,
      results,
      contextString: contextBlocks.join('\n\n---\n\n'),
      totalResults: results.length,
      searchType: hybridSearch ? 'hybrid' : 'semantic'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RAG query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('RATE_LIMIT')) {
      return new Response(JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (errorMessage.includes('BUDGET_EXCEEDED')) {
      return new Response(JSON.stringify({ error: 'AI budget exceeded. Please add credits.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
