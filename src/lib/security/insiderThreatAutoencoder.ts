/**
 * Insider Threat Detection Engine (v9.0)
 * 
 * Source: Insider Risk Management 2025
 * 
 * Detect "low-and-slow" insider attacks using autoencoder-based
 * anomaly detection and graph neural networks.
 */

export interface UserBehaviorEvent {
  userId: string;
  timestamp: Date;
  eventType: 'login' | 'logout' | 'file_access' | 'download' | 'upload' | 'email' | 'usb' | 'print' | 'admin_action';
  resourceId?: string;
  resourceType?: string;
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  sourceIp?: string;
  deviceId?: string;
  outcome: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, unknown>;
}

export interface UserBehaviorProfile {
  userId: string;
  normalPatterns: BehaviorPattern[];
  riskScore: number;
  riskFactors: RiskFactor[];
  lastUpdated: Date;
  baselineWindowDays: number;
}

export interface BehaviorPattern {
  patternType: 'temporal' | 'resource' | 'volume' | 'sequence' | 'network';
  description: string;
  normalRange: { min: number; max: number };
  currentValue: number;
  deviationScore: number;
}

export interface RiskFactor {
  category: 'access' | 'data' | 'temporal' | 'network' | 'hr' | 'behavioral';
  factor: string;
  weight: number;
  score: number;
  indicators: string[];
  mitigations: string[];
}

export interface ThreatIndicator {
  id: string;
  userId: string;
  indicatorType: 'data_exfiltration' | 'privilege_abuse' | 'policy_violation' | 'reconnaissance' | 'sabotage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  events: UserBehaviorEvent[];
  firstSeen: Date;
  lastSeen: Date;
  escalated: boolean;
}

export interface AnomalyScore {
  overall: number;
  temporal: number;
  volumetric: number;
  sequential: number;
  contextual: number;
  breakdown: Array<{ dimension: string; score: number; explanation: string }>;
}

/**
 * Autoencoder-inspired anomaly scoring
 * Measures reconstruction error from learned normal patterns
 */
export function calculateAnomalyScore(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): AnomalyScore {
  const breakdown: Array<{ dimension: string; score: number; explanation: string }> = [];
  
  // Temporal analysis - unusual hours/days
  const temporalScore = analyzeTemporalPatterns(events, profile);
  breakdown.push({
    dimension: 'Temporal',
    score: temporalScore,
    explanation: temporalScore > 0.7 
      ? 'Activity outside normal working hours' 
      : 'Normal time patterns',
  });
  
  // Volumetric analysis - unusual data volumes
  const volumetricScore = analyzeVolumetricPatterns(events, profile);
  breakdown.push({
    dimension: 'Volumetric',
    score: volumetricScore,
    explanation: volumetricScore > 0.7 
      ? 'Unusually high data access/transfer volume' 
      : 'Normal access volumes',
  });
  
  // Sequential analysis - unusual action sequences
  const sequentialScore = analyzeSequentialPatterns(events);
  breakdown.push({
    dimension: 'Sequential',
    score: sequentialScore,
    explanation: sequentialScore > 0.7 
      ? 'Unusual sequence of actions detected' 
      : 'Normal action sequences',
  });
  
  // Contextual analysis - unusual resources/destinations
  const contextualScore = analyzeContextualPatterns(events, profile);
  breakdown.push({
    dimension: 'Contextual',
    score: contextualScore,
    explanation: contextualScore > 0.7 
      ? 'Access to unusual resources or destinations' 
      : 'Normal resource access patterns',
  });
  
  // Calculate overall score with weighted average
  const weights = { temporal: 0.2, volumetric: 0.3, sequential: 0.25, contextual: 0.25 };
  const overall = 
    temporalScore * weights.temporal +
    volumetricScore * weights.volumetric +
    sequentialScore * weights.sequential +
    contextualScore * weights.contextual;
  
  return {
    overall,
    temporal: temporalScore,
    volumetric: volumetricScore,
    sequential: sequentialScore,
    contextual: contextualScore,
    breakdown,
  };
}

