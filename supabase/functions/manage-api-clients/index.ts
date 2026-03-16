/**
 * manage-api-clients (v1.0.0)
 * 
 * CRUD for inbound API client keys.
 * Actions: generate, list, revoke, usage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `hpics_${raw}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return json({ ok: true, function: 'manage-api-clients', timestamp: Date.now() });
  }

  // Auth: JWT
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return json({ error: 'Missing authorization' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const userId = user.id;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // GET requests may not have body
  }

  const action = (body.action as string) || url.searchParams.get('action') || '';

  // ── GENERATE ──
  if (action === 'generate') {
    const name = body.name as string;
    const rateLimitRpm = (body.rate_limit_rpm as number) || 60;
    const permissions = (body.permissions as string[]) || [];

    if (!name || name.trim().length === 0) {
      return json({ error: 'Client name is required' }, 400);
    }

    const rawKey = generateApiKey();
    const keyHash = await sha256(rawKey);
    const keyPrefix = rawKey.substring(0, 14); // "hpics_" + 8 chars

    const { data, error } = await supabase
      .from('hpics_api_clients')
      .insert({
        user_id: userId,
        name: name.trim(),
        api_key_hash: keyHash,
        key_prefix: keyPrefix,
        permissions,
        rate_limit_rpm: rateLimitRpm,
      })
      .select()
      .single();

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({
      success: true,
      data: {
        client: data,
        api_key: rawKey, // Only returned ONCE
      },
      warning: 'Store this API key securely. It will NOT be shown again.',
    });
  }

  // ── LIST ──
  if (action === 'list') {
    const { data, error } = await supabase
      .from('hpics_api_clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ success: true, data });
  }

  // ── REVOKE ──
  if (action === 'revoke') {
    const clientId = body.client_id as string;
    if (!clientId) {
      return json({ error: 'client_id is required' }, 400);
    }

    const { error } = await supabase
      .from('hpics_api_clients')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', clientId)
      .eq('user_id', userId);

    if (error) {
      return json({ error: error.message }, 500);
    }

    return json({ success: true, message: 'API key revoked' });
  }

  // ── USAGE ──
  if (action === 'usage') {
    const clientId = body.client_id as string || url.searchParams.get('client_id');

    // Get aggregated usage stats
    const now = new Date();
    const day1 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('api_usage_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', day30)
      .order('created_at', { ascending: false });

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: logs, error } = await query.limit(1000);

    if (error) {
      return json({ error: error.message }, 500);
    }

    const logsArr = logs || [];
    const stats = {
      last_24h: logsArr.filter(l => l.created_at >= day1).length,
      last_7d: logsArr.filter(l => l.created_at >= day7).length,
      last_30d: logsArr.length,
      avg_response_ms: logsArr.length > 0
        ? Math.round(logsArr.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logsArr.length)
        : 0,
      error_rate: logsArr.length > 0
        ? +(logsArr.filter(l => l.status_code && l.status_code >= 400).length / logsArr.length * 100).toFixed(1)
        : 0,
      top_tools: Object.entries(
        logsArr.reduce((acc: Record<string, number>, l) => {
          if (l.tool_called) acc[l.tool_called] = (acc[l.tool_called] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tool, count]) => ({ tool, count })),
    };

    return json({ success: true, data: stats });
  }

  return json({ error: `Unknown action: "${action}". Use: generate, list, revoke, usage` }, 400);
});
