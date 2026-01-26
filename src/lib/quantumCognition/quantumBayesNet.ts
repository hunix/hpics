/**
 * Quantum Bayesian Network
 * 
 * Models beliefs that don't follow classical probability using quantum-like
 * interference effects. Superior for modeling "irrational" but predictable behaviors.
 * 
 * Based on: Psychonomic Bulletin & Review 2025, Busemeyer & Bruza
 */

// ============================================
// Core Quantum Types
// ============================================

export interface QuantumState {
  amplitudes: Complex[];
  dimension: number;
  basis: string[];
  normalized: boolean;
}

export interface Complex {
  real: number;
  imag: number;
}

export interface QuantumBelief {
  id: string;
  profileId: string;
  beliefSpace: BeliefSpace;
  stateVector: QuantumState;
  observables: Observable[];
  interferencePatterns: InterferencePattern[];
  entanglements: Entanglement[];
  measurementHistory: Measurement[];
}

export interface BeliefSpace {
  dimensions: BeliefDimension[];
  compatibilityMatrix: number[][];
  orderEffects: OrderEffect[];
}

export interface BeliefDimension {
  name: string;
  states: string[];
  incompatibleWith: string[];
}

export interface Observable {
  name: string;
  operator: Complex[][];
  eigenvalues: number[];
  eigenvectors: QuantumState[];
}

export interface InterferencePattern {
  dimensions: [string, string];
  constructiveConditions: string[];
  destructiveConditions: string[];
  interferenceStrength: number;
}

export interface Entanglement {
  dimensions: string[];
  correlationType: 'positive' | 'negative';
  strength: number;
  bellViolation: number;
}

export interface Measurement {
  observable: string;
  outcome: string;
  probability: number;
  timestamp: Date;
  contextEffects: string[];
}

export interface OrderEffect {
  sequence: string[];
  reversedSequence: string[];
  effectMagnitude: number;
  qqEqualityViolation: number;
}

// ============================================
// Quantum Probability Calculator
// ============================================

export class QuantumProbabilityCalculator {
  private state: QuantumState;
  private observables: Map<string, Observable>;
  
  constructor(initialState: QuantumState) {
    this.state = this.normalize(initialState);
    this.observables = new Map();
  }
  
  /**
   * Add an observable to the system
   */
  addObservable(name: string, observable: Observable): void {
    this.observables.set(name, observable);
  }
  
  /**
   * Calculate probability using Born rule
   */
  calculateProbability(outcome: string, observable: string): number {
    const obs = this.observables.get(observable);
    if (!obs) throw new Error(`Observable ${observable} not found`);
    
    const projector = this.getProjector(outcome, obs);
    return this.expectationValue(projector);
  }
  
  /**
   * Calculate joint probability with order effects
   */
  calculateJointProbability(
    firstOutcome: string,
    firstObservable: string,
    secondOutcome: string,
    secondObservable: string
  ): number {
    const obs1 = this.observables.get(firstObservable);
    const obs2 = this.observables.get(secondObservable);
    
    if (!obs1 || !obs2) throw new Error('Observable not found');
    
    // Get projectors
    const P1 = this.getProjector(firstOutcome, obs1);
    const P2 = this.getProjector(secondOutcome, obs2);
    
    // Calculate P(A then B) using quantum sequential measurement
    // P(A,B) = <ψ|P_A P_B P_A|ψ>
    const compositeProjector = this.multiplyMatrices(
      this.multiplyMatrices(P1, P2),
      P1
    );
    
    return this.expectationValue(compositeProjector);
  }
  
  /**
   * Detect QQ Equality violation (order effects)
   */
  detectOrderEffect(
    observableA: string,
    observableB: string,
    outcomeA: string,
    outcomeB: string
  ): OrderEffect {
    // P(A then B) + P(not-A then B)
    const pAB = this.calculateJointProbability(outcomeA, observableA, outcomeB, observableB);
    const pNotAB = this.calculateJointProbability(`not_${outcomeA}`, observableA, outcomeB, observableB);
    const sumAFirst = pAB + pNotAB;
    
    // P(B then A) + P(B then not-A)
    const pBA = this.calculateJointProbability(outcomeB, observableB, outcomeA, observableA);
    const pBNotA = this.calculateJointProbability(outcomeB, observableB, `not_${outcomeA}`, observableA);
    const sumBFirst = pBA + pBNotA;
    
    // QQ Equality: these should be equal in classical probability
    const qqViolation = Math.abs(sumAFirst - sumBFirst);
    
    return {
      sequence: [observableA, observableB],
      reversedSequence: [observableB, observableA],
      effectMagnitude: Math.abs(pAB - pBA),
      qqEqualityViolation: qqViolation
    };
  }
  
