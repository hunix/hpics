/**
 * Quantum Game Simulator Engine (v9.0)
 * 
 * Implements quantum-like decision models for strategic interactions.
 * Based on EWL/Meyer schemes and quantum cognition frameworks.
 * 
 * @version 9.0
 */

export interface QuantumState {
  amplitudes: Complex[];
  basis: string[];
  dimension: number;
}

export interface Complex {
  real: number;
  imaginary: number;
}

export interface QuantumPlayer {
  id: string;
  name: string;
  strategy: QuantumState;
  entangledWith: string[];
  measurementBasis: string[];
}

export interface QuantumGame {
  players: QuantumPlayer[];
  initialState: QuantumState;
  payoffOperator: PayoffOperator;
  entanglementLevel: number; // 0-1, degree of player entanglement
}

export interface PayoffOperator {
  matrix: number[][];
  isHermitian: boolean;
}

export interface QuantumStrategy {
  playerId: string;
  unitary: UnitaryOperator;
  expectedPayoff: number;
  classicalEquivalent: string;
}

export interface UnitaryOperator {
  theta: number;  // Rotation angle
  phi: number;    // Phase angle
  matrix: Complex[][];
}

export interface MiracleMove {
  name: string;
  description: string;
  probability: number;
  classicallyImpossible: boolean;
  quantumAdvantage: number;
}

export interface QuantumGameResult {
  game: QuantumGame;
  optimalStrategies: QuantumStrategy[];
  quantumEquilibrium: QuantumEquilibrium;
  miracleMoves: MiracleMove[];
  classicalComparison: ClassicalComparison;
}

export interface QuantumEquilibrium {
  strategies: Record<string, UnitaryOperator>;
  isNash: boolean;
  isQuantumAdvantaged: boolean;
  stability: number;
}

export interface ClassicalComparison {
  classicalPayoff: number;
  quantumPayoff: number;
  advantage: number;
  advantageRatio: number;
}

// Complex number operations
export function complexAdd(a: Complex, b: Complex): Complex {
  return { real: a.real + b.real, imaginary: a.imaginary + b.imaginary };
}

export function complexMultiply(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imaginary * b.imaginary,
    imaginary: a.real * b.imaginary + a.imaginary * b.real,
  };
}

export function complexConjugate(a: Complex): Complex {
  return { real: a.real, imaginary: -a.imaginary };
}

export function complexMagnitude(a: Complex): number {
  return Math.sqrt(a.real * a.real + a.imaginary * a.imaginary);
}

/**
 * Create identity matrix of given dimension
 */
function createIdentity(dim: number): Complex[][] {
  const matrix: Complex[][] = [];
  for (let i = 0; i < dim; i++) {
    matrix[i] = [];
    for (let j = 0; j < dim; j++) {
      matrix[i][j] = { real: i === j ? 1 : 0, imaginary: 0 };
    }
  }
  return matrix;
}

/**
 * Create a unitary rotation operator
 */
export function createUnitary(theta: number, phi: number): UnitaryOperator {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  const expPhi: Complex = { real: Math.cos(phi), imaginary: Math.sin(phi) };
  const expMinusPhi: Complex = { real: Math.cos(-phi), imaginary: Math.sin(-phi) };
  
  return {
    theta,
    phi,
    matrix: [
      [{ real: cos, imaginary: 0 }, complexMultiply(expMinusPhi, { real: sin, imaginary: 0 })],
      [complexMultiply(expPhi, { real: -sin, imaginary: 0 }), { real: cos, imaginary: 0 }],
    ],
  };
}

/**
 * Apply unitary operator to quantum state
 */
export function applyUnitary(state: QuantumState, unitary: UnitaryOperator): QuantumState {
  const newAmplitudes: Complex[] = [];
  
  for (let i = 0; i < state.dimension; i++) {
    let newAmp: Complex = { real: 0, imaginary: 0 };
    for (let j = 0; j < state.dimension; j++) {
      const element = unitary.matrix[i]?.[j] || { real: 0, imaginary: 0 };
      newAmp = complexAdd(newAmp, complexMultiply(element, state.amplitudes[j]));
    }
    newAmplitudes.push(newAmp);
  }
  
  return {
    ...state,
    amplitudes: newAmplitudes,
  };
}

/**
 * Calculate probability of measurement outcome
 */
export function measureProbability(state: QuantumState, basisIndex: number): number {
  const amplitude = state.amplitudes[basisIndex] || { real: 0, imaginary: 0 };
  return amplitude.real * amplitude.real + amplitude.imaginary * amplitude.imaginary;
}

