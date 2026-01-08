import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RAGQueryRequest {
  query: string;
  profileId?: string;
  sourceTypes?: string[];
  dateFrom?: string;
  dateTo?: string;
  maxResults?: number;
  searchMode?: "semantic" | "keyword" | "hybrid";
  includeAnswer?: boolean;
  rerank?: boolean;
}

interface SearchResult {
  id: string;
  profileId: string | null;
  sourceType: string;
  sourceId: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  createdAt: string;
  searchType: "semantic" | "keyword";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      query,
      profileId,
      sourceTypes,
      dateFrom,
      dateTo,
      maxResults = 10,
      searchMode = "hybrid",
      includeAnswer = true,
      rerank = true,
    }: RAGQueryRequest = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`RAG Query: "${query}" | Mode: ${searchMode} | User: ${user.id}`);

    // Step 1: Query Expansion using AI
    let expandedQueries = [query];
    try {
      const expansionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: "Generate 2 alternative phrasings of this search query to improve recall. Return as JSON array of strings.",
            },
            { role: "user", content: query },
          ],
          max_tokens: 150,
        }),
      });

      if (expansionResponse.ok) {
        const expansionData = await expansionResponse.json();
        const content = expansionData.choices?.[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
          if (Array.isArray(parsed)) {
            expandedQueries = [query, ...parsed.slice(0, 2)];
          }
        } catch {
          // Use original query only
        }
      }
    } catch (e) {
      console.error("Query expansion failed:", e);
    }

    // Step 2: Generate query embedding
    const queryEmbedding = generateQueryEmbedding(query);

    // Step 3: Perform searches based on mode
    const semanticResults: SearchResult[] = [];
    const keywordResults: SearchResult[] = [];

    // Semantic search
    if (searchMode === "semantic" || searchMode === "hybrid") {
      const { data: semanticData, error: semanticError } = await supabase.rpc(
        "match_documents_v2",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.3,
          match_count: maxResults * 2,
          p_user_id: user.id,
          p_profile_id: profileId || null,
          p_source_types: sourceTypes || null,
          p_date_from: dateFrom || null,
          p_date_to: dateTo || null,
        }
      );

      if (!semanticError && semanticData) {
        semanticResults.push(
          ...semanticData.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            profileId: r.profile_id as string | null,
            sourceType: r.source_type as string,
            sourceId: r.source_id as string,
            content: r.content as string,
            metadata: r.metadata as Record<string, unknown>,
            score: r.similarity as number,
            createdAt: r.created_at as string,
            searchType: "semantic" as const,
          }))
        );
      }
    }

    // Keyword search
    if (searchMode === "keyword" || searchMode === "hybrid") {
      for (const q of expandedQueries) {
        const { data: keywordData, error: keywordError } = await supabase.rpc(
          "keyword_search_documents",
          {
            search_query: q,
            p_user_id: user.id,
            p_profile_id: profileId || null,
            p_source_types: sourceTypes || null,
            match_count: maxResults,
          }
        );

        if (!keywordError && keywordData) {
          keywordResults.push(
            ...keywordData.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              profileId: r.profile_id as string | null,
              sourceType: r.source_type as string,
              sourceId: r.source_id as string,
              content: r.content as string,
              metadata: r.metadata as Record<string, unknown>,
              score: r.rank as number,
              createdAt: r.created_at as string,
              searchType: "keyword" as const,
            }))
          );
        }
      }
    }

    // Step 4: Reciprocal Rank Fusion for hybrid search
    let finalResults: SearchResult[] = [];

    if (searchMode === "hybrid" && semanticResults.length > 0 && keywordResults.length > 0) {
      const k = 60; // RRF constant
      const scores: Map<string, { result: SearchResult; score: number }> = new Map();

      // Score semantic results
      semanticResults.forEach((result, rank) => {
        const rrfScore = 1 / (k + rank + 1);
        const existing = scores.get(result.id);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scores.set(result.id, { result, score: rrfScore });
        }
      });

      // Score keyword results
      keywordResults.forEach((result, rank) => {
        const rrfScore = 1 / (k + rank + 1);
        const existing = scores.get(result.id);
        if (existing) {
          existing.score += rrfScore;
        } else {
          scores.set(result.id, { result, score: rrfScore });
        }
      });

      // Sort by combined score
      finalResults = Array.from(scores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(({ result, score }) => ({ ...result, score }));
    } else if (searchMode === "semantic") {
      finalResults = semanticResults.slice(0, maxResults);
    } else {
      finalResults = keywordResults.slice(0, maxResults);
    }

    // Step 5: Rerank using AI if enabled and we have results
    if (rerank && finalResults.length > 3) {
      try {
        const rerankResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: `Given a query and search results, return the indices (0-based) of the most relevant results in order of relevance as a JSON array of numbers. Query: "${query}"`,
              },
              {
                role: "user",
                content: finalResults.map((r, i) => `[${i}] ${r.content.slice(0, 300)}`).join("\n\n"),
              },
            ],
            max_tokens: 100,
          }),
        });

        if (rerankResponse.ok) {
          const rerankData = await rerankResponse.json();
          const content = rerankData.choices?.[0]?.message?.content || "";
          try {
            const indices = JSON.parse(content.replace(/```json\n?|\n?```/g, ""));
            if (Array.isArray(indices)) {
              const reranked = indices
                .filter((i: number) => typeof i === "number" && i >= 0 && i < finalResults.length)
                .map((i: number) => finalResults[i]);
              
              // Add any results not in reranking
              const rerankedIds = new Set(reranked.map(r => r.id));
              finalResults.forEach(r => {
                if (!rerankedIds.has(r.id)) {
                  reranked.push(r);
                }
              });
              
              finalResults = reranked.slice(0, maxResults);
            }
          } catch {
            // Keep original order
          }
        }
      } catch (e) {
        console.error("Reranking failed:", e);
      }
    }

    // Step 6: Generate AI answer if requested
    let answer: string | null = null;
    let citations: { sourceId: string; content: string }[] = [];

    if (includeAnswer && finalResults.length > 0) {
      const context = finalResults
        .slice(0, 5)
        .map((r, i) => `[Source ${i + 1}]: ${r.content.slice(0, 1000)}`)
        .join("\n\n");

      try {
        const answerResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a helpful assistant answering questions based on the provided context. 
                Always cite your sources using [Source N] notation.
                If the context doesn't contain relevant information, say so clearly.
                Be concise and accurate.`,
              },
              {
                role: "user",
                content: `Context:\n${context}\n\nQuestion: ${query}`,
              },
            ],
            max_tokens: 500,
          }),
        });

        if (answerResponse.ok) {
          const answerData = await answerResponse.json();
          answer = answerData.choices?.[0]?.message?.content || null;

          // Extract citations
          if (answer) {
            const citationMatches = answer.match(/\[Source (\d+)\]/g) || [];
            const citedIndices = [...new Set(citationMatches.map(m => parseInt(m.match(/\d+/)?.[0] || "0") - 1))];
            citations = citedIndices
              .filter(i => i >= 0 && i < finalResults.length)
              .map(i => ({
                sourceId: finalResults[i].sourceId,
                content: finalResults[i].content.slice(0, 200),
              }));
          }
        }
      } catch (e) {
        console.error("Answer generation failed:", e);
      }
    }

    // Step 7: Log query for analytics
    const responseTime = Date.now() - startTime;
    await supabase.from("rag_query_logs").insert({
      user_id: user.id,
      query_text: query,
      result_count: finalResults.length,
      top_result_score: finalResults[0]?.score || 0,
      avg_result_score: finalResults.length > 0 
        ? finalResults.reduce((sum, r) => sum + r.score, 0) / finalResults.length 
        : 0,
      search_mode: searchMode,
      filters_applied: { profileId, sourceTypes, dateFrom, dateTo },
      response_time_ms: responseTime,
    });

    // Update query suggestions
    await supabase.from("query_suggestions").upsert(
      {
        user_id: user.id,
        suggestion_text: query,
        suggestion_type: "history",
        use_count: 1,
      },
      { onConflict: "user_id,suggestion_text", ignoreDuplicates: false }
    );

    return new Response(
      JSON.stringify({
        success: true,
        query,
        expandedQueries,
        results: finalResults,
        answer,
        citations,
        metadata: {
          totalResults: finalResults.length,
          searchMode,
          responseTimeMs: responseTime,
          semanticCount: semanticResults.length,
          keywordCount: keywordResults.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("RAG query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Generate a query embedding (simplified version)
function generateQueryEmbedding(query: string): number[] {
  const embedding = new Array(1536).fill(0);
  const words = query.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const charCode = word.charCodeAt(j);
      const idx = (i * 100 + j * 10 + charCode) % 1536;
      embedding[idx] += 0.1;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }
  
  return embedding;
}
