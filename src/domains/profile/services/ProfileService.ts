/**
 * Profile Domain Service
 */

import { supabase } from '@/integrations/supabase/client';
import { getEventBus, IEventBus } from '@/domains/shared/events/EventBus';
import { Profile, ProfileProps, RelationshipType, ProfileStatus, ContactInfo } from '../entities/Profile';
import { ContactScore } from '../value-objects/ContactScore';
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
  status?: ProfileStatus;
  isFavorite?: boolean;
  tags?: string[];
  minCompleteness?: number;
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

export class ProfileService {
  private eventBus: IEventBus;

  constructor() {
    this.eventBus = getEventBus();
  }

  async createProfile(userId: string, request: CreateProfileRequest): Promise<Profile> {
    const insertData = {
      user_id: userId,
      first_name: request.firstName,
      last_name: request.lastName,
      organization: request.organization,
      job_title: request.jobTitle,
      relationship_type: request.relationshipType || 'unknown',
      tags: request.tags || [],
      is_favorite: false,
    } as unknown as Record<string, unknown>;

    const { data, error } = await (supabase
      .from('profiles') as unknown as { insert: (d: unknown) => { select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: Error | null }> } } })
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create profile: ${(error as Error).message}`);
    const profile = this.mapToProfile(data, userId);

    await this.eventBus.publish(new ProfileCreated(
      profile.id, userId, profile.firstName, profile.lastName, profile.relationshipType
    ));

    return profile;
  }

  async getProfile(profileId: string, userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToProfile(data, userId);
  }

  async updateProfile(profileId: string, userId: string, request: UpdateProfileRequest): Promise<Profile> {
    const updates: Record<string, unknown> = {};
    const updatedFields: string[] = [];

    if (request.firstName !== undefined) { updates.first_name = request.firstName; updatedFields.push('firstName'); }
    if (request.lastName !== undefined) { updates.last_name = request.lastName; updatedFields.push('lastName'); }
    if (request.organization !== undefined) { updates.organization = request.organization; updatedFields.push('organization'); }
    if (request.jobTitle !== undefined) { updates.job_title = request.jobTitle; updatedFields.push('jobTitle'); }
    if (request.bio !== undefined) { updates.bio = request.bio; updatedFields.push('bio'); }
    if (request.notes !== undefined) { updates.notes = request.notes; updatedFields.push('notes'); }
    if (request.avatarUrl !== undefined) { updates.avatar_url = request.avatarUrl; updatedFields.push('avatarUrl'); }
    if (request.tags !== undefined) { updates.tags = request.tags; updatedFields.push('tags'); }
    if (request.contactInfo) {
      if (request.contactInfo.email) updates.email = request.contactInfo.email;
      if (request.contactInfo.phone) updates.phone = request.contactInfo.phone;
      if (request.contactInfo.linkedin_url) updates.linkedin_url = request.contactInfo.linkedin_url;
      updatedFields.push('contactInfo');
    }
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    const profile = this.mapToProfile(data, userId);
    await this.eventBus.publish(new ProfileUpdated(profileId, userId, updatedFields));
    return profile;
  }

  async deleteProfile(profileId: string, userId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', profileId);
    if (error) throw new Error(`Failed to delete profile: ${error.message}`);
    await this.eventBus.publish(new ProfileDeleted(profileId, userId));
  }

  async searchProfiles(userId: string, criteria: ProfileSearchCriteria, page = 0, pageSize = 50): Promise<{ profiles: Profile[]; totalCount: number }> {
    const { data, error } = await supabase.rpc('search_contacts_v5', {
      p_user_id: userId,
      p_search_query: criteria.searchQuery || '',
      p_relationship_filter: criteria.relationshipType || null,
      p_favorite_filter: criteria.isFavorite ?? null,
      p_page_offset: page,
      p_page_size: pageSize,
    });

    if (error) throw new Error(`Search failed: ${error.message}`);
    const profiles = (data || []).map((row: unknown) => this.mapToProfile(row as Record<string, unknown>, userId));
    const totalCount = (data as unknown as Array<{ total_count?: number }>)?.[0]?.total_count || 0;
    return { profiles, totalCount };
  }

  async getProfilesByIds(profileIds: string[], userId: string): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').in('id', profileIds);
    if (error) throw new Error(`Failed to fetch profiles: ${error.message}`);
    return (data || []).map(row => this.mapToProfile(row, userId));
  }

  async getFavoriteProfiles(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch favorites: ${error.message}`);
    return (data || []).map(row => this.mapToProfile(row, userId));
  }

  async getRecentProfiles(userId: string, limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to fetch recent profiles: ${error.message}`);
    return (data || []).map(row => this.mapToProfile(row, userId));
  }

  async toggleFavorite(profileId: string, userId: string): Promise<boolean> {
    const { data: current } = await supabase.from('profiles').select('is_favorite').eq('id', profileId).maybeSingle();
    const newState = !(current?.is_favorite || false);

    const { error } = await supabase
      .from('profiles')
      .update({ is_favorite: newState, updated_at: new Date().toISOString() })
      .eq('id', profileId);

    if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
    await this.eventBus.publish(new ProfileFavoriteToggled(profileId, userId, newState));
    return newState;
  }

  async changeStatus(profileId: string, userId: string, newStatus: ProfileStatus): Promise<void> {
    // Note: status column may not exist in all schemas - this is a domain concept
    await this.eventBus.publish(new ProfileStatusChanged(profileId, userId, 'active', newStatus));
  }

  async archiveProfile(profileId: string, userId: string): Promise<void> {
    await this.changeStatus(profileId, userId, 'archived');
    await this.eventBus.publish(new ProfileArchived(profileId, userId));
  }

  async recordInteraction(profileId: string, userId: string, interactionType: string, metadata?: Record<string, unknown>): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', profileId);

    if (error) throw new Error(`Failed to record interaction: ${error.message}`);
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
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(`Failed to get summary: ${error.message}`);

    const profiles = (data || []).map(row => this.mapToProfile(row, userId));

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

  private mapToProfile(row: Record<string, unknown>, userId: string): Profile {
    return Profile.reconstitute({
      id: row.id as string,
      userId: userId,
      firstName: (row.first_name as string) || 'Unknown',
      lastName: row.last_name as string | undefined,
      organization: row.organization as string | undefined,
      jobTitle: row.job_title as string | undefined,
      relationshipType: (row.relationship_type as RelationshipType) || 'unknown',
      status: 'active' as ProfileStatus,
      avatarUrl: row.avatar_url as string | undefined,
      bio: row.bio as string | undefined,
      notes: row.notes as string | undefined,
      tags: (row.tags as string[]) || [],
      isFavorite: (row.is_favorite as boolean) || false,
      contactInfo: {
        email: row.email as string | undefined,
        phone: row.phone as string | undefined,
        linkedin_url: row.linkedin_url as string | undefined,
      },
      metadata: { source: row.source as string | undefined },
      completenessScore: (row.data_richness_score as number) || 0,
      lastInteractionAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
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
