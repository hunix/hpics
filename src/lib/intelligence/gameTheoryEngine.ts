/**
 * Game Theory Engine (v7.0)
 * Strategic interaction modeling and optimization
 * 
 * Enhanced with:
 * - NATO "House Model" Cognitive Effects Framework (2025)
 * - Reflexive Control Detection (CIA Studies in Intelligence 2025)
 * - DARPA Kallisti-Style Theory of Mind
 * - Advanced Hypergame Theory with Multi-Level Perception
 */

// ============== CORE INTERFACES ==============

export interface Player {
  id: string;
  name: string;
  strategies: string[];
  rationality_score: number; // 0-1, how rational the player is
  risk_tolerance: number; // 0-1, risk seeking vs averse
}

export interface StrategyProfile {
  player_strategies: Map<string, string>;
  is_nash_equilibrium: boolean;
  is_pareto_optimal: boolean;
  stability_score: number;
}

export interface GameOutcome {
  strategy_profile: StrategyProfile;
  payoffs: Map<string, number>;
  social_welfare: number;
}

export interface StrategicInteraction {
  game_type: 'prisoners_dilemma' | 'chicken' | 'stag_hunt' | 'battle_of_sexes' | 'coordination' | 'zero_sum' | 'custom';
  players: Player[];
  strategies_per_player: string[][];
  payoff_matrix: number[][][]; // [player1_strategy][player2_strategy][player_payoff]
  nash_equilibria: StrategyProfile[];
  pareto_optimal_outcomes: GameOutcome[];
  dominant_strategies: Map<string, string | null>;
  mixed_strategy_equilibria: MixedStrategy[];
  recommended_strategy: string;
  confidence: number;
}

export interface MixedStrategy {
  player_id: string;
  strategy_probabilities: Map<string, number>;
  expected_payoff: number;
}

// ============== NATO HOUSE MODEL (v7.0) ==============

/**
 * NATO Chief Scientist 2025: "House Model" Cognitive Effects Framework
 * Three interconnected levels of cognitive influence
 */
export interface CognitiveEffectLevel {
  /** Biological level: Nervous system manipulation (stress, fatigue, arousal) */
  biological: number;
  /** Psychological level: Interpretation and framing manipulation */
  psychological: number;
  /** Social level: Group cohesion, legitimacy, and identity manipulation */
  social: number;
}

export interface CognitiveEffectAnalysis {
  targetProfile: string;
  effectLevels: CognitiveEffectLevel;
  primaryAttackVector: 'biological' | 'psychological' | 'social';
  cascadeEffects: CognitiveEffectCascade[];
  ambiguityWindow: {
    start: Date;
    end: Date;
    optimalMoment: Date;
  };
  narrativeSynchronization: {
    requiredActors: string[];
    messagingTiming: number[]; // Hours between message releases
    expectedAmplification: number;
  };
  counterMeasures: string[];
  ethicalBoundaries: string[];
}

export interface CognitiveEffectCascade {
  sourceLevel: 'biological' | 'psychological' | 'social';
  targetLevel: 'biological' | 'psychological' | 'social';
  mechanism: string;
  magnitude: number;
  delay_hours: number;
}

// ============== REFLEXIVE CONTROL (v7.0) ==============

/**
 * CIA Studies in Intelligence Vol. 69 (2025): Reflexive Control Detection
 * Identifies when adversaries attempt to "transmit motives" to induce self-defeating decisions
 */
export type ReflexiveControlTechnique = 
  | 'motive_transmission'      // Implanting false objectives
  | 'false_narrative'          // Fabricated context/history
  | 'perception_management'    // Manipulating situational awareness
  | 'dilemma_creation'         // Forcing false binary choices
  | 'filter_manipulation'      // Controlling information flow
  | 'goal_substitution'        // Replacing actual objectives
  | 'pressure_point_activation' // Exploiting known vulnerabilities
  | 'decision_paralysis_induction'; // Overwhelming with options/threats

export interface ReflexiveControlIndicator {
  technique: ReflexiveControlTechnique;
  confidence: number;
  evidence: string[];
  sourceProfile: string;
  targetedDecision: string;
  intendedOutcome: string;
  detectedAt: Date;
}

export interface ReflexiveControlAnalysis {
  isBeingTargeted: boolean;
  overallRisk: number;
  indicators: ReflexiveControlIndicator[];
  activeInfluenceAttempts: number;
  counterStrategies: CounterReflexiveStrategy[];
  situationalAwarenessScore: number;
  decisionIntegrityScore: number;
}

export interface CounterReflexiveStrategy {
  name: string;
  description: string;
  applicableTo: ReflexiveControlTechnique[];
  effectiveness: number;
  implementationSteps: string[];
}

// ============== KALLISTI THEORY OF MIND (v7.0) ==============

/**
 * DARPA Kallisti Program (2024): Algorithmic Theory of Mind
 * Models adversary situational awareness and belief states
 */
export interface BasisVector {
  dimension: string;
  weight: number;
  confidence: number;
  lastUpdated: Date;
}

export interface AdversaryMentalModel {
  profileId: string;
  beliefState: Map<string, number>;
  strategyDistribution: Map<string, number>;
  basisVectors: BasisVector[];
  predictionAccuracyHistory: number[];
  deceptionSusceptibility: number;
  situationalAwarenessEstimate: number;
  nonStationaryIndicators: string[];
  modelVersion: string;
  lastCalibratedAt: Date;
}

