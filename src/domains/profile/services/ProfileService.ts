/**
 * Profile Domain Service
 * 
 * Refactored to use IProfileRepository for persistence (DDD pattern).
 */

import { getEventBus, IEventBus } from '@/domains/shared/events/EventBus';
import { Profile, ProfileProps, RelationshipType, ProfileStatus, ContactInfo } from '../entities/Profile';
import { ContactScore } from '../value-objects/ContactScore';
import { 
  IProfileRepository, 
  ProfileQueryOptions, 
  ContactCounts, 
  LetterCount, 
  FilterOptions,
  EnhancedContactRow 
} from '../repositories/IProfileRepository';
import {
  ProfileCreated,
  ProfileUpdated,
  ProfileEnriched,
  ProfileStatusChanged,
  ProfileArchived,
  ProfileDeleted,
  ProfileFavoriteToggled,
  ProfileInteractionRecorded,
} from '../events/ProfileEvents';

export interface CreateProfileRequest {
  firstName: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  relationshipType?: RelationshipType;
  email?: string;
  phone?: string;
  tags?: string[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  bio?: string;
  notes?: string;
  avatarUrl?: string;
  contactInfo?: Partial<ContactInfo>;
  tags?: string[];
}

export interface ProfileSearchCriteria {
  searchQuery?: string;
  relationshipType?: RelationshipType;
  relationshipSubtype?: string;
  tag?: string;
  status?: ProfileStatus;
  isFavorite?: boolean;
  isActive?: boolean | null;
  firstLetter?: string;
  tags?: string[];
  minCompleteness?: number;
  sortBy?: 'name' | 'recent' | 'oldest' | 'organization' | 'relationship' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

export interface ProfileSummary {
  totalProfiles: number;
  favoriteCount: number;
  needsEnrichmentCount: number;
  byRelationshipType: Record<RelationshipType, number>;
  byStatus: Record<ProfileStatus, number>;
  averageCompleteness: number;
  recentlyUpdated: Profile[];
}

export interface EnrichmentResult {
  success: boolean;
  fieldsEnriched: string[];
  newCompleteness: number;
  source: string;
  error?: string;
}

// Re-export types for hooks
export type { ContactCounts, LetterCount, FilterOptions, EnhancedContactRow };

export class ProfileService {
  private eventBus: IEventBus;
  private repository: IProfileRepository;

  constructor(repository: IProfileRepository) {
    this.eventBus = getEventBus();
    this.repository = repository;
  }

  async createProfile(userId: string, request: CreateProfileRequest): Promise<Profile> {
    const profile = Profile.create({
      userId,
      firstName: request.firstName,
      lastName: request.lastName,
      organization: request.organization,
      jobTitle: request.jobTitle,
      relationshipType: request.relationshipType || 'unknown',
      status: 'active',
      tags: request.tags || [],
      isFavorite: false,
      contactInfo: {
        email: request.email,
        phone: request.phone,
      },
      metadata: {},
      completenessScore: 0,
    });

    const saved = await this.repository.save(profile);

    await this.eventBus.publish(new ProfileCreated(
      saved.id, userId, saved.firstName, saved.lastName, saved.relationshipType
    ));

    return saved;
  }

  async getProfile(profileId: string, userId: string): Promise<Profile | null> {
    return this.repository.findByIdForUser(profileId, userId);
  }

