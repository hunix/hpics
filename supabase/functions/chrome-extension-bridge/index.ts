import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============== Enhanced Type Definitions ==============

type SupportedPlatform = 
  | 'instagram' | 'threads' | 'twitter' | 'linkedin' | 'facebook' 
  | 'tiktok' | 'youtube' | 'reddit' | 'pinterest' | 'github' 
  | 'medium' | 'snapchat' | 'discord' | 'bluesky' | 'mastodon';

type ScrapeAction = 
  | 'ping' | 'scrape_profile' | 'scrape_posts' | 'scrape_comments' 
  | 'scrape_likes' | 'bulk_scrape' | 'scrape_connections' 
  | 'scrape_media' | 'scrape_stories' | 'scrape_reels'
  | 'incremental_update'
  // Deep scraping actions
  | 'deep_profile_scrape' | 'scrape_all_posts' | 'scrape_tagged'
  | 'scrape_engagement' | 'scrape_connections_deep';

interface EnhancedPost {
  id: string;
  content: string;
  contentHtml?: string;
  mediaUrls: string[];
  mediaTypes: ('image' | 'video' | 'carousel' | 'reel' | 'story' | 'audio')[];
  thumbnailUrl?: string;
  // Engagement
  likes: number;
  comments: number;
  shares?: number;
  saves?: number;
  views?: number;
  reposts?: number;
  // Metadata
  timestamp: string;
  location?: string;
  isSponsored: boolean;
  isPinned: boolean;
  isCollab?: boolean;
  // Extracted data
  hashtags: string[];
  mentions: string[];
  urls: string[];
  // AI analysis placeholders
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  topics?: string[];
  emotions?: string[];
  language?: string;
}

interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  duration?: number;
  viewCount?: number;
  mentions?: string[];
  hashtags?: string[];
  location?: string;
  music?: { name: string; artist: string };
}

interface HighlightGroup {
  id: string;
  name: string;
  coverUrl: string;
  itemCount: number;
  items: StoryItem[];
}

interface EnhancedSocialData {
  // Profile Data
  profile: {
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string;
    bannerUrl?: string;
    joinDate?: string;
    location?: string;
    website?: string;
    email?: string;
    isVerified: boolean;
    isPrivate: boolean;
    isBusiness?: boolean;
    isCreator?: boolean;
    badges?: string[];
    pronouns?: string;
    category?: string;
    externalLinks?: { label: string; url: string }[];
  };
  // Statistics
  stats: {
    followers: number;
    following: number;
    posts: number;
    likes?: number;
    views?: number;
    subscribers?: number;
    mutualConnections?: number;
    karma?: number; // Reddit
    stars?: number; // GitHub
    contributions?: number; // GitHub
    repositories?: number; // GitHub
    claps?: number; // Medium
    pins?: number; // Pinterest
    boards?: number; // Pinterest
  };
  // Content
  posts: EnhancedPost[];
  stories?: StoryItem[];
  reels?: EnhancedPost[];
  highlights?: HighlightGroup[];
  pinned?: EnhancedPost[];
  // Relationships
  connections: {
    mutualFollowers?: string[];
    taggedWith?: string[];
    mentionedBy?: string[];
    collaborators?: string[];
    frequentCommenters?: string[];
    topLikers?: string[];
  };
  // Derived Intelligence (computed by AI)
  intelligence: {
    topics: string[];
    hashtags: string[];
    mentions: string[];
    urls: string[];
    locations: string[];
    languages: string[];
    engagementPattern?: {
      avgLikes: number;
      avgComments: number;
      avgShares?: number;
      avgViews?: number;
      postFrequency: string;
      activeHours: number[];
      activeDays: string[];
      engagementRate: number;
    };
    contentTypes: {
      photos: number;
      videos: number;
      carousels: number;
      reels: number;
      stories: number;
      text: number;
    };
    sentiment?: {
      overall: 'positive' | 'negative' | 'neutral' | 'mixed';
      breakdown: { positive: number; neutral: number; negative: number };
    };
  };
}