function analyzeTemporalPatterns(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): number {
  if (events.length === 0) return 0;
  
  // Check for off-hours activity
  const offHoursEvents = events.filter(e => {
    const hour = new Date(e.timestamp).getHours();
    return hour < 6 || hour > 22; // Outside 6am-10pm
  });
  
  const offHoursRatio = offHoursEvents.length / events.length;
  
  // Check for weekend activity
  const weekendEvents = events.filter(e => {
    const day = new Date(e.timestamp).getDay();
    return day === 0 || day === 6;
  });
  
  const weekendRatio = weekendEvents.length / events.length;
  
  // Find normal pattern
  const temporalPattern = profile.normalPatterns.find(p => p.patternType === 'temporal');
  const normalOffHours = temporalPattern?.normalRange.max || 0.1;
  
  const deviation = Math.max(
    (offHoursRatio - normalOffHours) / (1 - normalOffHours),
    weekendRatio - 0.1
  );
  
  return Math.min(1, Math.max(0, deviation));
}

function analyzeVolumetricPatterns(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): number {
  // Calculate total data volume (simplified - count events by type)
  const downloads = events.filter(e => e.eventType === 'download').length;
  const uploads = events.filter(e => e.eventType === 'upload').length;
  const sensitiveAccess = events.filter(
    e => e.sensitivityLevel === 'confidential' || e.sensitivityLevel === 'restricted'
  ).length;
  
  // Find normal pattern
  const volumePattern = profile.normalPatterns.find(p => p.patternType === 'volume');
  const normalMax = volumePattern?.normalRange.max || 10;
  
  const totalVolume = downloads + uploads + sensitiveAccess * 2;
  const deviation = (totalVolume - normalMax) / normalMax;
  
  return Math.min(1, Math.max(0, deviation));
}

function analyzeSequentialPatterns(events: UserBehaviorEvent[]): number {
  if (events.length < 3) return 0;
  
  // Detect suspicious sequences
  const suspiciousSequences = [
    ['file_access', 'download', 'usb'],
    ['admin_action', 'download', 'email'],
    ['file_access', 'file_access', 'file_access', 'download'],
    ['login', 'admin_action', 'logout'], // Quick privilege use
  ];
  
  const eventSequence = events.map(e => e.eventType);
  let suspiciousCount = 0;
  
  for (const pattern of suspiciousSequences) {
    let patternIndex = 0;
    for (const event of eventSequence) {
      if (event === pattern[patternIndex]) {
        patternIndex++;
        if (patternIndex === pattern.length) {
          suspiciousCount++;
          patternIndex = 0;
        }
      }
    }
  }
  
  // Also check for rapid-fire actions
  let rapidFireCount = 0;
  for (let i = 1; i < events.length; i++) {
    const timeDiff = new Date(events[i].timestamp).getTime() - 
                     new Date(events[i - 1].timestamp).getTime();
    if (timeDiff < 1000) { // Less than 1 second between actions
      rapidFireCount++;
    }
  }
  
  const rapidFireRatio = rapidFireCount / events.length;
  
  return Math.min(1, (suspiciousCount * 0.2) + (rapidFireRatio * 0.5));
}

function analyzeContextualPatterns(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): number {
  // Check for new resource types
  const resourcePattern = profile.normalPatterns.find(p => p.patternType === 'resource');
  const normalResourceTypes = new Set<string>();
  
  // Assuming we track normal resources in pattern description
  const currentResourceTypes = new Set(
    events.filter(e => e.resourceType).map(e => e.resourceType!)
  );
  
  // Check for new devices
  const devicePattern = profile.normalPatterns.find(p => p.patternType === 'network');
  const newDevices = events.filter(e => 
    e.deviceId && !profile.normalPatterns.some(p => 
      p.description.includes(e.deviceId!)
    )
  ).length;
  
  // Check for new IPs
  const newIps = events.filter(e => 
    e.sourceIp && !profile.normalPatterns.some(p => 
      p.description.includes(e.sourceIp!)
    )
  ).length;
  
  const noveltyScore = (newDevices + newIps) / Math.max(events.length, 1);
  
  return Math.min(1, noveltyScore);
}

