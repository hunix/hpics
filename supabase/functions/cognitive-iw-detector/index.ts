import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Cognitive Indicators & Warnings (CI&W) Detector v8.0
 * NATO IIO Attribution Framework Implementation
 * Source: NATO IIO Attribution Framework 2025
 * 
 * Capabilities:
 * - Detect Information Influence Operations through narrative synchronization
 * - Map cognitive attack vectors across biological, psychological, social levels
 * - Early warning system for coordinated influence campaigns
 */

interface CognitiveIndicator {
  level: 'biological' | 'psychological' | 'social';
  type: string;
  indicator: string;
  confidence: number;
  evidence: string[];
  timestamp?: string;
}

interface InfluenceCampaign {
  id: string;
  name: string;
  type: 'coordinated' | 'organic' | 'hybrid';
  narratives: string[];
  actors: string[];
  startDate?: string;
  intensity: number;
  attribution?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'cognitive-iw-detector', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const body = await req.json();
    const profileId = body.profileId || body.profile_id;

    console.log(`[CI&W Detector] Profile: ${profileId}`);

    // Fetch communications for narrative analysis
    const { data: communications } = await supabaseClient
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(300);

    // Fetch media for propaganda analysis
    const { data: mediaData } = await supabaseClient
      .from('contact_media')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch social network data
    const { data: networkData } = await supabaseClient
      .from('profile_connections')
      .select('*')
      .or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`)
      .limit(100);

    // Fetch existing IIO attributions
    const { data: existingIio } = await supabaseClient
      .from('iio_attributions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Detect cognitive indicators at all three NATO House Model levels
    const biologicalIndicators = detectBiologicalLevelIndicators(communications, mediaData);
    const psychologicalIndicators = detectPsychologicalLevelIndicators(communications);
    const socialIndicators = detectSocialLevelIndicators(communications, networkData);

    // Analyze narrative synchronization
    const narrativeSynchronization = analyzeNarrativeSynchronization(communications);

    // Detect coordinated influence campaigns
    const campaigns = detectInfluenceCampaigns(
      communications,
      narrativeSynchronization,
      existingIio
    );

    // Map cognitive attack vectors
    const attackVectors = mapCognitiveAttackVectors(
      biologicalIndicators,
      psychologicalIndicators,
      socialIndicators
    );

    // Generate early warning alerts
    const earlyWarnings = generateEarlyWarnings(
      campaigns,
      attackVectors,
      narrativeSynchronization
    );

    // Calculate threat assessment
    const threatAssessment = calculateThreatAssessment(
      campaigns,
      attackVectors,
      earlyWarnings
    );

    // Generate counter-measures
    const counterMeasures = generateCounterMeasures(
      threatAssessment,
      attackVectors,
      campaigns
    );

    const allIndicators = [
      ...biologicalIndicators,
      ...psychologicalIndicators,
      ...socialIndicators,
    ];

    const analysisResult = {
      profileId,
      analysisType: 'cognitive_iw_detection',
      timestamp: new Date().toISOString(),
      
      summary: {
        totalIndicators: allIndicators.length,
        campaignsDetected: campaigns.length,
        threatLevel: threatAssessment.level,
        urgentWarnings: earlyWarnings.filter(w => w.urgency === 'critical').length,
      },
      
      houseModelAnalysis: {
        biological: {
          indicatorCount: biologicalIndicators.length,
          topIndicators: biologicalIndicators.slice(0, 5),
          threatScore: calculateLevelThreat(biologicalIndicators),
        },
        psychological: {
          indicatorCount: psychologicalIndicators.length,
          topIndicators: psychologicalIndicators.slice(0, 5),
          threatScore: calculateLevelThreat(psychologicalIndicators),
        },
        social: {
          indicatorCount: socialIndicators.length,
          topIndicators: socialIndicators.slice(0, 5),
          threatScore: calculateLevelThreat(socialIndicators),
        },
      },
      
      narrativeSynchronization: {
        detected: narrativeSynchronization.isCoordinated,
        synchronizationScore: narrativeSynchronization.score,
        keyNarratives: narrativeSynchronization.narratives.slice(0, 10),
        temporalPatterns: narrativeSynchronization.temporalPatterns,
      },
      
      influenceCampaigns: campaigns.slice(0, 5).map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        intensity: c.intensity,
        attribution: c.attribution,
        narrativeCount: c.narratives.length,
      })),
      
      cognitiveAttackVectors: attackVectors.slice(0, 10),
      
      earlyWarnings: earlyWarnings.slice(0, 10),
      
      threatAssessment: {
        level: threatAssessment.level,
        score: threatAssessment.score,
        primaryThreat: threatAssessment.primaryThreat,
        attackPhase: threatAssessment.phase,
        projectedEscalation: threatAssessment.escalationTrajectory,
      },
      
      counterMeasures: counterMeasures.slice(0, 8),
      
      attributionMatrix: generateAttributionMatrix(campaigns),
      
      monitoringRecommendations: generateMonitoringRecommendations(
        threatAssessment,
        earlyWarnings
      ),
      
      metadata: {
        communicationsAnalyzed: communications?.length || 0,
        mediaAnalyzed: mediaData?.length || 0,
        networkConnectionsAnalyzed: networkData?.length || 0,
        processingTimeMs: Date.now(),
      },
    };

    // Persist to ai_analyses
    await supabaseClient
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: user.id,
        analysis_type: 'cognitive_iw_detection',
        results: analysisResult as unknown as Record<string, unknown>,
        confidence_score: 1 - threatAssessment.score,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[CI&W Detector] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function detectBiologicalLevelIndicators(
  communications: any[] | null,
  mediaData: any[] | null
): CognitiveIndicator[] {
  const indicators: CognitiveIndicator[] = [];
  
  if (!communications) return indicators;
  
  // Detect stress/anxiety language patterns (biological stress response)
  const stressPatterns = ['can\'t sleep', 'anxious', 'stressed', 'overwhelmed', 'exhausted'];
  let stressCount = 0;
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    if (stressPatterns.some(p => text.includes(p))) {
      stressCount++;
    }
  }
  
  if (stressCount > 5) {
    indicators.push({
      level: 'biological',
      type: 'stress_response',
      indicator: 'Elevated stress language indicating biological impact',
      confidence: Math.min(0.9, stressCount / 10),
      evidence: ['Stress language frequency elevated', 'Anxiety markers detected'],
    });
  }
  
  // Detect fear-based language (amygdala activation)
  const fearPatterns = ['afraid', 'scared', 'terrified', 'danger', 'threat'];
  let fearCount = 0;
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    if (fearPatterns.some(p => text.includes(p))) {
      fearCount++;
    }
  }
  
  if (fearCount > 3) {
    indicators.push({
      level: 'biological',
      type: 'fear_activation',
      indicator: 'Fear-based messaging targeting amygdala response',
      confidence: Math.min(0.85, fearCount / 6),
      evidence: ['Fear language patterns', 'Threat-focused content'],
    });
  }
  
  return indicators;
}

function detectPsychologicalLevelIndicators(communications: any[] | null): CognitiveIndicator[] {
  const indicators: CognitiveIndicator[] = [];
  
  if (!communications) return indicators;
  
  // Detect cognitive distortion patterns
  const distortionPatterns = {
    blackWhite: ['always', 'never', 'everyone', 'no one'],
    catastrophizing: ['disaster', 'terrible', 'worst', 'end of'],
    mindReading: ['they think', 'they want', 'they\'re planning'],
  };
  
  let distortionCounts: Record<string, number> = {};
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    
    for (const [type, patterns] of Object.entries(distortionPatterns)) {
      if (patterns.some(p => text.includes(p))) {
        distortionCounts[type] = (distortionCounts[type] || 0) + 1;
      }
    }
  }
  
  for (const [type, count] of Object.entries(distortionCounts)) {
    if (count > 5) {
      indicators.push({
        level: 'psychological',
        type: `cognitive_distortion_${type}`,
        indicator: `${type} cognitive distortion pattern detected`,
        confidence: Math.min(0.8, count / 10),
        evidence: [`${count} instances of ${type} thinking patterns`],
      });
    }
  }
  
  // Detect identity manipulation attempts
  const identityPatterns = ['who you really are', 'true self', 'you\'re not like them'];
  let identityCount = 0;
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    if (identityPatterns.some(p => text.includes(p))) {
      identityCount++;
    }
  }
  
  if (identityCount > 2) {
    indicators.push({
      level: 'psychological',
      type: 'identity_targeting',
      indicator: 'Identity manipulation language detected',
      confidence: 0.7,
      evidence: ['Identity-focused messaging', 'Self-concept targeting'],
    });
  }
  
  return indicators;
}

function detectSocialLevelIndicators(
  communications: any[] | null,
  networkData: any[] | null
): CognitiveIndicator[] {
  const indicators: CognitiveIndicator[] = [];
  
  if (!communications) return indicators;
  
  // Detect social isolation tactics
  const isolationPatterns = ['don\'t trust', 'only we', 'they\'ll never understand', 'us vs them'];
  let isolationCount = 0;
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    if (isolationPatterns.some(p => text.includes(p))) {
      isolationCount++;
    }
  }
  
  if (isolationCount > 3) {
    indicators.push({
      level: 'social',
      type: 'social_isolation',
      indicator: 'Social isolation tactics detected',
      confidence: Math.min(0.85, isolationCount / 6),
      evidence: ['Isolation language', 'In-group/out-group framing'],
    });
  }
  
  // Detect authority manipulation
  const authorityPatterns = ['experts say', 'leaders agree', 'everyone knows', 'studies show'];
  let authorityCount = 0;
  
  for (const comm of communications) {
    const text = (comm.content || comm.body || '').toLowerCase();
    if (authorityPatterns.some(p => text.includes(p))) {
      authorityCount++;
    }
  }
  
  if (authorityCount > 5) {
    indicators.push({
      level: 'social',
      type: 'authority_appeal',
      indicator: 'Authority-based influence attempts detected',
      confidence: Math.min(0.75, authorityCount / 10),
      evidence: ['Authority appeals', 'Credential exploitation'],
    });
  }
  
  // Network-based indicators
  if (networkData && networkData.length > 0) {
    const connectionTypes = networkData.map(n => n.connection_type || 'unknown');
    const newConnections = networkData.filter(n => {
      const created = new Date(n.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return created > dayAgo;
    });
    
    if (newConnections.length > 5) {
      indicators.push({
        level: 'social',
        type: 'rapid_network_expansion',
        indicator: 'Unusual network expansion pattern',
        confidence: 0.6,
        evidence: [`${newConnections.length} new connections in 24 hours`],
      });
    }
  }
  
  return indicators;
}

function analyzeNarrativeSynchronization(communications: any[] | null): any {
  if (!communications || communications.length === 0) {
    return {
      isCoordinated: false,
      score: 0,
      narratives: [],
      temporalPatterns: [],
    };
  }
  
  // Extract narratives (simplified - would use NLP in production)
  const narratives: Map<string, { count: number; timestamps: string[] }> = new Map();
  
  // Look for repeated phrases/themes
  const phrasePattern = /([A-Za-z\s]{10,30})/g;
  
  for (const comm of communications) {
    const text = comm.content || comm.body || '';
    const matches = text.match(phrasePattern) || [];
    
    for (const match of matches) {
      const normalized = match.toLowerCase().trim();
      if (!narratives.has(normalized)) {
        narratives.set(normalized, { count: 0, timestamps: [] });
      }
      const entry = narratives.get(normalized)!;
      entry.count++;
      entry.timestamps.push(comm.created_at);
    }
  }
  
  // Find synchronized narratives (same narrative appearing multiple times)
  const synchronizedNarratives = Array.from(narratives.entries())
    .filter(([_, data]) => data.count > 3)
    .map(([narrative, data]) => ({
      narrative,
      occurrences: data.count,
      firstSeen: data.timestamps[0],
      lastSeen: data.timestamps[data.timestamps.length - 1],
    }));
  
  // Calculate synchronization score
  const syncScore = Math.min(1, synchronizedNarratives.length / 10);
  
  // Detect temporal patterns
  const temporalPatterns: string[] = [];
  if (synchronizedNarratives.length > 5) {
    temporalPatterns.push('Coordinated narrative deployment detected');
  }
  
  return {
    isCoordinated: syncScore > 0.3,
    score: syncScore,
    narratives: synchronizedNarratives.slice(0, 15),
    temporalPatterns,
  };
}

function detectInfluenceCampaigns(
  communications: any[] | null,
  narrativeSynchronization: any,
  existingIio: any[] | null
): InfluenceCampaign[] {
  const campaigns: InfluenceCampaign[] = [];
  
  if (narrativeSynchronization.isCoordinated) {
    campaigns.push({
      id: `campaign_${Date.now()}`,
      name: 'Detected Coordinated Narrative Operation',
      type: 'coordinated',
      narratives: narrativeSynchronization.narratives.map((n: any) => n.narrative),
      actors: ['Unknown'],
      intensity: narrativeSynchronization.score,
      attribution: 'Unknown - requires further investigation',
    });
  }
  
  // Check for known campaign patterns from existing IIO data
  if (existingIio && existingIio.length > 0) {
    for (const iio of existingIio) {
      if (iio.confidence_score > 0.7) {
        campaigns.push({
          id: iio.id,
          name: iio.operation_name || 'Unnamed Operation',
          type: 'hybrid',
          narratives: iio.narratives || [],
          actors: iio.attributed_actors || [],
          intensity: iio.confidence_score,
          attribution: iio.attribution_assessment,
        });
      }
    }
  }
  
  return campaigns;
}

function mapCognitiveAttackVectors(
  biological: CognitiveIndicator[],
  psychological: CognitiveIndicator[],
  social: CognitiveIndicator[]
): any[] {
  const vectors: any[] = [];
  
  // Map biological attack vectors
  for (const indicator of biological) {
    vectors.push({
      level: 'biological',
      vector: indicator.type,
      mechanism: indicator.indicator,
      exploitability: indicator.confidence,
      defenses: getBiologicalDefenses(indicator.type),
    });
  }
  
  // Map psychological attack vectors
  for (const indicator of psychological) {
    vectors.push({
      level: 'psychological',
      vector: indicator.type,
      mechanism: indicator.indicator,
      exploitability: indicator.confidence,
      defenses: getPsychologicalDefenses(indicator.type),
    });
  }
  
  // Map social attack vectors
  for (const indicator of social) {
    vectors.push({
      level: 'social',
      vector: indicator.type,
      mechanism: indicator.indicator,
      exploitability: indicator.confidence,
      defenses: getSocialDefenses(indicator.type),
    });
  }
  
  return vectors.sort((a, b) => b.exploitability - a.exploitability);
}

function getBiologicalDefenses(type: string): string[] {
  const defenses: Record<string, string[]> = {
    stress_response: ['Stress management techniques', 'Information breaks', 'Physical exercise'],
    fear_activation: ['Emotional regulation', 'Fact-checking routines', 'Trusted support network'],
  };
  return defenses[type] || ['General resilience building'];
}

function getPsychologicalDefenses(type: string): string[] {
  const defenses: Record<string, string[]> = {
    cognitive_distortion_blackWhite: ['Nuance training', 'Gray area exercises', 'Perspective taking'],
    identity_targeting: ['Identity anchoring', 'Values clarification', 'Social support'],
  };
  return defenses[type] || ['Critical thinking enhancement'];
}

function getSocialDefenses(type: string): string[] {
  const defenses: Record<string, string[]> = {
    social_isolation: ['Diverse relationship maintenance', 'Cross-group connections', 'Regular check-ins'],
    authority_appeal: ['Source verification training', 'Independent thinking exercises'],
  };
  return defenses[type] || ['Network diversification'];
}

function generateEarlyWarnings(
  campaigns: InfluenceCampaign[],
  attackVectors: any[],
  narrativeSynchronization: any
): any[] {
  const warnings: any[] = [];
  
  if (campaigns.length > 0) {
    warnings.push({
      type: 'campaign_detection',
      urgency: campaigns[0].intensity > 0.7 ? 'critical' : 'high',
      message: `${campaigns.length} influence campaign(s) detected targeting this profile`,
      recommendations: ['Initiate counter-intelligence protocols', 'Monitor narrative adoption'],
    });
  }
  
  if (narrativeSynchronization.isCoordinated) {
    warnings.push({
      type: 'narrative_synchronization',
      urgency: 'high',
      message: 'Coordinated narrative deployment detected',
      recommendations: ['Analyze narrative sources', 'Identify amplification networks'],
    });
  }
  
  const highExploitability = attackVectors.filter(v => v.exploitability > 0.7);
  if (highExploitability.length > 2) {
    warnings.push({
      type: 'vulnerability_concentration',
      urgency: 'critical',
      message: `${highExploitability.length} high-exploitability attack vectors identified`,
      recommendations: ['Prioritize defense deployment', 'Reduce exposure'],
    });
  }
  
  return warnings;
}

function calculateThreatAssessment(
  campaigns: InfluenceCampaign[],
  attackVectors: any[],
  earlyWarnings: any[]
): any {
  let score = 0;
  
  // Campaign contribution
  if (campaigns.length > 0) {
    score += Math.min(0.4, campaigns.length * 0.15);
    score += campaigns.reduce((sum, c) => sum + c.intensity, 0) / campaigns.length * 0.2;
  }
  
  // Attack vector contribution
  const avgExploitability = attackVectors.length > 0
    ? attackVectors.reduce((sum, v) => sum + v.exploitability, 0) / attackVectors.length
    : 0;
  score += avgExploitability * 0.3;
  
  // Warning contribution
  const criticalWarnings = earlyWarnings.filter(w => w.urgency === 'critical').length;
  score += Math.min(0.2, criticalWarnings * 0.1);
  
  let level: string;
  if (score > 0.8) level = 'critical';
  else if (score > 0.6) level = 'high';
  else if (score > 0.4) level = 'moderate';
  else if (score > 0.2) level = 'low';
  else level = 'minimal';
  
  // Determine attack phase
  let phase: string;
  if (campaigns.length > 0 && attackVectors.filter(v => v.exploitability > 0.6).length > 3) {
    phase = 'Active Exploitation';
  } else if (campaigns.length > 0) {
    phase = 'Preparation';
  } else if (attackVectors.length > 5) {
    phase = 'Reconnaissance';
  } else {
    phase = 'No Active Attack Detected';
  }
  
  return {
    level,
    score: Math.round(score * 100) / 100,
    primaryThreat: campaigns.length > 0 ? campaigns[0].name : 'No primary threat identified',
    phase,
    escalationTrajectory: score > 0.5 ? 'Increasing' : 'Stable',
  };
}

function generateCounterMeasures(
  threatAssessment: any,
  attackVectors: any[],
  campaigns: InfluenceCampaign[]
): any[] {
  const measures: any[] = [];
  
  if (threatAssessment.level === 'critical' || threatAssessment.level === 'high') {
    measures.push({
      priority: 'immediate',
      measure: 'Activate defensive information operations',
      rationale: `Threat level ${threatAssessment.level} requires immediate response`,
    });
    
    measures.push({
      priority: 'immediate',
      measure: 'Deploy counter-narratives',
      rationale: 'Combat detected influence campaigns',
    });
  }
  
  // Address top attack vectors
  for (const vector of attackVectors.slice(0, 3)) {
    measures.push({
      priority: 'short_term',
      measure: vector.defenses[0],
      rationale: `Address ${vector.level}-level vulnerability: ${vector.vector}`,
    });
  }
  
  // General resilience measures
  measures.push({
    priority: 'long_term',
    measure: 'Cognitive resilience training program',
    rationale: 'Build long-term resistance to cognitive attacks',
  });
  
  return measures;
}

function calculateLevelThreat(indicators: CognitiveIndicator[]): number {
  if (indicators.length === 0) return 0;
  return indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length;
}

function generateAttributionMatrix(campaigns: InfluenceCampaign[]): any {
  return {
    campaigns: campaigns.length,
    attributionConfidence: campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.intensity, 0) / campaigns.length 
      : 0,
    likelyActors: campaigns.flatMap(c => c.actors).filter((v, i, a) => a.indexOf(v) === i),
    methodology: 'NATO IIO Attribution Framework',
  };
}

function generateMonitoringRecommendations(
  threatAssessment: any,
  earlyWarnings: any[]
): string[] {
  const recommendations: string[] = [];
  
  recommendations.push('Establish baseline cognitive indicators');
  recommendations.push('Monitor narrative adoption patterns');
  recommendations.push('Track social network changes');
  
  if (threatAssessment.level === 'critical' || threatAssessment.level === 'high') {
    recommendations.push('Increase monitoring frequency to daily');
    recommendations.push('Activate real-time alert system');
  }
  
  if (earlyWarnings.length > 0) {
    recommendations.push('Document all influence attempts for attribution');
  }
  
  return recommendations;
}
