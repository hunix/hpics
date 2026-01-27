/**
 * Bayesian Persuader Engine (v9.0)
 * 
 * Implements optimal information disclosure strategies for strategic influence.
 * Based on Kamenica & Gentzkow (2011) Bayesian Persuasion framework.
 * 
 * @version 9.0
 */

export interface ReceiverType {
  id: string;
  name: string;
  priorBeliefs: Record<string, number>; // Prior probability distribution over states
  utilityFunction: (state: string, action: string) => number;
  decisionThreshold: number; // Threshold for taking target action
}

export interface Signal {
  id: string;
  name: string;
  conditionalProbabilities: Record<string, Record<string, number>>; // P(signal | state)
}

export interface SignalStructure {
  signals: Signal[];
  expectedReceiverAction: string;
  persuasionProbability: number;
  informationRent: number;
}

export interface PersuasionStrategy {
  targetAction: string;
  optimalSignals: Signal[];
  expectedPayoff: number;
  persuasionSuccess: number;
  trustConstraintSatisfied: boolean;
  sequentialSignals: Signal[][];
}

export interface TrustConstraint {
  minCredibility: number;
  maxDeception: number;
  relationshipValue: number;
}

export interface PersuasionAnalysis {
  receiverType: ReceiverType;
  strategies: PersuasionStrategy[];
  optimalStrategy: PersuasionStrategy;
  trustImpact: number;
  longTermViability: number;
  recommendations: string[];
}

/**
 * Calculate posterior beliefs after signal observation
 */
export function calculatePosterior(
  priors: Record<string, number>,
  signal: Signal,
  observedSignal: string
): Record<string, number> {
  const posteriors: Record<string, number> = {};
  let totalProb = 0;
  
  for (const [state, prior] of Object.entries(priors)) {
    const likelihood = signal.conditionalProbabilities[state]?.[observedSignal] || 0;
    posteriors[state] = prior * likelihood;
    totalProb += posteriors[state];
  }
  
  // Normalize
  if (totalProb > 0) {
    for (const state of Object.keys(posteriors)) {
      posteriors[state] /= totalProb;
    }
  }
  
  return posteriors;
}

/**
 * Calculate expected utility for receiver given beliefs
 */
export function calculateExpectedUtility(
  receiver: ReceiverType,
  beliefs: Record<string, number>,
  action: string
): number {
  let expectedUtility = 0;
  
  for (const [state, prob] of Object.entries(beliefs)) {
    expectedUtility += prob * receiver.utilityFunction(state, action);
  }
  
  return expectedUtility;
}

/**
 * Determine receiver's optimal action given beliefs
 */
export function getOptimalAction(
  receiver: ReceiverType,
  beliefs: Record<string, number>,
  possibleActions: string[]
): string {
  let bestAction = possibleActions[0];
  let bestUtility = -Infinity;
  
  for (const action of possibleActions) {
    const utility = calculateExpectedUtility(receiver, beliefs, action);
    if (utility > bestUtility) {
      bestUtility = utility;
      bestAction = action;
    }
  }
  
  return bestAction;
}

/**
 * Design optimal signal structure for target action
 */
export function designOptimalSignals(
  receiver: ReceiverType,
  targetAction: string,
  states: string[],
  trustConstraint?: TrustConstraint
): SignalStructure {
  // Binary signal structure (simplified)
  const persuadeSignal: Signal = {
    id: 'persuade',
    name: 'Persuade Signal',
    conditionalProbabilities: {},
  };
  
  const neutralSignal: Signal = {
    id: 'neutral',
    name: 'Neutral Signal',
    conditionalProbabilities: {},
  };
  
  // Calculate optimal signal probabilities
  for (const state of states) {
    // Signal that favors target action in favorable states
    const favorability = receiver.utilityFunction(state, targetAction);
    
    persuadeSignal.conditionalProbabilities[state] = {
      'persuade': Math.min(1, Math.max(0, favorability)),
      'neutral': Math.max(0, 1 - favorability),
    };
    
    neutralSignal.conditionalProbabilities[state] = {
      'persuade': 0,
      'neutral': 1,
    };
  }
  
  // Apply trust constraints if provided
  if (trustConstraint) {
    applyTrustConstraints(persuadeSignal, trustConstraint);
  }
  
  // Calculate persuasion probability
  let persuasionProb = 0;
  for (const [state, prior] of Object.entries(receiver.priorBeliefs)) {
    persuasionProb += prior * (persuadeSignal.conditionalProbabilities[state]?.['persuade'] || 0);
  }
  
  // Calculate information rent (benefit from persuasion)
  const informationRent = calculateInformationRent(receiver, targetAction, persuadeSignal);
  
  return {
    signals: [persuadeSignal, neutralSignal],
    expectedReceiverAction: targetAction,
    persuasionProbability: persuasionProb,
    informationRent,
  };
}

/**
 * Apply trust constraints to signal structure
 */
function applyTrustConstraints(signal: Signal, constraint: TrustConstraint): void {
  for (const state of Object.keys(signal.conditionalProbabilities)) {
    const probs = signal.conditionalProbabilities[state];
    
    // Limit deceptive signaling
    const maxDeceptive = constraint.maxDeception;
    if (probs['persuade'] > maxDeceptive) {
      probs['persuade'] = maxDeceptive;
      probs['neutral'] = 1 - maxDeceptive;
    }
  }
}

/**
 * Calculate information rent from persuasion
 */
