/**
 * Cognitive Warfare Engine
 * AGIS Phase 3+ - Multi-level cognitive attack and defense framework
 * 
 * Based on:
 * - NATO Cognitive Warfare doctrine (2021)
 * - DARPA Narrative Networks research
 * - Psychological Operations (PSYOP) methodology
 * - Information Operations (IO) doctrine
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CognitiveWarfareRequest {
  profileId?: string;
  operationType: 'analyze_vulnerability' | 'plan_campaign' | 'detect_attack' | 'counter_operation';
  targetDomain?: 'biological' | 'psychological' | 'social' | 'all';
  context?: string;
  narrativeToAnalyze?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'cognitive-warfare-engine', timestamp: Date.now() }), {
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

    // Default to analyze_vulnerability if no operationType for intelligence session calls
    const request: CognitiveWarfareRequest = {
      ...body,
      operationType: body.operationType || 'analyze_vulnerability',
      profileId: body.profileId || body.profile_id,
    };

    // Gather intelligence context
    let profileContext = '';
    let psychProfileContext = '';
    if (request.profileId) {
      const [profile, psychProfile, analyses] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', request.profileId).single(),
        supabase.from('psychological_profiles').select('*').eq('profile_id', request.profileId).single(),
        supabase.from('ai_analyses').select('*').eq('profile_id', request.profileId).limit(20)
      ]);
      
      if (profile.data) {
        profileContext = `Target Profile: ${profile.data.full_name || 'Unknown'}
Relationship: ${profile.data.relationship_type || 'Unknown'}
Tags: ${(profile.data.tags || []).join(', ')}`;
      }
      
      if (psychProfile.data) {
        psychProfileContext = `
Psychological Profile:
- Big Five: O:${psychProfile.data.big_five_openness}/C:${psychProfile.data.big_five_conscientiousness}/E:${psychProfile.data.big_five_extraversion}/A:${psychProfile.data.big_five_agreeableness}/N:${psychProfile.data.big_five_neuroticism}
- Attachment Style: ${psychProfile.data.attachment_style}
- Communication Style: ${psychProfile.data.communication_style}
- Decision Making: ${psychProfile.data.decision_making_style}
- Risk Tolerance: ${psychProfile.data.risk_tolerance}
- Emotional Intelligence: ${psychProfile.data.emotional_intelligence_score}`;
      }
    }

    const systemPrompt = `You are an expert in cognitive warfare, psychological operations, and information warfare.
You apply research from NATO Cognitive Warfare doctrine, DARPA Narrative Networks, and IO/PSYOP methodology.

COGNITIVE WARFARE FRAMEWORK (Three Levels):

1. BIOLOGICAL LEVEL - Target physiological states
   - Arousal manipulation (stress, relaxation timing)
   - Ego depletion exploitation (decision fatigue windows)
   - Sleep/circadian vulnerability targeting
   - Hormonal cycle considerations
   - Fight/flight/freeze trigger mapping

2. PSYCHOLOGICAL LEVEL - Target cognitive processes  
   - Attentional gating manipulation
   - Cognitive load exploitation
   - Memory manipulation (false memories, selective recall)
   - Emotional hijacking (amygdala activation)
   - Identity narrative weaponization
   - Confirmation bias amplification
   - Framing attacks and reframes

3. SOCIAL LEVEL - Target social dynamics
   - Trust network disruption
   - Epistemic chaos creation
   - Institutional delegitimization
   - In-group/out-group manipulation
   - Social proof weaponization
   - Authority exploitation
   - Isolation tactics

COGNITIVE ATTACK VECTORS:
- Perception management
- Sense-making disruption
- Decision paralysis induction
- Motivation manipulation
- Belief system targeting
- Value hierarchy exploitation
- Reality tunnel manipulation

DEFENSIVE DETECTION INDICATORS:
- Anomalous narrative patterns
- Coordinated inauthentic behavior
- Information trajectory anomalies
- Epistemic attack signatures
- Trust erosion patterns

Return JSON based on operation type:

For 'analyze_vulnerability':
{
  "cognitiveVulnerabilityAssessment": {
    "biologicalLevel": {
      "arousalVulnerabilities": ["vulnerability1"],
      "egoDepletionWindows": ["timing1"],
      "physiologicalTriggers": ["trigger1"],
      "optimalAttackTiming": "description"
    },
    "psychologicalLevel": {
      "attentionalWeaknesses": ["weakness1"],
      "cognitiveLoadThreshold": 0-1,
      "emotionalTriggers": ["trigger1"],
      "beliefSystemVulnerabilities": ["vulnerability1"],
      "identityAnchors": ["anchor1"],
      "confirmationBiasTopics": ["topic1"]
    },
    "socialLevel": {
      "trustNetworkWeakPoints": ["weakpoint1"],
      "socialProofSusceptibility": 0-1,
      "authorityDeferenceScore": 0-1,
      "isolationVulnerability": 0-1,
      "groupIdentityStrength": 0-1
    },
    "overallVulnerabilityScore": 0-1,
    "primaryAttackSurface": "biological/psychological/social"
  }
}

For 'plan_campaign':
{
  "cognitiveOperationPlan": {
    "objective": "strategic goal",
    "targetMindshare": "what perception to achieve",
    "phaseStructure": [
      {
        "phase": 1,
        "name": "Preparation",
        "duration": "timeframe",
        "actions": ["action1"],
        "targetLevel": "biological/psychological/social",
        "expectedOutcome": "outcome"
      }
    ],
    "messagingFramework": {
      "coreNarrative": "main story",
      "anchorPhrases": ["phrase1"],
      "framingDevices": ["device1"],
      "emotionalHooks": ["hook1"]
    },
    "deliveryChannels": ["channel1"],
    "timingOptimization": "when to deploy",
    "feedbackLoops": ["measurement1"],
    "contingencyPlans": ["if X then Y"]
  }
}

For 'detect_attack':
{
  "attackDetectionAnalysis": {
    "attackIndicatorsFound": [
      {
        "indicator": "description",
        "level": "biological/psychological/social",
        "severity": 0-1,
        "evidence": "what was detected"
      }
    ],
    "narrativeAnomalies": ["anomaly1"],
    "coordinatedPatterns": ["pattern1"],
    "attributionAssessment": {
      "likelySource": "who",
      "confidence": 0-1,
      "methodology": "how determined"
    },
    "impactAssessment": {
      "currentPenetration": 0-1,
      "projectedSpread": "trajectory",
      "affectedDomains": ["domain1"]
    },
    "urgencyLevel": "low/medium/high/critical"
  }
}

For 'counter_operation':
{
  "counterOperationPlan": {
    "threatNeutralization": {
      "immediateActions": ["action1"],
      "shortTermDefense": ["action1"],
      "longTermImmunization": ["action1"]
    },
    "narrativeCountermeasures": {
      "prebunking": ["preemptive message"],
      "debunking": ["correction approach"],
      "inoculation": ["resilience building"]
    },
    "trustRestoration": {
      "credibilityRecovery": ["step1"],
      "relationshipRepair": ["action1"]
    },
    "cognitiveDefenseTraining": {
      "awarenessBuilding": ["topic1"],
      "criticalThinkingExercises": ["exercise1"],
      "resistanceStrategies": ["strategy1"]
    },
    "counterNarrative": {
      "coreMessage": "main counter-story",
      "deploymentStrategy": "how to spread",
      "expectedTimeToEffect": "duration"
    }
  }
}`;

    const userPrompt = `Operation Type: ${request.operationType}
Target Domain: ${request.targetDomain || 'all'}
${profileContext}
${psychProfileContext}
Context: ${request.context || 'General cognitive warfare analysis'}
${request.narrativeToAnalyze ? `Narrative to Analyze: ${request.narrativeToAnalyze}` : ''}

Provide comprehensive cognitive warfare analysis.`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId,
      functionName: 'cognitive-warfare-engine',
      profileId: request.profileId,
      temperature: 0.6,
    });

    const analysis = parseAIJson(aiResponse.content, {
      cognitiveVulnerabilityAssessment: {},
      cognitiveOperationPlan: {},
      attackDetectionAnalysis: {},
      counterOperationPlan: {}
    });

    // Store the operation
    await supabase.from('cognitive_warfare_operations').insert({
      user_id: userId,
      profile_id: request.profileId || null,
      operation_type: request.operationType,
      target_domain: request.targetDomain || 'all',
      context: request.context,
      analysis_result: analysis,
      created_at: new Date().toISOString()
    });

    // Also persist to ai_analyses for section availability detection
    if (request.profileId) {
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: request.profileId,
        analysis_type: 'cognitive_warfare',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      operationType: request.operationType,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Cognitive warfare engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