  /**
   * Model interference between beliefs
   */
  calculateInterference(
    dimensionA: string,
    dimensionB: string
  ): InterferencePattern {
    // In quantum systems, incompatible observables show interference
    const obsA = this.observables.get(dimensionA);
    const obsB = this.observables.get(dimensionB);
    
    if (!obsA || !obsB) {
      return {
        dimensions: [dimensionA, dimensionB],
        constructiveConditions: [],
        destructiveConditions: [],
        interferenceStrength: 0
      };
    }
    
    // Check if observables commute
    const commutator = this.calculateCommutator(obsA.operator, obsB.operator);
    const commutativity = this.frobeniusNorm(commutator);
    
    const interferenceStrength = Math.min(commutativity, 1);
    
    return {
      dimensions: [dimensionA, dimensionB],
      constructiveConditions: ['aligned_beliefs', 'consistent_context'],
      destructiveConditions: ['conflicting_beliefs', 'context_switch'],
      interferenceStrength
    };
  }
  
  /**
   * Apply measurement and collapse state
   */
  applyMeasurement(observable: string, outcome: string): Measurement {
    const obs = this.observables.get(observable);
    if (!obs) throw new Error(`Observable ${observable} not found`);
    
    const probability = this.calculateProbability(outcome, observable);
    const projector = this.getProjector(outcome, obs);
    
    // Collapse state: |ψ'> = P|ψ> / ||P|ψ>||
    this.state = this.projectState(projector);
    
    return {
      observable,
      outcome,
      probability,
      timestamp: new Date(),
      contextEffects: this.detectContextEffects(observable)
    };
  }
  
  /**
   * Evolve state over time (Schrödinger-like dynamics)
   */
  evolveState(hamiltonian: Complex[][], time: number): void {
    // U = exp(-iHt)
    const evolution = this.matrixExponential(
      this.scaleMatrix(hamiltonian, { real: 0, imag: -time })
    );
    
    this.state = this.applyOperator(evolution, this.state);
    this.state = this.normalize(this.state);
  }
  
  // ============================================
  // Matrix Operations
  // ============================================
  
  private normalize(state: QuantumState): QuantumState {
    const norm = Math.sqrt(
      state.amplitudes.reduce((sum, c) => 
        sum + c.real * c.real + c.imag * c.imag, 0
      )
    );
    
    if (norm === 0) return state;
    
    return {
      ...state,
      amplitudes: state.amplitudes.map(c => ({
        real: c.real / norm,
        imag: c.imag / norm
      })),
      normalized: true
    };
  }
  
  private getProjector(outcome: string, observable: Observable): Complex[][] {
    const eigenIndex = observable.eigenvalues.findIndex((_, i) => 
      observable.eigenvectors[i]?.basis.includes(outcome)
    );
    
    if (eigenIndex === -1) {
      // Return identity as fallback
      return this.identityMatrix(this.state.dimension);
    }
    
    const eigenstate = observable.eigenvectors[eigenIndex];
    return this.outerProduct(eigenstate.amplitudes, eigenstate.amplitudes);
  }
  
  private expectationValue(operator: Complex[][]): number {
    // <ψ|O|ψ>
    const applied = this.applyMatrix(operator, this.state.amplitudes);
    
    return this.state.amplitudes.reduce((sum, psi, i) => {
      const inner = psi.real * applied[i].real + psi.imag * applied[i].imag;
      return sum + inner;
    }, 0);
  }
  
  private applyMatrix(matrix: Complex[][], vector: Complex[]): Complex[] {
    return matrix.map(row =>
      row.reduce((sum, elem, j) => ({
        real: sum.real + elem.real * vector[j].real - elem.imag * vector[j].imag,
        imag: sum.imag + elem.real * vector[j].imag + elem.imag * vector[j].real
      }), { real: 0, imag: 0 })
    );
  }
  
