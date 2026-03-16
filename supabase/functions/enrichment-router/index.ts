/**
 * Enrichment Domain Router (v5.0.0)
 * Consolidates ~15 data enrichment functions.
 * Now with real external API integration (PDL, Hunter, Proxycurl, Tavily, Brave)
 * and graceful AI fallback when keys are not configured.
 * @module enrichment-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';
import {
  enrichWithPDL,
  enrichWithHunter,
  enrichWithProxycurl,
  searchWithTavily,
  searchWithBrave,
  multiSourceOSINT,
} from '../_shared/external-api.ts';

const app = createRouter('enrichment-router');

// ─── AI Fallback Enrichment ─────────────────────────────────────────────────
async function aiEnrich(body: Record<string, unknown>, prompt: string, enrichmentType: string, profileId: string) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('AI not configured');

  const model = (body.model as string) || 'google/gemini-2.5-flash';
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: `You are a data enrichment specialist. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with structured JSON enrichment data.` },
        { role: 'user', content: `Enrich data for ${profileId || 'target'}` },
      ],
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`AI error: ${response.status}`);
  }

  const aiResult = await response.json();
  const content = aiResult.choices?.[0]?.message?.content || '{}';
  try {
    const m = content.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : { raw: content };
  } catch {
    return { raw: content };
  }
}

// ─── Standard AI enrichment handler ─────────────────────────────────────────
function createEnrichmentHandler(enrichmentType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, body } = getRouterContext(c);

    try {
      const result = await aiEnrich(body, prompt, enrichmentType, profileId);
      return c.json({ success: true, profileId, enrichmentType, result, source: 'ai', timestamp: new Date().toISOString() });
    } catch (err) {
      if (err instanceof Error && err.message === 'RATE_LIMIT') return c.json({ error: 'Rate limit exceeded' }, 429);
      throw err;
    }
  });
}

// ─── Real API + AI Fallback Handlers ────────────────────────────────────────

// Auto-enrich: tries PDL → Hunter → AI fallback
const handleAutoEnrich = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  // Gather profile data for external API calls
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, organization, job_title, city, country')
    .eq('id', profileId)
    .maybeSingle();

  const { data: contactMethods } = await supabase
    .from('contact_methods')
    .select('contact_type, value')
    .eq('profile_id', profileId)
    .limit(10);

  const email = contactMethods?.find(cm => cm.contact_type === 'email')?.value;
  const phone = contactMethods?.find(cm => cm.contact_type === 'phone')?.value;
  const linkedin = contactMethods?.find(cm => cm.contact_type === 'linkedin')?.value;

  const sources: Array<{ source: string; data: Record<string, unknown> }> = [];
  const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined;

  // Try real APIs in parallel
  const [pdlResult, hunterResult, proxycurlResult] = await Promise.allSettled([
    enrichWithPDL(userId, { email: email || undefined, name, linkedin: linkedin || undefined, company: profile?.organization || undefined }),
    enrichWithHunter(userId, { email: email || undefined, domain: profile?.organization ? undefined : undefined }),
    linkedin ? enrichWithProxycurl(userId, { linkedinUrl: linkedin }) : Promise.resolve(null),
  ]);

  if (pdlResult.status === 'fulfilled' && pdlResult.value) sources.push(pdlResult.value);
  if (hunterResult.status === 'fulfilled' && hunterResult.value) sources.push(hunterResult.value);
  if (proxycurlResult.status === 'fulfilled' && proxycurlResult.value) sources.push(proxycurlResult.value);

  // If we got real data, merge and return
  if (sources.length > 0) {
    const merged = sources.reduce((acc, s) => ({ ...acc, [s.source]: s.data }), {} as Record<string, unknown>);
    return c.json({
      success: true,
      profileId,
      enrichmentType: 'auto_enrichment',
      result: merged,
      sources: sources.map(s => s.source),
      source: 'external_api',
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback to AI
  const aiResult = await aiEnrich(
    { ...body, profile, contactMethods, email, phone, linkedin },
    'Auto-enrich contact with all available sources. Provide comprehensive data.',
    'auto_enrichment',
    profileId
  );

  return c.json({
    success: true,
    profileId,
    enrichmentType: 'auto_enrichment',
    result: aiResult,
    source: 'ai_fallback',
    timestamp: new Date().toISOString(),
  });
});

// Hunter-specific: real API + AI fallback
const handleHunter = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  const email = body.email as string;
  const domain = body.domain as string;
  const firstName = body.firstName || body.first_name as string;
  const lastName = body.lastName || body.last_name as string;

  const result = await enrichWithHunter(userId, {
    email: email || undefined,
    domain: domain || undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
  });

  if (result) {
    return c.json({ success: true, profileId, enrichmentType: 'hunter_enrichment', result: result.data, source: 'hunter_api', timestamp: new Date().toISOString() });
  }

  const aiResult = await aiEnrich(body, 'Enrich via Hunter.io email data.', 'hunter_enrichment', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'hunter_enrichment', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// PDL-specific: real API + AI fallback
const handlePDL = withHandler(async (c: Context) => {
  const { userId, profileId, body } = getRouterContext(c);

  const result = await enrichWithPDL(userId, {
    email: body.email as string || undefined,
    name: body.name as string || undefined,
    linkedin: body.linkedin as string || undefined,
    company: body.company as string || undefined,
  });

  if (result) {
    return c.json({ success: true, profileId, enrichmentType: 'pdl_enrichment', result: result.data, source: 'pdl_api', timestamp: new Date().toISOString() });
  }

  const aiResult = await aiEnrich(body, 'Enrich via People Data Labs.', 'pdl_enrichment', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'pdl_enrichment', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// LinkedIn: Proxycurl + AI fallback
const handleLinkedin = withHandler(async (c: Context) => {
  const { userId, profileId, body } = getRouterContext(c);
  const linkedinUrl = (body.linkedinUrl || body.linkedin_url || body.linkedin) as string;

  if (linkedinUrl) {
    const result = await enrichWithProxycurl(userId, { linkedinUrl });
    if (result) {
      return c.json({ success: true, profileId, enrichmentType: 'linkedin_enrichment', result: result.data, source: 'proxycurl_api', timestamp: new Date().toISOString() });
    }
  }

  const aiResult = await aiEnrich(body, 'LinkedIn profile enrichment.', 'linkedin_enrichment', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'linkedin_enrichment', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// OSINT: Tavily + Brave + AI fallback
const handleOSINT = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  // Build search query from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, organization')
    .eq('id', profileId)
    .maybeSingle();

  const searchQuery = (body.query as string) || (profile ? `${profile.first_name} ${profile.last_name} ${profile.organization || ''}`.trim() : profileId);

  const osintResult = await multiSourceOSINT(userId, searchQuery);

  if (osintResult.sources.length > 0) {
    return c.json({
      success: true,
      profileId,
      enrichmentType: 'osint_scan',
      result: { query: searchQuery, sources: osintResult.sources },
      source: 'external_api',
      timestamp: new Date().toISOString(),
    });
  }

  const aiResult = await aiEnrich({ ...body, searchQuery }, 'OSINT scan for public information.', 'osint_scan', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'osint_scan', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// Deep OSINT: uses all available sources
const handleDeepOSINT = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, organization, job_title')
    .eq('id', profileId)
    .maybeSingle();

  const { data: contactMethods } = await supabase
    .from('contact_methods')
    .select('contact_type, value')
    .eq('profile_id', profileId)
    .limit(10);

  const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
  const email = contactMethods?.find(cm => cm.contact_type === 'email')?.value;
  const linkedin = contactMethods?.find(cm => cm.contact_type === 'linkedin')?.value;
  const sources: Array<{ source: string; data: Record<string, unknown> }> = [];

  // Run all available APIs in parallel
  const [pdl, hunter, proxycurl, osint] = await Promise.allSettled([
    enrichWithPDL(userId, { email: email || undefined, name: name || undefined, linkedin: linkedin || undefined }),
    enrichWithHunter(userId, { email: email || undefined }),
    linkedin ? enrichWithProxycurl(userId, { linkedinUrl: linkedin }) : Promise.resolve(null),
    multiSourceOSINT(userId, `${name} ${profile?.organization || ''}`),
  ]);

  if (pdl.status === 'fulfilled' && pdl.value) sources.push(pdl.value);
  if (hunter.status === 'fulfilled' && hunter.value) sources.push(hunter.value);
  if (proxycurl.status === 'fulfilled' && proxycurl.value) sources.push(proxycurl.value);
  if (osint.status === 'fulfilled') osint.value.sources.forEach(s => sources.push(s));

  if (sources.length > 0) {
    return c.json({
      success: true,
      profileId,
      enrichmentType: 'deep_osint',
      result: { sources: sources.reduce((acc, s) => ({ ...acc, [s.source]: s.data }), {}), sourceCount: sources.length },
      source: 'external_api',
      timestamp: new Date().toISOString(),
    });
  }

  const aiResult = await aiEnrich({ ...body, profile, contactMethods }, 'Deep OSINT scan with advanced techniques.', 'deep_osint', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'deep_osint', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// Digital footprint: web search focused
const handleDigitalFootprint = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, organization')
    .eq('id', profileId)
    .maybeSingle();

  const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
  const queries = [
    `"${name}" site:linkedin.com OR site:twitter.com OR site:github.com`,
    `"${name}" ${profile?.organization || ''}`,
  ];

  const searchResults = await Promise.allSettled(
    queries.map(q => multiSourceOSINT(userId, q))
  );

  const allSources: Array<{ source: string; data: Record<string, unknown> }> = [];
  searchResults.forEach(r => {
    if (r.status === 'fulfilled') r.value.sources.forEach(s => allSources.push(s));
  });

  if (allSources.length > 0) {
    return c.json({
      success: true, profileId, enrichmentType: 'digital_footprint',
      result: { queries, sources: allSources.reduce((acc, s) => ({ ...acc, [s.source]: s.data }), {}) },
      source: 'external_api', timestamp: new Date().toISOString(),
    });
  }

  const aiResult = await aiEnrich({ ...body, profile }, 'Scan digital footprint across platforms.', 'digital_footprint', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'digital_footprint', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// Web mentions: search-based
const handleWebMentions = withHandler(async (c: Context) => {
  const { userId, profileId, supabase, body } = getRouterContext(c);

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, organization')
    .eq('id', profileId)
    .maybeSingle();

  const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : '';
  const osint = await multiSourceOSINT(userId, `"${name}" ${profile?.organization || ''}`);

  if (osint.sources.length > 0) {
    return c.json({
      success: true, profileId, enrichmentType: 'web_mentions',
      result: osint, source: 'external_api', timestamp: new Date().toISOString(),
    });
  }

  const aiResult = await aiEnrich({ ...body, profile }, 'Monitor web mentions and citations.', 'web_mentions', profileId);
  return c.json({ success: true, profileId, enrichmentType: 'web_mentions', result: aiResult, source: 'ai_fallback', timestamp: new Date().toISOString() });
});

// ─── Routes: Real API handlers ──────────────────────────────────────────────
app.post('/auto-enrich', handleAutoEnrich);
app.post('/enrich', handleAutoEnrich);
app.post('/hunter', handleHunter);
app.post('/pdl', handlePDL);
app.post('/linkedin', handleLinkedin);
app.post('/osint', handleOSINT);
app.post('/deep-osint', handleDeepOSINT);
app.post('/digital-footprint', handleDigitalFootprint);
app.post('/web-mentions', handleWebMentions);

// ─── Routes: AI-only handlers ───────────────────────────────────────────────
const aiOnlyRoutes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/orchestrator', type: 'enrichment_orchestration', prompt: 'Orchestrate multi-source enrichment.' },
  { path: '/social-comprehensive', type: 'social_comprehensive', prompt: 'Comprehensive social media scraping.' },
  { path: '/social-profile', type: 'social_profile', prompt: 'Scrape social profile data.' },
  { path: '/social-rapidapi', type: 'social_rapidapi', prompt: 'Social scraping via RapidAPI.' },
  { path: '/instagram', type: 'instagram_deep', prompt: 'Deep Instagram analysis.' },
  { path: '/threads', type: 'threads_deep', prompt: 'Deep Threads analysis.' },
  { path: '/company-branding', type: 'company_branding', prompt: 'Extract company branding data.' },
  { path: '/diffbot', type: 'diffbot_extraction', prompt: 'Extract structured data via Diffbot.' },
];

for (const route of aiOnlyRoutes) {
  app.post(route.path, createEnrichmentHandler(route.type, route.prompt));
}

// ─── Catch-all _route dispatcher ────────────────────────────────────────────
const allRoutes = [
  { path: '/auto-enrich', type: 'auto_enrichment' },
  { path: '/enrich', type: 'contact_enrichment' },
  { path: '/hunter', type: 'hunter_enrichment' },
  { path: '/pdl', type: 'pdl_enrichment' },
  { path: '/linkedin', type: 'linkedin_enrichment' },
  { path: '/osint', type: 'osint_scan' },
  { path: '/deep-osint', type: 'deep_osint' },
  { path: '/digital-footprint', type: 'digital_footprint' },
  { path: '/web-mentions', type: 'web_mentions' },
  ...aiOnlyRoutes.map(r => ({ path: r.path, type: r.type })),
];

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);

  // Find matching registered route and re-dispatch
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const authHeader = c.req.header('Authorization') || '';

  const resp = await fetch(`${baseUrl}${routePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authHeader },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  return c.json(data, resp.status as any);
}));

serve(app.fetch);
