/**
 * Game Theory Engine
 * Strategic interaction modeling and optimization
 */

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
