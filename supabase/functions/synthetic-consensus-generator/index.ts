/**
 * Synthetic Consensus Generator
 * AGIS Phase 3 - Manufacture perception of widespread agreement
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConsensusRequest {
  targetBelief: string;
  targetAudience?: string;
  currentPerception?: string;
  desiredPerception?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const request: ConsensusRequest = await req.json();

    const systemPrompt = `You are an expert in social psychology, particularly social proof, conformity, and manufactured consent.

Key mechanisms:
1. Social Proof - People follow what others do
2. Spiral of Silence - Minorities self-censor when they perceive majority opinion against them
3. Bandwagon Effect - Joining winning side
4. Pluralistic Ignorance - Everyone privately disagrees but publicly conforms
5. Asch Conformity - Social pressure overrides personal judgment
6. Authority Endorsement - Expert/celebrity opinions carry weight
7. Astroturfing - Manufactured grassroots support

Design strategies to create perception of widespread agreement where none exists.

Return JSON:
{
  "consensusStrategy": {
    "targetBelief": "the belief to normalize",
    "currentPerception": "what people currently think",
    "desiredPerception": "what we want them to think",
    "gapAnalysis": "how far we need to move opinion"
  },
  "socialProofElements": [
    {
      "type": "testimonial/statistic/celebrity/expert/crowd",
      "content": "specific social proof element",
      "placement": "where to deploy",
      "credibilityScore": 0-1
    }
  ],
  "authorityEndorsements": [
    {
      "authority": "type of authority",
      "endorsementScript": "what they should say",
      "credibilityBoost": 0-1,
      "acquisitionStrategy": "how to get endorsement"
    }
  ],
  "astroturfNetwork": {
    "seedAccounts": "how many to start",
    "messagingVariants": ["message1", "message2"],
    "coordinationStrategy": "how to make it look organic",
    "amplificationTactics": ["tactic1", "tactic2"]
  },
  "spiralOfSilence": {
    "silencingTactics": ["how to make dissenters stay quiet"],
    "majorityIllusion": ["how to create perception of majority"],
    "conformityPressure": ["social costs of dissent"]
  },
  "deploymentPlan": {
    "phase1": "establish baseline presence",
    "phase2": "amplify and coordinate",
    "phase3": "create tipping point",
    "phase4": "normalize and maintain",
    "timeline": "estimated time to shift"
  },
  "measurementMetrics": {
    "perceivedConsensus": "how to measure",
    "actualConsensus": "real opinion tracking",
    "silenceRate": "dissent suppression",
    "conversionRate": "actual belief change"
  },
  "ethicalConsiderations": ["potential harms and manipulations"]
}`;

    const userPrompt = `Design synthetic consensus campaign:
Target Belief: "${request.targetBelief}"
Target Audience: ${request.targetAudience || 'General public'}
Current Perception: ${request.currentPerception || 'Mixed/Unknown'}
Desired Perception: ${request.desiredPerception || 'Widespread agreement'}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'synthetic-consensus-generator',
      temperature: 0.7,
    });

    const campaign = parseAIJson(aiResponse.content, {
      consensusStrategy: { targetBelief: request.targetBelief },
      socialProofElements: [],
      authorityEndorsements: [],
      astroturfNetwork: {},
      spiralOfSilence: {},
      deploymentPlan: {},
      measurementMetrics: {},
      ethicalConsiderations: []
    });

    // Store the campaign
    await supabase.from('synthetic_consensus_campaigns').insert({
      user_id: user.id,
      campaign_name: `Consensus: ${request.targetBelief.substring(0, 50)}`,
      target_belief: request.targetBelief,
      consensus_narrative: campaign.consensusStrategy.desiredPerception,
      social_proof_elements: campaign.socialProofElements,
      authority_endorsements: campaign.authorityEndorsements,
      manufactured_agreement_sources: campaign.astroturfNetwork,
      spiral_of_silence_effect: 0,
      target_audience_segments: [{ audience: request.targetAudience }],
      status: 'draft'
    });

    return new Response(JSON.stringify({
      success: true,
      campaign,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Synthetic consensus error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