export interface TheoryOfMindAnalysis {
  adversaryModels: AdversaryMentalModel[];
  beliefDivergences: BeliefDivergence[];
  exploitableBeliefs: string[];
  strategicOpportunities: StrategicOpportunity[];
  modelConfidence: number;
  recalibrationNeeded: boolean;
}

export interface BeliefDivergence {
  topic: string;
  ourBelief: unknown;
  theirBelief: unknown;
  divergenceScore: number;
  exploitabilityScore: number;
  stabilityScore: number; // How stable is their mistaken belief
}

export interface StrategicOpportunity {
  type: 'information_asymmetry' | 'belief_exploitation' | 'timing_advantage' | 'coordination_failure';
  description: string;
  exploitabilityScore: number;
  windowDuration: number; // Hours
  requiredActions: string[];
  risks: string[];
}

// ============== ENHANCED HYPERGAME (v7.0) ==============

export interface HypergameLevel {
  level: number;
  perceiver: string;
  perceivedGame: StrategicInteraction;
  beliefs: Map<string, number>;
}

export interface PerceptionGap {
  dimension: 'game_type' | 'strategy_space' | 'payoffs' | 'player_rationality';
  ourView: unknown;
  theirLikelyView: unknown;
  divergence: number;
  exploitability: number;
  /** v7.0: NATO House Model cognitive effect potential */
  cognitiveEffectPotential?: CognitiveEffectLevel;
  /** v7.0: Reflexive control indicators for this gap */
  reflexiveControlIndicators?: string[];
}

export interface HypergameAnalysis {
  levels: HypergameLevel[];
  perceptionGaps: PerceptionGap[];
  exploitableAsymmetries: string[];
  informationAdvantages: string[];
  informationVulnerabilities: string[];
  optimalDeceptionStrategies: string[];
  /** v7.0: NATO House Model integration */
  cognitiveEffectAnalysis?: CognitiveEffectAnalysis;
  /** v7.0: Reflexive control detection */
  reflexiveControlAnalysis?: ReflexiveControlAnalysis;
  /** v7.0: Kallisti theory of mind */
  theoryOfMindAnalysis?: TheoryOfMindAnalysis;
}

// ============== CORE GAME THEORY FUNCTIONS ==============

/**
 * Analyze a strategic interaction and find optimal strategies
 */
export function analyzeStrategicInteraction(
  players: Player[],
  strategies: string[][],
  payoffs: number[][][]
): StrategicInteraction {
  const gameType = classifyGame(payoffs);
  const dominantStrategies = findDominantStrategies(players, strategies, payoffs);
  const nashEquilibria = findNashEquilibria(players, strategies, payoffs);
  const paretoOptimal = findParetoOptimal(players, strategies, payoffs);
  const mixedEquilibria = findMixedStrategyEquilibria(players, strategies, payoffs);
  
  const recommended = recommendStrategy(
    players[0],
    dominantStrategies,
    nashEquilibria,
    paretoOptimal
  );
  
  return {
    game_type: gameType,
    players,
    strategies_per_player: strategies,
    payoff_matrix: payoffs,
    nash_equilibria: nashEquilibria,
    pareto_optimal_outcomes: paretoOptimal,
    dominant_strategies: dominantStrategies,
    mixed_strategy_equilibria: mixedEquilibria,
    recommended_strategy: recommended.strategy,
    confidence: recommended.confidence,
  };
}

function classifyGame(payoffs: number[][][]): StrategicInteraction['game_type'] {
  if (payoffs.length !== 2 || payoffs[0].length !== 2) return 'custom';
  
  // Check for zero-sum
  let isZeroSum = true;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      if (Math.abs(payoffs[i][j][0] + payoffs[i][j][1]) > 0.01) {
        isZeroSum = false;
        break;
      }
    }
  }
  if (isZeroSum) return 'zero_sum';
  
  // Check for Prisoner's Dilemma pattern
  // Temptation > Reward > Punishment > Sucker
  const cc = payoffs[0][0]; // Cooperate-Cooperate
  const cd = payoffs[0][1]; // Cooperate-Defect
  const dc = payoffs[1][0]; // Defect-Cooperate
  const dd = payoffs[1][1]; // Defect-Defect
  
  if (dc[0] > cc[0] && cc[0] > dd[0] && dd[0] > cd[0]) {
    return 'prisoners_dilemma';
  }
  
  // Check for Chicken/Hawk-Dove
  if (dc[0] > cc[0] && cc[0] > cd[0] && cd[0] > dd[0]) {
    return 'chicken';
  }
  
  // Check for Stag Hunt
  if (cc[0] > dc[0] && dc[0] > dd[0] && dd[0] > cd[0]) {
    return 'stag_hunt';
  }
  
  // Check for coordination game
  if (cc[0] > cd[0] && cc[0] > dc[0] && dd[0] > cd[0] && dd[0] > dc[0]) {
    return 'coordination';
  }
  
  return 'custom';
}

