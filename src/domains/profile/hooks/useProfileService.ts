/**
 * Profile Domain Hooks
 * 
 * React hooks for consuming Profile domain services.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { 
  ProfileService, 
  CreateProfileRequest, 
  UpdateProfileRequest,
  ProfileSearchCriteria,
} from '../services/ProfileService';
import { Profile, RelationshipType, ProfileStatus } from '../entities/Profile';

import { getContainer, ServiceKeys } from '@/infrastructure/di/Container';

// Get ProfileService from DI container
function getProfileService(): ProfileService {
  return getContainer().resolve<ProfileService>(ServiceKeys.ProfileService);
}

// ============================================
// Query Keys
// ============================================

export const profileKeys = {
  all: ['profiles'] as const,
  lists: () => [...profileKeys.all, 'list'] as const,
  list: (criteria: ProfileSearchCriteria) => [...profileKeys.lists(), criteria] as const,
  details: () => [...profileKeys.all, 'detail'] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  favorites: () => [...profileKeys.all, 'favorites'] as const,
  recent: () => [...profileKeys.all, 'recent'] as const,
  summary: () => [...profileKeys.all, 'summary'] as const,
  score: (id: string) => [...profileKeys.all, 'score', id] as const,
};

// ============================================
// Single Profile Hooks
// ============================================

export function useProfile(profileId: string | undefined) {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: profileKeys.detail(profileId || ''),
    queryFn: () => service.getProfile(profileId!, user!.id),
    enabled: !!profileId && !!user?.id,
  });
}

export function useCreateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: (request: CreateProfileRequest) => 
      service.createProfile(user!.id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdateProfile(profileId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: (request: UpdateProfileRequest) =>
      service.updateProfile(profileId, user!.id, request),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileKeys.detail(profileId), updatedProfile);
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

export function useDeleteProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: (profileId: string) => 
      service.deleteProfile(profileId, user!.id),
    onSuccess: (_, profileId) => {
      queryClient.removeQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

// ============================================
// Search & List Hooks
// ============================================

export function useSearchProfiles(
  criteria: ProfileSearchCriteria,
  page = 0,
  pageSize = 50
) {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: [...profileKeys.list(criteria), page, pageSize],
    queryFn: () => service.searchProfiles(user!.id, criteria, page, pageSize),
    enabled: !!user?.id,
    placeholderData: (prev) => prev,
  });
}

export function useFavoriteProfiles() {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: profileKeys.favorites(),
    queryFn: () => service.getFavoriteProfiles(user!.id),
    enabled: !!user?.id,
  });
}

export function useRecentProfiles(limit = 10) {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: profileKeys.recent(),
    queryFn: () => service.getRecentProfiles(user!.id, limit),
    enabled: !!user?.id,
  });
}

export function useProfilesByIds(profileIds: string[]) {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: [...profileKeys.all, 'byIds', profileIds],
    queryFn: () => service.getProfilesByIds(profileIds, user!.id),
    enabled: !!user?.id && profileIds.length > 0,
  });
}

// ============================================
// Action Hooks
// ============================================

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: (profileId: string) => 
      service.toggleFavorite(profileId, user!.id),
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.favorites() });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

export function useChangeProfileStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: ({ profileId, status }: { profileId: string; status: ProfileStatus }) =>
      service.changeStatus(profileId, user!.id, status),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
    },
  });
}

export function useArchiveProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: (profileId: string) =>
      service.archiveProfile(profileId, user!.id),
    onSuccess: (_, profileId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useRecordInteraction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: ({ 
      profileId, 
      interactionType, 
      metadata 
    }: { 
      profileId: string; 
      interactionType: string;
      metadata?: Record<string, unknown>;
    }) => service.recordInteraction(profileId, user!.id, interactionType, metadata),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.recent() });
    },
  });
}

// ============================================
// Enrichment Hooks
// ============================================

export function useEnrichProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const service = getProfileService();

  return useMutation({
    mutationFn: ({ profileId, source }: { profileId: string; source: string }) =>
      service.enrichProfile(profileId, user!.id, source),
    onSuccess: (_, { profileId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(profileId) });
      queryClient.invalidateQueries({ queryKey: profileKeys.summary() });
    },
  });
}

// ============================================
// Analytics Hooks
// ============================================

export function useProfileSummary() {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: profileKeys.summary(),
    queryFn: () => service.getProfileSummary(user!.id),
    enabled: !!user?.id,
    staleTime: 30000, // 30 seconds
  });
}

export function useContactScore(profileId: string) {
  const { user } = useAuth();
  const service = getProfileService();

  return useQuery({
    queryKey: profileKeys.score(profileId),
    queryFn: () => service.calculateContactScore(profileId, user!.id),
    enabled: !!user?.id && !!profileId,
  });
}

// ============================================
// Composite Hook
// ============================================

export interface UseProfilesOptions {
  searchQuery?: string;
  relationshipFilter?: RelationshipType;
  favoriteFilter?: boolean;
  page?: number;
  pageSize?: number;
}

export function useProfiles(options: UseProfilesOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const criteria: ProfileSearchCriteria = {
    searchQuery: options.searchQuery,
    relationshipType: options.relationshipFilter,
    isFavorite: options.favoriteFilter,
  };

  const searchQuery = useSearchProfiles(criteria, options.page, options.pageSize);
  const toggleFavorite = useToggleFavorite();
  const deleteProfile = useDeleteProfile();
  const createProfile = useCreateProfile();
  const archiveProfile = useArchiveProfile();

  return {
    // Data
    profiles: searchQuery.data?.profiles || [],
    totalCount: searchQuery.data?.totalCount || 0,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,

    // Actions
    toggleFavorite: toggleFavorite.mutateAsync,
    deleteProfile: deleteProfile.mutateAsync,
    createProfile: createProfile.mutateAsync,
    archiveProfile: archiveProfile.mutateAsync,

    // Utilities
    refetch: searchQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: profileKeys.all }),
  };
}

/**
 * Main hook for Profile domain - provides access to all profile operations
 */
export function useProfileDomain() {
  const { user } = useAuth();
  const service = getProfileService();

  return {
    service,
    userId: user?.id,
    isAuthenticated: !!user,
  };
}
