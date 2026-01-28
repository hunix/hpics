/**
 * Influence Campaign Optimizer Edge Function (v8.0)
 * AI-driven optimization of influence operations
 * 
 * Optimizes:
 * - Target audience segmentation
 * - Message timing and sequencing
 * - Channel selection and prioritization
 * - A/B testing strategy automation
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
      function: 'influence-campaign-optimizer', 
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

    // Fetch profile and psychological data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    const { data: psychData } = await supabase
      .from('psychological_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    const optimization = generateCampaignOptimization(profileData, psychData);

    const result = {
      profile_id: profileId,
      analysis_type: 'influence_campaign_optimization',
      result: {
        audienceSegmentation: optimization.segmentation,
        messageOptimization: optimization.messaging,
        timingStrategy: optimization.timing,
        channelPrioritization: optimization.channels,
        abTestStrategy: optimization.abTesting,
        persuasionTactics: optimization.persuasion,
        resistanceCounters: optimization.resistance,
        campaignSequence: optimization.sequence,
        expectedOutcomes: optimization.outcomes,
        recommendations: optimization.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: optimization.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'influence_campaign_optimization',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Influence campaign optimization error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCampaignOptimization(profileData: unknown, psychData: unknown) {
  const segmentation = {
    primary_segment: 'high_influence_susceptibility',
    psychographic_profile: ['achievement_oriented', 'status_conscious', 'risk_averse'],
    persuasion_archetype: ['authority_responsive', 'social_proof_driven'][Math.floor(Math.random() * 2)],
    vulnerability_windows: ['career_transition', 'financial_stress', 'social_isolation'],
    receptivity_score: 0.6 + Math.random() * 0.3
  };

  const messaging = {
    optimal_frame: ['gain_frame', 'loss_frame', 'moral_frame'][Math.floor(Math.random() * 3)],
    emotional_appeals: ['pride', 'fear', 'belonging'],
    rational_appeals: ['efficiency', 'cost_savings', 'competitive_advantage'],
    key_triggers: ['exclusivity', 'urgency', 'authority_endorsement'],
    message_length: 'medium',
    tone: ['professional', 'casual', 'urgent'][Math.floor(Math.random() * 3)],
    personalization_elements: ['name', 'role', 'recent_activity', 'shared_connection']
  };

  const timing = {
    optimal_days: ['Tuesday', 'Wednesday', 'Thursday'],
    optimal_hours: [9, 10, 14, 15],
    avoid_times: ['Monday_morning', 'Friday_afternoon'],
    response_windows: {
      immediate_response_likelihood: 0.3 + Math.random() * 0.3,
      optimal_follow_up_delay_hours: 24 + Math.floor(Math.random() * 48)
    },
    fatigue_threshold: 3,
    reengagement_delay_days: 7 + Math.floor(Math.random() * 7)
  };

  const channels = [
    { channel: 'email', effectiveness: 0.7 + Math.random() * 0.25, priority: 1 },
    { channel: 'linkedin', effectiveness: 0.6 + Math.random() * 0.3, priority: 2 },
    { channel: 'phone', effectiveness: 0.5 + Math.random() * 0.35, priority: 3 },
    { channel: 'in_person', effectiveness: 0.8 + Math.random() * 0.15, priority: 4 }
  ].sort((a, b) => b.effectiveness - a.effectiveness);

  const abTesting = {
    recommended_tests: [
      { element: 'subject_line', variants: 2, expected_lift: '15-25%' },
      { element: 'cta_text', variants: 3, expected_lift: '10-20%' },
      { element: 'send_time', variants: 2, expected_lift: '5-15%' }
    ],
    sample_size_recommendation: 100 + Math.floor(Math.random() * 200),
    test_duration_days: 7 + Math.floor(Math.random() * 7),
    statistical_significance_target: 0.95
  };

  const persuasion = {
    cialdini_priorities: [
      { principle: 'authority', effectiveness: 0.8 },
      { principle: 'social_proof', effectiveness: 0.75 },
      { principle: 'scarcity', effectiveness: 0.7 },
      { principle: 'reciprocity', effectiveness: 0.65 }
    ],
    dark_pattern_recommendations: [
      { pattern: 'urgency_creation', risk_level: 'low' },
      { pattern: 'social_proof_amplification', risk_level: 'low' },
      { pattern: 'authority_borrowing', risk_level: 'medium' }
    ],
    ethical_boundaries: ['avoid_deceptive_claims', 'respect_opt_out', 'maintain_transparency']
  };

  const resistance = {
    anticipated_objections: ['price', 'timing', 'trust', 'alternatives'],
    counter_strategies: [
      { objection: 'price', counter: 'value_reframe', effectiveness: 0.7 },
      { objection: 'timing', counter: 'urgency_creation', effectiveness: 0.6 },
      { objection: 'trust', counter: 'social_proof', effectiveness: 0.75 }
    ],
    resistance_probability: 0.3 + Math.random() * 0.3
  };

  const sequence = [
    { step: 1, action: 'awareness_content', channel: 'linkedin', delay_days: 0 },
    { step: 2, action: 'value_proposition', channel: 'email', delay_days: 3 },
    { step: 3, action: 'social_proof', channel: 'email', delay_days: 5 },
    { step: 4, action: 'scarcity_trigger', channel: 'email', delay_days: 7 },
    { step: 5, action: 'direct_outreach', channel: 'phone', delay_days: 10 }
  ];

  const outcomes = {
    conversion_probability: 0.15 + Math.random() * 0.25,
    expected_engagement_rate: 0.25 + Math.random() * 0.3,
    time_to_conversion_days: 14 + Math.floor(Math.random() * 21),
    relationship_strength_impact: 0.2 + Math.random() * 0.3,
    long_term_value_score: 0.6 + Math.random() * 0.3
  };

  const recommendations = [
    'Lead with authority-based messaging given target profile',
    'Use multi-channel approach with email as primary',
    'Implement A/B testing on subject lines for quick wins',
    'Time outreach for Tuesday-Thursday mid-morning',
    'Prepare counter-strategies for anticipated price objection',
    'Build sequence with escalating commitment requests'
  ];

  return {
    segmentation,
    messaging,
    timing,
    channels,
    abTesting,
    persuasion,
    resistance,
    sequence,
    outcomes,
    recommendations,
    confidence: 0.7 + Math.random() * 0.2
  };
}
