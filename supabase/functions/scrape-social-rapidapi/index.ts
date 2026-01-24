// RapidAPI Social - Multi-platform social media intelligence
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SocialRequest {
  profileId: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'all';
  username?: string;
  handle?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'scrape-social-rapidapi', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
    if (!RAPIDAPI_KEY) {
      return new Response(JSON.stringify({ 
        error: 'RapidAPI key not configured',
        instructions: 'Add RAPIDAPI_KEY in Settings → Integrations'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      profileId,
      platform,
      username,
      handle,
    }: SocialRequest = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch profile for social handles
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    console.log(`RapidAPI social scrape for profile ${profileId}, platform: ${platform}`);

    const startTime = Date.now();
    const results: Record<string, any> = {};
    let totalCost = 0;

    // Instagram lookup
    if (platform === 'instagram' || platform === 'all') {
      const igHandle = username || handle || profile?.instagram_handle;
      if (igHandle) {
        try {
          const response = await fetch(
            `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${encodeURIComponent(igHandle)}`,
            {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            results.instagram = {
              username: data.data?.username,
              fullName: data.data?.full_name,
              bio: data.data?.biography,
              followers: data.data?.follower_count,
              following: data.data?.following_count,
              posts: data.data?.media_count,
              isVerified: data.data?.is_verified,
              isPrivate: data.data?.is_private,
              profilePicUrl: data.data?.profile_pic_url_hd || data.data?.profile_pic_url,
              externalUrl: data.data?.external_url,
              category: data.data?.category,
            };
            totalCost += 3;
          }
        } catch (e) {
          console.warn('Instagram lookup failed:', e);
        }
      }
    }

    // Twitter/X lookup
    if (platform === 'twitter' || platform === 'all') {
      const twHandle = username || handle || profile?.twitter_handle;
      if (twHandle) {
        try {
          const cleanHandle = twHandle.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '');
          
          const response = await fetch(
            `https://twitter-api45.p.rapidapi.com/screenname.php?screenname=${encodeURIComponent(cleanHandle)}`,
            {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'twitter-api45.p.rapidapi.com',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            results.twitter = {
              username: data.screen_name || data.username,
              displayName: data.name,
              bio: data.description,
              followers: data.followers_count || data.followers,
              following: data.following_count || data.following,
              tweets: data.statuses_count || data.tweets,
              isVerified: data.verified || data.is_blue_verified,
              location: data.location,
              website: data.url,
              createdAt: data.created_at,
              profileImageUrl: data.profile_image_url_https || data.avatar,
              bannerUrl: data.profile_banner_url,
            };
            totalCost += 3;
          }
        } catch (e) {
          console.warn('Twitter lookup failed:', e);
        }
      }
    }

    // TikTok lookup
    if (platform === 'tiktok' || platform === 'all') {
      const ttHandle = username || handle || profile?.tiktok_handle;
      if (ttHandle) {
        try {
          const cleanHandle = ttHandle.replace('@', '').replace('https://tiktok.com/@', '');
          
          const response = await fetch(
            `https://tiktok-scraper7.p.rapidapi.com/user/info?unique_id=${encodeURIComponent(cleanHandle)}`,
            {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const userData = data.data?.user || data.userInfo?.user || {};
            const stats = data.data?.stats || data.userInfo?.stats || {};
            
            results.tiktok = {
              username: userData.uniqueId,
              nickname: userData.nickname,
              bio: userData.signature,
              followers: stats.followerCount,
              following: stats.followingCount,
              likes: stats.heartCount,
              videos: stats.videoCount,
              isVerified: userData.verified,
              isPrivate: userData.privateAccount,
              profilePicUrl: userData.avatarLarger || userData.avatarMedium,
            };
            totalCost += 3;
          }
        } catch (e) {
          console.warn('TikTok lookup failed:', e);
        }
      }
    }

    const responseTime = Date.now() - startTime;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      profile_id: profileId,
      function_name: 'scrape-social-rapidapi',
      provider: 'rapidapi',
      model_name: platform,
      estimated_cost_cents: totalCost,
      response_time_ms: responseTime,
      status: Object.keys(results).length > 0 ? 'success' : 'error',
    });

    // Update profile with social data
    const profileUpdate: Record<string, any> = {
      last_enriched_at: new Date().toISOString(),
    };

    if (results.instagram) {
      profileUpdate.instagram_handle = results.instagram.username;
      profileUpdate.instagram_followers = results.instagram.followers;
      if (!profile?.avatar_url && results.instagram.profilePicUrl) {
        profileUpdate.avatar_url = results.instagram.profilePicUrl;
      }
    }

    if (results.twitter) {
      profileUpdate.twitter_handle = results.twitter.username;
      profileUpdate.twitter_followers = results.twitter.followers;
      // Note: location column doesn't exist on profiles table - use city instead
      if (results.twitter.location && !profile?.city) {
        profileUpdate.city = results.twitter.location;
      }
    }

    if (results.tiktok) {
      profileUpdate.tiktok_handle = results.tiktok.username;
      profileUpdate.tiktok_followers = results.tiktok.followers;
    }

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profileId);

    // Store as OSINT findings
    for (const [platformName, data] of Object.entries(results)) {
      await supabase.from('osint_findings').insert({
        user_id: user.id,
        profile_id: profileId,
        finding_type: 'social_profile',
        source: platformName,
        title: `${platformName.charAt(0).toUpperCase() + platformName.slice(1)} Profile`,
        content_snippet: (data as any).bio?.substring(0, 200) || `${(data as any).followers || 0} followers`,
        full_content: JSON.stringify(data),
        metadata: {
          platform: platformName,
          followers: (data as any).followers,
          isVerified: (data as any).isVerified,
        },
        verification_status: 'verified',
        relevance_score: 0.9,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      platforms: results,
      platformsFound: Object.keys(results).length,
      responseTimeMs: responseTime,
      estimatedCostCents: totalCost,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('RapidAPI social error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