  async updateProfile(profileId: string, userId: string, request: UpdateProfileRequest): Promise<Profile> {
    const existing = await this.repository.findByIdForUser(profileId, userId);
    if (!existing) throw new Error('Profile not found');

    const updatedFields: string[] = [];
    const props = (existing as unknown as { _props: ProfileProps })._props;

    if (request.firstName !== undefined) { props.firstName = request.firstName; updatedFields.push('firstName'); }
    if (request.lastName !== undefined) { props.lastName = request.lastName; updatedFields.push('lastName'); }
    if (request.organization !== undefined) { props.organization = request.organization; updatedFields.push('organization'); }
    if (request.jobTitle !== undefined) { props.jobTitle = request.jobTitle; updatedFields.push('jobTitle'); }
    if (request.bio !== undefined) { props.bio = request.bio; updatedFields.push('bio'); }
    if (request.notes !== undefined) { props.notes = request.notes; updatedFields.push('notes'); }
    if (request.avatarUrl !== undefined) { props.avatarUrl = request.avatarUrl; updatedFields.push('avatarUrl'); }
    if (request.tags !== undefined) { props.tags = request.tags; updatedFields.push('tags'); }
    if (request.contactInfo) {
      props.contactInfo = { ...props.contactInfo, ...request.contactInfo };
      updatedFields.push('contactInfo');
    }
    props.updatedAt = new Date();

    const saved = await this.repository.save(existing);
    await this.eventBus.publish(new ProfileUpdated(profileId, userId, updatedFields));
    return saved;
  }

  async deleteProfile(profileId: string, userId: string): Promise<void> {
    await this.repository.delete(profileId);
    await this.eventBus.publish(new ProfileDeleted(profileId, userId));
  }

  async searchProfiles(userId: string, criteria: ProfileSearchCriteria, page = 0, pageSize = 50): Promise<{ profiles: Profile[]; totalCount: number }> {
    const options: ProfileQueryOptions = {
      searchTerm: criteria.searchQuery,
      relationshipType: criteria.relationshipType,
      includeFavorites: criteria.isFavorite,
    };
    const result = await this.repository.searchProfiles(userId, options, { pagination: { page, pageSize } });
    return { profiles: result.items, totalCount: result.totalCount };
  }

  async getProfilesByIds(profileIds: string[], userId: string): Promise<Profile[]> {
    const profiles: Profile[] = [];
    for (const id of profileIds) {
      const p = await this.repository.findByIdForUser(id, userId);
      if (p) profiles.push(p);
    }
    return profiles;
  }

  async getFavoriteProfiles(userId: string): Promise<Profile[]> {
    return this.repository.findFavorites(userId);
  }

  async getRecentProfiles(userId: string, limit = 10): Promise<Profile[]> {
    return this.repository.findRecentlyUpdated(userId, limit);
  }

  // ============================================
  // Contacts Page Support Methods (for DDD migration)
  // ============================================

  async searchContactsV5(
    userId: string,
    criteria: ProfileSearchCriteria,
    limit: number,
    offset: number
  ): Promise<{ contacts: EnhancedContactRow[]; totalCount: number }> {
    const options: ProfileQueryOptions = {
      searchTerm: criteria.searchQuery,
      relationshipType: criteria.relationshipType,
      relationshipSubtype: criteria.relationshipSubtype,
      tag: criteria.tag,
      isFavorite: criteria.isFavorite,
      isActive: criteria.isActive,
      firstLetter: criteria.firstLetter,
      sortBy: criteria.sortBy,
      sortOrder: criteria.sortOrder,
    };
    return this.repository.searchContactsV5(userId, options, limit, offset);
  }

  async getContactCounts(userId: string): Promise<ContactCounts> {
    return this.repository.getContactCounts(userId);
  }

  async getLetterCounts(userId: string): Promise<LetterCount[]> {
    return this.repository.getLetterCounts(userId);
  }

  async getFilterOptions(userId: string): Promise<FilterOptions> {
    return this.repository.getFilterOptions(userId);
  }

  async toggleFavoriteById(profileId: string, userId: string, currentState: boolean): Promise<void> {
    await this.repository.updateFavoriteStatus(profileId, userId, !currentState);
    await this.eventBus.publish(new ProfileFavoriteToggled(profileId, userId, !currentState));
  }

  async toggleFavorite(profileId: string, userId: string): Promise<boolean> {
    const profile = await this.repository.findByIdForUser(profileId, userId);
    if (!profile) throw new Error('Profile not found');
    const newState = !profile.isFavorite;
    await this.repository.updateFavoriteStatus(profileId, userId, newState);
    await this.eventBus.publish(new ProfileFavoriteToggled(profileId, userId, newState));
    return newState;
  }

