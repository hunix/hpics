import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-extension-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ExtensionPayload {
  action: 'ping' | 'scrape_profile' | 'scrape_posts' | 'scrape_comments' | 'scrape_likes' | 'bulk_scrape';
  platform: 'instagram' | 'threads' | 'twitter' | 'linkedin' | 'facebook' | 'tiktok';
  profileUrl?: string;
  username?: string;
  profileId?: string;
  data?: {
    profileHtml?: string;
    posts?: Array<{
      id: string;
      content: string;
      mediaUrls: string[];
      likes: number;
      comments: number;
      timestamp: string;
    }>;
    comments?: Array<{
      postId: string;
      content: string;
      author: string;
      timestamp: string;
    }>;
    likes?: Array<{
      postId: string;
      likedBy: string[];
    }>;
    followers?: string[];
    following?: string[];
    stories?: Array<{
      mediaUrl: string;
      timestamp: string;
    }>;
    highlights?: Array<{
      name: string;
      coverUrl: string;
      items: string[];
    }>;
  };
  metadata?: {
    scrapedAt: string;
    extensionVersion: string;
    browserInfo: string;
    scrollPosition?: number;
    totalScrolls?: number;
  };
}

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
    console.log('Chrome Extension Bridge - Action:', payload.action, 'Platform:', payload.platform);

    // Handle ping action for connection check - update device presence
    if (payload.action === 'ping') {
      // Upsert device presence to track last seen time
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
        JSON.stringify({ success: true, message: 'pong', userId: user.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the extension sync (only for actual scrape actions)
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
      case 'bulk_scrape':
        result = await processBulkScrape(supabase, user.id, payload);
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

async function processProfileScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId, profileUrl } = payload;
  
  // Parse profile HTML using AI if provided
  let extractedData: any = {};
  
  if (data?.profileHtml) {
    // Use AI to extract structured data from HTML
    const aiApiKey = Deno.env.get('LOVABLE_AI_API_KEY');
    
    if (aiApiKey) {
      const aiResponse = await fetch('https://ai.lovable.dev/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: `Extract structured profile data from this ${platform} profile HTML. Return JSON with fields: username, displayName, bio, followersCount, followingCount, postsCount, isVerified, isPrivate, website, location, profileImageUrl, externalLinks. Only return valid JSON, no markdown.\n\nHTML snippet (first 10000 chars):\n${data.profileHtml.substring(0, 10000)}`
          }],
        }),
      });
      
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        try {
          // Extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse AI response:', e);
        }
      }
    }
  }

  // Create device capture record
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
      rawData: data,
      ...extractedData,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  // Also store in screenshot_imports for consistency
  await supabase.from('screenshot_imports').insert({
    user_id: userId,
    contact_id: profileId || null,
    source_type: platform,
    extracted_data: {
      platform,
      username,
      ...extractedData,
      posts: data?.posts,
    },
    status: 'completed',
  });

  return {
    captureId: capture.id,
    extractedData: {
      platform,
      username,
      ...extractedData,
    },
  };
}

async function processPostsScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, username, profileId } = payload;
  
  if (!data?.posts || data.posts.length === 0) {
    return { postsProcessed: 0 };
  }

  // Store posts data
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
      rawData: data,
      posts: data.posts.map((p: any) => ({
        id: p.id,
        content: p.content?.substring(0, 500),
        likes: p.likes,
        comments: p.comments,
        timestamp: p.timestamp,
        hasMedia: p.mediaUrls?.length > 0,
      })),
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    postsProcessed: data.posts.length,
  };
}

async function processCommentsScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId } = payload;
  
  if (!data?.comments || data.comments.length === 0) {
    return { commentsProcessed: 0 };
  }

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_comments',
    source_app: platform,
    extracted_data: {
      platform,
      commentsCount: data.comments.length,
      comments: data.comments,
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    commentsProcessed: data.comments.length,
  };
}

async function processLikesScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId } = payload;
  
  if (!data?.likes || data.likes.length === 0) {
    return { likesProcessed: 0 };
  }

  const { data: capture, error } = await supabase.from('device_captures').insert({
    user_id: userId,
    profile_id: profileId || null,
    device_source: 'chrome_extension',
    capture_type: 'social_likes',
    source_app: platform,
    extracted_data: {
      platform,
      postsWithLikes: data.likes.length,
      totalLikes: data.likes.reduce((sum: number, l: any) => sum + (l.likedBy?.length || 0), 0),
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  return {
    captureId: capture.id,
    likesProcessed: data.likes.reduce((sum: number, l: any) => sum + (l.likedBy?.length || 0), 0),
  };
}

async function processBulkScrape(supabase: any, userId: string, payload: ExtensionPayload) {
  const { data, platform, profileId, username } = payload;
  
  // Process all data types at once
  const results: any = {
    profile: null,
    posts: 0,
    stories: 0,
    highlights: 0,
    followers: 0,
    following: 0,
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
      hasProfile: !!data?.profileHtml,
      postsCount: data?.posts?.length || 0,
      storiesCount: data?.stories?.length || 0,
      highlightsCount: data?.highlights?.length || 0,
      followersCount: data?.followers?.length || 0,
      followingCount: data?.following?.length || 0,
      rawData: data,
    },
    metadata: payload.metadata,
    status: 'completed',
  }).select().single();

  if (error) throw error;

  results.captureId = capture.id;
  results.posts = data?.posts?.length || 0;
  results.stories = data?.stories?.length || 0;
  results.highlights = data?.highlights?.length || 0;
  results.followers = data?.followers?.length || 0;
  results.following = data?.following?.length || 0;

  return results;
}