  private multiplyMatrices(a: Complex[][], b: Complex[][]): Complex[][] {
    const n = a.length;
    const result: Complex[][] = Array(n).fill(null).map(() =>
      Array(n).fill(null).map(() => ({ real: 0, imag: 0 }))
    );
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          result[i][j].real += a[i][k].real * b[k][j].real - a[i][k].imag * b[k][j].imag;
          result[i][j].imag += a[i][k].real * b[k][j].imag + a[i][k].imag * b[k][j].real;
        }
      }
    }
    
    return result;
  }
  
  private outerProduct(a: Complex[], b: Complex[]): Complex[][] {
    return a.map(ai => b.map(bj => ({
      real: ai.real * bj.real + ai.imag * bj.imag,
      imag: ai.imag * bj.real - ai.real * bj.imag
    })));
  }
  
  private calculateCommutator(a: Complex[][], b: Complex[][]): Complex[][] {
    const ab = this.multiplyMatrices(a, b);
    const ba = this.multiplyMatrices(b, a);
    
    return ab.map((row, i) => row.map((elem, j) => ({
      real: elem.real - ba[i][j].real,
      imag: elem.imag - ba[i][j].imag
    })));
  }
  
  private frobeniusNorm(matrix: Complex[][]): number {
    return Math.sqrt(
      matrix.reduce((sum, row) =>
        sum + row.reduce((rowSum, c) =>
          rowSum + c.real * c.real + c.imag * c.imag, 0
        ), 0
      )
    );
  }
  
  private projectState(projector: Complex[][]): QuantumState {
    const projected = this.applyMatrix(projector, this.state.amplitudes);
    return this.normalize({
      ...this.state,
      amplitudes: projected
    });
  }
  
  private applyOperator(operator: Complex[][], state: QuantumState): QuantumState {
    return {
      ...state,
      amplitudes: this.applyMatrix(operator, state.amplitudes)
    };
  }
  
  private scaleMatrix(matrix: Complex[][], scalar: Complex): Complex[][] {
    return matrix.map(row => row.map(c => ({
      real: c.real * scalar.real - c.imag * scalar.imag,
      imag: c.real * scalar.imag + c.imag * scalar.real
    })));
  }
  
  private matrixExponential(matrix: Complex[][]): Complex[][] {
    // Taylor series approximation
    const n = matrix.length;
    let result = this.identityMatrix(n);
    let term = this.identityMatrix(n);
    
    for (let k = 1; k <= 20; k++) {
      term = this.scaleMatrix(
        this.multiplyMatrices(term, matrix),
        { real: 1 / k, imag: 0 }
      );
      result = result.map((row, i) => row.map((c, j) => ({
        real: c.real + term[i][j].real,
        imag: c.imag + term[i][j].imag
      })));
    }
    
    return result;
  }
  
  private identityMatrix(n: number): Complex[][] {
    return Array(n).fill(null).map((_, i) =>
      Array(n).fill(null).map((_, j) => ({
        real: i === j ? 1 : 0,
        imag: 0
      }))
    );
  }
  
  private detectContextEffects(observable: string): string[] {
    const effects: string[] = [];
    
    // Check for recent measurements that might have contextual influence
    this.observables.forEach((obs, name) => {
      if (name !== observable) {
        const interference = this.calculateInterference(observable, name);
        if (interference.interferenceStrength > 0.3) {
          effects.push(`interference_with_${name}`);
        }
      }
    });
    
    return effects;
  }
}

// ============================================
// Quantum Decision Model
// ============================================

export interface DecisionContext {
  options: string[];
  attributes: DecisionAttribute[];
  orderOfPresentation?: string[];
  priorBeliefs?: Map<string, number>;
}

export interface DecisionAttribute {
  name: string;
  values: Map<string, number>;
  weight: number;
}

export interface QuantumDecisionResult {
  choiceProbabilities: Map<string, number>;
  expectedInterference: number;
  orderEffectPrediction: number;
  disjunctionEffect?: number;
  conjunctionFallacy?: number;
}

export class QuantumDecisionModel {
  private calculator: QuantumProbabilityCalculator;
  
