import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive Threads profile schema for Firecrawl JSON extraction
const THREADS_SCHEMA = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      properties: {
        handle: { type: 'string', description: 'Threads handle without @' },
        displayName: { type: 'string', description: 'Full display name' },
        bio: { type: 'string', description: 'Complete bio text' },
        followersCount: { type: 'number', description: 'Number of followers' },
        followingCount: { type: 'number', description: 'Number of following' },
        isVerified: { type: 'boolean', description: 'Has verification badge' },
        profilePicUrl: { type: 'string', description: 'Profile picture URL' },
        instagramLinked: { type: 'boolean', description: 'Has linked Instagram account' },
        instagramHandle: { type: 'string', description: 'Linked Instagram handle if visible' },
        location: { type: 'string', description: 'Location if shown' },
        website: { type: 'string', description: 'Website link if any' },
      }
    },
    recentThreads: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          threadUrl: { type: 'string', description: 'Direct link to thread' },
          content: { type: 'string', description: 'Full thread text content' },
          likes: { type: 'number', description: 'Like count' },
          replies: { type: 'number', description: 'Reply count' },
          reposts: { type: 'number', description: 'Repost count' },
          quotes: { type: 'number', description: 'Quote count' },
          timestamp: { type: 'string', description: 'When posted' },
          hasMedia: { type: 'boolean', description: 'Contains image/video' },
          mediaType: { type: 'string', description: 'Type of media: image, video, carousel' },
          mediaUrl: { type: 'string', description: 'Media URL if present' },
          hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags used' },
          mentions: { type: 'array', items: { type: 'string' }, description: 'Accounts mentioned' },
          isReply: { type: 'boolean', description: 'Is this a reply to another thread' },
          replyToUser: { type: 'string', description: 'Who they replied to' },
        }
      },
      description: 'Recent threads from the profile'
    },
    repliesGiven: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          replyContent: { type: 'string' },
          repliedToUser: { type: 'string' },
          repliedToContent: { type: 'string' },
          likes: { type: 'number' },
          timestamp: { type: 'string' },
        }
      },
      description: 'Replies this user has posted'
    },
    topEngagingPosts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          totalEngagement: { type: 'number' },
          likes: { type: 'number' },
          replies: { type: 'number' },
          reposts: { type: 'number' },
        }
      },
      description: 'Most engaging threads by total engagement'
    }
  }
};

