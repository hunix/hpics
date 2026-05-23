/**
 * evidence-capture — preserve a web page as legally-defensible evidence.
 *
 * Captures, for one URL:
 *   - The final HTML after redirects
 *   - SHA-256 of the HTML (chain-of-custody anchor)
 *   - Response headers + status
 *   - A PNG screenshot (when SCREENSHOT_API_KEY is configured)
 *   - The fetch timestamp + the operator's user-agent
 *
 * Stores HTML and screenshot in the `evidence` storage bucket under
 *   <userId>/<evidenceId>/page.html
 *   <userId>/<evidenceId>/screenshot.png
 * and persists metadata in public.evidence_captures.
 *
 * POST /                  { url, profileId?, caseId?, note? }
 * GET  /:id               read one capture (RLS-protected)
 *
 * Env:
 *   SCREENSHOT_API_KEY   (optional, ScreenshotOne/Browserless/etc.)
 *   SCREENSHOT_API_BASE  (defaults to https://api.screenshotone.com/take)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

const EVIDENCE_BUCKET = 'evidence';

async function sha256(bytes: ArrayBuffer | Uint8Array | string): Promise<string> {
  const data = typeof bytes === 'string' ? new TextEncoder().encode(bytes) : bytes;
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

interface FetchResult {
  status: number;
  finalUrl: string;
  headers: Record<string, string>;
  html: string;
  htmlSha256: string;
}

async function fetchPage(url: string): Promise<FetchResult> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'hpics-evidence-capture/1.0 (preservation; investigator)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  const html = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });
  return {
    status: res.status,
    finalUrl: res.url,
    headers,
    html,
    htmlSha256: await sha256(html),
  };
}

async function captureScreenshot(url: string): Promise<{ bytes: Uint8Array; sha256: string; contentType: string } | null> {
  const apiKey = Deno.env.get('SCREENSHOT_API_KEY');
  if (!apiKey) return null;
  const base = Deno.env.get('SCREENSHOT_API_BASE') ?? 'https://api.screenshotone.com/take';

  // ScreenshotOne is the default flavor; many vendors share the same shape.
  const params = new URLSearchParams({
    access_key: apiKey,
    url,
    format: 'png',
    full_page: 'true',
    block_ads: 'true',
    block_cookie_banners: 'true',
    block_trackers: 'true',
    cache: 'false',
  });
  const res = await fetch(`${base}?${params.toString()}`);
  if (!res.ok) {
    console.warn(`[evidence-capture] screenshot failed ${res.status}`);
    return null;
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  return { bytes: buf, sha256: await sha256(buf), contentType: res.headers.get('content-type') ?? 'image/png' };
}

async function uploadBlob(opts: {
  supabase: ReturnType<typeof createClient>;
  bucket: string;
  path: string;
  body: Uint8Array | string;
  contentType: string;
}): Promise<string | null> {
  const { supabase, bucket, path, body, contentType } = opts;
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert: false,
  });
  if (error) {
    console.warn(`[evidence-capture] upload ${path} failed`, error);
    return null;
  }
  return path;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('evidence-capture');

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase    = createClient(supabaseUrl, serviceKey);

  if (req.method === 'GET') {
    const id = url.pathname.split('/').filter(Boolean).pop();
    if (!id) return errorResponse('id required', 400);
    const auth = await validateAuth(req, {});
    if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
    const { data, error } = await supabase
      .from('evidence_captures')
      .select('*')
      .eq('id', id)
      .eq('user_id', auth.userId)
      .maybeSingle();
    if (error || !data) return errorResponse('not found', 404);
    return jsonResponse({ capture: data });
  }

  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as { url?: string; profileId?: string; caseId?: string; note?: string };
  const auth = await validateAuth(req, body as Record<string, unknown>);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
  if (!body.url) return errorResponse('url is required', 400);

  let parsed: URL;
  try { parsed = new URL(body.url); }
  catch { return errorResponse('invalid url', 400); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return errorResponse('only http(s) urls are accepted', 400);
  }

  const captureId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  let fetched: FetchResult;
  try {
    fetched = await fetchPage(body.url);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : 'fetch failed', 502);
  }

  const htmlPath = `${auth.userId}/${captureId}/page.html`;
  const htmlUploaded = await uploadBlob({
    supabase,
    bucket: EVIDENCE_BUCKET,
    path: htmlPath,
    body: fetched.html,
    contentType: 'text/html; charset=utf-8',
  });

  let screenshotPath: string | null = null;
  let screenshotSha: string | null = null;
  try {
    const shot = await captureScreenshot(fetched.finalUrl);
    if (shot) {
      const sp = `${auth.userId}/${captureId}/screenshot.png`;
      const uploaded = await uploadBlob({
        supabase, bucket: EVIDENCE_BUCKET, path: sp, body: shot.bytes, contentType: shot.contentType,
      });
      if (uploaded) { screenshotPath = sp; screenshotSha = shot.sha256; }
    }
  } catch (err) {
    console.warn('[evidence-capture] screenshot pipeline failed', err);
  }

  const completedAt = new Date().toISOString();

  const { data: row, error: insertErr } = await supabase
    .from('evidence_captures')
    .insert({
      id:               captureId,
      user_id:          auth.userId,
      profile_id:       body.profileId ?? null,
      case_id:          body.caseId ?? null,
      note:             body.note ?? null,
      source_url:       body.url,
      final_url:        fetched.finalUrl,
      http_status:      fetched.status,
      response_headers: fetched.headers,
      html_path:        htmlUploaded,
      html_sha256:      fetched.htmlSha256,
      html_bytes:       fetched.html.length,
      screenshot_path:  screenshotPath,
      screenshot_sha256: screenshotSha,
      capture_started_at:   startedAt,
      capture_completed_at: completedAt,
      operator_user_agent:  req.headers.get('user-agent') ?? null,
    })
    .select()
    .single();

  if (insertErr) return errorResponse(insertErr.message, 500);

  return jsonResponse({ success: true, capture: row });
});