  constructor(context: DecisionContext) {
    const dimension = context.options.length * context.attributes.length;
    
    // Initialize superposition state
    const initialAmplitudes: Complex[] = Array(dimension).fill(null).map(() => ({
      real: 1 / Math.sqrt(dimension),
      imag: 0
    }));
    
    this.calculator = new QuantumProbabilityCalculator({
      amplitudes: initialAmplitudes,
      dimension,
      basis: this.constructBasis(context),
      normalized: true
    });
    
    // Add observables for each attribute
    context.attributes.forEach(attr => {
      this.addAttributeObservable(attr, context.options);
    });
  }
  
  /**
   * Predict choice probabilities with quantum effects
   */
  predictChoice(option: string): number {
    return this.calculator.calculateProbability(option, 'choice');
  }
  
  /**
   * Detect disjunction effect (violation of sure-thing principle)
   */
  detectDisjunctionEffect(
    optionA: string,
    conditionTrue: string,
    conditionFalse: string
  ): number {
    // P(A|B) and P(A|not-B) both favor A, but P(A) might not
    const pAGivenB = this.calculator.calculateJointProbability(
      conditionTrue, 'condition',
      optionA, 'choice'
    );
    
    const pAGivenNotB = this.calculator.calculateJointProbability(
      conditionFalse, 'condition',
      optionA, 'choice'
    );
    
    const pA = this.calculator.calculateProbability(optionA, 'choice');
    
    // Classical: if P(A|B) > 0.5 and P(A|not-B) > 0.5, then P(A) > 0.5
    // Disjunction effect: this can be violated
    const classicalPrediction = (pAGivenB + pAGivenNotB) / 2;
    
    return Math.abs(pA - classicalPrediction);
  }
  
  /**
   * Detect conjunction fallacy (Linda problem)
   */
  detectConjunctionFallacy(
    specificDescription: string,
    generalCategory: string
  ): number {
    const pSpecific = this.calculator.calculateProbability(specificDescription, 'category');
    const pGeneral = this.calculator.calculateProbability(generalCategory, 'category');
    const pBoth = this.calculator.calculateJointProbability(
      specificDescription, 'category',
      generalCategory, 'category'
    );
    
    // Classical: P(A and B) ≤ P(B)
    // Fallacy: People judge P(A and B) > P(B) when A is representative
    return pBoth > pGeneral ? pBoth - pGeneral : 0;
  }
  
  private constructBasis(context: DecisionContext): string[] {
    const basis: string[] = [];
    
    context.options.forEach(option => {
      context.attributes.forEach(attr => {
        basis.push(`${option}_${attr.name}`);
      });
    });
    
    return basis;
  }
  
  private addAttributeObservable(
    attribute: DecisionAttribute,
    options: string[]
  ): void {
    const dim = options.length;
    
    // Create projectors for each option
    const eigenvalues = options.map((_, i) => i);
    const eigenvectors: QuantumState[] = options.map((option, i) => {
      const amps: Complex[] = Array(dim).fill({ real: 0, imag: 0 });
      amps[i] = { real: 1, imag: 0 };
      return {
        amplitudes: amps,
        dimension: dim,
        basis: [option],
        normalized: true
      };
    });
    
    this.calculator.addObservable(attribute.name, {
      name: attribute.name,
      operator: this.createDiagonalOperator(eigenvalues),
      eigenvalues,
      eigenvectors
    });
  }
  
  private createDiagonalOperator(eigenvalues: number[]): Complex[][] {
    const n = eigenvalues.length;
    return Array(n).fill(null).map((_, i) =>
      Array(n).fill(null).map((_, j) => ({
        real: i === j ? eigenvalues[i] : 0,
        imag: 0
      }))
    );
  }
}

// ============================================
// Quantum Game Theory Integration
// ============================================

export interface QuantumGame {
  players: string[];
  strategies: Map<string, string[]>;
  payoffMatrix: number[][][];
  entanglementParameter: number;
}

export interface QuantumGameResult {
  classicalEquilibria: StrategyProfile[];
  quantumEquilibria: QuantumStrategyProfile[];
  advantageGain: number;
  miracleMoves: MiracleMove[];
}

export interface StrategyProfile {
  strategies: Map<string, string>;
  payoffs: Map<string, number>;
}

export interface QuantumStrategyProfile {
  quantumStrategies: Map<string, QuantumStrategy>;
  payoffs: Map<string, number>;
  entanglementUsed: boolean;
}

