import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive Instagram profile schema for Firecrawl JSON extraction
const INSTAGRAM_SCHEMA = {
  type: 'object',
  properties: {
    profile: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Instagram username without @' },
        displayName: { type: 'string', description: 'Full display name' },
        bio: { type: 'string', description: 'Complete bio text' },
        pronouns: { type: 'string', description: 'Pronouns if shown' },
        category: { type: 'string', description: 'Business category like Artist, Creator, etc.' },
        isVerified: { type: 'boolean', description: 'Has blue verification badge' },
        isPrivate: { type: 'boolean', description: 'Is account private' },
        isBusiness: { type: 'boolean', description: 'Is business/creator account' },
        profilePicUrl: { type: 'string', description: 'Profile picture URL' },
        externalUrl: { type: 'string', description: 'Website link in bio' },
        followersCount: { type: 'number', description: 'Number of followers' },
        followingCount: { type: 'number', description: 'Number of following' },
        postsCount: { type: 'number', description: 'Total posts count' },
        location: { type: 'string', description: 'Location if shown' },
        contactEmail: { type: 'string', description: 'Contact email if visible' },
        contactPhone: { type: 'string', description: 'Contact phone if visible' },
      }
    },
    highlights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Highlight name' },
          coverUrl: { type: 'string', description: 'Highlight cover image URL' },
        }
      },
      description: 'Story highlights'
    },
    recentPosts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          postUrl: { type: 'string', description: 'Direct link to post' },
          thumbnailUrl: { type: 'string', description: 'Post image/video thumbnail' },
          isVideo: { type: 'boolean', description: 'Is this a video' },
          isReel: { type: 'boolean', description: 'Is this a Reel' },
          isCarousel: { type: 'boolean', description: 'Is this a carousel/album' },
          caption: { type: 'string', description: 'Post caption text' },
          likes: { type: 'number', description: 'Like count' },
          comments: { type: 'number', description: 'Comment count' },
          views: { type: 'number', description: 'View count for videos' },
          timestamp: { type: 'string', description: 'Post date/time' },
          hashtags: { type: 'array', items: { type: 'string' }, description: 'Hashtags used' },
          mentions: { type: 'array', items: { type: 'string' }, description: 'Accounts mentioned' },
          location: { type: 'string', description: 'Tagged location' },
        }
      },
      description: 'Recent posts from the grid'
    },
    reels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          reelUrl: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          views: { type: 'number' },
          likes: { type: 'number' },
          caption: { type: 'string' },
          audioName: { type: 'string', description: 'Name of audio/song used' },
          duration: { type: 'string', description: 'Video duration' },
        }
      },
      description: 'Reels content'
    },
    taggedPosts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          postUrl: { type: 'string' },
          thumbnailUrl: { type: 'string' },
          taggedBy: { type: 'string', description: 'Account that tagged them' },
        }
      },
      description: 'Posts where this user is tagged'
    },
    linkedAccounts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any linked Facebook, Threads, or other accounts'
    },
    businessInfo: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        contactButtons: { type: 'array', items: { type: 'string' } },
        address: { type: 'string' },
      }
    }
  }
};

