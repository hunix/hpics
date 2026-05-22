import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const __url = new URL(req.url);
  if (__url.searchParams.get("healthCheck") === "1") {
    return new Response(JSON.stringify({ ok: true, function: "suggest-outreach-timing", timestamp: Date.now() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    try {
      const { data: claimsData, error: claimsError } = await (supabaseClient.auth as any).getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = claimsData.claims.sub as string;
    } catch (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = { id: userId };

    const { profileId } = await req.json();

    // Fetch communications for this contact
    const { data: communications, error: commsError } = await supabaseClient
      .from('communications')
      .select('occurred_at, channel, direction, sentiment_score')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(100);

    if (commsError) {
      console.error('Error fetching communications:', commsError);
      throw commsError;
    }

    // Fetch profile info
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name, relationship_type')
      .eq('id', profileId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }

    // Analyze patterns
    const dayOfWeekCounts: Record<number, { count: number; avgSentiment: number }> = {};
    const hourCounts: Record<number, { count: number; avgSentiment: number }> = {};
    const channelStats: Record<string, { count: number; avgSentiment: number }> = {};

    for (let i = 0; i < 7; i++) {
      dayOfWeekCounts[i] = { count: 0, avgSentiment: 0 };
    }
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = { count: 0, avgSentiment: 0 };
    }

    (communications || []).forEach((comm) => {
      const date = new Date(comm.occurred_at);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const sentiment = comm.sentiment_score ?? 0.5;

      dayOfWeekCounts[dayOfWeek].count++;
      dayOfWeekCounts[dayOfWeek].avgSentiment += sentiment;

      hourCounts[hour].count++;
      hourCounts[hour].avgSentiment += sentiment;

      if (comm.channel) {
        if (!channelStats[comm.channel]) {
          channelStats[comm.channel] = { count: 0, avgSentiment: 0 };
        }
        channelStats[comm.channel].count++;
        channelStats[comm.channel].avgSentiment += sentiment;
      }
    });

    // Calculate averages
    Object.keys(dayOfWeekCounts).forEach((key) => {
      const k = Number(key);
      if (dayOfWeekCounts[k].count > 0) {
        dayOfWeekCounts[k].avgSentiment /= dayOfWeekCounts[k].count;
      }
    });

    Object.keys(hourCounts).forEach((key) => {
      const k = Number(key);
      if (hourCounts[k].count > 0) {
        hourCounts[k].avgSentiment /= hourCounts[k].count;
      }
    });

    Object.keys(channelStats).forEach((key) => {
      if (channelStats[key].count > 0) {
        channelStats[key].avgSentiment /= channelStats[key].count;
      }
    });

    // Find best days (score = count * avgSentiment)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const bestDays = Object.entries(dayOfWeekCounts)
      .map(([day, stats]) => ({
        day: dayNames[Number(day)],
        dayIndex: Number(day),
        score: stats.count * stats.avgSentiment,
        count: stats.count,
        avgSentiment: stats.avgSentiment,
      }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Find best hours
    const bestHours = Object.entries(hourCounts)
      .map(([hour, stats]) => ({
        hour: Number(hour),
        hourFormatted: `${Number(hour) % 12 || 12}:00 ${Number(hour) >= 12 ? 'PM' : 'AM'}`,
        score: stats.count * stats.avgSentiment,
        count: stats.count,
        avgSentiment: stats.avgSentiment,
      }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Best channels
    const bestChannels = Object.entries(channelStats)
      .map(([channel, stats]) => ({
        channel,
        score: stats.count * stats.avgSentiment,
        count: stats.count,
        avgSentiment: stats.avgSentiment,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    // Generate AI recommendations using unified wrapper
    let aiRecommendation = '';
    if (communications && communications.length >= 5) {
      const prompt = `Based on communication patterns with ${profile.first_name} ${profile.last_name || ''} (${profile.relationship_type || 'contact'}):

Best days: ${bestDays.map(d => `${d.day} (${d.count} interactions, ${Math.round(d.avgSentiment * 100)}% positive sentiment)`).join(', ')}
Best times: ${bestHours.map(h => `${h.hourFormatted} (${h.count} interactions)`).join(', ')}
Preferred channels: ${bestChannels.map(c => `${c.channel} (${c.count} uses)`).join(', ')}

Provide a brief, actionable recommendation (2-3 sentences) for the optimal time and method to reach out to this person for maximum engagement.`;

      try {
        // Get AI config for model selection
        const supabaseService = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const aiConfig = await getAIConfig(supabaseService, user.id);

        const aiResponse = await callAI({
          model: aiConfig.speedModel, // Use speed model for timing suggestions
          messages: [
            { role: 'system', content: 'You are a relationship management assistant. Give brief, practical advice.' },
            { role: 'user', content: prompt }
          ],
          userId: user.id,
          functionName: 'suggest-outreach-timing',
          profileId,
          temperature: aiConfig.temperature,
          maxTokens: 300,
          metadata: {
            total_interactions: communications.length,
            best_day: bestDays[0]?.day,
            best_hour: bestHours[0]?.hourFormatted,
          },
        });

        aiRecommendation = aiResponse.content;
      } catch (aiError) {
        console.error('AI recommendation error:', aiError);
      }
    }

    const result = {
      profileId,
      profileName: `${profile.first_name} ${profile.last_name || ''}`.trim(),
      totalInteractions: communications?.length || 0,
      bestDays,
      bestHours,
      bestChannels,
      aiRecommendation,
      analysisDate: new Date().toISOString(),
    };

    console.log('Outreach timing analysis complete for profile:', profileId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in suggest-outreach-timing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
