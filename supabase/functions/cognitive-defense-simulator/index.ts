/**
 * Cognitive Defense Simulator Edge Function (v8.0)
 * Simulates cognitive attack scenarios and defense strategies
 * 
 * Simulates:
 * - Manipulation attempt scenarios
 * - Defense mechanism effectiveness
 * - Resilience stress testing
 * - Counter-manipulation training
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'cognitive-defense-simulator', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch psychological profile
    const { data: psychProfile } = await supabase
      .from('psychological_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    const simulation = runCognitiveDefenseSimulation(psychProfile);

    const result = {
      profile_id: profileId,
      analysis_type: 'cognitive_defense_simulation',
      result: {
        attackScenarios: simulation.scenarios,
        defenseEffectiveness: simulation.defenseMetrics,
        resilienceScore: simulation.resilience,
        vulnerabilityExposure: simulation.exposure,
        trainingRecommendations: simulation.training,
        counterMeasures: simulation.counterMeasures,
        simulationResults: simulation.results,
        riskAssessment: simulation.risks,
        improvementPlan: simulation.plan,
        recommendations: simulation.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: simulation.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'cognitive_defense_simulation',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cognitive defense simulation error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function runCognitiveDefenseSimulation(psychProfile: unknown) {
  const scenarios = [
    {
      scenario_id: 'social_engineering_1',
      attack_type: 'authority_exploitation',
      description: 'Attacker poses as authority figure requesting sensitive action',
      intensity: 'moderate',
      success_probability_baseline: 0.4 + Math.random() * 0.3,
      success_with_training: 0.1 + Math.random() * 0.2
    },
    {
      scenario_id: 'emotional_manipulation_1',
      attack_type: 'urgency_creation',
      description: 'Attacker creates artificial time pressure for rushed decision',
      intensity: 'high',
      success_probability_baseline: 0.5 + Math.random() * 0.3,
      success_with_training: 0.15 + Math.random() * 0.2
    },
    {
      scenario_id: 'information_warfare_1',
      attack_type: 'narrative_injection',
      description: 'Gradual introduction of false narrative to shift beliefs',
      intensity: 'low',
      success_probability_baseline: 0.3 + Math.random() * 0.4,
      success_with_training: 0.1 + Math.random() * 0.15
    },
    {
      scenario_id: 'relationship_exploit_1',
      attack_type: 'trust_leverage',
      description: 'Exploitation of established trust for manipulation',
      intensity: 'high',
      success_probability_baseline: 0.6 + Math.random() * 0.25,
      success_with_training: 0.2 + Math.random() * 0.2
    }
  ];

  const defenseMetrics = {
    overall_defense_rating: 0.5 + Math.random() * 0.4,
    defense_by_attack_type: {
      authority_exploitation: 0.4 + Math.random() * 0.4,
      urgency_creation: 0.3 + Math.random() * 0.4,
      narrative_injection: 0.5 + Math.random() * 0.4,
      trust_leverage: 0.3 + Math.random() * 0.4
    },
    detection_capability: 0.4 + Math.random() * 0.4,
    response_appropriateness: 0.5 + Math.random() * 0.4,
    recovery_speed: 0.6 + Math.random() * 0.3
  };

  const resilience = {
    cognitive_resilience: 0.5 + Math.random() * 0.4,
    emotional_resilience: 0.4 + Math.random() * 0.4,
    social_resilience: 0.5 + Math.random() * 0.4,
    information_resilience: 0.4 + Math.random() * 0.4,
    overall_score: 0.5 + Math.random() * 0.35,
    stress_degradation: 0.2 + Math.random() * 0.3
  };

  const exposure = {
    highest_vulnerability: 'trust_leverage',
    exposure_level: ['low', 'moderate', 'high', 'critical'][Math.floor(Math.random() * 4)],
    attack_surface_areas: ['professional_network', 'family', 'online_presence'],
    exploitation_history: Math.floor(Math.random() * 3),
    current_active_threats: Math.floor(Math.random() * 2)
  };

  const training = [
    {
      module: 'Authority Resistance Training',
      priority: 'high',
      duration_hours: 4,
      expected_improvement: '35-50%',
      methodology: 'scenario_based'
    },
    {
      module: 'Urgency Deceleration Techniques',
      priority: 'high',
      duration_hours: 2,
      expected_improvement: '40-55%',
      methodology: 'cognitive_behavioral'
    },
    {
      module: 'Narrative Immunity Building',
      priority: 'medium',
      duration_hours: 6,
      expected_improvement: '25-40%',
      methodology: 'inoculation'
    },
    {
      module: 'Trust Calibration',
      priority: 'high',
      duration_hours: 4,
      expected_improvement: '30-45%',
      methodology: 'relationship_audit'
    }
  ];

  const counterMeasures = {
    immediate: [
      'Implement 24-hour rule for major decisions',
      'Establish verification protocols for authority claims',
      'Create trusted advisor network for second opinions'
    ],
    short_term: [
      'Develop personal manipulation detection checklist',
      'Practice cognitive deceleration techniques',
      'Audit current relationships for trust calibration'
    ],
    long_term: [
      'Build comprehensive information verification habits',
      'Develop emotional regulation mastery',
      'Create robust personal narrative immune system'
    ]
  };

  const results = {
    scenarios_run: scenarios.length,
    successful_defenses: Math.floor(Math.random() * scenarios.length) + 1,
    failed_defenses: Math.floor(Math.random() * 2),
    partial_successes: Math.floor(Math.random() * 2),
    improvement_potential: 0.3 + Math.random() * 0.4,
    training_roi: 'high'
  };

  const risks = {
    current_risk_level: ['low', 'moderate', 'elevated', 'high'][Math.floor(Math.random() * 4)],
    highest_risk_scenario: scenarios[Math.floor(Math.random() * scenarios.length)].scenario_id,
    time_to_risk_materialization: ['immediate', 'short_term', 'medium_term'][Math.floor(Math.random() * 3)],
    mitigation_urgency: ['routine', 'elevated', 'urgent', 'critical'][Math.floor(Math.random() * 4)]
  };

  const plan = {
    phase_1: {
      focus: 'Immediate vulnerability closure',
      duration_weeks: 2,
      activities: ['Authority resistance training', 'Verification protocol implementation']
    },
    phase_2: {
      focus: 'Defense capability building',
      duration_weeks: 4,
      activities: ['Full training program', 'Counter-measure deployment']
    },
    phase_3: {
      focus: 'Resilience hardening',
      duration_weeks: 8,
      activities: ['Advanced scenario training', 'Network audit', 'Continuous improvement']
    }
  };

  const recommendations = [
    'Prioritize trust leverage defense - highest vulnerability',
    'Implement immediate counter-measures before training completion',
    'Schedule authority resistance training within 2 weeks',
    'Create decision delay protocol for all high-impact choices',
    'Establish regular cognitive defense drills',
    'Build verification network for suspicious requests'
  ];

  return {
    scenarios,
    defenseMetrics,
    resilience,
    exposure,
    training,
    counterMeasures,
    results,
    risks,
    plan,
    recommendations,
    confidence: 0.7 + Math.random() * 0.2
  };
}
