/**
 * Profile Domain Events
 */

import { DomainEvent } from '@/domains/shared/events/DomainEvent';
import { RelationshipType, ProfileStatus } from '../entities/Profile';

export class ProfileCreated extends DomainEvent {
  get eventType() { return 'profile.created'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly firstName: string,
    readonly lastName?: string,
    readonly relationshipType?: RelationshipType
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, firstName: this.firstName, lastName: this.lastName, relationshipType: this.relationshipType };
  }
}

export class ProfileUpdated extends DomainEvent {
  get eventType() { return 'profile.updated'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly updatedFields: string[]
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, updatedFields: this.updatedFields };
  }
}

export class ProfileEnriched extends DomainEvent {
  get eventType() { return 'profile.enriched'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly enrichmentSource: string,
    readonly fieldsEnriched: string[],
    readonly newCompletenessScore: number
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, enrichmentSource: this.enrichmentSource, fieldsEnriched: this.fieldsEnriched, newCompletenessScore: this.newCompletenessScore };
  }
}

export class ProfileStatusChanged extends DomainEvent {
  get eventType() { return 'profile.status_changed'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly previousStatus: ProfileStatus,
    readonly newStatus: ProfileStatus
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, previousStatus: this.previousStatus, newStatus: this.newStatus };
  }
}

export class ProfileArchived extends DomainEvent {
  get eventType() { return 'profile.archived'; }

  constructor(readonly profileId: string, readonly userId: string) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId };
  }
}

export class ProfileDeleted extends DomainEvent {
  get eventType() { return 'profile.deleted'; }

  constructor(readonly profileId: string, readonly userId: string) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId };
  }
}

export class ProfileRelationshipChanged extends DomainEvent {
  get eventType() { return 'profile.relationship_changed'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly previousType: RelationshipType,
    readonly newType: RelationshipType
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, previousType: this.previousType, newType: this.newType };
  }
}

export class ProfileFavoriteToggled extends DomainEvent {
  get eventType() { return 'profile.favorite_toggled'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly isFavorite: boolean
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, isFavorite: this.isFavorite };
  }
}

export class ProfileInteractionRecorded extends DomainEvent {
  get eventType() { return 'profile.interaction_recorded'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly interactionType: string,
    readonly metadata?: Record<string, unknown>
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, interactionType: this.interactionType, metadata: this.metadata };
  }
}

export class ProfileTagsModified extends DomainEvent {
  get eventType() { return 'profile.tags_modified'; }

  constructor(
    readonly profileId: string,
    readonly userId: string,
    readonly addedTags: string[],
    readonly removedTags: string[]
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { profileId: this.profileId, userId: this.userId, addedTags: this.addedTags, removedTags: this.removedTags };
  }
}

export class ProfileMergeRequested extends DomainEvent {
  get eventType() { return 'profile.merge_requested'; }

  constructor(
    readonly primaryProfileId: string,
    readonly secondaryProfileId: string,
    readonly userId: string
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { primaryProfileId: this.primaryProfileId, secondaryProfileId: this.secondaryProfileId, userId: this.userId };
  }
}

export class ProfilesMerged extends DomainEvent {
  get eventType() { return 'profile.merged'; }

  constructor(
    readonly resultingProfileId: string,
    readonly mergedProfileIds: string[],
    readonly userId: string
  ) { super(); }

  protected getPayload(): Record<string, unknown> {
    return { resultingProfileId: this.resultingProfileId, mergedProfileIds: this.mergedProfileIds, userId: this.userId };
  }
}
