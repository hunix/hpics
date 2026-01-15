// Betrayal Likelihood Predictor - Trust network modeling with defection risk assessment
// Based on Gottman Four Horsemen and trust decay research

export interface BetrayalProfile {
  profileId: string;
  trustScore: number; // 0-1
  defectionProbability: number; // 0-1
  loyaltyIndicators: LoyaltyIndicator[];
  warningSignals: WarningSignal[];
  predictedTriggers: string[];
  riskMitigation: RiskMitigation[];
  timeline: string;
  confidenceScore: number;
}

export interface LoyaltyIndicator {
  type: 'investment' | 'reciprocity' | 'identity' | 'dependency' | 'fear';
  description: string;
  strength: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastObserved: string;
}

export interface WarningSignal {
  category: 'gottman' | 'behavioral' | 'communication' | 'financial' | 'social';
  signal: string;
  severity: number;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  firstObserved: string;
  escalating: boolean;
}

export interface RiskMitigation {
  strategy: string;
  effectiveness: number;
  cost: 'low' | 'medium' | 'high';
  timeframe: string;
  sideEffects: string[];
}

// Gottman's Four Horsemen of relationship apocalypse
export const GOTTMAN_HORSEMEN = {
  CRITICISM: {
    name: 'Criticism',
    description: 'Attacking character rather than behavior',
    indicators: [
      'Generalizations using "always" or "never"',
      'Character attacks vs specific complaints',
      'Blame without acknowledgment',
    ],
    predictiveWeight: 0.25,
  },
  CONTEMPT: {
    name: 'Contempt',
    description: 'Treating with disrespect, mockery, eye-rolling',
    indicators: [
      'Sarcasm and cynicism',
      'Name-calling',
      'Eye-rolling and sneering',
      'Hostile humor',
    ],
    predictiveWeight: 0.35, // Strongest predictor
  },
  DEFENSIVENESS: {
    name: 'Defensiveness',
    description: 'Self-protection through righteous indignation or victimhood',
    indicators: [
      'Making excuses',
      'Cross-complaining',
      'Repeating self without listening',
      'Denying responsibility',
    ],
    predictiveWeight: 0.20,
  },
  STONEWALLING: {
    name: 'Stonewalling',
    description: 'Withdrawing and refusing to engage',
    indicators: [
      'Turning away',
      'Ignoring messages',
      'Delayed responses',
      'Monosyllabic replies',
    ],
    predictiveWeight: 0.20,
  },
} as const;

// Trust decay factors
export const TRUST_DECAY_FACTORS = {
  TIME_SINCE_POSITIVE: 0.02, // per day without positive interaction
  BROKEN_PROMISE: 0.15, // per instance
  DISCOVERED_LIE: 0.25, // per instance
  THIRD_PARTY_NEGATIVE: 0.08, // negative info from others
  INCONSISTENCY: 0.05, // per detected inconsistency
  REDUCED_CONTACT: 0.03, // per week of reduced contact
} as const;

// Loyalty binding factors
export const LOYALTY_BINDING_FACTORS = {
  SHARED_SECRET: 0.15,
  MUTUAL_INVESTMENT: 0.12,
  IDENTITY_ENTANGLEMENT: 0.18,
  FEAR_OF_LOSS: 0.10,
  SUNK_COST: 0.08,
  SOCIAL_PROOF: 0.06,
  RECIPROCITY_DEBT: 0.10,
} as const;

// Calculate overall defection probability
export function calculateDefectionProbability(
  gottmanScores: Record<keyof typeof GOTTMAN_HORSEMEN, number>,
  trustDecayEvents: Array<{ type: keyof typeof TRUST_DECAY_FACTORS; count: number }>,
  loyaltyBindings: Array<{ type: keyof typeof LOYALTY_BINDING_FACTORS; strength: number }>
): number {
  // Calculate Gottman-based risk
  let gottmanRisk = 0;
  for (const [horseman, config] of Object.entries(GOTTMAN_HORSEMEN)) {
    const score = gottmanScores[horseman as keyof typeof GOTTMAN_HORSEMEN] || 0;
    gottmanRisk += score * config.predictiveWeight;
  }
  
  // Calculate trust decay
  let trustDecay = 0;
  for (const event of trustDecayEvents) {
    trustDecay += TRUST_DECAY_FACTORS[event.type] * event.count;
  }
  trustDecay = Math.min(1, trustDecay);
  
  // Calculate loyalty binding (protective factor)
  let loyaltyBinding = 0;
  for (const binding of loyaltyBindings) {
    loyaltyBinding += LOYALTY_BINDING_FACTORS[binding.type] * binding.strength;
  }
  loyaltyBinding = Math.min(1, loyaltyBinding);
  
  // Combined probability: (risk factors) * (1 - protective factors)
  const rawProbability = (gottmanRisk * 0.4 + trustDecay * 0.6) * (1 - loyaltyBinding * 0.5);
  
  return Math.min(1, Math.max(0, rawProbability));
}

