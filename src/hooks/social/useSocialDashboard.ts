import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SocialProfile {
  id: string;
  avatar_url: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  linkedin_handle: string | null;
  tiktok_handle: string | null;
  instagram_followers: number | null;
  twitter_followers: number | null;
  tiktok_followers: number | null;
  last_enriched_at: string | null;
}

export interface SocialStats {
  totalPosts: number;
  totalConnections: number;
  totalCost: number;
  totalJobs: number;
}

export function useProfilesWithSocial() {
  const { user } = useAuth();
  return useQuery<SocialProfile[]>({
    queryKey: ['profiles-with-social', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, avatar_url, instagram_handle, twitter_handle, linkedin_handle, tiktok_handle, instagram_followers, twitter_followers, tiktok_followers, last_enriched_at')
        .order('last_enriched_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return ((data as SocialProfile[]) ?? []).filter(
        (p) => p.instagram_handle || p.twitter_handle || p.linkedin_handle || p.tiktok_handle
      );
    },
  });
}

export function useRecentScrapeJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recent-scrape-jobs', user?.id],
    enabled: !!user,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_scrape_jobs')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSocialStats() {
  const { user } = useAuth();
  return useQuery<SocialStats>({
    queryKey: ['social-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [postsResult, connectionsResult, jobsResult] = await Promise.all([
        supabase.from('social_posts').select('id', { count: 'exact', head: true }),
        supabase.from('social_connections').select('id', { count: 'exact', head: true }),
        supabase.from('social_scrape_jobs').select('cost_cents').eq('status', 'completed'),
      ]);

      const totalCost = (jobsResult.data ?? []).reduce(
        (sum, j) => sum + (j.cost_cents || 0),
        0
      );

      return {
        totalPosts: postsResult.count ?? 0,
        totalConnections: connectionsResult.count ?? 0,
        totalCost: totalCost / 100,
        totalJobs: jobsResult.data?.length ?? 0,
      };
    },
  });
}
