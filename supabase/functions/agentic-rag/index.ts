/**
 * Agentic RAG Engine (v1.0.0)
 * 
 * Multi-step iterative retrieval-augmented generation.
 * Instead of single-shot RAG, the agent:
 *   1. Decomposes the query into sub-questions
 *   2. Retrieves context for each sub-question iteratively
 *   3. Self-critiques retrieved context for gaps
 *   4. Refines queries and re-retrieves until satisfied
 *   5. Synthesizes final answer with full citation chain
 * 
 * Based on Stanford/Google 2026 Agentic RAG patterns.
 * 
 * @module agentic-rag
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getRAGContext, type RAGContext, type Citation } from '../_shared/rag-helper.ts';
import { callLovableAI } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface AgenticRAGConfig {
  maxIterations: number;
  maxSubQuestions: number;
  confidenceThreshold: number;
  sourceTypes: string[];
}

const DEFAULT_CONFIG: AgenticRAGConfig = {
  maxIterations: 3,
  maxSubQuestions: 5,
  confidenceThreshold: 0.7,
  sourceTypes: ['document', 'observation', 'analysis', 'communication'],
};

// ─── Step 1: Decompose query into sub-questions ─────────────────────────────
async function decomposeQuery(query: string, context?: string): Promise<string[]> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a query decomposition specialist. Break complex questions into atomic sub-questions that can each be answered independently. Return a JSON array of strings. Maximum 5 sub-questions. If the query is already simple, return it as a single-element array.`
      },
      {
        role: 'user',
        content: context
          ? `Original query: "${query}"\n\nPrevious context gathered:\n${context}\n\nDecompose this query into sub-questions. Focus on gaps in the existing context.`
          : `Decompose this query into sub-questions: "${query}"`
      }
    ],
    temperature: 0.3,
    maxTokens: 500,
  });

  const text = response.choices?.[0]?.message?.content || '[]';
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [query];
  } catch {
    return [query];
  }
}

// ─── Step 2: Self-critique retrieved context ────────────────────────────────
async function critiqueContext(
  query: string,
  context: string,
  citations: Citation[]
): Promise<{ sufficient: boolean; gaps: string[]; confidence: number }> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a critical evaluator of retrieved context. Assess whether the context is sufficient to answer the query. Identify specific gaps. Return JSON: { "sufficient": boolean, "gaps": ["specific gap 1", ...], "confidence": 0.0-1.0 }`
      },
      {
        role: 'user',
        content: `Query: "${query}"\n\nRetrieved context (${citations.length} sources):\n${context}\n\nIs this sufficient to fully answer the query?`
      }
    ],
    temperature: 0.2,
    maxTokens: 500,
  });

  const text = response.choices?.[0]?.message?.content || '{}';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return {
        sufficient: result.sufficient ?? false,
        gaps: result.gaps ?? [],
        confidence: result.confidence ?? 0.5,
      };
    }
  } catch { /* fall through */ }
  return { sufficient: false, gaps: ['Unable to evaluate'], confidence: 0.3 };
}

// ─── Step 3: Synthesize final answer ────────────────────────────────────────
async function synthesize(
  query: string,
  allContext: string,
  allCitations: Citation[],
  synthesisPrompt?: string
): Promise<{ answer: string; usedSources: number }> {
  const systemPrompt = synthesisPrompt || `You are an intelligence analyst synthesizing information from multiple sources. 
Provide a comprehensive, well-structured answer. 
Reference sources using [Source N] notation.
Be specific and cite evidence. Flag low-confidence claims.`;

  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: `Query: "${query}"\n\nAvailable context from ${allCitations.length} sources:\n${allContext}\n\nProvide a comprehensive answer.`
      }
    ],
    temperature: 0.4,
    maxTokens: 4000,
  });

  const answer = response.choices?.[0]?.message?.content || 'Unable to synthesize answer.';
  const sourceRefs = answer.match(/\[Source \d+\]/g) || [];
  return { answer, usedSources: new Set(sourceRefs).size };
}

