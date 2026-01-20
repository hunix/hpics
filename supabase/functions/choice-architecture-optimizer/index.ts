import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Choice Architecture Optimizer
 * Digital nudge engine implementing behavioral economics:
 * - Default Effect
 * - Decoy Effect (Asymmetric Dominance)
 * - Middle-Option Bias
 * - Scarcity Cues
 * - Social Proof
 * - Anchoring
 * - Loss Framing
 */

interface NudgeRequest {
  context: 'pricing' | 'decision' | 'action' | 'commitment' | 'preference';
  options: string[];
  target_option: number; // Index of option you want them to choose
  target_profile_id?: string;
  profile_biases?: {
    loss_aversion?: number;
    social_proof_sensitivity?: number;
    scarcity_response?: number;
    authority_influence?: number;
  };
}

interface NudgeStrategy {
  nudge_type: string;
  implementation: {
    option_order: string[];
    framing: Record<string, string>;
    visual_emphasis: string[];
    timing_cues: string[];
    social_proof_elements: string[];
    scarcity_elements: string[];
  };
  psychological_mechanisms: string[];
  expected_conversion_lift: number;
  ethical_rating: 'green' | 'yellow' | 'red';
}

interface DarkPattern {
  pattern_name: string;
  description: string;
  implementation: string;
  detection_difficulty: 'easy' | 'medium' | 'hard';
  effectiveness: number;
  ethical_concern: string;
}

// Nudge strategies by type
const NUDGE_STRATEGIES = {
  default_effect: {
    name: 'Default Effect',
    description: 'Pre-select the desired option',
    conversion_lift: 0.35,
    implementation: 'Set target option as pre-checked or pre-filled',
    psychological_mechanisms: ['Status quo bias', 'Effort minimization', 'Implied endorsement']
  },
  decoy_effect: {
    name: 'Decoy Effect (Asymmetric Dominance)',
    description: 'Add an inferior option that makes target look better',
    conversion_lift: 0.25,
    implementation: 'Add a clearly inferior option near target to make target seem optimal',
    psychological_mechanisms: ['Relative comparison', 'Context-dependent preferences', 'Attraction effect']
  },
  middle_option_bias: {
    name: 'Middle Option Bias',
    description: 'Position target option in the middle',
    conversion_lift: 0.20,
    implementation: 'Arrange options so target is in center position',
    psychological_mechanisms: ['Extremeness aversion', 'Compromise effect', 'Center-stage effect']
  },
  scarcity: {
    name: 'Scarcity Nudge',
    description: 'Highlight limited availability',
    conversion_lift: 0.30,
    implementation: 'Show stock levels, time limits, or exclusive access',
    psychological_mechanisms: ['Loss aversion', 'FOMO', 'Reactance theory']
  },
  social_proof: {
    name: 'Social Proof',
    description: 'Show others choosing the target option',
    conversion_lift: 0.25,
    implementation: 'Display popularity metrics, testimonials, or peer choices',
    psychological_mechanisms: ['Informational social influence', 'Bandwagon effect', 'Conformity']
  },
  anchoring: {
    name: 'Anchoring',
    description: 'Present a high reference point first',
    conversion_lift: 0.28,
    implementation: 'Show higher price/value before target to make it seem reasonable',
    psychological_mechanisms: ['Anchor-and-adjust', 'Contrast effect', 'Reference point shift']
  },
  loss_framing: {
    name: 'Loss Framing',
    description: 'Frame the choice in terms of potential losses',
    conversion_lift: 0.32,
    implementation: 'Emphasize what they would lose by not choosing, rather than what they gain',
    psychological_mechanisms: ['Loss aversion', 'Endowment effect', 'Risk aversion']
  }
};

// Dark patterns (use responsibly)
const DARK_PATTERNS: DarkPattern[] = [
  {
    pattern_name: 'Confirmshaming',
    description: 'Make the decline option guilt-inducing',
    implementation: 'Word opt-out as "No, I don\'t want to save money" instead of "No thanks"',
    detection_difficulty: 'easy',
    effectiveness: 0.15,
    ethical_concern: 'Emotional manipulation'
  },
  {
    pattern_name: 'Hidden Costs',
    description: 'Reveal additional costs late in the process',
    implementation: 'Show fees only at final checkout step',
    detection_difficulty: 'medium',
    effectiveness: 0.20,
    ethical_concern: 'Deceptive pricing'
  },
  {
    pattern_name: 'Roach Motel',
    description: 'Easy to get in, hard to get out',
    implementation: 'Simple signup, complex cancellation process',
    detection_difficulty: 'hard',
    effectiveness: 0.40,
    ethical_concern: 'User entrapment'
  },
  {
    pattern_name: 'Forced Continuity',
    description: 'Auto-continue after free trial without clear warning',
    implementation: 'Minimal notification before billing begins',
    detection_difficulty: 'medium',
    effectiveness: 0.35,
    ethical_concern: 'Unexpected charges'
  },
  {
    pattern_name: 'Misdirection',
    description: 'Draw attention away from important information',
    implementation: 'Visually emphasize benefits, minimize risks/costs',
    detection_difficulty: 'medium',
    effectiveness: 0.25,
    ethical_concern: 'Information asymmetry'
  },
  {
    pattern_name: 'Urgency',
    description: 'Create artificial time pressure',
    implementation: 'Countdown timers, "offer expires soon" messaging',
    detection_difficulty: 'easy',
    effectiveness: 0.30,
    ethical_concern: 'Rushed decision-making'
  }
];