/**
 * Create initial entangled state for game
 */
export function createEntangledState(
  players: QuantumPlayer[],
  entanglementLevel: number
): QuantumState {
  // Bell-like state with adjustable entanglement
  const gamma = Math.acos(Math.sqrt(1 - entanglementLevel));
  
  const dimension = Math.pow(2, players.length);
  const amplitudes: Complex[] = new Array(dimension).fill({ real: 0, imaginary: 0 });
  
  // Maximally entangled state: |00...0> + |11...1>
  amplitudes[0] = { real: Math.cos(gamma), imaginary: 0 };
  amplitudes[dimension - 1] = { real: Math.sin(gamma), imaginary: 0 };
  
  return {
    amplitudes,
    basis: generateBasis(players.length),
    dimension,
  };
}

/**
 * Generate computational basis labels
 */
function generateBasis(numQubits: number): string[] {
  const basis: string[] = [];
  const numStates = Math.pow(2, numQubits);
  
  for (let i = 0; i < numStates; i++) {
    basis.push(i.toString(2).padStart(numQubits, '0'));
  }
  
  return basis;
}

/**
 * Calculate expected payoff for quantum strategy
 */
export function calculateQuantumPayoff(
  game: QuantumGame,
  playerIndex: number,
  strategies: UnitaryOperator[]
): number {
  let state = game.initialState;
  
  // Apply all player strategies
  for (const strategy of strategies) {
    state = applyUnitary(state, strategy);
  }
  
  // Calculate expected payoff using payoff operator
  let expectedPayoff = 0;
  for (let i = 0; i < state.dimension; i++) {
    const prob = measureProbability(state, i);
    expectedPayoff += prob * game.payoffOperator.matrix[playerIndex][i];
  }
  
  return expectedPayoff;
}

/**
 * Find quantum Nash equilibrium
 */
export function findQuantumEquilibrium(game: QuantumGame): QuantumEquilibrium {
  const strategies: Record<string, UnitaryOperator> = {};
  
  // Start with identity operators
  for (const player of game.players) {
    strategies[player.id] = createUnitary(0, 0);
  }
  
  // Iterative best response
  let stable = false;
  let iterations = 0;
  const maxIterations = 100;
  
  while (!stable && iterations < maxIterations) {
    stable = true;
    
    for (let i = 0; i < game.players.length; i++) {
      const player = game.players[i];
      const currentPayoff = calculateQuantumPayoff(
        game,
        i,
        game.players.map(p => strategies[p.id])
      );
      
      // Search for better strategy
      const bestResponse = findBestQuantumResponse(game, i, strategies);
      const newPayoff = calculateQuantumPayoff(
        game,
        i,
        game.players.map((p, idx) => idx === i ? bestResponse : strategies[p.id])
      );
      
      if (newPayoff > currentPayoff + 0.01) {
        strategies[player.id] = bestResponse;
        stable = false;
      }
    }
    
    iterations++;
  }
  
  // Check if quantum advantaged
  const classicalPayoff = calculateClassicalPayoff(game);
  const quantumPayoff = game.players.map((p, i) => 
    calculateQuantumPayoff(game, i, game.players.map(player => strategies[player.id]))
  );
  
  return {
    strategies,
    isNash: stable,
    isQuantumAdvantaged: quantumPayoff.reduce((a, b) => a + b, 0) > classicalPayoff * game.players.length,
    stability: iterations < maxIterations ? 1 : 0.5,
  };
}

/**
 * Find best quantum response for a player
 */
function findBestQuantumResponse(
  game: QuantumGame,
  playerIndex: number,
  currentStrategies: Record<string, UnitaryOperator>
): UnitaryOperator {
  let bestUnitary = createUnitary(0, 0);
  let bestPayoff = -Infinity;
  
  // Grid search over theta and phi
  const resolution = 10;
  for (let t = 0; t <= resolution; t++) {
    for (let p = 0; p <= resolution; p++) {
      const theta = (t / resolution) * Math.PI;
      const phi = (p / resolution) * 2 * Math.PI;
      const unitary = createUnitary(theta, phi);
      
      const payoff = calculateQuantumPayoff(
        game,
        playerIndex,
        game.players.map((player, idx) => 
          idx === playerIndex ? unitary : currentStrategies[player.id]
        )
      );
      
      if (payoff > bestPayoff) {
        bestPayoff = payoff;
        bestUnitary = unitary;
      }
    }
  }
  
  return bestUnitary;
}

/**
 * Calculate classical Nash payoff for comparison
 */