function findDominantStrategies(
  players: Player[],
  strategies: string[][],
  payoffs: number[][][]
): Map<string, string | null> {
  const dominant = new Map<string, string | null>();
  
  for (let p = 0; p < players.length; p++) {
    let dominantStrategy: string | null = null;
    
    for (let s1 = 0; s1 < strategies[p].length; s1++) {
      let isDominant = true;
      
      for (let s2 = 0; s2 < strategies[p].length; s2++) {
        if (s1 === s2) continue;
        
        // Check if s1 dominates s2 against all opponent strategies
        let dominatesInAll = true;
        for (let opp = 0; opp < (p === 0 ? strategies[1]?.length || 1 : strategies[0].length); opp++) {
          const payoff1 = p === 0 ? payoffs[s1]?.[opp]?.[0] || 0 : payoffs[opp]?.[s1]?.[1] || 0;
          const payoff2 = p === 0 ? payoffs[s2]?.[opp]?.[0] || 0 : payoffs[opp]?.[s2]?.[1] || 0;
          
          if (payoff1 <= payoff2) {
            dominatesInAll = false;
            break;
          }
        }
        
        if (!dominatesInAll) {
          isDominant = false;
          break;
        }
      }
      
      if (isDominant) {
        dominantStrategy = strategies[p][s1];
        break;
      }
    }
    
    dominant.set(players[p].id, dominantStrategy);
  }
  
  return dominant;
}

function findNashEquilibria(
  players: Player[],
  strategies: string[][],
  payoffs: number[][][]
): StrategyProfile[] {
  const equilibria: StrategyProfile[] = [];
  
  // For 2-player games
  if (players.length === 2) {
    for (let i = 0; i < strategies[0].length; i++) {
      for (let j = 0; j < strategies[1].length; j++) {
        let isNash = true;
        
        // Check if player 1 can improve by deviating
        for (let i2 = 0; i2 < strategies[0].length; i2++) {
          if (payoffs[i2]?.[j]?.[0] > payoffs[i]?.[j]?.[0]) {
            isNash = false;
            break;
          }
        }
        
        // Check if player 2 can improve by deviating
        if (isNash) {
          for (let j2 = 0; j2 < strategies[1].length; j2++) {
            if (payoffs[i]?.[j2]?.[1] > payoffs[i]?.[j]?.[1]) {
              isNash = false;
              break;
            }
          }
        }
        
        if (isNash) {
          const profile = new Map<string, string>();
          profile.set(players[0].id, strategies[0][i]);
          profile.set(players[1].id, strategies[1][j]);
          
          equilibria.push({
            player_strategies: profile,
            is_nash_equilibrium: true,
            is_pareto_optimal: false, // Will be updated later
            stability_score: 1,
          });
        }
      }
    }
  }
  
  return equilibria;
}

function findParetoOptimal(
  players: Player[],
  strategies: string[][],
  payoffs: number[][][]
): GameOutcome[] {
  const outcomes: GameOutcome[] = [];
  const allOutcomes: { i: number; j: number; payoffs: number[] }[] = [];
  
  // Collect all outcomes
  for (let i = 0; i < strategies[0].length; i++) {
    for (let j = 0; j < (strategies[1]?.length || 1); j++) {
      allOutcomes.push({
        i,
        j,
        payoffs: payoffs[i]?.[j] || [0, 0],
      });
    }
  }
  
  // Find Pareto optimal outcomes
  for (const outcome of allOutcomes) {
    let isPareto = true;
    
    for (const other of allOutcomes) {
      if (outcome === other) continue;
      
      // Check if other dominates outcome
      let allBetterOrEqual = true;
      let atLeastOneBetter = false;
      
      for (let p = 0; p < players.length; p++) {
        if (other.payoffs[p] < outcome.payoffs[p]) {
          allBetterOrEqual = false;
          break;
        }
        if (other.payoffs[p] > outcome.payoffs[p]) {
          atLeastOneBetter = true;
        }
      }
      
      if (allBetterOrEqual && atLeastOneBetter) {
        isPareto = false;
        break;
      }
    }
    
    if (isPareto) {
      const profile = new Map<string, string>();
      profile.set(players[0].id, strategies[0][outcome.i]);
      if (strategies[1]) {
        profile.set(players[1].id, strategies[1][outcome.j]);
      }
      
      const payoffMap = new Map<string, number>();
      payoffMap.set(players[0].id, outcome.payoffs[0]);
      if (players[1]) {
        payoffMap.set(players[1].id, outcome.payoffs[1]);
      }
      
      outcomes.push({
        strategy_profile: {
          player_strategies: profile,
          is_nash_equilibrium: false,
          is_pareto_optimal: true,
          stability_score: 0.8,
        },
        payoffs: payoffMap,
        social_welfare: outcome.payoffs.reduce((a, b) => a + b, 0),
      });
    }
  }
  
  return outcomes;
}

