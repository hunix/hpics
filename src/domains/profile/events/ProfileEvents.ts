/**
 * Profile Domain Events
 * 
 * Events emitted by the Profile domain for cross-domain communication.
 */

import { DomainEvent } from '@/domains/shared/events/DomainEvent';
import { RelationshipType, ProfileStatus } from '../entities/Profile';

/**
 * Emitted when a new profile is created
 */
export class ProfileCreated extends DomainEvent {
  readonly eventType = 'profile.created';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly firstName: string,
    readonly lastName?: string,
    readonly relationshipType?: RelationshipType
  ) {
    super();
  }
}

/**
 * Emitted when a profile is updated
 */
export class ProfileUpdated extends DomainEvent {
  readonly eventType = 'profile.updated';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly updatedFields: string[]
  ) {
    super();
  }
}

/**
 * Emitted when a profile is enriched with external data
 */
export class ProfileEnriched extends DomainEvent {
  readonly eventType = 'profile.enriched';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly enrichmentSource: string,
    readonly fieldsEnriched: string[],
    readonly newCompletenessScore: number
  ) {
    super();
  }
}

/**
 * Emitted when a profile's status changes
 */
export class ProfileStatusChanged extends DomainEvent {
  readonly eventType = 'profile.status_changed';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly previousStatus: ProfileStatus,
    readonly newStatus: ProfileStatus
  ) {
    super();
  }
}

/**
 * Emitted when a profile is archived
 */
export class ProfileArchived extends DomainEvent {
  readonly eventType = 'profile.archived';

  constructor(
    readonly profileId: string,
    readonly userId: string
  ) {
    super();
  }
}

/**
 * Emitted when a profile is deleted
 */
export class ProfileDeleted extends DomainEvent {
  readonly eventType = 'profile.deleted';

  constructor(
    readonly profileId: string,
    readonly userId: string
  ) {
    super();
  }
}

/**
 * Emitted when profile relationship type changes
 */
export class ProfileRelationshipChanged extends DomainEvent {
  readonly eventType = 'profile.relationship_changed';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly previousType: RelationshipType,
    readonly newType: RelationshipType
  ) {
    super();
  }
}

/**
 * Emitted when a profile is favorited/unfavorited
 */
export class ProfileFavoriteToggled extends DomainEvent {
  readonly eventType = 'profile.favorite_toggled';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly isFavorite: boolean
  ) {
    super();
  }
}

/**
 * Emitted when an interaction is recorded with a profile
 */
export class ProfileInteractionRecorded extends DomainEvent {
  readonly eventType = 'profile.interaction_recorded';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly interactionType: string,
    readonly metadata?: Record<string, unknown>
  ) {
    super();
  }
}

/**
 * Emitted when profile tags are modified
 */
export class ProfileTagsModified extends DomainEvent {
  readonly eventType = 'profile.tags_modified';

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly addedTags: string[],
    readonly removedTags: string[]
  ) {
    super();
  }
}

/**
 * Emitted when a profile merge is requested
 */
export class ProfileMergeRequested extends DomainEvent {
  readonly eventType = 'profile.merge_requested';

  constructor(
    readonly primaryProfileId: string,
    readonly secondaryProfileId: string,
    readonly userId: string
  ) {
    super();
  }
}

/**
 * Emitted when profiles are successfully merged
 */
export class ProfilesMerged extends DomainEvent {
  readonly eventType = 'profile.merged';

  constructor(
    readonly resultingProfileId: string,
    readonly mergedProfileIds: string[],
    readonly userId: string
  ) {
    super();
  }
}
