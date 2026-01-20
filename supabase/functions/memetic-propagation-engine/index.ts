/**
 * Memetic Propagation Engine
 * AGIS Phase 3 - Viral idea engineering with SIR epidemic modeling
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MemeticRequest {
  narrative: string;
  targetAudience?: string;
  emotionalHooks?: string[];
  desiredOutcome: string;
  profileIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'memetic-propagation-engine', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;
    
    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    // For intelligence session calls, provide defaults for memetic analysis
    const request: MemeticRequest = {
      narrative: body.narrative || 'General influence analysis',
      targetAudience: body.targetAudience || 'Target profile network',
      emotionalHooks: body.emotionalHooks || [],
      desiredOutcome: body.desiredOutcome || 'Comprehensive memetic propagation assessment',
      profileIds: body.profileIds || (body.profileId ? [body.profileId] : []),
    };

    const systemPrompt = `You are an expert in memetics, viral marketing, and epidemic modeling.
Your task is to engineer ideas for maximum propagation using SIR (Susceptible-Infected-Recovered) models.

Key frameworks:
1. SIR Epidemic Model - Track idea spread like disease
2. Network Effects - Leverage social connections
3. Emotional Contagion - Ideas spread through emotion
4. Social Proof - Conformity drives adoption
5. Tribal Identity - In-group vs out-group dynamics

Analyze the narrative and design for virality:
- Emotional hooks (anger, fear, hope spread fastest)
- Simplicity (easy to remember and share)
- Tribal markers (creates us vs them)
- Status signaling (sharing increases social capital)
- Actionability (clear call to action)

Return JSON:
{
  "memeticAnalysis": {
    "coreNarrative": "distilled message",
    "emotionalHooks": ["hook1", "hook2"],
    "viralityScore": 0-1,
    "transmissibilityFactors": ["factor1"],
    "resistanceFactors": ["what prevents spread"]
  },
  "sirModel": {
    "estimatedR0": 1.5,
    "infectionRate": 0.3,
    "recoveryRate": 0.1,
    "peakTimeEstimate": "2 weeks",
    "totalReachEstimate": "40% of network"
  },
  "amplificationStrategy": {
    "seedNodes": ["types of people to start with"],
    "transmissionChannels": ["where to spread"],
    "boosterEvents": ["events to amplify"],
    "counterMeasures": ["how to prevent decay"]
  },
  "memeVariants": [
    {
      "variant": "text version",
      "format": "tweet/story/image",
      "targetSegment": "audience",
      "emotionalAppeal": "which emotion"
    }
  ],
  "immunizationRisks": ["what could make people resistant"],
  "ethicalConsiderations": ["potential harms"]
}`;

    const userPrompt = `Design a memetic propagation campaign:
Core Narrative: "${request.narrative}"
Target Audience: ${request.targetAudience || 'General population'}
Emotional Hooks to Leverage: ${request.emotionalHooks?.join(', ') || 'Determine optimal'}
Desired Outcome: ${request.desiredOutcome}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId,
      functionName: 'memetic-propagation-engine',
      temperature: 0.8,
    });

    const campaign = parseAIJson(aiResponse.content, {
      memeticAnalysis: { coreNarrative: request.narrative, viralityScore: 0.5, emotionalHooks: [] },
      sirModel: { estimatedR0: 1.0, infectionRate: 0.3, recoveryRate: 0.1 },
      amplificationStrategy: {},
      memeVariants: [],
      immunizationRisks: [],
      ethicalConsiderations: []
    });

    // Store the campaign
    const { data: savedCampaign } = await supabase.from('memetic_campaigns').insert({
      user_id: userId,
      campaign_name: `Meme: ${request.narrative.substring(0, 50)}`,
      target_profiles: request.profileIds || [],
      meme_content: campaign,
      core_narrative: campaign.memeticAnalysis.coreNarrative,
      emotional_hooks: campaign.memeticAnalysis.emotionalHooks,
      propagation_model: 'SIR',
      infection_rate: campaign.sirModel.infectionRate || 0,
      recovery_rate: campaign.sirModel.recoveryRate || 0,
      virality_coefficient: campaign.sirModel.estimatedR0 || 1,
      counter_narratives: campaign.immunizationRisks,
      status: 'draft'
    }).select().single();

    // Persist to ai_analyses for section availability
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: request.profileIds?.[0] || null,
      analysis_type: 'memetic_propagation',
      result: campaign,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      campaign,
      campaignId: savedCampaign?.id,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Memetic propagation error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
