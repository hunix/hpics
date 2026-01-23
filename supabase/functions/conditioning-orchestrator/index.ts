import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reinforcement Schedule Types
type ReinforcementSchedule = 
  | 'continuous'      // Every response reinforced
  | 'fixed_ratio'     // After N responses
  | 'variable_ratio'  // Average N responses (most addictive)
  | 'fixed_interval'  // After N time units
  | 'variable_interval'; // Average N time units

interface ConditioningProtocol {
  id: string;
  target_behavior: string;
  conditioning_type: 'classical' | 'operant' | 'social_learning';
  reinforcement_schedule: ReinforcementSchedule;
  reinforcer_type: 'positive' | 'negative';
  reinforcer_category: 'primary' | 'secondary' | 'social' | 'token';
  shaping_steps: ShapingStep[];
  extinction_protocol: boolean;
  stimulus_generalization: string[];
  discrimination_training: string[];
  current_step: number;
  success_rate: number;
}

interface ShapingStep {
  step_number: number;
  target_approximation: string;
  criterion: string;
  reinforcer: string;
  completed: boolean;
  attempts: number;
  successes: number;
}

interface ScheduleState {
  responses_since_reinforcement: number;
  time_since_reinforcement: number;
  ratio_requirement: number;
  interval_requirement: number;
  next_reinforcement_at: number | null;
}

// Variable Ratio - Most powerful for habit formation (slot machine effect)
function shouldReinforceVariableRatio(state: ScheduleState): boolean {
  // Creates unpredictability that maximizes engagement
  const probability = 1 / state.ratio_requirement;
  return Math.random() < probability;
}

// Variable Interval - Checking behavior (email/social media effect)
function shouldReinforceVariableInterval(state: ScheduleState): boolean {
  if (state.next_reinforcement_at === null) {
    // Set random next reinforcement time
    const variance = state.interval_requirement * 0.5;
    const nextInterval = state.interval_requirement + (Math.random() * variance * 2 - variance);
    state.next_reinforcement_at = Date.now() + nextInterval * 1000;
    return false;
  }
  
  if (Date.now() >= state.next_reinforcement_at) {
    state.next_reinforcement_at = null;
    return true;
  }
  return false;
}

function evaluateReinforcement(
  schedule: ReinforcementSchedule,
  state: ScheduleState
): { reinforce: boolean; updatedState: ScheduleState } {
  const updatedState = { ...state };
  let reinforce = false;

  switch (schedule) {
    case 'continuous':
      reinforce = true;
      break;
      
    case 'fixed_ratio':
      updatedState.responses_since_reinforcement++;
      if (updatedState.responses_since_reinforcement >= state.ratio_requirement) {
        reinforce = true;
        updatedState.responses_since_reinforcement = 0;
      }
      break;
      
    case 'variable_ratio':
      reinforce = shouldReinforceVariableRatio(state);
      if (reinforce) {
        updatedState.responses_since_reinforcement = 0;
      }
      break;
      
    case 'fixed_interval':
      updatedState.time_since_reinforcement = Date.now() - state.time_since_reinforcement;
      if (updatedState.time_since_reinforcement >= state.interval_requirement * 1000) {
        reinforce = true;
        updatedState.time_since_reinforcement = 0;
      }
      break;
      
    case 'variable_interval':
      reinforce = shouldReinforceVariableInterval(updatedState);
      break;
  }

  return { reinforce, updatedState };
}

function generateReinforcerSuggestions(
  category: string,
  profileContext: any
): string[] {
  const suggestions: string[] = [];
  
  switch (category) {
    case 'social':
      suggestions.push(
        'Public recognition or praise',
        'Exclusive access or information',
        'Increased status indicators',
        'Social proof notifications',
        'Connection to high-value individuals'
      );
      break;
      
    case 'token':
      suggestions.push(
        'Points or credits accumulation',
        'Level or tier advancement',
        'Badge or achievement unlocks',
        'Progress bar advancement',
        'Leaderboard position improvement'
      );
      break;
      
    case 'primary':
      suggestions.push(
        'Time savings',
        'Reduced effort or friction',
        'Immediate benefit delivery',
        'Risk or uncertainty reduction',
        'Comfort or convenience increase'
      );
      break;
      
    case 'secondary':
      suggestions.push(
        'Monetary value or discounts',
        'Resource access',
        'Tool or feature unlocks',
        'Information or insight access',
        'Future benefit promises'
      );
      break;
  }
  
  return suggestions;
}

function designShapingProtocol(
  targetBehavior: string,
  currentBaseline: string,
  complexity: number
): ShapingStep[] {
  const steps: ShapingStep[] = [];
  const numSteps = Math.max(3, Math.min(10, complexity * 2));
  
  for (let i = 1; i <= numSteps; i++) {
    const progress = i / numSteps;
    steps.push({
      step_number: i,
      target_approximation: `Step ${i}: ${(progress * 100).toFixed(0)}% toward target behavior`,
      criterion: `Successfully complete approximation ${i} consecutive times`,
      reinforcer: i < numSteps / 2 ? 'continuous' : 'variable_ratio',
      completed: false,
      attempts: 0,
      successes: 0
    });
  }
  
  return steps;
}

function analyzeLearnedHelplessness(
  responseHistory: Array<{ success: boolean; controllable: boolean }>
): {
  risk_score: number;
  indicators: string[];
  intervention_needed: boolean;
} {
  const recentResponses = responseHistory.slice(-20);
  const uncontrollableFailures = recentResponses.filter(r => !r.success && !r.controllable).length;
  const totalFailures = recentResponses.filter(r => !r.success).length;
  
  const riskScore = uncontrollableFailures / recentResponses.length;
  const indicators: string[] = [];
  
  if (riskScore > 0.5) {
    indicators.push('High uncontrollable failure rate');
  }
  if (totalFailures > 15) {
    indicators.push('Excessive total failures');
  }
  
  return {
    risk_score: riskScore,
    indicators,
    intervention_needed: riskScore > 0.6 || totalFailures > 15
  };
}

