import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all methodology outcomes
    const { data: outcomes, error: outcomesError } = await supabase
      .from('methodology_outcomes')
      .select('*')
      .order('applied_at', { ascending: false });

    if (outcomesError) throw outcomesError;

    // Group outcomes by user and profile
    const userProfileStats: Record<string, Record<string, {
      methodologies: Record<string, { positive: number; neutral: number; negative: number; totalScore: number; count: number }>;
      overallSuccess: number;
      totalInteractions: number;
    }>> = {};

    for (const outcome of outcomes || []) {
      const userId = outcome.user_id;
      const profileId = outcome.profile_id;
      const methodology = outcome.methodology_name || 'Unknown';
      const response = outcome.response_observed || 'neutral';
      const score = outcome.outcome_score || 3;

      if (!userProfileStats[userId]) userProfileStats[userId] = {};
      if (!userProfileStats[userId][profileId]) {
        userProfileStats[userId][profileId] = {
          methodologies: {},
          overallSuccess: 0,
          totalInteractions: 0,
        };
      }

      const profileStat = userProfileStats[userId][profileId];
      if (!profileStat.methodologies[methodology]) {
        profileStat.methodologies[methodology] = { positive: 0, neutral: 0, negative: 0, totalScore: 0, count: 0 };
      }

      const methodStat = profileStat.methodologies[methodology];
      methodStat[response as 'positive' | 'neutral' | 'negative']++;
      methodStat.totalScore += score;
      methodStat.count++;
      profileStat.totalInteractions++;
      if (response === 'positive') profileStat.overallSuccess++;
    }

    // Generate insights and update influence profiles
    const insights: any[] = [];
    let profilesUpdated = 0;

    for (const [userId, profiles] of Object.entries(userProfileStats)) {
      for (const [profileId, stats] of Object.entries(profiles)) {
        // Skip if not enough data
        if (stats.totalInteractions < 3) continue;

        // Calculate best and worst methodologies
        const methodologyRankings = Object.entries(stats.methodologies)
          .map(([name, data]) => ({
            name,
            successRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
            avgScore: data.count > 0 ? data.totalScore / data.count : 0,
            count: data.count,
          }))
          .filter(m => m.count >= 2)
          .sort((a, b) => b.successRate - a.successRate);

        const bestMethodologies = methodologyRankings.slice(0, 3).map(m => m.name);
        const worstMethodologies = methodologyRankings.slice(-2).map(m => m.name);

        insights.push({
          userId,
          profileId,
          overallSuccessRate: (stats.overallSuccess / stats.totalInteractions) * 100,
          totalInteractions: stats.totalInteractions,
          bestMethodologies,
          worstMethodologies,
          methodologyRankings,
        });

        // Update influence profile with recommended methodologies
        if (bestMethodologies.length > 0) {
          const { error: updateError } = await supabase
            .from('contact_influence_profiles')
            .update({
              recommended_methodologies: bestMethodologies,
              updated_at: new Date().toISOString(),
            })
            .eq('profile_id', profileId)
            .eq('user_id', userId);

          if (!updateError) profilesUpdated++;
        }

        // Create insight activity
        await supabase.from('contact_activity_feed').insert({
          user_id: userId,
          profile_id: profileId,
          activity_type: 'insight',
          activity_subtype: 'methodology_analysis',
          title: 'Methodology Effectiveness Updated',
          description: `Based on ${stats.totalInteractions} interactions: ${bestMethodologies.length > 0 ? `${bestMethodologies[0]} works best` : 'Keep recording outcomes'}`,
          importance_score: 60,
          metadata: {
            successRate: (stats.overallSuccess / stats.totalInteractions) * 100,
            bestMethodologies,
            worstMethodologies,
          },
        });
      }
    }

    // Generate global methodology effectiveness report
    const globalStats: Record<string, { positive: number; neutral: number; negative: number; totalScore: number; count: number }> = {};
    
    for (const outcome of outcomes || []) {
      const methodology = outcome.methodology_name || 'Unknown';
      if (!globalStats[methodology]) {
        globalStats[methodology] = { positive: 0, neutral: 0, negative: 0, totalScore: 0, count: 0 };
      }
      const response = outcome.response_observed || 'neutral';
      globalStats[methodology][response as 'positive' | 'neutral' | 'negative']++;
      globalStats[methodology].totalScore += outcome.outcome_score || 3;
      globalStats[methodology].count++;
    }

    const globalRankings = Object.entries(globalStats)
      .map(([name, data]) => ({
        name,
        successRate: data.count > 0 ? (data.positive / data.count) * 100 : 0,
        avgScore: data.count > 0 ? data.totalScore / data.count : 0,
        totalUses: data.count,
      }))
      .filter(m => m.totalUses >= 5)
      .sort((a, b) => b.successRate - a.successRate);

    return new Response(
      JSON.stringify({
        success: true,
        insightsGenerated: insights.length,
        profilesUpdated,
        globalTopMethodologies: globalRankings.slice(0, 10),
        totalOutcomesAnalyzed: outcomes?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing effectiveness:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
