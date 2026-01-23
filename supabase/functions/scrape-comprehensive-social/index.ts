import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapeRequest {
  profileId: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'threads';
  username: string;
  scrapeType: 'full' | 'posts' | 'comments' | 'followers' | 'following' | 'likers';
  postId?: string; // For comments/likers on specific post
  maxItems?: number;
  cursor?: string; // For pagination
}

interface RapidAPIConfig {
  host: string;
  endpoints: {
    profile?: string;
    posts?: string;
    comments?: string;
    followers?: string;
    following?: string;
    likers?: string;
  };
}

const RAPIDAPI_CONFIGS: Record<string, RapidAPIConfig> = {
  instagram: {
    host: 'instagram-scraper-api2.p.rapidapi.com',
    endpoints: {
      profile: '/v1/info',
      posts: '/v1.2/posts',
      comments: '/v1/comments',
      followers: '/v1/followers',
      following: '/v1/following',
      likers: '/v1/likes',
    }
  },
  twitter: {
    host: 'twitter-api45.p.rapidapi.com',
    endpoints: {
      profile: '/user.php',
      posts: '/timeline.php',
      followers: '/followers.php',
      following: '/following.php',
    }
  },
  tiktok: {
    host: 'tiktok-scraper7.p.rapidapi.com',
    endpoints: {
      profile: '/user/info',
      posts: '/user/posts',
      comments: '/comment/list',
      followers: '/user/followers',
      following: '/user/following',
    }
  },
  linkedin: {
    host: 'linkedin-data-api.p.rapidapi.com',
    endpoints: {
      profile: '/get-profile-data-by-url',
      posts: '/get-profile-posts',
    }
  },
  threads: {
    host: 'threads-api4.p.rapidapi.com',
    endpoints: {
      profile: '/api/user/info',
      posts: '/api/user/threads',
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'scrape-comprehensive-social', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');

    if (!rapidApiKey) {
      return new Response(JSON.stringify({ error: 'RAPIDAPI_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ScrapeRequest = await req.json();
    const { profileId, platform, username, scrapeType, postId, maxItems = 50, cursor } = body;

    const config = RAPIDAPI_CONFIGS[platform];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unsupported platform: ${platform}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create scrape job
    const { data: job, error: jobError } = await supabase
      .from('social_scrape_jobs')
      .insert({
        user_id: user.id,
        profile_id: profileId,
        platform,
        scrape_type: scrapeType,
        status: 'running',
        provider: 'rapidapi',
        started_at: new Date().toISOString(),
        last_cursor: cursor,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
    }

    const results: {
      profile?: Record<string, unknown>;
      posts?: Record<string, unknown>[];
      comments?: Record<string, unknown>[];
      followers?: Record<string, unknown>[];
      following?: Record<string, unknown>[];
      likers?: Record<string, unknown>[];
    } = {};

    const startTime = Date.now();
    let itemsScraped = 0;
    let estimatedCost = 0;

    // Helper function to make RapidAPI requests with timeout
    const fetchFromRapidAPI = async (endpoint: string, params: Record<string, string>) => {
      const apiUrl = new URL(`https://${config.host}${endpoint}`);
      Object.entries(params).forEach(([key, value]) => apiUrl.searchParams.append(key, value));

      // Add 30 second timeout with AbortController
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(apiUrl.toString(), {
          headers: {
            'x-rapidapi-host': config.host,
            'x-rapidapi-key': rapidApiKey,
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`RapidAPI error: ${response.status} ${await response.text()}`);
        }

        estimatedCost += 1; // ~$0.01 per request
        return response.json();
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('RapidAPI request timed out after 30 seconds');
        }
        throw error;
      }
    };

    // Scrape based on type
    if (scrapeType === 'full' || scrapeType === 'posts') {
      // Get profile info
      if (config.endpoints.profile) {
        try {
          const profileData = await fetchFromRapidAPI(config.endpoints.profile, { username });
          results.profile = profileData;
          itemsScraped++;
        } catch (e) {
          console.error('Profile fetch error:', e);
        }
      }

      // Get posts
      if (config.endpoints.posts) {
        try {
          const params: Record<string, string> = { username };
          if (cursor) params.cursor = cursor;
          if (maxItems) params.count = String(maxItems);
          
          const postsData = await fetchFromRapidAPI(config.endpoints.posts, params);
          results.posts = Array.isArray(postsData) ? postsData : postsData.items || postsData.data || [];
          itemsScraped += results.posts?.length || 0;

          // Store posts in database
          if (results.posts && results.posts.length > 0) {
            const postsToInsert = results.posts.map((post: Record<string, unknown>) => ({
              user_id: user.id,
              profile_id: profileId,
              platform,
              post_id: String(post.id || post.pk || post.code),
              post_url: post.url || post.permalink || `https://${platform}.com/p/${post.code}`,
              content: post.caption || post.text || post.description,
              media_urls: post.media_urls || post.images || post.video_url ? [post.video_url] : [],
              media_type: post.media_type || post.type || 'image',
              likes_count: post.like_count || post.likes || 0,
              comments_count: post.comment_count || post.comments || 0,
              shares_count: post.share_count || post.shares || 0,
              views_count: post.view_count || post.views || post.play_count || 0,
              posted_at: post.taken_at ? new Date(Number(post.taken_at) * 1000).toISOString() : post.created_at,
              hashtags: post.hashtags || [],
              mentions: post.mentions || [],
              location: typeof post.location === 'object' ? (post.location as { name?: string })?.name : post.location,
              raw_data: post,
            }));

            const { error: insertError } = await supabase
              .from('social_posts')
              .upsert(postsToInsert, { onConflict: 'platform,post_id,user_id' });

            if (insertError) {
              console.error('Error inserting posts:', insertError);
            }
          }
        } catch (e) {
          console.error('Posts fetch error:', e);
        }
      }
    }

    if (scrapeType === 'comments' && postId && config.endpoints.comments) {
      try {
        const commentsData = await fetchFromRapidAPI(config.endpoints.comments, { 
          media_id: postId,
          count: String(maxItems),
        });
        results.comments = Array.isArray(commentsData) ? commentsData : commentsData.comments || [];
        itemsScraped += results.comments?.length || 0;

        // Get the internal post_id from our database
        const { data: postRecord } = await supabase
          .from('social_posts')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        if (postRecord && results.comments) {
          const commentsToInsert = results.comments.map((comment: Record<string, unknown>) => ({
            user_id: user.id,
            post_id: postRecord.id,
            platform,
            comment_id: String(comment.pk || comment.id),
            author_username: (comment.user as Record<string, unknown>)?.username || comment.username,
            author_display_name: (comment.user as Record<string, unknown>)?.full_name || comment.full_name,
            author_profile_url: `https://${platform}.com/${(comment.user as Record<string, unknown>)?.username || comment.username}`,
            author_avatar_url: (comment.user as Record<string, unknown>)?.profile_pic_url,
            content: comment.text || comment.content,
            likes_count: comment.comment_like_count || comment.likes || 0,
            is_verified: (comment.user as Record<string, unknown>)?.is_verified || false,
            commented_at: comment.created_at ? new Date(Number(comment.created_at) * 1000).toISOString() : null,
          }));

          const { error: insertError } = await supabase
            .from('social_comments')
            .upsert(commentsToInsert, { onConflict: 'post_id,comment_id' });

          if (insertError) {
            console.error('Error inserting comments:', insertError);
          }
        }
      } catch (e) {
        console.error('Comments fetch error:', e);
      }
    }

    if ((scrapeType === 'followers' || scrapeType === 'full') && config.endpoints.followers) {
      try {
        const followersData = await fetchFromRapidAPI(config.endpoints.followers, { 
          username,
          count: String(maxItems),
        });
        results.followers = Array.isArray(followersData) ? followersData : followersData.users || followersData.data || [];
        itemsScraped += results.followers?.length || 0;

        if (results.followers && results.followers.length > 0) {
          const connectionsToInsert = results.followers.map((follower: Record<string, unknown>) => ({
            user_id: user.id,
            profile_id: profileId,
            platform,
            connection_type: 'follower',
            connected_username: follower.username,
            connected_user_id: String(follower.pk || follower.id),
            connected_profile_url: `https://${platform}.com/${follower.username}`,
            connected_display_name: follower.full_name,
            connected_avatar_url: follower.profile_pic_url,
            connected_bio: follower.biography,
            connected_followers_count: follower.follower_count,
            connected_verified: follower.is_verified || false,
          }));

          const { error: insertError } = await supabase
            .from('social_connections')
            .upsert(connectionsToInsert, { onConflict: 'profile_id,platform,connection_type,connected_username' });

          if (insertError) {
            console.error('Error inserting followers:', insertError);
          }
        }
      } catch (e) {
        console.error('Followers fetch error:', e);
      }
    }

    if ((scrapeType === 'following' || scrapeType === 'full') && config.endpoints.following) {
      try {
        const followingData = await fetchFromRapidAPI(config.endpoints.following, { 
          username,
          count: String(maxItems),
        });
        results.following = Array.isArray(followingData) ? followingData : followingData.users || followingData.data || [];
        itemsScraped += results.following?.length || 0;

        if (results.following && results.following.length > 0) {
          const connectionsToInsert = results.following.map((following: Record<string, unknown>) => ({
            user_id: user.id,
            profile_id: profileId,
            platform,
            connection_type: 'following',
            connected_username: following.username,
            connected_user_id: String(following.pk || following.id),
            connected_profile_url: `https://${platform}.com/${following.username}`,
            connected_display_name: following.full_name,
            connected_avatar_url: following.profile_pic_url,
            connected_bio: following.biography,
            connected_followers_count: following.follower_count,
            connected_verified: following.is_verified || false,
          }));

          const { error: insertError } = await supabase
            .from('social_connections')
            .upsert(connectionsToInsert, { onConflict: 'profile_id,platform,connection_type,connected_username' });

          if (insertError) {
            console.error('Error inserting following:', insertError);
          }
        }
      } catch (e) {
        console.error('Following fetch error:', e);
      }
    }

    if (scrapeType === 'likers' && postId && config.endpoints.likers) {
      try {
        const likersData = await fetchFromRapidAPI(config.endpoints.likers, { 
          media_id: postId,
          count: String(maxItems),
        });
        results.likers = Array.isArray(likersData) ? likersData : likersData.users || [];
        itemsScraped += results.likers?.length || 0;

        // Get the internal post_id
        const { data: postRecord } = await supabase
          .from('social_posts')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();

        if (postRecord && results.likers) {
          const likersToInsert = results.likers.map((liker: Record<string, unknown>) => ({
            user_id: user.id,
            post_id: postRecord.id,
            liker_username: liker.username,
            liker_user_id: String(liker.pk || liker.id),
            liker_profile_url: `https://${platform}.com/${liker.username}`,
            liker_display_name: liker.full_name,
            liker_avatar_url: liker.profile_pic_url,
            liker_verified: liker.is_verified || false,
          }));

          const { error: insertError } = await supabase
            .from('social_likers')
            .upsert(likersToInsert, { onConflict: 'post_id,liker_username' });

          if (insertError) {
            console.error('Error inserting likers:', insertError);
          }
        }
      } catch (e) {
        console.error('Likers fetch error:', e);
      }
    }

    const duration = Date.now() - startTime;

    // Update job status
    if (job) {
      await supabase
        .from('social_scrape_jobs')
        .update({
          status: 'completed',
          items_scraped: itemsScraped,
          cost_cents: estimatedCost,
          completed_at: new Date().toISOString(),
          raw_response: results,
        })
        .eq('id', job.id);
    }

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'scrape-comprehensive-social',
      provider: 'rapidapi',
      model_name: platform,
      estimated_cost_cents: estimatedCost,
      status: 'success',
      response_time_ms: duration,
      request_metadata: { platform, scrapeType, username, maxItems },
      response_metadata: { itemsScraped },
    });

    return new Response(JSON.stringify({
      success: true,
      jobId: job?.id,
      platform,
      scrapeType,
      itemsScraped,
      estimatedCostCents: estimatedCost,
      durationMs: duration,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scrape-comprehensive-social:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});