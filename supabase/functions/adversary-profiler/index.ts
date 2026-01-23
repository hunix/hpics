import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdversaryIndicator {
  type: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

interface AdversaryRequest {
  userId: string;
  profileId: string;
  behavioralIndicators: AdversaryIndicator[];
  communicationPatterns: {
    frequency_anomaly: number;
    sentiment_shift: number;
    topic_avoidance: string[];
    information_seeking: string[];
  };
  networkActivity: {
    new_connections: string[];
    dropped_connections: string[];
    communication_clustering: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'adversary-profiler', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      userId,
      profileId,
      behavioralIndicators,
      communicationPatterns,
      networkActivity,
    }: AdversaryRequest = await req.json();

    // Classify threat type based on indicators
    const threatClassification = classifyThreat(behavioralIndicators, communicationPatterns);

    // Detect specific manipulation techniques
    const detectedTechniques = detectManipulationTechniques(behavioralIndicators, communicationPatterns);

    // Estimate adversary objectives
    const estimatedObjectives = estimateObjectives(
      behavioralIndicators,
      communicationPatterns,
      networkActivity
    );

    // Capability assessment
    const capabilityAssessment = assessCapabilities(
      behavioralIndicators,
      networkActivity
    );

    // Vulnerability exposure analysis
    const vulnerabilityExposure = analyzeVulnerabilityExposure(
      communicationPatterns,
      networkActivity
    );

    // Generate counter-measures
    const counterMeasures = generateCounterMeasures(
      threatClassification,
      detectedTechniques,
      capabilityAssessment
    );

    // Calculate overall threat score
    const threatScore = calculateThreatScore(
      threatClassification,
      capabilityAssessment,
      detectedTechniques.length
    );

    // Generate intelligence summary
    const intelligenceSummary = generateIntelligenceSummary(
      threatClassification,
      detectedTechniques,
      estimatedObjectives
    );

    return new Response(
      JSON.stringify({
        profile_id: profileId,
        threat_classification: threatClassification,
        threat_score: threatScore,
        detected_techniques: detectedTechniques,
        estimated_objectives: estimatedObjectives,
        capability_assessment: capabilityAssessment,
        vulnerability_exposure: vulnerabilityExposure,
        counter_measures: counterMeasures,
        intelligence_summary: intelligenceSummary,
        indicators_analyzed: behavioralIndicators.length,
        confidence_level: calculateConfidence(behavioralIndicators.length),
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Adversary Profiler error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function classifyThreat(
  indicators: AdversaryIndicator[],
  patterns: AdversaryRequest['communicationPatterns']
): {
  primary_type: 'competitor' | 'hostile_actor' | 'manipulator' | 'intelligence_gatherer' | 'unknown';
  secondary_types: string[];
  confidence: number;
} {
  const typeCounts: Record<string, number> = {
    competitor: 0,
    hostile_actor: 0,
    manipulator: 0,
    intelligence_gatherer: 0,
  };

  // Analyze indicators for threat type signals
  for (const indicator of indicators) {
    if (indicator.type.includes('competitive') || indicator.type.includes('market')) {
      typeCounts.competitor += indicator.severity === 'high' ? 2 : 1;
    }
    if (indicator.type.includes('hostile') || indicator.type.includes('attack')) {
      typeCounts.hostile_actor += indicator.severity === 'critical' ? 3 : 2;
    }
    if (indicator.type.includes('manipulation') || indicator.type.includes('deception')) {
      typeCounts.manipulator += indicator.severity === 'high' ? 2 : 1;
    }
    if (indicator.type.includes('probing') || indicator.type.includes('reconnaissance')) {
      typeCounts.intelligence_gatherer += 1;
    }
  }

  // Information seeking behavior indicates intelligence gathering
  if (patterns.information_seeking.length > 3) {
    typeCounts.intelligence_gatherer += patterns.information_seeking.length;
  }

  // Topic avoidance suggests manipulation
  if (patterns.topic_avoidance.length > 2) {
    typeCounts.manipulator += patterns.topic_avoidance.length;
  }

  const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, [_, count]) => sum + count, 0);

  return {
    primary_type: (sorted[0]?.[1] || 0) > 0 ? sorted[0][0] as any : 'unknown',
    secondary_types: sorted.slice(1).filter(([_, count]) => count > 0).map(([type, _]) => type),
    confidence: total > 0 ? Math.min(0.95, sorted[0][1] / total + 0.3) : 0.1,
  };
}

function detectManipulationTechniques(
  indicators: AdversaryIndicator[],
  patterns: AdversaryRequest['communicationPatterns']
): {
  technique: string;
  description: string;
  evidence: string[];
  danger_level: number;
}[] {
  const techniques: {
    technique: string;
    description: string;
    evidence: string[];
    danger_level: number;
  }[] = [];

  // Love bombing detection
  if (patterns.sentiment_shift > 0.5 && patterns.frequency_anomaly > 2) {
    techniques.push({
      technique: 'Love Bombing',
      description: 'Excessive positive attention to lower defenses',
      evidence: ['Sudden increase in positive communication', 'Abnormal frequency'],
      danger_level: 0.7,
    });
  }

  // Gaslighting indicators
  const gaslightingIndicators = indicators.filter(i => 
    i.type.includes('contradiction') || i.type.includes('denial')
  );
  if (gaslightingIndicators.length >= 2) {
    techniques.push({
      technique: 'Gaslighting',
      description: 'Attempting to make target question reality',
      evidence: gaslightingIndicators.map(i => i.description),
      danger_level: 0.9,
    });
  }

  // Information elicitation
  if (patterns.information_seeking.length > 3) {
    techniques.push({
      technique: 'Elicitation',
      description: 'Subtle extraction of sensitive information',
      evidence: patterns.information_seeking,
      danger_level: 0.6,
    });
  }

  // Isolation attempts
  const isolationIndicators = indicators.filter(i => 
    i.type.includes('isolation') || i.type.includes('wedge')
  );
  if (isolationIndicators.length >= 1) {
    techniques.push({
      technique: 'Isolation Tactics',
      description: 'Attempting to separate target from support network',
      evidence: isolationIndicators.map(i => i.description),
      danger_level: 0.8,
    });
  }

  // Reciprocity manipulation
  const reciprocityIndicators = indicators.filter(i => 
    i.type.includes('favor') || i.type.includes('gift')
  );
  if (reciprocityIndicators.length >= 2) {
    techniques.push({
      technique: 'Reciprocity Exploitation',
      description: 'Creating obligation through unsolicited favors',
      evidence: reciprocityIndicators.map(i => i.description),
      danger_level: 0.5,
    });
  }

  // Urgency/Scarcity tactics
  const urgencyIndicators = indicators.filter(i => 
    i.type.includes('urgent') || i.type.includes('limited')
  );
  if (urgencyIndicators.length >= 2) {
    techniques.push({
      technique: 'Urgency/Scarcity Pressure',
      description: 'Creating artificial time pressure for decisions',
      evidence: urgencyIndicators.map(i => i.description),
      danger_level: 0.6,
    });
  }

  return techniques.sort((a, b) => b.danger_level - a.danger_level);
}

function estimateObjectives(
  indicators: AdversaryIndicator[],
  patterns: AdversaryRequest['communicationPatterns'],
  networkActivity: AdversaryRequest['networkActivity']
): string[] {
  const objectives: string[] = [];

  // Information theft
  if (patterns.information_seeking.length > 2) {
    const topics = patterns.information_seeking.join(', ');
    objectives.push(`Intelligence gathering on: ${topics}`);
  }

  // Network infiltration
  if (networkActivity.new_connections.length > 3) {
    objectives.push('Expanding access to social/professional network');
  }

  // Relationship disruption
  if (networkActivity.dropped_connections.length > 0 || 
      indicators.some(i => i.type.includes('wedge'))) {
    objectives.push('Disrupting existing relationships');
  }

  // Control/influence
  if (indicators.filter(i => i.type.includes('manipulation')).length > 2) {
    objectives.push('Establishing control or undue influence');
  }

  // Reputation damage
  if (indicators.some(i => i.type.includes('reputation') || i.type.includes('smear'))) {
    objectives.push('Reputational damage or discrediting');
  }

  // Financial exploitation
  if (indicators.some(i => i.type.includes('financial') || i.type.includes('money'))) {
    objectives.push('Financial exploitation or fraud');
  }

  return objectives.length > 0 ? objectives : ['Objectives unclear - continued monitoring advised'];
}

function assessCapabilities(
  indicators: AdversaryIndicator[],
  networkActivity: AdversaryRequest['networkActivity']
): {
  technical: number;
  psychological: number;
  network_reach: number;
  resources: number;
  overall: number;
} {
  let technical = 0.3;
  let psychological = 0.3;
  let network_reach = 0.3;
  let resources = 0.3;

  // Technical capability indicators
  if (indicators.some(i => i.type.includes('digital') || i.type.includes('cyber'))) {
    technical += 0.3;
  }
  if (indicators.some(i => i.severity === 'critical')) {
    technical += 0.2;
  }

  // Psychological sophistication
  const psychIndicators = indicators.filter(i => 
    i.type.includes('manipulation') || i.type.includes('influence')
  );
  psychological += Math.min(0.5, psychIndicators.length * 0.1);

  // Network reach
  network_reach += Math.min(0.5, networkActivity.new_connections.length * 0.1);
  if (networkActivity.communication_clustering) {
    network_reach += 0.2;
  }

  // Resource indicators (persistence, multiple channels)
  resources += Math.min(0.4, indicators.length * 0.05);
  if (indicators.some(i => i.severity === 'high' || i.severity === 'critical')) {
    resources += 0.2;
  }

  const overall = (technical + psychological + network_reach + resources) / 4;

  return {
    technical: Math.min(1, technical),
    psychological: Math.min(1, psychological),
    network_reach: Math.min(1, network_reach),
    resources: Math.min(1, resources),
    overall: Math.min(1, overall),
  };
}

function analyzeVulnerabilityExposure(
  patterns: AdversaryRequest['communicationPatterns'],
  networkActivity: AdversaryRequest['networkActivity']
): string[] {
  const vulnerabilities: string[] = [];

  if (patterns.information_seeking.length > 0) {
    vulnerabilities.push(`Information leakage risk: ${patterns.information_seeking.join(', ')}`);
  }

  if (patterns.topic_avoidance.length > 0) {
    vulnerabilities.push(`Sensitive topics being probed: ${patterns.topic_avoidance.join(', ')}`);
  }

  if (networkActivity.dropped_connections.length > 0) {
    vulnerabilities.push('Social isolation risk detected');
  }

  if (patterns.sentiment_shift > 0.3) {
    vulnerabilities.push('Emotional manipulation vulnerability');
  }

  return vulnerabilities;
}

function generateCounterMeasures(
  threatClass: ReturnType<typeof classifyThreat>,
  techniques: ReturnType<typeof detectManipulationTechniques>,
  capabilities: ReturnType<typeof assessCapabilities>
): {
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  description: string;
}[] {
  const measures: {
    action: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
    description: string;
  }[] = [];

  // Generic measures based on threat type
  if (threatClass.primary_type === 'intelligence_gatherer') {
    measures.push({
      action: 'Information Compartmentalization',
      priority: 'high',
      description: 'Limit information sharing; implement need-to-know protocols',
    });
  }

  if (threatClass.primary_type === 'manipulator') {
    measures.push({
      action: 'Third-Party Verification',
      priority: 'immediate',
      description: 'Verify all claims and requests through independent sources',
    });
  }

  // Technique-specific counters
  for (const technique of techniques) {
    if (technique.technique === 'Gaslighting') {
      measures.push({
        action: 'Documentation Protocol',
        priority: 'immediate',
        description: 'Document all interactions; maintain written records of agreements',
      });
    }
    if (technique.technique === 'Isolation Tactics') {
      measures.push({
        action: 'Network Reinforcement',
        priority: 'high',
        description: 'Strengthen connections with trusted allies; maintain open communication',
      });
    }
    if (technique.technique === 'Elicitation') {
      measures.push({
        action: 'Information Hygiene',
        priority: 'high',
        description: 'Prepare cover stories for sensitive topics; redirect probing questions',
      });
    }
  }

  // Capability-based measures
  if (capabilities.technical > 0.6) {
    measures.push({
      action: 'Digital Security Audit',
      priority: 'high',
      description: 'Review digital security; update passwords; check for surveillance',
    });
  }

  if (capabilities.network_reach > 0.6) {
    measures.push({
      action: 'Network Mapping',
      priority: 'medium',
      description: 'Identify mutual connections; assess information flow paths',
    });
  }

  return measures.sort((a, b) => {
    const priority = { immediate: 0, high: 1, medium: 2, low: 3 };
    return priority[a.priority] - priority[b.priority];
  });
}

function calculateThreatScore(
  threatClass: ReturnType<typeof classifyThreat>,
  capabilities: ReturnType<typeof assessCapabilities>,
  techniqueCount: number
): number {
  const typeWeight: Record<string, number> = {
    hostile_actor: 1.0,
    manipulator: 0.8,
    intelligence_gatherer: 0.6,
    competitor: 0.5,
    unknown: 0.3,
  };

  const baseScore = typeWeight[threatClass.primary_type] || 0.3;
  const capabilityBonus = capabilities.overall * 0.3;
  const techniqueBonus = Math.min(0.3, techniqueCount * 0.05);
  const confidenceWeight = threatClass.confidence;

  return Math.min(1, (baseScore + capabilityBonus + techniqueBonus) * confidenceWeight);
}

function calculateConfidence(indicatorCount: number): 'low' | 'medium' | 'high' {
  if (indicatorCount >= 10) return 'high';
  if (indicatorCount >= 5) return 'medium';
  return 'low';
}

function generateIntelligenceSummary(
  threatClass: ReturnType<typeof classifyThreat>,
  techniques: ReturnType<typeof detectManipulationTechniques>,
  objectives: string[]
): string {
  const typeDescriptions: Record<string, string> = {
    competitor: 'competitive intelligence operation',
    hostile_actor: 'hostile adversarial activity',
    manipulator: 'psychological manipulation campaign',
    intelligence_gatherer: 'reconnaissance and information collection',
    unknown: 'unclassified activity pattern',
  };

  const summary = [
    `ASSESSMENT: Subject appears to be conducting ${typeDescriptions[threatClass.primary_type]}.`,
  ];

  if (techniques.length > 0) {
    summary.push(`TECHNIQUES: ${techniques.map(t => t.technique).join(', ')}.`);
  }

  if (objectives.length > 0) {
    summary.push(`OBJECTIVES: ${objectives[0]}.`);
  }

  summary.push(`CONFIDENCE: ${(threatClass.confidence * 100).toFixed(0)}%.`);

  return summary.join(' ');
}
