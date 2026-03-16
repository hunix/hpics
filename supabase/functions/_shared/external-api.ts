/**
 * External API Integration Layer (v1.0.0)
 * 
 * Real external API calls with Vault-based key retrieval and AI fallback.
 * Each function checks for a real API key first; if missing, returns null
 * so the caller can fall back to AI-generated data.
 * 
 * @module _shared/external-api
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function getServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

/**
 * Retrieve an API key from Vault for a given user.
 * Uses the store_api_key/get_api_key pattern: `{user_id}:{key_name}`
 */
async function getVaultKey(userId: string, keyName: string): Promise<string | null> {
  const supabase = getServiceClient();
  const secretName = `${userId}:${keyName}`;
  const { data, error } = await supabase
    .from('vault.decrypted_secrets')
    .select('decrypted_secret')
    .eq('name', secretName)
    .maybeSingle();
  
  if (error || !data) {
    // Fallback: try using RPC
    try {
      const { data: rpcData } = await supabase.rpc('get_api_key', { p_name: keyName });
      return rpcData as string | null;
    } catch {
      return null;
    }
  }
  return data.decrypted_secret;
}

// ─── People Data Labs ───────────────────────────────────────────────────────
export interface PDLResult {
  source: 'pdl';
  data: Record<string, unknown>;
}

export async function enrichWithPDL(
  userId: string,
  params: { email?: string; name?: string; linkedin?: string; company?: string }
): Promise<PDLResult | null> {
  const apiKey = await getVaultKey(userId, 'PDL_API_KEY');
  if (!apiKey) return null;

  const queryParams = new URLSearchParams();
  queryParams.set('api_key', apiKey);
  if (params.email) queryParams.set('email', params.email);
  if (params.name) queryParams.set('name', params.name);
  if (params.linkedin) queryParams.set('profile', params.linkedin);
  if (params.company) queryParams.set('company', params.company);
  queryParams.set('min_likelihood', '3');

  try {
    const resp = await fetch(
      `https://api.peopledatalabs.com/v5/person/enrich?${queryParams.toString()}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!resp.ok) {
      console.error(`[external-api] PDL returned ${resp.status}`);
      await resp.text();
      return null;
    }
    const data = await resp.json();
    return { source: 'pdl', data };
  } catch (err) {
    console.error('[external-api] PDL error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Hunter.io ──────────────────────────────────────────────────────────────
export interface HunterResult {
  source: 'hunter';
  data: Record<string, unknown>;
}

export async function enrichWithHunter(
  userId: string,
  params: { email?: string; domain?: string; firstName?: string; lastName?: string }
): Promise<HunterResult | null> {
  const apiKey = await getVaultKey(userId, 'HUNTER_API_KEY');
  if (!apiKey) return null;

  try {
    let url: string;
    if (params.email) {
      url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(params.email)}&api_key=${apiKey}`;
    } else if (params.domain && params.firstName && params.lastName) {
      url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(params.domain)}&first_name=${encodeURIComponent(params.firstName)}&last_name=${encodeURIComponent(params.lastName)}&api_key=${apiKey}`;
    } else if (params.domain) {
      url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(params.domain)}&api_key=${apiKey}`;
    } else {
      return null;
    }

    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`[external-api] Hunter returned ${resp.status}`);
      await resp.text();
      return null;
    }
    const data = await resp.json();
    return { source: 'hunter', data: data.data || data };
  } catch (err) {
    console.error('[external-api] Hunter error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Proxycurl (LinkedIn) ───────────────────────────────────────────────────
export interface ProxycurlResult {
  source: 'proxycurl';
  data: Record<string, unknown>;
}

export async function enrichWithProxycurl(
  userId: string,
  params: { linkedinUrl: string }
): Promise<ProxycurlResult | null> {
  const apiKey = await getVaultKey(userId, 'PROXYCURL_API_KEY');
  if (!apiKey) return null;

  try {
    const resp = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(params.linkedinUrl)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!resp.ok) {
      console.error(`[external-api] Proxycurl returned ${resp.status}`);
      await resp.text();
      return null;
    }
    const data = await resp.json();
    return { source: 'proxycurl', data };
  } catch (err) {
    console.error('[external-api] Proxycurl error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Tavily (Web Search) ────────────────────────────────────────────────────
export interface TavilyResult {
  source: 'tavily';
  data: Record<string, unknown>;
}

export async function searchWithTavily(
  userId: string,
  params: { query: string; maxResults?: number }
): Promise<TavilyResult | null> {
  const apiKey = await getVaultKey(userId, 'TAVILY_API_KEY');
  if (!apiKey) return null;

  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: params.query,
        max_results: params.maxResults || 10,
        include_answer: true,
        search_depth: 'advanced',
      }),
    });
    if (!resp.ok) {
      console.error(`[external-api] Tavily returned ${resp.status}`);
      await resp.text();
      return null;
    }
    const data = await resp.json();
    return { source: 'tavily', data };
  } catch (err) {
    console.error('[external-api] Tavily error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Brave Search ───────────────────────────────────────────────────────────
export interface BraveResult {
  source: 'brave';
  data: Record<string, unknown>;
}

export async function searchWithBrave(
  userId: string,
  params: { query: string; count?: number }
): Promise<BraveResult | null> {
  const apiKey = await getVaultKey(userId, 'BRAVE_API_KEY');
  if (!apiKey) return null;

  try {
    const resp = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(params.query)}&count=${params.count || 10}`,
      { headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' } }
    );
    if (!resp.ok) {
      console.error(`[external-api] Brave returned ${resp.status}`);
      await resp.text();
      return null;
    }
    const data = await resp.json();
    return { source: 'brave', data };
  } catch (err) {
    console.error('[external-api] Brave error:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Multi-source OSINT Search ──────────────────────────────────────────────
export interface OSINTResult {
  sources: Array<{ source: string; data: Record<string, unknown> }>;
  query: string;
}

export async function multiSourceOSINT(
  userId: string,
  query: string
): Promise<OSINTResult> {
  const [tavily, brave] = await Promise.allSettled([
    searchWithTavily(userId, { query, maxResults: 10 }),
    searchWithBrave(userId, { query, count: 10 }),
  ]);

  const sources: Array<{ source: string; data: Record<string, unknown> }> = [];
  if (tavily.status === 'fulfilled' && tavily.value) sources.push(tavily.value);
  if (brave.status === 'fulfilled' && brave.value) sources.push(brave.value);

  return { sources, query };
}
