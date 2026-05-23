/**
 * breach-monitor — checks an email/username against breach databases
 * (HaveIBeenPwned + Dehashed when configured) and persists hits.
 *
 * POST /            { email?: string, username?: string, profileId?: string }
 *
 * Env:
 *   HIBP_API_KEY          (required for /breachedaccount lookups)
 *   DEHASHED_API_KEY      (optional; if set, also queries Dehashed)
 *   DEHASHED_EMAIL        (Dehashed credential)
 *
 * Persists hits to public.breach_exposures keyed on (user_id, profile_id, source, breach_name).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3';
const DEHASHED_BASE = 'https://api.dehashed.com/search';

interface BreachHit {
  source: 'hibp' | 'dehashed';
  breach_name: string;
  breach_date?: string | null;
  added_date?: string | null;
  data_classes?: string[];
  description?: string | null;
  raw: unknown;
}

async function checkHIBP(email: string): Promise<BreachHit[]> {
  const apiKey = Deno.env.get('HIBP_API_KEY');
  if (!apiKey) return [];

  const url = `${HIBP_BASE}/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
  const res = await fetch(url, {
    headers: { 'hibp-api-key': apiKey, 'user-agent': 'hpics-breach-monitor' },
  });
  if (res.status === 404) return [];           // no breaches found
  if (res.status === 429) throw new Error('HIBP rate limited');
  if (!res.ok) throw new Error(`HIBP error ${res.status}`);

  const body = await res.json() as Array<{
    Name: string; Title?: string; BreachDate?: string; AddedDate?: string; DataClasses?: string[]; Description?: string;
  }>;

  return body.map(b => ({
    source: 'hibp' as const,
    breach_name: b.Name,
    breach_date: b.BreachDate ?? null,
    added_date: b.AddedDate ?? null,
    data_classes: b.DataClasses ?? [],
    description: b.Description ?? null,
    raw: b,
  }));
}

async function checkDehashed(emailOrUser: string): Promise<BreachHit[]> {
  const apiKey = Deno.env.get('DEHASHED_API_KEY');
  const email  = Deno.env.get('DEHASHED_EMAIL');
  if (!apiKey || !email) return [];

  const url = `${DEHASHED_BASE}?query=${encodeURIComponent(emailOrUser)}&size=100`;
  const auth = btoa(`${email}:${apiKey}`);
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Dehashed error ${res.status}`);
  const body = await res.json() as { entries?: Array<Record<string, unknown>> };
  const entries = body.entries ?? [];
  return entries.map(e => ({
    source: 'dehashed' as const,
    breach_name: (e.database_name as string) || 'unknown',
    breach_date: null,
    added_date: null,
    data_classes: Object.keys(e).filter(k => !!e[k] && k !== 'id'),
    description: null,
    raw: e,
  }));
}

async function persistHits(opts: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  profileId: string | null;
  query: string;
  hits: BreachHit[];
}) {
  const { supabase, userId, profileId, query, hits } = opts;
  if (hits.length === 0) return;
  const rows = hits.map(h => ({
    user_id: userId,
    profile_id: profileId,
    query,
    source: h.source,
    breach_name: h.breach_name,
    breach_date: h.breach_date,
    added_date: h.added_date,
    data_classes: h.data_classes ?? [],
    description: h.description,
    raw: h.raw,
  }));
  const { error } = await supabase
    .from('breach_exposures')
    .upsert(rows, { onConflict: 'user_id,profile_id,source,breach_name', ignoreDuplicates: false });
  if (error) console.error('[breach-monitor] persist failed', error);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('breach-monitor');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as { email?: string; username?: string; profileId?: string };
  const auth = await validateAuth(req, body as Record<string, unknown>);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);

  const query = (body.email || body.username || '').trim();
  if (!query) return errorResponse('email or username is required', 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  const results: { source: string; count: number; error?: string }[] = [];
  const allHits: BreachHit[] = [];

  // HIBP needs an email; skip if only a username
  if (body.email) {
    try {
      const hits = await checkHIBP(body.email);
      allHits.push(...hits);
      results.push({ source: 'hibp', count: hits.length });
    } catch (err) {
      results.push({ source: 'hibp', count: 0, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  try {
    const hits = await checkDehashed(query);
    allHits.push(...hits);
    results.push({ source: 'dehashed', count: hits.length });
  } catch (err) {
    results.push({ source: 'dehashed', count: 0, error: err instanceof Error ? err.message : 'unknown' });
  }

  await persistHits({
    supabase,
    userId: auth.userId,
    profileId: body.profileId ?? null,
    query,
    hits: allHits,
  });

  return jsonResponse({
    success: true,
    query,
    profileId: body.profileId ?? null,
    sources: results,
    hits: allHits,
    totalHits: allHits.length,
  });
});