function calculateInformationRent(
  receiver: ReceiverType,
  targetAction: string,
  signal: Signal
): number {
  // Information rent = expected payoff with optimal signal - payoff without signaling
  let withSignal = 0;
  let withoutSignal = 0;
  
  for (const [state, prior] of Object.entries(receiver.priorBeliefs)) {
    const signalProb = signal.conditionalProbabilities[state]?.['persuade'] || 0;
    withSignal += prior * signalProb * receiver.utilityFunction(state, targetAction);
    withoutSignal += prior * receiver.utilityFunction(state, 'default');
  }
  
  return withSignal - withoutSignal;
}

/**
 * Design sequential persuasion strategy
 */
export function designSequentialStrategy(
  receiver: ReceiverType,
  targetAction: string,
  states: string[],
  rounds: number
): Signal[][] {
  const sequence: Signal[][] = [];
  let currentBeliefs = { ...receiver.priorBeliefs };
  
  for (let round = 0; round < rounds; round++) {
    // Each round reveals partial information
    const roundSignals: Signal[] = [];
    const partialReveal = (round + 1) / rounds;
    
    const infoSignal: Signal = {
      id: `round-${round}-info`,
      name: `Round ${round + 1} Information`,
      conditionalProbabilities: {},
    };
    
    for (const state of states) {
      // Gradually increase informativeness
      infoSignal.conditionalProbabilities[state] = {
        'favorable': partialReveal * (receiver.utilityFunction(state, targetAction) > 0 ? 1 : 0.2),
        'unfavorable': partialReveal * (receiver.utilityFunction(state, targetAction) <= 0 ? 1 : 0.2),
      };
    }
    
    roundSignals.push(infoSignal);
    sequence.push(roundSignals);
    
    // Update beliefs for next round
    currentBeliefs = calculatePosterior(currentBeliefs, infoSignal, 'favorable');
  }
  
  return sequence;
}

/**
 * Calculate optimal disclosure timing
 */
export function calculateOptimalTiming(
  receiver: ReceiverType,
  information: Record<string, unknown>,
  urgency: number
): { timing: string; delay: number; rationale: string } {
  // Balance urgency with receptivity
  const currentReceptivity = estimateReceptivity(receiver);
  
  if (urgency > 0.8) {
    return {
      timing: 'immediate',
      delay: 0,
      rationale: 'High urgency overrides timing optimization',
    };
  }
  
  if (currentReceptivity > 0.7) {
    return {
      timing: 'now',
      delay: 0,
      rationale: 'High receptivity detected - optimal window',
    };
  }
  
  // Wait for better timing
  const optimalDelay = Math.floor((1 - currentReceptivity) * 72); // hours
  
  return {
    timing: 'delayed',
    delay: optimalDelay,
    rationale: `Wait ${optimalDelay}h for improved receptivity`,
  };
}

/**
 * Estimate receiver's current receptivity
 */
function estimateReceptivity(receiver: ReceiverType): number {
  // Based on decision threshold and prior beliefs
  const avgBelief = Object.values(receiver.priorBeliefs).reduce((a, b) => a + b, 0) / 
    Object.keys(receiver.priorBeliefs).length;
  
  return Math.min(1, Math.max(0, receiver.decisionThreshold + avgBelief - 0.5));
}

/**
 * Full persuasion analysis
 */
export function analyzePersuasion(
  receiver: ReceiverType,
  targetActions: string[],
  states: string[],
  trustConstraint?: TrustConstraint
): PersuasionAnalysis {
  const strategies: PersuasionStrategy[] = [];
  
  for (const targetAction of targetActions) {
    const signalStructure = designOptimalSignals(receiver, targetAction, states, trustConstraint);
    const sequentialSignals = designSequentialStrategy(receiver, targetAction, states, 3);
    
    strategies.push({
      targetAction,
      optimalSignals: signalStructure.signals,
      expectedPayoff: signalStructure.informationRent,
      persuasionSuccess: signalStructure.persuasionProbability,
      trustConstraintSatisfied: !trustConstraint || signalStructure.persuasionProbability <= trustConstraint.maxDeception,
      sequentialSignals,
    });
  }
  
  // Find optimal strategy
  const optimalStrategy = strategies.reduce((best, current) => 
    current.expectedPayoff > best.expectedPayoff ? current : best
  , strategies[0]);
  
  // Calculate trust impact
  const trustImpact = trustConstraint 
    ? optimalStrategy.persuasionSuccess * (1 - trustConstraint.maxDeception)
    : optimalStrategy.persuasionSuccess * 0.5;
  
  // Generate recommendations
  const recommendations = generatePersuasionRecommendations(optimalStrategy, trustImpact);
  
  return {
    receiverType: receiver,
    strategies,
    optimalStrategy,
    trustImpact,
    longTermViability: 1 - trustImpact,
    recommendations,
  };
}

/**
 * Generate persuasion recommendations
 */
function generatePersuasionRecommendations(
  strategy: PersuasionStrategy,
  trustImpact: number
): string[] {
  const recommendations: string[] = [];
  
  if (strategy.persuasionSuccess > 0.7) {
    recommendations.push(`High probability of success (${(strategy.persuasionSuccess * 100).toFixed(0)}%) for ${strategy.targetAction}`);
  }
  
  if (trustImpact > 0.5) {
    recommendations.push('Warning: Strategy may damage long-term trust');
    recommendations.push('Consider using sequential disclosure to maintain credibility');
  }
  
  if (strategy.sequentialSignals.length > 0) {
    recommendations.push(`${strategy.sequentialSignals.length}-round sequential strategy available`);
  }
  
  return recommendations;
}
