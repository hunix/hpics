/**
 * Analysis Entity
 * 
 * Represents an AI-generated analysis for a profile.
 */

import { AggregateRoot, ConfidenceScore, ProfileId, Timestamp } from '@/domains/shared';

export type AnalysisType = 
  | 'behavioral'
  | 'psychological'
  | 'communication'
  | 'network'
  | 'biometric'
  | 'voice'
  | 'facial'
  | 'document'
  | 'comprehensive';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalysisResult {
  summary: string;
  insights: string[];
  riskFactors: string[];
  recommendations: string[];
  rawData: Record<string, unknown>;
}

export interface AnalysisMetadata {
  modelUsed: string;
  tokensConsumed: number;
  costCents: number;
  processingTimeMs: number;
  sourceCount: number;
}

export class Analysis extends AggregateRoot<string> {
  private _profileId: ProfileId;
  private _userId: string;
  private _analysisType: AnalysisType;
  private _status: AnalysisStatus;
  private _confidence: ConfidenceScore;
  private _result: AnalysisResult | null;
  private _metadata: AnalysisMetadata | null;
  private _sourceIds: string[];
  private _errorMessage: string | null;
  private _completedAt: Date | null;

  constructor(
    id: string,
    profileId: string,
    userId: string,
    analysisType: AnalysisType,
    status: AnalysisStatus = 'pending',
    confidence: number = 0,
    result: AnalysisResult | null = null,
    metadata: AnalysisMetadata | null = null,
    sourceIds: string[] = [],
    errorMessage: string | null = null,
    completedAt: Date | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._profileId = ProfileId.create(profileId);
    this._userId = userId;
    this._analysisType = analysisType;
    this._status = status;
    this._confidence = ConfidenceScore.create(Math.max(0, Math.min(1, confidence)));
    this._result = result;
    this._metadata = metadata;
    this._sourceIds = sourceIds;
    this._errorMessage = errorMessage;
    this._completedAt = completedAt;
  }

  // Getters
  get profileId(): string { return this._profileId.value; }
  get userId(): string { return this._userId; }
  get analysisType(): AnalysisType { return this._analysisType; }
  get status(): AnalysisStatus { return this._status; }
  get confidence(): ConfidenceScore { return this._confidence; }
  get confidenceValue(): number { return this._confidence.value; }
  get result(): AnalysisResult | null { return this._result ? { ...this._result } : null; }
  get metadata(): AnalysisMetadata | null { return this._metadata ? { ...this._metadata } : null; }
  get sourceIds(): readonly string[] { return [...this._sourceIds]; }
  get errorMessage(): string | null { return this._errorMessage; }
  get completedAt(): Date | null { return this._completedAt; }

  // Domain Methods

  /**
   * Start processing the analysis
   */
  startProcessing(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot start processing: analysis is ${this._status}`);
    }
    this._status = 'processing';
    this.markUpdated();
  }

  /**
   * Complete the analysis with results
   */
  complete(result: AnalysisResult, confidence: number, metadata: AnalysisMetadata): void {
    this._status = 'completed';
    this._result = result;
    this._confidence = ConfidenceScore.create(confidence);
    this._metadata = metadata;
    this._completedAt = new Date();
    this._errorMessage = null;
    this.markUpdated();
  }

  /**
   * Mark the analysis as failed
   */
  fail(errorMessage: string): void {
    this._status = 'failed';
    this._errorMessage = errorMessage;
    this._completedAt = new Date();
    this.markUpdated();
  }

  /**
   * Add a source to the analysis
   */
  addSource(sourceId: string): void {
    if (!this._sourceIds.includes(sourceId)) {
      this._sourceIds.push(sourceId);
      this.markUpdated();
    }
  }

  /**
   * Check if analysis is high quality
   */
  isHighQuality(threshold: number = 0.7): boolean {
    return this._status === 'completed' && this._confidence.isAbove(threshold);
  }

  /**
   * Check if analysis is stale
   */
  isStale(maxAgeHours: number = 24): boolean {
    if (!this._completedAt) return true;
    const now = Timestamp.now();
    const completed = Timestamp.create(this._completedAt);
    return now.diffInHours(completed) > maxAgeHours;
  }

  /**
   * Get key insights from the result
   */
  getKeyInsights(limit: number = 5): string[] {
    return this._result?.insights.slice(0, limit) || [];
  }

  /**
   * Serialize to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      profileId: this.profileId,
      userId: this.userId,
      analysisType: this.analysisType,
      status: this.status,
      confidence: this.confidenceValue,
      result: this.result,
      metadata: this.metadata,
      sourceIds: [...this.sourceIds],
      errorMessage: this.errorMessage,
      completedAt: this.completedAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
