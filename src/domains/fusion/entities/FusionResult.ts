/**
 * Fusion Result Entity
 * 
 * Represents the output of a data fusion operation.
 */

import { AggregateRoot, ConfidenceScore, Timestamp, ProfileId } from '@/domains/shared';

export type FusionEngineType = 
  | 'temporal-fusion-transformer'
  | 'behavioral-digital-twin'
  | 'graph-rag'
  | 'shadow-network'
  | 'dempster-shafer'
  | 'counterfactual'
  | 'pattern-of-life'
  | 'entity-resolution'
  | 'sentiment-cascade';

export interface FusionMetrics {
  processingTimeMs: number;
  dataSourcesUsed: number;
  conflictsResolved: number;
  uncertaintyReduction: number;
}

export interface FusionPayload {
  [key: string]: unknown;
}

export class FusionResult extends AggregateRoot<string> {
  private _profileId: ProfileId;
  private _userId: string;
  private _engineType: FusionEngineType;
  private _confidence: ConfidenceScore;
  private _payload: FusionPayload;
  private _metrics: FusionMetrics;
  private _inputSources: string[];
  private _processingVersion: string;

  constructor(
    id: string,
    profileId: string,
    userId: string,
    engineType: FusionEngineType,
    confidence: number,
    payload: FusionPayload,
    metrics: FusionMetrics,
    inputSources: string[] = [],
    processingVersion: string = '1.0.0',
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._profileId = ProfileId.create(profileId);
    this._userId = userId;
    this._engineType = engineType;
    this._confidence = ConfidenceScore.create(confidence);
    this._payload = payload;
    this._metrics = metrics;
    this._inputSources = inputSources;
    this._processingVersion = processingVersion;
  }

  // Getters
  get profileId(): string {
    return this._profileId.value;
  }

  get userId(): string {
    return this._userId;
  }

  get engineType(): FusionEngineType {
    return this._engineType;
  }

  get confidence(): ConfidenceScore {
    return this._confidence;
  }

  get confidenceValue(): number {
    return this._confidence.value;
  }

  get payload(): FusionPayload {
    return { ...this._payload };
  }

  get metrics(): FusionMetrics {
    return { ...this._metrics };
  }

  get inputSources(): readonly string[] {
    return [...this._inputSources];
  }

  get processingVersion(): string {
    return this._processingVersion;
  }

  // Domain Methods

  /**
   * Check if the fusion result is high quality
   */
  isHighQuality(threshold: number = 0.7): boolean {
    return this._confidence.isAbove(threshold);
  }

  /**
   * Check if the result is stale
   */
  isStale(maxAgeHours: number = 24): boolean {
    const now = Timestamp.now();
    const created = Timestamp.create(this.createdAt);
    return now.diffInHours(created) > maxAgeHours;
  }

  /**
   * Get a summary of the fusion result
   */
  getSummary(): string {
    return `${this._engineType} fusion (${this._confidence.level} confidence) - ${this._inputSources.length} sources`;
  }

  /**
   * Update the payload with new data
   */
  updatePayload(newPayload: FusionPayload, newConfidence?: number): void {
    this._payload = { ...this._payload, ...newPayload };
    if (newConfidence !== undefined) {
      this._confidence = ConfidenceScore.create(newConfidence);
    }
    this.markUpdated();
  }

  /**
   * Add an input source
   */
  addInputSource(source: string): void {
    if (!this._inputSources.includes(source)) {
      this._inputSources.push(source);
      this.markUpdated();
    }
  }

  /**
   * Serialize to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      profileId: this.profileId,
      userId: this.userId,
      engineType: this.engineType,
      confidence: this.confidenceValue,
      payload: this.payload,
      metrics: this.metrics,
      inputSources: [...this.inputSources],
      processingVersion: this.processingVersion,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
