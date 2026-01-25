/**
 * Cognitive Effect Orchestrator Edge Function
 * 
 * Implements the "Doctrine of Cognitive Effect" for strategic ambiguity operations.
 * Based on GCHQ "Responsible Cyber Power" framework (2025).
 * 
 * Features:
 * - NATO "House Model" cognitive effects (biological, psychological, social)
 * - Narrative synchronization timing
 * - Ambiguity window calculation
 * - Effect cascade modeling
 * 
 * @version 7.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CognitiveEffectRequest {
  profileId: string;
  effectType: 'distrust' | 'morale_decrease' | 'decision_paralysis' | 'compliance' | 'confusion' | 'isolation';
  targetContext?: {
    individualOrGroup: 'individual' | 'group' | 'organization';
    currentMorale?: number; // 0-1
    trustLevel?: number; // 0-1
    informationDependency?: 'low' | 'medium' | 'high';
    decisionCycle?: 'slow' | 'medium' | 'fast';
  };
  availableChannels?: string[];
  constraints?: {
    maxDuration?: number; // hours
    legalBoundaries?: string[];
    ethicalBoundaries?: string[];
    detectionTolerance?: 'none' | 'low' | 'medium' | 'high';
  };
}

interface CognitiveEffectLevel {
  biological: number;    // Nervous system effects (stress, fatigue, attention)
  psychological: number; // Interpretation/framing effects
  social: number;        // Cohesion/legitimacy effects
}

interface AmbiguityWindow {
  start: Date;
  end: Date;
  optimalTiming: string;
  durationHours: number;
  rationale: string;
}

interface CognitiveEffectPlan {
  effectType: string;
  levels: CognitiveEffectLevel;
  phases: {
    phase: number;
    name: string;
    duration: string;
    actions: string[];
    expectedOutcome: string;
  }[];
  ambiguityWindow: AmbiguityWindow;
  narrativeSynchronization: {
    primaryNarrative: string;
    supportingNarratives: string[];
    channelSequence: string[];
    timing: string;
  };
  cascadeModel: {
    primaryEffect: string;
    secondaryEffects: string[];
    tertiaryEffects: string[];
    feedback_loops: string[];
  };
  riskAssessment: {
    detectionRisk: number;
    blowbackRisk: number;
    escalationRisk: number;
    mitigations: string[];
  };
  metrics: {
    successIndicators: string[];
    failureIndicators: string[];
    measurementMethods: string[];
  };
}

// Effect type configurations based on NATO House Model
const EFFECT_CONFIGS: Record<string, {
  levels: CognitiveEffectLevel;
  primaryMechanism: string;
  phases: string[];
}> = {
  distrust: {
    levels: { biological: 0.3, psychological: 0.8, social: 0.7 },
    primaryMechanism: 'Undermining perceived reliability of information sources',
    phases: ['seed_doubt', 'amplify_inconsistencies', 'offer_alternatives', 'consolidate'],
  },
  morale_decrease: {
    levels: { biological: 0.6, psychological: 0.7, social: 0.5 },
    primaryMechanism: 'Reducing motivation and confidence in success',
    phases: ['highlight_failures', 'question_leadership', 'emphasize_costs', 'normalize_defeatism'],
  },
  decision_paralysis: {
    levels: { biological: 0.7, psychological: 0.8, social: 0.4 },
    primaryMechanism: 'Overloading decision-making capacity',
    phases: ['information_flood', 'contradict_signals', 'time_pressure', 'consequence_uncertainty'],
  },
  compliance: {
    levels: { biological: 0.4, psychological: 0.6, social: 0.8 },
    primaryMechanism: 'Creating conditions where compliance is the easiest option',
    phases: ['establish_authority', 'demonstrate_consequences', 'offer_easy_path', 'reinforce'],
  },
  confusion: {
    levels: { biological: 0.5, psychological: 0.9, social: 0.5 },
    primaryMechanism: 'Disrupting situational awareness and understanding',
    phases: ['inject_noise', 'blur_categories', 'shift_frames', 'maintain_uncertainty'],
  },
  isolation: {
    levels: { biological: 0.4, psychological: 0.6, social: 0.9 },
    primaryMechanism: 'Severing connections to support networks',
    phases: ['identify_dependencies', 'introduce_friction', 'offer_alternatives', 'normalize_separation'],
  },
};

function calculateAmbiguityWindow(
  effectType: string,
  targetContext?: CognitiveEffectRequest['targetContext'],
  constraints?: CognitiveEffectRequest['constraints']
): AmbiguityWindow {
  const now = new Date();
  
  // Base duration depends on effect type
  let baseDurationHours = 24;
  if (effectType === 'decision_paralysis') baseDurationHours = 12;
  if (effectType === 'distrust') baseDurationHours = 72;
  if (effectType === 'isolation') baseDurationHours = 168;

  // Adjust based on target decision cycle
  if (targetContext?.decisionCycle === 'fast') baseDurationHours *= 0.5;
  if (targetContext?.decisionCycle === 'slow') baseDurationHours *= 2;

  // Apply constraints
  if (constraints?.maxDuration) {
    baseDurationHours = Math.min(baseDurationHours, constraints.maxDuration);
  }

  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const end = new Date(start.getTime() + baseDurationHours * 60 * 60 * 1000);

  // Optimal timing rationale
  let optimalTiming = 'Standard operational hours';
  if (effectType === 'decision_paralysis') {
    optimalTiming = 'During peak decision-making periods';
  } else if (effectType === 'distrust') {
    optimalTiming = 'After a trust-relevant event or communication';
  } else if (effectType === 'morale_decrease') {
    optimalTiming = 'Following a setback or during low-energy periods';
  }

  return {
    start,
    end,
    optimalTiming,
    durationHours: baseDurationHours,
    rationale: `Window calculated based on ${effectType} effect dynamics and target context`,
  };
}

function generatePhases(
  effectType: string,
  config: typeof EFFECT_CONFIGS[string],
  targetContext?: CognitiveEffectRequest['targetContext']
): CognitiveEffectPlan['phases'] {
  const phaseDurations = ['2-4 hours', '4-8 hours', '8-12 hours', '12-24 hours'];
  
  return config.phases.map((phaseName, index) => {
    const phase = index + 1;
    let actions: string[] = [];
    let expectedOutcome = '';

    switch (phaseName) {
      case 'seed_doubt':
        actions = ['Introduce minor inconsistencies', 'Highlight past errors', 'Share competing narratives'];
        expectedOutcome = 'Target begins questioning previously accepted information';
        break;
      case 'amplify_inconsistencies':
        actions = ['Emphasize contradictions', 'Present conflicting expert opinions', 'Circulate alternative explanations'];
        expectedOutcome = 'Cognitive dissonance increases';
        break;
      case 'highlight_failures':
        actions = ['Document setbacks', 'Compare to successful alternatives', 'Emphasize personal costs'];
        expectedOutcome = 'Motivation begins to decline';
        break;
      case 'information_flood':
        actions = ['Increase message volume', 'Introduce complexity', 'Create time pressure'];
        expectedOutcome = 'Decision-making capacity becomes strained';
        break;
      default:
        actions = [`Execute ${phaseName.replace('_', ' ')} protocol`];
        expectedOutcome = `${phaseName.replace('_', ' ')} objective achieved`;
    }

    return {
      phase,
      name: phaseName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      duration: phaseDurations[index] || '4-8 hours',
      actions,
      expectedOutcome,
    };
  });
}

function generateNarrativeSynchronization(
  effectType: string,
  channels: string[]
): CognitiveEffectPlan['narrativeSynchronization'] {
  const narratives: Record<string, { primary: string; supporting: string[] }> = {
    distrust: {
      primary: 'Questioning the reliability of trusted sources',
      supporting: ['Alternative information sources exist', 'Past instances of misinformation', 'Hidden agendas revealed'],
    },
    morale_decrease: {
      primary: 'Current efforts are not yielding expected results',
      supporting: ['Costs exceed benefits', 'Leadership has failed before', 'Others have abandoned similar efforts'],
    },
    decision_paralysis: {
      primary: 'Any decision carries significant risks',
      supporting: ['More information is needed', 'Experts disagree', 'Timing is uncertain'],
    },
    compliance: {
      primary: 'Cooperation is the path of least resistance',
      supporting: ['Resistance has consequences', 'Others have already complied', 'Benefits of cooperation'],
    },
    confusion: {
      primary: 'The situation is more complex than it appears',
      supporting: ['Multiple valid interpretations exist', 'Context changes meaning', 'Certainty is premature'],
    },
    isolation: {
      primary: 'Existing connections may not serve your interests',
      supporting: ['Independence has value', 'Others have their own agendas', 'New connections are available'],
    },
  };

  const config = narratives[effectType] || narratives.confusion;
  
  return {
    primaryNarrative: config.primary,
    supportingNarratives: config.supporting,
    channelSequence: channels.length > 0 ? channels : ['direct_communication', 'social_media', 'third_party'],
    timing: 'Staggered deployment with 2-4 hour intervals between channels',
  };
}

function generateCascadeModel(effectType: string): CognitiveEffectPlan['cascadeModel'] {
  const cascades: Record<string, {
    secondary: string[];
    tertiary: string[];
    feedback: string[];
  }> = {
    distrust: {
      secondary: ['Increased verification behavior', 'Reduced information sharing', 'Heightened skepticism'],
      tertiary: ['Social withdrawal', 'Decreased cooperation', 'Conspiracy thinking'],
      feedback: ['Distrust begets counter-distrust', 'Verification fatigue leads to information avoidance'],
    },
    morale_decrease: {
      secondary: ['Reduced effort', 'Increased complaints', 'Risk aversion'],
      tertiary: ['Attrition', 'Passive resistance', 'Defeatism spreading'],
      feedback: ['Low morale reduces performance, further decreasing morale', 'Negative emotions are contagious'],
    },
    decision_paralysis: {
      secondary: ['Delayed actions', 'Delegation avoidance', 'Analysis paralysis'],
      tertiary: ['Opportunity costs', 'Stress accumulation', 'Default to inaction'],
      feedback: ['Inaction increases uncertainty', 'Stress impairs cognition further'],
    },
  };

  const config = cascades[effectType] || cascades.confusion || {
    secondary: ['Behavioral changes', 'Attitude shifts'],
    tertiary: ['Systemic effects', 'Long-term adaptations'],
    feedback: ['Effects may self-reinforce or attenuate over time'],
  };

  return {
    primaryEffect: effectType,
    secondaryEffects: config.secondary,
    tertiaryEffects: config.tertiary,
    feedback_loops: config.feedback,
  };
}

function assessRisks(
  effectType: string,
  constraints?: CognitiveEffectRequest['constraints']
): CognitiveEffectPlan['riskAssessment'] {
  let detectionRisk = 0.3;
  let blowbackRisk = 0.4;
  let escalationRisk = 0.2;

  // Adjust based on detection tolerance
  if (constraints?.detectionTolerance === 'none') {
    detectionRisk = 0.6; // Higher risk of failing tolerance
  } else if (constraints?.detectionTolerance === 'high') {
    detectionRisk = 0.15;
  }

  // Certain effects carry higher blowback risk
  if (effectType === 'distrust' || effectType === 'isolation') {
    blowbackRisk += 0.15;
  }

  const mitigations = [
    'Maintain plausible deniability through indirect channels',
    'Use gradual escalation to avoid detection thresholds',
    'Prepare counter-narratives for attribution',
    'Establish off-ramps if effects exceed objectives',
  ];

  if (constraints?.ethicalBoundaries && constraints.ethicalBoundaries.length > 0) {
    mitigations.push('Adhere to defined ethical constraints');
  }

  return {
    detectionRisk,
    blowbackRisk,
    escalationRisk,
    mitigations,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(
      JSON.stringify({ ok: true, function: 'cognitive-effect-orchestrator', timestamp: Date.now() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CognitiveEffectRequest = await req.json();
    const { profileId, effectType, targetContext, availableChannels, constraints } = body;

    if (!profileId || !effectType) {
      return new Response(
        JSON.stringify({ error: 'profileId and effectType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = EFFECT_CONFIGS[effectType];
    if (!config) {
      return new Response(
        JSON.stringify({ error: `Unknown effect type: ${effectType}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ambiguityWindow = calculateAmbiguityWindow(effectType, targetContext, constraints);
    const phases = generatePhases(effectType, config, targetContext);
    const narrativeSynchronization = generateNarrativeSynchronization(effectType, availableChannels || []);
    const cascadeModel = generateCascadeModel(effectType);
    const riskAssessment = assessRisks(effectType, constraints);

    const plan: CognitiveEffectPlan = {
      effectType,
      levels: config.levels,
      phases,
      ambiguityWindow,
      narrativeSynchronization,
      cascadeModel,
      riskAssessment,
      metrics: {
        successIndicators: [
          `Observable ${effectType} behavior changes`,
          'Decreased target effectiveness',
          'Increased target uncertainty',
        ],
        failureIndicators: [
          'No behavioral change detected',
          'Counter-measures implemented',
          'Attribution and exposure',
        ],
        measurementMethods: [
          'Communication analysis',
          'Behavioral observation',
          'Decision outcome tracking',
        ],
      },
    };

    // Store in cognitive_effect_operations table
    const { error: insertError } = await supabaseClient
      .from('cognitive_effect_operations')
      .insert({
        profile_id: profileId,
        user_id: user.id,
        effect_type: effectType,
        biological_level: config.levels.biological,
        psychological_level: config.levels.psychological,
        social_level: config.levels.social,
        ambiguity_window_start: ambiguityWindow.start.toISOString(),
        ambiguity_window_end: ambiguityWindow.end.toISOString(),
        narrative_synchronization_targets: narrativeSynchronization.channelSequence,
        status: 'planned',
      });

    if (insertError) {
      console.error('[cognitive-effect-orchestrator] Insert error:', insertError);
    }

    // Store in ai_analyses for fusion
    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: user.id,
        analysis_type: 'cognitive_effect',
        result: { ...plan, analysisVersion: '7.0.0', framework: 'GCHQ Responsible Cyber Power 2025' },
        generated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id,analysis_type' });

    return new Response(
      JSON.stringify({
        success: true,
        confidence: 0.75,
        payload: plan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cognitive-effect-orchestrator] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
