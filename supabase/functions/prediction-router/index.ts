/**
 * Prediction Domain Router (v4.0.0)
 * Consolidates ~25 prediction edge functions.
 * @module prediction-router
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createRouter, getRouterContext, withHandler } from '../_shared/router.ts';
import type { Context } from 'https://deno.land/x/hono@v3.12.0/mod.ts';

const app = createRouter('prediction-router');

function createPredictionHandler(predictionType: string, domain: string, prompt: string) {
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
          { role: 'system', content: `You are a predictive analytics engine. ${prompt}\n\nPROFILE: ${JSON.stringify(profileRes.data)}\nCONTEXT: ${JSON.stringify(body)}\n\nRespond with JSON including probability scores and confidence intervals.` },
          { role: 'user', content: `Generate ${predictionType} prediction for ${profileId || 'general context'}` },
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
    let prediction: Record<string, unknown>;
    try {
      const m = content.match(/\{[\s\S]*\}/);
      prediction = m ? JSON.parse(m[0]) : { raw: content };
    } catch { prediction = { raw: content }; }

    if (profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId, profile_id: profileId, analysis_type: predictionType,
        result: prediction, generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

      await supabase.from('unified_prediction_store').upsert({
        user_id: userId, profile_id: profileId,
        prediction_domain: domain, prediction_type: predictionType,
        prediction, probability: (prediction.probability as number) || null,
      }, { onConflict: 'user_id,profile_id,prediction_type' }).catch(() => {});
    }

    return c.json({ success: true, profileId, predictionType, prediction, timestamp: new Date().toISOString() });
  });
}

const routes: Array<{ path: string; type: string; domain: string; prompt: string }> = [
  { path: '/churn', type: 'churn_prediction', domain: 'behavioral', prompt: 'Predict churn likelihood with contributing factors.' },
  { path: '/predict-churn', type: 'churn', domain: 'behavioral', prompt: 'Calculate churn probability score.' },
  { path: '/predict-churn-enhanced', type: 'churn_enhanced', domain: 'behavioral', prompt: 'Enhanced churn prediction with intervention recommendations.' },
  { path: '/behavioral-scenarios', type: 'behavioral_scenarios', domain: 'behavioral', prompt: 'Generate behavioral scenario predictions with probability trees.' },
  { path: '/relationship-trajectory', type: 'relationship_trajectory', domain: 'behavioral', prompt: 'Predict relationship trajectory over 30/60/90 days.' },
  { path: '/contact-needs', type: 'contact_needs', domain: 'behavioral', prompt: 'Predict upcoming contact needs and requirements.' },
  { path: '/contact-preferences', type: 'contact_preferences', domain: 'behavioral', prompt: 'Predict communication preferences and optimal approaches.' },
  { path: '/context', type: 'context_prediction', domain: 'behavioral', prompt: 'Predict contextual factors affecting next interaction.' },
  { path: '/risks', type: 'risk_prediction', domain: 'behavioral', prompt: 'Predict risks across relationship, professional, and personal domains.' },
  { path: '/life-sequence', type: 'life_sequence', domain: 'temporal', prompt: 'Predict life event sequences and transitions.' },
  { path: '/fortune-trajectory', type: 'fortune_trajectory', domain: 'financial', prompt: 'Predict financial and career trajectory.' },
  { path: '/cascade', type: 'cascade_prediction', domain: 'network', prompt: 'Predict cascade effects of actions through network.' },
  { path: '/cascade-virality', type: 'cascade_virality', domain: 'network', prompt: 'Predict virality and cascade spread patterns.' },
  { path: '/collective-behavior', type: 'collective_behavior', domain: 'network', prompt: 'Predict collective behavior patterns in groups.' },
  { path: '/bayesian-intent', type: 'bayesian_intent', domain: 'behavioral', prompt: 'Apply Bayesian network for intent inference.' },
  { path: '/bayesian-intention', type: 'bayesian_intention', domain: 'behavioral', prompt: 'Bayesian intention prediction with evidence updating.' },
  { path: '/mdp-behavior', type: 'mdp_behavior', domain: 'behavioral', prompt: 'Apply Markov Decision Process for behavior prediction.' },
  { path: '/precognitive', type: 'precognitive_pattern', domain: 'temporal', prompt: 'Detect precognitive patterns indicating future events.' },
  { path: '/calibration', type: 'prediction_calibration', domain: 'behavioral', prompt: 'Calibrate prediction models against actual outcomes.' },
  { path: '/doctrine', type: 'predictive_doctrine', domain: 'behavioral', prompt: 'Apply predictive doctrine for strategic forecasting.' },
  { path: '/opportunity', type: 'opportunity_prediction', domain: 'financial', prompt: 'Predict opportunities based on pattern analysis.' },
  { path: '/trajectory', type: 'trajectory_prediction', domain: 'behavioral', prompt: 'Predict behavioral trajectory with inflection points.' },
  { path: '/psychoagent-cascade', type: 'psychoagent_cascade', domain: 'behavioral', prompt: 'Predict psychological cascade effects.' },
  { path: '/investment', type: 'investment_opportunity', domain: 'financial', prompt: 'Predict investment opportunities and timing.' },
  { path: '/future-timeline', type: 'future_timeline', domain: 'temporal', prompt: 'Generate probabilistic future timeline.' },
];

for (const route of routes) {
  app.post(route.path, createPredictionHandler(route.type, route.domain, route.prompt));
}

app.post('/', withHandler(async (c: Context) => {
  const body = c.get('body') as Record<string, unknown>;
  const routePath = body._route as string;
  if (!routePath) return c.json({ error: 'Missing _route' }, 400);
  const route = routes.find(r => r.path === routePath);
  if (!route) return c.json({ error: `Unknown route: ${routePath}` }, 404);
  return createPredictionHandler(route.type, route.domain, route.prompt)(c);
}));

serve(app.fetch);