interface ThreadsDeepScrapeResult {
  profile: {
    handle: string;
    displayName?: string;
    bio?: string;
    followersCount?: number;
    followingCount?: number;
    isVerified?: boolean;
    profilePicUrl?: string;
    instagramLinked?: boolean;
    instagramHandle?: string;
    location?: string;
    website?: string;
  };
  recentThreads?: Array<{
    threadUrl?: string;
    content?: string;
    likes?: number;
    replies?: number;
    reposts?: number;
    quotes?: number;
    timestamp?: string;
    hasMedia?: boolean;
    mediaType?: string;
    mediaUrl?: string;
    hashtags?: string[];
    mentions?: string[];
    isReply?: boolean;
    replyToUser?: string;
  }>;
  repliesGiven?: Array<{
    replyContent?: string;
    repliedToUser?: string;
    repliedToContent?: string;
    likes?: number;
    timestamp?: string;
  }>;
  topEngagingPosts?: Array<{
    content?: string;
    totalEngagement?: number;
    likes?: number;
    replies?: number;
    reposts?: number;
  }>;
  contentAnalysis?: {
    primaryTopics?: string[];
    contentStyle?: string;
    postingFrequency?: string;
    avgEngagement?: number;
    mostUsedHashtags?: string[];
    mostMentioned?: string[];
  };
  confidence: number;
  dataCompleteness: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      profileUrl, 
      profileId,
      captureId,
      scrapeMode = 'standard', // 'quick', 'standard', 'deep'
      includeReplies = true,
      analyzeContent = true,
      maxThreads = 50,
    } = await req.json();

    if (!profileUrl) {
      return new Response(JSON.stringify({ error: 'Profile URL required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ 
        error: 'Firecrawl not configured. Please connect Firecrawl in Settings → Connectors.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[scrape-threads-deep] Deep scraping ${profileUrl} mode=${scrapeMode}`);

    // Update capture status if provided
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({ 
          status: 'processing', 
          processing_started_at: new Date().toISOString(),
          metadata: { scrapeMode, includeReplies, analyzeContent }
        })
        .eq('id', captureId);
    }

    const waitTime = scrapeMode === 'deep' ? 5000 : scrapeMode === 'standard' ? 3000 : 2000;

    // Primary profile scrape with JSON extraction
    const profileScrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: profileUrl,
        formats: [
          'markdown', 
          'screenshot',
          { 
            type: 'json', 
            schema: THREADS_SCHEMA,
          }
        ],
        onlyMainContent: false,
        waitFor: waitTime,
      }),
    });

    if (!profileScrapeResponse.ok) {
      const errText = await profileScrapeResponse.text();
      console.error('[scrape-threads-deep] Firecrawl error:', errText);
      throw new Error(`Firecrawl scraping failed: ${profileScrapeResponse.status}`);
    }

    const profileData = await profileScrapeResponse.json();
    const extractedJson = profileData.data?.json || profileData.json || {};
    const markdown = profileData.data?.markdown || profileData.markdown || '';
    const screenshot = profileData.data?.screenshot || profileData.screenshot;

    console.log(`[scrape-threads-deep] JSON extraction complete, markdown: ${markdown.length} chars`);

    // Scrape replies tab if deep mode and requested
    let repliesData: any[] = [];
    if (scrapeMode === 'deep' && includeReplies) {
      try {
        const repliesUrl = profileUrl.replace(/\/$/, '') + '/replies';
        const repliesScrape = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: repliesUrl,
            formats: ['markdown'],
            waitFor: 3000,
          }),
        });
        
        if (repliesScrape.ok) {
          const repliesResult = await repliesScrape.json();
          const repliesContent = repliesResult.data?.markdown || repliesResult.markdown || '';
          if (repliesContent.length > 100) {
            repliesData = await extractRepliesWithAI(repliesContent, user.id);
          }
        }
      } catch (e) {
        console.warn('[scrape-threads-deep] Replies scrape failed:', e);
      }
    }

    // Build merged data
    const mergedData: ThreadsDeepScrapeResult = {
      profile: extractedJson.profile || {},
      recentThreads: extractedJson.recentThreads || [],
      repliesGiven: [...(extractedJson.repliesGiven || []), ...repliesData],
      topEngagingPosts: extractedJson.topEngagingPosts || [],
      confidence: calculateConfidence(extractedJson),
      dataCompleteness: calculateCompleteness(extractedJson, scrapeMode),
    };

    // AI fallback for low confidence
    if (mergedData.confidence < 0.5 && markdown.length > 500) {
      console.log('[scrape-threads-deep] Low confidence, running AI extraction fallback');
      const aiExtracted = await extractWithAI(markdown, user.id, profileId);
      
      if (aiExtracted.profile) {
        mergedData.profile = { ...mergedData.profile, ...aiExtracted.profile };
      }
      if (aiExtracted.recentThreads?.length) {
        mergedData.recentThreads = aiExtracted.recentThreads;
      }
      mergedData.confidence = Math.max(mergedData.confidence, aiExtracted.confidence || 0.5);
    }

    // Content analysis if requested
    if (analyzeContent && mergedData.recentThreads && mergedData.recentThreads.length > 0) {
      mergedData.contentAnalysis = analyzeThreadsContent(mergedData.recentThreads);
      
      // Calculate top engaging posts
      mergedData.topEngagingPosts = mergedData.recentThreads
        .map(t => ({
          content: t.content || '',
          totalEngagement: (t.likes || 0) + (t.replies || 0) + (t.reposts || 0),
          likes: t.likes || 0,
          replies: t.replies || 0,
          reposts: t.reposts || 0,
        }))
        .sort((a, b) => b.totalEngagement - a.totalEngagement)
        .slice(0, 5);
    }

    // Store screenshot
    let screenshotUrl: string | undefined;
    if (screenshot) {
      try {
        const screenshotBuffer = Uint8Array.from(atob(screenshot), c => c.charCodeAt(0));
        const fileName = `social-profiles/${user.id}/${Date.now()}-threads-deep.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, screenshotBuffer, {
            contentType: 'image/png',
            upsert: false
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
          screenshotUrl = urlData.publicUrl;
        }
      } catch (e) {
        console.warn('[scrape-threads-deep] Screenshot storage failed:', e);
      }
    }

    // Update device capture
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({
          status: 'review',
          extracted_data: mergedData,
          confidence_score: mergedData.confidence,
          processing_completed_at: new Date().toISOString(),
          file_urls: screenshotUrl ? [screenshotUrl] : [],
          metadata: {
            scrapeMode,
            threadsExtracted: mergedData.recentThreads?.length || 0,
            repliesExtracted: mergedData.repliesGiven?.length || 0,
            dataCompleteness: mergedData.dataCompleteness,
            contentTopics: mergedData.contentAnalysis?.primaryTopics,
          },
          ai_analysis: {
            extractionMethod: mergedData.confidence >= 0.5 ? 'schema' : 'ai_fallback',
            rawContentLength: markdown.length,
            avgEngagement: mergedData.contentAnalysis?.avgEngagement,
          }
        })
        .eq('id', captureId);
    }

    // Log sync event
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: `web-scraper-threads-deep-${Date.now()}`,
      device_type: 'web_scraper',
      sync_type: 'deep_scrape',
      metadata: {
        platform: 'threads',
        url: profileUrl,
        handle: mergedData.profile.handle,
        scrapeMode,
        threadsScraped: mergedData.recentThreads?.length || 0,
        confidence: mergedData.confidence,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      platform: 'threads',
      data: mergedData,
      screenshotUrl,
      stats: {
        threadsExtracted: mergedData.recentThreads?.length || 0,
        repliesExtracted: mergedData.repliesGiven?.length || 0,
        topPostsEngagement: mergedData.topEngagingPosts?.[0]?.totalEngagement || 0,
        confidence: mergedData.confidence,
        dataCompleteness: mergedData.dataCompleteness,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[scrape-threads-deep] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to deep scrape Threads profile' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateConfidence(data: any): number {
  let score = 0;
  if (data?.profile?.handle) score += 0.3;
  if (data?.profile?.displayName) score += 0.1;
  if (data?.profile?.bio) score += 0.1;
  if (data?.profile?.followersCount) score += 0.2;
  if (data?.recentThreads?.length > 0) score += 0.2;
  if (data?.recentThreads?.length >= 5) score += 0.1;
  return Math.min(score, 1);
}

function calculateCompleteness(data: any, mode: string): number {
  const weights: Record<string, Record<string, number>> = {
    quick: { profile: 1 },
    standard: { profile: 0.5, threads: 0.5 },
    deep: { profile: 0.3, threads: 0.4, replies: 0.3 },
  };
  
  const w = weights[mode] || weights.standard;
  let score = 0;
  
  if (data?.profile?.handle) score += (w.profile || 0);
  if (data?.recentThreads?.length >= 5) score += (w.threads || 0);
  if (mode === 'deep' && data?.repliesGiven?.length > 0) score += (w.replies || 0);
  
  return Math.min(score, 1);
}

function analyzeThreadsContent(threads: any[]): any {
  const allHashtags: string[] = [];
  const allMentions: string[] = [];
  let totalEngagement = 0;
  const contentTexts: string[] = [];
  
  threads.forEach(t => {
    if (t.hashtags) allHashtags.push(...t.hashtags);
    if (t.mentions) allMentions.push(...t.mentions);
    totalEngagement += (t.likes || 0) + (t.replies || 0) + (t.reposts || 0);
    if (t.content) contentTexts.push(t.content);
  });
  
  // Count frequency
  const hashtagCounts = allHashtags.reduce((acc, h) => {
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mentionCounts = allMentions.reduce((acc, m) => {
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    mostUsedHashtags: Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([h]) => h),
    mostMentioned: Object.entries(mentionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([m]) => m),
    avgEngagement: threads.length > 0 ? Math.round(totalEngagement / threads.length) : 0,
    postingFrequency: threads.length >= 10 ? 'high' : threads.length >= 5 ? 'medium' : 'low',
  };
}

async function extractWithAI(markdown: string, userId: string, profileId?: string): Promise<any> {
  const model = selectModel('balanced', 'google');
  
  const response = await callAI({
    model,
    messages: [
      { 
        role: 'system', 
        content: 'You extract structured Threads profile data. Return valid JSON only.' 
      },
      { 
        role: 'user', 
        content: `Extract Threads profile data from this content:

${markdown.substring(0, 20000)}

Return JSON with: profile (handle, displayName, bio, followersCount, followingCount, isVerified, instagramLinked), recentThreads (array with content, likes, replies, reposts, timestamp, hashtags, mentions), confidence (0-1 based on data quality).`
      }
    ],
    userId,
    functionName: 'scrape-threads-deep-ai',
    profileId,
    temperature: 0.1,
    maxTokens: 4000,
  });

  return parseAIJson(response.content, { profile: {}, confidence: 0.5 });
}

async function extractRepliesWithAI(markdown: string, userId: string): Promise<any[]> {
  const model = selectModel('speed', 'google');
  
  const response = await callAI({
    model,
    messages: [
      { role: 'system', content: 'Extract Threads replies. Return JSON array only.' },
      { role: 'user', content: `Extract replies from: ${markdown.substring(0, 10000)}
      
Return array: [{ "replyContent": string, "repliedToUser": string, "likes": number, "timestamp": string }]` }
    ],
    userId,
    functionName: 'scrape-threads-replies-ai',
    temperature: 0.1,
    maxTokens: 2000,
  });

  const parsed = parseAIJson(response.content, []);
  return Array.isArray(parsed) ? parsed : [];
}
