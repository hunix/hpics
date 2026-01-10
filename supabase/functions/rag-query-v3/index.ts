import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query
      }),
    });

    if (!response.ok) {
      console.error('Embedding API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return null;
  }
}

// Expand query with synonyms and related terms
async function expandQuery(query: string): Promise<string[]> {
  // Simple query expansion - in production could use LLM
  const expansions = [query];
  
  // Add common variations
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('work')) {
    expansions.push(query.replace(/work/gi, 'job'));
    expansions.push(query.replace(/work/gi, 'career'));
  }
  if (lowerQuery.includes('like')) {
    expansions.push(query.replace(/like/gi, 'enjoy'));
    expansions.push(query.replace(/like/gi, 'prefer'));
  }
  if (lowerQuery.includes('think')) {
    expansions.push(query.replace(/think/gi, 'believe'));
    expansions.push(query.replace(/think/gi, 'feel'));
  }
  
  return expansions;
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

  } catch (error: any) {
    console.error('RAG query error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});