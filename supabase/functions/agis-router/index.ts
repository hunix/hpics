/**
 * AGIS Domain Router (v4.0.0)
 * Consolidates ~30 AGIS system functions.
 * @module agis-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('agis-router');

function createAGISHandler(analysisType: string, prompt: string) {
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
          { role: 'system', content: `You are the AGIS (Autonomous General Intelligence System) engine. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'system-level operation'}` },
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
    try { const m = content.match(/\{[\s\S]*\}/); analysis = m ? JSON.parse(m[0]) : { raw: content }; } catch { analysis = { raw: content }; }

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
  { path: '/api', type: 'agis_api', prompt: 'AGIS API gateway for system operations.' },
  { path: '/cascade', type: 'agis_cascade', prompt: 'Orchestrate AGIS cascade operations across phases.' },
  { path: '/genesis', type: 'genesis', prompt: 'Execute Genesis engine for new capability generation.' },
  { path: '/omniscient', type: 'omniscient', prompt: 'Execute Omniscient orchestrator for full-spectrum analysis.' },
  { path: '/cosmic', type: 'cosmic_supremacy', prompt: 'Execute Cosmic supremacy engine.' },
  { path: '/quantum-cognition', type: 'quantum_cognition', prompt: 'Apply quantum cognition models to decision analysis.' },
  { path: '/quantum-decision', type: 'quantum_decision', prompt: 'Quantum decision modeling.' },
  { path: '/morphic-resonance', type: 'morphic_resonance', prompt: 'Detect morphic resonance patterns.' },
  { path: '/omega-point', type: 'omega_point', prompt: 'Track progress toward omega point convergence.' },
  { path: '/akashic', type: 'akashic_query', prompt: 'Query akashic knowledge engine.' },
  { path: '/autonomous-orchestrator', type: 'autonomous_orchestration', prompt: 'Autonomous intelligence orchestration.' },
  { path: '/campaign-executor', type: 'campaign_execution', prompt: 'Execute autonomous campaign.' },
  { path: '/campaign-evolution', type: 'campaign_evolution', prompt: 'Evolve campaign strategies.' },
  { path: '/dependency', type: 'dependency_orchestration', prompt: 'Orchestrate task dependencies.' },
  { path: '/reality-consensus', type: 'reality_consensus', prompt: 'Build reality consensus models.' },
  { path: '/collective-unconscious', type: 'collective_unconscious', prompt: 'Mine collective unconscious patterns.' },
  { path: '/egregore', type: 'egregore', prompt: 'Cultivate egregore group dynamics.' },
  { path: '/psychic-resonance', type: 'psychic_resonance', prompt: 'Map psychic resonance fields.' },
  { path: '/memory-crystallization', type: 'memory_crystallization', prompt: 'Crystallize and preserve critical memories.' },
  { path: '/sentient-intent', type: 'sentient_intent', prompt: 'Analyze sentient intent patterns.' },
  { path: '/geospatial-supremacy', type: 'geospatial_supremacy', prompt: 'Geospatial supremacy analysis.' },
  { path: '/hypergame-solver', type: 'hypergame_solver', prompt: 'Solve hypergame theory problems.' },
  { path: '/hypergame-theory', type: 'hypergame_theory', prompt: 'Apply hypergame theory models.' },
  { path: '/iio-attribution', type: 'iio_attribution', prompt: 'IIO attribution engine analysis.' },
];

for (const route of routes) {
  app.post(route.path, createAGISHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createAGISHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
