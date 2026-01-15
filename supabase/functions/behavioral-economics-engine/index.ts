import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Behavioral Economics Engine
 * Exploits cognitive biases for influence:
 * - Endowment Effect
 * - Sunk Cost Fallacy
 * - Mental Accounting
 * - Hyperbolic Discounting
 * - Status Quo Bias
 * - Anchoring
 * - Loss Aversion
 */

interface BiasProfile {
  loss_aversion: number; // 0-1, higher = more loss averse
  endowment_effect: number;
  sunk_cost_susceptibility: number;
  hyperbolic_discounting: number; // Preference for immediate rewards
  status_quo_bias: number;
  anchoring_susceptibility: number;
  social_proof_sensitivity: number;
  scarcity_response: number;
  authority_influence: number;
  reciprocity_tendency: number;
}

interface ExploitationStrategy {
  bias: string;
  susceptibility_score: number;
  exploitation_technique: string;
  implementation_script: string[];
  expected_response: string;
  counter_measures: string[];
  ethical_rating: 'low' | 'medium' | 'high';
}

interface NegotiationAnchor {
  context: string;
  target_outcome: number | string;
  recommended_anchor: number | string;
  anchor_justification: string;
  expected_adjustment: string;
  counter_anchor_defense: string;
}

interface PaymentFraming {
  original_price: number;
  framing_technique: string;
  reframed_presentation: string;
  psychological_mechanism: string;
  pain_reduction_estimate: number;
}

// Bias exploitation techniques
const BIAS_TECHNIQUES: Record<string, {
  name: string;
  exploitation: string;
  scripts: string[];
  counter_defense: string[];
}> = {
  loss_aversion: {
    name: 'Loss Aversion',
    exploitation: 'Frame choices in terms of what they\'ll lose, not gain',
    scripts: [
      '"You\'ll lose your spot if you don\'t decide today"',
      '"This opportunity won\'t be available tomorrow"',
      '"Think about what you\'re giving up by not acting"',
      '"Every day you wait costs you $X"'
    ],
    counter_defense: [
      'Reframe in terms of gains',
      'Question the reality of the "loss"',
      'Calculate true opportunity cost'
    ]
  },
  endowment_effect: {
    name: 'Endowment Effect',
    exploitation: 'Give them something first, then leverage their attachment',
    scripts: [
      '"Here\'s a free trial - it\'s yours now"',
      '"Take this home and try it - no obligation"',
      '"Your personalized plan has been created"',
      '"We\'ve already allocated resources for you"'
    ],
    counter_defense: [
      'Recognize false ownership',
      'Calculate objective value only',
      'Wait before committing'
    ]
  },
  sunk_cost: {
    name: 'Sunk Cost Fallacy',
    exploitation: 'Remind them of past investments to encourage continued commitment',
    scripts: [
      '"You\'ve already invested so much time in this"',
      '"Think of all the effort you\'ve put in"',
      '"You\'re so close to finishing what you started"',
      '"Don\'t let your previous work go to waste"'
    ],
    counter_defense: [
      'Focus only on future costs/benefits',
      'Treat past costs as irreversible',
      'Ask: "Would I start this today?"'
    ]
  },
  hyperbolic_discounting: {
    name: 'Hyperbolic Discounting',
    exploitation: 'Offer immediate small rewards over larger delayed ones',
    scripts: [
      '"Get $100 today instead of waiting for $150"',
      '"Why wait? Start enjoying benefits now"',
      '"Instant approval - no waiting period"',
      '"Same day delivery available"'
    ],
    counter_defense: [
      'Calculate actual ROI',
      'Use commitment devices',
      'Delay immediate decisions'
    ]
  },
  status_quo: {
    name: 'Status Quo Bias',
    exploitation: 'Position your option as the default or continuation of current state',
    scripts: [
      '"Just continue with what we discussed"',
      '"The easiest thing is to stick with the plan"',
      '"This requires no changes on your end"',
      '"Everything stays the same, just with this addition"'
    ],
    counter_defense: [
      'Actively evaluate alternatives',
      'Set review dates',
      'Question default options'
    ]
  },
  anchoring: {
    name: 'Anchoring Bias',
    exploitation: 'Set high initial reference points',
    scripts: [
      '"The retail price is $999, but I can offer $499"',
      '"Companies typically spend $50K on this"',
      '"The last person paid full price"',
      '"Industry standard is much higher"'
    ],
    counter_defense: [
      'Research independent benchmarks',
      'Counter with own anchor',
      'Ignore their first number'
    ]
  },
  reciprocity: {
    name: 'Reciprocity',
    exploitation: 'Give something first to create obligation',
    scripts: [
      '"Let me share some free advice first..."',
      '"Here\'s something valuable, no strings attached"',
      '"I went out of my way to get you this"',
      '"I\'ve been thinking about how I can help you"'
    ],
    counter_defense: [
      'Accept gifts without obligation',
      'Recognize manipulation attempts',
      'Separate gifts from transactions'
    ]
  },
  social_proof: {
    name: 'Social Proof',
    exploitation: 'Show that others have chosen your preferred option',
    scripts: [
      '"90% of people in your situation choose this"',
      '"Your peers are all doing this already"',
      '"Everyone I\'ve talked to agrees"',
      '"This is what successful people do"'
    ],
    counter_defense: [
      'Question the comparison group',
      'Verify claims independently',
      'Focus on your unique situation'
    ]
  }
};

