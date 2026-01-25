// Enhanced Betrayal Likelihood Predictor - Trust network modeling with 180-day trajectory analysis
// Based on Gottman Four Horsemen, trust decay research, and predictive modeling

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
  // Enhanced fields
  trustTrajectory: TrustTrajectoryPoint[];
  criticalThreshold: number; // Point of no return
  recoveryPotential: number; // 0-1
  nextCrisisWindow: CrisisWindow | null;
}

export interface TrustTrajectoryPoint {
  date: string;
  trustScore: number;
  defectionRisk: number;
  significantEvents: string[];
  trendDirection: 'improving' | 'stable' | 'declining' | 'critical';
}

export interface CrisisWindow {
  predictedStart: string;
  predictedEnd: string;
  probability: number;
  triggers: string[];
  recommendedActions: string[];
}

export interface LoyaltyIndicator {
  type: 'investment' | 'reciprocity' | 'identity' | 'dependency' | 'fear' | 'shared_secrets' | 'mutual_threats';
  description: string;
  strength: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  lastObserved: string;
  halfLife: number; // Days until strength halves without reinforcement
}

export interface WarningSignal {
  category: 'gottman' | 'behavioral' | 'communication' | 'financial' | 'social' | 'digital' | 'network';
  signal: string;
  severity: number;
  frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
  firstObserved: string;
  escalating: boolean;
  velocityScore: number; // How fast the signal is intensifying
}

export interface RiskMitigation {
  strategy: string;
  effectiveness: number;
  cost: 'low' | 'medium' | 'high';
  timeframe: string;
  sideEffects: string[];
  successProbability: number;
  prerequisiteConditions: string[];
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
      velocityScore: 0.3,
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
      velocityScore: frequencyDrop * 0.5,
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
      velocityScore: 0.25,
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
      velocityScore: Math.abs(communicationPatterns.emotionalValence) * 0.5,
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
      successProbability: 0.4,
      prerequisiteConditions: ['Target still engaged', 'Communication channel open'],
    });
  }
  
  if (defectionProbability > 0.5) {
    strategies.push({
      strategy: 'Increase mutual investments and dependencies',
      effectiveness: 0.7,
      cost: 'medium',
      timeframe: '2-4 weeks',
      sideEffects: ['Creates lock-in but may increase resentment'],
      successProbability: 0.55,
      prerequisiteConditions: ['Shared interests exist', 'Target receptive to new commitments'],
    });
  }
  
  strategies.push({
    strategy: 'Reactivate positive interaction patterns',
    effectiveness: 0.5,
    cost: 'low',
    timeframe: '1-2 weeks',
    sideEffects: ['Minimal risk'],
    successProbability: 0.65,
    prerequisiteConditions: ['Basic rapport maintained'],
  });
  
  if (availableLeverage.length > 0) {
    strategies.push({
      strategy: 'Strategic reminder of mutual interests/consequences',
      effectiveness: 0.8,
      cost: 'medium',
      timeframe: 'Immediate',
      sideEffects: ['May damage trust further', 'Could trigger immediate exit'],
      successProbability: 0.35,
      prerequisiteConditions: ['Leverage verified', 'Exit not imminent'],
    });
  }
  
  return strategies;
}

// Enhanced: Calculate 180-day trust trajectory
export function calculateTrustTrajectory(
  historicalData: Array<{
    date: string;
    trustScore: number;
    events: string[];
  }>
): TrustTrajectoryPoint[] {
  const trajectory: TrustTrajectoryPoint[] = [];
  
  for (let i = 0; i < historicalData.length; i++) {
    const current = historicalData[i];
    const previous = i > 0 ? historicalData[i - 1] : null;
    
    let trendDirection: TrustTrajectoryPoint['trendDirection'] = 'stable';
    if (previous) {
      const delta = current.trustScore - previous.trustScore;
      if (delta > 0.05) trendDirection = 'improving';
      else if (delta < -0.1) trendDirection = 'critical';
      else if (delta < -0.03) trendDirection = 'declining';
    }
    
    // Calculate defection risk based on trust score
    const defectionRisk = Math.max(0, Math.min(1, 1 - current.trustScore));
    
    trajectory.push({
      date: current.date,
      trustScore: current.trustScore,
      defectionRisk,
      significantEvents: current.events,
      trendDirection,
    });
  }
  
  return trajectory;
}

// Enhanced: Predict next crisis window
export function predictCrisisWindow(
  trajectory: TrustTrajectoryPoint[],
  knownTriggers: string[]
): CrisisWindow | null {
  if (trajectory.length < 7) return null;
  
  // Find declining patterns
  const recentPoints = trajectory.slice(-30);
  const decliningCount = recentPoints.filter(p => p.trendDirection === 'declining' || p.trendDirection === 'critical').length;
  
  if (decliningCount < 5) return null;
  
  // Calculate velocity of decline
  const velocityOfDecline = recentPoints.reduce((acc, p, i) => {
    if (i === 0) return 0;
    return acc + (recentPoints[i - 1].trustScore - p.trustScore);
  }, 0) / recentPoints.length;
  
  if (velocityOfDecline < 0.01) return null;
  
  // Predict crisis window
  const daysToThreshold = Math.ceil((recentPoints[recentPoints.length - 1].trustScore - 0.3) / velocityOfDecline);
  const predictedStart = new Date();
  predictedStart.setDate(predictedStart.getDate() + Math.max(1, daysToThreshold - 7));
  
  const predictedEnd = new Date(predictedStart);
  predictedEnd.setDate(predictedEnd.getDate() + 14);
  
  return {
    predictedStart: predictedStart.toISOString(),
    predictedEnd: predictedEnd.toISOString(),
    probability: Math.min(0.95, decliningCount / 30 + velocityOfDecline * 5),
    triggers: knownTriggers.length > 0 ? knownTriggers : ['Trust threshold breach', 'Accumulated grievances'],
    recommendedActions: [
      'Initiate trust repair protocol',
      'Increase positive interaction frequency',
      'Address outstanding grievances',
      'Reinforce mutual dependencies',
    ],
  };
}

