/**
 * socmint-search — unified search across additional social/code sources.
 *
 * Adapters in this batch:
 *   - reddit   (public JSON, no key required for read; respects user-agent)
 *   - github   (public REST; GITHUB_TOKEN recommended for higher rate limits)
 *   - mastodon (federated; uses a single instance configured by
 *               MASTODON_INSTANCE, defaults to https://mastodon.social)
 *
 * POST /              { query, sources?: string[], limit?: number }
 *
 * Each adapter normalizes to:
 *   { source, id, title, body, url, author, posted_at, raw }
 *
 * Hits are persisted to socmint_mentions for the continuous monitor to
 * consume. Aggregate result is returned to the caller for ad-hoc use.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { jsonResponse, errorResponse, optionsResponse, healthCheckResponse } from '../_shared/http-helpers.ts';
import { validateAuth } from '../_shared/auth-handler.ts';

interface Hit {
  source: 'reddit' | 'github' | 'mastodon' | 'bluesky' | 'youtube' | 'rss';
  id: string;
  title: string | null;
  body: string | null;
  url: string;
  author: string | null;
  posted_at: string | null;
  raw: unknown;
}

const UA = 'hpics-socmint-search/1.0';

// ─── Reddit ─────────────────────────────────────────────────────────────────
async function searchReddit(query: string, limit: number): Promise<Hit[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=${limit}&sort=new`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const body = await res.json() as { data?: { children?: Array<{ data: Record<string, unknown> }> } };
  return (body.data?.children ?? []).map(c => {
    const d = c.data;
    return {
      source: 'reddit' as const,
      id: String(d.name ?? d.id ?? ''),
      title: (d.title as string) ?? null,
      body: (d.selftext as string) ?? null,
      url: `https://reddit.com${(d.permalink as string) ?? ''}`,
      author: (d.author as string) ?? null,
      posted_at: typeof d.created_utc === 'number' ? new Date((d.created_utc as number) * 1000).toISOString() : null,
      raw: d,
    };
  });
}

// ─── GitHub (issues + code) ─────────────────────────────────────────────────
async function searchGitHub(query: string, limit: number): Promise<Hit[]> {
  const token = Deno.env.get('GITHUB_TOKEN');
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Issues + commits give the best human-readable footprint for OSINT.
  const issuesUrl  = `https://api.github.com/search/issues?q=${encodeURIComponent(query)}&per_page=${limit}&sort=created&order=desc`;
  const commitsUrl = `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&per_page=${limit}&sort=committer-date&order=desc`;

  const headersCommits = { ...headers, Accept: 'application/vnd.github.cloak-preview+json' };

  const [iRes, cRes] = await Promise.all([
    fetch(issuesUrl,  { headers }),
    fetch(commitsUrl, { headers: headersCommits }),
  ]);

  const hits: Hit[] = [];

  if (iRes.ok) {
    const j = await iRes.json() as { items?: Array<Record<string, unknown>> };
    for (const it of j.items ?? []) {
      hits.push({
        source: 'github',
        id: `issue-${it.id}`,
        title: (it.title as string) ?? null,
        body: (it.body as string) ?? null,
        url: (it.html_url as string) ?? '',
        author: (it.user as { login?: string } | undefined)?.login ?? null,
        posted_at: (it.created_at as string) ?? null,
        raw: it,
      });
    }
  }

  if (cRes.ok) {
    const j = await cRes.json() as { items?: Array<Record<string, unknown>> };
    for (const it of j.items ?? []) {
      const commit = it.commit as { message?: string; author?: { date?: string; name?: string } } | undefined;
      hits.push({
        source: 'github',
        id: `commit-${it.sha as string}`,
        title: commit?.message?.split('\n')[0] ?? null,
        body: commit?.message ?? null,
        url: (it.html_url as string) ?? '',
        author: commit?.author?.name ?? null,
        posted_at: commit?.author?.date ?? null,
        raw: it,
      });
    }
  }

  return hits;
}

// ─── Mastodon (single-instance search) ──────────────────────────────────────
async function searchMastodon(query: string, limit: number): Promise<Hit[]> {
  const instance = Deno.env.get('MASTODON_INSTANCE') ?? 'https://mastodon.social';
  const token    = Deno.env.get('MASTODON_TOKEN');
  const url = `${instance}/api/v2/search?q=${encodeURIComponent(query)}&type=statuses&limit=${Math.min(limit, 40)}&resolve=true`;
  const headers: Record<string, string> = { 'User-Agent': UA, Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const j = await res.json() as { statuses?: Array<Record<string, unknown>> };
  return (j.statuses ?? []).map(s => ({
    source: 'mastodon' as const,
    id: String(s.id ?? ''),
    title: null,
    body: (s.content as string) ?? null, // HTML-stripped on the client
    url: (s.url as string) ?? '',
    author: (s.account as { acct?: string } | undefined)?.acct ?? null,
    posted_at: (s.created_at as string) ?? null,
    raw: s,
  }));
}

// ─── Bluesky (AT Protocol public search) ────────────────────────────────────
// Uses the unauthenticated public read endpoint on the bsky.social PDS.
// AUTH not required for search; rate-limited per IP.
async function searchBluesky(query: string, limit: number): Promise<Hit[]> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=${Math.min(limit, 100)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) return [];
  const j = await res.json() as { posts?: Array<Record<string, unknown>> };
  return (j.posts ?? []).map(p => {
    const record = p.record as { text?: string; createdAt?: string } | undefined;
    const author = p.author as { handle?: string; did?: string } | undefined;
    const uri    = String(p.uri ?? '');
    // AT URI shape: at://did:plc:.../app.bsky.feed.post/<rkey>
    const rkey = uri.split('/').pop() ?? '';
    const webUrl = author?.handle && rkey ? `https://bsky.app/profile/${author.handle}/post/${rkey}` : '';
    return {
      source: 'bluesky' as const,
      id: uri,
      title: null,
      body: record?.text ?? null,
      url: webUrl,
      author: author?.handle ?? author?.did ?? null,
      posted_at: record?.createdAt ?? null,
      raw: p,
    };
  });
}

// ─── YouTube (Data API v3) ──────────────────────────────────────────────────
// Searches public videos. Needs YOUTUBE_API_KEY (free quota: 10k units/day).
async function searchYouTube(query: string, limit: number): Promise<Hit[]> {
  const key = Deno.env.get('YOUTUBE_API_KEY');
  if (!key) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${Math.min(limit, 25)}&order=date&q=${encodeURIComponent(query)}&key=${key}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const j = await res.json() as { items?: Array<Record<string, unknown>> };
  return (j.items ?? []).map(it => {
    const id      = (it.id as { videoId?: string } | undefined)?.videoId ?? '';
    const snippet = it.snippet as { title?: string; description?: string; channelTitle?: string; publishedAt?: string } | undefined;
    return {
      source: 'youtube' as const,
      id,
      title: snippet?.title ?? null,
      body: snippet?.description ?? null,
      url: id ? `https://youtu.be/${id}` : '',
      author: snippet?.channelTitle ?? null,
      posted_at: snippet?.publishedAt ?? null,
      raw: it,
    };
  });
}

// ─── RSS feed scanner ───────────────────────────────────────────────────────
// Reads every feed URL in the per-user `rss_feeds` table and filters items by
// the query string (case-insensitive substring match across title + summary).
// The table is created in the migration paired with this slice.
async function searchRSS(query: string, limit: number, userId: string): Promise<Hit[]> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return [];

  // Pull feed urls without going through @supabase/supabase-js (avoid extra
  // imports in this module; keep the file self-contained).
  const feedsRes = await fetch(`${supabaseUrl}/rest/v1/rss_feeds?user_id=eq.${userId}&enabled=eq.true&select=url`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!feedsRes.ok) return [];
  const feeds = (await feedsRes.json()) as Array<{ url: string }>;
  if (feeds.length === 0) return [];

  const q = query.toLowerCase();
  const hits: Hit[] = [];

  for (const feed of feeds) {
    try {
      const xmlRes = await fetch(feed.url, { headers: { 'User-Agent': UA } });
      if (!xmlRes.ok) continue;
      const xml = await xmlRes.text();

      // Parse <item> / <entry> blocks with a tiny regex. Good enough for
      // well-formed RSS 2.0 / Atom; avoids bringing in a parser dep.
      const itemRegex = /<(item|entry)[\s\S]*?<\/\1>/g;
      const items = xml.match(itemRegex) ?? [];

      for (const block of items) {
        const pick = (tag: string) => {
          const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
          return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
        };
        const title   = pick('title');
        const summary = pick('description') || pick('summary') || pick('content');
        const linkRaw = pick('link');
        const linkMatch = block.match(/<link[^>]*href=["']([^"']+)["']/);
        const url = linkMatch ? linkMatch[1] : linkRaw;
        const author = pick('author') || pick('dc:creator');
        const date   = pick('pubDate') || pick('updated') || pick('published');

        const hay = `${title} ${summary}`.toLowerCase();
        if (!hay.includes(q)) continue;

        hits.push({
          source: 'rss',
          id: url || `${feed.url}#${title.slice(0, 80)}`,
          title: title || null,
          body: summary.replace(/<[^>]+>/g, '') || null,
          url: url || feed.url,
          author: author || null,
          posted_at: date || null,
          raw: { feed: feed.url },
        });

        if (hits.length >= limit) break;
      }
      if (hits.length >= limit) break;
    } catch (err) {
      console.warn(`[socmint-search] rss fetch failed for ${feed.url}`, err);
    }
  }

  return hits;
}

// ─── Entrypoint ─────────────────────────────────────────────────────────────

type AdapterFn = (query: string, limit: number, userId: string) => Promise<Hit[]>;

const ADAPTERS: Record<string, AdapterFn> = {
  reddit:   (q, l) => searchReddit(q, l),
  github:   (q, l) => searchGitHub(q, l),
  mastodon: (q, l) => searchMastodon(q, l),
  bluesky:  (q, l) => searchBluesky(q, l),
  youtube:  (q, l) => searchYouTube(q, l),
  rss:      (q, l, u) => searchRSS(q, l, u),
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) return healthCheckResponse('socmint-search');
  if (req.method !== 'POST') return errorResponse('method not allowed', 405);

  const body = await req.json().catch(() => ({})) as {
    query?: string;
    sources?: string[];
    limit?: number;
    profileId?: string;
  };
  const auth = await validateAuth(req, body as Record<string, unknown>);
  if (auth.error || !auth.userId) return errorResponse(auth.error || 'Unauthorized', 401);
  if (!body.query) return errorResponse('query required', 400);

  const limit = Math.min(Math.max(body.limit ?? 20, 1), 50);
  const sources = body.sources && body.sources.length > 0
    ? (body.sources as string[]).filter(s => s in ADAPTERS)
    : Object.keys(ADAPTERS);

  const results = await Promise.allSettled(
    sources.map(s => ADAPTERS[s](body.query!, limit, auth.userId)),
  );

  const hits: Hit[] = [];
  const stages: Record<string, { count: number; error?: string }> = {};
  results.forEach((r, i) => {
    const name = sources[i];
    if (r.status === 'fulfilled') {
      hits.push(...r.value);
      stages[name] = { count: r.value.length };
    } else {
      stages[name] = { count: 0, error: String(r.reason) };
    }
  });

  // Persist with idempotent upsert. The monitor-loop can then surface alerts.
  if (hits.length > 0) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase    = createClient(supabaseUrl, serviceKey);
    await supabase.from('socmint_mentions').upsert(
      hits.map(h => ({
        user_id:    auth.userId,
        profile_id: body.profileId ?? null,
        query:      body.query,
        source:     h.source,
        external_id: h.id,
        title:      h.title,
        body:       h.body,
        url:        h.url,
        author:     h.author,
        posted_at:  h.posted_at,
        raw:        h.raw,
      })),
      { onConflict: 'user_id,source,external_id' },
    );
  }

  return jsonResponse({
    success: true,
    query: body.query,
    sources: stages,
    totalHits: hits.length,
    hits,
  });
});