function assessBiasProfile(
  behaviors: any,
  interactions: any[]
): BiasProfile {
  // Default moderate susceptibility
  const profile: BiasProfile = {
    loss_aversion: 0.5,
    endowment_effect: 0.5,
    sunk_cost_susceptibility: 0.5,
    hyperbolic_discounting: 0.5,
    status_quo_bias: 0.5,
    anchoring_susceptibility: 0.5,
    social_proof_sensitivity: 0.5,
    scarcity_response: 0.5,
    authority_influence: 0.5,
    reciprocity_tendency: 0.5
  };
  
  // Analyze behavioral patterns
  if (behaviors) {
    // High anxiety = higher loss aversion
    if (behaviors.anxiety_indicators > 0.5) {
      profile.loss_aversion += 0.2;
      profile.scarcity_response += 0.15;
    }
    
    // Indecisiveness = higher status quo bias
    if (behaviors.decision_hesitation > 0.5) {
      profile.status_quo_bias += 0.2;
      profile.sunk_cost_susceptibility += 0.1;
    }
    
    // Impulsivity = higher hyperbolic discounting
    if (behaviors.impulsivity_score > 0.5) {
      profile.hyperbolic_discounting += 0.25;
      profile.anchoring_susceptibility += 0.15;
    }
    
    // Social orientation = higher social proof
    if (behaviors.social_orientation > 0.5) {
      profile.social_proof_sensitivity += 0.2;
      profile.reciprocity_tendency += 0.15;
    }
  }
  
  // Analyze past interactions for bias patterns
  interactions?.forEach(interaction => {
    if (interaction.response_to_urgency === 'complied') {
      profile.scarcity_response += 0.05;
    }
    if (interaction.mentioned_past_investment) {
      profile.sunk_cost_susceptibility += 0.05;
    }
    if (interaction.accepted_first_offer) {
      profile.anchoring_susceptibility += 0.05;
    }
  });
  
  // Normalize to 0-1 range
  Object.keys(profile).forEach(key => {
    profile[key as keyof BiasProfile] = Math.min(1, Math.max(0, profile[key as keyof BiasProfile]));
  });
  
  return profile;
}

function generateExploitationStrategies(profile: BiasProfile): ExploitationStrategy[] {
  const strategies: ExploitationStrategy[] = [];
  
  // Sort biases by susceptibility
  const biasScores = Object.entries(profile) as [keyof BiasProfile, number][];
  biasScores.sort((a, b) => b[1] - a[1]);
  
  // Generate strategies for top 5 biases
  biasScores.slice(0, 5).forEach(([bias, score]) => {
    const technique = BIAS_TECHNIQUES[bias.replace('_susceptibility', '').replace('_tendency', '').replace('_sensitivity', '')] 
      || BIAS_TECHNIQUES[bias];
    
    if (technique && score > 0.4) {
      strategies.push({
        bias: technique.name,
        susceptibility_score: score,
        exploitation_technique: technique.exploitation,
        implementation_script: technique.scripts,
        expected_response: `${(score * 100).toFixed(0)}% likely to be influenced by this approach`,
        counter_measures: technique.counter_defense,
        ethical_rating: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low'
      });
    }
  });
  
  return strategies;
}

