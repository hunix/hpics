/**
 * Game Theory Suite Index (v9.0)
 * 
 * Centralized exports for advanced strategic modeling engines.
 * 
 * @version 9.0
 */

// Hypergame Engine - Level-N belief modeling
export {
  computeLevelKStrategy,
  detectPerceptionGaps,
  computeHNE,
  identifyExploitableAsymmetries,
  analyzeHypergame,
  updateBeliefState,
  type Player,
  type GameMatrix,
  type PerceptionGap,
  type HypergameNashEquilibrium,
  type HypergameAnalysis,
  type ExploitableAsymmetry,
  type BeliefState,
} from './hypergameEngine';

// Bayesian Persuader - Optimal information disclosure
export {
  calculatePosterior,
  calculateExpectedUtility,
  getOptimalAction,
  designOptimalSignals,
  designSequentialStrategy,
  calculateOptimalTiming,
  analyzePersuasion,
  type ReceiverType,
  type Signal,
  type SignalStructure,
  type PersuasionStrategy,
  type TrustConstraint,
  type PersuasionAnalysis,
} from './bayesianPersuader';

// Quantum Game Simulator - Quantum-like decision models
export {
  createUnitary,
  applyUnitary,
  measureProbability,
  createEntangledState,
  calculateQuantumPayoff,
  findQuantumEquilibrium,
  identifyMiracleMoves,
  simulateQuantumGame,
  createQuantumPrisonersDilemma,
  complexAdd,
  complexMultiply,
  complexConjugate,
  complexMagnitude,
  type QuantumState,
  type Complex,
  type QuantumPlayer,
  type QuantumGame,
  type PayoffOperator,
  type QuantumStrategy,
  type UnitaryOperator,
  type MiracleMove,
  type QuantumGameResult,
  type QuantumEquilibrium,
  type ClassicalComparison,
} from './quantumGameSimulator';
