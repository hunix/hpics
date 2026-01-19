/**
 * Event Bus - Pub/Sub system for domain events
 * 
 * Enables loose coupling between domains by allowing them to
 * communicate through events rather than direct dependencies.
 */

import { DomainEvent } from './DomainEvent';

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

export interface IEventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventSubscription;
  subscribeAll(handler: EventHandler): EventSubscription;
}

/**
 * In-memory event bus implementation
 * 
 * For production, this could be replaced with a distributed event bus
 * using Redis, RabbitMQ, or similar.
 */
class EventBusImpl implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private eventLog: DomainEvent[] = [];
  private readonly maxLogSize = 1000;

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    // Log event for debugging
    this.logEvent(event);

    // Notify specific handlers
    const eventHandlers = this.handlers.get(event.eventType);
    if (eventHandlers) {
      const promises = Array.from(eventHandlers).map(handler => 
        this.safeHandle(handler, event)
      );
      await Promise.all(promises);
    }

    // Notify global handlers
    const globalPromises = Array.from(this.globalHandlers).map(handler =>
      this.safeHandle(handler, event)
    );
    await Promise.all(globalPromises);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    const handlerSet = this.handlers.get(eventType)!;
    handlerSet.add(handler as EventHandler);

    return {
      unsubscribe: () => {
        handlerSet.delete(handler as EventHandler);
        if (handlerSet.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  subscribeAll(handler: EventHandler): EventSubscription {
    this.globalHandlers.add(handler);

    return {
      unsubscribe: () => {
        this.globalHandlers.delete(handler);
      }
    };
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(count: number = 50): DomainEvent[] {
    return this.eventLog.slice(-count);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string, count: number = 50): DomainEvent[] {
    return this.eventLog
      .filter(e => e.eventType === eventType)
      .slice(-count);
  }

  private async safeHandle(handler: EventHandler, event: DomainEvent): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      console.error(`[EventBus] Handler error for ${event.eventType}:`, error);
      // In production, this could publish to a dead letter queue
    }
  }

  private logEvent(event: DomainEvent): void {
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize / 2);
    }
  }
}

// Singleton instance
let eventBusInstance: EventBusImpl | null = null;

export function getEventBus(): IEventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBusImpl();
  }
  return eventBusInstance;
}

// For testing - allows resetting the event bus
export function resetEventBus(): void {
  eventBusInstance = null;
}
