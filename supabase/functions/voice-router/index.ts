/**
 * Voice Domain Router (v4.0.0)
 * Consolidates ~12 voice analysis functions.
 * @module voice-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('voice-router');

function createVoiceHandler(analysisType: string, prompt: string) {
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
          { role: 'system', content: `You are a voice and linguistic analysis specialist. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'audio input'}` },
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
  { path: '/recording', type: 'voice_recording', prompt: 'Process and analyze voice recording.' },
  { path: '/analysis-runner', type: 'voice_analysis', prompt: 'Run comprehensive voice analysis pipeline.' },
  { path: '/batch', type: 'voice_batch', prompt: 'Process batch of voice recordings.' },
  { path: '/comprehensive', type: 'voice_comprehensive', prompt: 'Comprehensive voice analysis with all modalities.' },
  { path: '/deception', type: 'linguistic_deception', prompt: 'Detect deception through linguistic analysis.' },
  { path: '/stress', type: 'linguistic_stress', prompt: 'Detect stress through voice and language patterns.' },
  { path: '/stylometric', type: 'stylometric', prompt: 'Stylometric analysis of writing and speech patterns.' },
  { path: '/fingerprinter', type: 'stylometric_fingerprint', prompt: 'Generate stylometric fingerprint for authorship.' },
  { path: '/audio-burst', type: 'audio_burst', prompt: 'Analyze audio burst patterns.' },
  { path: '/multi-party-deception', type: 'multi_party_deception', prompt: 'Detect deception in multi-party conversations.' },
  { path: '/multimodal-deception', type: 'multimodal_deception', prompt: 'Multimodal deception analysis (voice + text + facial).' },
];

for (const route of routes) {
  app.post(route.path, createVoiceHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createVoiceHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
