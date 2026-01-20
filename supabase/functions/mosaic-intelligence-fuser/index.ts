/**
 * Mosaic Intelligence Fuser
 * AGIS Phase 3+ - Disaggregated data recomposition and multi-INT fusion
 * 
 * Synthesizes intelligence from disparate sources into unified assessments
 * Applies correlation, triangulation, and confidence weighting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MosaicFusionRequest {
  profileId: string;
  fusionType: 'comprehensive' | 'behavioral' | 'threat' | 'opportunity' | 'relationship';
  includeHistorical?: boolean;
  correlationThreshold?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'mosaic-intelligence-fuser', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle both user tokens and service role calls
    const authHeader = req.headers.get('Authorization');
    const body = await req.json();
    
    // Normalize parameter names
    const profileId = body.profileId || body.profile_id;
    const fusionType = body.fusionType || body.fusion_type || 'comprehensive';
    const includeHistorical = body.includeHistorical ?? body.include_historical ?? true;
    const correlationThreshold = body.correlationThreshold || body.correlation_threshold || 0.6;
    let userId = body.userId || body.user_id;
    
    // Check if service role call or user token
    const token = authHeader?.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;
    
    if (!isServiceRoleCall && authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
      if (!authError && user) {
        userId = user.id;
      } else if (!userId) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (!userId && !isServiceRoleCall) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create user object for queries
    const user = { id: userId };
    const request: MosaicFusionRequest = { profileId, fusionType, includeHistorical, correlationThreshold };

    // Gather ALL available intelligence sources
    const [
      profile,
      psychProfile,
      communications,
      media,
      analyses,
      observations,
      anomalies,
      milestones,
      relationships,
      betrayalPredictions,
      influenceProfiles,
      miceAssessments,
      semanticOps,
      sacredValues,
      behavioralDNA
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', request.profileId).single(),
      supabase.from('psychological_profiles').select('*').eq('profile_id', request.profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', request.profileId).order('occurred_at', { ascending: false }).limit(200),
      supabase.from('media').select('id, media_type, ai_metadata, created_at').eq('profile_id', request.profileId).limit(100),
      supabase.from('ai_analyses').select('*').eq('profile_id', request.profileId).order('generated_at', { ascending: false }).limit(50),
      supabase.from('contact_observations').select('*').eq('profile_id', request.profileId).order('created_at', { ascending: false }).limit(50),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', request.profileId).order('detected_at', { ascending: false }).limit(20),
      supabase.from('contact_life_milestones').select('*').eq('profile_id', request.profileId).limit(30),
      supabase.from('relationship_scores').select('*').eq('profile_id', request.profileId).order('calculated_at', { ascending: false }).limit(20),
      supabase.from('betrayal_predictions').select('*').eq('profile_id', request.profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', request.profileId).eq('analysis_type', 'influence_profile').limit(5),
      supabase.from('mice_assessments').select('*').eq('profile_id', request.profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('semantic_operations').select('*').eq('user_id', user.id).limit(10),
      supabase.from('sacred_values').select('*').eq('profile_id', request.profileId).limit(10),
      supabase.from('ai_analyses').select('*').eq('profile_id', request.profileId).eq('analysis_type', 'behavioral_dna').limit(3)
    ]);

    const systemPrompt = `You are an expert intelligence analyst specializing in multi-source intelligence fusion.
You apply mosaic theory, correlation analysis, and confidence-weighted synthesis.

MOSAIC INTELLIGENCE PRINCIPLES:

1. DISAGGREGATED DATA RECOMPOSITION
   - Individual data points reveal patterns when combined
   - Seemingly innocuous information becomes significant in aggregate
   - Cross-source correlation multiplies intelligence value

2. INTELLIGENCE COLLECTION DISCIPLINES (INTs):
   - HUMINT: Human source intelligence (communications, observations)
   - SIGINT: Signals intelligence (communication patterns, metadata)
   - IMINT: Imagery intelligence (photos, videos, visual analysis)
   - OSINT: Open source intelligence (public information)
   - SOCMINT: Social media intelligence
   - FININT: Financial intelligence
   - PSYINT: Psychological intelligence

3. CORRELATION METHODOLOGY:
   - Source triangulation (multiple sources confirming)
   - Temporal correlation (events in sequence)
   - Behavioral correlation (consistent patterns)
   - Contextual correlation (environmental factors)

4. CONFIDENCE WEIGHTING:
   - Source reliability rating
   - Information recency
   - Corroboration level
   - Contradiction assessment
   - Gaps and uncertainties

5. SYNTHESIS PRODUCTS:
   - Unified psychological profile
   - Threat assessment
   - Opportunity assessment
   - Relationship trajectory
   - Predictive models

Return JSON:
{
  "fusionSummary": {
    "profileCompleteness": 0-1,
    "sourcesAnalyzed": {
      "communications": number,
      "media": number,
      "observations": number,
      "analyses": number,
      "anomalies": number
    },
    "dataQuality": 0-1,
    "significantGaps": ["gap1"],
    "conflictingData": ["conflict1"]
  },
  "correlatedIntelligence": {
    "highConfidenceFindings": [
      {
        "finding": "description",
        "confidence": 0-1,
        "supportingSources": ["source1"],
        "corroborationLevel": "single/dual/triple/strong",
        "implications": ["implication1"]
      }
    ],
    "emergingPatterns": [
      {
        "pattern": "description",
        "firstDetected": "when",
        "frequency": "how often",
        "significance": 0-1,
        "predictiveValue": "what it suggests"
      }
    ],
    "anomalyAnalysis": [
      {
        "anomaly": "description",
        "deviationFrom": "baseline",
        "possibleExplanations": ["explanation1"],
        "investigationPriority": 0-1
      }
    ]
  },
  "unifiedPsychologicalAssessment": {
    "corePersonality": {
      "summary": "description",
      "confidence": 0-1,
      "stabilityRating": 0-1
    },
    "motivationalProfile": {
      "primaryDrivers": ["driver1"],
      "avoidanceMotivators": ["fear1"],
      "valueHierarchy": ["value1"]
    },
    "vulnerabilityMap": {
      "psychologicalVulnerabilities": ["vuln1"],
      "emotionalTriggers": ["trigger1"],
      "cognitiveBlindspots": ["blindspot1"]
    },
    "influenceProfile": {
      "susceptibleTechniques": ["technique1"],
      "resistantAreas": ["area1"],
      "optimalApproaches": ["approach1"]
    }
  },
  "threatAssessment": {
    "overallThreatLevel": 0-1,
    "threatVectors": [
      {
        "vector": "description",
        "probability": 0-1,
        "impact": 0-1,
        "timeframe": "when",
        "indicators": ["indicator1"]
      }
    ],
    "earlyWarningSignals": ["signal1"],
    "mitigationRecommendations": ["rec1"]
  },
  "opportunityAssessment": {
    "identifiedOpportunities": [
      {
        "opportunity": "description",
        "timing": "when",
        "approachMethod": "how",
        "successProbability": 0-1,
        "prerequisites": ["prereq1"]
      }
    ],
    "leveragePoints": ["point1"],
    "influencePathways": ["pathway1"]
  },
  "relationshipTrajectory": {
    "currentState": "description",
    "trajectory": "improving/stable/declining/volatile",
    "keyInfluencingFactors": ["factor1"],
    "projectedOutcome": "prediction",
    "interventionOpportunities": ["opportunity1"]
  },
  "predictiveModels": {
    "behaviorPredictions": [
      {
        "behavior": "what",
        "probability": 0-1,
        "timeframe": "when",
        "triggerConditions": ["condition1"]
      }
    ],
    "decisionPredictions": [
      {
        "decision": "what",
        "likelyOutcome": "outcome",
        "confidence": 0-1
      }
    ],
    "relationshipPredictions": [
      {
        "prediction": "what",
        "timeframe": "when",
        "confidence": 0-1
      }
    ]
  },
  "actionableIntelligence": {
    "immediatePriorities": ["action1"],
    "shortTermActions": ["action1"],
    "longTermStrategies": ["strategy1"],
    "informationGapsToFill": ["gap1"],
    "collectionRequirements": ["requirement1"]
  },
  "confidenceMatrix": {
    "overallAssessmentConfidence": 0-1,
    "highConfidenceAreas": ["area1"],
    "lowConfidenceAreas": ["area1"],
    "recommendedValidation": ["validation step"]
  }
}`;

    const userPrompt = `Perform mosaic intelligence fusion for profile:

Profile: ${profile.data?.full_name || 'Unknown'}
Relationship Type: ${profile.data?.relationship_type || 'Unknown'}
Fusion Type: ${request.fusionType}
Correlation Threshold: ${correlationThreshold}

AVAILABLE INTELLIGENCE SOURCES:

1. Psychological Profile:
${psychProfile.data ? JSON.stringify(psychProfile.data, null, 2).substring(0, 1500) : 'Not available'}

2. Communications (${communications.data?.length || 0} records):
${communications.data?.slice(0, 30).map(c => 
  `[${c.occurred_at}] ${c.direction}: ${c.content?.substring(0, 100)}... Sentiment: ${c.sentiment_score}`
).join('\n') || 'None'}

3. Media Analysis (${media.data?.length || 0} items):
${media.data?.slice(0, 10).map(m => 
  `[${m.media_type}] ${JSON.stringify(m.ai_metadata || {}).substring(0, 200)}`
).join('\n') || 'None'}

4. AI Analyses (${analyses.data?.length || 0} analyses):
${analyses.data?.slice(0, 10).map(a => 
  `[${a.analysis_type}] ${JSON.stringify(a.result || {}).substring(0, 200)}`
).join('\n') || 'None'}

5. Behavioral Observations:
${observations.data?.slice(0, 15).map(o => `- ${o.category}: ${o.observation}`).join('\n') || 'None'}

6. Anomalies Detected:
${anomalies.data?.map(a => `- ${a.anomaly_type}: ${a.description}`).join('\n') || 'None'}

7. Life Milestones:
${milestones.data?.map(m => `- ${m.milestone_type}: ${m.milestone_date}`).join('\n') || 'None'}

8. Betrayal Predictions:
${betrayalPredictions.data?.map(b => 
  `Defection Prob: ${b.defection_probability}, Trust: ${b.trust_score}`
).join('\n') || 'None'}

9. Influence Profile:
${influenceProfiles.data?.[0] ? JSON.stringify(influenceProfiles.data[0]).substring(0, 500) : 'None'}

10. MICE Assessment:
${miceAssessments.data?.[0] ? JSON.stringify(miceAssessments.data[0]).substring(0, 500) : 'None'}

11. Sacred Values:
${sacredValues.data?.map(s => `- ${s.value_name}: Violation Threshold ${s.violation_threshold}`).join('\n') || 'None'}

12. Behavioral DNA:
${behavioralDNA.data?.[0] ? JSON.stringify(behavioralDNA.data[0]).substring(0, 500) : 'None'}

Synthesize all available intelligence into a unified assessment.`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'mosaic-intelligence-fuser',
      profileId: request.profileId,
      temperature: 0.4,
    });

    const fusion = parseAIJson(aiResponse.content, {
      fusionSummary: {},
      correlatedIntelligence: {},
      unifiedPsychologicalAssessment: {},
      threatAssessment: {},
      opportunityAssessment: {},
      relationshipTrajectory: {},
      predictiveModels: {},
      actionableIntelligence: {},
      confidenceMatrix: {}
    });

    // Store the fusion result (idempotent)
    await supabase.from('ai_analyses').upsert({
      user_id: user.id,
      profile_id: request.profileId,
      analysis_type: 'mosaic_intelligence_fusion',
      result: fusion,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      fusion,
      fusionType: request.fusionType,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Mosaic intelligence fuser error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