// ============== TRUST HALF-LIFE EXTENSIONS (v6.0) ==============

export interface HalfLifeProjection {
  currentTrust: number;
  halfLifeDays: number;
  decayRate: number;
  decayCurve: Array<{ date: string; trust: number }>;
  criticalDate: string | null;
  reinforcementActions: string[];
  urgency: 'immediate' | 'soon' | 'scheduled' | 'none';
}

export const RELATIONSHIP_HALF_LIVES: Record<string, number> = {
  professional: 14,
  personal: 30,
  intimate: 60,
  strategic_asset: 7,
  casual: 21,
  family: 90,
  competitor: 5,
};

/**
 * Calculate trust half-life based on relationship type and interaction history
 */
export function calculateTrustHalfLife(
  relationshipType: keyof typeof RELATIONSHIP_HALF_LIVES,
  interactionHistory: Array<{ date: string; type: 'positive' | 'negative' | 'neutral' }>,
  currentTrust: number
): HalfLifeProjection {
  const baseHalfLife = RELATIONSHIP_HALF_LIVES[relationshipType] || 21;
  
  const positiveCount = interactionHistory.filter(i => i.type === 'positive').length;
  const negativeCount = interactionHistory.filter(i => i.type === 'negative').length;
  const total = interactionHistory.length || 1;
  
  const qualityRatio = (positiveCount - negativeCount) / total;
  const adjustedHalfLife = baseHalfLife * (1 + qualityRatio * 0.5);
  
  const decayRate = Math.LN2 / adjustedHalfLife;
  const decayCurve = projectTrustDecay(currentTrust, adjustedHalfLife, 90);
  
  const criticalPoint = decayCurve.find(p => p.trust < 0.3);
  const criticalDate = criticalPoint?.date || null;
  
  const daysUntilCritical = criticalDate 
    ? Math.ceil((new Date(criticalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  
  let urgency: HalfLifeProjection['urgency'] = 'none';
  const reinforcementActions: string[] = [];
  
  if (daysUntilCritical !== null) {
    if (daysUntilCritical <= 7) {
      urgency = 'immediate';
      reinforcementActions.push('Schedule urgent in-person meeting');
      reinforcementActions.push('Provide unexpected value/gift');
      reinforcementActions.push('Address any outstanding grievances');
    } else if (daysUntilCritical <= 21) {
      urgency = 'soon';
      reinforcementActions.push('Increase communication frequency');
      reinforcementActions.push('Plan shared activity or project');
    } else if (daysUntilCritical <= 45) {
      urgency = 'scheduled';
      reinforcementActions.push('Schedule regular check-ins');
      reinforcementActions.push('Maintain positive interaction ratio');
    }
  }
  
  return {
    currentTrust,
    halfLifeDays: Math.round(adjustedHalfLife),
    decayRate,
    decayCurve,
    criticalDate,
    reinforcementActions,
    urgency,
  };
}

/**
 * Project trust decay over time using exponential decay model
 */
export function projectTrustDecay(
  initialTrust: number,
  halfLifeDays: number,
  projectionDays: number
): Array<{ date: string; trust: number }> {
  const curve: Array<{ date: string; trust: number }> = [];
  const now = new Date();
  
  for (let day = 0; day <= projectionDays; day += 1) {
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + day);
    
    const trust = initialTrust * Math.pow(0.5, day / halfLifeDays);
    
    curve.push({
      date: futureDate.toISOString().split('T')[0],
      trust: Math.max(0, Math.round(trust * 1000) / 1000),
    });
  }
  
  return curve;
}

/**
 * Calculate reinforcement effectiveness
 */
export function calculateReinforcementImpact(
  currentTrust: number,
  reinforcementType: 'positive_interaction' | 'shared_experience' | 'mutual_investment' | 'crisis_support',
  _relationshipType: keyof typeof RELATIONSHIP_HALF_LIVES
): { newTrust: number; halfLifeExtension: number } {
  const impactFactors: Record<string, { trustBoost: number; halfLifeExtension: number }> = {
    positive_interaction: { trustBoost: 0.05, halfLifeExtension: 2 },
    shared_experience: { trustBoost: 0.10, halfLifeExtension: 5 },
    mutual_investment: { trustBoost: 0.15, halfLifeExtension: 10 },
    crisis_support: { trustBoost: 0.25, halfLifeExtension: 20 },
  };
  
  const impact = impactFactors[reinforcementType] || { trustBoost: 0.02, halfLifeExtension: 1 };
  
  return {
    newTrust: Math.min(1.0, currentTrust + impact.trustBoost),
    halfLifeExtension: impact.halfLifeExtension,
  };
}
