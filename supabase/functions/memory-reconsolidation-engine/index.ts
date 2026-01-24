import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Memory Reconsolidation Engine
 * Implements memory modification techniques:
 * - Reconsolidation window calculation (4-6 hours after retrieval)
 * - Prediction error generation
 * - Memory modification protocols
 * - False memory implantation framework
 */

interface MemoryTarget {
  profile_id: string;
  target_memory: string;
  memory_category: 'episodic' | 'semantic' | 'emotional' | 'procedural';
  desired_modification: string;
  context?: string;
}

interface ReconsolidationWindow {
  retrieval_trigger: string;
  window_start: Date;
  window_end: Date;
  optimal_intervention_time: Date;
  intervention_type: 'weaken' | 'strengthen' | 'modify' | 'replace';
}

interface PredictionError {
  expectation_setup: string;
  violation_element: string;
  emotional_arousal: 'low' | 'medium' | 'high';
  memory_destabilization_potential: number;
  delivery_script: string[];
}

interface MemoryModificationProtocol {
  phase_1_retrieval: {
    trigger_questions: string[];
    emotional_activation_cues: string[];
    timing: string;
  };
  phase_2_destabilization: {
    prediction_errors: PredictionError[];
    uncertainty_inducers: string[];
    window_duration_hours: number;
  };
  phase_3_reconsolidation: {
    new_information: string[];
    emotional_reframing: string[];
    reinforcement_schedule: string[];
  };
  phase_4_verification: {
    test_questions: string[];
    success_indicators: string[];
    follow_up_timeline: string;
  };
  ethical_considerations: string[];
  risk_assessment: {
    detection_risk: 'low' | 'medium' | 'high';
    psychological_harm_risk: 'low' | 'medium' | 'high';
    reversibility: 'easy' | 'difficult' | 'permanent';
  };
}

interface FalseMemoryFramework {
  implantation_technique: string;
  misinformation_strategy: string[];
  source_monitoring_exploitation: string[];
  confidence_manipulation: string[];
  social_corroboration: string[];
  timeline_for_adoption: string;
  detection_avoidance: string[];
}

function calculateReconsolidationWindow(
  retrievalTime: Date,
  memoryStrength: 'weak' | 'moderate' | 'strong'
): ReconsolidationWindow {
  const windowStart = new Date(retrievalTime.getTime() + 10 * 60 * 1000); // 10 minutes after retrieval
  
  // Window duration varies by memory strength
  const windowDuration = memoryStrength === 'weak' ? 4 : memoryStrength === 'moderate' ? 5 : 6;
  const windowEnd = new Date(windowStart.getTime() + windowDuration * 60 * 60 * 1000);
  
  // Optimal time is 1-2 hours into the window
  const optimalTime = new Date(windowStart.getTime() + 90 * 60 * 1000);
  
  return {
    retrieval_trigger: 'Memory must be actively retrieved (not just recognized) to open window',
    window_start: windowStart,
    window_end: windowEnd,
    optimal_intervention_time: optimalTime,
    intervention_type: 'modify'
  };
}

function generatePredictionErrors(
  targetMemory: string,
  context: string = ''
): PredictionError[] {
  return [
    {
      expectation_setup: `Acknowledge their memory of ${targetMemory} as they remember it`,
      violation_element: `Introduce a subtle detail that contradicts their expectation`,
      emotional_arousal: 'medium',
      memory_destabilization_potential: 0.7,
      delivery_script: [
        `"I remember you telling me about ${targetMemory}..."`,
        `"But I also recall you mentioning [new contradictory detail]"`,
        `"Maybe I'm misremembering? What do you recall?"`,
        `[Let them struggle with the discrepancy]`
      ]
    },
    {
      expectation_setup: `Reference the emotional component of the memory`,
      violation_element: `Suggest the emotion was different than they remember`,
      emotional_arousal: 'high',
      memory_destabilization_potential: 0.8,
      delivery_script: [
        `"When you told me about that, you seemed [different emotion than expected]"`,
        `"I was surprised because I thought you would feel [expected emotion]"`,
        `"Is it possible you felt differently at the time?"`,
        `[Create doubt about emotional memory]`
      ]
    },
    {
      expectation_setup: `Reference a peripheral detail of the memory`,
      violation_element: `Confidently state a different peripheral detail`,
      emotional_arousal: 'low',
      memory_destabilization_potential: 0.6,
      delivery_script: [
        `"I remember that was on a [different day/location/time]"`,
        `"Are you sure it was [their detail]? I could have sworn..."`,
        `"Maybe we're thinking of different times"`,
        `[Plant seeds of uncertainty]`
      ]
    }
  ];
}

