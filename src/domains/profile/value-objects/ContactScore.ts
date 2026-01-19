/**
 * ContactScore Value Object
 * 
 * Represents a calculated importance/priority score for a contact.
 */

import { ValueObject } from '@/domains/shared/value-objects/ValueObject';

interface ContactScoreProps {
  interactionFrequency: number;  // 0-1
  relationshipStrength: number;  // 0-1
  strategicValue: number;        // 0-1
  recency: number;               // 0-1
  dataCompleteness: number;      // 0-1
}

export class ContactScore extends ValueObject<ContactScoreProps> {
  private static readonly WEIGHTS = {
    interactionFrequency: 0.25,
    relationshipStrength: 0.30,
    strategicValue: 0.25,
    recency: 0.10,
    dataCompleteness: 0.10,
  };

  get interactionFrequency(): number {
    return this.props.interactionFrequency;
  }

  get relationshipStrength(): number {
    return this.props.relationshipStrength;
  }

  get strategicValue(): number {
    return this.props.strategicValue;
  }

  get recency(): number {
    return this.props.recency;
  }

  get dataCompleteness(): number {
    return this.props.dataCompleteness;
  }

  get overallScore(): number {
    const w = ContactScore.WEIGHTS;
    return (
      this.props.interactionFrequency * w.interactionFrequency +
      this.props.relationshipStrength * w.relationshipStrength +
      this.props.strategicValue * w.strategicValue +
      this.props.recency * w.recency +
      this.props.dataCompleteness * w.dataCompleteness
    );
  }

  get tier(): 'platinum' | 'gold' | 'silver' | 'bronze' {
    const score = this.overallScore;
    if (score >= 0.85) return 'platinum';
    if (score >= 0.65) return 'gold';
    if (score >= 0.40) return 'silver';
    return 'bronze';
  }

  get priorityLevel(): 'critical' | 'high' | 'medium' | 'low' {
    const score = this.overallScore;
    if (score >= 0.80) return 'critical';
    if (score >= 0.60) return 'high';
    if (score >= 0.35) return 'medium';
    return 'low';
  }

  isHigherThan(other: ContactScore): boolean {
    return this.overallScore > other.overallScore;
  }

  needsAttention(): boolean {
    return this.props.recency < 0.3 && this.props.relationshipStrength >= 0.5;
  }

  // ============================================
  // Factory Methods
  // ============================================

  static create(props: ContactScoreProps): ContactScore {
    // Validate all values are between 0 and 1
    for (const [key, value] of Object.entries(props)) {
      if (value < 0 || value > 1) {
        throw new Error(`${key} must be between 0 and 1, got ${value}`);
      }
    }
    return new ContactScore(props);
  }

  static createDefault(): ContactScore {
    return new ContactScore({
      interactionFrequency: 0,
      relationshipStrength: 0.5,
      strategicValue: 0.5,
      recency: 0,
      dataCompleteness: 0,
    });
  }

  static fromOverallScore(score: number): ContactScore {
    // Distribute the score evenly across components
    const normalized = Math.max(0, Math.min(1, score));
    return new ContactScore({
      interactionFrequency: normalized,
      relationshipStrength: normalized,
      strategicValue: normalized,
      recency: normalized,
      dataCompleteness: normalized,
    });
  }
}

/**
 * TrustLevel Value Object
 */
export type TrustTier = 'untrusted' | 'limited' | 'standard' | 'trusted' | 'inner_circle';

interface TrustLevelProps {
  tier: TrustTier;
  score: number;
  verifiedAt?: Date;
  verificationMethod?: string;
}

export class TrustLevel extends ValueObject<TrustLevelProps> {
  get tier(): TrustTier {
    return this.props.tier;
  }

  get score(): number {
    return this.props.score;
  }

  get isVerified(): boolean {
    return !!this.props.verifiedAt;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }

  canAccessSensitiveData(): boolean {
    return this.props.tier === 'trusted' || this.props.tier === 'inner_circle';
  }

  canAccessRestrictedOperations(): boolean {
    return this.props.tier === 'inner_circle';
  }

  static fromScore(score: number): TrustLevel {
    let tier: TrustTier;
    if (score >= 0.9) tier = 'inner_circle';
    else if (score >= 0.7) tier = 'trusted';
    else if (score >= 0.5) tier = 'standard';
    else if (score >= 0.25) tier = 'limited';
    else tier = 'untrusted';

    return new TrustLevel({ tier, score: Math.max(0, Math.min(1, score)) });
  }

  static untrusted(): TrustLevel {
    return new TrustLevel({ tier: 'untrusted', score: 0 });
  }
}

/**
 * ClearanceLevel Value Object
 */
export type ClearanceTier = 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret';

interface ClearanceLevelProps {
  tier: ClearanceTier;
  grantedAt: Date;
  expiresAt?: Date;
  grantedBy?: string;
}

export class ClearanceLevel extends ValueObject<ClearanceLevelProps> {
  private static readonly HIERARCHY: ClearanceTier[] = [
    'public',
    'internal', 
    'confidential',
    'secret',
    'top_secret'
  ];

  get tier(): ClearanceTier {
    return this.props.tier;
  }

  get grantedAt(): Date {
    return this.props.grantedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get isExpired(): boolean {
    return this.props.expiresAt ? this.props.expiresAt < new Date() : false;
  }

  get isActive(): boolean {
    return !this.isExpired;
  }

  get numericLevel(): number {
    return ClearanceLevel.HIERARCHY.indexOf(this.props.tier);
  }

  canAccess(requiredLevel: ClearanceTier): boolean {
    if (this.isExpired) return false;
    const requiredIndex = ClearanceLevel.HIERARCHY.indexOf(requiredLevel);
    return this.numericLevel >= requiredIndex;
  }

  isHigherThan(other: ClearanceLevel): boolean {
    return this.numericLevel > other.numericLevel;
  }

  static create(tier: ClearanceTier, expiresInDays?: number): ClearanceLevel {
    return new ClearanceLevel({
      tier,
      grantedAt: new Date(),
      expiresAt: expiresInDays 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined,
    });
  }

  static public(): ClearanceLevel {
    return ClearanceLevel.create('public');
  }
}