function generateNudgeStrategy(request: NudgeRequest): NudgeStrategy {
  const { options, target_option, profile_biases = {} } = request;
  const targetOptionText = options[target_option];
  
  // Select best nudge types based on profile biases
  const nudgeTypes = [];
  
  if ((profile_biases.loss_aversion || 0.5) > 0.5) {
    nudgeTypes.push(NUDGE_STRATEGIES.loss_framing);
  }
  if ((profile_biases.social_proof_sensitivity || 0.5) > 0.5) {
    nudgeTypes.push(NUDGE_STRATEGIES.social_proof);
  }
  if ((profile_biases.scarcity_response || 0.5) > 0.5) {
    nudgeTypes.push(NUDGE_STRATEGIES.scarcity);
  }
  
  // Always include these effective nudges
  nudgeTypes.push(NUDGE_STRATEGIES.default_effect);
  nudgeTypes.push(NUDGE_STRATEGIES.anchoring);
  
  // Generate option ordering for middle-option bias if applicable
  let orderedOptions = [...options];
  if (options.length >= 3 && target_option !== Math.floor(options.length / 2)) {
    // Reorder to put target in middle
    orderedOptions = options.filter((_, i) => i !== target_option);
    const middleIndex = Math.floor(orderedOptions.length / 2);
    orderedOptions.splice(middleIndex, 0, targetOptionText);
  }
  
  // Generate framing for each option
  const framing: Record<string, string> = {};
  options.forEach((option, index) => {
    if (index === target_option) {
      framing[option] = `✨ Most Popular Choice - ${option} (Recommended)`;
    } else if (index < target_option) {
      framing[option] = `Basic: ${option}`;
    } else {
      framing[option] = `Premium: ${option}`;
    }
  });
  
  // Generate social proof elements
  const socialProofElements = [
    `${Math.floor(Math.random() * 500 + 500)} people chose this option today`,
    `★★★★★ 4.${Math.floor(Math.random() * 3 + 7)}/5 (${Math.floor(Math.random() * 1000 + 200)} reviews)`,
    `"Best decision I made" - Recent customer`,
    `92% of customers choose this option`
  ];
  
  // Generate scarcity elements
  const scarcityElements = [
    `Only ${Math.floor(Math.random() * 5 + 2)} left at this price`,
    `Offer ends in ${Math.floor(Math.random() * 12 + 1)} hours`,
    `Limited time: Save 20% today`,
    `Exclusive offer for new customers`
  ];
  
  // Calculate expected conversion lift
  const avgLift = nudgeTypes.reduce((sum, n) => sum + n.conversion_lift, 0) / nudgeTypes.length;
  
  return {
    nudge_type: nudgeTypes.map(n => n.name).join(' + '),
    implementation: {
      option_order: orderedOptions,
      framing,
      visual_emphasis: [
        `Highlight ${targetOptionText} with contrasting color`,
        `Make ${targetOptionText} slightly larger`,
        `Add "Best Value" badge to ${targetOptionText}`,
        `Use green checkmarks for ${targetOptionText} features`
      ],
      timing_cues: [
        'Show offer when user has been on page 30+ seconds',
        'Trigger exit-intent popup with final offer',
        'Display after user has viewed 3+ options'
      ],
      social_proof_elements: socialProofElements.slice(0, 3),
      scarcity_elements: scarcityElements.slice(0, 2)
    },
    psychological_mechanisms: nudgeTypes.flatMap(n => n.psychological_mechanisms),
    expected_conversion_lift: avgLift,
    ethical_rating: 'yellow' // Standard nudges are yellow
  };
}

function generateDarkPatternSuite(intensity: 'light' | 'medium' | 'aggressive'): DarkPattern[] {
  switch (intensity) {
    case 'light':
      return DARK_PATTERNS.filter(p => p.detection_difficulty === 'easy');
    case 'medium':
      return DARK_PATTERNS.filter(p => p.detection_difficulty !== 'hard');
    case 'aggressive':
      return DARK_PATTERNS;
  }
}

