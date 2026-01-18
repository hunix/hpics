/**
 * Proportional Response Engine
 * AGIS Phase 5 - Calibrated counter-measures for defensive operations
 * 
 * Quantifies actions and generates proportional responses
 * Maintains operational limits while enabling full defensive capability
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProportionalResponseRequest {
  profileId?: string;
  incidentType: 'betrayal' | 'attack' | 'manipulation' | 'surveillance' | 'deception' | 'reputation_damage';
  incidentDescription: string;
  severityEstimate?: number; // 0-1
  impactAreas?: string[];
  desiredOutcome?: string;
  constraints?: string[];
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

    const request: ProportionalResponseRequest = await req.json();

    // Get adversary profile if available
    let adversaryContext = '';
    if (request.profileId) {
      const [profile, psychProfile] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', request.profileId).single(),
        supabase.from('psychological_profiles').select('*').eq('profile_id', request.profileId).single()
      ]);
      
      if (profile.data) {
        adversaryContext = `
Adversary Profile: ${profile.data.full_name || 'Unknown'}
Relationship: ${profile.data.relationship_type || 'Unknown'}
${psychProfile.data ? `
Psychological Profile:
- Big Five: O:${psychProfile.data.big_five_openness}/C:${psychProfile.data.big_five_conscientiousness}/E:${psychProfile.data.big_five_extraversion}/A:${psychProfile.data.big_five_agreeableness}/N:${psychProfile.data.big_five_neuroticism}
- Risk Tolerance: ${psychProfile.data.risk_tolerance}
- Conflict Style: ${psychProfile.data.conflict_style}
- Vulnerabilities: Known psychological vulnerabilities from profile` : ''}`;
      }
    }

    const systemPrompt = `You are an expert in game theory, conflict resolution, and strategic response calibration.
You generate proportional counter-measures that match the severity of actions taken against the user.

PROPORTIONALITY DOCTRINE:
1. Response magnitude should match action severity
2. Escalation should be gradual and signaled
3. De-escalation paths must remain available
4. Plausible deniability when appropriate
5. Legal and ethical boundaries observed
6. Defensive framing maintained

RESPONSE INTENSITY SCALE (0-100):
0-20: Minimal - Observation, documentation, subtle distancing
21-40: Moderate - Reduced engagement, information control, boundary setting
41-60: Significant - Active countermeasures, exposure of behavior, coalition building
61-80: Severe - Full defensive posture, reputation defense, strategic isolation
81-100: Maximum - All available defensive measures, public exposure if necessary

ACTION CATEGORIES:
- Information Operations: Control narrative, expose truth, counter propaganda
- Social Operations: Coalition building, isolation tactics, reputation management
- Economic Operations: Opportunity denial, resource competition, leverage deployment
- Psychological Operations: Strategic communication, perception management
- Legal Operations: Documentation, evidence preservation, potential legal action
- Cyber/Digital: Information security, exposure protection, digital footprint management

ESCALATION LADDER:
1. Warning signals (implicit)
2. Direct communication
3. Boundary enforcement
4. Defensive measures
5. Active countermeasures
6. Coalition involvement
7. Public disclosure
8. External authority engagement

CONSTRAINT CATEGORIES:
- Legal limits
- Ethical considerations
- Relationship preservation desires
- Reputation risks
- Resource availability
- Time constraints
- Third-party impacts

Return JSON:
{
  "incidentAnalysis": {
    "actionSeverityScore": 0-100,
    "impactDomains": [
      {
        "domain": "emotional/financial/reputational/professional/social",
        "impactSeverity": 0-1,
        "reversibility": 0-1,
        "immediacy": 0-1
      }
    ],
    "intentAssessment": {
      "likelyIntent": "deliberate/opportunistic/negligent/accidental",
      "maliceScore": 0-1,
      "premeditation": 0-1,
      "ongoingThreat": true/false
    },
    "damageInventory": ["damage1", "damage2"],
    "evidenceStrength": 0-1
  },
  "proportionalResponseOptions": [
    {
      "responseLevel": "minimal/moderate/significant/severe/maximum",
      "intensityScore": 0-100,
      "responseActions": [
        {
          "action": "specific action",
          "category": "information/social/economic/psychological/legal/digital",
          "timing": "when to execute",
          "resourcesRequired": ["resource1"],
          "expectedImpact": "outcome",
          "deniability": 0-1,
          "reversibility": 0-1
        }
      ],
      "escalationPath": "what comes next if needed",
      "deescalationSignals": ["signal1"],
      "proportionalityJustification": "why this matches the offense"
    }
  ],
  "recommendedResponse": {
    "optimalLevel": "level name",
    "reasoning": "why this level",
    "phaseStructure": [
      {
        "phase": 1,
        "name": "phase name",
        "actions": ["action1"],
        "duration": "timeframe",
        "successCriteria": "how to measure",
        "contingency": "if fails, then"
      }
    ],
    "communicationStrategy": {
      "messaging": "what to say",
      "tone": "how to say it",
      "channels": ["where to say it"],
      "audience": "who needs to hear"
    },
    "coalitionStrategy": {
      "alliesNeeded": ["ally type"],
      "recruitmentApproach": "how to bring them in",
      "roleAssignments": ["who does what"]
    }
  },
  "adversaryVulnerabilities": [
    {
      "vulnerability": "description",
      "exploitability": 0-1,
      "ethicalConsiderations": "limits",
      "tacticalApplication": "how to use"
    }
  ],
  "operationalBoundaries": {
    "legalLimits": ["limit1"],
    "ethicalLines": ["line1"],
    "reputationRisks": ["risk1"],
    "unintendedConsequences": ["consequence1"]
  },
  "successMetrics": {
    "shortTerm": ["metric1"],
    "mediumTerm": ["metric1"],
    "longTerm": ["metric1"],
    "earlyWarningIndicators": ["indicator1"]
  },
  "contingencyPlans": {
    "ifEscalates": ["action1"],
    "ifThirdPartyIntervenes": ["action1"],
    "ifExposed": ["action1"],
    "ifFails": ["action1"]
  }
}`;

    const userPrompt = `Generate proportional response options for this incident:

Incident Type: ${request.incidentType}
Description: ${request.incidentDescription}
Estimated Severity: ${request.severityEstimate ? (request.severityEstimate * 100).toFixed(0) + '%' : 'To be assessed'}
Impact Areas: ${request.impactAreas?.join(', ') || 'To be assessed'}
Desired Outcome: ${request.desiredOutcome || 'Neutralize threat and prevent recurrence'}
Constraints: ${request.constraints?.join(', ') || 'Standard ethical and legal constraints'}

${adversaryContext}

Provide calibrated response options matching the severity of the offense.`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'proportional-response-engine',
      profileId: request.profileId,
      temperature: 0.5,
    });

    const analysis = parseAIJson(aiResponse.content, {
      incidentAnalysis: {},
      proportionalResponseOptions: [],
      recommendedResponse: {},
      adversaryVulnerabilities: [],
      operationalBoundaries: {},
      successMetrics: {},
      contingencyPlans: {}
    });

    // Store the response plan
    // Type-safe access for AI-generated analysis fields
    const incidentAnalysis = analysis.incidentAnalysis as { actionSeverityScore?: number } | undefined;
    const recommendedResponse = analysis.recommendedResponse as { optimalLevel?: string } | undefined;
    const proportionalResponseOptions = analysis.proportionalResponseOptions as unknown[] | undefined;
    
    await supabase.from('proportional_responses').insert({
      user_id: user.id,
      profile_id: request.profileId || null,
      incident_type: request.incidentType,
      incident_description: request.incidentDescription,
      severity_score: incidentAnalysis?.actionSeverityScore || request.severityEstimate,
      recommended_response_level: recommendedResponse?.optimalLevel,
      response_options: proportionalResponseOptions || [],
      analysis_result: analysis,
      created_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      incidentType: request.incidentType,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Proportional response engine error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
