/**
 * ContactScore Value Object - Represents contact importance/priority score.
 */

export interface ContactScoreData {
  interactionFrequency: number;
  relationshipStrength: number;
  strategicValue: number;
  recency: number;
  dataCompleteness: number;
}

export class ContactScore {
  private readonly data: ContactScoreData;

  private static readonly WEIGHTS = {
    interactionFrequency: 0.25,
    relationshipStrength: 0.30,
    strategicValue: 0.25,
    recency: 0.10,
    dataCompleteness: 0.10,
  };

  private constructor(data: ContactScoreData) {
    this.data = Object.freeze({ ...data });
  }

  get interactionFrequency(): number { return this.data.interactionFrequency; }
  get relationshipStrength(): number { return this.data.relationshipStrength; }
  get strategicValue(): number { return this.data.strategicValue; }
  get recency(): number { return this.data.recency; }
  get dataCompleteness(): number { return this.data.dataCompleteness; }

  get overallScore(): number {
    const w = ContactScore.WEIGHTS;
    return (
      this.data.interactionFrequency * w.interactionFrequency +
      this.data.relationshipStrength * w.relationshipStrength +
      this.data.strategicValue * w.strategicValue +
      this.data.recency * w.recency +
      this.data.dataCompleteness * w.dataCompleteness
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
    return this.data.recency < 0.3 && this.data.relationshipStrength >= 0.5;
  }

  static create(data: ContactScoreData): ContactScore {
    for (const [key, value] of Object.entries(data)) {
      if (value < 0 || value > 1) {
        throw new Error(`${key} must be between 0 and 1, got ${value}`);
      }
    }
    return new ContactScore(data);
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

export class TrustLevel {
  private readonly _tier: TrustTier;
  private readonly _score: number;
  private readonly _verifiedAt?: Date;

  private constructor(tier: TrustTier, score: number, verifiedAt?: Date) {
    this._tier = tier;
    this._score = score;
    this._verifiedAt = verifiedAt;
  }

  get tier(): TrustTier { return this._tier; }
  get score(): number { return this._score; }
  get isVerified(): boolean { return !!this._verifiedAt; }
  get verifiedAt(): Date | undefined { return this._verifiedAt; }

  canAccessSensitiveData(): boolean {
    return this._tier === 'trusted' || this._tier === 'inner_circle';
  }

  canAccessRestrictedOperations(): boolean {
    return this._tier === 'inner_circle';
  }

  static fromScore(score: number): TrustLevel {
    let tier: TrustTier;
    if (score >= 0.9) tier = 'inner_circle';
    else if (score >= 0.7) tier = 'trusted';
    else if (score >= 0.5) tier = 'standard';
    else if (score >= 0.25) tier = 'limited';
    else tier = 'untrusted';
    return new TrustLevel(tier, Math.max(0, Math.min(1, score)));
  }

  static untrusted(): TrustLevel {
    return new TrustLevel('untrusted', 0);
  }
}

/**
 * ClearanceLevel Value Object
 */
export type ClearanceTier = 'public' | 'internal' | 'confidential' | 'secret' | 'top_secret';

export class ClearanceLevel {
  private static readonly HIERARCHY: ClearanceTier[] = ['public', 'internal', 'confidential', 'secret', 'top_secret'];

  private readonly _tier: ClearanceTier;
  private readonly _grantedAt: Date;
  private readonly _expiresAt?: Date;

  private constructor(tier: ClearanceTier, grantedAt: Date, expiresAt?: Date) {
    this._tier = tier;
    this._grantedAt = grantedAt;
    this._expiresAt = expiresAt;
  }

  get tier(): ClearanceTier { return this._tier; }
  get grantedAt(): Date { return this._grantedAt; }
  get expiresAt(): Date | undefined { return this._expiresAt; }
  get isExpired(): boolean { return this._expiresAt ? this._expiresAt < new Date() : false; }
  get isActive(): boolean { return !this.isExpired; }
  get numericLevel(): number { return ClearanceLevel.HIERARCHY.indexOf(this._tier); }

  canAccess(requiredLevel: ClearanceTier): boolean {
    if (this.isExpired) return false;
    const requiredIndex = ClearanceLevel.HIERARCHY.indexOf(requiredLevel);
    return this.numericLevel >= requiredIndex;
  }

  isHigherThan(other: ClearanceLevel): boolean {
    return this.numericLevel > other.numericLevel;
  }

  static create(tier: ClearanceTier, expiresInDays?: number): ClearanceLevel {
    return new ClearanceLevel(
      tier,
      new Date(),
      expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined
    );
  }

  static public(): ClearanceLevel {
    return ClearanceLevel.create('public');
  }
}