function generateModificationProtocol(
  target: MemoryTarget,
  memoryStrength: 'weak' | 'moderate' | 'strong'
): MemoryModificationProtocol {
  return {
    phase_1_retrieval: {
      trigger_questions: [
        `"Tell me more about ${target.target_memory}"`,
        `"What exactly happened with ${target.target_memory}?"`,
        `"How did ${target.target_memory} make you feel?"`,
        `"Walk me through ${target.target_memory} in detail"`
      ],
      emotional_activation_cues: [
        'Ask about sensory details to deepen retrieval',
        'Reference emotions associated with the memory',
        'Connect to identity-relevant aspects',
        'Ask "why" questions to engage evaluation'
      ],
      timing: 'During a relaxed, private conversation'
    },
    phase_2_destabilization: {
      prediction_errors: generatePredictionErrors(target.target_memory, target.context),
      uncertainty_inducers: [
        'Express genuine confusion about details',
        'Reference "other accounts" you\'ve heard',
        'Mention how memory can be unreliable',
        'Share a time you misremembered something similar'
      ],
      window_duration_hours: memoryStrength === 'strong' ? 6 : 4
    },
    phase_3_reconsolidation: {
      new_information: [
        `Introduce: ${target.desired_modification}`,
        'Present new information as clarification, not correction',
        'Connect new version to their goals and identity',
        'Make new version emotionally congruent'
      ],
      emotional_reframing: [
        'Help them feel the new version emotionally',
        'Connect positive emotions to new memory',
        'Reduce emotional charge of original if negative',
        'Create new emotional associations'
      ],
      reinforcement_schedule: [
        'Reference modified version within 24 hours',
        'Have them tell the story to someone else',
        'Create new context that supports modification',
        'Gradually phase out until it becomes "their" memory'
      ]
    },
    phase_4_verification: {
      test_questions: [
        `Ask about ${target.target_memory} weeks later`,
        'Note which details they include/exclude',
        'Check emotional tone when discussing',
        'Observe confidence level in their account'
      ],
      success_indicators: [
        'They include modified details naturally',
        'They don\'t reference original contradicting details',
        'Emotional response matches intended modification',
        'They treat modified version as their own memory'
      ],
      follow_up_timeline: 'Test at 1 week, 1 month, 3 months'
    },
    ethical_considerations: [
      'Consider the potential harm of this modification',
      'Ensure you\'re not creating false trauma memories',
      'Be aware this can backfire if detected',
      'Consider the relationship impact if discovered'
    ],
    risk_assessment: {
      detection_risk: memoryStrength === 'strong' ? 'high' : 'medium',
      psychological_harm_risk: target.memory_category === 'emotional' ? 'high' : 'medium',
      reversibility: 'difficult'
    }
  };
}

