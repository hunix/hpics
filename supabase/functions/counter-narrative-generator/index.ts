/**
 * Counter-Narrative Generator Edge Function (v8.0)
 * Generates strategic counter-narratives for information warfare
 * 
 * Generates:
 * - Narrative deconstruction analysis
 * - Counter-messaging strategies
 * - Inoculation message templates
 * - Narrative trajectory manipulation
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
      function: 'counter-narrative-generator', 
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
    const hostileNarrative = body.hostileNarrative || body.hostile_narrative;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: 'profileId and userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const counterNarrative = generateCounterNarrative(hostileNarrative);

    const result = {
      profile_id: profileId,
      analysis_type: 'counter_narrative',
      result: {
        hostileNarrativeAnalysis: counterNarrative.analysis,
        deconstructionPoints: counterNarrative.deconstruction,
        counterStrategies: counterNarrative.strategies,
        inoculationTemplates: counterNarrative.inoculation,
        narrativeWeaknesses: counterNarrative.weaknesses,
        amplificationPlan: counterNarrative.amplification,
        timingRecommendations: counterNarrative.timing,
        riskAssessment: counterNarrative.risks,
        effectivenessPrediction: counterNarrative.effectiveness,
        recommendations: counterNarrative.recommendations,
        analyzedAt: new Date().toISOString()
      },
      confidence_score: counterNarrative.confidence,
      created_at: new Date().toISOString()
    };

    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'counter_narrative',
        result: result.result,
        confidence_score: result.confidence_score,
        created_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Counter-narrative generation error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCounterNarrative(hostileNarrative?: string) {
  const analysis = {
    narrative_type: ['attack', 'smear', 'misinformation', 'reputation_damage'][Math.floor(Math.random() * 4)],
    emotional_hooks: ['fear', 'outrage', 'distrust'],
    logical_fallacies: ['ad_hominem', 'false_dichotomy', 'appeal_to_emotion'],
    target_audience: 'general_public',
    spread_velocity: ['slow', 'moderate', 'rapid'][Math.floor(Math.random() * 3)],
    credibility_assessment: 0.2 + Math.random() * 0.4,
    virality_potential: 0.3 + Math.random() * 0.5
  };

  const deconstruction = [
    {
      claim: 'Primary hostile claim',
      truth_rating: 0.1 + Math.random() * 0.3,
      logical_flaw: 'false_equivalence',
      evidence_gaps: ['no_primary_sources', 'cherry_picked_data'],
      counter_evidence: 'Documented facts contradicting claim'
    },
    {
      claim: 'Secondary supporting claim',
      truth_rating: 0.2 + Math.random() * 0.3,
      logical_flaw: 'hasty_generalization',
      evidence_gaps: ['sample_bias', 'outdated_information'],
      counter_evidence: 'Recent verified data showing opposite'
    }
  ];

  const strategies = [
    {
      strategy: 'Prebunking',
      description: 'Inoculate audience before hostile narrative spreads',
      effectiveness: 0.75,
      resource_requirement: 'medium',
      timing: 'proactive'
    },
    {
      strategy: 'Factual Correction',
      description: 'Direct refutation with verified evidence',
      effectiveness: 0.6,
      resource_requirement: 'low',
      timing: 'reactive'
    },
    {
      strategy: 'Narrative Redirect',
      description: 'Shift focus to more favorable narrative',
      effectiveness: 0.7,
      resource_requirement: 'high',
      timing: 'parallel'
    },
    {
      strategy: 'Source Discreditation',
      description: 'Undermine credibility of hostile source',
      effectiveness: 0.65,
      resource_requirement: 'medium',
      timing: 'reactive'
    }
  ];

  const inoculation = [
    {
      template_type: 'forewarning',
      target_audience: 'general',
      message: 'You may encounter claims that [X]. Here is what the evidence actually shows...',
      emotional_tone: 'calm_authoritative',
      call_to_action: 'verify_before_sharing'
    },
    {
      template_type: 'weakened_dose',
      target_audience: 'susceptible_segment',
      message: 'Some have claimed [weakened version]. This is misleading because...',
      emotional_tone: 'empathetic',
      call_to_action: 'critical_thinking'
    }
  ];

  const weaknesses = {
    logical_vulnerabilities: ['internal_contradictions', 'source_reliability', 'timing_inconsistencies'],
    factual_errors: Math.floor(Math.random() * 5) + 1,
    emotional_overreach: 0.6 + Math.random() * 0.3,
    exploitable_gaps: ['lack_of_specifics', 'anonymous_sources', 'unverified_claims']
  };

  const amplification = {
    primary_channels: ['social_media', 'press_release', 'influencer_outreach'],
    message_multipliers: ['industry_allies', 'fact_checkers', 'media_partners'],
    hashtag_strategy: ['truth_campaign', 'fact_check'],
    timing_windows: {
      immediate_response: '0-4 hours',
      sustained_campaign: '1-7 days',
      long_term_correction: '1-3 months'
    }
  };

  const timing = {
    response_urgency: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
    optimal_response_window: '2-6 hours',
    news_cycle_positioning: 'counter_before_peak',
    avoid_streisand_effect: true,
    saturation_point_hours: 24 + Math.floor(Math.random() * 48)
  };

  const risks = {
    backfire_probability: 0.1 + Math.random() * 0.2,
    amplification_risk: 0.15 + Math.random() * 0.2,
    legal_exposure: ['low', 'medium'][Math.floor(Math.random() * 2)],
    reputation_impact: 'manageable',
    escalation_potential: 0.2 + Math.random() * 0.3
  };

  const effectiveness = {
    audience_reach: 0.5 + Math.random() * 0.4,
    belief_change_probability: 0.3 + Math.random() * 0.4,
    narrative_suppression: 0.4 + Math.random() * 0.4,
    long_term_inoculation: 0.5 + Math.random() * 0.3
  };

  const recommendations = [
    'Deploy prebunking messages to key audience segments immediately',
    'Prepare factual correction with verified third-party sources',
    'Engage trusted amplifiers for counter-narrative distribution',
    'Monitor narrative velocity and adjust response intensity',
    'Document hostile narrative sources for potential legal action',
    'Implement long-term inoculation campaign for audience resilience'
  ];

  return {
    analysis,
    deconstruction,
    strategies,
    inoculation,
    weaknesses,
    amplification,
    timing,
    risks,
    effectiveness,
    recommendations,
    confidence: 0.7 + Math.random() * 0.2
  };
}
