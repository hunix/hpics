/**
 * Insight Entity
 * 
 * Represents a discrete intelligence insight derived from analysis.
 */

import { BaseEntity, ConfidenceScore, ProfileId } from '@/domains/shared';

export type InsightCategory = 
  | 'behavioral'
  | 'psychological'
  | 'risk'
  | 'opportunity'
  | 'relationship'
  | 'vulnerability'
  | 'leverage'
  | 'pattern'
  | 'anomaly';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export type InsightActionability = 'informational' | 'monitor' | 'actionable' | 'urgent';

export interface InsightEvidence {
  sourceType: string;
  sourceId: string;
  relevance: number;
  excerpt?: string;
}

export class Insight extends BaseEntity<string> {
  private _profileId: ProfileId;
  private _userId: string;
  private _category: InsightCategory;
  private _priority: InsightPriority;
  private _actionability: InsightActionability;
  private _title: string;
  private _description: string;
  private _confidence: ConfidenceScore;
  private _evidence: InsightEvidence[];
  private _tags: string[];
  private _expiresAt: Date | null;
  private _isAcknowledged: boolean;
  private _acknowledgedAt: Date | null;

  constructor(
    id: string,
    profileId: string,
    userId: string,
    category: InsightCategory,
    priority: InsightPriority,
    actionability: InsightActionability,
    title: string,
    description: string,
    confidence: number,
    evidence: InsightEvidence[] = [],
    tags: string[] = [],
    expiresAt: Date | null = null,
    isAcknowledged: boolean = false,
    acknowledgedAt: Date | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this._profileId = ProfileId.create(profileId);
    this._userId = userId;
    this._category = category;
    this._priority = priority;
    this._actionability = actionability;
    this._title = title;
    this._description = description;
    this._confidence = ConfidenceScore.create(Math.max(0, Math.min(1, confidence)));
    this._evidence = evidence;
    this._tags = tags;
    this._expiresAt = expiresAt;
    this._isAcknowledged = isAcknowledged;
    this._acknowledgedAt = acknowledgedAt;
  }

  // Getters
  get profileId(): string { return this._profileId.value; }
  get userId(): string { return this._userId; }
  get category(): InsightCategory { return this._category; }
  get priority(): InsightPriority { return this._priority; }
  get actionability(): InsightActionability { return this._actionability; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get confidence(): ConfidenceScore { return this._confidence; }
  get confidenceValue(): number { return this._confidence.value; }
  get evidence(): readonly InsightEvidence[] { return [...this._evidence]; }
  get tags(): readonly string[] { return [...this._tags]; }
  get expiresAt(): Date | null { return this._expiresAt; }
  get isAcknowledged(): boolean { return this._isAcknowledged; }
  get acknowledgedAt(): Date | null { return this._acknowledgedAt; }

  // Domain Methods

  /**
   * Acknowledge the insight
   */
  acknowledge(): void {
    this._isAcknowledged = true;
    this._acknowledgedAt = new Date();
    this.markUpdated();
  }

  /**
   * Add evidence to the insight
   */
  addEvidence(evidence: InsightEvidence): void {
    this._evidence.push(evidence);
    this.markUpdated();
  }

  /**
   * Add a tag
   */
  addTag(tag: string): void {
    if (!this._tags.includes(tag)) {
      this._tags.push(tag);
      this.markUpdated();
    }
  }

  /**
   * Update priority
   */
  updatePriority(priority: InsightPriority): void {
    this._priority = priority;
    this.markUpdated();
  }

  /**
   * Check if insight is expired
   */
  isExpired(): boolean {
    if (!this._expiresAt) return false;
    return new Date() > this._expiresAt;
  }

  /**
   * Check if insight requires action
   */
  requiresAction(): boolean {
    return (
      !this._isAcknowledged &&
      !this.isExpired() &&
      (this._actionability === 'actionable' || this._actionability === 'urgent')
    );
  }

  /**
   * Get priority weight for sorting
   */
  getPriorityWeight(): number {
    const weights: Record<InsightPriority, number> = {
      'critical': 100,
      'high': 75,
      'medium': 50,
      'low': 25,
    };
    return weights[this._priority];
  }

  /**
   * Get evidence strength
   */
  getEvidenceStrength(): number {
    if (this._evidence.length === 0) return 0;
    const totalRelevance = this._evidence.reduce((sum, e) => sum + e.relevance, 0);
    return totalRelevance / this._evidence.length;
  }

  /**
   * Serialize to plain object
   */
  toObject(): Record<string, unknown> {
    return {
      id: this.id,
      profileId: this.profileId,
      userId: this.userId,
      category: this.category,
      priority: this.priority,
      actionability: this.actionability,
      title: this.title,
      description: this.description,
      confidence: this.confidenceValue,
      evidence: [...this.evidence],
      tags: [...this.tags],
      expiresAt: this.expiresAt?.toISOString(),
      isAcknowledged: this.isAcknowledged,
      acknowledgedAt: this.acknowledgedAt?.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
