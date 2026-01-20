/**
 * Betrayal Likelihood Scorer
 * AGIS Phase 3 - Trust network modeling with defection risk assessment
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BetrayalRequest {
  profileId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId }: BetrayalRequest = await req.json();

    // Gather relationship data
    const [profile, messages, relationships, analyses] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('messages').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(200),
      supabase.from('relationship_scores').select('*').eq('profile_id', profileId).order('calculated_at', { ascending: false }).limit(10),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).limit(20)
    ]);

    const systemPrompt = `You are an expert in relationship psychology, trust dynamics, and betrayal prediction.
Apply research on trust betrayal, including Gottman's Four Horsemen.

Gottman's Four Horsemen (predictors of relationship dissolution):
1. Criticism - Attacking character rather than behavior
2. Contempt - Superiority, mockery, disgust
3. Defensiveness - Playing victim, counter-attacking
4. Stonewalling - Withdrawing, shutting down

Additional betrayal indicators:
- Sudden secrecy or privacy changes
- Decreased emotional investment
- Building alternative support networks
- Distancing language patterns
- Inconsistency between words and actions
- Declining reciprocity
- Increased criticism of the relationship
- Future planning exclusion

Analyze all data for betrayal risk indicators and trust trajectory.

Return JSON:
{
  "trustAssessment": {
    "currentTrustScore": 0-1,
    "trustTrajectory": "increasing/stable/declining",
    "trustHistory": ["key trust events"],
    "vulnerabilityLevel": 0-1
  },
  "gottmanAnalysis": {
    "criticism": {
      "detected": true/false,
      "severity": 0-1,
      "examples": ["example1"],
      "frequency": "rare/occasional/frequent"
    },
    "contempt": {
      "detected": true/false,
      "severity": 0-1,
      "examples": ["example1"],
      "frequency": "rare/occasional/frequent"
    },
    "defensiveness": {
      "detected": true/false,
      "severity": 0-1,
      "examples": ["example1"],
      "frequency": "rare/occasional/frequent"
    },
    "stonewalling": {
      "detected": true/false,
      "severity": 0-1,
      "examples": ["example1"],
      "frequency": "rare/occasional/frequent"
    },
    "overallRisk": 0-1
  },
  "betrayalPrediction": {
    "defectionProbability": 0-1,
    "warningSignsDetected": ["sign1", "sign2"],
    "predictedTriggers": ["what might cause betrayal"],
    "timelineEstimate": "when betrayal most likely",
    "typeOfBetrayal": "emotional/professional/financial/other",
    "confidenceLevel": 0-1
  },
  "loyaltyIndicators": {
    "positiveSignals": ["loyalty signal 1"],
    "protectiveFactors": ["what keeps them loyal"],
    "investmentLevel": 0-1,
    "alternativeOptions": "low/medium/high"
  },
  "riskMitigation": {
    "recommendedActions": ["action1", "action2"],
    "monitoringFocus": ["what to watch"],
    "relationshipRepairs": ["how to strengthen bond"],
    "contingencyPlanning": ["if betrayal occurs"]
  }
}`;

    const userPrompt = `Analyze betrayal likelihood and trust dynamics:

Contact: ${profile.data?.full_name || 'Unknown'}
Relationship Type: ${profile.data?.relationship_type || 'Unknown'}
Relationship Duration: ${profile.data?.created_at ? `Since ${new Date(profile.data.created_at).toLocaleDateString()}` : 'Unknown'}

Recent Communications (${messages.data?.length || 0} messages):
${messages.data?.slice(0, 30).map(m => `[${m.direction}] ${m.content?.substring(0, 150)}`).join('\n') || 'No messages'}

Relationship Scores:
${relationships.data?.map(r => `- Score: ${r.overall_score}, Trend: ${r.trend}`).join('\n') || 'No scores'}

Previous Analyses:
${analyses.data?.slice(0, 5).map(a => `- ${a.analysis_type}: ${JSON.stringify(a.result).substring(0, 200)}`).join('\n') || 'No analyses'}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'betrayal-likelihood-scorer',
      profileId,
      temperature: 0.5,
    });

    const prediction = parseAIJson(aiResponse.content, {
      trustAssessment: { currentTrustScore: 0.5, trustTrajectory: 'stable' },
      gottmanAnalysis: { overallRisk: 0.3 },
      betrayalPrediction: { defectionProbability: 0.3, warningSignsDetected: [] },
      loyaltyIndicators: { positiveSignals: [] },
      riskMitigation: { recommendedActions: [] }
    });

    // Store the prediction
    await supabase.from('betrayal_predictions').insert({
      user_id: user.id,
      profile_id: profileId,
      trust_score: prediction.trustAssessment.currentTrustScore,
      loyalty_indicators: prediction.loyaltyIndicators.positiveSignals,
      defection_probability: prediction.betrayalPrediction.defectionProbability,
      warning_signs: prediction.betrayalPrediction.warningSignsDetected,
      gottman_horsemen: prediction.gottmanAnalysis,
      predicted_triggers: prediction.betrayalPrediction.predictedTriggers,
      defection_timeline: prediction.betrayalPrediction.timelineEstimate,
      relationship_stress_score: prediction.gottmanAnalysis.overallRisk,
      protective_factors: prediction.loyaltyIndicators.protectiveFactors,
      risk_mitigation: prediction.riskMitigation.recommendedActions
    });

    // Also persist to ai_analyses for section availability detection
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: profileId,
      analysis_type: 'betrayal_likelihood',
      result: prediction,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      prediction,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Betrayal scorer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