function generateExtinctionProtocol(
  unwantedBehavior: string,
  currentReinforcer: string
): {
  strategy: string;
  steps: string[];
  expected_burst: string;
  timeline: string;
} {
  return {
    strategy: 'Systematic reinforcement removal with burst preparation',
    steps: [
      'Identify all sources of reinforcement for target behavior',
      'Prepare for extinction burst (temporary behavior increase)',
      'Remove reinforcement consistently',
      'Reinforce alternative incompatible behavior (DRI)',
      'Monitor for spontaneous recovery',
      'Maintain extinction across all contexts'
    ],
    expected_burst: 'Expect 2-3x increase in unwanted behavior initially before decline',
    timeline: 'Full extinction typically 3-6 weeks with consistent application'
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'conditioning-orchestrator', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userId, profileId, data } = await req.json();

    if (action === 'create_protocol') {
      const protocol: ConditioningProtocol = {
        id: crypto.randomUUID(),
        target_behavior: data.target_behavior,
        conditioning_type: data.conditioning_type || 'operant',
        reinforcement_schedule: data.schedule || 'variable_ratio',
        reinforcer_type: data.reinforcer_type || 'positive',
        reinforcer_category: data.reinforcer_category || 'social',
        shaping_steps: designShapingProtocol(
          data.target_behavior,
          data.current_baseline,
          data.complexity || 5
        ),
        extinction_protocol: false,
        stimulus_generalization: [],
        discrimination_training: [],
        current_step: 1,
        success_rate: 0
      };

      await supabaseClient.from('conditioning_protocols').insert({
        id: protocol.id,
        user_id: userId,
        profile_id: profileId,
        protocol_data: protocol,
        status: 'active',
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        protocol,
        reinforcer_suggestions: generateReinforcerSuggestions(
          protocol.reinforcer_category,
          data.profile_context
        )
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'record_response') {
      const { protocolId, responseData } = data;

      // Get current protocol
      const { data: protocolRecord } = await supabaseClient
        .from('conditioning_protocols')
        .select('*')
        .eq('id', protocolId)
        .single();

      if (!protocolRecord) {
        throw new Error('Protocol not found');
      }

      const protocol = protocolRecord.protocol_data as ConditioningProtocol;
      const scheduleState: ScheduleState = protocolRecord.schedule_state || {
        responses_since_reinforcement: 0,
        time_since_reinforcement: Date.now(),
        ratio_requirement: 5,
        interval_requirement: 60,
        next_reinforcement_at: null
      };

      const { reinforce, updatedState } = evaluateReinforcement(
        protocol.reinforcement_schedule,
        scheduleState
      );

      // Update shaping step progress
      const currentStep = protocol.shaping_steps[protocol.current_step - 1];
      if (currentStep) {
        currentStep.attempts++;
        if (responseData.success) {
          currentStep.successes++;
        }
        
        // Check if step is completed
        if (currentStep.successes >= 3) {
          currentStep.completed = true;
          if (protocol.current_step < protocol.shaping_steps.length) {
            protocol.current_step++;
          }
        }
      }

      // Calculate success rate
      const totalAttempts = protocol.shaping_steps.reduce((sum, s) => sum + s.attempts, 0);
      const totalSuccesses = protocol.shaping_steps.reduce((sum, s) => sum + s.successes, 0);
      protocol.success_rate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0;

      // Update in database
      await supabaseClient
        .from('conditioning_protocols')
        .update({
          protocol_data: protocol,
          schedule_state: updatedState,
          updated_at: new Date().toISOString()
        })
        .eq('id', protocolId);

      // Log response
      await supabaseClient.from('conditioning_responses').insert({
        protocol_id: protocolId,
        user_id: userId,
        profile_id: profileId,
        response_data: responseData,
        reinforced: reinforce,
        step_number: protocol.current_step,
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify({
        success: true,
        should_reinforce: reinforce,
        current_step: protocol.current_step,
        success_rate: protocol.success_rate,
        next_target: protocol.shaping_steps[protocol.current_step - 1]?.target_approximation
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'analyze_helplessness') {
      const { responseHistory } = data;
      const analysis = analyzeLearnedHelplessness(responseHistory);

      return new Response(JSON.stringify({
        success: true,
        analysis
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'generate_extinction') {
      const { unwantedBehavior, currentReinforcer } = data;
      const protocol = generateExtinctionProtocol(unwantedBehavior, currentReinforcer);

      return new Response(JSON.stringify({
        success: true,
        extinction_protocol: protocol
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_schedule_recommendations') {
      const recommendations = [
        {
          schedule: 'variable_ratio',
          use_case: 'Habit formation, engagement',
          strength: 'Most resistant to extinction',
          example: 'Social media likes, slot machines'
        },
        {
          schedule: 'variable_interval',
          use_case: 'Checking behavior, monitoring',
          strength: 'Steady moderate response rate',
          example: 'Email checking, waiting for news'
        },
        {
          schedule: 'fixed_ratio',
          use_case: 'Productivity, completion',
          strength: 'High response rate with pause after reinforcement',
          example: 'Piece-rate work, stamps on loyalty card'
        },
        {
          schedule: 'continuous',
          use_case: 'Initial learning, new behaviors',
          strength: 'Fast acquisition',
          example: 'New skill training, onboarding'
        }
      ];

      return new Response(JSON.stringify({
        success: true,
        recommendations
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in conditioning-orchestrator:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
