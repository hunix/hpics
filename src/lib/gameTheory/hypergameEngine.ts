/**
 * Hypergame Theory Engine (v9.0)
 * 
 * Implements Level-N belief modeling when adversaries play "different games"
 * Based on NATO House Model, CIA Reflexive Control, and DARPA Kallisti frameworks.
 * 
 * @version 9.0
 */

export interface Player {
  id: string;
  name: string;
  profileId?: string;
  strategies: string[];
  perceivedGame: GameMatrix;
  beliefLevel: number; // Level of strategic thinking (0-N)
}

export interface GameMatrix {
  players: string[];
  strategies: Record<string, string[]>;
  payoffs: Record<string, Record<string, number>>;
}

export interface PerceptionGap {
  playerId: string;
  targetPlayerId: string;
  actualStrategy: string;
  perceivedStrategy: string;
  exploitabilityScore: number;
  interventionVector: string;
}

export interface HypergameNashEquilibrium {
  level: number;
  strategies: Record<string, string>;
  isStrong: boolean; // Strong HNE vs Weak HNE
  stability: number;
  perceptionGaps: PerceptionGap[];
}

export interface HypergameAnalysis {
  players: Player[];
  equilibria: HypergameNashEquilibrium[];
  dominantStrategies: Record<string, string>;
  perceptionGaps: PerceptionGap[];
  exploitableAsymmetries: ExploitableAsymmetry[];
  recommendedActions: string[];
  confidence: number;
}

