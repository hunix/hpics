import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Common scenarios to predict
const PREDICTION_SCENARIOS = [
  'response_to_criticism',
  'behavior_under_pressure',
  'reaction_to_financial_stress',
  'response_to_personal_request',
  'behavior_when_proven_wrong',
  'reaction_to_unexpected_news',
  'handling_conflict',
  'response_to_praise',
  'behavior_in_group_settings',
  'reaction_to_rejection',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  try {
    const body = await req.clone().json();
    if (body?.healthCheck === true) {
      return new Response(JSON.stringify({ ok: true, function: 'predict-behavioral-scenarios', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch { /* not JSON or no body - continue normally */ }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profile_id, scenarios, custom_scenario } = await req.json();

    if (!profile_id) {
      return new Response(JSON.stringify({ error: 'profile_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Predicting behavioral scenarios for profile ${profile_id}`);

    // Fetch psychological profile and behavioral data
    const [
      { data: psychProfile },
      { data: behavioralAnalyses },
      { data: profile },
      { data: communications }
    ] = await Promise.all([
      supabase
        .from('psychological_profiles')
        .select('*')
        .eq('profile_id', profile_id)
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profile_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', profile_id)
        .single(),
      supabase
        .from('communications')
        .select('*')
        .eq('profile_id', profile_id)
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(50),
    ]);

    const contactName = profile ? `${profile.first_name} ${profile.last_name || ''}`.trim() : 'This person';

    // Build context for AI
    const context = buildPredictionContext(psychProfile, behavioralAnalyses || [], communications || []);

    // Determine which scenarios to predict
    const scenariosToPredict = custom_scenario 
      ? [custom_scenario]
      : (scenarios && scenarios.length > 0 ? scenarios : PREDICTION_SCENARIOS.slice(0, 5));

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI not configured', success: false }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);

    // Call AI for predictions
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.defaultModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert behavioral psychologist specializing in predicting human behavior based on personality profiles and historical patterns.

Given a person's psychological profile and behavioral history, predict how they would likely respond to specific scenarios.

For each scenario, provide:
1. Primary predicted response (most likely behavior)
2. Confidence level (0-100)
3. Alternative possible responses with probabilities
4. Key factors influencing the prediction
5. Recommended approach for handling the situation
6. Warning signs to watch for
7. De-escalation strategies if needed

Base predictions on established psychological models (Big Five, attachment theory, etc.) and the provided behavioral data.

Return JSON only with this structure:
{
  "predictions": [
    {
      "scenario": "scenario_name",
      "scenario_description": "What the scenario involves",
      "predicted_response": {
        "primary_behavior": "Description of most likely behavior",
        "emotional_state": "Primary emotional response",
        "timeline": "How quickly they'll respond",
        "intensity": 0-100
      },
      "confidence": 0-100,
      "confidence_factors": ["factor1", "factor2"],
      "alternative_responses": [
        {
          "behavior": "Alternative behavior",
          "probability": 0-100,
          "trigger_conditions": "What would cause this alternative"
        }
      ],
      "influencing_factors": [
        {
          "factor": "Factor name",
          "impact": "positive|negative|neutral",
          "weight": 0-100
        }
      ],
      "recommended_approach": {
        "opening": "How to initiate",
        "key_phrases": ["phrase1", "phrase2"],
        "tone": "Recommended communication tone",
        "timing": "Best time/context",
        "avoid": ["What not to say/do"]
      },
      "warning_signs": ["sign1", "sign2"],
      "de_escalation": ["strategy1", "strategy2"],
      "historical_evidence": ["Evidence from their history supporting this prediction"]
    }
  ],
  "overall_predictability": 0-100,
  "personality_volatility": "low|moderate|high",
  "context_sensitivity": "How much context affects their behavior"
}`
          },
          {
            role: 'user',
            content: `Predict ${contactName}'s behavior in these scenarios: ${scenariosToPredict.join(', ')}

## Psychological Profile:
${context.psychProfile}

## Behavioral History:
${context.behavioralHistory}

## Communication Patterns:
${context.communicationPatterns}`
          }
        ],
        temperature: 0.4,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error('AI prediction failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    // Parse AI response
    let predictions = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        predictions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Failed to parse AI predictions:', e);
    }

    // Store predictions
    if (predictions) {
      await supabase.from('behavioral_predictions').insert({
        profile_id,
        user_id: user.id,
        prediction_type: 'scenario_predictions',
        prediction_value: predictions,
        confidence_score: predictions.overall_predictability || 70,
        features_used: {
          scenarios: scenariosToPredict,
          has_psych_profile: !!psychProfile,
          behavioral_analyses_count: behavioralAnalyses?.length || 0,
          communications_count: communications?.length || 0,
        },
        valid_from: new Date().toISOString(),
      });
    }

    // Log AI usage with config model
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id,
      function_name: 'predict-behavioral-scenarios',
      model_name: aiConfig.defaultModel,
      provider: 'lovable',
      estimated_cost_cents: 2,
      status: 'completed',
      input_tokens: aiData.usage?.prompt_tokens,
      output_tokens: aiData.usage?.completion_tokens,
    });

    return new Response(JSON.stringify({
      success: true,
      predictions: predictions || { error: 'Could not generate predictions' },
      scenarios_analyzed: scenariosToPredict,
      data_sources: {
        has_psychological_profile: !!psychProfile,
        behavioral_analyses: behavioralAnalyses?.length || 0,
        communications: communications?.length || 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Behavioral prediction error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildPredictionContext(
  psychProfile: any,
  behavioralAnalyses: any[],
  communications: any[]
): { psychProfile: string; behavioralHistory: string; communicationPatterns: string } {
  // Psychological profile summary
  let psychProfileSummary = 'No psychological profile available';
  if (psychProfile) {
    const parts = [];
    
    if (psychProfile.personality_ocean) {
      const ocean = psychProfile.personality_ocean;
      parts.push(`Big Five: O=${ocean.openness?.score || '?'}, C=${ocean.conscientiousness?.score || '?'}, E=${ocean.extraversion?.score || '?'}, A=${ocean.agreeableness?.score || '?'}, N=${ocean.neuroticism?.score || '?'}`);
    }
    
    if (psychProfile.attachment_style) {
      parts.push(`Attachment: ${psychProfile.attachment_style.primary_style || 'unknown'}`);
    }
    
    if (psychProfile.emotional_intelligence) {
      parts.push(`EQ: ${psychProfile.emotional_intelligence.overall_eq || '?'}/100`);
    }
    
    if (psychProfile.dark_triad) {
      parts.push(`Dark Triad Risk: ${psychProfile.dark_triad.overall_risk_level || 'unknown'}`);
    }
    
    if (psychProfile.flags?.red_flags?.length > 0) {
      parts.push(`Red Flags: ${psychProfile.flags.red_flags.map((f: any) => f.title).join(', ')}`);
    }
    
    psychProfileSummary = parts.join('\n');
  }

  // Behavioral history summary
  let behavioralHistory = 'No behavioral analyses available';
  if (behavioralAnalyses && behavioralAnalyses.length > 0) {
    const patterns: string[] = [];
    behavioralAnalyses.forEach(analysis => {
      if (analysis.behavioral_patterns) {
        Object.entries(analysis.behavioral_patterns).forEach(([key, value]) => {
          if (value) patterns.push(`${key}: ${JSON.stringify(value)}`);
        });
      }
    });
    behavioralHistory = patterns.slice(0, 10).join('\n') || 'No patterns extracted';
  }

  // Communication patterns
  let communicationPatterns = 'No communication history available';
  if (communications && communications.length > 0) {
    const types = new Map<string, number>();
    communications.forEach(comm => {
      const type = comm.communication_type || 'unknown';
      types.set(type, (types.get(type) || 0) + 1);
    });
    
    const typeBreakdown = Array.from(types.entries())
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
    
    communicationPatterns = `Total: ${communications.length}, Types: ${typeBreakdown}`;
  }

  return {
    psychProfile: psychProfileSummary,
    behavioralHistory,
    communicationPatterns,
  };
}
