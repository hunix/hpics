// Aggregate Social Intelligence - Combines data from multiple sources
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AggregateRequest {
  profileId: string;
  platforms?: ('instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'threads')[];
  includeAnalysis?: boolean;
  timeRange?: 'day' | 'week' | 'month' | 'all';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, platforms, includeAnalysis = true, timeRange = 'all' }: AggregateRequest = await req.json();

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Profile ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const startTime = Date.now();

    // Get time filter
    let timeFilter: string | undefined;
    const now = new Date();
    switch (timeRange) {
      case 'day':
        timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'week':
        timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'month':
        timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }

    // Aggregate from all sources in parallel
    const [postsResult, connectionsResult, osintResult, scrapeCacheResult] = await Promise.all([
      // Social posts
      supabase
        .from('social_posts')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('posted_at', { ascending: false })
        .limit(200),
      
      // Social connections
      supabase
        .from('social_connections')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .limit(500),
      
      // OSINT findings
      supabase
        .from('osint_findings')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .eq('finding_type', 'social_profile')
        .order('scraped_at', { ascending: false })
        .limit(50),
      
      // Scrape cache
      supabase
        .from('social_scrape_cache')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('cached_at', { ascending: false })
        .limit(20),
    ]);

    // Filter by platforms if specified
    let posts = postsResult.data || [];
    let connections = connectionsResult.data || [];
    
    if (platforms && platforms.length > 0) {
      posts = posts.filter(p => platforms.includes(p.platform));
      connections = connections.filter(c => platforms.includes(c.platform));
    }

    if (timeFilter) {
      posts = posts.filter(p => p.posted_at && new Date(p.posted_at) >= new Date(timeFilter));
    }

    // Calculate aggregated metrics
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views_count || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.shares_count || 0), 0);

    // Platform breakdown
    const platformBreakdown: Record<string, { posts: number; likes: number; comments: number; followers: number; following: number }> = {};
    
    for (const post of posts) {
      if (!platformBreakdown[post.platform]) {
        platformBreakdown[post.platform] = { posts: 0, likes: 0, comments: 0, followers: 0, following: 0 };
      }
      platformBreakdown[post.platform].posts++;
      platformBreakdown[post.platform].likes += post.likes_count || 0;
      platformBreakdown[post.platform].comments += post.comments_count || 0;
    }

    for (const conn of connections) {
      if (!platformBreakdown[conn.platform]) {
        platformBreakdown[conn.platform] = { posts: 0, likes: 0, comments: 0, followers: 0, following: 0 };
      }
      if (conn.connection_type === 'follower') {
        platformBreakdown[conn.platform].followers++;
      } else if (conn.connection_type === 'following') {
        platformBreakdown[conn.platform].following++;
      }
    }

    // Top hashtags
    const hashtagCounts: Record<string, number> = {};
    for (const post of posts) {
      for (const tag of (post.hashtags || [])) {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      }
    }
    const topHashtags = Object.entries(hashtagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Engagement analysis
    const engagementByDay: Record<string, { posts: number; engagement: number }> = {};
    for (const post of posts) {
      if (post.posted_at) {
        const day = post.posted_at.substring(0, 10);
        if (!engagementByDay[day]) {
          engagementByDay[day] = { posts: 0, engagement: 0 };
        }
        engagementByDay[day].posts++;
        engagementByDay[day].engagement += (post.likes_count || 0) + (post.comments_count || 0) * 2;
      }
    }

    // Posting frequency
    const postDates = posts
      .filter(p => p.posted_at)
      .map(p => new Date(p.posted_at!).getTime())
      .sort((a, b) => a - b);
    
    let postingFrequency = 'Unknown';
    if (postDates.length >= 2) {
      const days = (postDates[postDates.length - 1] - postDates[0]) / (1000 * 60 * 60 * 24);
      const postsPerDay = postDates.length / Math.max(days, 1);
      
      if (postsPerDay >= 1) {
        postingFrequency = `${postsPerDay.toFixed(1)} posts/day`;
      } else if (postsPerDay >= 0.14) {
        postingFrequency = `${(postsPerDay * 7).toFixed(1)} posts/week`;
      } else {
        postingFrequency = `${(postsPerDay * 30).toFixed(1)} posts/month`;
      }
    }

    // Best performing content
    const bestPost = posts.reduce((best, current) => {
      const currentScore = (current.likes_count || 0) + (current.comments_count || 0) * 2 + (current.shares_count || 0) * 3;
      const bestScore = best ? (best.likes_count || 0) + (best.comments_count || 0) * 2 + (best.shares_count || 0) * 3 : 0;
      return currentScore > bestScore ? current : best;
    }, posts[0]);

    // Mutual connections (follow each other)
    const followers = connections.filter(c => c.connection_type === 'follower');
    const following = connections.filter(c => c.connection_type === 'following');
    const followerUsernames = new Set(followers.map(f => f.connected_username));
    const mutualConnections = following.filter(f => followerUsernames.has(f.connected_username));

    // Top influential connections
    const influentialConnections = [...connections]
      .filter(c => c.connected_followers_count)
      .sort((a, b) => (b.connected_followers_count || 0) - (a.connected_followers_count || 0))
      .slice(0, 10);

    // AI Analysis (if requested and API available)
    let aiAnalysis = null;
    if (includeAnalysis && posts.length > 0) {
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: 'You are a social media intelligence analyst. Analyze the provided social media data and provide insights about the person\'s online presence, content strategy, and engagement patterns. Be concise and actionable.'
                },
                {
                  role: 'user',
                  content: `Analyze this social media intelligence:

Total Posts: ${totalPosts}
Total Engagement: ${totalLikes + totalComments} (${totalLikes} likes, ${totalComments} comments)
Total Views: ${totalViews}
Followers: ${followers.length}
Following: ${following.length}
Mutual Connections: ${mutualConnections.length}
Posting Frequency: ${postingFrequency}

Top Hashtags: ${topHashtags.slice(0, 10).map(h => '#' + h.tag).join(', ')}

Recent Post Topics: ${posts.slice(0, 10).map(p => p.content?.substring(0, 50) || '(no caption)').join(' | ')}

Provide a brief analysis covering:
1. Content themes and interests
2. Engagement patterns
3. Network characteristics
4. Key observations`
                }
              ],
              temperature: 0.7,
              max_tokens: 500,
            }),
          });

          if (analysisResponse.ok) {
            const aiResult = await analysisResponse.json();
            aiAnalysis = aiResult.choices?.[0]?.message?.content;
          }
        }
      } catch (e) {
        console.error('AI analysis error:', e);
      }
    }

    const aggregation = {
      profileId,
      aggregatedAt: new Date().toISOString(),
      timeRange,
      platforms: Object.keys(platformBreakdown),
      
      // Summary metrics
      summary: {
        totalPosts,
        totalLikes,
        totalComments,
        totalViews,
        totalShares,
        totalFollowers: followers.length,
        totalFollowing: following.length,
        mutualConnections: mutualConnections.length,
        postingFrequency,
        avgEngagementPerPost: totalPosts > 0 ? Math.round((totalLikes + totalComments) / totalPosts) : 0,
      },
      
      // Detailed breakdowns
      platformBreakdown,
      topHashtags,
      engagementByDay,
      
      // Notable content
      bestPerformingPost: bestPost ? {
        id: bestPost.id,
        platform: bestPost.platform,
        content: bestPost.content?.substring(0, 200),
        likes: bestPost.likes_count,
        comments: bestPost.comments_count,
        postedAt: bestPost.posted_at,
      } : null,
      
      // Network insights
      network: {
        mutualConnectionsCount: mutualConnections.length,
        influentialConnections: influentialConnections.map(c => ({
          username: c.connected_username,
          platform: c.platform,
          followers: c.connected_followers_count,
          verified: c.connected_verified,
        })),
      },
      
      // AI analysis
      aiAnalysis,
      
      // Processing stats
      processingTimeMs: Date.now() - startTime,
      dataSourceCounts: {
        posts: posts.length,
        connections: connections.length,
        osintFindings: osintResult.data?.length || 0,
        cachedData: scrapeCacheResult.data?.length || 0,
      },
    };

    // Cache the aggregation result
    await supabase.from('social_scrape_cache').upsert({
      user_id: user.id,
      profile_id: profileId,
      platform: 'aggregated',
      scrape_type: 'full',
      raw_data: aggregation,
      extracted_data: aggregation.summary,
      cached_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
    }, { onConflict: 'user_id,profile_id,platform,scrape_type' });

    return new Response(JSON.stringify(aggregation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in aggregate-social-intelligence:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
