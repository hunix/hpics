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
  { path: '/analyze-facial', type: 'facial_analysis', prompt: `Perform FACS-based facial analysis. Return JSON with:
    "actionUnits": [{"au":"AU1","name":"Inner Brow Raise","intensity":0-5,"timestamp_ms":0}],
    "emotions": {"primary":"anger|contempt|disgust|fear|happiness|sadness|surprise","compound":"bittersweet|awe|etc","valence":-1to1,"arousal":0to1},
    "duchenne_markers": {"genuine_smile":bool,"orbicularis_oculi":0-1,"zygomaticus_major":0-1},
    "asymmetry": {"overall":0-1,"left_dominant_regions":[],"right_dominant_regions":[],"genuineness":0-1},
    "microexpressions": [{"emotion":"","duration_ms":0,"au_combination":"","incongruent_with":"","timestamp_ms":0}],
    "temporal_emotion_timeline": [{"timestamp_ms":0,"dominant_emotion":"","intensity":0-1,"au_codes":[]}],
    "stress_indicators": {"brow_furrow_frequency":0,"lip_compression_count":0,"jaw_clench_episodes":0,"overall_stress":0-1}` },
  { path: '/analyze-vocal', type: 'vocal_analysis', prompt: `Perform forensic-grade vocal analysis. Return JSON with:
    "fundamental_frequency": {"f0_mean_hz":0,"f0_std_hz":0,"f0_range":[0,0],"baseline_deviation_pct":0},
    "voice_quality": {"jitter_pct":0,"shimmer_pct":0,"hnr_db":0,"nhr":0},
    "speech_rate": {"syllables_per_sec":0,"articulation_rate":0,"timeline":[{"segment":0,"rate":0}]},
    "pause_analysis": {"total_pause_duration_sec":0,"mean_pause_ms":0,"filled_pauses":{"um":0,"uh":0,"er":0},"silent_pauses_count":0,"pause_before_key_words":[]},
    "formant_stress": {"f1_shift_hz":0,"f2_shift_hz":0,"emotional_arousal":0-1,"cognitive_load_indicator":0-1},
    "micro_tremor": {"frequency_hz":0,"amplitude":0,"presence":bool,"lippold_tremor":bool},
    "deception_vocal_markers": [{"type":"pitch_spike|rate_change|filler_cluster","timestamp_ms":0,"severity":0-1,"context":""}]` },
  { path: '/body-language', type: 'body_language', prompt: `Perform structured body language analysis. Return JSON with:
    "posture": {"openness_score":0-1,"lean_direction":"forward|backward|neutral","shifts":[{"timestamp_ms":0,"type":"","magnitude":0-1}]},
    "gestures": {"illustrators_per_min":0,"self_adaptors":[{"body_part":"","frequency":0,"stress_indicator":bool}],"regulators":[],"emblems":[]},
    "proxemics": {"distance_changes":[{"timestamp_ms":0,"direction":"closer|farther"}],"territorial_markers":[]},
    "gaze": {"eye_contact_pct":0-1,"aversion_events":[{"timestamp_ms":0,"direction":"","duration_ms":0,"context":""}],"blink_rate_per_min":0},
    "comfort_indicators": {"freeze_responses":[],"flight_cues":[],"fight_cues":[],"pacifying_behaviors":[]},
    "rapport_signals": {"mirroring_score":0-1,"synchrony":0-1,"barrier_objects":[]}` },
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
