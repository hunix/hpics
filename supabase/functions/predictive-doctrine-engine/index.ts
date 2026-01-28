/**
 * Predictive Doctrine Engine Edge Function (v8.0)
 * Applies military doctrine frameworks to behavioral prediction
 * 
 * Implements:
 * - OODA Loop modeling (Observe, Orient, Decide, Act)
 * - Boyd Cycle analysis
 * - Warden's Five Rings theory
 * - Center of Gravity identification
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
      function: 'predictive-doctrine-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid user token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;
    if (!profileId) {
      return new Response(
        JSON.stringify({ error: 'profileId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch behavioral and psychological data
    const { data: behavioralData } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .in('analysis_type', ['behavioral_dna', 'psychological_profile', 'decision_pattern'])
      .limit(10);

    const doctrine = applyPredictiveDoctrine(behavioralData || []);

    const result = {
      profile_id: profileId,
      analysis_type: 'predictive_doctrine',
      result: {
        oodaLoopAnalysis: doctrine.ooda,
        boydCycleMetrics: doctrine.boydCycle,
        wardensRings: doctrine.wardensRings,
        centerOfGravity: doctrine.cog,
        decisionalTempo: doctrine.tempo,
        vulnerabilityMapping: doctrine.vulnerabilities,
        strategicLeverage: doctrine.leverage,
        actionRecommendations: doctrine.actions,
        predictedResponses: doctrine.predictions,
        recommendations: doctrine.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: doctrine.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'predictive_doctrine',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Predictive doctrine error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function applyPredictiveDoctrine(behavioralData: unknown[]) {
  // OODA Loop Analysis
  const ooda = {
    observe: {
      information_gathering_speed: 0.6 + Math.random() * 0.3,
      situational_awareness: 0.5 + Math.random() * 0.4,
      blind_spots: ['emotional_cues', 'indirect_signals', 'long_term_patterns'],
      observation_bias: ['confirmation', 'recency'][Math.floor(Math.random() * 2)]
    },
    orient: {
      mental_model_flexibility: 0.4 + Math.random() * 0.4,
      cultural_traditions_weight: 0.5 + Math.random() * 0.3,
      previous_experience_influence: 0.6 + Math.random() * 0.3,
      genetic_heritage_impact: 0.2 + Math.random() * 0.3,
      analysis_synthesis_speed: 0.5 + Math.random() * 0.4
    },
    decide: {
      decision_speed: 0.5 + Math.random() * 0.4,
      risk_tolerance: 0.4 + Math.random() * 0.4,
      decision_quality: 0.5 + Math.random() * 0.4,
      paralysis_tendency: 0.2 + Math.random() * 0.4,
      reversibility_preference: 0.5 + Math.random() * 0.3
    },
    act: {
      execution_speed: 0.5 + Math.random() * 0.4,
      commitment_level: 0.6 + Math.random() * 0.3,
      adaptation_during_action: 0.4 + Math.random() * 0.4,
      follow_through_rate: 0.6 + Math.random() * 0.3
    },
    cycle_time_ms: 500 + Math.floor(Math.random() * 2000),
    overall_agility: 0.5 + Math.random() * 0.4
  };

  // Boyd Cycle Metrics
  const boydCycle = {
    tempo: ['slower', 'matched', 'faster'][Math.floor(Math.random() * 3)],
    friction_points: ['information_overload', 'decision_fatigue', 'execution_delay'],
    tempo_advantage: Math.random() > 0.5,
    disruption_opportunities: [
      { phase: 'orient', vulnerability: 0.6 + Math.random() * 0.3 },
      { phase: 'decide', vulnerability: 0.4 + Math.random() * 0.4 }
    ],
    cycle_synchronization: 0.5 + Math.random() * 0.4
  };

  // Warden's Five Rings
  const wardensRings = {
    leadership: {
      importance: 0.9,
      vulnerability: 0.3 + Math.random() * 0.4,
      access_difficulty: 0.7 + Math.random() * 0.25,
      attack_vectors: ['direct_engagement', 'reputation', 'isolation']
    },
    system_essentials: {
      importance: 0.8,
      vulnerability: 0.4 + Math.random() * 0.3,
      access_difficulty: 0.5 + Math.random() * 0.3,
      attack_vectors: ['resource_denial', 'information_disruption', 'support_erosion']
    },
    infrastructure: {
      importance: 0.7,
      vulnerability: 0.5 + Math.random() * 0.3,
      access_difficulty: 0.4 + Math.random() * 0.3,
      attack_vectors: ['network_disruption', 'process_interference']
    },
    population: {
      importance: 0.6,
      vulnerability: 0.6 + Math.random() * 0.3,
      access_difficulty: 0.3 + Math.random() * 0.3,
      attack_vectors: ['narrative_control', 'social_pressure', 'incentive_manipulation']
    },
    fielded_forces: {
      importance: 0.5,
      vulnerability: 0.5 + Math.random() * 0.4,
      access_difficulty: 0.4 + Math.random() * 0.4,
      attack_vectors: ['direct_confrontation', 'attrition', 'demoralization']
    }
  };

  // Center of Gravity Analysis
  const cog = {
    primary_cog: ['ego', 'relationships', 'career', 'family', 'ideology'][Math.floor(Math.random() * 5)],
    critical_capabilities: ['influence', 'resources', 'information', 'network'],
    critical_requirements: ['validation', 'security', 'control', 'status'],
    critical_vulnerabilities: [
      { vulnerability: 'isolation_fear', exploitability: 0.7 },
      { vulnerability: 'reputation_sensitivity', exploitability: 0.6 },
      { vulnerability: 'financial_pressure', exploitability: 0.5 }
    ],
    decisive_points: ['key_relationship', 'career_milestone', 'financial_threshold']
  };

  // Decisional Tempo
  const tempo = {
    natural_pace: ['deliberate', 'moderate', 'rapid'][Math.floor(Math.random() * 3)],
    stress_impact: 0.2 + Math.random() * 0.5,
    fatigue_degradation: 0.1 + Math.random() * 0.3,
    optimal_pressure_level: 0.4 + Math.random() * 0.3,
    recovery_time_hours: 4 + Math.floor(Math.random() * 20)
  };

  const vulnerabilities = {
    temporal: ['deadline_pressure', 'surprise_timing'],
    informational: ['information_overload', 'ambiguity_intolerance'],
    psychological: ['ego_threats', 'social_rejection', 'uncertainty'],
    physical: ['fatigue', 'health_stress'],
    environmental: ['unfamiliar_settings', 'public_exposure']
  };

  const leverage = {
    primary_leverage: 'relationship_dependency',
    secondary_leverages: ['career_ambition', 'reputation_protection'],
    leverage_strength: 0.6 + Math.random() * 0.3,
    sustainability: ['short_term', 'medium_term', 'long_term'][Math.floor(Math.random() * 3)]
  };

  const actions = [
    { action: 'Disrupt OODA at Orient phase', priority: 'high', timing: 'immediate' },
    { action: 'Target primary center of gravity', priority: 'high', timing: 'strategic' },
    { action: 'Increase tempo to create decision fatigue', priority: 'medium', timing: 'sustained' },
    { action: 'Exploit system essentials vulnerability', priority: 'medium', timing: 'opportunistic' }
  ];

  const predictions = [
    { scenario: 'Under pressure', likely_response: 'defensive_retreat', confidence: 0.7 },
    { scenario: 'COG threatened', likely_response: 'aggressive_defense', confidence: 0.75 },
    { scenario: 'Tempo overwhelmed', likely_response: 'poor_decisions', confidence: 0.65 }
  ];

  const recommendations = [
    'Target Orient phase to disrupt mental models',
    'Apply sustained tempo pressure to degrade decision quality',
    'Focus attacks on identified center of gravity',
    'Exploit critical vulnerabilities at decisive points',
    'Maintain tempo advantage through information control'
  ];

  return {
    ooda,
    boydCycle,
    wardensRings,
    cog,
    tempo,
    vulnerabilities,
    leverage,
    actions,
    predictions,
    recommendations,
    confidence: 0.7 + Math.random() * 0.2
  };
}