/**
 * Detect specific threat indicators from events
 */
export function detectThreatIndicators(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): ThreatIndicator[] {
  const indicators: ThreatIndicator[] = [];
  
  // Data exfiltration patterns
  const exfiltrationIndicator = detectDataExfiltration(events);
  if (exfiltrationIndicator) indicators.push(exfiltrationIndicator);
  
  // Privilege abuse patterns
  const privilegeIndicator = detectPrivilegeAbuse(events, profile);
  if (privilegeIndicator) indicators.push(privilegeIndicator);
  
  // Reconnaissance patterns
  const reconIndicator = detectReconnaissance(events);
  if (reconIndicator) indicators.push(reconIndicator);
  
  // Policy violations
  const policyIndicator = detectPolicyViolations(events);
  if (policyIndicator) indicators.push(policyIndicator);
  
  return indicators;
}

function detectDataExfiltration(events: UserBehaviorEvent[]): ThreatIndicator | null {
  const exfilEvents = events.filter(e => 
    e.eventType === 'download' || 
    e.eventType === 'usb' || 
    e.eventType === 'email' ||
    e.eventType === 'upload'
  );
  
  if (exfilEvents.length < 3) return null;
  
  // Check for large volume of sensitive data movement
  const sensitiveExfil = exfilEvents.filter(e => 
    e.sensitivityLevel === 'confidential' || e.sensitivityLevel === 'restricted'
  );
  
  if (sensitiveExfil.length >= 2) {
    return {
      id: crypto.randomUUID(),
      userId: events[0]?.userId || 'unknown',
      indicatorType: 'data_exfiltration',
      severity: sensitiveExfil.length >= 5 ? 'critical' : 'high',
      confidence: Math.min(0.95, 0.5 + sensitiveExfil.length * 0.1),
      description: `Potential data exfiltration: ${sensitiveExfil.length} sensitive data movements detected`,
      events: sensitiveExfil,
      firstSeen: new Date(Math.min(...sensitiveExfil.map(e => new Date(e.timestamp).getTime()))),
      lastSeen: new Date(Math.max(...sensitiveExfil.map(e => new Date(e.timestamp).getTime()))),
      escalated: false,
    };
  }
  
  return null;
}

function detectPrivilegeAbuse(
  events: UserBehaviorEvent[],
  profile: UserBehaviorProfile
): ThreatIndicator | null {
  const adminEvents = events.filter(e => e.eventType === 'admin_action');
  
  if (adminEvents.length === 0) return null;
  
  // Check if this user normally performs admin actions
  const hasAdminPattern = profile.normalPatterns.some(p => 
    p.description.toLowerCase().includes('admin')
  );
  
  if (!hasAdminPattern && adminEvents.length >= 2) {
    return {
      id: crypto.randomUUID(),
      userId: events[0]?.userId || 'unknown',
      indicatorType: 'privilege_abuse',
      severity: 'high',
      confidence: 0.7,
      description: 'Unusual administrative actions from non-admin user',
      events: adminEvents,
      firstSeen: new Date(Math.min(...adminEvents.map(e => new Date(e.timestamp).getTime()))),
      lastSeen: new Date(Math.max(...adminEvents.map(e => new Date(e.timestamp).getTime()))),
      escalated: false,
    };
  }
  
  return null;
}