function calculateClassicalPayoff(game: QuantumGame): number {
  // Assume classical mixed Nash equilibrium payoff is average
  const avgPayoff = game.payoffOperator.matrix[0].reduce((a, b) => a + b, 0) / 
    game.payoffOperator.matrix[0].length;
  return avgPayoff;
}

/**
 * Identify "miracle moves" - quantum strategies with classical impossibility
 */
export function identifyMiracleMoves(game: QuantumGame): MiracleMove[] {
  const miracles: MiracleMove[] = [];
  const equilibrium = findQuantumEquilibrium(game);
  
  // Check for quantum advantage scenarios
  if (equilibrium.isQuantumAdvantaged) {
    miracles.push({
      name: 'Quantum Correlation Exploitation',
      description: 'Using entanglement to achieve correlated outcomes impossible classically',
      probability: 1 - (1 - game.entanglementLevel) * 0.5,
      classicallyImpossible: true,
      quantumAdvantage: game.entanglementLevel * 0.5,
    });
  }
  
  // Check for superposition advantage
  for (const player of game.players) {
    const strategy = equilibrium.strategies[player.id];
    if (strategy.theta > Math.PI / 4 && strategy.theta < 3 * Math.PI / 4) {
      miracles.push({
        name: `${player.name}'s Superposition Strategy`,
        description: 'Playing superposition of classical strategies',
        probability: Math.sin(strategy.theta) * Math.sin(strategy.theta),
        classicallyImpossible: false,
        quantumAdvantage: Math.abs(Math.sin(2 * strategy.theta)) * 0.3,
      });
    }
  }
  
  return miracles;
}

/**
 * Simulate full quantum game
 */
export function simulateQuantumGame(game: QuantumGame): QuantumGameResult {
  const equilibrium = findQuantumEquilibrium(game);
  const miracleMoves = identifyMiracleMoves(game);
  
  // Calculate optimal strategies
  const optimalStrategies: QuantumStrategy[] = game.players.map((player, idx) => ({
    playerId: player.id,
    unitary: equilibrium.strategies[player.id],
    expectedPayoff: calculateQuantumPayoff(
      game,
      idx,
      game.players.map(p => equilibrium.strategies[p.id])
    ),
    classicalEquivalent: getClassicalEquivalent(equilibrium.strategies[player.id]),
  }));
  
  // Classical comparison
  const classicalPayoff = calculateClassicalPayoff(game);
  const quantumPayoff = optimalStrategies.reduce((sum, s) => sum + s.expectedPayoff, 0);
  
  return {
    game,
    optimalStrategies,
    quantumEquilibrium: equilibrium,
    miracleMoves,
    classicalComparison: {
      classicalPayoff,
      quantumPayoff,
      advantage: quantumPayoff - classicalPayoff,
      advantageRatio: classicalPayoff > 0 ? quantumPayoff / classicalPayoff : 1,
    },
  };
}

/**
 * Get classical strategy description from quantum unitary
 */
function getClassicalEquivalent(unitary: UnitaryOperator): string {
  if (unitary.theta < Math.PI / 8) {
    return 'Cooperate';
  } else if (unitary.theta > 7 * Math.PI / 8) {
    return 'Defect';
  } else {
    const cooperateProb = Math.cos(unitary.theta / 2) ** 2;
    return `Mixed (${(cooperateProb * 100).toFixed(0)}% Cooperate)`;
  }
}

/**
 * Create quantum prisoner's dilemma game
 */
export function createQuantumPrisonersDilemma(
  player1: { id: string; name: string },
  player2: { id: string; name: string },
  entanglementLevel: number = 0.9
): QuantumGame {
  const players: QuantumPlayer[] = [
    {
      id: player1.id,
      name: player1.name,
      strategy: { amplitudes: [{ real: 1, imaginary: 0 }, { real: 0, imaginary: 0 }], basis: ['C', 'D'], dimension: 2 },
      entangledWith: [player2.id],
      measurementBasis: ['C', 'D'],
    },
    {
      id: player2.id,
      name: player2.name,
      strategy: { amplitudes: [{ real: 1, imaginary: 0 }, { real: 0, imaginary: 0 }], basis: ['C', 'D'], dimension: 2 },
      entangledWith: [player1.id],
      measurementBasis: ['C', 'D'],
    },
  ];
  
  return {
    players,
    initialState: createEntangledState(players, entanglementLevel),
    payoffOperator: {
      matrix: [
        [3, 0, 5, 1], // Player 1 payoffs for CC, CD, DC, DD
        [3, 5, 0, 1], // Player 2 payoffs for CC, CD, DC, DD
      ],
      isHermitian: true,
    },
    entanglementLevel,
  };
}
