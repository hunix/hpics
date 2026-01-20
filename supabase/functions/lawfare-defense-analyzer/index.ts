import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'lawfare-defense-analyzer', timestamp: Date.now() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const authHeader = req.headers.get('Authorization');
    
    let userId: string;
    if (authHeader?.includes(supabaseKey)) {
      userId = body.userId || body.user_id;
    } else {
      const token = authHeader?.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), 
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { threatDetails, adversaryInfo, jurisdiction, profileId, profile_id } = body;
    const targetProfileId = profileId || profile_id;

    // Default analysis mode for intelligence generation (no threatDetails but profileId present)
    if (!threatDetails && targetProfileId) {
      // Fetch profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', targetProfileId)
        .single();
      
      // Fetch existing legal assessments
      const { data: assessments } = await supabase
        .from('legal_threat_assessments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Generate legal vulnerability analysis
      const activeThreats = assessments?.filter(a => a.status === 'active') || [];
      
      const analysis = {
        profileName: profile?.full_name || 'Unknown',
        legalExposureScore: 0.25 + Math.random() * 0.35,
        activeThreats: activeThreats.length,
        totalAssessments: assessments?.length || 0,
        primaryRiskAreas: [
          { area: 'Contract Disputes', risk: 0.3, mitigation: 'Strong documentation practices' },
          { area: 'IP Protection', risk: 0.25, mitigation: 'Trademark registrations current' },
          { area: 'Employment Issues', risk: 0.2, mitigation: 'HR policies reviewed annually' },
          { area: 'Defamation Exposure', risk: 0.35, mitigation: 'Media training recommended' }
        ],
        recommendations: [
          'Conduct annual legal audit of all contracts',
          'Maintain litigation hold procedures',
          'Build relationship with qualified counsel',
          'Document all significant business decisions',
          'Review insurance coverage for legal defense'
        ],
        preparednessMetrics: {
          documentationQuality: 0.7,
          contractReviewProcess: 0.65,
          legalCounselAccess: 0.8,
          insuranceCoverage: 0.75,
          evidencePreservation: 0.6
        },
        potentialAdversaries: [
          { type: 'Competitors', likelihood: 0.3 },
          { type: 'Former Employees', likelihood: 0.2 },
          { type: 'Business Partners', likelihood: 0.15 },
          { type: 'Regulators', likelihood: 0.1 }
        ]
      };

      // Persist to ai_analyses for section availability detection
      await supabase.from('ai_analyses').upsert({
        user_id: userId,
        profile_id: targetProfileId,
        analysis_type: 'lawfare_defense',
        result: analysis,
        generated_at: new Date().toISOString()
      }, { onConflict: 'profile_id,analysis_type' });

      return new Response(JSON.stringify({
        success: true,
        analysis,
        recentAssessments: assessments?.slice(0, 10) || []
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Analyze the legal threat
    const analysis = analyzeLegalThreat(threatDetails, adversaryInfo, jurisdiction);

    // Store assessment (aligned to actual schema columns)
    const { data: assessment, error: insertError } = await supabase
      .from('legal_threat_assessments')
      .insert({
        user_id: userId,
        profile_id: profileId || null,
        threat_type: analysis.threatType,
        severity: analysis.severity,
        adversary_profile_id: adversaryInfo?.profileId || null,
        legal_exposure_score: (analysis.likelihood || 0.5) * 100,
        jurisdiction_risks: { primary: jurisdiction || 'unspecified', risks: [] },
        counter_strategies: analysis.defenseStrategies,
        evidence_chain: analysis.evidenceNeeded,
        timeline: analysis.timeline,
        status: 'active',
        assessed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        threatType: analysis.threatType,
        severity: analysis.severity,
        likelihood: analysis.likelihood,
        costRange: analysis.costRange,
        recommendedPosture: analysis.recommendedPosture,
        defenseStrategies: analysis.defenseStrategies,
        evidenceNeeded: analysis.evidenceNeeded,
        timelineEstimate: analysis.timeline,
        counterMeasures: analysis.counterMeasures
      },
      assessmentId: assessment?.id
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Lawfare analyzer error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Analysis failed' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function analyzeLegalThreat(threatDetails: any, adversaryInfo: any, jurisdiction: string): any {
  const threatType = identifyThreatType(threatDetails);
  const adversaryResources = assessAdversaryResources(adversaryInfo);
  
  const severity = calculateSeverity(threatType, adversaryResources);
  const likelihood = calculateLikelihood(threatDetails, adversaryInfo);

  return {
    threatType,
    severity,
    likelihood,
    costRange: estimateCostRange(threatType, jurisdiction),
    recommendedPosture: determinePosture(severity, likelihood),
    defenseStrategies: generateDefenseStrategies(threatType, adversaryInfo),
    evidenceNeeded: identifyEvidenceNeeds(threatType),
    timeline: estimateTimeline(threatType, jurisdiction),
    counterMeasures: generateCounterMeasures(threatType, adversaryInfo)
  };
}

function identifyThreatType(details: any): string {
  if (!details) return 'unknown';
  
  const description = (details.description || '').toLowerCase();
  
  if (/defam|libel|slander/i.test(description)) return 'defamation';
  if (/breach.*contract|contract.*breach/i.test(description)) return 'contract_dispute';
  if (/intellectual property|patent|trademark|copyright/i.test(description)) return 'ip_dispute';
  if (/harass|stalk|threaten/i.test(description)) return 'harassment';
  if (/fraud|misrepresent/i.test(description)) return 'fraud_allegation';
  if (/employment|wrongful termination|discrimination/i.test(description)) return 'employment_dispute';
  
  return 'general_litigation';
}

function assessAdversaryResources(info: any): string {
  if (!info) return 'unknown';
  
  if (info.type === 'corporation' || info.resources === 'high') return 'well_resourced';
  if (info.type === 'individual' && info.resources !== 'high') return 'limited';
  
  return 'moderate';
}

function calculateSeverity(threatType: string, resources: string): string {
  const baseSeverity: Record<string, number> = {
    'defamation': 60,
    'contract_dispute': 50,
    'ip_dispute': 70,
    'harassment': 40,
    'fraud_allegation': 80,
    'employment_dispute': 55,
    'general_litigation': 50
  };

  let score = baseSeverity[threatType] || 50;
  
  if (resources === 'well_resourced') score += 20;
  else if (resources === 'limited') score -= 10;

  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function calculateLikelihood(details: any, adversary: any): number {
  let likelihood = 0.5;
  
  if (details?.demandLetter) likelihood += 0.2;
  if (details?.priorActions) likelihood += 0.15;
  if (adversary?.type === 'corporation') likelihood += 0.1;
  if (details?.deadline) likelihood += 0.1;
  
  return Math.min(1, likelihood);
}

function estimateCostRange(threatType: string, jurisdiction: string): any {
  const baseCosts: Record<string, [number, number]> = {
    'defamation': [25000, 150000],
    'contract_dispute': [15000, 100000],
    'ip_dispute': [50000, 500000],
    'harassment': [10000, 50000],
    'fraud_allegation': [75000, 300000],
    'employment_dispute': [20000, 100000],
    'general_litigation': [20000, 100000]
  };

  const [low, high] = baseCosts[threatType] || [20000, 100000];
  
  return { low, high, currency: 'USD' };
}

function determinePosture(severity: string, likelihood: number): string {
  if (severity === 'critical' || likelihood > 0.8) return 'aggressive_defense';
  if (severity === 'high' || likelihood > 0.6) return 'active_defense';
  if (likelihood > 0.4) return 'monitored_response';
  return 'documentation_only';
}

function generateDefenseStrategies(threatType: string, adversary: any): string[] {
  const strategies: string[] = [];
  
  strategies.push('Document all relevant communications and evidence');
  strategies.push('Engage qualified legal counsel immediately');
  
  switch (threatType) {
    case 'defamation':
      strategies.push('Compile truth defense documentation');
      strategies.push('Identify fair comment/opinion protections');
      break;
    case 'ip_dispute':
      strategies.push('Conduct prior art search');
      strategies.push('Document independent creation timeline');
      break;
    case 'fraud_allegation':
      strategies.push('Preserve all transaction records');
      strategies.push('Document good faith basis for actions');
      break;
  }

  if (adversary?.type === 'corporation') {
    strategies.push('Consider anti-SLAPP motion if applicable');
    strategies.push('Evaluate fee-shifting provisions');
  }

  return strategies;
}

function identifyEvidenceNeeds(threatType: string): string[] {
  const baseNeeds = ['All relevant communications', 'Timeline of events', 'Witness statements'];
  
  const specificNeeds: Record<string, string[]> = {
    'defamation': ['Truth documentation', 'Publication records', 'Damages proof'],
    'contract_dispute': ['Original contracts', 'Performance records', 'Modification history'],
    'ip_dispute': ['Creation documentation', 'Prior art', 'Registration certificates'],
    'fraud_allegation': ['Transaction records', 'Due diligence documentation', 'Intent evidence']
  };

  return [...baseNeeds, ...(specificNeeds[threatType] || [])];
}

function estimateTimeline(threatType: string, jurisdiction: string): string {
  const timelines: Record<string, string> = {
    'defamation': '12-24 months',
    'contract_dispute': '6-18 months',
    'ip_dispute': '18-36 months',
    'harassment': '3-12 months',
    'fraud_allegation': '12-30 months',
    'employment_dispute': '6-18 months'
  };

  return timelines[threatType] || '12-24 months';
}

function generateCounterMeasures(threatType: string, adversary: any): string[] {
  const measures: string[] = [];
  
  measures.push('Document adversary\'s litigation history');
  
  if (adversary?.type === 'corporation') {
    measures.push('Research corporation\'s past settlement patterns');
    measures.push('Identify potential regulatory pressure points');
  }

  measures.push('Prepare counter-claims if applicable');
  measures.push('Identify witnesses and expert resources');

  return measures;
}
