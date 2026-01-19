/**
 * Domain Event - Base class for all domain events
 * 
 * Domain events represent something that happened in the domain that
 * domain experts care about. They enable loose coupling between domains.
 */

export abstract class DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract get eventType(): string;

  /**
   * Serialize the event for persistence or transmission
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      payload: this.getPayload(),
    };
  }

  /**
   * Get the event-specific payload
   */
  protected abstract getPayload(): Record<string, unknown>;
}

/**
 * Event metadata for tracking and debugging
 */
export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  source?: string;
  version?: number;
}

/**
 * Enriched domain event with metadata
 */
export abstract class EnrichedDomainEvent extends DomainEvent {
  readonly metadata: EventMetadata;

  constructor(metadata?: Partial<EventMetadata>) {
    super();
    this.metadata = {
      correlationId: metadata?.correlationId || crypto.randomUUID(),
      causationId: metadata?.causationId,
      userId: metadata?.userId,
      source: metadata?.source || 'unknown',
      version: metadata?.version || 1,
    };
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      metadata: this.metadata,
    };
  }
}
