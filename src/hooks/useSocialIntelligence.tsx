import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  scrapeComprehensiveSocial, 
  getProfilePosts, 
  getProfileConnections,
  getScrapeJobs,
  calculateEngagementMetrics,
  scheduleRecurringScrape,
  type ScrapeOptions,
  type SocialPlatform,
  type SocialPost,
  type SocialConnection,
  type ScrapeJob,
} from '@/lib/api/comprehensive-social';
import { toast } from 'sonner';

/**
 * Hook to fetch and manage social posts for a profile
 */
export function useSocialPosts(profileId: string | undefined, platform?: SocialPlatform) {
  return useQuery({
    queryKey: ['social-posts', profileId, platform],
    queryFn: () => getProfilePosts(profileId!, platform),
    enabled: !!profileId,
  });
}

/**
 * Hook to fetch social connections for a profile
 */
export function useSocialConnections(
  profileId: string | undefined, 
  connectionType?: 'follower' | 'following' | 'mutual'
) {
  return useQuery({
    queryKey: ['social-connections', profileId, connectionType],
    queryFn: () => getProfileConnections(profileId!, connectionType),
    enabled: !!profileId,
  });
}

export { type SocialPost, type SocialConnection, type ScrapeJob } from '@/lib/api/comprehensive-social';

/**
 * Hook to fetch scrape jobs
 */
export function useScrapeJobs(profileId?: string) {
  return useQuery({
    queryKey: ['scrape-jobs', profileId],
    queryFn: () => getScrapeJobs(profileId),
    refetchInterval: 5000, // Poll every 5 seconds for running jobs
  });
}

/**
 * Hook to calculate engagement metrics
 */
export function useEngagementMetrics(profileId: string | undefined) {
  return useQuery({
    queryKey: ['engagement-metrics', profileId],
    queryFn: () => calculateEngagementMetrics(profileId!),
    enabled: !!profileId,
  });
}

/**
 * Hook to trigger a comprehensive social scrape
 */
export function useComprehensiveScrape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options: ScrapeOptions) => scrapeComprehensiveSocial(options),
    onSuccess: (data) => {
      toast.success(`Scraped ${data.itemsScraped} items from ${data.platform}`, {
        description: `Cost: $${(data.estimatedCostCents / 100).toFixed(2)}`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
      queryClient.invalidateQueries({ queryKey: ['scrape-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['engagement-metrics'] });
    },
    onError: (error: Error) => {
      toast.error('Scrape failed', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to schedule recurring scrapes
 */
export function useScheduleRecurringScrape() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, platform, username, interval }: {
      profileId: string;
      platform: SocialPlatform;
      username: string;
      interval: 'hourly' | 'daily' | 'weekly';
    }) => scheduleRecurringScrape(profileId, platform, username, interval),
    onSuccess: (_, variables) => {
      toast.success('Recurring scrape scheduled', {
        description: `Will run ${variables.interval}`,
      });
      queryClient.invalidateQueries({ queryKey: ['scrape-jobs'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to schedule scrape', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook to get social intelligence summary for a profile
 */
export function useSocialIntelligenceSummary(profileId: string | undefined) {
  const { data: posts, isLoading: postsLoading } = useSocialPosts(profileId);
  const { data: followers, isLoading: followersLoading } = useSocialConnections(profileId, 'follower');
  const { data: following, isLoading: followingLoading } = useSocialConnections(profileId, 'following');
  const { data: metrics, isLoading: metricsLoading } = useEngagementMetrics(profileId);

  const isLoading = postsLoading || followersLoading || followingLoading || metricsLoading;

  const summary = {
    posts: posts || [],
    followers: followers || [],
    following: following || [],
    metrics: metrics || {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalViews: 0,
      avgEngagementRate: 0,
      topHashtags: [],
      postingFrequency: 'No data',
      bestPerformingPost: null,
    },
    // Calculate mutual connections
    mutualConnections: (() => {
      if (!followers || !following) return [];
      const followerUsernames = new Set(followers.map(f => f.connected_username));
      return following.filter(f => followerUsernames.has(f.connected_username));
    })(),
    // Platform breakdown
    platformBreakdown: (() => {
      if (!posts) return {};
      return posts.reduce((acc, post) => {
        acc[post.platform] = (acc[post.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    })(),
  };

  return {
    data: summary,
    isLoading,
  };
}