function calculateOptimalAnchor(
  context: string,
  target: number,
  their_likely_anchor?: number
): NegotiationAnchor {
  // For price negotiations, anchor 50-100% above target
  const anchorMultiplier = context.includes('sell') ? 1.5 : 0.6;
  const recommendedAnchor = Math.round(target * anchorMultiplier);
  
  return {
    context,
    target_outcome: target,
    recommended_anchor: recommendedAnchor,
    anchor_justification: context.includes('sell')
      ? 'High anchor creates larger negotiation range favoring seller'
      : 'Low anchor shifts their reference point down',
    expected_adjustment: `They will likely counter with ${context.includes('sell') 
      ? Math.round(recommendedAnchor * 0.7) 
      : Math.round(recommendedAnchor * 1.4)}, allowing you to "compromise" at target`,
    counter_anchor_defense: their_likely_anchor
      ? `If they anchor at ${their_likely_anchor}, ignore it and reanchor with ${recommendedAnchor}`
      : 'Always anchor first if possible; their anchor becomes the reference point'
  };
}

function generatePaymentFraming(price: number): PaymentFraming[] {
  const framings: PaymentFraming[] = [];
  
  // Pennies-a-day framing
  const dailyCost = (price / 365).toFixed(2);
  framings.push({
    original_price: price,
    framing_technique: 'Pennies-a-day',
    reframed_presentation: `Just $${dailyCost} per day - less than a coffee`,
    psychological_mechanism: 'Temporal reframing reduces perceived magnitude',
    pain_reduction_estimate: 0.35
  });
  
  // Comparison framing
  framings.push({
    original_price: price,
    framing_technique: 'Relative comparison',
    reframed_presentation: `The same as ${Math.round(price / 5)} fancy coffees`,
    psychological_mechanism: 'Familiar anchors make amounts feel reasonable',
    pain_reduction_estimate: 0.25
  });
  
  // Investment framing
  framings.push({
    original_price: price,
    framing_technique: 'Investment framing',
    reframed_presentation: `An investment of $${price} with ${Math.round(price * 3)} in potential returns`,
    psychological_mechanism: 'Reframes cost as future gain',
    pain_reduction_estimate: 0.40
  });
  
  // Savings framing
  const originalPrice = Math.round(price * 1.67);
  framings.push({
    original_price: price,
    framing_technique: 'Savings highlight',
    reframed_presentation: `Save $${originalPrice - price} (normally $${originalPrice})`,
    psychological_mechanism: 'Focus on savings rather than spending',
    pain_reduction_estimate: 0.45
  });
  
  // Payment split
  const monthlyPayment = (price / 12).toFixed(2);
  framings.push({
    original_price: price,
    framing_technique: 'Payment splitting',
    reframed_presentation: `12 easy payments of $${monthlyPayment}`,
    psychological_mechanism: 'Smaller numbers feel more manageable',
    pain_reduction_estimate: 0.50
  });
  
  return framings;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { action, profile_id } = body;

    let result: any;

    switch (action) {
      case 'assess_biases':
        const { behaviors, interactions = [] } = body;
        const biasProfile = assessBiasProfile(behaviors, interactions);
        const strategies = generateExploitationStrategies(biasProfile);
        
        result = {
          bias_profile: biasProfile,
          exploitation_strategies: strategies,
          primary_vulnerability: strategies[0]?.bias || 'No significant vulnerabilities detected',
          approach_recommendation: strategies.length > 0
            ? `Lead with ${strategies[0].bias} exploitation: ${strategies[0].exploitation_technique}`
            : 'Use balanced approach'
        };
        
        // Store profile
        if (profile_id) {
          await supabaseClient.from('financial_psychology_profiles').upsert({
            user_id: user.id,
            profile_id,
            loss_aversion_score: biasProfile.loss_aversion,
            endowment_effect_susceptibility: biasProfile.endowment_effect,
            sunk_cost_fallacy_susceptibility: biasProfile.sunk_cost_susceptibility,
            hyperbolic_discounting_rate: biasProfile.hyperbolic_discounting,
            anchoring_susceptibility: biasProfile.anchoring_susceptibility,
            negotiation_patterns: {
              strategies,
              primary_vulnerability: result.primary_vulnerability
            },
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'profile_id'
          });
        }
        break;
        
      case 'calculate_anchor':
        const { context, target, their_anchor } = body;
        result = calculateOptimalAnchor(context, target, their_anchor);
        break;
        
      case 'frame_payment':
        const { price } = body;
        result = {
          framings: generatePaymentFraming(price),
          recommendation: 'Use "Savings highlight" framing for maximum pain reduction'
        };
        break;
        
      case 'get_exploitation_scripts':
        const { bias_type } = body;
        const technique = BIAS_TECHNIQUES[bias_type];
        if (technique) {
          result = {
            bias: technique.name,
            technique: technique.exploitation,
            scripts: technique.scripts,
            counter_measures: technique.counter_defense
          };
        } else {
          result = { error: 'Unknown bias type' };
        }
        break;
        
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Behavioral economics engine error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