function findMixedStrategyEquilibria(
  players: Player[],
  strategies: string[][],
  payoffs: number[][][]
): MixedStrategy[] {
  const mixed: MixedStrategy[] = [];
  
  // For 2x2 games, calculate mixed strategy equilibrium
  if (players.length === 2 && strategies[0].length === 2 && strategies[1].length === 2) {
    // Calculate p (probability player 1 plays first strategy)
    // Player 2 must be indifferent: p*a + (1-p)*c = p*b + (1-p)*d
    const a = payoffs[0]?.[0]?.[1] || 0;
    const b = payoffs[0]?.[1]?.[1] || 0;
    const c = payoffs[1]?.[0]?.[1] || 0;
    const d = payoffs[1]?.[1]?.[1] || 0;
    
    const denom1 = (a - b - c + d);
    if (Math.abs(denom1) > 0.001) {
      const p = (d - c) / denom1;
      if (p >= 0 && p <= 1) {
        const probs1 = new Map<string, number>();
        probs1.set(strategies[0][0], p);
        probs1.set(strategies[0][1], 1 - p);
        
        mixed.push({
          player_id: players[0].id,
          strategy_probabilities: probs1,
          expected_payoff: p * payoffs[0][0][0] + (1 - p) * payoffs[1][0][0],
        });
      }
    }
    
    // Calculate q (probability player 2 plays first strategy)
    const e = payoffs[0]?.[0]?.[0] || 0;
    const f = payoffs[0]?.[1]?.[0] || 0;
    const g = payoffs[1]?.[0]?.[0] || 0;
    const h = payoffs[1]?.[1]?.[0] || 0;
    
    const denom2 = (e - f - g + h);
    if (Math.abs(denom2) > 0.001) {
      const q = (h - f) / denom2;
      if (q >= 0 && q <= 1) {
        const probs2 = new Map<string, number>();
        probs2.set(strategies[1][0], q);
        probs2.set(strategies[1][1], 1 - q);
        
        mixed.push({
          player_id: players[1].id,
          strategy_probabilities: probs2,
          expected_payoff: q * payoffs[0][0][1] + (1 - q) * payoffs[0][1][1],
        });
      }
    }
  }
  
  return mixed;
}

function recommendStrategy(
  player: Player,
  dominant: Map<string, string | null>,
  nash: StrategyProfile[],
  pareto: GameOutcome[]
): { strategy: string; confidence: number } {
  // Priority: Dominant > Nash & Pareto > Nash > Pareto
  const dominantStrat = dominant.get(player.id);
  if (dominantStrat) {
    return { strategy: dominantStrat, confidence: 0.95 };
  }
  
  // Look for Nash equilibria that are also Pareto optimal
  for (const eq of nash) {
    const strat = eq.player_strategies.get(player.id);
    for (const po of pareto) {
      if (po.strategy_profile.player_strategies.get(player.id) === strat) {
        return { strategy: strat || player.strategies[0], confidence: 0.85 };
      }
    }
  }
  
  // Use first Nash equilibrium
  if (nash.length > 0) {
    return { 
      strategy: nash[0].player_strategies.get(player.id) || player.strategies[0], 
      confidence: 0.7 
    };
  }
  
  // Use Pareto optimal with highest payoff
  if (pareto.length > 0) {
    let best = pareto[0];
    for (const po of pareto) {
      if ((po.payoffs.get(player.id) || 0) > (best.payoffs.get(player.id) || 0)) {
        best = po;
      }
    }
    return { 
      strategy: best.strategy_profile.player_strategies.get(player.id) || player.strategies[0], 
      confidence: 0.5 
    };
  }
  
  return { strategy: player.strategies[0], confidence: 0.3 };
}

/**
 * Model repeated game dynamics
 */
export function analyzeRepeatedGame(
  interaction: StrategicInteraction,
  rounds: number,
  discountFactor: number
): {
  cooperation_sustainable: boolean;
  tit_for_tat_viable: boolean;
  optimal_strategy: string;
  folk_theorem_applies: boolean;
} {
  const isPrisonersDilemma = interaction.game_type === 'prisoners_dilemma';
  
  // Folk theorem: cooperation sustainable if discount factor high enough
  const folkThreshhold = 0.5; // Simplified
  const folkApplies = discountFactor > folkThreshhold && rounds > 10;
  
  return {
    cooperation_sustainable: folkApplies && isPrisonersDilemma,
    tit_for_tat_viable: folkApplies,
    optimal_strategy: folkApplies ? 'tit_for_tat' : interaction.recommended_strategy,
    folk_theorem_applies: folkApplies,
  };
}

// ============== HYPERGAME THEORY (v6.0 + v7.0 ENHANCEMENTS) ==============

/**
 * Analyze hypergame where players have different perceptions of the game
 * Enhanced with NATO House Model and Reflexive Control detection
 */
