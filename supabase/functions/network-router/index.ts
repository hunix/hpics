/**
 * Network Domain Router (v4.0.0)
 * Consolidates ~20 network analysis functions.
 * @module network-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('network-router');

function createNetworkHandler(analysisType: string, prompt: string) {
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
          { role: 'system', content: `You are a network intelligence analyst. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'network'}` },
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
  { path: '/graph', type: 'network_graph', prompt: 'Analyze network graph structure, centrality, and clusters.' },
  { path: '/deep', type: 'network_deep', prompt: 'Deep network analysis with hidden connections.' },
  { path: '/intelligence', type: 'network_intelligence', prompt: 'Network intelligence assessment.' },
  { path: '/community', type: 'community_detection', prompt: 'Detect communities and sub-groups.' },
  { path: '/power', type: 'power_network', prompt: 'Map power dynamics and influence hierarchies.' },
  { path: '/exploitation', type: 'network_exploitation', prompt: 'Map network exploitation opportunities.' },
  { path: '/resilience', type: 'network_resilience', prompt: 'Assess network resilience to disruption.' },
  { path: '/brokerage', type: 'network_brokerage', prompt: 'Identify brokerage positions and structural holes.' },
  { path: '/cascade', type: 'network_cascade', prompt: 'Model information cascade through network.' },
  { path: '/influence-propagation', type: 'influence_propagation', prompt: 'Model influence propagation patterns.' },
  { path: '/social-graph', type: 'social_graph', prompt: 'Predict social graph evolution.' },
  { path: '/shadow-networks', type: 'shadow_networks', prompt: 'Detect hidden shadow network connections.' },
  { path: '/shadow-analyzer', type: 'shadow_analysis', prompt: 'Analyze shadow network dynamics.' },
  { path: '/link-predictor', type: 'link_prediction', prompt: 'Predict future link formation.' },
  { path: '/sheaf-influence', type: 'sheaf_influence', prompt: 'Map sheaf neural influence patterns.' },
  { path: '/relationship-scores', type: 'relationship_scores', prompt: 'Calculate multi-dimensional relationship scores.' },
  { path: '/link-identities', type: 'identity_linking', prompt: 'Link social identities across platforms.' },
];

for (const route of routes) {
  app.post(route.path, createNetworkHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createNetworkHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
