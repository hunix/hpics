/**
 * Cognitive Warfare Planner Edge Function (v9.0)
 * 
 * Generates reflexive control payloads and cognitive influence operations.
 * Uses advanced AI for strategic narrative engineering.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WarfareInput {
  profileId: string;
  profile_id?: string;
  userId: string;
  user_id?: string;
  operationType: string;
  operation_type?: string;
  targetObjective: string;
  target_objective?: string;
  constraints?: string[];
  context?: Record<string, unknown>;
}

interface CognitivePayload {
  operationType: string;
  targetObjective: string;
  reflexiveControlVector: {
    perceptionManagement: string[];
    beliefInjection: string[];
    decisionInfluence: string[];
  };
  narrativeFramework: {
    primaryNarrative: string;
    supportingNarratives: string[];
    counterNarratives: string[];
  };
  deliveryMechanisms: Array<{
    channel: string;
    timing: string;
    payload: string;
    expectedEffect: string;
  }>;
  riskAssessment: {
    detectionProbability: number;
    backfireProbability: number;
    effectivenessEstimate: number;
  };
  ethicalConsiderations: string[];
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'cognitive-warfare-planner', 
      timestamp: Date.now(),
      version: '9.0',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body: WarfareInput = await req.json();

    // Normalize parameters
    const profileId = body.profileId || body.profile_id;
    const userId = body.userId || body.user_id;
    const operationType = body.operationType || body.operation_type || 'perception_management';
    const targetObjective = body.targetObjective || body.target_objective || 'influence';
    const constraints = body.constraints || [];
    const context = body.context || {};

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[cognitive-warfare-planner] Planning ${operationType} for user ${userId}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get AI API base URL
    const aiApiBase = Deno.env.get('AI_API_BASE_URL') || 'https://ai.lovable.dev';

    // Build prompt for cognitive warfare planning
    const systemPrompt = `You are a strategic cognitive operations planner specializing in influence operations, 
reflexive control theory, and narrative warfare. Your task is to design sophisticated influence operations 
that achieve objectives through perception management rather than direct action.

Apply these doctrines:
1. NATO House Model: Target biological, psychological, and social cognitive domains
2. CIA Reflexive Control: Transmit motives that lead targets to desired decisions
3. DARPA Theory of Mind: Model and exploit adversary situational awareness gaps

Output must be a valid JSON object with the following structure:
{
  "reflexiveControlVector": {
    "perceptionManagement": ["strategy 1", "strategy 2"],
    "beliefInjection": ["belief 1", "belief 2"],
    "decisionInfluence": ["influence 1", "influence 2"]
  },
  "narrativeFramework": {
    "primaryNarrative": "main narrative",
    "supportingNarratives": ["supporting 1", "supporting 2"],
    "counterNarratives": ["counter 1", "counter 2"]
  },
  "deliveryMechanisms": [
    {
      "channel": "channel name",
      "timing": "timing description",
      "payload": "payload description",
      "expectedEffect": "expected effect"
    }
  ],
  "riskAssessment": {
    "detectionProbability": 0.3,
    "backfireProbability": 0.15,
    "effectivenessEstimate": 0.72
  },
  "ethicalConsiderations": ["consideration 1", "consideration 2"]
}`;

    const userPrompt = `Design a cognitive warfare operation with these parameters:
- Operation Type: ${operationType}
- Target Objective: ${targetObjective}
- Constraints: ${constraints.join(', ') || 'None specified'}
- Context: ${JSON.stringify(context)}

Generate a comprehensive operational plan.`;

    // Call AI API
    const aiResponse = await fetch(`${aiApiBase}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    let payload: CognitivePayload;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      
      try {
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          payload = {
            operationType,
            targetObjective,
            ...parsed,
          };
        } else {
          throw new Error('No JSON found');
        }
      } catch {
        // Fallback to structured default
        payload = generateDefaultPayload(operationType, targetObjective);
      }
    } else {
      console.warn('[cognitive-warfare-planner] AI API failed, using default payload');
      payload = generateDefaultPayload(operationType, targetObjective);
    }

    // Store results
    const { error: insertError } = await supabase
      .from('cognitive_operations')
      .insert({
        user_id: userId,
        profile_id: profileId,
        operation_type: operationType,
        operation_parameters: {
          targetObjective,
          constraints,
          context,
        },
        operation_results: payload,
        effectiveness_score: payload.riskAssessment.effectivenessEstimate,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[cognitive-warfare-planner] Insert error:', insertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: payload,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[cognitive-warfare-planner] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateDefaultPayload(operationType: string, targetObjective: string): CognitivePayload {
  return {
    operationType,
    targetObjective,
    reflexiveControlVector: {
      perceptionManagement: [
        'Frame information to highlight preferred interpretation',
        'Control information flow timing and sequence',
        'Introduce strategic ambiguity in key areas',
      ],
      beliefInjection: [
        'Leverage existing cognitive biases',
        'Build on pre-existing beliefs and values',
        'Use trusted intermediaries for message delivery',
      ],
      decisionInfluence: [
        'Structure choice architecture to favor desired outcome',
        'Create artificial time pressure',
        'Provide social proof of preferred option',
      ],
    },
    narrativeFramework: {
      primaryNarrative: `Strategic narrative aligned with ${targetObjective}`,
      supportingNarratives: [
        'Historical precedent narrative',
        'Expert consensus narrative',
        'Urgency and consequence narrative',
      ],
      counterNarratives: [
        'Prepared responses to expected objections',
        'Alternative framing for resistance',
      ],
    },
    deliveryMechanisms: [
      {
        channel: 'Direct Communication',
        timing: 'During cognitive vulnerability window',
        payload: 'Primary narrative with emotional anchoring',
        expectedEffect: 'Initial perception shift',
      },
      {
        channel: 'Social Network',
        timing: 'Following initial contact',
        payload: 'Social proof and consensus signals',
        expectedEffect: 'Belief reinforcement',
      },
      {
        channel: 'Environmental Cues',
        timing: 'Continuous',
        payload: 'Ambient priming stimuli',
        expectedEffect: 'Unconscious alignment',
      },
    ],
    riskAssessment: {
      detectionProbability: 0.25,
      backfireProbability: 0.12,
      effectivenessEstimate: 0.68,
    },
    ethicalConsiderations: [
      'Consider long-term relationship implications',
      'Assess potential for unintended harm',
      'Evaluate reversibility of influence effects',
      'Consider consent and autonomy implications',
    ],
  };
}
