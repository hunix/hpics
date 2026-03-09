/**
 * Security Domain Router (v4.0.0)
 * Consolidates ~14 security analysis functions.
 * @module security-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('security-router');

// Analysis type normalization mapping
const VALID_ANALYSIS_TYPES: Record<string, string> = {
  'threat': 'threat_assessment',
  'trust': 'trust_assessment',
  'monitor': 'security_monitoring',
  'threat_analyzer': 'threat_analysis',
  'opsec': 'opsec_vulnerability',
  'active_defense': 'active_defense',
  'adversary': 'adversary_profile',
  'red_team': 'red_team',
  'adversary_simulator': 'adversary_simulation',
  'lawfare': 'lawfare_defense',
  'forgery': 'forgery_detection',
  'dark_web': 'dark_web_monitoring',
  'deanonymization': 'deanonymization',
  'crisis_response': 'crisis_response',
};

function createSecurityHandler(analysisType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return c.json({ error: 'AI not configured' }, 500);

    const profileRes = profileId
      ? await supabase.from('profiles').select('*').eq('id', profileId).single()
      : { data: null };

    const model = (body.model as string) || 'google/gemini-3-flash-preview';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `You are a security and threat analyst. ${prompt}\n\nPROFILE: ${JSON.stringify(profileRes.data)}\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'general assessment'}` },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return c.json({ error: 'Rate limit exceeded' }, 429);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    let analysis: Record<string, unknown>;
    try { const m = content.match(/\{[\s\S]*\}/); analysis = m ? JSON.parse(m[0]) : { raw: content }; } catch { analysis = { raw: content }; }

    // Normalize analysis type
    const normalizedType = VALID_ANALYSIS_TYPES[analysisType] || analysisType;

    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId, profile_id: profileId, analysis_type: normalizedType,
        result: analysis, generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return c.json({ success: true, profileId, analysisType: normalizedType, analysis, timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/threat', type: 'threat_assessment', prompt: 'Assess threat level and vectors.' },
  { path: '/trust', type: 'trust_assessment', prompt: 'Assess trust level and reliability.' },
  { path: '/monitor', type: 'security_monitoring', prompt: 'Monitor security posture.' },
  { path: '/threat-analyzer', type: 'threat_analysis', prompt: 'Deep threat analysis with attack vectors.' },
  { path: '/opsec', type: 'opsec_vulnerability', prompt: 'Analyze operational security vulnerabilities.' },
  { path: '/active-defense', type: 'active_defense', prompt: 'Orchestrate active defense measures.' },
  { path: '/adversary', type: 'adversary_profile', prompt: 'Profile adversary capabilities and intent.' },
  { path: '/red-team', type: 'red_team', prompt: 'Automated red team assessment.' },
  { path: '/adversary-simulator', type: 'adversary_simulation', prompt: 'Simulate adversary attack scenarios.' },
  { path: '/lawfare', type: 'lawfare_defense', prompt: 'Analyze lawfare threats and defenses.' },
  { path: '/forgery', type: 'forgery_detection', prompt: 'Detect document and media forgery.' },
  { path: '/dark-web', type: 'dark_web_monitoring', prompt: 'Monitor dark web for threats.' },
  { path: '/deanonymization', type: 'deanonymization', prompt: 'Deanonymization analysis.' },
  { path: '/crisis-response', type: 'crisis_response', prompt: 'Orchestrate crisis response plan.' },
];

for (const route of routes) {
  app.post(route.path, createSecurityHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createSecurityHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
