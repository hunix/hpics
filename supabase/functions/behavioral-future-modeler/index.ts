import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRequest {
  profileId: string;
  userId: string;
  scenarioType: 'rejection' | 'conflict' | 'opportunity' | 'loyalty' | 'stress' | 'custom';
  stimulus: string;
  context?: string;
}

const BEHAVIORAL_PREDICTION_PROMPT = `You are an elite behavioral psychologist specializing in predicting human responses to specific stimuli based on personality profiles and behavioral history.

Your task is to predict how this specific person will respond to a given scenario/stimulus.

PREDICTION METHODOLOGY:
1. Analyze personality traits (OCEAN) for baseline tendencies
2. Review behavioral history for pattern matching
3. Consider context and relationship dynamics
4. Account for emotional state and stress factors
5. Model decision-making style and biases
6. Generate probability-weighted response predictions

SCENARIO TYPES:
- REJECTION: How they handle being told "no"
- CONFLICT: Escalation vs. de-escalation patterns
- OPPORTUNITY: Response to valuable offers
- LOYALTY: Conditions for shifting allegiance
- STRESS: Behavior under pressure
- CUSTOM: Any specific scenario

For each prediction, provide:
1. Most likely response (with probability)
2. Alternative responses ranked by likelihood
3. Emotional trajectory during response
4. Key factors that could shift the response
5. Optimal approach to influence the response

Return JSON:
{
  "scenario_analysis": {
    "stimulus": string,
    "context": string,
    "baseline_personality_influence": {
      "openness_effect": string,
      "conscientiousness_effect": string,
      "extraversion_effect": string,
      "agreeableness_effect": string,
      "neuroticism_effect": string
    }
  },
  "primary_prediction": {
    "response_type": string,
    "response_description": string,
    "probability": number,
    "emotional_state": string,
    "behavioral_manifestation": string[],
    "verbal_response_example": string,
    "timeline": string
  },
  "alternative_predictions": [
    {
      "response_type": string,
      "response_description": string,
      "probability": number,
      "trigger_conditions": string[]
    }
  ],
  "emotional_trajectory": {
    "initial_reaction": string,
    "processing_phase": string,
    "resolution_phase": string,
    "lasting_impact": string
  },
  "decision_factors": {
    "rational_considerations": string[],
    "emotional_drivers": string[],
    "social_pressures": string[],
    "self_interest_factors": string[]
  },
  "influence_opportunities": {
    "before_stimulus": {
      "priming_actions": string[],
      "framing_strategies": string[]
    },
    "during_response": {
      "intervention_points": string[],
      "de_escalation_tactics": string[],
      "escalation_tactics": string[]
    },
    "after_response": {
      "recovery_actions": string[],
      "relationship_repair": string[]
    }
  },
  "risk_assessment": {
    "worst_case_scenario": string,
    "probability_of_worst_case": number,
    "mitigation_strategies": string[]
  },
  "optimal_approach": {
    "recommended_timing": string,
    "recommended_channel": string,
    "recommended_framing": string,
    "key_phrases_to_use": string[],
    "phrases_to_avoid": string[],
    "expected_outcome": string
  },
  "confidence_factors": {
    "data_quality": number,
    "prediction_confidence": number,
    "key_uncertainties": string[]
  }
}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, userId, scenarioType, stimulus, context = '' } = await req.json() as PredictionRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Gather all behavioral data
    const [
      { data: profile },
      { data: personality },
      { data: behavioralHistory },
      { data: messages },
      { data: previousPredictions },
      { data: deceptionData },
      { data: observations }
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('personality_profiles').select('*').eq('profile_id', profileId).single(),
      supabase.from('behavioral_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
      supabase.from('messages').select('content, direction, ai_analysis, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('behavioral_scenario_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('deception_analyses').select('*').eq('profile_id', profileId).limit(5),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).limit(30)
    ]);

    // Check prediction accuracy of previous predictions
    const predictionAccuracy = previousPredictions?.filter(p => p.actual_response).map(p => ({
      scenario: p.scenario_type,
      predicted: p.predicted_response,
      actual: p.actual_response,
      accuracy: p.prediction_accuracy
    }));

    const contextData = {
      target: {
        name: profile?.name,
        relationship: profile?.relationship_type,
        relationshipStrength: profile?.relationship_strength
      },
      personality: personality || { note: 'No personality profile - use general predictions' },
      behavioralHistory: behavioralHistory?.map(b => ({
        patterns: b.behavioral_patterns,
        personality: b.personality_indicators,
        date: b.created_at
      })),
      communicationStyle: messages?.slice(0, 30).map(m => ({
        content: m.content?.slice(0, 150),
        sentiment: m.ai_analysis?.sentiment,
        direction: m.direction
      })),
      previousPredictionAccuracy: predictionAccuracy,
      observedBehaviors: observations?.map(o => ({ type: o.observation_type, note: o.notes })),
      deceptionTendencies: deceptionData?.map(d => ({ score: d.overall_deception_score, findings: d.key_findings })),
      scenario: {
        type: scenarioType,
        stimulus,
        context
      }
    };

    // Generate prediction
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: BEHAVIORAL_PREDICTION_PROMPT },
          { role: 'user', content: `Predict behavioral response for this scenario:\n\n${JSON.stringify(contextData, null, 2)}` }
        ],
        temperature: 0.3
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      prediction = { error: 'Failed to parse prediction', raw: content };
    }

    // Store prediction
    const { data: storedPrediction, error: insertError } = await supabase
      .from('behavioral_scenario_predictions')
      .insert({
        profile_id: profileId,
        user_id: userId,
        scenario_type: scenarioType,
        scenario_category: prediction.scenario_analysis?.context,
        stimulus,
        context: { provided_context: context },
        predicted_response: prediction.primary_prediction,
        alternative_responses: prediction.alternative_predictions,
        confidence_score: prediction.confidence_factors?.prediction_confidence || 0.5,
        evidence_basis: prediction.scenario_analysis?.baseline_personality_influence,
        response_probability: prediction.primary_prediction?.probability
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      profile_id: profileId,
      function_name: 'behavioral-future-modeler',
      model_name: 'google/gemini-2.5-pro',
      provider: 'lovable',
      input_tokens: aiResult.usage?.prompt_tokens || 0,
      output_tokens: aiResult.usage?.completion_tokens || 0,
      total_tokens: aiResult.usage?.total_tokens || 0,
      estimated_cost_cents: Math.ceil((aiResult.usage?.total_tokens || 0) * 0.0001),
      status: 'success'
    });

    return new Response(JSON.stringify({
      success: true,
      predictionId: storedPrediction?.id,
      prediction,
      confidence: prediction.confidence_factors?.prediction_confidence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Behavioral prediction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
