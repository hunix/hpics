/**
 * Profile Repository Interface - DDD Repository Contract
 * 
 * Defines the contract for profile data persistence operations.
 * Concrete implementations will handle the actual database interaction.
 */

import { Profile } from '../entities/Profile';
import { 
  IUserScopedRepository, 
  QuerySpec, 
  PaginatedResult 
} from '@/domains/shared/repositories/BaseRepository';

/**
 * Profile-specific query options (extended for full search support)
 */
export interface ProfileQueryOptions {
  includeInactive?: boolean;
  includeFavorites?: boolean;
  relationshipType?: string;
  relationshipSubtype?: string;
  tag?: string;
  isFavorite?: boolean;
  isActive?: boolean | null;
  firstLetter?: string;
  searchTerm?: string;
  sortBy?: 'name' | 'recent' | 'oldest' | 'organization' | 'relationship' | 'engagement';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Contact counts for active/inactive/total
 */
export interface ContactCounts {
  active: number;
  inactive: number;
  total: number;
}

/**
 * Letter count for alphabetical sidebar
 */
export interface LetterCount {
  letter: string;
  count: number;
}

/**
 * Filter options available for the user's contacts
 */
export interface FilterOptions {
  relationships: string[];
  subtypes: string[];
  tags: string[];
}

/**
 * Enhanced contact result from RPC (matches search_contacts_v5 output)
 */
export interface EnhancedContactRow {
  id: string;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  relationship_type: string | null;
  relationship_subtype: string | null;
  hierarchy_level: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  country: string | null;
  last_interaction_at: string | null;
  engagement_score: number;
  total_count: number;
}

/**
 * Profile Repository Interface
 * 
 * Extends the user-scoped repository with profile-specific operations.
 */
export interface IProfileRepository extends IUserScopedRepository<Profile, string> {
  /**
   * Find a profile by ID for a specific user
   */
  findByIdForUser(id: string, userId: string): Promise<Profile | null>;

  /**
   * Find all favorite profiles for a user
   */
  findFavorites(userId: string): Promise<Profile[]>;

  /**
   * Find profiles by relationship type
   */
  findByRelationshipType(userId: string, relationshipType: string): Promise<Profile[]>;

  /**
   * Search profiles with filters
   */
  searchProfiles(
    userId: string,
    options: ProfileQueryOptions,
    spec?: QuerySpec<Profile>
  ): Promise<PaginatedResult<Profile>>;

  /**
   * Search contacts with full filter support (via RPC)
   * Returns raw row data for infinite scroll support
   */
  searchContactsV5(
    userId: string,
    options: ProfileQueryOptions,
    limit: number,
    offset: number
  ): Promise<{ contacts: EnhancedContactRow[]; totalCount: number }>;

  /**
   * Update favorite status
   */
  updateFavoriteStatus(profileId: string, userId: string, isFavorite: boolean): Promise<void>;

  /**
   * Update active status
   */
  updateActiveStatus(profileId: string, userId: string, isActive: boolean): Promise<void>;

  /**
   * Get profile count for a user
   */
  countByUser(userId: string): Promise<number>;

  /**
   * Get recently updated profiles
   */
  findRecentlyUpdated(userId: string, limit?: number): Promise<Profile[]>;

  /**
   * Get contact counts (active, inactive, total)
   */
  getContactCounts(userId: string): Promise<ContactCounts>;

  /**
   * Get letter counts for alphabetical sidebar
   */
  getLetterCounts(userId: string): Promise<LetterCount[]>;

  /**
   * Get available filter options for the user's contacts
   */
  getFilterOptions(userId: string): Promise<FilterOptions>;

  /**
   * Find a duplicate profile by name (for deduplication guard)
   * Uses the database function find_duplicate_profile
   */
  findDuplicate(userId: string, firstName: string, lastName?: string): Promise<{ id: string; firstName: string; lastName?: string } | null>;
}