// Identify warning signals from behavioral data
export function identifyWarningSignals(
  communicationPatterns: {
    responseTime: { mean: number; trend: 'faster' | 'stable' | 'slower' };
    messageLength: { mean: number; trend: 'longer' | 'stable' | 'shorter' };
    initiationRatio: number;
    emotionalValence: number;
  },
  meetingFrequency: { current: number; baseline: number },
  socialConnections: { mutual: number; exclusive: number; trend: 'growing' | 'stable' | 'shrinking' }
): WarningSignal[] {
  const signals: WarningSignal[] = [];
  
  // Check response time degradation
  if (communicationPatterns.responseTime.trend === 'slower') {
    signals.push({
      category: 'communication',
      signal: 'Increasing response delays',
      severity: 0.4,
      frequency: 'frequent',
      firstObserved: new Date().toISOString(),
      escalating: true,
    });
  }
  
  // Check meeting frequency drop
  const frequencyDrop = (meetingFrequency.baseline - meetingFrequency.current) / meetingFrequency.baseline;
  if (frequencyDrop > 0.3) {
    signals.push({
      category: 'behavioral',
      signal: `Meeting frequency dropped by ${Math.round(frequencyDrop * 100)}%`,
      severity: frequencyDrop * 0.8,
      frequency: frequencyDrop > 0.5 ? 'constant' : 'frequent',
      firstObserved: new Date().toISOString(),
      escalating: true,
    });
  }
  
  // Check social network changes
  if (socialConnections.trend === 'shrinking') {
    signals.push({
      category: 'social',
      signal: 'Mutual connections decreasing',
      severity: 0.5,
      frequency: 'occasional',
      firstObserved: new Date().toISOString(),
      escalating: true,
    });
  }
  
  // Check emotional valence
  if (communicationPatterns.emotionalValence < -0.2) {
    signals.push({
      category: 'communication',
      signal: 'Negative emotional tone in communications',
      severity: Math.abs(communicationPatterns.emotionalValence),
      frequency: 'frequent',
      firstObserved: new Date().toISOString(),
      escalating: communicationPatterns.emotionalValence < -0.4,
    });
  }
  
  return signals;
}

// Generate risk mitigation strategies
export function generateMitigationStrategies(
  defectionProbability: number,
  primaryRiskFactors: string[],
  availableLeverage: { type: string; strength: number }[]
): RiskMitigation[] {
  const strategies: RiskMitigation[] = [];
  
  if (defectionProbability > 0.7) {
    strategies.push({
      strategy: 'Immediate relationship repair initiative',
      effectiveness: 0.6,
      cost: 'high',
      timeframe: '1-2 weeks',
      sideEffects: ['May appear desperate', 'Could accelerate exit if mishandled'],
    });
  }
  
  if (defectionProbability > 0.5) {
    strategies.push({
      strategy: 'Increase mutual investments and dependencies',
      effectiveness: 0.7,
      cost: 'medium',
      timeframe: '2-4 weeks',
      sideEffects: ['Creates lock-in but may increase resentment'],
    });
  }
  
  strategies.push({
    strategy: 'Reactivate positive interaction patterns',
    effectiveness: 0.5,
    cost: 'low',
    timeframe: '1-2 weeks',
    sideEffects: ['Minimal risk'],
  });
  
  if (availableLeverage.length > 0) {
    strategies.push({
      strategy: 'Strategic reminder of mutual interests/consequences',
      effectiveness: 0.8,
      cost: 'medium',
      timeframe: 'Immediate',
      sideEffects: ['May damage trust further', 'Could trigger immediate exit'],
    });
  }
  
  return strategies;
}
