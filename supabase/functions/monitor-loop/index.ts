/**
 * monitor-loop — proactive monitoring tick.
 *
 * Designed to be invoked from pg_cron every N minutes (or by a user
 * "Run now" button). For each user, fan out to the configured monitors:
 *   - news_search   for each tracked entity
 *   - telegram-watcher
 *   - breach-monitor for emails added in the last 24h
 *
 * Anything new is persisted as an `intelligence_alert` row; the existing
 * realtime subscription on that table picks the alert up in the UI.
 *
 * POST /            { userId?: string }   — if userId omitted (and the
 *                                           caller is service_role), runs
 *                                           for every user with monitoring
 *                                           enabled.
 *
 * The function is intentionally side-effecting only; it does not block on
 * external responses past a per-stage 25s soft timeout.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const STAGE_TIMEOUT_MS = 25_000;

async function withTimeout<T>(label: string, p: Promise<T>): Promise<T | { error: string }> {
  return Promise.race([
    p,
    new Promise<{ error: string }>(resolve => setTimeout(() => resolve({ error: `${label} timed out` }), STAGE_TIMEOUT_MS)),
  ]) as Promise<T | { error: string }>;
}

async function invokeFn(supabaseUrl: string, serviceKey: string, name: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function runForUser(opts: {
  supabaseUrl: string;
  serviceKey: string;
  supabase: ReturnType<typeof createClient>;
  userId: string;
}): Promise<Record<string, unknown>> {
  const { supabase, supabaseUrl, serviceKey, userId } = opts;

  const { data: prefs } = await supabase
    .from('monitor_preferences')
    .select('news_enabled, telegram_enabled, breach_enabled')
    .eq('user_id', userId)
    .maybeSingle();

  const news     = prefs?.news_enabled     ?? true;
  const telegram = prefs?.telegram_enabled ?? true;
  const breach   = prefs?.breach_enabled   ?? true;

  const stages: Record<string, unknown> = {};

  // Pull terms once and share between news + socmint stages.
  const { data: termRows } = await supabase
    .from('intel_watch_terms')
    .select('term, profile_id')
    .eq('user_id', userId)
    .eq('enabled', true)
    .limit(20);
  const terms = (termRows ?? []) as Array<{ term: string; profile_id: string | null }>;

  if (news) {
    stages.news = await withTimeout('news',
      Promise.all(terms.map(t => invokeFn(supabaseUrl, serviceKey, 'search-news', { query: t.term, userId, persistAlerts: true })))
    );
  }

  // SOCMINT (Reddit/GitHub/Mastodon)
  stages.socmint = await withTimeout('socmint',
    Promise.all(terms.map(t => invokeFn(supabaseUrl, serviceKey, 'socmint-search', {
      query: t.term,
      profileId: t.profile_id,
      limit: 25,
    }))),
  );

  if (telegram) {
    stages.telegram = await withTimeout('telegram',
      invokeFn(supabaseUrl, serviceKey, 'telegram-watcher', { userId })
    );
  }

  if (breach) {
    // Re-check emails added or modified in the last 24h.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: methods } = await supabase
      .from('contact_methods')
      .select('value, profile_id')
      .eq('contact_type', 'email')
      .gte('updated_at', since)
      .limit(50);
    const checks = (methods ?? []).map(m =>
      invokeFn(supabaseUrl, serviceKey, 'breach-monitor', { email: m.value, profileId: m.profile_id, userId }),
    );
    stages.breach = await withTimeout('breach', Promise.all(checks));
  }

  await supabase.from('monitor_runs').insert({
    user_id:   userId,
    stages:    Object.keys(stages),
    payload:   stages,
    completed_at: new Date().toISOString(),
  });

  return stages;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('monitor-loop');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  const body = await req.json().catch(() => ({})) as { userId?: string };

  // Either a user JWT (runs for that user) or service-role + explicit userId
  // (runs from cron). When called from pg_cron without userId we fan out
  // across every user that has any watch term configured.
  const authHeader = req.headers.get('Authorization') ?? '';
  const isServiceRole = authHeader === `Bearer ${serviceKey}`;

  let targetUserIds: string[] = [];
  if (isServiceRole) {
    if (body.userId) {
      targetUserIds = [body.userId];
    } else {
      const { data } = await supabase
        .from('intel_watch_terms')
        .select('user_id')
        .limit(1000);
      const set = new Set((data ?? []).map(r => r.user_id as string));
      targetUserIds = [...set];
    }
  } else {
    const auth = await validateAuth(req, body as Record<string, unknown>);
    if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
    targetUserIds = [auth.userId];
  }

  const results: Record<string, unknown> = {};
  for (const uid of targetUserIds) {
    try {
      results[uid] = await runForUser({ supabaseUrl, serviceKey, supabase, userId: uid });
    } catch (err) {
      results[uid] = { error: err instanceof Error ? err.message : 'unknown' };
    }
  }

  return jsonResponse({ success: true, users: targetUserIds.length, results });
});