export interface ExploitableAsymmetry {
  type: 'information' | 'belief' | 'perception' | 'capability';
  description: string;
  exploitabilityScore: number;
  suggestedExploit: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BeliefState {
  playerId: string;
  beliefs: Record<string, number>; // Belief probabilities about other players' types
  level: number;
  lastUpdated: Date;
}

/**
 * Compute Level-K thinking strategies
 */
export function computeLevelKStrategy(
  player: Player,
  opponents: Player[],
  level: number
): string {
  if (level === 0) {
    // Level 0: Random/naive strategy
    return player.strategies[Math.floor(Math.random() * player.strategies.length)];
  }
  
  // Level K: Best response to Level K-1 strategies
  const opponentStrategies = opponents.map(opp => 
    computeLevelKStrategy(opp, [player], level - 1)
  );
  
  // Find best response
  return findBestResponse(player, opponentStrategies);
}

/**
 * Find best response to opponent strategies
 */
function findBestResponse(player: Player, opponentStrategies: string[]): string {
  let bestStrategy = player.strategies[0];
  let bestPayoff = -Infinity;
  
  for (const strategy of player.strategies) {
    const payoff = evaluatePayoff(player, strategy, opponentStrategies);
    if (payoff > bestPayoff) {
      bestPayoff = payoff;
      bestStrategy = strategy;
    }
  }
  
  return bestStrategy;
}

/**
 * Evaluate payoff for a strategy given opponent strategies
 */
function evaluatePayoff(
  player: Player,
  strategy: string,
  opponentStrategies: string[]
): number {
  // Default payoff calculation based on perceived game matrix
  const key = [strategy, ...opponentStrategies].join('-');
  return player.perceivedGame.payoffs[player.id]?.[key] ?? 0;
}

/**
 * Detect perception gaps between players
 */
export function detectPerceptionGaps(players: Player[]): PerceptionGap[] {
  const gaps: PerceptionGap[] = [];
  
  for (const player of players) {
    for (const target of players) {
      if (player.id === target.id) continue;
      
      // Compare player's perception of target vs target's actual game
      const perceivedStrategies = player.perceivedGame.strategies[target.id] || [];
      const actualStrategies = target.strategies;
      
      // Check for strategy misperceptions
      for (const actual of actualStrategies) {
        if (!perceivedStrategies.includes(actual)) {
          gaps.push({
            playerId: player.id,
            targetPlayerId: target.id,
            actualStrategy: actual,
            perceivedStrategy: perceivedStrategies[0] || 'unknown',
            exploitabilityScore: calculateExploitability(player, target, actual),
            interventionVector: `Reveal ${actual} capability to shift perception`,
          });
        }
      }
    }
  }
  
  return gaps;
}

/**
 * Calculate exploitability of a perception gap
 */
function calculateExploitability(
  perceiver: Player,
  target: Player,
  hiddenStrategy: string
): number {
  // Higher score if hidden strategy dominates perceived strategies
  const perceivedPayoffs = (perceiver.perceivedGame.strategies[target.id] || [])
    .map(s => perceiver.perceivedGame.payoffs[target.id]?.[s] ?? 0);
  
  const actualPayoff = target.perceivedGame.payoffs[target.id]?.[hiddenStrategy] ?? 0;
  const maxPerceivedPayoff = Math.max(...perceivedPayoffs, 0);
  
  if (maxPerceivedPayoff === 0) return 0.5;
  return Math.min(1, actualPayoff / maxPerceivedPayoff);
}

/**
 * Compute Hypergame Nash Equilibrium (HNE)
 */
export function computeHNE(
  players: Player[],
  maxLevel: number = 3
): HypergameNashEquilibrium[] {
  const equilibria: HypergameNashEquilibrium[] = [];
  
  for (let level = 0; level <= maxLevel; level++) {
    const strategies: Record<string, string> = {};
    
    for (const player of players) {
      const others = players.filter(p => p.id !== player.id);
      strategies[player.id] = computeLevelKStrategy(player, others, level);
    }
    
    // Check stability
    const stability = evaluateEquilibriumStability(players, strategies);
    const perceptionGaps = detectPerceptionGaps(players);
    
    equilibria.push({
      level,
      strategies,
      isStrong: stability > 0.8,
      stability,
      perceptionGaps: perceptionGaps.filter(g => g.exploitabilityScore > 0.5),
    });
  }
  
  return equilibria;
}

/**
 * Evaluate stability of an equilibrium
 */
function evaluateEquilibriumStability(
  players: Player[],
  strategies: Record<string, string>
): number {
  let deviationGain = 0;
  let checkCount = 0;
  
  for (const player of players) {
    const currentStrategy = strategies[player.id];
    const currentPayoff = evaluatePayoff(
      player,
      currentStrategy,
      players.filter(p => p.id !== player.id).map(p => strategies[p.id])
    );
    
    for (const altStrategy of player.strategies) {
      if (altStrategy === currentStrategy) continue;
      
      const altPayoff = evaluatePayoff(
        player,
        altStrategy,
        players.filter(p => p.id !== player.id).map(p => strategies[p.id])
      );
      
      if (altPayoff > currentPayoff) {
        deviationGain += (altPayoff - currentPayoff);
      }
      checkCount++;
    }
  }
  
  // Stability = 1 - normalized deviation gain
  return checkCount > 0 ? Math.max(0, 1 - deviationGain / checkCount) : 1;
}

/**
 * Identify exploitable asymmetries in the game
 */
export function identifyExploitableAsymmetries(
  players: Player[]
): ExploitableAsymmetry[] {
  const asymmetries: ExploitableAsymmetry[] = [];
  
  for (const player of players) {
    for (const target of players) {
      if (player.id === target.id) continue;
      
      // Information asymmetry: player knows something target doesn't
      if (player.beliefLevel > target.beliefLevel) {
        asymmetries.push({
          type: 'belief',
          description: `${player.name} operates at Level ${player.beliefLevel} vs ${target.name}'s Level ${target.beliefLevel}`,
          exploitabilityScore: (player.beliefLevel - target.beliefLevel) * 0.3,
          suggestedExploit: 'Use higher-order reasoning to anticipate and counter their strategy',
          riskLevel: 'low',
        });
      }
      
      // Perception asymmetry
      const gaps = detectPerceptionGaps([player, target]);
      for (const gap of gaps) {
        if (gap.exploitabilityScore > 0.6) {
          asymmetries.push({
            type: 'perception',
            description: gap.interventionVector,
            exploitabilityScore: gap.exploitabilityScore,
            suggestedExploit: `Leverage hidden strategy: ${gap.actualStrategy}`,
            riskLevel: gap.exploitabilityScore > 0.8 ? 'low' : 'medium',
          });
        }
      }
    }
  }
  
  return asymmetries;
}

/**
 * Full hypergame analysis
 */
export function analyzeHypergame(players: Player[]): HypergameAnalysis {
  const equilibria = computeHNE(players);
  const perceptionGaps = detectPerceptionGaps(players);
  const asymmetries = identifyExploitableAsymmetries(players);
  
  // Determine dominant strategies
  const dominantStrategies: Record<string, string> = {};
  for (const player of players) {
    const strategyCounts: Record<string, number> = {};
    for (const eq of equilibria) {
      const s = eq.strategies[player.id];
      strategyCounts[s] = (strategyCounts[s] || 0) + 1;
    }
    
    dominantStrategies[player.id] = Object.entries(strategyCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || player.strategies[0];
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    players,
    equilibria,
    perceptionGaps,
    asymmetries
  );
  
  // Calculate confidence
  const avgStability = equilibria.reduce((sum, e) => sum + e.stability, 0) / equilibria.length;
  
  return {
    players,
    equilibria,
    dominantStrategies,
    perceptionGaps,
    exploitableAsymmetries: asymmetries,
    recommendedActions: recommendations,
    confidence: avgStability,
  };
}

/**
 * Generate strategic recommendations
 */
function generateRecommendations(
  players: Player[],
  equilibria: HypergameNashEquilibrium[],
  perceptionGaps: PerceptionGap[],
  asymmetries: ExploitableAsymmetry[]
): string[] {
  const recommendations: string[] = [];
  
  // Recommend exploiting high-value perception gaps
  const highValueGaps = perceptionGaps.filter(g => g.exploitabilityScore > 0.7);
  for (const gap of highValueGaps.slice(0, 3)) {
    recommendations.push(gap.interventionVector);
  }
  
  // Recommend leveraging asymmetries
  const sortedAsymmetries = asymmetries.sort((a, b) => b.exploitabilityScore - a.exploitabilityScore);
  for (const asymmetry of sortedAsymmetries.slice(0, 2)) {
    recommendations.push(asymmetry.suggestedExploit);
  }
  
  // Recommend stable equilibrium strategies
  const strongEq = equilibria.find(e => e.isStrong);
  if (strongEq) {
    recommendations.push(`Adopt stable equilibrium strategy at Level ${strongEq.level}`);
  }
  
  return recommendations;
}

/**
 * Update belief state based on observed actions
 */
export function updateBeliefState(
  current: BeliefState,
  observedAction: string,
  priorBeliefs: Record<string, number>
): BeliefState {
  // Bayesian belief update
  const updatedBeliefs: Record<string, number> = {};
  let totalProb = 0;
  
  for (const [type, prior] of Object.entries(priorBeliefs)) {
    // Likelihood of observing action given type (simplified)
    const likelihood = observedAction.includes(type) ? 0.8 : 0.2;
    const posterior = prior * likelihood;
    updatedBeliefs[type] = posterior;
    totalProb += posterior;
  }
  
  // Normalize
  for (const type of Object.keys(updatedBeliefs)) {
    updatedBeliefs[type] = totalProb > 0 ? updatedBeliefs[type] / totalProb : 1 / Object.keys(updatedBeliefs).length;
  }
  
  return {
    ...current,
    beliefs: updatedBeliefs,
    lastUpdated: new Date(),
  };
}
