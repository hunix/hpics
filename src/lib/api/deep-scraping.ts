/**
 * Deep Social Media Scraping API
 * Provides comprehensive data extraction from Instagram and Threads profiles
 */

import { supabase } from '@/integrations/supabase/client';

export interface DeepScrapeOptions {
  useFirecrawl?: boolean;
  includeScreenshot?: boolean;
  maxPosts?: number;
  extractBranding?: boolean;
}

export interface InstagramDeepProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  pronouns: string | null;
  category: string | null;
  isVerified: boolean;
  isPrivate: boolean;
  isBusiness: boolean;
  profilePicUrl: string | null;
  externalUrl: string | null;
  followersCount: number | null;
  followingCount: number | null;
  postsCount: number | null;
  linkedAccounts: string[];
}

export interface InstagramPost {
  postUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  alt: string | null;
  isVideo: boolean;
  isReel: boolean;
  isCarousel: boolean;
  likes: number | null;
  comments: number | null;
  views: number | null;
  hashtags: string[];
  mentions: string[];
  timestamp: string | null;
}

export interface InstagramHighlight {
  name: string;
  coverUrl: string | null;
  itemCount?: number;
}

export interface InstagramDeepScrapeResult {
  success: boolean;
  profile: InstagramDeepProfile;
  recentPosts: InstagramPost[];
  highlights: InstagramHighlight[];
  reels?: InstagramPost[];
  screenshotUrl?: string;
  scrapedAt: string;
  source: 'firecrawl' | 'ai_fallback' | 'extension';
  error?: string;
}

export interface ThreadsDeepProfile {
  handle: string;
  displayName: string | null;
  bio: string | null;
  followersCount: number | null;
  followingCount: number | null;
  isVerified: boolean;
  instagramConnected: boolean;
  profilePicUrl: string | null;
}

export interface ThreadsPost {
  content: string;
  timestamp: string | null;
  likes: number;
  replies: number;
  reposts: number;
  hasMedia: boolean;
  hashtags: string[];
  mentions: string[];
}

export interface ThreadsDeepScrapeResult {
  success: boolean;
  profile: ThreadsDeepProfile;
  recentThreads: ThreadsPost[];
  contentAnalysis: {
    totalThreads: number;
    avgLikes: number;
    avgReplies: number;
    totalEngagement: number;
    topHashtags: Record<string, number>;
    topMentions: Record<string, number>;
    postsWithMedia: number;
  };
  screenshotUrl?: string;
  scrapedAt: string;
  source: 'firecrawl' | 'ai_fallback' | 'extension';
  error?: string;
}

/**
 * Deep scrape an Instagram profile with maximum data extraction
 */
export async function scrapeInstagramDeep(
  url: string,
  options: DeepScrapeOptions = {}
): Promise<InstagramDeepScrapeResult> {
  const { data, error } = await supabase.functions.invoke('scrape-instagram-deep', {
    body: {
      url,
      options: {
        useFirecrawl: options.useFirecrawl ?? true,
        includeScreenshot: options.includeScreenshot ?? false,
        maxPosts: options.maxPosts ?? 50,
        extractBranding: options.extractBranding ?? false,
      },
    },
  });

  if (error) {
    console.error('Instagram deep scrape error:', error);
    return {
      success: false,
      profile: {} as InstagramDeepProfile,
      recentPosts: [],
      highlights: [],
      scrapedAt: new Date().toISOString(),
      source: 'firecrawl',
      error: error.message,
    };
  }

  return data;
}

/**
 * Deep scrape a Threads profile with maximum data extraction
 */
export async function scrapeThreadsDeep(
  url: string,
  options: DeepScrapeOptions = {}
): Promise<ThreadsDeepScrapeResult> {
  const { data, error } = await supabase.functions.invoke('scrape-threads-deep', {
    body: {
      url,
      options: {
        useFirecrawl: options.useFirecrawl ?? true,
        includeScreenshot: options.includeScreenshot ?? false,
        maxPosts: options.maxPosts ?? 50,
      },
    },
  });

  if (error) {
    console.error('Threads deep scrape error:', error);
    return {
      success: false,
      profile: {} as ThreadsDeepProfile,
      recentThreads: [],
      contentAnalysis: {
        totalThreads: 0,
        avgLikes: 0,
        avgReplies: 0,
        totalEngagement: 0,
        topHashtags: {},
        topMentions: {},
        postsWithMedia: 0,
      },
      scrapedAt: new Date().toISOString(),
      source: 'firecrawl',
      error: error.message,
    };
  }

  return data;
}

/**
 * Detect the platform from a URL and route to the appropriate scraper
 */
export async function deepScrapeByUrl(
  url: string,
  options: DeepScrapeOptions = {}
): Promise<InstagramDeepScrapeResult | ThreadsDeepScrapeResult | null> {
  const normalizedUrl = url.toLowerCase();

  if (normalizedUrl.includes('instagram.com')) {
    return scrapeInstagramDeep(url, options);
  }

  if (normalizedUrl.includes('threads.net')) {
    return scrapeThreadsDeep(url, options);
  }

  console.warn('Unsupported platform for deep scraping:', url);
  return null;
}

/**
 * Extract username from Instagram or Threads URL
 */
export function extractUsername(url: string): string | null {
  const instagramMatch = url.match(/instagram\.com\/([^/?]+)/);
  if (instagramMatch) return instagramMatch[1];

  const threadsMatch = url.match(/threads\.net\/@?([^/?]+)/);
  if (threadsMatch) return threadsMatch[1];

  return null;
}

/**
 * Format engagement numbers for display
 */
export function formatEngagement(num: number | null): string {
  if (num === null || num === undefined) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