export function analyzeHypergame(
  ourView: StrategicInteraction,
  theirLikelyView: StrategicInteraction,
  cognitiveProfile: Record<string, number>,
  options?: {
    enableNATOHouseModel?: boolean;
    enableReflexiveControl?: boolean;
    enableTheoryOfMind?: boolean;
  }
): HypergameAnalysis {
  const levels: HypergameLevel[] = [];
  const perceptionGaps: PerceptionGap[] = [];
  const exploitableAsymmetries: string[] = [];
  
  levels.push({
    level: 0,
    perceiver: 'us',
    perceivedGame: ourView,
    beliefs: new Map(),
  });
  
  levels.push({
    level: 1,
    perceiver: 'them',
    perceivedGame: theirLikelyView,
    beliefs: new Map(),
  });
  
  if (ourView.game_type !== theirLikelyView.game_type) {
    const gap: PerceptionGap = {
      dimension: 'game_type',
      ourView: ourView.game_type,
      theirLikelyView: theirLikelyView.game_type,
      divergence: 1.0,
      exploitability: 0.8,
    };
    
    // v7.0: Add cognitive effect potential
    if (options?.enableNATOHouseModel) {
      gap.cognitiveEffectPotential = calculateCognitiveEffectPotential(gap, cognitiveProfile);
    }
    
    perceptionGaps.push(gap);
    exploitableAsymmetries.push(`They think this is ${theirLikelyView.game_type} but it's actually ${ourView.game_type}`);
  }
  
  const ourStrategies = ourView.strategies_per_player[0]?.length || 0;
  const theirViewStrategies = theirLikelyView.strategies_per_player[0]?.length || 0;
  if (ourStrategies !== theirViewStrategies) {
    const gap: PerceptionGap = {
      dimension: 'strategy_space',
      ourView: ourStrategies,
      theirLikelyView: theirViewStrategies,
      divergence: Math.abs(ourStrategies - theirViewStrategies) / Math.max(ourStrategies, theirViewStrategies),
      exploitability: 0.6,
    };
    
    if (options?.enableNATOHouseModel) {
      gap.cognitiveEffectPotential = calculateCognitiveEffectPotential(gap, cognitiveProfile);
    }
    
    perceptionGaps.push(gap);
    exploitableAsymmetries.push('Hidden strategies available that opponent is unaware of');
  }
  
  const biasExploits: string[] = [];
  if (cognitiveProfile.overconfidence > 0.6) {
    biasExploits.push('Exploit overconfidence with unexpected defection');
  }
  if (cognitiveProfile.loss_aversion > 0.7) {
    biasExploits.push('Frame options to emphasize potential losses');
  }
  if (cognitiveProfile.anchoring > 0.5) {
    biasExploits.push('Set initial anchor points to bias negotiations');
  }
  
  const result: HypergameAnalysis = {
    levels,
    perceptionGaps,
    exploitableAsymmetries,
    informationAdvantages: exploitableAsymmetries,
    informationVulnerabilities: [],
    optimalDeceptionStrategies: biasExploits,
  };
  
  // v7.0: Add NATO House Model analysis
  if (options?.enableNATOHouseModel) {
    result.cognitiveEffectAnalysis = analyzeCognitiveEffects(
      theirLikelyView.players[1]?.id || 'target',
      cognitiveProfile,
      perceptionGaps
    );
  }
  
  // v7.0: Add Reflexive Control detection
  if (options?.enableReflexiveControl) {
    result.reflexiveControlAnalysis = detectReflexiveControl(cognitiveProfile, perceptionGaps);
  }
  
  // v7.0: Add Theory of Mind analysis
  if (options?.enableTheoryOfMind) {
    result.theoryOfMindAnalysis = buildTheoryOfMind(
      theirLikelyView.players,
      cognitiveProfile,
      perceptionGaps
    );
  }
  
  return result;
}

/**
 * Calculate perception gap exploitability score
 */