interface ExtensionPayload {
  action: ScrapeAction;
  platform: SupportedPlatform;
  profileUrl?: string;
  username?: string;
  profileId?: string;
  scrapeDepth?: 'quick' | 'standard' | 'deep';
  lastCaptureTimestamp?: string; // For incremental updates
  data?: Partial<EnhancedSocialData> & {
    profileHtml?: string;
    posts?: EnhancedPost[];
    comments?: Array<{
      postId: string;
      content: string;
      author: string;
      timestamp: string;
      likes?: number;
      replies?: number;
    }>;
    likes?: Array<{
      postId: string;
      likedBy: string[];
    }>;
    followers?: string[];
    following?: string[];
    stories?: StoryItem[];
    highlights?: HighlightGroup[];
    connections?: EnhancedSocialData['connections'];
  };
  metadata?: {
    scrapedAt: string;
    extensionVersion: string;
    browserInfo: string;
    scrollPosition?: number;
    totalScrolls?: number;
    captureMode?: 'manual' | 'auto';
    scrapeDepth?: 'quick' | 'standard' | 'deep';
    pageLoadTime?: number;
    capturedElements?: number;
  };
}

// Platform-specific extraction prompts
const PLATFORM_PROMPTS: Record<string, string> = {
  instagram: `Extract Instagram profile data: username, displayName, bio, followersCount, followingCount, postsCount, isVerified, isPrivate, website, profileImageUrl, category, externalLinks. For posts: caption, likes, comments, timestamp, hashtags, mentions, isSponsored.`,
  
  tiktok: `Extract TikTok profile data: username, displayName, bio, followersCount, followingCount, likesCount, isVerified, website, profileImageUrl. For videos: caption, views, likes, comments, shares, sounds used, hashtags.`,
  
  youtube: `Extract YouTube channel data: channelName, handle, description, subscribersCount, videosCount, viewsCount, isVerified, bannerUrl, profileImageUrl, joinDate. For videos: title, views, likes, comments, duration, uploadDate.`,
  
  reddit: `Extract Reddit user data: username, displayName, karma (post/comment), accountAge, isVerified, isPremium, description. For posts: title, content, subreddit, upvotes, comments, awards.`,
  
  github: `Extract GitHub profile data: username, displayName, bio, followersCount, followingCount, repositoriesCount, starsCount, contributionsCount, company, location, website, email. For repos: name, description, stars, forks, language.`,
  
  linkedin: `Extract LinkedIn profile data: firstName, lastName, headline, about, location, connections, isVerified, currentCompany, currentTitle, education, skills, endorsements.`,
  
  pinterest: `Extract Pinterest profile data: username, displayName, bio, followersCount, followingCount, pinsCount, boardsCount, website. For boards: name, description, pins, followers.`,
  
  medium: `Extract Medium profile data: username, displayName, bio, followersCount, followingCount, clapsReceived, storiesCount. For stories: title, subtitle, claps, responses, readTime.`,
  
  twitter: `Extract X/Twitter profile data: username, displayName, bio, followersCount, followingCount, tweetsCount, isVerified, isBlueVerified, joinDate, location, website, pinnedTweet. For tweets: content, likes, retweets, replies, quotes, views.`,
  
  threads: `Extract Threads profile data: username, displayName, bio, followersCount, isVerified, profileImageUrl. For posts: content, likes, replies, reposts.`,
  
  facebook: `Extract Facebook profile/page data: name, about, followersCount, likesCount, website, category, location. For posts: content, reactions, comments, shares.`,
  
  bluesky: `Extract Bluesky profile data: handle, displayName, bio, followersCount, followingCount, postsCount. For posts: content, likes, reposts, replies.`,
  
  mastodon: `Extract Mastodon profile data: username, displayName, bio, followersCount, followingCount, statusesCount, instance. For toots: content, boosts, favorites, replies.`,
  
  discord: `Extract Discord profile data (public): username, displayName, bio, badges, status, connections.`,
  
  snapchat: `Extract Snapchat profile data (public): username, displayName, bio, snapScore, bitmoji. For stories: media type, timestamp.`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: ExtensionPayload = await req.json();
    console.log('Chrome Extension Bridge - Action:', payload.action, 'Platform:', payload.platform, 'Depth:', payload.scrapeDepth || 'standard');

    // Handle ping action for connection check
    if (payload.action === 'ping') {
      const extensionId = req.headers.get('x-extension-id') || 'chrome-extension';
      await supabase.from('device_presence').upsert({
        user_id: user.id,
        device_type: 'chrome_extension',
        device_id: extensionId,
        last_seen_at: new Date().toISOString(),
        metadata: payload.metadata || null,
      }, {
        onConflict: 'user_id,device_type',
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'pong', 
          userId: user.id,
          supportedPlatforms: Object.keys(PLATFORM_PROMPTS),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the extension sync
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: req.headers.get('x-extension-id') || 'chrome-extension',
      device_type: 'chrome_extension',
      sync_type: payload.action,
      data_count: 1,
    });

    let result: any = {};

    switch (payload.action) {
      case 'scrape_profile':
        result = await processProfileScrape(supabase, user.id, payload);
        break;
      case 'scrape_posts':
        result = await processPostsScrape(supabase, user.id, payload);
        break;
      case 'scrape_comments':
        result = await processCommentsScrape(supabase, user.id, payload);
        break;
      case 'scrape_likes':
        result = await processLikesScrape(supabase, user.id, payload);
        break;
      case 'scrape_stories':
        result = await processStoriesScrape(supabase, user.id, payload);
        break;
      case 'scrape_connections':
        result = await processConnectionsScrape(supabase, user.id, payload);
        break;
      case 'bulk_scrape':
        result = await processBulkScrape(supabase, user.id, payload);
        break;
      case 'incremental_update':
        result = await processIncrementalUpdate(supabase, user.id, payload);
        break;
      default:
        throw new Error(`Unknown action: ${payload.action}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chrome Extension Bridge Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============== Processing Functions ==============

async function processProfileScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId, profileUrl, scrapeDepth = 'standard' } = payload;
  
  let extractedData: any = {};
  const aiApiKey = Deno.env.get('LOVABLE_AI_API_KEY');
  
  // Enhanced AI extraction with platform-specific prompts
  if (data?.profileHtml && aiApiKey) {
    const platformPrompt = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.instagram;
    
    const aiResponse = await fetch('https://ai.lovable.dev/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: scrapeDepth === 'deep' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `${platformPrompt}

Extract ALL available data from this ${platform} profile HTML. Return comprehensive JSON with:
- profile: { username, displayName, bio, avatarUrl, bannerUrl, joinDate, location, website, email, isVerified, isPrivate, isBusiness, isCreator, badges, pronouns, category, externalLinks }
- stats: { followers, following, posts, likes, views, subscribers, karma, stars, contributions, etc. }
- recentPosts: [{ id, content, mediaUrls, likes, comments, shares, views, timestamp, hashtags, mentions, isSponsored, isPinned }]
- topHashtags: string[]
- topMentions: string[]
- engagementRate: number
- contentMix: { photos, videos, reels, carousels, text }

Only return valid JSON, no markdown.

HTML snippet (first 15000 chars):
${data.profileHtml.substring(0, 15000)}`
        }],
        max_tokens: 4000,
      }),
    });
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }
  }

  // Compute derived intelligence
  const intelligence = computeIntelligence(data, extractedData);

  // Auto-categorize the profile
  const autoTags = computeAutoTags(extractedData, intelligence);

  // Create device capture record with enhanced data
  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_profile',
    source_app: platform,
    raw_content: profileUrl,
    extracted_data: {
      platform,
      username,
      profileUrl,
      scrapeDepth,
      ...extractedData,
      intelligence,
      autoTags,
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
    confidence_score: extractedData.profile?.username ? 0.85 : 0.5,
  }).select().single();

  if (error) throw error;

  // Store in screenshot_imports for consistency
  await supabase.from('screenshot_imports').insert({
    user_id: userId,
    contact_id: profileId || null,
    source_type: platform,
    extracted_data: {
      platform,
      username,
      ...extractedData,
      posts: data?.posts?.slice(0, 10),
    },
    status: 'completed',
  });

  return {
    captureId: capture.id,
    platform,
    extractedData: {
      ...extractedData,
      intelligence,
      autoTags,
    },
  };
}

async function processPostsScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId } = payload;
  
  if (!data?.posts || data.posts.length === 0) {
    return { postsProcessed: 0 };
  }

  // Extract hashtags, mentions, and compute engagement stats
  const allHashtags: string[] = [];
  const allMentions: string[] = [];
  let totalLikes = 0;
  let totalComments = 0;
  let totalViews = 0;

  const enhancedPosts = data.posts.map(post => {
    const hashtags = extractHashtags(post.content);
    const mentions = extractMentions(post.content);
    allHashtags.push(...hashtags);
    allMentions.push(...mentions);
    totalLikes += post.likes || 0;
    totalComments += post.comments || 0;
    totalViews += (post as any).views || 0;

    return {
      ...post,
      hashtags,
      mentions,
      urls: extractUrls(post.content),
    };
  });

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_posts',
    source_app: platform,
    extracted_data: {
      platform,
      username,
      postsCount: data.posts.length,
      engagement: {
        totalLikes,
        totalComments,
        totalViews,
        avgLikes: data.posts.length ? Math.round(totalLikes / data.posts.length) : 0,
        avgComments: data.posts.length ? Math.round(totalComments / data.posts.length) : 0,
      },
      topHashtags: getTopItems(allHashtags, 10),
      topMentions: getTopItems(allMentions, 10),
      posts: enhancedPosts,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    postsProcessed: data.posts.length,
    engagement: {
      totalLikes,
      totalComments,
      avgLikes: data.posts.length ? Math.round(totalLikes / data.posts.length) : 0,
    },
  };
}

async function processCommentsScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId } = payload;
  
  if (!data?.comments || data.comments.length === 0) {
    return { commentsProcessed: 0 };
  }

  // Extract frequent commenters
  const commenters: Record<string, number> = {};
  data.comments.forEach(c => {
    commenters[c.author] = (commenters[c.author] || 0) + 1;
  });
  
  const topCommenters = Object.entries(commenters)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([author, count]) => ({ author, count }));

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_comments',
    source_app: platform,
    extracted_data: {
      platform,
      commentsCount: data.comments.length,
      topCommenters,
      comments: data.comments,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    commentsProcessed: data.comments.length,
    topCommenters,
  };
}

async function processLikesScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId } = payload;
  
  if (!data?.likes || data.likes.length === 0) {
    return { likesProcessed: 0 };
  }

  // Extract top likers
  const likers: Record<string, number> = {};
  data.likes.forEach(l => {
    l.likedBy?.forEach(liker => {
      likers[liker] = (likers[liker] || 0) + 1;
    });
  });
  
  const topLikers = Object.entries(likers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));

  const totalLikes = data.likes.reduce((sum, l) => sum + (l.likedBy?.length || 0), 0);

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_likes',
    source_app: platform,
    extracted_data: {
      platform,
      postsWithLikes: data.likes.length,
      totalLikes,
      topLikers,
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    likesProcessed: totalLikes,
    topLikers,
  };
}

async function processStoriesScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId } = payload;
  
  if (!data?.stories || data.stories.length === 0) {
    return { storiesProcessed: 0 };
  }

  // Extract story metadata
  const storyStats = {
    total: data.stories.length,
    withLocation: data.stories.filter(s => s.location).length,
    withMentions: data.stories.filter(s => s.mentions?.length).length,
    withMusic: data.stories.filter(s => s.music).length,
    mediaTypes: {
      images: data.stories.filter(s => s.mediaType === 'image').length,
      videos: data.stories.filter(s => s.mediaType === 'video').length,
    },
  };

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_stories',
    source_app: platform,
    extracted_data: {
      platform,
      username,
      storyStats,
      stories: data.stories,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    storiesProcessed: data.stories.length,
    storyStats,
  };
}

async function processConnectionsScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId } = payload;
  
  const connections = data?.connections || {};
  const totalConnections = 
    (connections.mutualFollowers?.length || 0) +
    (connections.taggedWith?.length || 0) +
    (connections.collaborators?.length || 0);

  if (totalConnections === 0) {
    return { connectionsProcessed: 0 };
  }

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_connections',
    source_app: platform,
    extracted_data: {
      platform,
      username,
      connectionCounts: {
        mutualFollowers: connections.mutualFollowers?.length || 0,
        taggedWith: connections.taggedWith?.length || 0,
        collaborators: connections.collaborators?.length || 0,
        frequentCommenters: connections.frequentCommenters?.length || 0,
        topLikers: connections.topLikers?.length || 0,
      },
      connections,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    connectionsProcessed: totalConnections,
  };
}

async function processBulkScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId, username, scrapeDepth = 'standard' } = payload;
  
  // Process profile data with AI
  let extractedProfile: any = {};
  const aiApiKey = Deno.env.get('LOVABLE_AI_API_KEY');
  
  if (data?.profileHtml && aiApiKey) {
    const platformPrompt = PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.instagram;
    
    const aiResponse = await fetch('https://ai.lovable.dev/api/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: scrapeDepth === 'deep' ? 'google/gemini-2.5-pro' : 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `${platformPrompt}

Perform a comprehensive extraction from this ${platform} profile. Return detailed JSON with all available profile data, statistics, and content analysis.

HTML (first 20000 chars):
${data.profileHtml.substring(0, 20000)}`
        }],
        max_tokens: 6000,
      }),
    });
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedProfile = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse AI response:', e);
      }
    }
  }

  // Compute comprehensive intelligence
  const intelligence = computeIntelligence(data, extractedProfile);
  const autoTags = computeAutoTags(extractedProfile, intelligence);

  const results = {
    profile: extractedProfile.profile || null,
    posts: data?.posts?.length || 0,
    stories: data?.stories?.length || 0,
    highlights: data?.highlights?.length || 0,
    followers: data?.followers?.length || 0,
    following: data?.following?.length || 0,
    captureId: '',
  };

  // Store the complete bulk data
  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'bulk_social_scrape',
    source_app: platform,
    extracted_data: {
      platform,
      username,
      scrapeDepth,
      ...extractedProfile,
      intelligence,
      autoTags,
      counts: {
        posts: results.posts,
        stories: results.stories,
        highlights: results.highlights,
        followers: results.followers,
        following: results.following,
      },
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
    confidence_score: extractedProfile.profile?.username ? 0.9 : 0.6,
  }).select().single();

  if (error) throw error;

  results.captureId = capture.id;

  return results;
}

async function processIncrementalUpdate(supabase: any, userId: string, payload: ExtensionPayload) {
  const { platform, username, profileId, lastCaptureTimestamp, data } = payload;
  
  // Get the last capture for this profile
  const { data: lastCapture } = await supabase
    .from('device_captures')
    .select('id, extracted_data, created_at')
    .eq('user_id', userId)
    .eq('source_app', platform)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Filter only new posts
  const cutoffDate = lastCaptureTimestamp || lastCapture?.created_at;
  const newPosts = data?.posts?.filter(post => {
    if (!cutoffDate || !post.timestamp) return true;
    return new Date(post.timestamp) > new Date(cutoffDate);
  }) || [];

  if (newPosts.length === 0 && !data?.profile) {
    return { 
      updated: false, 
      message: 'No new content since last capture',
      lastCaptureId: lastCapture?.id,
    };
  }

  // Store incremental update
  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'incremental_update',
    source_app: platform,
    extracted_data: {
      platform,
      username,
      isIncremental: true,
      previousCaptureId: lastCapture?.id,
      newPostsCount: newPosts.length,
      newPosts,
      profileUpdates: data?.profile,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    updated: true,
    newPostsCount: newPosts.length,
    previousCaptureId: lastCapture?.id,
  };
}

// ============== Helper Functions ==============

function extractHashtags(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/#[\w\u00C0-\u024F]+/g) || [];
  return [...new Set(matches.map(h => h.toLowerCase()))];
}

function extractMentions(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/@[\w\u00C0-\u024F.]+/g) || [];
  return [...new Set(matches.map(m => m.toLowerCase()))];
}

function extractUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s]+/g) || [];
  return [...new Set(matches)];
}

function getTopItems(items: string[], limit: number): string[] {
  const counts: Record<string, number> = {};
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item);
}

function computeIntelligence(rawData: any, extractedData: any): any {
  const posts = rawData?.posts || [];
  const allHashtags: string[] = [];
  const allMentions: string[] = [];
  const allUrls: string[] = [];
  const locations: string[] = [];
  
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalViews = 0;
  let photos = 0, videos = 0, carousels = 0, reels = 0, text = 0;

  posts.forEach((post: any) => {
    allHashtags.push(...extractHashtags(post.content));
    allMentions.push(...extractMentions(post.content));
    allUrls.push(...extractUrls(post.content));
    if (post.location) locations.push(post.location);
    
    totalLikes += post.likes || 0;
    totalComments += post.comments || 0;
    totalShares += post.shares || 0;
    totalViews += post.views || 0;

    // Count content types
    const mediaTypes = post.mediaTypes || [];
    if (mediaTypes.includes('carousel')) carousels++;
    else if (mediaTypes.includes('reel')) reels++;
    else if (mediaTypes.includes('video')) videos++;
    else if (post.mediaUrls?.length > 0) photos++;
    else text++;
  });

  const postsCount = posts.length || 1;
  const followers = extractedData?.stats?.followers || 1;

  return {
    topics: extractedData?.topHashtags || getTopItems(allHashtags, 15),
    hashtags: getTopItems(allHashtags, 20),
    mentions: getTopItems(allMentions, 15),
    urls: [...new Set(allUrls)].slice(0, 10),
    locations: [...new Set(locations)].slice(0, 5),
    engagementPattern: {
      avgLikes: Math.round(totalLikes / postsCount),
      avgComments: Math.round(totalComments / postsCount),
      avgShares: Math.round(totalShares / postsCount),
      avgViews: Math.round(totalViews / postsCount),
      engagementRate: parseFloat(((totalLikes + totalComments) / (postsCount * followers) * 100).toFixed(2)),
    },
    contentTypes: { photos, videos, carousels, reels, text, stories: rawData?.stories?.length || 0 },
  };
}

function computeAutoTags(extractedData: any, intelligence: any): string[] {
  const tags: string[] = [];
  const followers = extractedData?.stats?.followers || 0;
  const engagementRate = intelligence?.engagementPattern?.engagementRate || 0;
  
  // Follower-based tags
  if (followers >= 1000000) tags.push('#mega-influencer');
  else if (followers >= 100000) tags.push('#macro-influencer');
  else if (followers >= 10000) tags.push('#micro-influencer');
  else if (followers >= 1000) tags.push('#nano-influencer');
  
  // Account type tags
  if (extractedData?.profile?.isBusiness) tags.push('#business');
  if (extractedData?.profile?.isCreator) tags.push('#creator');
  if (extractedData?.profile?.isVerified) tags.push('#verified');
  if (extractedData?.profile?.isPrivate) tags.push('#private');
  
  // Engagement-based tags
  if (engagementRate > 5) tags.push('#high-engagement');
  else if (engagementRate < 1) tags.push('#low-engagement');
  
  // Content-based tags
  const contentTypes = intelligence?.contentTypes || {};
  if (contentTypes.videos > contentTypes.photos) tags.push('#video-creator');
  if (contentTypes.reels > 5) tags.push('#reels-creator');
  
  // Category tags
  if (extractedData?.profile?.category) {
    tags.push(`#${extractedData.profile.category.toLowerCase().replace(/\s+/g, '-')}`);
  }
  
  return tags;
}
