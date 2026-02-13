/**
 * Enrichment Domain Router (v4.0.0)
 * Consolidates ~15 data enrichment functions.
 * @module enrichment-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('enrichment-router');

function createEnrichmentHandler(enrichmentType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return c.json({ error: 'AI not configured' }, 500);

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
      if (response.status === 429) return c.json({ error: 'Rate limit exceeded' }, 429);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    let result: Record<string, unknown>;
    try { const m = content.match(/\{[\s\S]*\}/); result = m ? JSON.parse(m[0]) : { raw: content }; } catch { result = { raw: content }; }

    return c.json({ success: true, profileId, enrichmentType, result, timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/auto-enrich', type: 'auto_enrichment', prompt: 'Auto-enrich contact with all available sources.' },
  { path: '/enrich', type: 'contact_enrichment', prompt: 'Enrich contact profile data.' },
  { path: '/hunter', type: 'hunter_enrichment', prompt: 'Enrich via Hunter.io email data.' },
  { path: '/pdl', type: 'pdl_enrichment', prompt: 'Enrich via People Data Labs.' },
  { path: '/orchestrator', type: 'enrichment_orchestration', prompt: 'Orchestrate multi-source enrichment.' },
  { path: '/osint', type: 'osint_scan', prompt: 'OSINT scan for public information.' },
  { path: '/deep-osint', type: 'deep_osint', prompt: 'Deep OSINT scan with advanced techniques.' },
  { path: '/digital-footprint', type: 'digital_footprint', prompt: 'Scan digital footprint across platforms.' },
  { path: '/social-comprehensive', type: 'social_comprehensive', prompt: 'Comprehensive social media scraping.' },
  { path: '/social-profile', type: 'social_profile', prompt: 'Scrape social profile data.' },
  { path: '/social-rapidapi', type: 'social_rapidapi', prompt: 'Social scraping via RapidAPI.' },
  { path: '/linkedin', type: 'linkedin_enrichment', prompt: 'LinkedIn profile enrichment.' },
  { path: '/instagram', type: 'instagram_deep', prompt: 'Deep Instagram analysis.' },
  { path: '/threads', type: 'threads_deep', prompt: 'Deep Threads analysis.' },
  { path: '/web-mentions', type: 'web_mentions', prompt: 'Monitor web mentions and citations.' },
  { path: '/company-branding', type: 'company_branding', prompt: 'Extract company branding data.' },
  { path: '/diffbot', type: 'diffbot_extraction', prompt: 'Extract structured data via Diffbot.' },
];

for (const route of routes) {
  app.post(route.path, createEnrichmentHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createEnrichmentHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