export function calculateGapExploitability(gaps: PerceptionGap[]): number {
  if (gaps.length === 0) return 0;
  
  const weights: Record<string, number> = {
    game_type: 0.4,
    strategy_space: 0.3,
    payoffs: 0.2,
    player_rationality: 0.1,
  };
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const gap of gaps) {
    const weight = weights[gap.dimension] || 0.1;
    totalScore += gap.exploitability * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// ============== NATO HOUSE MODEL FUNCTIONS (v7.0) ==============

/**
 * Calculate cognitive effect potential for a perception gap
 * Based on NATO Chief Scientist 2025 "House Model"
 */
function calculateCognitiveEffectPotential(
  gap: PerceptionGap,
  cognitiveProfile: Record<string, number>
): CognitiveEffectLevel {
  const stressLevel = cognitiveProfile.stress_vulnerability || 0.5;
  const socialInfluence = cognitiveProfile.social_conformity || 0.5;
  const analyticalCapacity = cognitiveProfile.analytical_thinking || 0.5;
  
  // Biological effects: stress, fatigue, arousal manipulation
  const biological = Math.min(1, gap.divergence * stressLevel * 0.8);
  
  // Psychological effects: framing, interpretation manipulation
  const psychological = Math.min(1, gap.exploitability * (1 - analyticalCapacity) * 0.9);
  
  // Social effects: group pressure, legitimacy manipulation
  const social = Math.min(1, gap.divergence * socialInfluence * 0.7);
  
  return { biological, psychological, social };
}

/**
 * Analyze cognitive effects using NATO House Model
 */
export function analyzeCognitiveEffects(
  targetProfile: string,
  cognitiveProfile: Record<string, number>,
  perceptionGaps: PerceptionGap[]
): CognitiveEffectAnalysis {
  // Calculate aggregate effect levels
  const effectLevels: CognitiveEffectLevel = {
    biological: 0,
    psychological: 0,
    social: 0,
  };
  
  for (const gap of perceptionGaps) {
    if (gap.cognitiveEffectPotential) {
      effectLevels.biological = Math.max(effectLevels.biological, gap.cognitiveEffectPotential.biological);
      effectLevels.psychological = Math.max(effectLevels.psychological, gap.cognitiveEffectPotential.psychological);
      effectLevels.social = Math.max(effectLevels.social, gap.cognitiveEffectPotential.social);
    }
  }
  
  // Determine primary attack vector
  let primaryVector: 'biological' | 'psychological' | 'social' = 'psychological';
  if (effectLevels.biological > effectLevels.psychological && effectLevels.biological > effectLevels.social) {
    primaryVector = 'biological';
  } else if (effectLevels.social > effectLevels.psychological) {
    primaryVector = 'social';
  }
  
  // Calculate cascade effects
  const cascadeEffects: CognitiveEffectCascade[] = [
    {
      sourceLevel: 'biological',
      targetLevel: 'psychological',
      mechanism: 'Stress-induced cognitive impairment reduces analytical capacity',
      magnitude: effectLevels.biological * 0.6,
      delay_hours: 2,
    },
    {
      sourceLevel: 'psychological',
      targetLevel: 'social',
      mechanism: 'Framing effects alter perception of group dynamics',
      magnitude: effectLevels.psychological * 0.5,
      delay_hours: 12,
    },
    {
      sourceLevel: 'social',
      targetLevel: 'psychological',
      mechanism: 'Social pressure reinforces narrative acceptance',
      magnitude: effectLevels.social * 0.7,
      delay_hours: 24,
    },
  ];
  
  // Calculate optimal ambiguity window
  const now = new Date();
  const windowStart = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now
  const windowEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours from now
  const optimalMoment = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours optimal
  
  return {
    targetProfile,
    effectLevels,
    primaryAttackVector: primaryVector,
    cascadeEffects,
    ambiguityWindow: {
      start: windowStart,
      end: windowEnd,
      optimalMoment,
    },
    narrativeSynchronization: {
      requiredActors: ['primary_source', 'amplifier_1', 'amplifier_2'],
      messagingTiming: [0, 4, 12, 24], // Hours between releases
      expectedAmplification: 3.5,
    },
    counterMeasures: [
      'Monitor for narrative synchronization across platforms',
      'Establish information verification protocols',
      'Maintain situational awareness briefings',
      'Pre-position counter-narratives',
    ],
    ethicalBoundaries: [
      'No targeting of civilian populations',
      'Maintain proportionality in responses',
      'Preserve attribution capability',
      'Document all operations for review',
    ],
  };
}

// ============== REFLEXIVE CONTROL FUNCTIONS (v7.0) ==============

/**
 * Detect reflexive control attempts
 * Based on CIA Studies in Intelligence Vol. 69 (2025)
 */
export function detectReflexiveControl(
  cognitiveProfile: Record<string, number>,
  perceptionGaps: PerceptionGap[]
): ReflexiveControlAnalysis {
  const indicators: ReflexiveControlIndicator[] = [];
  let activeAttempts = 0;
  
  // Check for motive transmission indicators
  if (cognitiveProfile.external_goal_adoption > 0.6) {
    indicators.push({
      technique: 'motive_transmission',
      confidence: cognitiveProfile.external_goal_adoption,
      evidence: ['Detected adoption of externally-suggested objectives'],
      sourceProfile: 'unknown',
      targetedDecision: 'Strategic priority setting',
      intendedOutcome: 'Redirect resources toward adversary-beneficial goals',
      detectedAt: new Date(),
    });
    activeAttempts++;
  }
  
  // Check for false narrative indicators
  if (cognitiveProfile.narrative_acceptance > 0.7) {
    indicators.push({
      technique: 'false_narrative',
      confidence: cognitiveProfile.narrative_acceptance * 0.8,
      evidence: ['High acceptance of unverified contextual information'],
      sourceProfile: 'unknown',
      targetedDecision: 'Situational assessment',
      intendedOutcome: 'Distort understanding of operational environment',
      detectedAt: new Date(),
    });
    activeAttempts++;
  }
  
  // Check for perception management via gaps
  for (const gap of perceptionGaps) {
    if (gap.divergence > 0.7) {
      indicators.push({
        technique: 'perception_management',
        confidence: gap.divergence,
        evidence: [`Significant perception gap in ${gap.dimension}`],
        sourceProfile: 'unknown',
        targetedDecision: 'Game classification',
        intendedOutcome: 'Induce strategic misperception',
        detectedAt: new Date(),
      });
      activeAttempts++;
    }
  }
  
  // Check for dilemma creation
  if (cognitiveProfile.binary_thinking > 0.6) {
    indicators.push({
      technique: 'dilemma_creation',
      confidence: cognitiveProfile.binary_thinking * 0.9,
      evidence: ['Tendency toward false dichotomy acceptance detected'],
      sourceProfile: 'unknown',
      targetedDecision: 'Option generation',
      intendedOutcome: 'Limit perceived choices to adversary-beneficial options',
      detectedAt: new Date(),
    });
    activeAttempts++;
  }
  
  // Calculate overall risk
  const overallRisk = indicators.length > 0
    ? indicators.reduce((sum, ind) => sum + ind.confidence, 0) / indicators.length
    : 0;
  
  // Generate counter-strategies
  const counterStrategies: CounterReflexiveStrategy[] = [
    {
      name: 'Adversarial Review',
      description: 'Subject all incoming information to structured adversarial analysis',
      applicableTo: ['false_narrative', 'perception_management'],
      effectiveness: 0.75,
      implementationSteps: [
        'Assign devil\'s advocate role in analysis sessions',
        'Challenge underlying assumptions explicitly',
        'Seek disconfirming evidence actively',
      ],
    },
    {
      name: 'Option Expansion',
      description: 'Systematically generate alternatives beyond presented options',
      applicableTo: ['dilemma_creation', 'goal_substitution'],
      effectiveness: 0.8,
      implementationSteps: [
        'Brainstorm options without constraints',
        'Apply "what else could we do?" questioning',
        'Consider hybrid and sequential strategies',
      ],
    },
    {
      name: 'Source Triangulation',
      description: 'Verify information through independent channels',
      applicableTo: ['motive_transmission', 'filter_manipulation'],
      effectiveness: 0.85,
      implementationSteps: [
        'Establish minimum 3 independent sources',
        'Cross-reference with historical patterns',
        'Validate with trusted external parties',
      ],
    },
    {
      name: 'Decision Isolation',
      description: 'Separate decision-making from external influence windows',
      applicableTo: ['pressure_point_activation', 'decision_paralysis_induction'],
      effectiveness: 0.7,
      implementationSteps: [
        'Establish decision deadlines independent of external pressure',
        'Create "cooling off" periods before major decisions',
        'Use pre-committed decision criteria',
      ],
    },
  ];
  
  // Calculate situational awareness score
  const situationalAwarenessScore = 1 - Math.min(1, overallRisk * 1.2);
  
  // Calculate decision integrity score
  const decisionIntegrityScore = indicators.length === 0 
    ? 0.95 
    : Math.max(0.3, 1 - (activeAttempts * 0.15));
  
  return {
    isBeingTargeted: indicators.length > 0,
    overallRisk,
    indicators,
    activeInfluenceAttempts: activeAttempts,
    counterStrategies,
    situationalAwarenessScore,
    decisionIntegrityScore,
  };
}

// ============== KALLISTI THEORY OF MIND FUNCTIONS (v7.0) ==============

/**
 * Build algorithmic theory of mind model
 * Based on DARPA Kallisti Program (2024)
 */
export function buildTheoryOfMind(
  players: Player[],
  cognitiveProfile: Record<string, number>,
  perceptionGaps: PerceptionGap[]
): TheoryOfMindAnalysis {
  const adversaryModels: AdversaryMentalModel[] = [];
  const beliefDivergences: BeliefDivergence[] = [];
  const exploitableBeliefs: string[] = [];
  const strategicOpportunities: StrategicOpportunity[] = [];
  
  // Build mental model for each adversary player
  for (const player of players.filter(p => p.id !== 'us')) {
    const beliefState = new Map<string, number>();
    const strategyDistribution = new Map<string, number>();
    
    // Estimate beliefs based on cognitive profile
    beliefState.set('game_understanding', 1 - (cognitiveProfile.overconfidence || 0.5) * 0.3);
    beliefState.set('opponent_rationality', cognitiveProfile.analytical_thinking || 0.5);
    beliefState.set('information_accuracy', 1 - (perceptionGaps.length * 0.1));
    
    // Estimate strategy distribution
    const rationalWeight = player.rationality_score;
    for (const strat of player.strategies) {
      strategyDistribution.set(strat, 1 / player.strategies.length);
    }
    
    // Build basis vectors (key dimensions of their mental model)
    const basisVectors: BasisVector[] = [
      {
        dimension: 'risk_perception',
        weight: player.risk_tolerance,
        confidence: 0.7,
        lastUpdated: new Date(),
      },
      {
        dimension: 'cooperation_tendency',
        weight: 1 - (cognitiveProfile.competitive || 0.5),
        confidence: 0.6,
        lastUpdated: new Date(),
      },
      {
        dimension: 'time_preference',
        weight: cognitiveProfile.patience || 0.5,
        confidence: 0.65,
        lastUpdated: new Date(),
      },
    ];
    
    adversaryModels.push({
      profileId: player.id,
      beliefState,
      strategyDistribution,
      basisVectors,
      predictionAccuracyHistory: [0.7, 0.72, 0.68, 0.75], // Sample history
      deceptionSusceptibility: cognitiveProfile.gullibility || 0.4,
      situationalAwarenessEstimate: beliefState.get('information_accuracy') || 0.5,
      nonStationaryIndicators: [],
      modelVersion: '1.0',
      lastCalibratedAt: new Date(),
    });
  }
  
  // Identify belief divergences
  for (const gap of perceptionGaps) {
    beliefDivergences.push({
      topic: gap.dimension,
      ourBelief: gap.ourView,
      theirBelief: gap.theirLikelyView,
      divergenceScore: gap.divergence,
      exploitabilityScore: gap.exploitability,
      stabilityScore: 0.7, // How stable is their mistaken belief
    });
    
    if (gap.exploitability > 0.5) {
      exploitableBeliefs.push(`${gap.dimension}: They believe ${JSON.stringify(gap.theirLikelyView)}`);
    }
  }
  
  // Identify strategic opportunities
  if (beliefDivergences.some(d => d.divergenceScore > 0.6)) {
    strategicOpportunities.push({
      type: 'information_asymmetry',
      description: 'Significant belief divergence creates exploitation window',
      exploitabilityScore: 0.8,
      windowDuration: 48,
      requiredActions: [
        'Maintain information advantage',
        'Prepare exploitation strategy',
        'Monitor for belief updates',
      ],
      risks: ['Early detection', 'Belief correction', 'Reputation damage'],
    });
  }
  
  if (adversaryModels.some(m => m.deceptionSusceptibility > 0.6)) {
    strategicOpportunities.push({
      type: 'belief_exploitation',
      description: 'High deception susceptibility enables belief manipulation',
      exploitabilityScore: adversaryModels[0]?.deceptionSusceptibility || 0.6,
      windowDuration: 72,
      requiredActions: [
        'Craft plausible false narrative',
        'Establish credible source channels',
        'Time revelation for maximum impact',
      ],
      risks: ['Attribution risk', 'Escalation potential', 'Alliance damage'],
    });
  }
  
  // Calculate overall model confidence
  const modelConfidence = adversaryModels.length > 0
    ? adversaryModels.reduce((sum, m) => {
        const avgAccuracy = m.predictionAccuracyHistory.reduce((a, b) => a + b, 0) / m.predictionAccuracyHistory.length;
        return sum + avgAccuracy;
      }, 0) / adversaryModels.length
    : 0.5;
  
  return {
    adversaryModels,
    beliefDivergences,
    exploitableBeliefs,
    strategicOpportunities,
    modelConfidence,
    recalibrationNeeded: modelConfidence < 0.6,
  };
}

/**
 * Update adversary mental model with new observations
 */
export function updateMentalModel(
  model: AdversaryMentalModel,
  observedAction: string,
  expectedAction: string
): AdversaryMentalModel {
  const wasCorrect = observedAction === expectedAction;
  
  // Update prediction accuracy history
  const newAccuracy = wasCorrect ? 1 : 0;
  const updatedHistory = [...model.predictionAccuracyHistory, newAccuracy].slice(-10);
  
  // Adjust strategy distribution based on observation
  const newDistribution = new Map(model.strategyDistribution);
  const currentProb = newDistribution.get(observedAction) || 0;
  newDistribution.set(observedAction, Math.min(0.9, currentProb + 0.1));
  
  // Normalize distribution
  const total = Array.from(newDistribution.values()).reduce((a, b) => a + b, 0);
  for (const [key, value] of newDistribution) {
    newDistribution.set(key, value / total);
  }
  
  // Check for non-stationary behavior
  const recentAccuracy = updatedHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const nonStationaryIndicators = [...model.nonStationaryIndicators];
  if (recentAccuracy < 0.5) {
    nonStationaryIndicators.push(`Accuracy drop detected at ${new Date().toISOString()}`);
  }
  
  return {
    ...model,
    strategyDistribution: newDistribution,
    predictionAccuracyHistory: updatedHistory,
    nonStationaryIndicators,
    lastCalibratedAt: new Date(),
  };
}

/**
 * Calculate trust half-life for relationship decay modeling
 * Based on v6.0 relationship-half-life-calculator integration
 */
export function calculateTrustHalfLife(
  relationshipType: string,
  interactionFrequency: number,
  trustLevel: number
): {
  halfLifeDays: number;
  decayRate: number;
  criticalDate: Date;
  reinforcementNeeded: boolean;
} {
  // Base half-lives by relationship type (days)
  const baseHalfLives: Record<string, number> = {
    'strategic_asset': 7,
    'operational_contact': 14,
    'professional': 21,
    'personal': 30,
    'family': 90,
    'dormant': 5,
  };
  
  const baseHalfLife = baseHalfLives[relationshipType] || 14;
  
  // Adjust based on interaction frequency (higher = longer half-life)
  const frequencyMultiplier = 1 + (interactionFrequency * 0.5);
  
  // Adjust based on trust level (higher = longer half-life)
  const trustMultiplier = 0.5 + (trustLevel * 0.5);
  
  const adjustedHalfLife = baseHalfLife * frequencyMultiplier * trustMultiplier;
  
  // Calculate decay rate: k = ln(2) / half-life
  const decayRate = Math.LN2 / adjustedHalfLife;
  
  // Calculate critical date (when trust drops below 50%)
  const criticalDate = new Date();
  criticalDate.setDate(criticalDate.getDate() + adjustedHalfLife);
  
  // Determine if reinforcement is needed
  const daysRemaining = adjustedHalfLife;
  const reinforcementNeeded = daysRemaining < baseHalfLife * 0.5;
  
  return {
    halfLifeDays: adjustedHalfLife,
    decayRate,
    criticalDate,
    reinforcementNeeded,
  };
}

/**
 * Project trust decay over time using exponential model
 * T(t) = T₀ × (0.5)^(t/h)
 */
export function projectTrustDecay(
  initialTrust: number,
  halfLifeDays: number,
  projectionDays: number
): { day: number; trust: number }[] {
  const projection: { day: number; trust: number }[] = [];
  
  for (let day = 0; day <= projectionDays; day++) {
    const trust = initialTrust * Math.pow(0.5, day / halfLifeDays);
    projection.push({ day, trust: Math.max(0, trust) });
  }
  
  return projection;
}
