/**
 * Insider Threat Matrix Engine (v8.0)
 * 
 * Source: ForScie Insider Threat Matrix 2025
 * 
 * Maps attack lifecycle across 5 themes: Motive, Means, Preparation, 
 * Infringement, Anti-Forensics. Detects 71% of threats during Preparation 
 * phase before active damage.
 * 
 * Analysis Type: insider_threat_matrix
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MotiveIndicator {
  category: 'financial' | 'ideological' | 'coercion' | 'ego' | 'disgruntlement';
  strength: number;
  evidence: string[];
  riskMultiplier: number;
}

interface MeansAssessment {
  accessLevel: 'minimal' | 'standard' | 'elevated' | 'privileged' | 'administrative';
  technicalCapability: number;
  insiderKnowledge: number;
  resourceAccess: string[];
}

interface PreparationSignal {
  type: string;
  detected_at: string;
  confidence: number;
  description: string;
  mitreAttackMapping?: string;
}

interface InfringementPattern {
  type: 'data_exfiltration' | 'privilege_abuse' | 'sabotage' | 'fraud' | 'espionage';
  severity: number;
  frequency: number;
  lastOccurrence?: string;
}

interface AntiForensicsIndicator {
  technique: string;
  sophistication: number;
  detected: boolean;
  evidence: string[];
}

interface InsiderThreatAnalysis {
  threatScore: number;
  lifecyclePhase: 'dormant' | 'motive_formation' | 'preparation' | 'active' | 'post_incident';
  motiveIndicators: MotiveIndicator[];
  meansAssessment: MeansAssessment;
  preparationSignals: PreparationSignal[];
  infringementPatterns: InfringementPattern[];
  antiForensicsIndicators: AntiForensicsIndicator[];
  hrSentimentScore: number;
  financialPressureScore: number;
  ideologicalRadicalizationScore: number;
  riskClassification: 'low' | 'moderate' | 'elevated' | 'high' | 'critical';
  interventionRecommendations: string[];
  timelineProjection: {
    estimatedEscalation_days: number | null;
    confidenceLevel: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'insider-threat-matrix-engine', 
      timestamp: Date.now() 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userId = user.id;
    }

    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Missing profileId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[INSIDER-THREAT] Starting matrix analysis for profile ${profileId}`);

    // Fetch comprehensive profile data
    const [
      profileResult,
      communicationsResult,
      observationsResult,
      financialResult,
      behavioralResult,
      socialEngineeringResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(200),
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).order('observation_date', { ascending: false }).limit(100),
      supabase.from('financial_intelligence').select('*').eq('profile_id', profileId).limit(50),
      supabase.from('behavioral_baselines').select('*').eq('profile_id', profileId).limit(10),
      supabase.from('social_engineering_incidents').select('*').eq('profile_id', profileId).limit(20)
    ]);

    const profile = profileResult.data;
    const communications = communicationsResult.data || [];
    const observations = observationsResult.data || [];
    const financialData = financialResult.data || [];
    const behavioralBaselines = behavioralResult.data || [];
    const socialEngineering = socialEngineeringResult.data || [];

    // Analyze motive indicators (MICE: Money, Ideology, Coercion, Ego)
    const motiveIndicators = analyzeMotiveIndicators(communications, observations, financialData);
    
    // Assess means (access, capability, knowledge)
    const meansAssessment = assessMeans(profile, behavioralBaselines);
    
    // Detect preparation signals
    const preparationSignals = detectPreparationSignals(communications, observations, socialEngineering);
    
    // Analyze infringement patterns
    const infringementPatterns = analyzeInfringementPatterns(observations, socialEngineering);
    
    // Detect anti-forensics indicators
    const antiForensicsIndicators = detectAntiForensics(communications, observations);
    
    // Calculate component scores
    const hrSentimentScore = calculateHRSentiment(observations, communications);
    const financialPressureScore = calculateFinancialPressure(financialData, observations);
    const ideologicalRadicalizationScore = calculateIdeologicalRisk(communications, observations);
    
    // Determine lifecycle phase
    const lifecyclePhase = determineLifecyclePhase(preparationSignals, infringementPatterns, motiveIndicators);
    
    // Calculate overall threat score
    const threatScore = calculateThreatScore(
      motiveIndicators,
      meansAssessment,
      preparationSignals,
      infringementPatterns,
      antiForensicsIndicators
    );
    
    // Classify risk level
    const riskClassification = classifyRisk(threatScore, lifecyclePhase);
    
    // Generate intervention recommendations
    const interventionRecommendations = generateInterventions(riskClassification, lifecyclePhase, motiveIndicators);
    
    // Project timeline
    const timelineProjection = projectTimeline(lifecyclePhase, preparationSignals, threatScore);

    const analysis: InsiderThreatAnalysis = {
      threatScore,
      lifecyclePhase,
      motiveIndicators,
      meansAssessment,
      preparationSignals,
      infringementPatterns,
      antiForensicsIndicators,
      hrSentimentScore,
      financialPressureScore,
      ideologicalRadicalizationScore,
      riskClassification,
      interventionRecommendations,
      timelineProjection
    };

    // Store in insider_threat_assessments table
    await supabase.from('insider_threat_assessments').upsert({
      profile_id: profileId,
      user_id: userId,
      threat_score: threatScore,
      lifecycle_phase: lifecyclePhase,
      motive_indicators: motiveIndicators,
      means_assessment: meansAssessment,
      preparation_signals: preparationSignals,
      infringement_patterns: infringementPatterns,
      anti_forensics_indicators: antiForensicsIndicators,
      hr_sentiment_score: hrSentimentScore,
      financial_pressure_score: financialPressureScore,
      ideological_radicalization_score: ideologicalRadicalizationScore,
      risk_classification: riskClassification,
      intervention_recommendations: interventionRecommendations,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id'
    });

    // Also store in ai_analyses for pipeline integration
    await supabase.from('ai_analyses').upsert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: 'insider_threat_matrix',
      result: analysis,
      confidence_score: 1 - threatScore, // Inverse - lower threat = higher confidence in safety
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'profile_id,analysis_type'
    });

    console.log(`[INSIDER-THREAT] Completed - Risk: ${riskClassification}, Phase: ${lifecyclePhase}`);

    return new Response(JSON.stringify({
      success: true,
      analysis_type: 'insider_threat_matrix',
      ...analysis
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[INSIDER-THREAT] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function analyzeMotiveIndicators(
  communications: Record<string, unknown>[],
  observations: Record<string, unknown>[],
  financialData: Record<string, unknown>[]
): MotiveIndicator[] {
  const indicators: MotiveIndicator[] = [];

  // Financial motive analysis
  const financialStress = financialData.some(f => 
    Number(f.debt_level) > 0.7 || Number(f.income_volatility) > 0.5
  );
  if (financialStress || financialData.length === 0) {
    indicators.push({
      category: 'financial',
      strength: financialStress ? 0.7 : 0.3,
      evidence: financialStress 
        ? ['High debt indicators', 'Income instability detected']
        : ['Limited financial visibility'],
      riskMultiplier: financialStress ? 1.5 : 1.0
    });
  }

  // Disgruntlement analysis
  const negativeSentiment = communications.filter(c => 
    Number(c.sentiment_score) < -0.3
  );
  if (negativeSentiment.length > communications.length * 0.3) {
    indicators.push({
      category: 'disgruntlement',
      strength: Math.min(negativeSentiment.length / communications.length, 0.9),
      evidence: ['Consistent negative sentiment in communications', 'Potential workplace dissatisfaction'],
      riskMultiplier: 1.4
    });
  }

  // Ideological indicators
  const ideologicalObs = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('political') ||
    String(o.context || '').toLowerCase().includes('ideolog')
  );
  if (ideologicalObs.length > 0) {
    indicators.push({
      category: 'ideological',
      strength: Math.min(ideologicalObs.length * 0.15, 0.8),
      evidence: ideologicalObs.slice(0, 3).map(o => String(o.context || '').substring(0, 50)),
      riskMultiplier: 1.6
    });
  }

  // Ego-driven indicators
  const egoIndicators = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('recognition') ||
    String(o.context || '').toLowerCase().includes('undervalued')
  );
  if (egoIndicators.length > 0) {
    indicators.push({
      category: 'ego',
      strength: Math.min(egoIndicators.length * 0.2, 0.7),
      evidence: ['Recognition-seeking behavior', 'Feelings of being undervalued'],
      riskMultiplier: 1.2
    });
  }

  return indicators;
}

function assessMeans(
  profile: Record<string, unknown> | null,
  behavioralBaselines: Record<string, unknown>[]
): MeansAssessment {
  const jobTitle = String(profile?.job_title || '').toLowerCase();
  
  let accessLevel: MeansAssessment['accessLevel'] = 'standard';
  if (jobTitle.includes('admin') || jobTitle.includes('director')) accessLevel = 'administrative';
  else if (jobTitle.includes('manager') || jobTitle.includes('lead')) accessLevel = 'elevated';
  else if (jobTitle.includes('senior') || jobTitle.includes('principal')) accessLevel = 'privileged';

  const technicalCapability = behavioralBaselines.some(b => 
    String(b.baseline_type || '').includes('technical')
  ) ? 0.7 : 0.4;

  return {
    accessLevel,
    technicalCapability,
    insiderKnowledge: Math.min(0.3 + (behavioralBaselines.length * 0.1), 0.9),
    resourceAccess: [
      'Internal communications',
      'Contact database',
      accessLevel === 'administrative' ? 'System configurations' : null,
      accessLevel !== 'standard' ? 'Sensitive documents' : null
    ].filter(Boolean) as string[]
  };
}

function detectPreparationSignals(
  communications: Record<string, unknown>[],
  observations: Record<string, unknown>[],
  socialEngineering: Record<string, unknown>[]
): PreparationSignal[] {
  const signals: PreparationSignal[] = [];

  // Unusual access pattern signals
  const unusualHours = communications.filter(c => {
    const hour = new Date(String(c.created_at)).getHours();
    return hour < 6 || hour > 22;
  });
  if (unusualHours.length > communications.length * 0.2) {
    signals.push({
      type: 'unusual_access_hours',
      detected_at: new Date().toISOString(),
      confidence: 0.7,
      description: 'Significant activity outside normal hours',
      mitreAttackMapping: 'T1078 - Valid Accounts'
    });
  }

  // Data staging signals
  const dataStagingObs = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('download') ||
    String(o.context || '').toLowerCase().includes('export') ||
    String(o.context || '').toLowerCase().includes('copy')
  );
  if (dataStagingObs.length > 0) {
    signals.push({
      type: 'data_staging',
      detected_at: dataStagingObs[0]?.observation_date as string || new Date().toISOString(),
      confidence: 0.65,
      description: 'Potential data collection/staging activity',
      mitreAttackMapping: 'T1074 - Data Staged'
    });
  }

  // Social engineering susceptibility
  if (socialEngineering.length > 0) {
    signals.push({
      type: 'social_engineering_exposure',
      detected_at: socialEngineering[0]?.created_at as string || new Date().toISOString(),
      confidence: 0.75,
      description: 'Prior social engineering incidents on record',
      mitreAttackMapping: 'T1566 - Phishing'
    });
  }

  return signals;
}

function analyzeInfringementPatterns(
  observations: Record<string, unknown>[],
  socialEngineering: Record<string, unknown>[]
): InfringementPattern[] {
  const patterns: InfringementPattern[] = [];

  // Check for data exfiltration patterns
  const exfilIndicators = observations.filter(o =>
    String(o.observation_type || '').toLowerCase().includes('data') ||
    String(o.context || '').toLowerCase().includes('transfer')
  );
  if (exfilIndicators.length > 0) {
    patterns.push({
      type: 'data_exfiltration',
      severity: Math.min(exfilIndicators.length * 0.2, 0.8),
      frequency: exfilIndicators.length,
      lastOccurrence: exfilIndicators[0]?.observation_date as string
    });
  }

  // Check for privilege abuse
  const privilegeAbuse = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('unauthorized') ||
    String(o.context || '').toLowerCase().includes('exceed')
  );
  if (privilegeAbuse.length > 0) {
    patterns.push({
      type: 'privilege_abuse',
      severity: Math.min(privilegeAbuse.length * 0.25, 0.9),
      frequency: privilegeAbuse.length,
      lastOccurrence: privilegeAbuse[0]?.observation_date as string
    });
  }

  return patterns;
}

function detectAntiForensics(
  communications: Record<string, unknown>[],
  observations: Record<string, unknown>[]
): AntiForensicsIndicator[] {
  const indicators: AntiForensicsIndicator[] = [];

  // Log deletion indicators
  const deletionPatterns = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('delete') ||
    String(o.context || '').toLowerCase().includes('clear')
  );
  if (deletionPatterns.length > 0) {
    indicators.push({
      technique: 'Log Deletion',
      sophistication: 0.5,
      detected: true,
      evidence: ['Deletion activity patterns observed']
    });
  }

  // Encryption usage
  const encryptionIndicators = communications.filter(c =>
    String(c.content || '').includes('encrypted') ||
    String(c.channel || '').includes('secure')
  );
  if (encryptionIndicators.length > communications.length * 0.5) {
    indicators.push({
      technique: 'Communication Encryption',
      sophistication: 0.7,
      detected: true,
      evidence: ['High proportion of encrypted communications']
    });
  }

  return indicators;
}

function calculateHRSentiment(
  observations: Record<string, unknown>[],
  communications: Record<string, unknown>[]
): number {
  const hrRelated = observations.filter(o =>
    String(o.context || '').toLowerCase().includes('hr') ||
    String(o.context || '').toLowerCase().includes('management') ||
    String(o.context || '').toLowerCase().includes('performance')
  );

  if (hrRelated.length === 0) return 0.5; // Neutral baseline

  const sentimentSum = communications.reduce((sum, c) => sum + (Number(c.sentiment_score) || 0), 0);
  const avgSentiment = sentimentSum / Math.max(communications.length, 1);

  return Math.max(0, Math.min(1, (avgSentiment + 1) / 2)); // Normalize to 0-1
}

function calculateFinancialPressure(
  financialData: Record<string, unknown>[],
  observations: Record<string, unknown>[]
): number {
  if (financialData.length === 0) return 0.3; // Unknown = moderate concern

  const stressIndicators = financialData.filter(f =>
    Number(f.debt_level) > 0.5 ||
    Number(f.income_volatility) > 0.4 ||
    Number(f.risk_score) > 0.6
  );

  return Math.min(stressIndicators.length / Math.max(financialData.length, 1) + 0.2, 1);
}

function calculateIdeologicalRisk(
  communications: Record<string, unknown>[],
  observations: Record<string, unknown>[]
): number {
  const ideologicalContent = [
    ...communications.filter(c => 
      String(c.content || '').toLowerCase().includes('cause') ||
      String(c.content || '').toLowerCase().includes('belief')
    ),
    ...observations.filter(o =>
      String(o.context || '').toLowerCase().includes('ideolog') ||
      String(o.context || '').toLowerCase().includes('extremi')
    )
  ];

  return Math.min(ideologicalContent.length * 0.1, 0.9);
}

function determineLifecyclePhase(
  preparationSignals: PreparationSignal[],
  infringementPatterns: InfringementPattern[],
  motiveIndicators: MotiveIndicator[]
): InsiderThreatAnalysis['lifecyclePhase'] {
  if (infringementPatterns.some(p => p.severity > 0.7)) return 'active';
  if (preparationSignals.length > 2) return 'preparation';
  if (motiveIndicators.some(m => m.strength > 0.6)) return 'motive_formation';
  return 'dormant';
}

function calculateThreatScore(
  motiveIndicators: MotiveIndicator[],
  meansAssessment: MeansAssessment,
  preparationSignals: PreparationSignal[],
  infringementPatterns: InfringementPattern[],
  antiForensicsIndicators: AntiForensicsIndicator[]
): number {
  const motiveScore = motiveIndicators.reduce((sum, m) => sum + (m.strength * m.riskMultiplier), 0) / Math.max(motiveIndicators.length, 1);
  const meansScore = (['administrative', 'privileged'].includes(meansAssessment.accessLevel) ? 0.8 : 0.4) * meansAssessment.technicalCapability;
  const prepScore = Math.min(preparationSignals.length * 0.15, 0.6);
  const infringementScore = infringementPatterns.reduce((sum, p) => sum + p.severity, 0) / Math.max(infringementPatterns.length, 1);
  const antiForensicsScore = antiForensicsIndicators.filter(i => i.detected).length * 0.15;

  return Math.min(
    (motiveScore * 0.25) + (meansScore * 0.2) + (prepScore * 0.25) + (infringementScore * 0.2) + (antiForensicsScore * 0.1),
    1
  );
}

function classifyRisk(threatScore: number, phase: InsiderThreatAnalysis['lifecyclePhase']): InsiderThreatAnalysis['riskClassification'] {
  if (phase === 'active') return 'critical';
  if (threatScore > 0.8) return 'critical';
  if (threatScore > 0.6 || phase === 'preparation') return 'high';
  if (threatScore > 0.4 || phase === 'motive_formation') return 'elevated';
  if (threatScore > 0.2) return 'moderate';
  return 'low';
}

function generateInterventions(
  riskLevel: InsiderThreatAnalysis['riskClassification'],
  phase: InsiderThreatAnalysis['lifecyclePhase'],
  motiveIndicators: MotiveIndicator[]
): string[] {
  const interventions: string[] = [];

  if (riskLevel === 'critical') {
    interventions.push('IMMEDIATE: Activate incident response team');
    interventions.push('Implement access restriction protocols');
    interventions.push('Preserve evidence for forensic investigation');
  }

  if (riskLevel === 'high' || riskLevel === 'critical') {
    interventions.push('Enhanced monitoring of all system access');
    interventions.push('Review and potentially revoke sensitive permissions');
    interventions.push('Conduct discreet investigation');
  }

  if (phase === 'preparation') {
    interventions.push('Implement data loss prevention controls');
    interventions.push('Monitor for data staging activities');
  }

  if (motiveIndicators.some(m => m.category === 'financial')) {
    interventions.push('Consider EAP referral for financial counseling');
  }

  if (motiveIndicators.some(m => m.category === 'disgruntlement')) {
    interventions.push('Facilitate constructive dialogue with management');
    interventions.push('Review career development opportunities');
  }

  interventions.push('Continue routine behavioral monitoring');

  return interventions;
}

function projectTimeline(
  phase: InsiderThreatAnalysis['lifecyclePhase'],
  signals: PreparationSignal[],
  threatScore: number
): InsiderThreatAnalysis['timelineProjection'] {
  if (phase === 'dormant') {
    return { estimatedEscalation_days: null, confidenceLevel: 0.8 };
  }

  const baseEstimate = phase === 'active' ? 0 : phase === 'preparation' ? 14 : 45;
  const adjustment = signals.length * -3; // More signals = faster escalation

  return {
    estimatedEscalation_days: Math.max(0, baseEstimate + adjustment),
    confidenceLevel: Math.min(0.4 + (threatScore * 0.4), 0.85)
  };
}
