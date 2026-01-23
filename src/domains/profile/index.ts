/**
 * Profile Domain - Public API
 * 
 * This is the only file that should be imported from outside the domain.
 */

// Entities
export { Profile } from './entities/Profile';
export type { 
  ProfileProps, 
  RelationshipType, 
  ProfileStatus, 
  ContactInfo, 
  ProfileMetadata 
} from './entities/Profile';

// Value Objects
export { ContactScore, TrustLevel, ClearanceLevel } from './value-objects/ContactScore';
export type { TrustTier, ClearanceTier } from './value-objects/ContactScore';

// Events
export {
  ProfileCreated,
  ProfileUpdated,
  ProfileEnriched,
  ProfileStatusChanged,
  ProfileArchived,
  ProfileDeleted,
  ProfileRelationshipChanged,
  ProfileFavoriteToggled,
  ProfileInteractionRecorded,
  ProfileTagsModified,
  ProfileMergeRequested,
  ProfilesMerged,
} from './events/ProfileEvents';

// Errors
export { DuplicateProfileError } from './errors/DuplicateProfileError';

// Services
export { ProfileService } from './services/ProfileService';
export type { 
  CreateProfileRequest,
  UpdateProfileRequest,
  ProfileSearchCriteria,
  ProfileSummary,
  EnrichmentResult,
} from './services/ProfileService';

// Hooks
export {
  useProfile,
  useCreateProfile,
  useUpdateProfile,
  useDeleteProfile,
  useSearchProfiles,
  useFavoriteProfiles,
  useRecentProfiles,
  useProfilesByIds,
  useToggleFavorite,
  useChangeProfileStatus,
  useArchiveProfile,
  useRecordInteraction,
  useEnrichProfile,
  useProfileSummary,
  useContactScore,
  useProfiles,
  useProfileDomain,
  profileKeys,
  // New hooks for Contacts page (DDD migration)
  useContactsInfinite,
  useContactCounts,
  useLetterCounts,
  useFilterOptions,
  useToggleFavoriteById,
} from './hooks/useProfileService';

export type { 
  UseProfilesOptions,
  // New types for Contacts page
  ContactsInfiniteOptions,
  ContactCounts,
  LetterCount,
  FilterOptions,
  EnhancedContactRow,
} from './hooks/useProfileService';
