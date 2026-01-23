import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InterceptRequest {
  userId: string;
  profileId: string;
  trajectoryType: 'relationship' | 'trust' | 'influence' | 'risk';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, profileId, trajectoryType } = await req.json() as InterceptRequest;

    // Gather trajectory data
    const [
      { data: profile },
      { data: trustHistory },
      { data: interactionTrend },
      { data: predictions },
      { data: interventions }
    ] = await Promise.all([
      supabase.from('profiles')
        .select('*')
        .eq('id', profileId)
        .single(),
      supabase.from('trust_scores')
        .select('*')
        .eq('profile_id', profileId)
        .order('calculated_at', { ascending: false })
        .limit(30),
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('behavioral_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('proactive_actions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    const INTERCEPT_PROMPT = `You are a trajectory intercept engine. Analyze relationship/trust/influence trajectories and determine optimal intervention points.

Profile: ${JSON.stringify(profile)}
Trust History: ${JSON.stringify(trustHistory || [])}
Interaction Trend: ${JSON.stringify(interactionTrend || [])}
Behavioral Predictions: ${JSON.stringify(predictions || [])}
Past Interventions: ${JSON.stringify(interventions || [])}
Trajectory Type: ${trajectoryType}

Analyze trajectory and identify intercept opportunities in JSON format:
{
  "trajectoryAnalysis": {
    "currentState": {
      "value": number,
      "trend": "ascending|descending|stable|volatile",
      "velocity": number,
      "acceleration": number
    },
    "projectedState": {
      "30days": number,
      "90days": number,
      "180days": number
    },
    "criticalThresholds": {
      "upper": number,
      "lower": number,
      "current distance": number
    }
  },
  "interceptPoints": [
    {
      "interceptId": "string",
      "timing": "timestamp",
      "type": "correction|acceleration|stabilization|reversal",
      "targetValue": number,
      "currentProjection": number,
      "intervention": {
        "action": "string",
        "intensity": 1-10,
        "duration": "string",
        "resources": "string"
      },
      "successProbability": 0-1,
      "failureConsequences": "string"
    }
  ],
  "optimalIntercept": {
    "interceptId": "string",
    "reasoning": "string",
    "timing": "immediate|scheduled|conditional",
    "triggerConditions": ["string"]
  },
  "alternativeTrajectories": [
    {
      "scenario": "string",
      "probability": 0-1,
      "outcome": "string",
      "interceptRequired": boolean
    }
  ],
  "noInterventionForecast": {
    "finalState": number,
    "timeToThreshold": "string or null",
    "risks": ["string"]
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: INTERCEPT_PROMPT },
          { role: 'user', content: `Analyze ${trajectoryType} trajectory for ${profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profileId : profileId}` }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = { raw: content, parseError: true };
    }

    // Store trajectory intercept data
    await supabase.from('trajectory_intercepts').insert({
      user_id: userId,
      profile_id: profileId,
      trajectory_type: trajectoryType,
      current_trajectory: analysis.trajectoryAnalysis,
      intercept_points: analysis.interceptPoints,
      recommended_intercept: analysis.optimalIntercept,
      no_action_forecast: analysis.noInterventionForecast,
      status: 'analyzed'
    });

    return new Response(JSON.stringify({
      success: true,
      profileId,
      analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Trajectory intercept error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
