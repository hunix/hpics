/**
 * Biometric Domain Router (v4.0.0)
 * Consolidates ~30 biometric analysis functions.
 * @module biometric-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('biometric-router');

function createBiometricHandler(analysisType: string, prompt: string) {
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
          { role: 'system', content: `You are a biometric analysis specialist. ${prompt}\n\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON.` },
          { role: 'user', content: `Execute ${analysisType} for ${profileId || 'input data'}` },
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
  { path: '/face-extract', type: 'facial_biometrics', prompt: 'Extract facial biometric features and landmarks.' },
  { path: '/face-multiview', type: 'facial_multiview', prompt: 'Process multi-view facial analysis.' },
  { path: '/voice-extract', type: 'voice_biometrics', prompt: 'Extract voice biometric features.' },
  { path: '/voice-advanced', type: 'voice_advanced', prompt: 'Advanced voice analysis with emotional markers.' },
  { path: '/body-extract', type: 'body_biometrics', prompt: 'Extract body proportion biometrics.' },
  { path: '/handwriting', type: 'handwriting_biometrics', prompt: 'Analyze handwriting biometric patterns.' },
  { path: '/signature', type: 'signature_biometrics', prompt: 'Analyze signature dynamics and authenticity.' },
  { path: '/analyze-facial', type: 'facial_analysis', prompt: 'Comprehensive facial analysis.' },
  { path: '/analyze-vocal', type: 'vocal_analysis', prompt: 'Comprehensive vocal analysis.' },
  { path: '/body-language', type: 'body_language', prompt: 'Analyze body language patterns and cues.' },
  { path: '/gait', type: 'gait_analysis', prompt: 'Analyze gait patterns for identification.' },
  { path: '/keystroke', type: 'keystroke_dynamics', prompt: 'Analyze keystroke dynamics for authentication.' },
  { path: '/match', type: 'biometric_match', prompt: 'Match biometric samples against database.' },
  { path: '/mosaic-match', type: 'mosaic_biometric_match', prompt: 'Cross-modal biometric matching.' },
  { path: '/cross-identify', type: 'cross_identification', prompt: 'Cross-identify individuals across biometric modalities.' },
  { path: '/local-match', type: 'local_biometric_match', prompt: 'Local biometric matching on device.' },
  { path: '/behavioral-fusion', type: 'biometric_behavioral_fusion', prompt: 'Fuse biometric and behavioral data.' },
  { path: '/gated-fusion', type: 'gated_biological_fusion', prompt: 'Gated biological fusion analysis.' },
  { path: '/gaze', type: 'gaze_pattern', prompt: 'Analyze gaze patterns and attention distribution.' },
  { path: '/pupillometry', type: 'pupillometry', prompt: 'Analyze pupil dilation for cognitive load and deception.' },
  { path: '/microexpression', type: 'microexpression', prompt: 'Detect and analyze microexpressions.' },
  { path: '/microexpression-timeline', type: 'microexpression_timeline', prompt: 'Map microexpression timeline during interaction.' },
  { path: '/facial-embedding', type: 'facial_embedding', prompt: 'Generate facial embedding vectors.' },
  { path: '/enroll-faces', type: 'face_enrollment', prompt: 'Enroll faces from tagged images.' },
  { path: '/face-scan-job', type: 'face_scan', prompt: 'Execute face scan job.' },
  { path: '/face-regions', type: 'face_regions', prompt: 'Process face regions for analysis.' },
  { path: '/realtime-face', type: 'realtime_face_recognition', prompt: 'Real-time face recognition.' },
  { path: '/learn-patterns', type: 'biometric_learning', prompt: 'Learn biometric patterns for improved matching.' },
  { path: '/deepfake', type: 'deepfake_detection', prompt: 'Detect deepfake indicators in media.' },
  { path: '/subvocalization', type: 'subvocalization', prompt: 'Detect subvocalization patterns.' },
];

for (const route of routes) {
  app.post(route.path, createBiometricHandler(route.type, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createBiometricHandler(route.type, route.prompt)(c);
}));

serve(app.fetch);