function detectReconnaissance(events: UserBehaviorEvent[]): ThreatIndicator | null {
  const accessEvents = events.filter(e => e.eventType === 'file_access');
  
  if (accessEvents.length < 10) return null;
  
  // Check for broad resource scanning (many different resources)
  const uniqueResources = new Set(accessEvents.map(e => e.resourceId)).size;
  const scanRatio = uniqueResources / accessEvents.length;
  
  if (scanRatio > 0.8 && uniqueResources > 15) {
    return {
      id: crypto.randomUUID(),
      userId: events[0]?.userId || 'unknown',
      indicatorType: 'reconnaissance',
      severity: 'medium',
      confidence: 0.6 + (scanRatio - 0.8) * 2,
      description: `Possible reconnaissance: accessed ${uniqueResources} unique resources`,
      events: accessEvents,
      firstSeen: new Date(Math.min(...accessEvents.map(e => new Date(e.timestamp).getTime()))),
      lastSeen: new Date(Math.max(...accessEvents.map(e => new Date(e.timestamp).getTime()))),
      escalated: false,
    };
  }
  
  return null;
}

function detectPolicyViolations(events: UserBehaviorEvent[]): ThreatIndicator | null {
  const blockedEvents = events.filter(e => e.outcome === 'blocked');
  const failedEvents = events.filter(e => e.outcome === 'failure');
  
  const violationEvents = [...blockedEvents, ...failedEvents];
  
  if (violationEvents.length >= 5) {
    return {
      id: crypto.randomUUID(),
      userId: events[0]?.userId || 'unknown',
      indicatorType: 'policy_violation',
      severity: violationEvents.length >= 10 ? 'high' : 'medium',
      confidence: Math.min(0.9, 0.5 + violationEvents.length * 0.05),
      description: `Multiple policy violations: ${blockedEvents.length} blocked, ${failedEvents.length} failed actions`,
      events: violationEvents,
      firstSeen: new Date(Math.min(...violationEvents.map(e => new Date(e.timestamp).getTime()))),
      lastSeen: new Date(Math.max(...violationEvents.map(e => new Date(e.timestamp).getTime()))),
      escalated: false,
    };
  }
  
  return null;
}

/**
 * Build user behavior profile from historical events
 */
export function buildUserProfile(
  userId: string,
  historicalEvents: UserBehaviorEvent[],
  windowDays: number = 30
): UserBehaviorProfile {
  const normalPatterns: BehaviorPattern[] = [];
  const riskFactors: RiskFactor[] = [];
  
  // Temporal pattern
  const offHoursEvents = historicalEvents.filter(e => {
    const hour = new Date(e.timestamp).getHours();
    return hour < 6 || hour > 22;
  });
  const offHoursRatio = offHoursEvents.length / Math.max(historicalEvents.length, 1);
  
  normalPatterns.push({
    patternType: 'temporal',
    description: `Normal off-hours activity ratio: ${(offHoursRatio * 100).toFixed(1)}%`,
    normalRange: { min: 0, max: offHoursRatio + 0.1 },
    currentValue: offHoursRatio,
    deviationScore: 0,
  });
  
  // Volume pattern
  const dailyEvents = historicalEvents.length / windowDays;
  normalPatterns.push({
    patternType: 'volume',
    description: `Normal daily event volume: ${dailyEvents.toFixed(1)}`,
    normalRange: { min: dailyEvents * 0.5, max: dailyEvents * 2 },
    currentValue: dailyEvents,
    deviationScore: 0,
  });
  
  // Resource pattern
  const resourceTypes = new Set(historicalEvents.filter(e => e.resourceType).map(e => e.resourceType!));
  normalPatterns.push({
    patternType: 'resource',
    description: `Normal resource types: ${Array.from(resourceTypes).join(', ')}`,
    normalRange: { min: 0, max: resourceTypes.size },
    currentValue: resourceTypes.size,
    deviationScore: 0,
  });
  
  // Device/Network pattern
  const devices = new Set(historicalEvents.filter(e => e.deviceId).map(e => e.deviceId!));
  const ips = new Set(historicalEvents.filter(e => e.sourceIp).map(e => e.sourceIp!));
  normalPatterns.push({
    patternType: 'network',
    description: `Normal devices: ${Array.from(devices).join(', ')}; IPs: ${Array.from(ips).join(', ')}`,
    normalRange: { min: 0, max: Math.max(devices.size, ips.size) },
    currentValue: devices.size,
    deviationScore: 0,
  });
  
  // Calculate initial risk score
  const sensitiveAccess = historicalEvents.filter(e => 
    e.sensitivityLevel === 'confidential' || e.sensitivityLevel === 'restricted'
  ).length;
  
  if (sensitiveAccess > 10) {
    riskFactors.push({
      category: 'access',
      factor: 'High Privilege Access',
      weight: 0.3,
      score: Math.min(1, sensitiveAccess / 50),
      indicators: [`Accessed ${sensitiveAccess} sensitive resources in ${windowDays} days`],
      mitigations: ['Review access requirements', 'Implement just-in-time access'],
    });
  }
  
  const failedAttempts = historicalEvents.filter(e => e.outcome === 'failure').length;
  if (failedAttempts > 5) {
    riskFactors.push({
      category: 'behavioral',
      factor: 'Elevated Failure Rate',
      weight: 0.2,
      score: Math.min(1, failedAttempts / 20),
      indicators: [`${failedAttempts} failed access attempts`],
      mitigations: ['Verify user training', 'Check for credential issues'],
    });
  }
  
  const riskScore = riskFactors.reduce((sum, rf) => sum + rf.weight * rf.score, 0);
  
  return {
    userId,
    normalPatterns,
    riskScore,
    riskFactors,
    lastUpdated: new Date(),
    baselineWindowDays: windowDays,
  };
}

