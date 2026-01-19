/**
 * MICE Recruitment Analyzer
 * AGIS Phase 3 - CIA-style Money/Ideology/Compromise/Ego vulnerability scoring
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MICERequest {
  profileId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'mice-recruitment-analyzer', timestamp: Date.now() }), {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId }: MICERequest = await req.json();

    // Gather intelligence on target
    const [profile, messages, observations, analyses] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('messages').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).limit(50),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).limit(20)
    ]);

    const systemPrompt = `You are an expert intelligence analyst specializing in human motivation and recruitment.
Apply the MICE framework (Money, Ideology, Compromise, Ego) used by intelligence agencies.

MICE Framework:
M - MONEY: Financial pressures, materialism, debt, lifestyle beyond means
I - IDEOLOGY: Beliefs, grievances, sense of injustice, political alignment
C - COMPROMISE: Secrets, vulnerabilities, past mistakes, blackmail potential
E - EGO: Recognition needs, resentment, feeling undervalued, narcissism

For each factor, assess:
- Vulnerability level (0-1)
- Specific indicators from the data
- Optimal approach angles
- Risk factors for recruitment

Return JSON:
{
  "miceProfile": {
    "money": {
      "vulnerabilityScore": 0-1,
      "indicators": ["debt signals", "lifestyle indicators"],
      "financialPressures": ["specific pressures"],
      "materialismLevel": 0-1,
      "approachAngle": "how to leverage",
      "riskLevel": "low/medium/high"
    },
    "ideology": {
      "vulnerabilityScore": 0-1,
      "coreBeliefs": ["belief1", "belief2"],
      "grievances": ["grievance1"],
      "causeAlignment": "what causes they support",
      "approachAngle": "how to leverage",
      "riskLevel": "low/medium/high"
    },
    "compromise": {
      "vulnerabilityScore": 0-1,
      "potentialSecrets": ["inferred secrets"],
      "pastMistakes": ["known issues"],
      "leveragePoints": ["what could be used"],
      "approachAngle": "how to leverage",
      "riskLevel": "low/medium/high"
    },
    "ego": {
      "vulnerabilityScore": 0-1,
      "recognitionNeeds": ["what recognition they seek"],
      "resentments": ["who/what they resent"],
      "narcissisticTraits": ["trait1"],
      "approachAngle": "how to leverage",
      "riskLevel": "low/medium/high"
    }
  },
  "overallAssessment": {
    "primaryVulnerability": "M/I/C/E",
    "secondaryVulnerability": "M/I/C/E",
    "recruitmentLikelihood": 0-1,
    "optimalApproach": "recommended strategy",
    "approachScripts": ["opening line 1", "follow-up"],
    "warningSignals": ["what to watch for"],
    "timelineEstimate": "how long recruitment takes"
  },
  "riskAssessment": {
    "counterIntelligenceRisk": 0-1,
    "exposureRisk": 0-1,
    "blowbackPotential": "what could go wrong",
    "mitigationStrategies": ["strategy1"]
  }
}`;

    const userPrompt = `Analyze MICE vulnerabilities for recruitment potential:

Profile: ${profile.data?.full_name || 'Unknown'}
Company: ${profile.data?.company || 'Unknown'}
Position: ${profile.data?.job_title || 'Unknown'}
Location: ${profile.data?.location || 'Unknown'}

Recent Communications (${messages.data?.length || 0} messages):
${messages.data?.slice(0, 20).map(m => `- ${m.content?.substring(0, 200)}`).join('\n') || 'No messages'}

Observations (${observations.data?.length || 0}):
${observations.data?.slice(0, 10).map(o => `- ${o.category}: ${o.observation_text?.substring(0, 150)}`).join('\n') || 'No observations'}

Previous Analyses:
${analyses.data?.slice(0, 5).map(a => `- ${a.analysis_type}: ${JSON.stringify(a.result).substring(0, 200)}`).join('\n') || 'No analyses'}`;

    const aiResponse = await callAI({
      model: selectModel('quality'),
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      userId: user.id,
      functionName: 'mice-recruitment-analyzer',
      profileId,
      temperature: 0.6,
    });

    const assessment = parseAIJson(aiResponse.content, {
      miceProfile: {
        money: { vulnerabilityScore: 0.5 },
        ideology: { vulnerabilityScore: 0.5 },
        compromise: { vulnerabilityScore: 0.5 },
        ego: { vulnerabilityScore: 0.5 }
      },
      overallAssessment: { primaryVulnerability: 'E', recruitmentLikelihood: 0.5 },
      riskAssessment: {}
    });

    // Store the assessment
    await supabase.from('mice_assessments').insert({
      user_id: user.id,
      profile_id: profileId,
      money_vulnerability: assessment.miceProfile.money.vulnerabilityScore,
      money_indicators: assessment.miceProfile.money.indicators,
      ideology_alignment: assessment.miceProfile.ideology,
      ideology_conflicts: assessment.miceProfile.ideology.grievances,
      compromise_material: assessment.miceProfile.compromise.leveragePoints,
      compromise_leverage_score: assessment.miceProfile.compromise.vulnerabilityScore,
      ego_needs: assessment.miceProfile.ego.recognitionNeeds,
      ego_vulnerabilities: assessment.miceProfile.ego,
      recruitment_likelihood: assessment.overallAssessment.recruitmentLikelihood,
      optimal_approach: assessment.overallAssessment.optimalApproach,
      approach_scripts: assessment.overallAssessment.approachScripts,
      risk_assessment: assessment.riskAssessment
    });

    return new Response(JSON.stringify({
      success: true,
      assessment,
      costCents: aiResponse.costCents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('MICE analyzer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
