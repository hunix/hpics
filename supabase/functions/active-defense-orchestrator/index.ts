/**
 * Active Defense Orchestrator
 * AGIS Phase 3+ - MITRE Engage-based defensive operations
 * 
 * Implements active defense framework:
 * - Prepare: Baseline threat landscape
 * - Expose: Honeypot/honeytoken deployment
 * - Affect: Adversary disruption
 * - Elicit: Intelligence extraction
 * - Understand: TTP cataloging
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActiveDefenseRequest {
  profileId?: string;
  operationType: 'threat_assessment' | 'deploy_deception' | 'detect_probing' | 'counter_surveillance' | 'social_engineering_defense';
  context?: string;
  suspectedAdversary?: string;
  deceptionAssets?: string[];
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

    const request: ActiveDefenseRequest = await req.json();

    // Get recent security events and deception operations
    const [securityEvents, deceptionOps, counterIntelAlerts] = await Promise.all([
      supabase.from('security_incidents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('deception_operations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('behavioral_anomalies').select('*').eq('user_id', user.id).eq('is_resolved', false).limit(20)
    ]);

    const systemPrompt = `You are an expert in active defense, counter-intelligence, and defensive deception operations.
You apply MITRE Engage framework, RED Team/BLUE Team methodologies, and intelligence tradecraft.

MITRE ENGAGE FRAMEWORK:

1. PREPARE - Baseline and readiness
   - Threat landscape mapping
   - Attack surface analysis  
   - Defensive posture assessment
   - Playbook development

2. EXPOSE - Detect adversary presence
   - Honeypot deployment strategies
   - Honeytoken placement
   - Canary triggers
   - Tripwire configurations

3. AFFECT - Disrupt adversary operations
   - Misdirection tactics
   - Resource exhaustion
   - Attribution confusion
   - Operational tempo disruption

4. ELICIT - Extract adversary intelligence
   - Behavior observation
   - Capability assessment
   - Intent determination
   - TTP extraction

5. UNDERSTAND - Build threat intelligence
   - Adversary profiling
   - Campaign mapping
   - Pattern recognition
   - Predictive modeling

SOCIAL ENGINEERING DEFENSE:
- T1341: Build Social Network Persona (detection)
- Romantic false flag recognition
- Professional networking attacks
- Trust manipulation detection
- Elicitation technique awareness

COUNTER-SURVEILLANCE TECHNIQUES:
- Communication pattern analysis
- Anomalous interest detection
- Information probing recognition
- Relationship trajectory anomalies
- Parallel construction indicators

DECEPTION ASSETS:
- Honey credentials (fake passwords/tokens)
- Honeytokens (bait documents/files)
- Synthetic personas (decoy identities)
- Canary services (tripwire systems)
- Breadcrumb trails (misdirection paths)

Return JSON based on operation type:

For 'threat_assessment':
{
  "threatLandscape": {
    "identifiedThreats": [
      {
        "threatType": "type",
        "source": "suspected source",
        "capability": 0-1,
        "intent": 0-1,
        "opportunity": 0-1,
        "overallThreatScore": 0-1
      }
    ],
    "attackSurfaceAnalysis": {
      "digitalExposure": ["exposure1"],
      "socialExposure": ["exposure1"],
      "physicalExposure": ["exposure1"],
      "informationLeakage": ["leak1"]
    },
    "vulnerabilityAssessment": {
      "criticalVulnerabilities": ["vuln1"],
      "exploitableWeaknesses": ["weakness1"],
      "prioritizedRisks": ["risk1"]
    },
    "defensivePosture": {
      "currentState": "description",
      "gaps": ["gap1"],
      "recommendations": ["rec1"]
    },
    "threatActorProfiles": [
      {
        "actorType": "type",
        "motivation": "why",
        "capabilities": ["cap1"],
        "knownTTPs": ["ttp1"]
      }
    ]
  }
}

For 'deploy_deception':
{
  "deceptionOperationPlan": {
    "objective": "goal",
    "deceptionAssets": [
      {
        "assetType": "honeypot/honeytoken/persona/canary",
        "deployment": "where/how to place",
        "baitValue": "why adversary would engage",
        "triggerMechanism": "how to detect interaction",
        "intelligence Yield": "what we learn when triggered"
      }
    ],
    "coverStory": "believable narrative for deception",
    "operationalSecurity": ["OPSEC consideration1"],
    "triggerThresholds": {
      "lowAlert": "minor interaction",
      "mediumAlert": "concerning interaction",
      "highAlert": "confirmed compromise"
    },
    "responsePlaybook": {
      "onLowAlert": ["action1"],
      "onMediumAlert": ["action1"],
      "onHighAlert": ["action1"]
    },
    "maintenanceSchedule": "how often to rotate/refresh"
  }
}

For 'detect_probing':
{
  "probingDetectionAnalysis": {
    "suspiciousPatterns": [
      {
        "pattern": "description",
        "frequency": "how often",
        "source": "who/what",
        "targetedAssets": ["asset1"],
        "threatLevel": 0-1
      }
    ],
    "elicitationAttempts": [
      {
        "technique": "name",
        "context": "when/where",
        "targetedInfo": "what they wanted",
        "responseGiven": "what was disclosed",
        "riskAssessment": "impact"
      }
    ],
    "anomalousInterests": [
      {
        "topic": "what",
        "askedBy": "who",
        "normalcy": 0-1,
        "concern Level": 0-1
      }
    ],
    "recommendedActions": ["action1"],
    "urgencyLevel": "low/medium/high/critical"
  }
}

For 'counter_surveillance':
{
  "counterSurveillanceReport": {
    "surveillanceIndicators": [
      {
        "indicator": "description",
        "confidence": 0-1,
        "type": "physical/digital/social",
        "evidence": ["evidence1"]
      }
    ],
    "potentialWatchers": [
      {
        "profile": "who",
        "motivation": "why",
        "methods": ["how"],
        "capability": 0-1
      }
    ],
    "informationLeakageAssessment": {
      "confirmedLeaks": ["leak1"],
      "suspectedLeaks": ["leak1"],
      "impactAssessment": "damage evaluation"
    },
    "counterMeasures": {
      "immediate": ["action1"],
      "shortTerm": ["action1"],
      "longTerm": ["action1"]
    },
    "behavioralChanges": ["recommended change1"],
    "communicationSecurity": ["improvement1"]
  }
}

For 'social_engineering_defense':
{
  "socialEngineeringDefense": {
    "attackVectorsDetected": [
      {
        "vector": "description",
        "attacker": "who",
        "technique": "method used",
        "targetedInfo": "what they want",
        "stage": "reconnaissance/rapport/exploitation/exfiltration",
        "riskLevel": 0-1
      }
    ],
    "romanticFalseFlagIndicators": [
      {
        "indicator": "sign",
        "severity": 0-1,
        "context": "details"
      }
    ],
    "professionalNetworkingThreats": [
      {
        "contact": "who",
        "suspiciousBehaviors": ["behavior1"],
        "likelyObjective": "goal",
        "recommendation": "action"
      }
    ],
    "trustManipulationPatterns": ["pattern1"],
    "counterElicitationStrategies": ["strategy1"],
    "safeResponseTemplates": ["template1"],
    "trainingRecommendations": ["topic1"]
  }
}`;

    const contextInfo = `
Recent Security Events: ${securityEvents.data?.length || 0}
Active Deception Operations: ${deceptionOps.data?.length || 0}
Unresolved Anomalies: ${counterIntelAlerts.data?.length || 0}
${request.suspectedAdversary ? `Suspected Adversary: ${request.suspectedAdversary}` : ''}
${request.deceptionAssets ? `Available Deception Assets: ${request.deceptionAssets.join(', ')}` : ''}
Context: ${request.context || 'General active defense assessment'}`;

    const userPrompt = `Operation Type: ${request.operationType}
${contextInfo}

Provide comprehensive active defense analysis and recommendations.`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'active-defense-orchestrator',
      profileId: request.profileId,
      temperature: 0.5,
    });

    const analysis = parseAIJson(aiResponse.content, {
      threatLandscape: {},
      deceptionOperationPlan: {},
      probingDetectionAnalysis: {},
      counterSurveillanceReport: {},
      socialEngineeringDefense: {}
    });

    // Store the operation
    await supabase.from('active_defense_operations').insert({
      user_id: user.id,
      profile_id: request.profileId || null,
      operation_type: request.operationType,
      context: request.context,
      analysis_result: analysis,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      operationType: request.operationType,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Active defense orchestrator error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