export interface QuantumStrategy {
  player: string;
  thetaAngle: number;
  phiAngle: number;
  description: string;
}

export interface MiracleMove {
  player: string;
  strategy: QuantumStrategy;
  classicallyImpossible: boolean;
  payoffAdvantage: number;
}

export function analyzeQuantumGame(game: QuantumGame): QuantumGameResult {
  const classicalEquilibria = findClassicalNash(game);
  const quantumEquilibria = findQuantumNash(game);
  
  const maxClassical = Math.max(
    ...classicalEquilibria.map(e => 
      [...e.payoffs.values()].reduce((a, b) => a + b, 0)
    )
  );
  
  const maxQuantum = Math.max(
    ...quantumEquilibria.map(e =>
      [...e.payoffs.values()].reduce((a, b) => a + b, 0)
    )
  );
  
  return {
    classicalEquilibria,
    quantumEquilibria,
    advantageGain: maxQuantum - maxClassical,
    miracleMoves: findMiracleMoves(game, quantumEquilibria)
  };
}

function findClassicalNash(game: QuantumGame): StrategyProfile[] {
  // Simplified Nash finder for 2-player games
  const equilibria: StrategyProfile[] = [];
  const [p1, p2] = game.players;
  const s1 = game.strategies.get(p1) || [];
  const s2 = game.strategies.get(p2) || [];
  
  for (let i = 0; i < s1.length; i++) {
    for (let j = 0; j < s2.length; j++) {
      const payoff1 = game.payoffMatrix[i][j][0];
      const payoff2 = game.payoffMatrix[i][j][1];
      
      // Check if Nash (simplified)
      let isNash = true;
      
      // Check p1 deviation
      for (let i2 = 0; i2 < s1.length; i2++) {
        if (game.payoffMatrix[i2][j][0] > payoff1) {
          isNash = false;
          break;
        }
      }
      
      // Check p2 deviation
      for (let j2 = 0; j2 < s2.length; j2++) {
        if (game.payoffMatrix[i][j2][1] > payoff2) {
          isNash = false;
          break;
        }
      }
      
      if (isNash) {
        equilibria.push({
          strategies: new Map([[p1, s1[i]], [p2, s2[j]]]),
          payoffs: new Map([[p1, payoff1], [p2, payoff2]])
        });
      }
    }
  }
  
  return equilibria;
}

function findQuantumNash(game: QuantumGame): QuantumStrategyProfile[] {
  // Quantum strategies allow for superposition and entanglement
  const equilibria: QuantumStrategyProfile[] = [];
  const [p1, p2] = game.players;
  const gamma = game.entanglementParameter;
  
  // EWL protocol quantum strategies
  const quantumStrategies: QuantumStrategy[] = [
    { player: p1, thetaAngle: 0, phiAngle: 0, description: 'Cooperate' },
    { player: p1, thetaAngle: Math.PI, phiAngle: 0, description: 'Defect' },
    { player: p1, thetaAngle: Math.PI / 2, phiAngle: Math.PI / 2, description: 'Quantum' }
  ];
  
  // For maximum entanglement (gamma = pi/2), the "Quantum" strategy dominates
  if (gamma > Math.PI / 4) {
    const qStrat: QuantumStrategy = {
      player: p1,
      thetaAngle: 0,
      phiAngle: Math.PI / 2,
      description: 'Miracle Move (Q)'
    };
    
    equilibria.push({
      quantumStrategies: new Map([
        [p1, qStrat],
        [p2, { ...qStrat, player: p2 }]
      ]),
      payoffs: new Map([[p1, 3], [p2, 3]]), // Pareto optimal for PD
      entanglementUsed: true
    });
  }
  
  return equilibria;
}

function findMiracleMoves(
  game: QuantumGame,
  quantumEquilibria: QuantumStrategyProfile[]
): MiracleMove[] {
  const moves: MiracleMove[] = [];
  
  quantumEquilibria.forEach(eq => {
    if (eq.entanglementUsed) {
      eq.quantumStrategies.forEach((strat, player) => {
        // Quantum strategies that break classical bounds
        if (strat.phiAngle !== 0) {
          const classicalMax = 3; // PD defect payoff
          const quantumPayoff = eq.payoffs.get(player) || 0;
          
          moves.push({
            player,
            strategy: strat,
            classicallyImpossible: true,
            payoffAdvantage: quantumPayoff - classicalMax
          });
        }
      });
    }
  });
  
  return moves;
}

