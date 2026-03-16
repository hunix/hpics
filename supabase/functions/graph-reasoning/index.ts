/**
 * Graph-of-Thought Reasoning Engine (v1.0.0)
 * 
 * Structures AI reasoning as a directed graph rather than linear chain-of-thought.
 * Enables parallel hypothesis exploration and convergence for intelligence analysis.
 * 
 * Based on MIT 2026 Graph-of-Thought patterns.
 * 
 * Modes:
 *   hypothesis-exploration  — Generate & evaluate competing hypotheses
 *   dossier-reasoning      — Multi-perspective dossier synthesis
 *   threat-assessment      — Parallel threat vector analysis
 *   relationship-mapping   — Multi-path relationship inference
 * 
 * @module graph-reasoning
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

// ─── Types ──────────────────────────────────────────────────────────────────
interface ThoughtNode {
  id: string;
  type: 'hypothesis' | 'evidence' | 'synthesis' | 'critique' | 'conclusion';
  content: string;
  confidence: number;
  parentIds: string[];
  childIds: string[];
  metadata?: Record<string, unknown>;
}

interface ThoughtGraph {
  nodes: ThoughtNode[];
  rootIds: string[];
  conclusionIds: string[];
  totalTokens: number;
}

// ─── Thought Node Generation ────────────────────────────────────────────────
let nodeCounter = 0;
function makeNodeId(): string {
  return `node_${++nodeCounter}_${Date.now().toString(36)}`;
}

async function generateHypotheses(
  query: string,
  context: string,
  count: number = 3
): Promise<ThoughtNode[]> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a hypothesis generator for intelligence analysis. Generate ${count} distinct, competing hypotheses. Each should be plausible but approach the question from different angles. Return JSON array: [{ "hypothesis": "...", "confidence": 0.0-1.0, "reasoning": "..." }]`
      },
      {
        role: 'user',
        content: `Query: "${query}"\n\nAvailable context:\n${context}`
      }
    ],
    temperature: 0.7,
    maxTokens: 2000,
  });

  const text = response.choices?.[0]?.message?.content || '[]';
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const hypotheses = match ? JSON.parse(match[0]) : [];
    return hypotheses.map((h: any) => ({
      id: makeNodeId(),
      type: 'hypothesis' as const,
      content: `${h.hypothesis}\n\nReasoning: ${h.reasoning}`,
      confidence: h.confidence || 0.5,
      parentIds: [],
      childIds: [],
    }));
  } catch {
    return [{
      id: makeNodeId(),
      type: 'hypothesis' as const,
      content: query,
      confidence: 0.5,
      parentIds: [],
      childIds: [],
    }];
  }
}

async function evaluateHypothesis(
  hypothesis: ThoughtNode,
  context: string
): Promise<ThoughtNode> {
  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are a critical evaluator. Assess this hypothesis against available evidence. Identify supporting evidence, contradictions, and gaps. Return JSON: { "evaluation": "...", "supportScore": 0.0-1.0, "contradictions": ["..."], "supportingEvidence": ["..."], "confidence": 0.0-1.0 }`
      },
      {
        role: 'user',
        content: `Hypothesis: ${hypothesis.content}\n\nEvidence/Context:\n${context}`
      }
    ],
    temperature: 0.3,
    maxTokens: 1500,
  });

  const text = response.choices?.[0]?.message?.content || '{}';
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const eval_ = match ? JSON.parse(match[0]) : {};
    const evidenceNode: ThoughtNode = {
      id: makeNodeId(),
      type: 'evidence',
      content: eval_.evaluation || 'Evaluation failed',
      confidence: eval_.confidence || 0.5,
      parentIds: [hypothesis.id],
      childIds: [],
      metadata: {
        supportScore: eval_.supportScore,
        contradictions: eval_.contradictions,
        supportingEvidence: eval_.supportingEvidence,
      },
    };
    hypothesis.childIds.push(evidenceNode.id);
    return evidenceNode;
  } catch {
    return {
      id: makeNodeId(),
      type: 'evidence',
      content: 'Evaluation could not be parsed',
      confidence: 0.3,
      parentIds: [hypothesis.id],
      childIds: [],
    };
  }
}

async function synthesizeConclusion(
  hypotheses: ThoughtNode[],
  evidence: ThoughtNode[],
  query: string
): Promise<ThoughtNode> {
  const hypothesesText = hypotheses.map((h, i) =>
    `Hypothesis ${i + 1} (confidence: ${h.confidence}): ${h.content}`
  ).join('\n\n');

  const evidenceText = evidence.map((e, i) =>
    `Evidence for H${i + 1} (confidence: ${e.confidence}): ${e.content}`
  ).join('\n\n');

  const response = await callLovableAI({
    model: 'google/gemini-2.5-flash',
    messages: [
      {
        role: 'system',
        content: `You are an intelligence synthesis specialist. Weigh all hypotheses and evidence to produce a nuanced conclusion. Acknowledge uncertainty. Identify the most likely explanation and confidence level. Be thorough and cite which hypotheses are supported or refuted.`
      },
      {
        role: 'user',
        content: `Original query: "${query}"\n\n${hypothesesText}\n\n${evidenceText}\n\nSynthesize a final conclusion.`
      }
    ],
    temperature: 0.3,
    maxTokens: 3000,
  });

  const conclusion = response.choices?.[0]?.message?.content || 'Unable to synthesize conclusion.';
  const avgConfidence = evidence.length > 0
    ? evidence.reduce((sum, e) => sum + e.confidence, 0) / evidence.length
    : 0.5;

  return {
    id: makeNodeId(),
    type: 'conclusion',
    content: conclusion,
    confidence: avgConfidence,
    parentIds: evidence.map(e => e.id),
    childIds: [],
  };
}

// ─── Main Graph-of-Thought Execution ────────────────────────────────────────
async function executeGraphReasoning(
  query: string,
  context: string,
  mode: string,
  hypothesisCount: number = 3
): Promise<ThoughtGraph> {
  nodeCounter = 0;
  const allNodes: ThoughtNode[] = [];

  // Phase 1: Generate hypotheses
  const hypotheses = await generateHypotheses(query, context, hypothesisCount);
  allNodes.push(...hypotheses);

  // Phase 2: Evaluate each hypothesis in parallel
  const evaluations = await Promise.allSettled(
    hypotheses.map(h => evaluateHypothesis(h, context))
  );

  const evidenceNodes: ThoughtNode[] = [];
  for (const e of evaluations) {
    if (e.status === 'fulfilled') {
      evidenceNodes.push(e.value);
      allNodes.push(e.value);
    }
  }

  // Phase 3: Cross-critique (each hypothesis challenges others)
  if (mode === 'hypothesis-exploration' || mode === 'threat-assessment') {
    const critiques = await Promise.allSettled(
      hypotheses.map(async (h, i) => {
        const others = hypotheses.filter((_, j) => j !== i);
        const critiqueResponse = await callLovableAI({
          model: 'google/gemini-2.5-flash-lite',
          messages: [
            {
              role: 'system',
              content: 'You are a devil\'s advocate. Critique this hypothesis by arguing for alternatives. Be concise. Return JSON: { "critique": "...", "alternativeStrength": 0.0-1.0 }'
            },
            {
              role: 'user',
              content: `Target: ${h.content}\n\nAlternatives:\n${others.map(o => o.content).join('\n')}`
            }
          ],
          temperature: 0.5,
          maxTokens: 800,
        });
        const text = critiqueResponse.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : { critique: text, alternativeStrength: 0.5 };

        const critiqueNode: ThoughtNode = {
          id: makeNodeId(),
          type: 'critique',
          content: parsed.critique,
          confidence: 1 - (parsed.alternativeStrength || 0.5),
          parentIds: [h.id],
          childIds: [],
        };
        h.childIds.push(critiqueNode.id);
        return critiqueNode;
      })
    );

    for (const c of critiques) {
      if (c.status === 'fulfilled') allNodes.push(c.value);
    }
  }

  // Phase 4: Synthesize conclusion
  const conclusion = await synthesizeConclusion(hypotheses, evidenceNodes, query);
  for (const e of evidenceNodes) e.childIds.push(conclusion.id);
  allNodes.push(conclusion);

  return {
    nodes: allNodes,
    rootIds: hypotheses.map(h => h.id),
    conclusionIds: [conclusion.id],
    totalTokens: 0, // Would need to track from AI responses
  };
}

// ─── Serve ──────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'graph-reasoning', timestamp: Date.now(), modes: ['hypothesis-exploration', 'dossier-reasoning', 'threat-assessment', 'relationship-mapping'] });
  }

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!token) return json({ error: 'Unauthorized' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!);
  let userId: string;
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (token === serviceKey) {
    userId = (body.userId || body.user_id) as string;
    if (!userId) return json({ error: 'Missing userId' }, 400);
  } else {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return json({ error: 'Unauthorized' }, 401);
    userId = user.id;
  }

  const query = body.query as string;
  const profileId = (body.profileId || body.profile_id) as string | null;
  const mode = (body.mode as string) || 'hypothesis-exploration';
  const hypothesisCount = (body.hypothesisCount as number) || 3;

  if (!query) return json({ error: 'Missing query' }, 400);

  // Gather context from profile if available
  let context = (body.context as string) || '';
  if (profileId && !context) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, organization, job_title, notes, city, country, tags')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (profile) {
      context = `Profile: ${profile.first_name} ${profile.last_name}, ${profile.job_title || ''} at ${profile.organization || ''}. Location: ${profile.city || ''}, ${profile.country || ''}. Notes: ${profile.notes || 'none'}. Tags: ${(profile.tags || []).join(', ')}`;
    }

    // Also fetch recent analyses
    const { data: analyses } = await supabase
      .from('ai_analyses')
      .select('analysis_type, result')
      .eq('profile_id', profileId)
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(5);

    if (analyses && analyses.length > 0) {
      context += '\n\nRecent analyses:\n' + analyses.map(a =>
        `[${a.analysis_type}]: ${JSON.stringify(a.result).substring(0, 500)}`
      ).join('\n');
    }
  }

  const start = performance.now();
  const graph = await executeGraphReasoning(query, context, mode, hypothesisCount);
  const durationMs = Math.round(performance.now() - start);

  // Extract conclusion text
  const conclusionNode = graph.nodes.find(n => n.type === 'conclusion');

  return json({
    success: true,
    data: {
      conclusion: conclusionNode?.content || 'No conclusion reached',
      confidence: conclusionNode?.confidence || 0,
      graph: {
        nodeCount: graph.nodes.length,
        hypotheses: graph.nodes.filter(n => n.type === 'hypothesis').length,
        evidenceNodes: graph.nodes.filter(n => n.type === 'evidence').length,
        critiques: graph.nodes.filter(n => n.type === 'critique').length,
        nodes: graph.nodes,
        rootIds: graph.rootIds,
        conclusionIds: graph.conclusionIds,
      },
      mode,
    },
    meta: { durationMs, model: 'graph-reasoning-v1' },
  });
});
