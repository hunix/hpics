/**
 * Supabase Profile Repository Implementation
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  IProfileRepository, 
  ProfileQueryOptions, 
  ContactCounts, 
  LetterCount, 
  FilterOptions,
  EnhancedContactRow 
} from '@/domains/profile/repositories/IProfileRepository';
import { Profile, RelationshipType, ProfileStatus, ProfileProps } from '@/domains/profile/entities/Profile';
import { QuerySpec, PaginatedResult } from '@/domains/shared/repositories/BaseRepository';

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return this.mapToProfile(data);
  }

  async findAll(): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async findBySpec(spec: QuerySpec<Profile>): Promise<PaginatedResult<Profile>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;
    const { data, error, count } = await this.supabase.from('profiles').select('*', { count: 'exact' }).range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    const totalCount = count || 0;
    return { items: (data || []).map(row => this.mapToProfile(row)), totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize), hasNextPage: (page + 1) * pageSize < totalCount, hasPreviousPage: page > 0 };
  }

  async save(entity: Profile): Promise<Profile> {
    const row = this.mapToRow(entity);
    const { data, error } = await this.supabase.from('profiles').upsert(row).select().single();
    if (error) throw error;
    return this.mapToProfile(data);
  }

  async saveMany(entities: Profile[]): Promise<Profile[]> {
    const rows = entities.map(e => this.mapToRow(e));
    const { data, error } = await this.supabase.from('profiles').upsert(rows).select();
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await this.supabase.from('profiles').delete().in('id', ids);
    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const { data } = await this.supabase.from('profiles').select('id').eq('id', id).maybeSingle();
    return !!data;
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase.from('profiles').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }

  async findByUserId(userId: string): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async findByUserIdAndSpec(userId: string, spec: QuerySpec<Profile>): Promise<PaginatedResult<Profile>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;
    const { data, error, count } = await this.supabase.from('profiles').select('*', { count: 'exact' }).eq('user_id', userId).range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    const totalCount = count || 0;
    return { items: (data || []).map(row => this.mapToProfile(row)), totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize), hasNextPage: (page + 1) * pageSize < totalCount, hasPreviousPage: page > 0 };
  }

  async findByIdForUser(id: string, userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error || !data) return null;
    return this.mapToProfile(data);
  }

  async findFavorites(userId: string): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('user_id', userId).eq('is_favorite', true).order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async findByRelationshipType(userId: string, relationshipType: string): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('user_id', userId).eq('relationship_type', relationshipType);
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async searchProfiles(userId: string, options: ProfileQueryOptions, spec?: QuerySpec<Profile>): Promise<PaginatedResult<Profile>> {
    const page = spec?.pagination?.page || 0;
    const pageSize = spec?.pagination?.pageSize || 50;
    const { data, error } = await (this.supabase.rpc as any)('search_contacts_v5', {
      p_user_id: userId,
      p_search_query: options.searchTerm || null,
      p_relationship_type: options.relationshipType || null,
      p_relationship_subtype: options.relationshipSubtype || null,
      p_tag: options.tag || null,
      p_is_favorite: options.isFavorite || null,
      p_is_active: options.isActive ?? null,
      p_first_letter: options.firstLetter || null,
      p_sort_by: options.sortBy || 'name',
      p_sort_order: options.sortOrder || 'asc',
      p_limit: pageSize,
      p_offset: page * pageSize,
    });
    if (error) throw error;
    const profiles = (data || []).map((row: Record<string, unknown>) => this.mapToProfile(row));
    const totalCount = (data as Array<{ total_count?: number }>)?.[0]?.total_count || profiles.length;
    return { items: profiles, totalCount, page, pageSize, totalPages: Math.ceil(totalCount / pageSize), hasNextPage: profiles.length === pageSize, hasPreviousPage: page > 0 };
  }

  async searchContactsV5(
    userId: string,
    options: ProfileQueryOptions,
    limit: number,
    offset: number
  ): Promise<{ contacts: EnhancedContactRow[]; totalCount: number }> {
    const { data, error } = await (this.supabase.rpc as any)('search_contacts_v5', {
      p_user_id: userId,
      p_search_query: options.searchTerm || null,
      p_relationship_type: options.relationshipType || null,
      p_relationship_subtype: options.relationshipSubtype || null,
      p_tag: options.tag || null,
      p_is_favorite: options.isFavorite || null,
      p_is_active: options.isActive ?? null,
      p_first_letter: options.firstLetter || null,
      p_sort_by: options.sortBy || 'name',
      p_sort_order: options.sortOrder || 'asc',
      p_limit: limit,
      p_offset: offset,
    });
    if (error) throw error;
    const contacts = (data || []) as EnhancedContactRow[];
    const totalCount = contacts[0]?.total_count ?? 0;
    return { contacts, totalCount };
  }

  async updateFavoriteStatus(profileId: string, userId: string, isFavorite: boolean): Promise<void> {
    const { error } = await this.supabase.from('profiles').update({ is_favorite: isFavorite, updated_at: new Date().toISOString() }).eq('id', profileId).eq('user_id', userId);
    if (error) throw error;
  }

  async updateActiveStatus(profileId: string, userId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase.from('profiles').update({ is_active: isActive, updated_at: new Date().toISOString() }).eq('id', profileId).eq('user_id', userId);
    if (error) throw error;
  }

  async countByUser(userId: string): Promise<number> {
    const { count, error } = await this.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) throw error;
    return count || 0;
  }

  async findRecentlyUpdated(userId: string, limit = 10): Promise<Profile[]> {
    const { data, error } = await this.supabase.from('profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async getContactCounts(userId: string): Promise<ContactCounts> {
    const { data, error } = await this.supabase.rpc('get_contact_counts', { p_user_id: userId });
    if (error) throw error;
    const result = data?.[0] || { active_count: 0, inactive_count: 0, total_count: 0 };
    return {
      active: Number(result.active_count) || 0,
      inactive: Number(result.inactive_count) || 0,
      total: Number(result.total_count) || 0,
    };
  }

  async getLetterCounts(userId: string): Promise<LetterCount[]> {
    const { data, error } = await this.supabase.rpc('get_contact_letter_counts', { p_user_id: userId });
    if (error) throw error;
    return (data || []) as LetterCount[];
  }

  async getFilterOptions(userId: string): Promise<FilterOptions> {
    const { data, error } = await this.supabase.rpc('get_contact_filter_options', { p_user_id: userId });
    if (error) throw error;
    const result = data?.[0] || { relationships: [], subtypes: [], tags: [] };
    return {
      relationships: (result.relationships || []) as string[],
      subtypes: (result.subtypes || []) as string[],
      tags: (result.tags || []) as string[],
    };
  }

  async findByIds(ids: string[], userId: string): Promise<Profile[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.supabase.from('profiles').select('*').eq('user_id', userId).in('id', ids);
    if (error) throw error;
    return (data || []).map(row => this.mapToProfile(row));
  }

  async findDuplicate(userId: string, firstName: string, lastName?: string): Promise<{ id: string; firstName: string; lastName?: string } | null> {
    const { data, error } = await this.supabase.rpc('find_duplicate_profile', {
      p_user_id: userId,
      p_first_name: firstName,
      p_last_name: lastName || null,
    });
    if (error) throw error;
    const result = (data as unknown as Array<{ id: string; first_name: string; last_name?: string }>)?.[0];
    if (!result) return null;
    return { id: result.id, firstName: result.first_name, lastName: result.last_name };
  }

  private mapToProfile(row: Record<string, unknown>): Profile {
    return Profile.reconstitute({
      id: row.id as string,
      userId: (row.user_id as string) || '',
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
      // Note: email/phone come from contact_methods table, not profiles
      contactInfo: { linkedin_url: row.linkedin_url as string | undefined },
      metadata: {},
      completenessScore: (row.data_richness_score as number) || 0,
      lastInteractionAt: row.updated_at ? new Date(row.updated_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    });
  }

  private mapToRow(profile: Profile): Record<string, unknown> {
    const props = (profile as unknown as { _props: ProfileProps })._props;
    return {
      id: profile.id, user_id: props.userId, first_name: props.firstName, last_name: props.lastName,
      organization: props.organization, job_title: props.jobTitle, relationship_type: props.relationshipType,
      avatar_url: props.avatarUrl, bio: props.bio, notes: props.notes, tags: props.tags,
      is_favorite: props.isFavorite, linkedin_url: props.contactInfo.linkedin_url,
      updated_at: new Date().toISOString(),
    };
  }
}