function generateBehavioralEconomicsReport(profile_biases: any): any {
  return {
    susceptibilities: {
      loss_aversion: {
        score: profile_biases.loss_aversion || 0.5,
        exploitation: 'Frame choices as avoiding losses rather than gaining benefits',
        example: '"Don\'t miss out" vs "Get access"'
      },
      endowment_effect: {
        score: profile_biases.endowment_effect || 0.5,
        exploitation: 'Give them something first, then threaten to take it away',
        example: 'Free trial with full features that they\'ll lose'
      },
      sunk_cost_fallacy: {
        score: profile_biases.sunk_cost || 0.5,
        exploitation: 'Remind them of past investments to encourage continued commitment',
        example: '"You\'ve already invested X hours..."'
      },
      hyperbolic_discounting: {
        score: profile_biases.hyperbolic_discounting || 0.5,
        exploitation: 'Offer immediate small rewards over larger delayed ones',
        example: 'Get $10 now vs $15 in a week'
      },
      anchoring_bias: {
        score: profile_biases.anchoring || 0.5,
        exploitation: 'Set high initial reference points',
        example: 'Show original price of $999, now $499'
      }
    },
    recommended_approach: profile_biases.loss_aversion > 0.6 
      ? 'Lead with loss framing and scarcity'
      : profile_biases.social_proof_sensitivity > 0.6
      ? 'Lead with social proof and popularity'
      : 'Use balanced approach with multiple nudges'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'choice-architecture-optimizer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceKey
    );

    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;
    
    let userId: string;
    
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        throw new Error('userId is required for service calls');
      }
    } else {
      if (!authHeader) {
        throw new Error('No authorization header');
      }
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token!);
      if (authError || !user) {
        throw new Error('Unauthorized');
      }
      userId = user.id;
    }
    const { action } = body;

    let result;

    switch (action) {
      case 'generate_nudge':
        result = generateNudgeStrategy(body.request as NudgeRequest);
        
        // Save campaign if profile_id provided
        if (body.request.target_profile_id) {
          await supabaseClient.from('nudge_campaigns').insert({
            user_id: userId,
            profile_id: body.request.target_profile_id,
            campaign_name: `Nudge for ${body.request.context}`,
            nudge_type: result.nudge_type.split(' + ')[0].toLowerCase().replace(' ', '_'),
            target_behavior: body.request.options[body.request.target_option],
            nudge_config: result.implementation,
            is_active: true
          });
          
          // Also persist to ai_analyses for section availability detection
          await supabaseClient.from('ai_analyses').upsert({
            user_id: userId,
            profile_id: body.request.target_profile_id,
            analysis_type: 'choice_architecture',
            result: result,
            generated_at: new Date().toISOString()
          }, { onConflict: 'profile_id,analysis_type' });
        }
        break;
        
      case 'get_dark_patterns':
        const { intensity = 'medium' } = body;
        result = {
          patterns: generateDarkPatternSuite(intensity),
          warning: 'Use these patterns responsibly. Some may violate platform policies or regulations.',
          ethical_guidelines: [
            'Ensure users can easily reverse decisions',
            'Be transparent about costs and commitments',
            'Avoid targeting vulnerable populations',
            'Consider long-term relationship over short-term conversion'
          ]
        };
        break;
        
      case 'behavioral_economics_report':
        const { profile_id } = body;
        
        // Try to fetch existing financial psychology profile
        let biases = body.profile_biases || {};
        if (profile_id) {
          const { data: profile } = await supabaseClient
            .from('financial_psychology_profiles')
            .select('*')
            .eq('profile_id', profile_id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (profile) {
            biases = {
              loss_aversion: profile.loss_aversion_score,
              endowment_effect: profile.endowment_effect_susceptibility,
              sunk_cost: profile.sunk_cost_fallacy_susceptibility,
              hyperbolic_discounting: profile.hyperbolic_discounting_rate,
              anchoring: profile.anchoring_susceptibility
            };
          }
        }
        
        result = generateBehavioralEconomicsReport(biases);
        break;
        
      case 'optimize_options':
        // Take existing options and optimize their presentation
        const { options, desired_outcome } = body;
        result = {
          original: options,
          optimized: {
            order: options.length >= 3 
              ? [options[options.length - 1], options[0], ...options.slice(1, -1)]
              : options,
            framing_suggestions: options.map((opt: string, i: number) => ({
              option: opt,
              suggested_label: i === 0 ? `${opt} (Most Popular)` : i === options.length - 1 ? `${opt} (Best Value)` : opt,
              visual_weight: i === 0 ? 'high' : i === options.length - 1 ? 'high' : 'normal'
            })),
            recommended_default: 0,
            add_decoy: options.length === 2 ? 'Add a third option that is clearly worse than your target to make it look better' : null
          }
        };
        break;
        
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Choice architecture optimizer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