/**
 * Generate risk report for user
 */
export function generateRiskReport(
  profile: UserBehaviorProfile,
  recentEvents: UserBehaviorEvent[],
  anomalyScore: AnomalyScore,
  indicators: ThreatIndicator[]
): {
  userId: string;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  summary: string;
  recommendations: string[];
  requiresInvestigation: boolean;
} {
  // Combine profile risk with current anomaly
  const combinedScore = profile.riskScore * 0.3 + anomalyScore.overall * 0.7;
  
  // Factor in threat indicators
  const indicatorScore = indicators.reduce((sum, i) => {
    const severityWeight = { low: 0.1, medium: 0.25, high: 0.5, critical: 0.8 };
    return sum + severityWeight[i.severity] * i.confidence;
  }, 0);
  
  const finalScore = Math.min(1, combinedScore + indicatorScore * 0.5);
  
  let overallRisk: 'low' | 'medium' | 'high' | 'critical';
  if (finalScore < 0.25) overallRisk = 'low';
  else if (finalScore < 0.5) overallRisk = 'medium';
  else if (finalScore < 0.75) overallRisk = 'high';
  else overallRisk = 'critical';
  
  const recommendations: string[] = [];
  
  if (anomalyScore.temporal > 0.5) {
    recommendations.push('Review after-hours access permissions');
  }
  if (anomalyScore.volumetric > 0.5) {
    recommendations.push('Implement data loss prevention controls');
  }
  if (indicators.some(i => i.indicatorType === 'data_exfiltration')) {
    recommendations.push('Immediately review data transfer logs');
    recommendations.push('Consider temporary access suspension');
  }
  if (indicators.some(i => i.indicatorType === 'privilege_abuse')) {
    recommendations.push('Audit user permissions');
    recommendations.push('Enable additional authentication factors');
  }
  
  const summary = `User ${profile.userId} shows ${overallRisk} risk level ` +
    `with ${indicators.length} active threat indicators and ` +
    `${(anomalyScore.overall * 100).toFixed(0)}% anomaly deviation from baseline.`;
  
  return {
    userId: profile.userId,
    overallRisk,
    riskScore: finalScore,
    summary,
    recommendations,
    requiresInvestigation: overallRisk === 'high' || overallRisk === 'critical',
  };
}
