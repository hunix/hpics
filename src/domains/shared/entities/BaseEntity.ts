/**
 * Base Entity - Foundation for all domain entities
 * 
 * Provides common functionality for identity, equality, and auditing.
 */

export abstract class BaseEntity<TId = string> {
  protected readonly _id: TId;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this._id = id;
    this._createdAt = createdAt || new Date();
    this._updatedAt = updatedAt || new Date();
  }

  get id(): TId {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected markUpdated(): void {
    this._updatedAt = new Date();
  }

  equals(other: BaseEntity<TId>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof BaseEntity)) {
      return false;
    }
    return this._id === other._id;
  }

  /**
   * Generate a unique hash for this entity based on its ID
   */
  hashCode(): string {
    return String(this._id);
  }
}

/**
 * Aggregate Root - Base for entities that are aggregate roots
 * 
 * Aggregate roots are the entry points to aggregates and are responsible
 * for maintaining invariants across the aggregate boundary.
 */
export abstract class AggregateRoot<TId = string> extends BaseEntity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): readonly DomainEvent[] {
    return [...this._domainEvents];
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

// Forward declaration for DomainEvent (will be imported properly in index)
interface DomainEvent {
  readonly eventType: string;
  readonly occurredOn: Date;
}