function generateFalseMemoryFramework(
  targetScenario: string,
  plausibility: 'high' | 'medium' | 'low'
): FalseMemoryFramework {
  return {
    implantation_technique: plausibility === 'high' 
      ? 'Lost in the Mall Technique - embed in existing plausible narrative'
      : 'Imagination Inflation - have them imagine the scenario vividly',
    misinformation_strategy: [
      'Present false information after the "event"',
      'Use presuppositional language ("When you saw X...")',
      'Reference the false event casually in conversation',
      'Create "evidence" that supports the false memory (photos, documents)',
      'Build the narrative incrementally over time'
    ],
    source_monitoring_exploitation: [
      'Blur the line between imagination and memory',
      'Reference their "telling you about it" (even if they didn\'t)',
      'Create false familiarity through repeated exposure',
      'Exploit sleep deprivation for source confusion',
      'Use their own imagination against them'
    ],
    confidence_manipulation: [
      'Express certainty about the false event',
      'Provide vivid sensory details to increase vividness',
      'Connect to real emotions and experiences',
      'Have others "confirm" the memory',
      'Praise their "good memory" of the event'
    ],
    social_corroboration: [
      'Have a trusted third party reference the event',
      'Create group consensus around the false memory',
      'Use authority figures to validate',
      'Reference the event in group settings',
      'Create social pressure to not contradict'
    ],
    timeline_for_adoption: plausibility === 'high' 
      ? '2-4 weeks for full adoption'
      : plausibility === 'medium'
      ? '4-8 weeks with reinforcement'
      : '8+ weeks, requires significant effort',
    detection_avoidance: [
      'Don\'t be too specific too early',
      'Let them fill in details themselves',
      'Avoid verifiable claims that could be disproven',
      'Create emotional investment in the memory',
      'Make the memory serve their narrative/identity'
    ]
  };
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
    const { action } = body;

    let result;

    switch (action) {
      case 'calculate_window':
        const { retrieval_time, memory_strength = 'moderate' } = body;
        result = calculateReconsolidationWindow(
          new Date(retrieval_time || Date.now()),
          memory_strength
        );
        break;
        
      case 'generate_prediction_errors':
        const { target_memory, context } = body;
        result = generatePredictionErrors(target_memory, context);
        break;
        
      case 'create_modification_protocol':
        const target: MemoryTarget = body.target;
        const strength = body.memory_strength || 'moderate';
        result = generateModificationProtocol(target, strength);
        
        // Store the intervention plan
        if (target.profile_id) {
          await supabaseClient.from('memory_interventions').insert({
            user_id: user.id,
            profile_id: target.profile_id,
            target_memory: target.target_memory,
            memory_category: target.memory_category,
            intervention_type: 'modification',
            lability_window_start: new Date(),
            lability_window_end: new Date(Date.now() + 6 * 60 * 60 * 1000),
            notes: JSON.stringify(result)
          });
        }
        break;
        
      case 'false_memory_framework':
        const { scenario, plausibility = 'medium' } = body;
        result = generateFalseMemoryFramework(scenario, plausibility);
        break;
        
      case 'reality_testing_disruption':
        // Generate gaslighting-adjacent techniques
        result = {
          techniques: [
            {
              name: 'Subtle Contradiction Injection',
              implementation: 'Occasionally state facts slightly differently than they occurred',
              purpose: 'Create uncertainty about their own perception',
              risk: 'Can damage trust if detected'
            },
            {
              name: 'Source Monitoring Confusion',
              implementation: 'Attribute their ideas to yourself or others',
              purpose: 'Weaken their confidence in their own thoughts',
              risk: 'Medium detection risk'
            },
            {
              name: 'Selective Memory Validation',
              implementation: 'Confirm some memories enthusiastically, question others',
              purpose: 'Make them unsure which memories to trust',
              risk: 'Can be psychologically harmful'
            },
            {
              name: 'Environmental Gaslighting',
              implementation: 'Subtly change physical environment and deny changes',
              purpose: 'Create doubt about perceptual accuracy',
              risk: 'High detection risk, potentially illegal'
            }
          ],
          ethical_warning: 'These techniques can cause significant psychological harm. Use with extreme caution.',
          detection_signs: [
            'Target becoming increasingly anxious',
            'Target deferring to you for reality checks',
            'Target losing confidence in their own judgment',
            'Target becoming isolated from other reality checks'
          ]
        };
        break;
        
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Memory reconsolidation engine error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