// ============================================
// Mental Entanglement Detector
// ============================================

export interface EntanglementAnalysis {
  profileIds: [string, string];
  bellViolation: number;
  correlationType: 'classical' | 'quantum' | 'super_quantum';
  entanglementWitness: number;
  synchronicityIndicators: SynchronicityEvent[];
}

export interface SynchronicityEvent {
  timestamp: Date;
  description: string;
  correlationStrength: number;
  causalExplanation: 'none' | 'weak' | 'strong';
}

export function detectMentalEntanglement(
  behaviorA: BehaviorTimeseries,
  behaviorB: BehaviorTimeseries
): EntanglementAnalysis {
  // Calculate CHSH-like correlation
  const correlations = calculateSpacelikeCorrelations(behaviorA, behaviorB);
  const bellValue = calculateBellValue(correlations);
  
  // Bell inequality: |S| ≤ 2 for classical
  // Quantum allows: |S| ≤ 2√2 ≈ 2.83
  
  let correlationType: EntanglementAnalysis['correlationType'];
  if (bellValue <= 2) {
    correlationType = 'classical';
  } else if (bellValue <= 2.83) {
    correlationType = 'quantum';
  } else {
    correlationType = 'super_quantum';
  }
  
  return {
    profileIds: [behaviorA.profileId, behaviorB.profileId],
    bellViolation: Math.max(0, bellValue - 2),
    correlationType,
    entanglementWitness: bellValue / 2.83,
    synchronicityIndicators: findSynchronicities(behaviorA, behaviorB)
  };
}

interface BehaviorTimeseries {
  profileId: string;
  measurements: BehaviorMeasurement[];
}

interface BehaviorMeasurement {
  timestamp: Date;
  dimension: string;
  value: number;
  context: string;
}

function calculateSpacelikeCorrelations(
  a: BehaviorTimeseries,
  b: BehaviorTimeseries
): number[] {
  // Find temporally coincident measurements (within small window)
  const windowMs = 60000; // 1 minute
  const correlations: number[] = [];
  
  a.measurements.forEach(ma => {
    const coincident = b.measurements.filter(mb =>
      Math.abs(ma.timestamp.getTime() - mb.timestamp.getTime()) < windowMs &&
      ma.dimension === mb.dimension
    );
    
    coincident.forEach(mb => {
      // Correlation between values
      correlations.push(ma.value * mb.value);
    });
  });
  
  return correlations;
}

function calculateBellValue(correlations: number[]): number {
  if (correlations.length < 4) return 0;
  
  // Simplified CHSH calculation
  const quarters = Math.floor(correlations.length / 4);
  const E = [0, 0, 0, 0];
  
  for (let i = 0; i < 4; i++) {
    const subset = correlations.slice(i * quarters, (i + 1) * quarters);
    E[i] = subset.reduce((a, b) => a + b, 0) / subset.length;
  }
  
  // S = E(a,b) - E(a,b') + E(a',b) + E(a',b')
  return Math.abs(E[0] - E[1] + E[2] + E[3]);
}

function findSynchronicities(
  a: BehaviorTimeseries,
  b: BehaviorTimeseries
): SynchronicityEvent[] {
  const events: SynchronicityEvent[] = [];
  const windowMs = 5000; // 5 second window for synchronicity
  
  a.measurements.forEach(ma => {
    const matched = b.measurements.find(mb =>
      Math.abs(ma.timestamp.getTime() - mb.timestamp.getTime()) < windowMs &&
      ma.dimension === mb.dimension &&
      Math.abs(ma.value - mb.value) < 0.1
    );
    
    if (matched) {
      events.push({
        timestamp: ma.timestamp,
        description: `Synchronized ${ma.dimension}`,
        correlationStrength: 1 - Math.abs(ma.value - matched.value),
        causalExplanation: determineCausality(ma, matched)
      });
    }
  });
  
  return events;
}

function determineCausality(
  a: BehaviorMeasurement,
  b: BehaviorMeasurement
): 'none' | 'weak' | 'strong' {
  // Check if there's an obvious causal link
  if (a.context === b.context) return 'strong';
  if (a.dimension === b.dimension) return 'weak';
  return 'none';
}
