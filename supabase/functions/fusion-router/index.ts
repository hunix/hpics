/**
 * Fusion Domain Router (v4.0.0)
 * Consolidates ~20 data fusion functions.
 * @module fusion-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('fusion-router');

// Analysis type normalization mapping
const VALID_ANALYSIS_TYPES: Record<string, string> = {
  'dempster_shafer': 'dempster_shafer_fusion',
  'entity_resolution': 'entity_resolution',
  'sentiment_cascade': 'sentiment_cascade',
  'graph_rag': 'graph_rag',
  'digital_twin': 'digital_twin',
  'behavioral_twin': 'behavioral_digital_twin',
  'counterfactual': 'counterfactual',
  'multimodal_fuser': 'multimodal_fusion',
  'cross_modal_realtime': 'cross_modal_realtime',
  'cross_modal_deception': 'cross_modal_deception',
  'cross_modal_deception_v2': 'cross_modal_deception_v2',
  'cross_modal_correlator': 'cross_modal_correlation',
  'geospatial': 'geospatial_fusion',
  'hardware_fusion': 'hardware_intelligence_fusion',
  'financial_synthesis': 'financial_synthesis',
  'sop_distillation': 'sop_distillation',
};

function createFusionHandler(analysisType: string, prompt: string) {
  return withHandler(async (c: Context) => {
    const { userId, profileId, supabase, body } = getRouterContext(c);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return c.json({ error: 'AI not configured' }, 500);

    const model = (body.model as string) || 'google/gemini-3-flash-preview';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `You are a multi-source data fusion specialist. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} fusion for ${profileId || 'target'}` },
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
  { path: '/dempster-shafer', type: 'dempster_shafer_fusion', prompt: 'Apply Dempster-Shafer evidence fusion theory.' },
  { path: '/entity-resolution', type: 'entity_resolution', prompt: 'Resolve entities across data sources.' },
  { path: '/sentiment-cascade', type: 'sentiment_cascade', prompt: 'Predict sentiment cascade propagation.' },
  { path: '/graph-rag', type: 'graph_rag', prompt: 'Graph-based RAG for knowledge synthesis.' },
  { path: '/digital-twin', type: 'digital_twin', prompt: 'Generate behavioral digital twin model.' },
  { path: '/behavioral-twin', type: 'behavioral_digital_twin', prompt: 'Create behavioral digital twin simulation.' },
  { path: '/counterfactual', type: 'counterfactual', prompt: 'Generate counterfactual scenarios.' },
  { path: '/multimodal-fuser', type: 'multimodal_fusion', prompt: 'Fuse multimodal attention data.' },
  { path: '/cross-modal-realtime', type: 'cross_modal_realtime', prompt: 'Real-time cross-modal fusion.' },
  { path: '/cross-modal-deception', type: 'cross_modal_deception', prompt: 'Cross-modal deception detection fusion.' },
  { path: '/cross-modal-deception-v2', type: 'cross_modal_deception_v2', prompt: 'Enhanced cross-modal deception v2.' },
  { path: '/cross-modal-correlator', type: 'cross_modal_correlation', prompt: 'Correlate cross-modal signals.' },
  { path: '/geospatial', type: 'geospatial_fusion', prompt: 'Fuse geospatial and communication data.' },
  { path: '/hardware-fusion', type: 'hardware_intelligence_fusion', prompt: 'Fuse hardware sensor intelligence.' },
  { path: '/financial-synthesis', type: 'financial_synthesis', prompt: 'Synthesize financial document intelligence.' },
  { path: '/sop-distillation', type: 'sop_distillation', prompt: 'Distill standard operating procedures from data.' },
];

for (const route of routes) {
  app.post(route.path, createFusionHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createFusionHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
