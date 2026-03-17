/**
 * Agent Workflow Orchestrator (v1.0.0)
 * 
 * Executes multi-step intelligence workflows autonomously.
 * Accepts high-level commands and chains tool calls via DAG ordering.
 * 
 * Commands:
 *   full-intelligence   — enrich → analyze → fuse → dossier
 *   generate-dossier    — enrich → analyze → dossier
 *   track-contact       — enrich → behavioral baseline → anomaly detection
 *   counter-intel-scan  — OPSEC → threat assessment → red team → verification
 *   quick-profile       — enrich → profile analysis → executive summary
 * 
 * @module agent-workflow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

// ─── Workflow Definitions (DAGs) ────────────────────────────────────────────
interface WorkflowStep {
  step: string;
  tool: string;
  dependsOn: string[];
  extraParams?: Record<string, unknown>;
  optional?: boolean;
}

const WORKFLOWS: Record<string, WorkflowStep[]> = {
  'full-intelligence': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'behavioral', tool: 'analyze-behavioral', dependsOn: ['enrich'] },
    { step: 'psychological', tool: 'deep-psychological-analysis', dependsOn: ['enrich'] },
    { step: 'communication', tool: 'analyze-communication-patterns', dependsOn: ['enrich'] },
    { step: 'network', tool: 'analyze-network-graph', dependsOn: ['enrich'], optional: true },
    { step: 'fusion', tool: 'unified-data-fusion', dependsOn: ['behavioral', 'psychological'] },
    { step: 'dossier', tool: 'generate-intelligence-dossier', dependsOn: ['fusion', 'communication'] },
    { step: 'verification', tool: 'warfare-verification-chamber', dependsOn: ['dossier'], optional: true },
  ],
  'generate-dossier': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'behavioral', tool: 'analyze-behavioral', dependsOn: ['enrich'] },
    { step: 'psychological', tool: 'deep-psychological-analysis', dependsOn: ['enrich'] },
    { step: 'dossier', tool: 'generate-intelligence-dossier', dependsOn: ['behavioral', 'psychological'] },
  ],
  'track-contact': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'baseline', tool: 'behavioral-baseline-monitor', dependsOn: ['enrich'] },
    { step: 'pattern', tool: 'pattern-of-life-engine', dependsOn: ['enrich'] },
    { step: 'anomaly', tool: 'detect-anomalies', dependsOn: ['baseline', 'pattern'] },
    { step: 'alerts', tool: 'generate-proactive-insights', dependsOn: ['anomaly'] },
  ],
  'counter-intel-scan': [
    { step: 'opsec', tool: 'opsec-vulnerability-analyzer', dependsOn: [] },
    { step: 'threat', tool: 'threat-landscape-analyzer', dependsOn: [] },
    { step: 'deception', tool: 'enhanced-deception-detector', dependsOn: [] },
    { step: 'redteam', tool: 'automated-red-team-engine', dependsOn: ['opsec', 'threat'] },
    { step: 'verification', tool: 'warfare-verification-chamber', dependsOn: ['redteam', 'deception'] },
  ],
  'quick-profile': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'profile', tool: 'analyze-profile', dependsOn: ['enrich'] },
    { step: 'summary', tool: 'generate-executive-summary', dependsOn: ['profile'] },
  ],

  // ─── Tier 2: Advanced 2026 Research Workflows ──────────────────────────────
  'verified-dossier': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'behavioral', tool: 'analyze-behavioral', dependsOn: ['enrich'] },
    { step: 'psychological', tool: 'deep-psychological-analysis', dependsOn: ['enrich'] },
    { step: 'graph-reasoning', tool: 'graph-reasoning', dependsOn: ['behavioral', 'psychological'], extraParams: { mode: 'dossier-reasoning' } },
    { step: 'dossier', tool: 'generate-intelligence-dossier', dependsOn: ['graph-reasoning'] },
    { step: 'verification', tool: 'intelligence-verification', dependsOn: ['dossier'] },
  ],
  'deep-research': [
    { step: 'enrich', tool: 'auto-enrich-contact', dependsOn: [] },
    { step: 'agentic-rag', tool: 'agentic-rag', dependsOn: ['enrich'], extraParams: { maxIterations: 3, sourceTypes: ['document', 'observation', 'analysis', 'communication'] } },
    { step: 'graph-reasoning', tool: 'graph-reasoning', dependsOn: ['agentic-rag'], extraParams: { mode: 'hypothesis-exploration', hypothesisCount: 4 } },
    { step: 'synthesis', tool: 'generate-executive-summary', dependsOn: ['graph-reasoning'] },
    { step: 'verification', tool: 'intelligence-verification', dependsOn: ['synthesis'] },
  ],
  'adversarial-assessment': [
    { step: 'opsec', tool: 'opsec-vulnerability-analyzer', dependsOn: [] },
    { step: 'threat', tool: 'threat-landscape-analyzer', dependsOn: [] },
    { step: 'deception', tool: 'enhanced-deception-detector', dependsOn: [] },
    { step: 'graph-threats', tool: 'graph-reasoning', dependsOn: ['opsec', 'threat'], extraParams: { mode: 'threat-assessment', hypothesisCount: 3 } },
    { step: 'redteam', tool: 'automated-red-team-engine', dependsOn: ['graph-threats', 'deception'] },
    { step: 'verification', tool: 'intelligence-verification', dependsOn: ['redteam'] },
  ],

  // ─── Tier 3: Autonomous Vulnerability Defense ──────────────────────────
  'vulnerability-defense': [
    { step: 'vuln-scan', tool: 'vulnerability-intelligence', dependsOn: [], extraParams: { minSeverity: 'HIGH', forceRefresh: true } },
    { step: 'device-scan', tool: 'device-security-scanner', dependsOn: [], optional: true },
    { step: 'threat-assessment', tool: 'assess-threat', dependsOn: ['vuln-scan'] },
    { step: 'red-team', tool: 'red-team-executor', dependsOn: ['vuln-scan', 'threat-assessment'] },
    { step: 'opsec-check', tool: 'opsec-vulnerability-analyzer', dependsOn: ['vuln-scan'], optional: true },
    { step: 'verification', tool: 'intelligence-verification', dependsOn: ['red-team'] },
  ],
};

// ─── Contact Resolution ─────────────────────────────────────────────────────
async function resolveContact(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  query: string
): Promise<{ profileId: string; name: string } | null> {
  // Try exact email match via contact_methods
  const { data: emailMatch } = await supabase
    .from('contact_methods')
    .select('profile_id, profiles!inner(id, first_name, last_name, user_id)')
    .eq('contact_type', 'email')
    .ilike('value', query)
    .limit(1);

  if (emailMatch && emailMatch.length > 0) {
    const p = (emailMatch[0] as any).profiles;
    if (p.user_id === userId) {
      return { profileId: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() };
    }
  }

  // Try name search
  const parts = query.trim().split(/\s+/);
  let nameQuery = supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('user_id', userId);

  if (parts.length >= 2) {
    nameQuery = nameQuery
      .ilike('first_name', `%${parts[0]}%`)
      .ilike('last_name', `%${parts.slice(1).join(' ')}%`);
  } else {
    nameQuery = nameQuery.or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[0]}%`);
  }

  const { data: nameMatch } = await nameQuery.limit(1);
  if (nameMatch && nameMatch.length > 0) {
    const p = nameMatch[0];
    return { profileId: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() };
  }

  // Try phone match
  const { data: phoneMatch } = await supabase
    .from('contact_methods')
    .select('profile_id, profiles!inner(id, first_name, last_name, user_id)')
    .eq('contact_type', 'phone')
    .ilike('value', `%${query}%`)
    .limit(1);

  if (phoneMatch && phoneMatch.length > 0) {
    const p = (phoneMatch[0] as any).profiles;
    if (p.user_id === userId) {
      return { profileId: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() };
    }
  }

  return null;
}

// ─── DAG Executor ───────────────────────────────────────────────────────────
async function executeWorkflow(
  steps: WorkflowStep[],
  params: Record<string, unknown>,
  supabaseUrl: string,
  serviceKey: string,
  runId: string,
  supabase: ReturnType<typeof createClient>
): Promise<{ results: Record<string, unknown>; stepStatuses: Record<string, string> }> {
  const results: Record<string, unknown> = {};
  const stepStatuses: Record<string, string> = {};
  const completed = new Set<string>();
  const MAX_ITERATIONS = 50;
  let iterations = 0;

  while (completed.size < steps.length && iterations < MAX_ITERATIONS) {
    iterations++;
    const ready = steps.filter(
      s => !completed.has(s.step) && s.dependsOn.every(d => completed.has(d))
    );

    if (ready.length === 0) {
      // Check if remaining are all blocked by failed optional deps
      const remaining = steps.filter(s => !completed.has(s.step));
      const allBlocked = remaining.every(s =>
        s.dependsOn.some(d => stepStatuses[d] === 'failed' || stepStatuses[d] === 'skipped')
      );
      if (allBlocked) break;
      break; // Deadlock
    }

    // Execute ready steps in parallel
    const executions = ready.map(async (step) => {
      // Check if dependencies failed
      const failedDeps = step.dependsOn.filter(d => stepStatuses[d] === 'failed');
      if (failedDeps.length > 0 && !step.optional) {
        stepStatuses[step.step] = 'skipped';
        results[step.step] = { skipped: true, reason: `Dependencies failed: ${failedDeps.join(', ')}` };
        completed.add(step.step);
        return;
      }

      try {
        const routerBody = {
          ...params,
          _previousResults: results,
          _workflowStep: step.step,
          ...step.extraParams,
        };

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90_000);

        const resp = await fetch(`${supabaseUrl}/functions/v1/hoc-gateway`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ tool: step.tool, params: routerBody }),
          signal: controller.signal,
        });

        clearTimeout(timer);
        const data = await resp.json();

        if (resp.ok && data.success !== false) {
          stepStatuses[step.step] = 'completed';
          results[step.step] = data.data || data;
        } else {
          stepStatuses[step.step] = step.optional ? 'skipped' : 'failed';
          results[step.step] = { error: data.error || `HTTP ${resp.status}` };
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        stepStatuses[step.step] = step.optional ? 'skipped' : 'failed';
        results[step.step] = { error: msg };
      }

      completed.add(step.step);
    });

    await Promise.allSettled(executions);

    // Update run progress
    supabase.from('agent_workflow_runs').update({
      steps: Object.entries(stepStatuses).map(([s, status]) => ({ step: s, status })),
      results,
    }).eq('id', runId).then(() => {});
  }

  return { results, stepStatuses };
}

// ─── Main Handler ───────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'agent-workflow', timestamp: Date.now(), commands: Object.keys(WORKFLOWS) });
  }

  // Auth: service role key or HOC API key
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!token || (token !== serviceKey && token !== Deno.env.get('HOC_API_KEY'))) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  // Handle resolve-contact action
  if (body.action === 'resolve-contact') {
    const query = body.query as string;
    const userId = (body.userId || body.user_id) as string;
    if (!query || !userId) return json({ error: 'Missing query or userId' }, 400);

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey!);
    const result = await resolveContact(supabase, userId, query);
    if (!result) return json({ success: false, error: `No contact found matching "${query}"` }, 404);
    return json({ success: true, data: result });
  }

  // Handle list-workflows action
  if (body.action === 'list-workflows') {
    const catalog = Object.fromEntries(
      Object.entries(WORKFLOWS).map(([cmd, steps]) => [
        cmd,
        { steps: steps.map(s => s.step), tools: steps.map(s => s.tool), stepCount: steps.length },
      ])
    );
    return json({ success: true, data: catalog });
  }

  // Execute workflow
  const command = (body.command || body.workflow) as string;
  if (!command) {
    return json({
      error: 'Missing "command". Available: ' + Object.keys(WORKFLOWS).join(', '),
      availableCommands: Object.keys(WORKFLOWS),
    }, 400);
  }

  const workflow = WORKFLOWS[command];
  if (!workflow) {
    return json({
      error: `Unknown command: "${command}". Available: ${Object.keys(WORKFLOWS).join(', ')}`,
    }, 404);
  }

  const userId = (body.userId || body.user_id || body.params?.userId || body.params?.user_id) as string;
  let profileId = (body.profileId || body.profile_id || body.params?.profileId || body.params?.profile_id) as string;
  const contactQuery = (body.contact || body.contactQuery) as string;

  if (!userId) return json({ error: 'Missing userId' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, serviceKey!);

  // Resolve contact if profileId not provided
  if (!profileId && contactQuery) {
    const resolved = await resolveContact(supabase, userId, contactQuery);
    if (!resolved) return json({ error: `Could not resolve contact: "${contactQuery}"` }, 404);
    profileId = resolved.profileId;
  }

  if (!profileId) return json({ error: 'Missing profileId or contact query' }, 400);

  const start = performance.now();

  // Create workflow run record
  const { data: run, error: runError } = await supabase
    .from('agent_workflow_runs')
    .insert({
      user_id: userId,
      profile_id: profileId,
      workflow_command: command,
      status: 'running',
      steps: workflow.map(s => ({ step: s.step, status: 'pending' })),
    })
    .select('id')
    .single();

  if (runError) {
    console.error('[agent-workflow] Failed to create run:', runError);
  }

  const runId = run?.id || 'unknown';
  const params = { userId, profileId, ...(body.params as Record<string, unknown> || {}) };

  // Execute the DAG
  const { results, stepStatuses } = await executeWorkflow(
    workflow, params, supabaseUrl, serviceKey!, runId, supabase
  );

  const durationMs = Math.round(performance.now() - start);
  const failedSteps = Object.entries(stepStatuses).filter(([, s]) => s === 'failed');
  const finalStatus = failedSteps.length === 0 ? 'completed' : 'partial';

  // Update run record
  await supabase.from('agent_workflow_runs').update({
    status: finalStatus,
    results,
    steps: Object.entries(stepStatuses).map(([step, status]) => ({ step, status })),
    completed_at: new Date().toISOString(),
    total_duration_ms: durationMs,
  }).eq('id', runId);

  return json({
    success: failedSteps.length === 0,
    data: {
      runId,
      command,
      profileId,
      status: finalStatus,
      stepStatuses,
      results,
    },
    meta: {
      totalSteps: workflow.length,
      completedSteps: Object.values(stepStatuses).filter(s => s === 'completed').length,
      failedSteps: failedSteps.length,
      skippedSteps: Object.values(stepStatuses).filter(s => s === 'skipped').length,
      duration_ms: durationMs,
    },
  });
});
