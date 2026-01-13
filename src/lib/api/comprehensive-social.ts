import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'threads';
export type ScrapeType = 'full' | 'posts' | 'comments' | 'followers' | 'following' | 'likers';

export interface ScrapeOptions {
  profileId: string;
  platform: SocialPlatform;
  username: string;
  scrapeType: ScrapeType;
  postId?: string;
  maxItems?: number;
  cursor?: string;
}

export interface ScrapeResult {
  success: boolean;
  jobId?: string;
  platform: string;
  scrapeType: string;
  itemsScraped: number;
  estimatedCostCents: number;
  durationMs: number;
  results: {
    profile?: Record<string, unknown>;
    posts?: Record<string, unknown>[];
    comments?: Record<string, unknown>[];
    followers?: Record<string, unknown>[];
    following?: Record<string, unknown>[];
    likers?: Record<string, unknown>[];
  };
}

export interface SocialPost {
  id: string;
  platform: string;
  post_id: string;
  post_url: string | null;
  content: string | null;
  media_urls: string[];
  media_type: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  posted_at: string | null;
  hashtags: string[];
  mentions: string[];
  engagement_rate: number | null;
  sentiment_score: number | null;
}

export interface SocialConnection {
  id: string;
  platform: string;
  connection_type: string;
  connected_username: string;
  connected_display_name: string | null;
  connected_avatar_url: string | null;
  connected_verified: boolean;
  connected_followers_count: number | null;
  relationship_strength: number | null;
}

export interface ScrapeJob {
  id: string;
  user_id: string;
  profile_id: string | null;
  platform: string;
  scrape_type: string;
  status: string;
  provider: string | null;
  items_scraped: number;
  items_total: number | null;
  recurrence_interval: string | null;
  is_recurring: boolean;
  error_message: string | null;
  cost_cents: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

/**
 * Trigger a comprehensive social media scrape
 */
export async function scrapeComprehensiveSocial(options: ScrapeOptions): Promise<ScrapeResult> {
  const { data, error } = await supabase.functions.invoke('scrape-comprehensive-social', {
    body: options,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as ScrapeResult;
}

/**
 * Get all posts for a profile
 */
export async function getProfilePosts(profileId: string, platform?: SocialPlatform): Promise<SocialPost[]> {
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('profile_id', profileId)
    .order('posted_at', { ascending: false });

  if (platform) {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SocialPost[];
}

/**
 * Get comments for a specific post
 */
export async function getPostComments(postId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('social_comments')
    .select('*')
    .eq('post_id', postId)
    .order('commented_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get likers for a specific post
 */
export async function getPostLikers(postId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase
    .from('social_likers')
    .select('*')
    .eq('post_id', postId);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Get connections (followers/following) for a profile
 */
export async function getProfileConnections(
  profileId: string, 
  connectionType?: 'follower' | 'following' | 'mutual'
): Promise<SocialConnection[]> {
  let query = supabase
    .from('social_connections')
    .select('*')
    .eq('profile_id', profileId)
    .order('connected_followers_count', { ascending: false, nullsFirst: false });

  if (connectionType) {
    query = query.eq('connection_type', connectionType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as SocialConnection[];
}

/**
 * Get scrape jobs for a profile
 */
export async function getScrapeJobs(profileId?: string): Promise<ScrapeJob[]> {
  let query = supabase
    .from('social_scrape_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (profileId) {
    query = query.eq('profile_id', profileId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as ScrapeJob[];
}

/**
 * Schedule a recurring scrape job
 */
export async function scheduleRecurringScrape(
  profileId: string,
  platform: SocialPlatform,
  _username: string,
  interval: 'hourly' | 'daily' | 'weekly'
): Promise<ScrapeJob> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('social_scrape_jobs')
    .insert([{
      user_id: user.id,
      profile_id: profileId,
      platform,
      scrape_type: 'full',
      status: 'pending',
      is_recurring: true,
      recurrence_interval: interval,
      scheduled_for: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ScrapeJob;
}

/**
 * Calculate engagement metrics for a profile's social posts
 */
export async function calculateEngagementMetrics(profileId: string): Promise<{
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  avgEngagementRate: number;
  topHashtags: Array<{ tag: string; count: number }>;
  postingFrequency: string;
  bestPerformingPost: SocialPost | null;
}> {
  const posts = await getProfilePosts(profileId);

  if (posts.length === 0) {
    return {
      totalPosts: 0,
      totalLikes: 0,
      totalComments: 0,
      totalViews: 0,
      avgEngagementRate: 0,
      topHashtags: [],
      postingFrequency: 'No data',
      bestPerformingPost: null,
    };
  }

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);

  // Calculate hashtag frequency
  const hashtagCounts: Record<string, number> = {};
  posts.forEach(post => {
    (post.hashtags || []).forEach(tag => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });

  const topHashtags = Object.entries(hashtagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate posting frequency
  const sortedPosts = posts.filter(p => p.posted_at).sort((a, b) => 
    new Date(a.posted_at!).getTime() - new Date(b.posted_at!).getTime()
  );
  
  let postingFrequency = 'Unknown';
  if (sortedPosts.length >= 2) {
    const first = new Date(sortedPosts[0].posted_at!);
    const last = new Date(sortedPosts[sortedPosts.length - 1].posted_at!);
    const days = (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24);
    const postsPerDay = sortedPosts.length / Math.max(days, 1);
    
    if (postsPerDay >= 1) {
      postingFrequency = `${postsPerDay.toFixed(1)} posts/day`;
    } else if (postsPerDay >= 0.14) {
      postingFrequency = `${(postsPerDay * 7).toFixed(1)} posts/week`;
    } else {
      postingFrequency = `${(postsPerDay * 30).toFixed(1)} posts/month`;
    }
  }

  // Find best performing post
  const bestPerformingPost = posts.reduce((best, current) => {
    const currentScore = (current.likes_count || 0) + (current.comments_count || 0) * 2;
    const bestScore = (best.likes_count || 0) + (best.comments_count || 0) * 2;
    return currentScore > bestScore ? current : best;
  }, posts[0]);

  // Average engagement rate
  const avgEngagementRate = posts.length > 0
    ? posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length
    : 0;

  return {
    totalPosts: posts.length,
    totalLikes,
    totalComments,
    totalViews,
    avgEngagementRate,
    topHashtags,
    postingFrequency,
    bestPerformingPost,
  };
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): SocialPlatform | null {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.includes('instagram.com')) return 'instagram';
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'twitter';
  if (lowercaseUrl.includes('tiktok.com')) return 'tiktok';
  if (lowercaseUrl.includes('linkedin.com')) return 'linkedin';
  if (lowercaseUrl.includes('threads.net')) return 'threads';
  
  return null;
}

/**
 * Extract username from social media URL
 */
export function extractUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove leading/trailing slashes and split
    const parts = pathname.replace(/^\/|\/$/g, '').split('/');
    
    if (parts.length === 0 || !parts[0]) return null;
    
    // For most platforms, username is the first path segment
    // Skip common non-username segments
    const skipSegments = ['p', 'reel', 'stories', 'status', 'posts', 'in', 'pub'];
    
    if (skipSegments.includes(parts[0].toLowerCase())) {
      return parts[1] || null;
    }
    
    return parts[0].replace('@', '');
  } catch {
    return null;
  }
}