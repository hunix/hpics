/**
 * Digital Twin Entity
 * 
 * Represents a behavioral digital twin model for a profile.
 */

import { AggregateRoot, ConfidenceScore, ProfileId } from '@/domains/shared';

export interface BehaviorPattern {
  patternType: string;
  frequency: number;
  confidence: number;
  lastObserved: Date;
  contexts: string[];
}

export interface SimulationScenario {
  scenarioId: string;
  name: string;
  conditions: Record<string, unknown>;
  predictedOutcome: string;
  probability: number;
  timestamp: Date;
}

export interface TwinMetrics {
  accuracy: number;
  calibrationScore: number;
  predictionCount: number;
  correctPredictions: number;
  lastCalibrated: Date;
}

export class DigitalTwin extends AggregateRoot<string> {
  private _profileId: ProfileId;
  private _userId: string;
  private _twinVersion: string;
  private _behaviorPatterns: BehaviorPattern[];
  private _simulationHistory: SimulationScenario[];
  private _metrics: TwinMetrics;
  private _modelState: Record<string, unknown>;
  private _isActive: boolean;

  constructor(
    id: string,
    profileId: string,
    userId: string,
    twinVersion: string = '1.0.0',
    behaviorPatterns: BehaviorPattern[] = [],
    simulationHistory: SimulationScenario[] = [],
    metrics?: TwinMetrics,
    modelState: Record<string, unknown> = {},
    isActive: boolean = true,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._profileId = ProfileId.create(profileId);
    this._userId = userId;
    this._twinVersion = twinVersion;
    this._behaviorPatterns = behaviorPatterns;
    this._simulationHistory = simulationHistory;
    this._metrics = metrics || {
      accuracy: 0,
      calibrationScore: 0,
      predictionCount: 0,
      correctPredictions: 0,
      lastCalibrated: new Date(),
    };
    this._modelState = modelState;
    this._isActive = isActive;
  }

  // Getters
  get profileId(): string {
    return this._profileId.value;
  }

  get userId(): string {
    return this._userId;
  }

  get twinVersion(): string {
    return this._twinVersion;
  }

  get behaviorPatterns(): readonly BehaviorPattern[] {
    return [...this._behaviorPatterns];
  }

  get simulationHistory(): readonly SimulationScenario[] {
    return [...this._simulationHistory];
  }

  get metrics(): TwinMetrics {
    return { ...this._metrics };
  }

  get modelState(): Record<string, unknown> {
    return { ...this._modelState };
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get accuracy(): number {
    return this._metrics.accuracy;
  }

  // Domain Methods

  /**
   * Add a new behavior pattern
   */
  addBehaviorPattern(pattern: Omit<BehaviorPattern, 'lastObserved'>): void {
    const existing = this._behaviorPatterns.findIndex(
      p => p.patternType === pattern.patternType
    );

    if (existing >= 0) {
      this._behaviorPatterns[existing] = {
        ...pattern,
        lastObserved: new Date(),
      };
    } else {
      this._behaviorPatterns.push({
        ...pattern,
        lastObserved: new Date(),
      });
    }
    this.markUpdated();
  }

  /**
   * Run a simulation scenario
   */
  runSimulation(
    name: string,
    conditions: Record<string, unknown>,
    predictedOutcome: string,
    probability: number
  ): SimulationScenario {
    const scenario: SimulationScenario = {
      scenarioId: crypto.randomUUID(),
      name,
      conditions,
      predictedOutcome,
      probability,
      timestamp: new Date(),
    };

    this._simulationHistory.push(scenario);
    this._metrics.predictionCount++;
    this.markUpdated();

    return scenario;
  }

  /**
   * Record a prediction outcome
   */
  recordOutcome(scenarioId: string, wasCorrect: boolean): void {
    if (wasCorrect) {
      this._metrics.correctPredictions++;
    }
    this._metrics.accuracy = 
      this._metrics.predictionCount > 0
        ? this._metrics.correctPredictions / this._metrics.predictionCount
        : 0;
    this.markUpdated();
  }

  /**
   * Calibrate the twin model
   */
  calibrate(newCalibrationScore: number): void {
    this._metrics.calibrationScore = newCalibrationScore;
    this._metrics.lastCalibrated = new Date();
    this.markUpdated();
  }

  /**
   * Update model state
   */
  updateModelState(updates: Record<string, unknown>): void {
    this._modelState = { ...this._modelState, ...updates };
    this.markUpdated();
  }

  /**
   * Deactivate the twin
   */
  deactivate(): void {
    this._isActive = false;
    this.markUpdated();
  }

  /**
   * Reactivate the twin
   */
  activate(): void {
    this._isActive = true;
    this.markUpdated();
  }

  /**
   * Get top behavior patterns by confidence
   */
  getTopPatterns(limit: number = 5): BehaviorPattern[] {
    return [...this._behaviorPatterns]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Get recent simulations
   */
  getRecentSimulations(limit: number = 10): SimulationScenario[] {
    return [...this._simulationHistory]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Check if the twin needs recalibration
   */
  needsRecalibration(maxDaysStale: number = 7): boolean {
    const daysSinceCalibration = 
      (Date.now() - this._metrics.lastCalibrated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCalibration > maxDaysStale || this._metrics.calibrationScore < 0.6;
  }

  /**
   * Serialize to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      profileId: this.profileId,
      userId: this.userId,
      twinVersion: this.twinVersion,
      behaviorPatterns: [...this.behaviorPatterns],
      simulationHistory: [...this.simulationHistory],
      metrics: this.metrics,
      modelState: this.modelState,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