interface DeepScrapeResult {
  profile: {
    username: string;
    displayName?: string;
    bio?: string;
    pronouns?: string;
    category?: string;
    isVerified?: boolean;
    isPrivate?: boolean;
    isBusiness?: boolean;
    profilePicUrl?: string;
    externalUrl?: string;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    location?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  highlights?: Array<{ name: string; coverUrl?: string }>;
  recentPosts?: Array<{
    postUrl?: string;
    thumbnailUrl?: string;
    isVideo?: boolean;
    isReel?: boolean;
    isCarousel?: boolean;
    caption?: string;
    likes?: number;
    comments?: number;
    views?: number;
    timestamp?: string;
    hashtags?: string[];
    mentions?: string[];
    location?: string;
  }>;
  reels?: Array<{
    reelUrl?: string;
    thumbnailUrl?: string;
    views?: number;
    likes?: number;
    caption?: string;
    audioName?: string;
    duration?: string;
  }>;
  taggedPosts?: Array<{
    postUrl?: string;
    thumbnailUrl?: string;
    taggedBy?: string;
  }>;
  linkedAccounts?: string[];
  businessInfo?: {
    category?: string;
    contactButtons?: string[];
    address?: string;
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
      includeReels = true,
      includeTagged = false,
      maxPosts = 30,
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

    console.log(`[scrape-instagram-deep] Deep scraping ${profileUrl} mode=${scrapeMode}`);

    // Update capture status if provided
    if (captureId) {
      await supabase
        .from('device_captures')
        .update({ 
          status: 'processing', 
          processing_started_at: new Date().toISOString(),
          metadata: { scrapeMode, includeReels, includeTagged }
        })
        .eq('id', captureId);
    }

    // Configure wait time based on scrape mode
    const waitTime = scrapeMode === 'deep' ? 6000 : scrapeMode === 'standard' ? 4000 : 2000;

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
            schema: INSTAGRAM_SCHEMA,
          }
        ],
        onlyMainContent: false,
        waitFor: waitTime,
      }),
    });

    if (!profileScrapeResponse.ok) {
      const errText = await profileScrapeResponse.text();
      console.error('[scrape-instagram-deep] Firecrawl error:', errText);
      throw new Error(`Firecrawl scraping failed: ${profileScrapeResponse.status}`);
    }

    const profileData = await profileScrapeResponse.json();
    const extractedJson = profileData.data?.json || profileData.json || {};
    const markdown = profileData.data?.markdown || profileData.markdown || '';
    const screenshot = profileData.data?.screenshot || profileData.screenshot;

    console.log(`[scrape-instagram-deep] JSON extraction complete, markdown: ${markdown.length} chars`);

    // If deep mode and reels requested, scrape the Reels tab
    let reelsData: any[] = [];
    if (scrapeMode === 'deep' && includeReels) {
      try {
        const reelsUrl = profileUrl.replace(/\/$/, '') + '/reels/';
        const reelsScrape = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: reelsUrl,
            formats: ['markdown'],
            waitFor: 3000,
          }),
        });
        
        if (reelsScrape.ok) {
          const reelsResult = await reelsScrape.json();
          // Parse reels from markdown using AI
          const reelsContent = reelsResult.data?.markdown || reelsResult.markdown || '';
          if (reelsContent.length > 100) {
            const reelsExtraction = await extractReelsWithAI(reelsContent, user.id);
            reelsData = reelsExtraction.reels || [];
          }
        }
      } catch (e) {
        console.warn('[scrape-instagram-deep] Reels scrape failed:', e);
      }
    }

    // If deep mode and tagged requested, scrape Tagged tab
    let taggedData: any[] = [];
    if (scrapeMode === 'deep' && includeTagged) {
      try {
        const taggedUrl = profileUrl.replace(/\/$/, '') + '/tagged/';
        const taggedScrape = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: taggedUrl,
            formats: ['markdown'],
            waitFor: 3000,
          }),
        });
        
        if (taggedScrape.ok) {
          const taggedResult = await taggedScrape.json();
          const taggedContent = taggedResult.data?.markdown || taggedResult.markdown || '';
          if (taggedContent.length > 100) {
            taggedData = await extractTaggedWithAI(taggedContent, user.id);
          }
        }
      } catch (e) {
        console.warn('[scrape-instagram-deep] Tagged scrape failed:', e);
      }
    }

    // Merge all data sources
    const mergedData: DeepScrapeResult = {
      profile: extractedJson.profile || {},
      highlights: extractedJson.highlights || [],
      recentPosts: extractedJson.recentPosts || [],
      reels: [...(extractedJson.reels || []), ...reelsData],
      taggedPosts: [...(extractedJson.taggedPosts || []), ...taggedData],
      linkedAccounts: extractedJson.linkedAccounts || [],
      businessInfo: extractedJson.businessInfo,
      confidence: calculateConfidence(extractedJson),
      dataCompleteness: calculateCompleteness(extractedJson, scrapeMode),
    };

    // If JSON extraction didn't get enough data, fall back to AI extraction
    if (mergedData.confidence < 0.5 && markdown.length > 500) {
      console.log('[scrape-instagram-deep] Low confidence, running AI extraction fallback');
      const aiExtracted = await extractWithAI(markdown, user.id, profileId);
      
      // Merge AI-extracted data with schema data
      if (aiExtracted.profile) {
        mergedData.profile = { ...mergedData.profile, ...aiExtracted.profile };
      }
      if (aiExtracted.recentPosts?.length) {
        mergedData.recentPosts = aiExtracted.recentPosts;
      }
      mergedData.confidence = Math.max(mergedData.confidence, aiExtracted.confidence || 0.5);
    }

    // Store screenshot
    let screenshotUrl: string | undefined;
    if (screenshot) {
      try {
        const screenshotBuffer = Uint8Array.from(atob(screenshot), c => c.charCodeAt(0));
        const fileName = `social-profiles/${user.id}/${Date.now()}-instagram-deep.png`;
        
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
        console.warn('[scrape-instagram-deep] Screenshot storage failed:', e);
      }
    }

    // Update device capture with comprehensive results
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
            postsExtracted: mergedData.recentPosts?.length || 0,
            reelsExtracted: mergedData.reels?.length || 0,
            taggedExtracted: mergedData.taggedPosts?.length || 0,
            highlightsExtracted: mergedData.highlights?.length || 0,
            dataCompleteness: mergedData.dataCompleteness,
          },
          ai_analysis: {
            extractionMethod: mergedData.confidence >= 0.5 ? 'schema' : 'ai_fallback',
            rawContentLength: markdown.length,
          }
        })
        .eq('id', captureId);
    }

    // Log sync event
    await supabase.from('device_sync_log').insert({
      user_id: user.id,
      device_id: `web-scraper-deep-${Date.now()}`,
      device_type: 'web_scraper',
      sync_type: 'deep_scrape',
      metadata: {
        platform: 'instagram',
        url: profileUrl,
        username: mergedData.profile.username,
        scrapeMode,
        postsScraped: mergedData.recentPosts?.length || 0,
        reelsScraped: mergedData.reels?.length || 0,
        confidence: mergedData.confidence,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      platform: 'instagram',
      data: mergedData,
      screenshotUrl,
      stats: {
        postsExtracted: mergedData.recentPosts?.length || 0,
        reelsExtracted: mergedData.reels?.length || 0,
        taggedExtracted: mergedData.taggedPosts?.length || 0,
        highlightsExtracted: mergedData.highlights?.length || 0,
        confidence: mergedData.confidence,
        dataCompleteness: mergedData.dataCompleteness,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[scrape-instagram-deep] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to deep scrape profile' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateConfidence(data: any): number {
  let score = 0;
  if (data?.profile?.username) score += 0.3;
  if (data?.profile?.displayName) score += 0.1;
  if (data?.profile?.bio) score += 0.1;
  if (data?.profile?.followersCount) score += 0.2;
  if (data?.recentPosts?.length > 0) score += 0.2;
  if (data?.highlights?.length > 0) score += 0.1;
  return Math.min(score, 1);
}

function calculateCompleteness(data: any, mode: string): number {
  const weights: Record<string, Record<string, number>> = {
    quick: { profile: 1, posts: 0 },
    standard: { profile: 0.5, posts: 0.5 },
    deep: { profile: 0.3, posts: 0.3, reels: 0.2, tagged: 0.2 },
  };
  
  const w = weights[mode] || weights.standard;
  let score = 0;
  
  if (data?.profile?.username) score += (w.profile || 0);
  if (data?.recentPosts?.length >= 6) score += (w.posts || 0);
  if (mode === 'deep') {
    if (data?.reels?.length > 0) score += (w.reels || 0);
    if (data?.taggedPosts?.length > 0) score += (w.tagged || 0);
  }
  
  return Math.min(score, 1);
}

async function extractWithAI(markdown: string, userId: string, profileId?: string): Promise<any> {
  const model = selectModel('balanced', 'google');
  
  const response = await callAI({
    model,
    messages: [
      { 
        role: 'system', 
        content: 'You extract structured Instagram profile data. Return valid JSON only.' 
      },
      { 
        role: 'user', 
        content: `Extract Instagram profile data from this content:

${markdown.substring(0, 20000)}

Return JSON with: profile (username, displayName, bio, followersCount, followingCount, postsCount, isVerified, isPrivate, website, location), recentPosts (array with caption, likes, comments, isVideo), highlights (array with name), confidence (0-1 based on data quality).`
      }
    ],
    userId,
    functionName: 'scrape-instagram-deep-ai',
    profileId,
    temperature: 0.1,
    maxTokens: 4000,
  });

  return parseAIJson(response.content, { profile: {}, confidence: 0.5 });
}

async function extractReelsWithAI(markdown: string, userId: string): Promise<any> {
  const model = selectModel('economy', 'google');
  
  const response = await callAI({
    model,
    messages: [
      { role: 'system', content: 'Extract Reels data. Return JSON array only.' },
      { role: 'user', content: `Extract reels from: ${markdown.substring(0, 10000)}
      
Return: { "reels": [{ "views": number, "likes": number, "caption": string, "audioName": string }] }` }
    ],
    userId,
    functionName: 'scrape-instagram-reels-ai',
    temperature: 0.1,
    maxTokens: 2000,
  });

  return parseAIJson(response.content, { reels: [] });
}

async function extractTaggedWithAI(markdown: string, userId: string): Promise<any[]> {
  const model = selectModel('economy', 'google');
  
  const response = await callAI({
    model,
    messages: [
      { role: 'system', content: 'Extract tagged posts data. Return JSON array only.' },
      { role: 'user', content: `Extract tagged posts from: ${markdown.substring(0, 10000)}
      
Return array: [{ "thumbnailUrl": string, "taggedBy": string }]` }
    ],
    userId,
    functionName: 'scrape-instagram-tagged-ai',
    temperature: 0.1,
    maxTokens: 2000,
  });

  const parsed = parseAIJson(response.content, []);
  return Array.isArray(parsed) ? parsed : [];
}
