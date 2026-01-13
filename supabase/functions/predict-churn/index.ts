import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { CHURN_PROMPTS, fillTemplate } from "../_shared/prompts.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChurnFeatures {
  days_since_contact: number;
  contact_frequency_trend: 'increasing' | 'stable' | 'decreasing' | 'stopped';
  sentiment_trajectory: 'improving' | 'stable' | 'declining' | 'unknown';
  response_time_trend: 'faster' | 'stable' | 'slower' | 'unknown';
  engagement_level: 'high' | 'medium' | 'low' | 'none';
  relationship_importance: number;
  communication_gaps: number[];
  recent_negative_events: number;
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

    const { profileId, includeAllContacts = false } = await req.json();

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

    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch profiles to analyze (active only)
    let profileQuery = supabase.from('profiles').select('*').eq('user_id', user.id).eq('is_active', true);
    if (profileId && !includeAllContacts) {
      profileQuery = profileQuery.eq('id', profileId);
    }
    const { data: profiles, error: profilesError } = await profileQuery;

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No profiles found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const churnPredictions = await Promise.all(profiles.map(async (profile) => {
      // Fetch communication data
      const [
        { data: recentComms },
        { data: olderComms },
        { data: trends },
        { data: anomalies },
      ] = await Promise.all([
        supabase.from('communications')
          .select('*')
          .eq('profile_id', profile.id)
          .gte('occurred_at', oneMonthAgo.toISOString())
          .order('occurred_at', { ascending: false }),
        supabase.from('communications')
          .select('*')
          .eq('profile_id', profile.id)
          .lt('occurred_at', oneMonthAgo.toISOString())
          .gte('occurred_at', threeMonthsAgo.toISOString())
          .order('occurred_at', { ascending: false }),
        supabase.from('relationship_trends')
          .select('*')
          .eq('profile_id', profile.id)
          .order('recorded_at', { ascending: false })
          .limit(12),
        supabase.from('behavioral_anomalies')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('is_resolved', false),
      ]);

      // Calculate features
      const lastContact = profile.last_contact_date ? new Date(profile.last_contact_date) : null;
      const daysSinceContact = lastContact ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      // Determine frequency trend
      const recentCount = recentComms?.length || 0;
      const olderCount = olderComms?.length || 0;
      let frequencyTrend: ChurnFeatures['contact_frequency_trend'] = 'stable';
      if (recentCount === 0 && olderCount > 0) frequencyTrend = 'stopped';
      else if (recentCount < olderCount * 0.5) frequencyTrend = 'decreasing';
      else if (recentCount > olderCount * 1.5) frequencyTrend = 'increasing';

      // Determine sentiment trajectory
      let sentimentTrajectory: ChurnFeatures['sentiment_trajectory'] = 'unknown';
      if (trends && trends.length >= 2) {
        const recentSentiment = trends[0]?.sentiment_avg || 0;
        const olderSentiment = trends[trends.length - 1]?.sentiment_avg || 0;
        if (recentSentiment > olderSentiment + 0.1) sentimentTrajectory = 'improving';
        else if (recentSentiment < olderSentiment - 0.1) sentimentTrajectory = 'declining';
        else sentimentTrajectory = 'stable';
      }

      // Relationship importance based on type
      const importanceMap: Record<string, number> = {
        family: 100,
        mentor: 90,
        friend: 80,
        client: 85,
        colleague: 60,
        professional: 50,
        acquaintance: 30,
      };
      const relationshipImportance = importanceMap[profile.relationship_type || ''] || 40;

      // Calculate communication gaps
      const allComms = [...(recentComms || []), ...(olderComms || [])].sort(
        (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()
      );
      const gaps: number[] = [];
      for (let i = 1; i < Math.min(allComms.length, 10); i++) {
        const gap = new Date(allComms[i - 1].occurred_at).getTime() - new Date(allComms[i].occurred_at).getTime();
        gaps.push(Math.floor(gap / (1000 * 60 * 60 * 24)));
      }

      const features: ChurnFeatures = {
        days_since_contact: daysSinceContact,
        contact_frequency_trend: frequencyTrend,
        sentiment_trajectory: sentimentTrajectory,
        response_time_trend: 'unknown',
        engagement_level: recentCount > 10 ? 'high' : recentCount > 3 ? 'medium' : recentCount > 0 ? 'low' : 'none',
        relationship_importance: relationshipImportance,
        communication_gaps: gaps,
        recent_negative_events: anomalies?.filter(a => a.severity === 'high').length || 0,
      };

      // Calculate base churn risk score using heuristics
      let baseRiskScore = 0;
      
      // Days since contact (max 40 points)
      if (daysSinceContact > 90) baseRiskScore += 40;
      else if (daysSinceContact > 60) baseRiskScore += 30;
      else if (daysSinceContact > 30) baseRiskScore += 20;
      else if (daysSinceContact > 14) baseRiskScore += 10;

      // Frequency trend (max 25 points)
      if (frequencyTrend === 'stopped') baseRiskScore += 25;
      else if (frequencyTrend === 'decreasing') baseRiskScore += 15;

      // Sentiment trajectory (max 20 points)
      if (sentimentTrajectory === 'declining') baseRiskScore += 20;

      // Relationship importance modifier (important relationships score higher risk for same neglect)
      baseRiskScore = Math.round(baseRiskScore * (relationshipImportance / 50));

      // Active anomalies (max 15 points)
      baseRiskScore += Math.min(15, (anomalies?.length || 0) * 5);

      // Clamp to 0-100
      baseRiskScore = Math.min(100, Math.max(0, baseRiskScore));

      return {
        profile_id: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        avatar_url: profile.avatar_url,
        relationship_type: profile.relationship_type,
        features,
        risk_score: baseRiskScore,
        risk_level: baseRiskScore >= 70 ? 'critical' : baseRiskScore >= 50 ? 'high' : baseRiskScore >= 30 ? 'medium' : 'low',
        days_to_critical: baseRiskScore >= 70 ? 0 : Math.max(0, Math.floor((70 - baseRiskScore) / 2) * 7),
      };
    }));

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);

    // Store predictions in churn_predictions table for accuracy tracking
    const predictionsToStore = churnPredictions.filter(p => p.risk_score >= 30).slice(0, 20);
    if (predictionsToStore.length > 0) {
      const predictionRecords = predictionsToStore.map(p => ({
        user_id: user.id,
        profile_id: p.profile_id,
        prediction_date: new Date().toISOString(),
        predicted_churn_probability: p.risk_score / 100,
        predicted_days_to_churn: p.days_to_critical > 0 ? p.days_to_critical : null,
        risk_level: p.risk_level,
        risk_score: p.risk_score,
        contributing_factors: p.features,
        model_used: aiConfig.defaultModel,
        intervention_recommended: p.risk_level === 'critical' ? 'immediate_outreach' :
                                  p.risk_level === 'high' ? 'scheduled_follow_up' : 'monitor',
      }));

      await supabase.from('churn_predictions').insert(predictionRecords);
    }

    // For high-risk contacts, get AI intervention recommendations
    const highRiskContacts = churnPredictions.filter(p => p.risk_score >= 50).slice(0, 5);
    
    let aiRecommendations: any[] = [];
    if (highRiskContacts.length > 0) {
      try {
        const systemPrompt = CHURN_PROMPTS.intervention.system;
        const userPrompt = fillTemplate(CHURN_PROMPTS.intervention.userTemplate, {
          contacts: JSON.stringify(highRiskContacts.map(c => ({
            name: c.name,
            relationship: c.relationship_type,
            risk_score: c.risk_score,
            features: c.features,
          })), null, 2),
        });

        const aiResponse = await callAI({
          model: aiConfig.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          userId: user.id,
          functionName: 'predict-churn',
          promptKey: 'churn.intervention',
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens,
          metadata: { high_risk_count: highRiskContacts.length },
        });

        aiRecommendations = parseAIJson(aiResponse.content, { recommendations: [] }).recommendations || [];
      } catch (aiError) {
        console.error('AI recommendation error:', aiError);
      }
    }

    // Calculate network-level churn metrics
    const networkMetrics = {
      total_analyzed: churnPredictions.length,
      critical_risk: churnPredictions.filter(p => p.risk_level === 'critical').length,
      high_risk: churnPredictions.filter(p => p.risk_level === 'high').length,
      medium_risk: churnPredictions.filter(p => p.risk_level === 'medium').length,
      low_risk: churnPredictions.filter(p => p.risk_level === 'low').length,
      average_risk: Math.round(
        churnPredictions.reduce((sum, p) => sum + p.risk_score, 0) / churnPredictions.length
      ),
      relationships_needing_attention: churnPredictions.filter(p => p.risk_score >= 30).length,
    };

    return new Response(JSON.stringify({
      success: true,
      predictions: churnPredictions.sort((a, b) => b.risk_score - a.risk_score),
      recommendations: aiRecommendations,
      network_metrics: networkMetrics,
      analyzed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Churn prediction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