  async changeStatus(profileId: string, userId: string, newStatus: ProfileStatus): Promise<void> {
    await this.eventBus.publish(new ProfileStatusChanged(profileId, userId, 'active', newStatus));
  }

  async archiveProfile(profileId: string, userId: string): Promise<void> {
    await this.changeStatus(profileId, userId, 'archived');
    await this.eventBus.publish(new ProfileArchived(profileId, userId));
  }

  async recordInteraction(profileId: string, userId: string, interactionType: string, metadata?: Record<string, unknown>): Promise<void> {
    const profile = await this.repository.findByIdForUser(profileId, userId);
    if (profile) {
      const props = (profile as unknown as { _props: ProfileProps })._props;
      props.updatedAt = new Date();
      await this.repository.save(profile);
    }
    await this.eventBus.publish(new ProfileInteractionRecorded(profileId, userId, interactionType, metadata));
  }

  async enrichProfile(profileId: string, userId: string, source: string): Promise<EnrichmentResult> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) {
      return { success: false, fieldsEnriched: [], newCompleteness: 0, source, error: 'Profile not found' };
    }

    const fieldsEnriched: string[] = [];
    await this.eventBus.publish(new ProfileEnriched(profileId, userId, source, fieldsEnriched, profile.completenessScore));
    return { success: true, fieldsEnriched, newCompleteness: profile.completenessScore, source };
  }

  async getProfileSummary(userId: string): Promise<ProfileSummary> {
    const profiles = await this.repository.findByUserId(userId);

    const byRelationshipType: Record<RelationshipType, number> = {
      family: 0, friend: 0, colleague: 0, professional: 0,
      acquaintance: 0, target: 0, asset: 0, unknown: 0,
    };
    const byStatus: Record<ProfileStatus, number> = {
      active: 0, inactive: 0, archived: 0, under_analysis: 0, flagged: 0,
    };

    let totalCompleteness = 0;
    for (const profile of profiles) {
      byRelationshipType[profile.relationshipType]++;
      byStatus[profile.status]++;
      totalCompleteness += profile.completenessScore;
    }

    return {
      totalProfiles: profiles.length,
      favoriteCount: profiles.filter(p => p.isFavorite).length,
      needsEnrichmentCount: profiles.filter(p => p.needsEnrichment).length,
      byRelationshipType,
      byStatus,
      averageCompleteness: profiles.length > 0 ? totalCompleteness / profiles.length : 0,
      recentlyUpdated: profiles.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 5),
    };
  }

  async calculateContactScore(profileId: string, userId: string): Promise<ContactScore> {
    const profile = await this.getProfile(profileId, userId);
    if (!profile) return ContactScore.createDefault();

    const recency = this.calculateRecencyScore(profile.lastInteractionAt);
    const dataCompleteness = profile.completenessScore;
    const interactionFrequency = 0.5;
    const relationshipStrength = this.mapRelationshipToStrength(profile.relationshipType);
    const strategicValue = profile.isFavorite ? 0.8 : 0.5;

    return ContactScore.create({ interactionFrequency, relationshipStrength, strategicValue, recency, dataCompleteness });
  }

  private calculateRecencyScore(lastInteraction?: Date): number {
    if (!lastInteraction) return 0;
    const daysSince = (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 7) return 1;
    if (daysSince <= 30) return 0.7;
    if (daysSince <= 90) return 0.4;
    return 0.1;
  }

  private mapRelationshipToStrength(type: RelationshipType): number {
    const mapping: Record<RelationshipType, number> = {
      family: 0.95, friend: 0.85, colleague: 0.7, professional: 0.6,
      acquaintance: 0.4, asset: 0.5, target: 0.3, unknown: 0.2,
    };
    return mapping[type];
  }
}
