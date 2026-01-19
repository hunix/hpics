/**
 * Shared Domain Kernel
 * 
 * Contains base classes and utilities shared across all domains.
 * This is the foundation of the DDD architecture.
 */

// Entities
export { BaseEntity, AggregateRoot } from './entities/BaseEntity';

// Events
export { DomainEvent, EnrichedDomainEvent, type EventMetadata } from './events/DomainEvent';
export { 
  getEventBus, 
  resetEventBus,
  type IEventBus, 
  type EventHandler, 
  type EventSubscription 
} from './events/EventBus';

// Repositories
export {
  BaseRepository,
  type IRepository,
  type IUserScopedRepository,
  type PaginationParams,
  type PaginatedResult,
  type SortDirection,
  type SortParams,
  type FilterOperator,
  type FilterCondition,
  type QuerySpec,
} from './repositories/BaseRepository';

// Value Objects
export {
  ValueObject,
  UserId,
  ProfileId,
  ConfidenceScore,
  Timestamp,
  Percentage,
  BoundedScore,
} from './value-objects/ValueObject';
