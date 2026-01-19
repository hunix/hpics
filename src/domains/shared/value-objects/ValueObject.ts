/**
 * Value Object - Base class for immutable domain concepts
 * 
 * Value objects are defined by their attributes rather than identity.
 * Two value objects with the same attributes are considered equal.
 */

export abstract class ValueObject<T extends Record<string, unknown>> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  /**
   * Create a copy with updated properties
   */
  protected copyWith(updates: Partial<T>): T {
    return { ...this.props, ...updates };
  }
}

// ============================================
// Common Value Objects
// ============================================

/**
 * User ID value object
 */
export class UserId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    return new UserId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}

/**
 * Profile ID value object
 */
export class ProfileId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
  }

  static create(value: string): ProfileId {
    if (!value || value.trim().length === 0) {
      throw new Error('ProfileId cannot be empty');
    }
    return new ProfileId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}

/**
 * Confidence Score value object (0-1 range)
 */
export class ConfidenceScore extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  static create(value: number): ConfidenceScore {
    if (value < 0 || value > 1) {
      throw new Error(`ConfidenceScore must be between 0 and 1, got: ${value}`);
    }
    return new ConfidenceScore(value);
  }

  static fromPercentage(percentage: number): ConfidenceScore {
    return ConfidenceScore.create(percentage / 100);
  }

  get value(): number {
    return this.props.value;
  }

  get percentage(): number {
    return this.props.value * 100;
  }

  get level(): 'very-low' | 'low' | 'medium' | 'high' | 'very-high' {
    const v = this.props.value;
    if (v < 0.2) return 'very-low';
    if (v < 0.4) return 'low';
    if (v < 0.6) return 'medium';
    if (v < 0.8) return 'high';
    return 'very-high';
  }

  isAbove(threshold: number): boolean {
    return this.props.value > threshold;
  }

  isBelow(threshold: number): boolean {
    return this.props.value < threshold;
  }
}

/**
 * Timestamp value object with utility methods
 */
export class Timestamp extends ValueObject<{ value: Date }> {
  private constructor(value: Date) {
    super({ value });
  }

  static create(value: Date | string | number): Timestamp {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }
    return new Timestamp(date);
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  get value(): Date {
    return new Date(this.props.value);
  }

  toISOString(): string {
    return this.props.value.toISOString();
  }

  isBefore(other: Timestamp): boolean {
    return this.props.value < other.props.value;
  }

  isAfter(other: Timestamp): boolean {
    return this.props.value > other.props.value;
  }

  diffInSeconds(other: Timestamp): number {
    return Math.abs(this.props.value.getTime() - other.props.value.getTime()) / 1000;
  }

  diffInMinutes(other: Timestamp): number {
    return this.diffInSeconds(other) / 60;
  }

  diffInHours(other: Timestamp): number {
    return this.diffInMinutes(other) / 60;
  }

  diffInDays(other: Timestamp): number {
    return this.diffInHours(other) / 24;
  }
}

/**
 * Percentage value object (0-100 range)
 */
export class Percentage extends ValueObject<{ value: number }> {
  private constructor(value: number) {
    super({ value });
  }

  static create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new Error(`Percentage must be between 0 and 100, got: ${value}`);
    }
    return new Percentage(value);
  }

  static fromDecimal(decimal: number): Percentage {
    return Percentage.create(decimal * 100);
  }

  get value(): number {
    return this.props.value;
  }

  get decimal(): number {
    return this.props.value / 100;
  }

  toConfidenceScore(): ConfidenceScore {
    return ConfidenceScore.create(this.decimal);
  }
}

/**
 * Score value object for numeric scores with bounds
 */
export class BoundedScore extends ValueObject<{ value: number; min: number; max: number }> {
  private constructor(value: number, min: number, max: number) {
    super({ value, min, max });
  }

  static create(value: number, min: number = 0, max: number = 100): BoundedScore {
    if (value < min || value > max) {
      throw new Error(`Score must be between ${min} and ${max}, got: ${value}`);
    }
    return new BoundedScore(value, min, max);
  }

  get value(): number {
    return this.props.value;
  }

  get normalized(): number {
    const range = this.props.max - this.props.min;
    return (this.props.value - this.props.min) / range;
  }

  toConfidenceScore(): ConfidenceScore {
    return ConfidenceScore.create(this.normalized);
  }
}
