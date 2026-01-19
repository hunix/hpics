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
 * Profile-specific query options
 */
export interface ProfileQueryOptions {
  includeInactive?: boolean;
  includeFavorites?: boolean;
  relationshipType?: string;
  searchTerm?: string;
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
}