// ─── Main Agentic RAG Loop ─────────────────────────────────────────────────
async function agenticRAG(
  userId: string,
  profileId: string | null,
  query: string,
  config: AgenticRAGConfig,
  synthesisPrompt?: string
): Promise<{
  answer: string;
  iterations: number;
  allCitations: Citation[];
  searchMethods: string[];
  confidence: number;
  subQuestions: string[];
  gapsFilled: string[];
}> {
  const allCitations: Citation[] = [];
  const allContext: string[] = [];
  const searchMethods: string[] = [];
  const allSubQuestions: string[] = [];
  const gapsFilled: string[] = [];
  let overallConfidence = 0;

  for (let iteration = 0; iteration < config.maxIterations; iteration++) {
    // Step 1: Decompose (on first iteration, decompose original; on subsequent, focus on gaps)
    const existingContext = allContext.join('\n---\n');
    const subQuestions = await decomposeQuery(query, iteration > 0 ? existingContext : undefined);
    allSubQuestions.push(...subQuestions);

    // Step 2: Retrieve context for each sub-question in parallel
    const retrievals = await Promise.allSettled(
      subQuestions.slice(0, config.maxSubQuestions).map(sq =>
        getRAGContext(userId, profileId, sq, {
          maxResults: 10,
          sourceTypes: config.sourceTypes as any,
          minRelevance: 0.2,
          useSemanticSearch: true,
        })
      )
    );

    for (const r of retrievals) {
      if (r.status === 'fulfilled') {
        const rag = r.value as RAGContext;
        if (rag.context) allContext.push(rag.context);
        // Deduplicate citations by ID
        for (const c of rag.citations) {
          if (!allCitations.some(existing => existing.id === c.id)) {
            allCitations.push(c);
          }
        }
        if (!searchMethods.includes(rag.searchMethod)) {
          searchMethods.push(rag.searchMethod);
        }
      }
    }

    // Step 3: Self-critique
    const critique = await critiqueContext(query, allContext.join('\n---\n'), allCitations);
    overallConfidence = critique.confidence;

    if (critique.sufficient || critique.confidence >= config.confidenceThreshold) {
      break; // We have enough context
    }

    // Record gaps for next iteration
    gapsFilled.push(...critique.gaps);
  }

  // Step 4: Final synthesis
  const contextStr = allCitations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 20)
    .map((c, i) => `[Source ${i + 1}] ${c.source}:\n${c.content}`)
    .join('\n---\n');

  const { answer, usedSources } = await synthesize(query, contextStr, allCitations, synthesisPrompt);

  return {
    answer,
    iterations: Math.min(config.maxIterations, allSubQuestions.length > 0 ? Math.ceil(allSubQuestions.length / config.maxSubQuestions) : 1),
    allCitations: allCitations.slice(0, 20),
    searchMethods,
    confidence: overallConfidence,
    subQuestions: [...new Set(allSubQuestions)],
    gapsFilled,
  };
}

// ─── Serve ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'agentic-rag', timestamp: Date.now() });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!);
  let userId: string;

  if (token === serviceKey) {
    const body = await req.json();
    userId = body.userId || body.user_id;
    if (!userId) return json({ error: 'Missing userId' }, 400);
    
    const profileId = body.profileId || body.profile_id || null;
    const query = body.query;
    if (!query) return json({ error: 'Missing query' }, 400);

    const config: AgenticRAGConfig = {
      maxIterations: body.maxIterations || DEFAULT_CONFIG.maxIterations,
      maxSubQuestions: body.maxSubQuestions || DEFAULT_CONFIG.maxSubQuestions,
      confidenceThreshold: body.confidenceThreshold || DEFAULT_CONFIG.confidenceThreshold,
      sourceTypes: body.sourceTypes || DEFAULT_CONFIG.sourceTypes,
    };

    const start = performance.now();
    const result = await agenticRAG(userId, profileId, query, config, body.synthesisPrompt);
    const durationMs = Math.round(performance.now() - start);

    return json({
      success: true,
      data: result,
      meta: { durationMs, model: 'agentic-rag-v1', iterations: result.iterations },
    });
  } else {
    // JWT auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);
    userId = user.id;

    const body = await req.json();
    const profileId = body.profileId || body.profile_id || null;
    const query = body.query;
    if (!query) return json({ error: 'Missing query' }, 400);

    const config: AgenticRAGConfig = { ...DEFAULT_CONFIG, ...body.config };

    const start = performance.now();
    const result = await agenticRAG(userId, profileId, query, config, body.synthesisPrompt);
    const durationMs = Math.round(performance.now() - start);

    return json({
      success: true,
      data: result,
      meta: { durationMs, model: 'agentic-rag-v1', iterations: result.iterations },
    });
  }
});
