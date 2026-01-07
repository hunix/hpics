import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const user = { id: claimsData.claims.sub as string };

    const { profile_id } = await req.json();

    // Fetch communications for baseline
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    let commQuery = supabase
      .from('communications')
      .select('profile_id, channel, occurred_at, sentiment_score')
      .eq('user_id', user.id)
      .gte('occurred_at', ninetyDaysAgo)
      .order('occurred_at', { ascending: false });

    if (profile_id) {
      commQuery = commQuery.eq('profile_id', profile_id);
    }

    const { data: communications } = await commQuery;

    // Fetch messages
    let msgQuery = supabase
      .from('messages')
      .select('conversation_id, sent_at, sender_type, conversations!inner(profile_id)')
      .eq('user_id', user.id)
      .gte('sent_at', ninetyDaysAgo);

    const { data: messages } = await msgQuery;

    // Group by profile
    const profileStats = new Map<string, {
      dailyCounts: Map<string, number>;
      channels: Map<string, number>;
      sentiments: number[];
      responseGaps: number[];
      lastContact: Date | null;
    }>();

    const getProfileStats = (id: string) => {
      if (!profileStats.has(id)) {
        profileStats.set(id, {
          dailyCounts: new Map(),
          channels: new Map(),
          sentiments: [],
          responseGaps: [],
          lastContact: null,
        });
      }
      return profileStats.get(id)!;
    };

    // Process communications
    communications?.forEach(c => {
      const stats = getProfileStats(c.profile_id);
      const day = c.occurred_at.split('T')[0];
      stats.dailyCounts.set(day, (stats.dailyCounts.get(day) || 0) + 1);
      stats.channels.set(c.channel, (stats.channels.get(c.channel) || 0) + 1);
      if (c.sentiment_score !== null) {
        stats.sentiments.push(c.sentiment_score);
      }
      const date = new Date(c.occurred_at);
      if (!stats.lastContact || date > stats.lastContact) {
        stats.lastContact = date;
      }
    });

    // Process messages
    messages?.forEach(m => {
      const profileId = (m.conversations as any)?.profile_id;
      if (profileId) {
        const stats = getProfileStats(profileId);
        const day = m.sent_at.split('T')[0];
        stats.dailyCounts.set(day, (stats.dailyCounts.get(day) || 0) + 1);
        const date = new Date(m.sent_at);
        if (!stats.lastContact || date > stats.lastContact) {
          stats.lastContact = date;
        }
      }
    });

    // Calculate baselines and detect anomalies
    const anomalies: any[] = [];
    const baselines: any[] = [];
    const now = new Date();

    for (const [profileId, stats] of profileStats) {
      // Calculate communication frequency baseline
      const dailyValues = Array.from(stats.dailyCounts.values());
      if (dailyValues.length >= 7) {
        const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
        const variance = dailyValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyValues.length;
        const stdDev = Math.sqrt(variance);

        baselines.push({
          user_id: user.id,
          profile_id: profileId,
          baseline_type: 'communication_frequency',
          baseline_data: { mean, std_dev: stdDev, sample_days: dailyValues.length },
          confidence_score: Math.min(100, dailyValues.length * 2),
          sample_size: dailyValues.length,
        });

        // Check for recent frequency drop
        const recentDays = Array.from(stats.dailyCounts.entries())
          .filter(([day]) => new Date(day) > new Date(thirtyDaysAgo))
          .map(([, count]) => count);
        
        if (recentDays.length > 0) {
          const recentMean = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
          if (mean > 0 && recentMean < mean * 0.5 && stdDev > 0) {
            const deviation = (mean - recentMean) / stdDev;
            if (deviation > 1.5) {
              anomalies.push({
                user_id: user.id,
                profile_id: profileId,
                anomaly_type: 'frequency_drop',
                severity: deviation > 2.5 ? 'high' : deviation > 2 ? 'medium' : 'low',
                description: `Communication frequency dropped ${Math.round((1 - recentMean / mean) * 100)}% below baseline`,
                expected_value: { mean, std_dev: stdDev },
                actual_value: { recent_mean: recentMean },
                deviation_score: deviation,
              });
            }
          }
        }
      }

      // Sentiment baseline and anomaly detection
      if (stats.sentiments.length >= 5) {
        const sentMean = stats.sentiments.reduce((a, b) => a + b, 0) / stats.sentiments.length;
        const sentVariance = stats.sentiments.reduce((a, b) => a + Math.pow(b - sentMean, 2), 0) / stats.sentiments.length;
        const sentStdDev = Math.sqrt(sentVariance);

        baselines.push({
          user_id: user.id,
          profile_id: profileId,
          baseline_type: 'sentiment',
          baseline_data: { mean: sentMean, std_dev: sentStdDev, sample_size: stats.sentiments.length },
          confidence_score: Math.min(100, stats.sentiments.length * 5),
          sample_size: stats.sentiments.length,
        });

        // Check for sentiment shift
        const recentSentiments = stats.sentiments.slice(-5);
        const recentSentMean = recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length;
        
        if (sentStdDev > 0 && Math.abs(recentSentMean - sentMean) > sentStdDev * 1.5) {
          anomalies.push({
            user_id: user.id,
            profile_id: profileId,
            anomaly_type: 'sentiment_shift',
            severity: recentSentMean < sentMean ? 'medium' : 'low',
            description: recentSentMean < sentMean 
              ? `Sentiment has declined from ${sentMean.toFixed(1)} to ${recentSentMean.toFixed(1)}`
              : `Sentiment has improved from ${sentMean.toFixed(1)} to ${recentSentMean.toFixed(1)}`,
            expected_value: { mean: sentMean },
            actual_value: { recent_mean: recentSentMean },
            deviation_score: Math.abs(recentSentMean - sentMean) / sentStdDev,
          });
        }
      }

      // Silence detection
      if (stats.lastContact) {
        const daysSilent = Math.floor((now.getTime() - stats.lastContact.getTime()) / (1000 * 60 * 60 * 24));
        const avgGap = dailyValues.length > 0 ? 90 / dailyValues.length : 30;
        
        if (daysSilent > avgGap * 2 && daysSilent > 14) {
          anomalies.push({
            user_id: user.id,
            profile_id: profileId,
            anomaly_type: 'unusual_silence',
            severity: daysSilent > 60 ? 'high' : daysSilent > 30 ? 'medium' : 'low',
            description: `No contact for ${daysSilent} days (expected every ${Math.round(avgGap)} days)`,
            expected_value: { avg_gap_days: avgGap },
            actual_value: { days_silent: daysSilent },
            deviation_score: daysSilent / avgGap,
          });
        }
      }

      // Channel preference shift
      const channelEntries = Array.from(stats.channels.entries());
      if (channelEntries.length > 1) {
        baselines.push({
          user_id: user.id,
          profile_id: profileId,
          baseline_type: 'channel_preference',
          baseline_data: Object.fromEntries(channelEntries),
          confidence_score: Math.min(100, channelEntries.reduce((a, [, c]) => a + c, 0) * 2),
          sample_size: channelEntries.reduce((a, [, c]) => a + c, 0),
        });
      }
    }

    // Store baselines (upsert)
    for (const baseline of baselines) {
      await supabase
        .from('behavioral_baselines')
        .upsert(baseline, { onConflict: 'user_id,profile_id,baseline_type' });
    }

    // Store anomalies
    if (anomalies.length > 0) {
      await supabase.from('behavioral_anomalies').insert(anomalies);
    }

    return new Response(JSON.stringify({
      success: true,
      baselines_updated: baselines.length,
      anomalies_detected: anomalies.length,
      anomalies: anomalies.map(a => ({
        profile_id: a.profile_id,
        type: a.anomaly_type,
        severity: a.severity,
        description: a.description,
      })),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Anomaly detection error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
