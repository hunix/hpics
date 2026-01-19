/**
 * Threat Entity
 * Represents identified threats and adversarial actors
 */

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'minimal';
export type ThreatType = 'competitive' | 'reputational' | 'operational' | 'informational' | 'personal';
export type ThreatStatus = 'active' | 'monitoring' | 'mitigated' | 'resolved' | 'dormant';

export interface ThreatIndicator {
  id: string;
  type: string;
  value: string;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  source: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  type: 'individual' | 'organization' | 'group' | 'unknown';
  capability: number;
  intent: number;
  resources: string[];
  knownTactics: string[];
}

export interface CounterMeasure {
  id: string;
  name: string;
  description: string;
  type: 'preventive' | 'detective' | 'corrective' | 'deterrent';
  status: 'planned' | 'active' | 'completed';
  effectiveness: number;
  cost: number;
}

export interface Threat {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: ThreatType;
  level: ThreatLevel;
  status: ThreatStatus;
  
  actors: ThreatActor[];
  indicators: ThreatIndicator[];
  countermeasures: CounterMeasure[];
  
  affectedProfiles: string[];
  affectedCampaigns: string[];
  
  probability: number;
  impact: number;
  riskScore: number;
  
  detectedAt: Date;
  lastAssessedAt: Date;
  resolvedAt: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions
export function calculateRiskScore(probability: number, impact: number): number {
  return (probability * impact) / 100;
}

export function getThreatPriorityOrder(level: ThreatLevel): number {
  const order: Record<ThreatLevel, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    minimal: 1,
  };
  return order[level];
}

export function shouldEscalate(threat: Threat): boolean {
  return (
    threat.level === 'critical' ||
    (threat.level === 'high' && threat.probability > 70) ||
    threat.riskScore > 80
  );
}
