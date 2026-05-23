/**
 * intel-agent — agentic OSINT investigator.
 *
 * Implements a ReAct-style loop: the model picks one tool at a time, the
 * runtime executes it, and the result is fed back as a new observation
 * until the model emits a final synthesized answer or a step budget is
 * exhausted. Each tool is a thin wrapper around an existing edge function
 * (enrichment, search, biometric match, network analysis, dossier).
 *
 * Persistence: every step is appended to `agent_run_steps`. The final
 * synthesis is stored on `agent_runs`. Callers poll or subscribe via
 * realtime to follow the run.
 *
 * Routes:
 *   POST /            { goal, profileId?, maxSteps?, model? }  -> { runId }
 *   GET  /:runId      -> { run, steps[] }
 *   GET  /health
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders, jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const AI_BASE_URL  = 'https://ai.gateway.lovable.dev/v1';
const DEFAULT_MODEL = 'google/gemini-2.5-pro';
const MAX_STEPS_DEFAULT = 10;
const MAX_STEPS_HARD    = 25;

// ─── Tool registry ──────────────────────────────────────────────────────────

type ToolHandler = (args: Record<string, unknown>, ctx: ToolCtx) => Promise<unknown>;

interface ToolCtx {
  userId: string;
  supabase: ReturnType<typeof createClient>;
  authHeader: string;
  supabaseUrl: string;
}

interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

async function invokeEdgeFunction(name: string, body: unknown, ctx: ToolCtx): Promise<unknown> {
  const res = await fetch(`${ctx.supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: ctx.authHeader,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

const TOOLS: ToolSpec[] = [
  {
    name: 'lookup_profile',
    description: 'Fetch a contact profile by id, including basic fields and contact methods.',
    parameters: {
      type: 'object',
      properties: { profileId: { type: 'string', description: 'Profile UUID' } },
      required: ['profileId'],
    },
    handler: async (args, ctx) => {
      const profileId = args.profileId as string;
      const [{ data: profile }, { data: methods }] = await Promise.all([
        ctx.supabase.from('profiles').select('*').eq('id', profileId).eq('user_id', ctx.userId).maybeSingle(),
        ctx.supabase.from('contact_methods').select('contact_type, value').eq('profile_id', profileId).limit(20),
      ]);
      return { profile, methods };
    },
  },
  {
    name: 'enrich_contact',
    description: 'Run the auto-enrichment waterfall (Proxycurl → Hunter → PDL → OSINT → AI) on a profile.',
    parameters: {
      type: 'object',
      properties: { profileId: { type: 'string' } },
      required: ['profileId'],
    },
    handler: (args, ctx) => invokeEdgeFunction('enrichment-router', { path: '/auto-enrich', profileId: args.profileId }, ctx),
  },
  {
    name: 'web_search',
    description: 'Search the open web via Tavily for fresh information about a target.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' }, maxResults: { type: 'number', default: 5 } },
      required: ['query'],
    },
    handler: (args, ctx) => invokeEdgeFunction('search-tavily', { query: args.query, maxResults: args.maxResults ?? 5 }, ctx),
  },
  {
    name: 'news_search',
    description: 'Search recent news for mentions of a person, organization, or event.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
    handler: (args, ctx) => invokeEdgeFunction('search-news', { query: args.query }, ctx),
  },
  {
    name: 'analyze_network',
    description: 'Analyze the network around a contact: centrality, communities, brokerage roles.',
    parameters: {
      type: 'object',
      properties: { profileId: { type: 'string' }, depth: { type: 'number', default: 2 } },
      required: ['profileId'],
    },
    handler: (args, ctx) => invokeEdgeFunction('analyze-network-intelligence', { profileId: args.profileId, depth: args.depth ?? 2 }, ctx),
  },
  {
    name: 'biometric_match',
    description: 'Match a face or voice sample against the biometric gallery.',
    parameters: {
      type: 'object',
      properties: {
        embeddingType: { type: 'string', enum: ['face', 'voice'] },
        embedding:     { type: 'array', items: { type: 'number' } },
      },
      required: ['embeddingType', 'embedding'],
    },
    handler: (args, ctx) => invokeEdgeFunction('biometric-router', { path: '/match', type: args.embeddingType, embedding: args.embedding }, ctx),
  },
  {
    name: 'generate_dossier',
    description: 'Synthesize a full intelligence dossier for a profile (use sparingly; expensive).',
    parameters: {
      type: 'object',
      properties: { profileId: { type: 'string' }, depth: { type: 'string', enum: ['standard', 'deep'] } },
      required: ['profileId'],
    },
    handler: (args, ctx) => invokeEdgeFunction('generate-intelligence-dossier', { profileId: args.profileId, depth: args.depth ?? 'standard' }, ctx),
  },
  {
    name: 'socmint_search',
    description: 'Search Reddit, GitHub, and Mastodon for mentions of a person, handle, or organization. Use for footprint expansion outside the major platforms.',
    parameters: {
      type: 'object',
      properties: {
        query:   { type: 'string' },
        sources: { type: 'array', items: { type: 'string', enum: ['reddit', 'github', 'mastodon'] } },
        limit:   { type: 'number' },
      },
      required: ['query'],
    },
    handler: (args, ctx) => invokeEdgeFunction('socmint-search', { query: args.query, sources: args.sources, limit: args.limit ?? 20 }, ctx),
  },
  {
    name: 'breach_check',
    description: 'Query HaveIBeenPwned / Dehashed for known breaches on an email or username.',
    parameters: {
      type: 'object',
      properties: { email: { type: 'string' }, username: { type: 'string' }, profileId: { type: 'string' } },
    },
    handler: (args, ctx) => invokeEdgeFunction('breach-monitor', { email: args.email, username: args.username, profileId: args.profileId }, ctx),
  },
  {
    name: 'image_geolocate',
    description: 'Infer the geographic location of an image from EXIF or visual cues.',
    parameters: {
      type: 'object',
      properties: { mediaId: { type: 'string' }, imageUrl: { type: 'string' } },
    },
    handler: (args, ctx) => invokeEdgeFunction('image-geolocate', { mediaId: args.mediaId, imageUrl: args.imageUrl }, ctx),
  },
  {
    name: 'preserve_evidence',
    description: 'Snapshot a URL as legal-grade evidence (HTML + screenshot + chain-of-custody hash). Use when the agent finds a relevant page that may disappear.',
    parameters: {
      type: 'object',
      properties: { url: { type: 'string' }, profileId: { type: 'string' }, note: { type: 'string' } },
      required: ['url'],
    },
    handler: (args, ctx) => invokeEdgeFunction('evidence-capture', { url: args.url, profileId: args.profileId, note: args.note }, ctx),
  },
  {
    name: 'extract_entities',
    description: 'Run multilingual NER on a chunk of text. Returns persons, organizations, locations, dates, etc.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
    handler: (args, ctx) => invokeEdgeFunction('multilingual-ner', { text: args.text }, ctx),
  },
  {
    name: 'blockchain_lookup',
    description: 'Resolve a blockchain identifier (ENS, ETH address, BTC address, or transaction hash).',
    parameters: {
      type: 'object',
      properties: { input: { type: 'string' }, profileId: { type: 'string' } },
      required: ['input'],
    },
    handler: (args, ctx) => invokeEdgeFunction('blockchain-lookup', { input: args.input, profileId: args.profileId }, ctx),
  },
];

function openAITools() {
  return TOOLS.map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

// ─── Persistence ────────────────────────────────────────────────────────────

interface AgentRun {
  id: string;
  user_id: string;
  goal: string;
  profile_id: string | null;
  status: 'running' | 'completed' | 'failed';
  final_answer: string | null;
  step_count: number;
  model: string;
  created_at: string;
  updated_at: string;
}

async function createRun(supabase: ToolCtx['supabase'], userId: string, goal: string, profileId: string | null, model: string): Promise<string> {
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({ user_id: userId, goal, profile_id: profileId, status: 'running', model, step_count: 0 })
    .select('id')
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function appendStep(supabase: ToolCtx['supabase'], runId: string, step: {
  index: number;
  thinking: string | null;
  tool: string | null;
  args: unknown;
  observation: unknown;
  is_final: boolean;
}) {
  await supabase.from('agent_run_steps').insert({
    run_id: runId,
    step_index: step.index,
    thinking: step.thinking,
    tool: step.tool,
    args: step.args,
    observation: step.observation,
    is_final: step.is_final,
  });
}

async function finalizeRun(supabase: ToolCtx['supabase'], runId: string, status: 'completed' | 'failed', finalAnswer: string | null, stepCount: number) {
  await supabase.from('agent_runs').update({
    status,
    final_answer: finalAnswer,
    step_count: stepCount,
    updated_at: new Date().toISOString(),
  }).eq('id', runId);
}

// ─── ReAct loop ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an OSINT investigator. You have a goal and a set of tools.
Plan, then call tools one at a time. After each tool result, decide the next step.
When you have enough evidence, stop calling tools and produce a final concise
answer that cites which tools produced which findings. Be skeptical: prefer
evidence over speculation. If a tool fails or returns empty, try a different
angle. Never call generate_dossier unless the user's goal explicitly asks for
a full dossier.`;

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{ id: string; type: 'function'; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

async function runAgentLoop(opts: {
  ctx: ToolCtx;
  runId: string;
  goal: string;
  profileId: string | null;
  model: string;
  maxSteps: number;
}): Promise<{ status: 'completed' | 'failed'; finalAnswer: string | null; stepCount: number }> {
  const { ctx, runId, goal, profileId, model, maxSteps } = opts;
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured');

  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: profileId
        ? `Goal: ${goal}\nTarget profileId: ${profileId}\nStart by calling lookup_profile, then plan.`
        : `Goal: ${goal}\nNo specific profile — search the web first.` },
  ];

  const toolByName = new Map(TOOLS.map(t => [t.name, t] as const));

  for (let step = 0; step < maxSteps; step++) {
    const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages,
        tools: openAITools(),
        tool_choice: 'auto',
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[intel-agent] model error', res.status, errText);
      await appendStep(ctx.supabase, runId, { index: step, thinking: null, tool: null, args: null, observation: { error: errText, status: res.status }, is_final: true });
      return { status: 'failed', finalAnswer: null, stepCount: step + 1 };
    }

    const data = await res.json() as {
      choices: Array<{ message: ChatMessage; finish_reason: string }>;
    };
    const msg = data.choices?.[0]?.message;
    if (!msg) {
      await appendStep(ctx.supabase, runId, { index: step, thinking: null, tool: null, args: null, observation: { error: 'no message in completion' }, is_final: true });
      return { status: 'failed', finalAnswer: null, stepCount: step + 1 };
    }
    messages.push(msg);

    // If the model didn't call a tool, treat the assistant content as final.
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const finalAnswer = msg.content ?? '';
      await appendStep(ctx.supabase, runId, { index: step, thinking: finalAnswer, tool: null, args: null, observation: null, is_final: true });
      return { status: 'completed', finalAnswer, stepCount: step + 1 };
    }

    // Execute the requested tool(s). We honor only the first to keep the loop linear.
    const call = msg.tool_calls[0];
    const tool = toolByName.get(call.function.name);
    let observation: unknown;
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(call.function.arguments || '{}');
    } catch (err) {
      observation = { error: 'invalid_arguments', detail: String(err) };
    }
    if (!tool) {
      observation = { error: 'unknown_tool', name: call.function.name };
    } else if (!observation) {
      try {
        observation = await tool.handler(parsedArgs, ctx);
      } catch (err) {
        observation = { error: 'tool_threw', detail: err instanceof Error ? err.message : String(err) };
      }
    }

    await appendStep(ctx.supabase, runId, {
      index: step,
      thinking: msg.content ?? null,
      tool: call.function.name,
      args: parsedArgs,
      observation,
      is_final: false,
    });

    messages.push({
      role: 'tool',
      tool_call_id: call.id,
      name: call.function.name,
      content: JSON.stringify(observation).slice(0, 24_000), // hard cap to keep context manageable
    });
  }

  // Step budget exhausted; ask the model for a final summary without tools.
  const wrapRes = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [...messages, { role: 'user', content: 'Step budget exhausted. Produce your best final answer with the evidence collected so far.' }],
      temperature: 0.3,
    }),
  });
  let finalAnswer: string | null = null;
  if (wrapRes.ok) {
    const data = await wrapRes.json();
    finalAnswer = data.choices?.[0]?.message?.content ?? null;
  }
  await appendStep(ctx.supabase, runId, { index: maxSteps, thinking: finalAnswer, tool: null, args: null, observation: { reason: 'step_budget_exhausted' }, is_final: true });
  return { status: 'completed', finalAnswer, stepCount: maxSteps + 1 };
}

// ─── HTTP entrypoint ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('intel-agent');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  try {
    if (req.method === 'GET') {
      // GET /:runId
      const runId = url.pathname.split('/').filter(Boolean).pop();
      if (!runId) return errorResponse('runId required', 400);
      const auth = await validateAuth(req, {});
      if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
      const { data: run, error } = await supabase.from('agent_runs').select('*').eq('id', runId).eq('user_id', auth.userId).maybeSingle();
      if (error || !run) return errorResponse('run not found', 404);
      const { data: steps } = await supabase.from('agent_run_steps').select('*').eq('run_id', runId).order('step_index');
      return jsonResponse({ run, steps: steps ?? [] });
    }

    if (req.method !== 'POST') return errorResponse('method not allowed', 405);

    const body = await req.json().catch(() => ({})) as { goal?: string; profileId?: string; maxSteps?: number; model?: string };
    const auth = await validateAuth(req, body as Record<string, unknown>);
    if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
    if (!body.goal || typeof body.goal !== 'string') return errorResponse('goal is required', 400);

    const authHeader = req.headers.get('Authorization') || '';
    const model = body.model || DEFAULT_MODEL;
    const maxSteps = Math.min(Math.max(body.maxSteps ?? MAX_STEPS_DEFAULT, 1), MAX_STEPS_HARD);

    const runId = await createRun(supabase, auth.userId, body.goal, body.profileId ?? null, model);
    const ctx: ToolCtx = { userId: auth.userId, supabase, authHeader, supabaseUrl };

    // Fire and forget the loop; client polls /:runId.
    (async () => {
      try {
        const result = await runAgentLoop({ ctx, runId, goal: body.goal!, profileId: body.profileId ?? null, model, maxSteps });
        await finalizeRun(supabase, runId, result.status, result.finalAnswer, result.stepCount);
      } catch (err) {
        console.error('[intel-agent] loop crashed', err);
        await finalizeRun(supabase, runId, 'failed', err instanceof Error ? err.message : 'unknown error', 0);
      }
    })();

    return jsonResponse({ runId, status: 'running', model, maxSteps });
  } catch (err) {
    console.error('[intel-agent] unhandled', err);
    return errorResponse(err instanceof Error ? err.message : 'unknown error', 500);
  }
});
