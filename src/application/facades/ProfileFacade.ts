/**
 * Profile Facade - Simplified API for UI
 */

import { ProfileService, ProfileSearchCriteria, ProfileSummary } from '@/domains/profile/services/ProfileService';
import { Profile, RelationshipType } from '@/domains/profile/entities/Profile';
import { ContactScore } from '@/domains/profile/value-objects/ContactScore';

export interface ProfileWithScore {
  profile: Profile;
  contactScore: ContactScore;
}

export interface ProfileDashboardData {
  summary: ProfileSummary;
  topContacts: ProfileWithScore[];
  recentlyUpdated: Profile[];
}

export class ProfileFacade {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  async getProfileWithScore(profileId: string, userId: string): Promise<ProfileWithScore | null> {
    const profile = await this.profileService.getProfile(profileId, userId);
    if (!profile) return null;
    const contactScore = await this.profileService.calculateContactScore(profileId, userId);
    return { profile, contactScore };
  }

  async getDashboardData(userId: string): Promise<ProfileDashboardData> {
    const summary = await this.profileService.getProfileSummary(userId);
    const favorites = await this.profileService.getFavoriteProfiles(userId);

    const topContactsPromises = favorites.slice(0, 10).map(async (profile) => {
      const score = await this.profileService.calculateContactScore(profile.id, userId);
      return { profile, contactScore: score };
    });

    const topContacts = (await Promise.all(topContactsPromises))
      .sort((a, b) => b.contactScore.overallScore - a.contactScore.overallScore);

    return { summary, topContacts, recentlyUpdated: summary.recentlyUpdated };
  }

  async searchProfiles(userId: string, criteria: ProfileSearchCriteria, page = 0, pageSize = 50) {
    return this.profileService.searchProfiles(userId, criteria, page, pageSize);
  }
}

let facadeInstance: ProfileFacade | null = null;
export function getProfileFacade(): ProfileFacade {
  if (!facadeInstance) facadeInstance = new ProfileFacade();
  return facadeInstance;
}
