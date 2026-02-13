/**
 * Warfare Domain Router (v4.0.0)
 * Consolidates ~25 cognitive/information warfare functions.
 * @module warfare-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('warfare-router');

function createWarfareHandler(analysisType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return c.json({ error: 'AI not configured' }, 500);

    const profileRes = profileId
      ? await supabase.from('profiles').select('*').eq('id', profileId).single()
      : { data: null };

    const model = (body.model as string) || 'google/gemini-2.5-flash';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `You are a cognitive warfare analyst. ${prompt}\n\nPROFILE: ${JSON.stringify(profileRes.data)}\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with detailed JSON analysis.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'general context'}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return c.json({ error: 'Rate limit exceeded' }, 429);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || '{}';
    let analysis: Record<string, unknown>;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? JSON.parse(m[0]) : { raw: content };
    } catch { analysis = { raw: content }; }

    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId, profile_id: profileId, analysis_type: analysisType,
        result: analysis, generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return c.json({ success: true, profileId, analysisType, analysis, timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; prompt: string }> = [
  { path: '/cognitive', type: 'cognitive_warfare', prompt: 'Analyze cognitive warfare vectors and vulnerabilities.' },
  { path: '/cognitive-planner', type: 'cognitive_warfare_plan', prompt: 'Plan cognitive warfare campaign with phases.' },
  { path: '/cognitive-iw', type: 'cognitive_iw_detection', prompt: 'Detect information warfare indicators.' },
  { path: '/cognitive-effect', type: 'cognitive_effect', prompt: 'Orchestrate cognitive effects across multiple channels.' },
  { path: '/cognitive-defense', type: 'cognitive_defense', prompt: 'Simulate cognitive defense scenarios.' },
  { path: '/memetic', type: 'memetic_propagation', prompt: 'Analyze memetic propagation patterns and design memes.' },
  { path: '/narrative', type: 'narrative_control', prompt: 'Design narrative control strategies.' },
  { path: '/semantic', type: 'semantic_warfare', prompt: 'Analyze semantic warfare: meaning manipulation, frame shifting.' },
  { path: '/identity-destabilization', type: 'identity_destabilization', prompt: 'Analyze identity destabilization vectors.' },
  { path: '/cult-tactics', type: 'cult_tactics', prompt: 'Analyze cult recruitment and retention tactics.' },
  { path: '/draco-deception', type: 'draco_deception', prompt: 'Orchestrate multi-layered deception operations.' },
  { path: '/reflexive-control', type: 'reflexive_control', prompt: 'Detect reflexive control techniques.' },
  { path: '/influence-campaign', type: 'influence_campaign', prompt: 'Optimize influence campaign parameters.' },
  { path: '/influence-orchestrator', type: 'influence_orchestration', prompt: 'Orchestrate multi-channel influence operations.' },
  { path: '/influence-propagation', type: 'influence_propagation', prompt: 'Model influence propagation through networks.' },
  { path: '/computational-persuasion', type: 'computational_persuasion', prompt: 'Apply computational persuasion models.' },
  { path: '/counter-narrative', type: 'counter_narrative', prompt: 'Generate counter-narratives for hostile narratives.' },
  { path: '/counter-intelligence', type: 'counter_intelligence', prompt: 'Monitor counter-intelligence indicators.' },
  { path: '/subliminal', type: 'subliminal_messaging', prompt: 'Design subliminal messaging strategies.' },
  { path: '/mass-formation', type: 'mass_formation', prompt: 'Analyze mass formation psychosis indicators.' },
  { path: '/memory-reconsolidation', type: 'memory_reconsolidation', prompt: 'Apply memory reconsolidation techniques.' },
  { path: '/memory-anchor', type: 'memory_anchor', prompt: 'Generate memory anchoring strategies.' },
  { path: '/premem-belief', type: 'premem_belief', prompt: 'Apply pre-memory belief modification techniques.' },
  { path: '/proportional-response', type: 'proportional_response', prompt: 'Calculate proportional response options.' },
  { path: '/reputation-defense', type: 'reputation_defense', prompt: 'Design reputation defense strategies.' },
];

for (const route of routes) {
  app.post(route.path, createWarfareHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createWarfareHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
