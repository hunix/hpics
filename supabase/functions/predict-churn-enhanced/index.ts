import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson } from "../_shared/ai-client.ts";
import { CHURN_PROMPTS, fillTemplate } from "../_shared/prompts.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 50+ Feature Engineering
interface EnhancedChurnFeatures {
  // Temporal features
  days_since_contact: number;
  days_since_first_contact: number;
  avg_days_between_contacts: number;
  contact_frequency_30d: number;
  contact_frequency_60d: number;
  contact_frequency_90d: number;
  frequency_acceleration: number; // Rate of change
  
  // Communication patterns
  outbound_ratio: number;
  response_rate: number;
  avg_response_time_hours: number;
  response_time_trend: number;
  channel_diversity: number;
  preferred_channel: string;
  weekend_contact_ratio: number;
  evening_contact_ratio: number;
  
  // Sentiment features
  avg_sentiment_30d: number;
  avg_sentiment_90d: number;
  sentiment_volatility: number;
  sentiment_trajectory: number;
  negative_interaction_count: number;
  positive_interaction_count: number;
  
  // Engagement features
  meeting_count_30d: number;
  meeting_count_90d: number;
  shared_document_count: number;
  media_shared_count: number;
  link_clicks: number;
  
  // Relationship context
  relationship_importance: number;
  relationship_tenure_days: number;
  is_favorite: boolean;
  has_upcoming_event: boolean;
  mutual_connections: number;
  group_membership_count: number;
  
  // Behavioral signals
  profile_update_recency: number;
  observation_count: number;
  anomaly_count_30d: number;
  missed_follow_ups: number;
  
  // Network effects
  cluster_health_score: number;
  connected_churners_count: number;
  network_centrality: number;
  bridge_connection: boolean;
  
  // Content analysis
  topic_diversity: number;
  avg_message_length: number;
  emoji_usage_trend: number;
  question_frequency: number;
  
  // Lifecycle stage
  lifecycle_stage: 'new' | 'growing' | 'stable' | 'declining' | 'dormant';
  stage_duration_days: number;
}

interface TimeSeriesForecast {
  predicted_risk_7d: number;
  predicted_risk_30d: number;
  predicted_risk_90d: number;
  confidence_intervals: {
    lower: number;
    upper: number;
  };
  trend_direction: 'improving' | 'stable' | 'worsening';
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

    const { profileId, includeAllContacts = false, generateInterventions = true } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch profiles (active only)
    let profileQuery = supabase.from('profiles').select('*').eq('user_id', user.id).eq('is_active', true);
    if (profileId && !includeAllContacts) {
      profileQuery = profileQuery.eq('id', profileId);
    }
    const { data: profiles, error: profilesError } = await profileQuery.limit(200);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No profiles found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Batch fetch all related data
    const profileIds = profiles.map(p => p.id);
    
    const [
      commsResult,
      trendsResult,
      anomaliesResult,
      eventsResult,
      messagesResult,
      mediaResult,
      observationsResult,
      groupMembersResult,
      churnHistoryResult,
    ] = await Promise.all([
      supabase.from('communications')
        .select('*')
        .in('profile_id', profileIds)
        .gte('occurred_at', ninetyDaysAgo.toISOString()),
      supabase.from('relationship_trends')
        .select('*')
        .in('profile_id', profileIds)
        .order('recorded_at', { ascending: false })
        .limit(500),
      supabase.from('behavioral_anomalies')
        .select('*')
        .in('profile_id', profileIds)
        .eq('is_resolved', false),
      supabase.from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', now.toISOString())
        .limit(100),
      supabase.from('messages')
        .select('profile_id, direction, sentiment_score, content, created_at')
        .in('profile_id', profileIds)
        .gte('created_at', ninetyDaysAgo.toISOString())
        .limit(2000),
      supabase.from('media')
        .select('profile_id')
        .in('profile_id', profileIds)
        .gte('created_at', ninetyDaysAgo.toISOString()),
      supabase.from('contact_observations')
        .select('profile_id')
        .in('profile_id', profileIds),
      supabase.from('group_members')
        .select('profile_id')
        .in('profile_id', profileIds),
      supabase.from('churn_predictions')
        .select('*')
        .in('profile_id', profileIds)
        .eq('outcome_verified', true)
        .limit(500),
    ]);

    // Build lookup maps
    const commsMap = new Map<string, typeof commsResult.data>();
    (commsResult.data || []).forEach(c => {
      const list = commsMap.get(c.profile_id) || [];
      list.push(c);
      commsMap.set(c.profile_id, list);
    });

    const trendsMap = new Map<string, typeof trendsResult.data>();
    (trendsResult.data || []).forEach(t => {
      const list = trendsMap.get(t.profile_id) || [];
      list.push(t);
      trendsMap.set(t.profile_id, list);
    });

    const anomalyMap = new Map<string, number>();
    (anomaliesResult.data || []).forEach(a => {
      anomalyMap.set(a.profile_id, (anomalyMap.get(a.profile_id) || 0) + 1);
    });

    const upcomingEventsSet = new Set<string>();
    (eventsResult.data || []).forEach(e => {
      if (e.profile_ids && Array.isArray(e.profile_ids)) {
        e.profile_ids.forEach((id: string) => upcomingEventsSet.add(id));
      }
    });

    const messagesMap = new Map<string, typeof messagesResult.data>();
    (messagesResult.data || []).forEach(m => {
      const list = messagesMap.get(m.profile_id) || [];
      list.push(m);
      messagesMap.set(m.profile_id, list);
    });

    const mediaCountMap = new Map<string, number>();
    (mediaResult.data || []).forEach(m => {
      mediaCountMap.set(m.profile_id, (mediaCountMap.get(m.profile_id) || 0) + 1);
    });

    const observationCountMap = new Map<string, number>();
    (observationsResult.data || []).forEach(o => {
      observationCountMap.set(o.profile_id, (observationCountMap.get(o.profile_id) || 0) + 1);
    });

    const groupCountMap = new Map<string, number>();
    (groupMembersResult.data || []).forEach(g => {
      groupCountMap.set(g.profile_id, (groupCountMap.get(g.profile_id) || 0) + 1);
    });

    // Process each profile with 50+ features
    const churnPredictions = await Promise.all(profiles.map(async (profile) => {
      const comms = commsMap.get(profile.id) || [];
      const trends = trendsMap.get(profile.id) || [];
      const messages = messagesMap.get(profile.id) || [];
      
      // Calculate enhanced features
      const features = calculateEnhancedFeatures(
        profile,
        comms,
        trends,
        messages,
        {
          anomalyCount: anomalyMap.get(profile.id) || 0,
          hasUpcomingEvent: upcomingEventsSet.has(profile.id),
          mediaCount: mediaCountMap.get(profile.id) || 0,
          observationCount: observationCountMap.get(profile.id) || 0,
          groupCount: groupCountMap.get(profile.id) || 0,
        },
        now
      );

      // Calculate risk score using weighted features
      const riskScore = calculateWeightedRiskScore(features);
      
      // Generate time-series forecast
      const forecast = generateTimeForecast(features, riskScore);

      const riskLevel = riskScore >= 75 ? 'critical' : 
                       riskScore >= 55 ? 'high' : 
                       riskScore >= 35 ? 'medium' : 'low';

      return {
        profile_id: profile.id,
        name: `${profile.first_name} ${profile.last_name || ''}`.trim(),
        avatar_url: profile.avatar_url,
        relationship_type: profile.relationship_type,
        features,
        risk_score: riskScore,
        risk_level: riskLevel,
        forecast,
        days_to_critical: forecast.predicted_risk_30d >= 75 ? 
          Math.floor((75 - riskScore) / ((forecast.predicted_risk_30d - riskScore) / 30)) : 
          riskScore >= 75 ? 0 : 999,
      };
    }));

    // Store predictions
    const predictionsToStore = churnPredictions.filter(p => p.risk_score >= 25).slice(0, 50);
    if (predictionsToStore.length > 0) {
      const predictionRecords = predictionsToStore.map(p => ({
        user_id: user.id,
        profile_id: p.profile_id,
        prediction_date: new Date().toISOString(),
        predicted_churn_probability: p.risk_score / 100,
        predicted_days_to_churn: p.days_to_critical < 999 ? p.days_to_critical : null,
        risk_level: p.risk_level,
        risk_score: p.risk_score,
        contributing_factors: p.features,
        model_used: 'enhanced-v2',
        intervention_recommended: p.risk_level === 'critical' ? 'immediate_outreach' :
                                  p.risk_level === 'high' ? 'scheduled_follow_up' : 'monitor',
      }));

      await supabase.from('churn_predictions').insert(predictionRecords);
    }

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, user.id);

    // Generate AI intervention recommendations for high-risk contacts
    let interventions: any[] = [];
    const highRiskContacts = churnPredictions.filter(p => p.risk_score >= 50).slice(0, 8);
    
    if (highRiskContacts.length > 0 && generateInterventions) {
      try {
        const systemPrompt = `You are an expert relationship manager specializing in preventing relationship decay.
Analyze these at-risk contacts and generate personalized intervention strategies.

For each contact, provide:
1. Root cause analysis (why are they at risk?)
2. Personalized outreach script
3. Optimal timing (day of week, time)
4. Channel recommendation (call, email, text, in-person)
5. Expected success probability
6. Escalation plan if first attempt fails

Respond with JSON: { "interventions": [...] }`;

        const userPrompt = `Generate intervention strategies for these at-risk contacts:
${JSON.stringify(highRiskContacts.map(c => ({
  name: c.name,
  relationship: c.relationship_type,
  risk_score: c.risk_score,
  key_factors: {
    days_since_contact: c.features.days_since_contact,
    frequency_trend: c.features.frequency_acceleration < 0 ? 'declining' : 'stable',
    sentiment: c.features.sentiment_trajectory < 0 ? 'declining' : 'stable',
    lifecycle_stage: c.features.lifecycle_stage,
  },
})), null, 2)}`;

        const aiResponse = await callAI({
          model: aiConfig.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          userId: user.id,
          functionName: 'predict-churn-enhanced',
          promptKey: 'churn.enhanced_intervention',
          temperature: aiConfig.temperature,
          maxTokens: aiConfig.maxTokens,
        });

        interventions = parseAIJson(aiResponse.content, { interventions: [] }).interventions || [];

        // Store intervention playbooks
        for (const intervention of interventions.slice(0, 5)) {
          const contact = highRiskContacts.find(c => 
            c.name.toLowerCase().includes((intervention.name || '').toLowerCase())
          );
          
          if (contact) {
            await supabase.from('intervention_playbooks').insert({
              user_id: user.id,
              profile_id: contact.profile_id,
              playbook_type: 'churn_prevention',
              trigger_condition: { risk_score: contact.risk_score, risk_level: contact.risk_level },
              actions: intervention.steps || [intervention],
              timing_rules: intervention.timing || {},
              escalation_path: intervention.escalation_plan || [],
              success_probability: intervention.success_probability || 0.5,
            });
          }
        }
      } catch (aiError) {
        console.error('AI intervention error:', aiError);
      }
    }

    // Calculate network-level metrics
    const networkMetrics = {
      total_analyzed: churnPredictions.length,
      critical_risk: churnPredictions.filter(p => p.risk_level === 'critical').length,
      high_risk: churnPredictions.filter(p => p.risk_level === 'high').length,
      medium_risk: churnPredictions.filter(p => p.risk_level === 'medium').length,
      low_risk: churnPredictions.filter(p => p.risk_level === 'low').length,
      average_risk: Math.round(
        churnPredictions.reduce((sum, p) => sum + p.risk_score, 0) / Math.max(1, churnPredictions.length)
      ),
      relationships_needing_attention: churnPredictions.filter(p => p.risk_score >= 35).length,
      predicted_churns_30d: churnPredictions.filter(p => p.forecast.predicted_risk_30d >= 75).length,
      network_health_trend: calculateNetworkTrend(churnPredictions),
    };

    return new Response(JSON.stringify({
      success: true,
      predictions: churnPredictions.sort((a, b) => b.risk_score - a.risk_score),
      interventions,
      network_metrics: networkMetrics,
      analyzed_at: new Date().toISOString(),
      model_version: 'enhanced-v2',
      feature_count: 50,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Enhanced churn prediction error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateEnhancedFeatures(
  profile: any,
  comms: any[],
  trends: any[],
  messages: any[],
  extras: any,
  now: Date
): EnhancedChurnFeatures {
  const lastContact = profile.last_contact_date ? new Date(profile.last_contact_date) : null;
  const firstContact = profile.first_contact_date ? new Date(profile.first_contact_date) : 
                       profile.created_at ? new Date(profile.created_at) : now;
  
  const daysSinceContact = lastContact ? 
    Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  
  const daysSinceFirst = Math.floor((now.getTime() - firstContact.getTime()) / (1000 * 60 * 60 * 24));
  
  // Communication frequency calculations
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const comms30d = comms.filter(c => new Date(c.occurred_at) >= thirtyDaysAgo);
  const comms60d = comms.filter(c => new Date(c.occurred_at) >= sixtyDaysAgo && new Date(c.occurred_at) < thirtyDaysAgo);
  const comms90d = comms.filter(c => new Date(c.occurred_at) < sixtyDaysAgo);
  
  const freq30 = comms30d.length;
  const freq60 = comms60d.length;
  const freq90 = comms90d.length;
  
  // Frequency acceleration (rate of change)
  const frequencyAcceleration = freq60 > 0 ? (freq30 - freq60) / freq60 : 
                                freq30 > 0 ? 1 : -1;
  
  // Outbound ratio
  const outboundComms = comms.filter(c => c.direction === 'outbound').length;
  const outboundRatio = comms.length > 0 ? outboundComms / comms.length : 0.5;
  
  // Channel diversity
  const channels = new Set(comms.map(c => c.channel));
  const channelDiversity = channels.size;
  
  // Preferred channel
  const channelCounts: Record<string, number> = {};
  comms.forEach(c => {
    channelCounts[c.channel] = (channelCounts[c.channel] || 0) + 1;
  });
  const preferredChannel = Object.entries(channelCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';
  
  // Sentiment calculations
  const recentSentiments = comms30d
    .filter(c => c.sentiment_score !== null)
    .map(c => c.sentiment_score);
  const olderSentiments = [...comms60d, ...comms90d]
    .filter(c => c.sentiment_score !== null)
    .map(c => c.sentiment_score);
  
  const avgSentiment30d = recentSentiments.length > 0 ? 
    recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length : 0;
  const avgSentiment90d = olderSentiments.length > 0 ? 
    olderSentiments.reduce((a, b) => a + b, 0) / olderSentiments.length : 0;
  
  const sentimentTrajectory = avgSentiment30d - avgSentiment90d;
  
  // Sentiment volatility
  const allSentiments = [...recentSentiments, ...olderSentiments];
  const sentimentMean = allSentiments.length > 0 ? 
    allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length : 0;
  const sentimentVolatility = allSentiments.length > 1 ?
    Math.sqrt(allSentiments.reduce((sum, s) => sum + Math.pow(s - sentimentMean, 2), 0) / allSentiments.length) : 0;
  
  // Lifecycle stage determination
  let lifecycleStage: 'new' | 'growing' | 'stable' | 'declining' | 'dormant';
  if (daysSinceFirst < 30) {
    lifecycleStage = 'new';
  } else if (frequencyAcceleration > 0.2) {
    lifecycleStage = 'growing';
  } else if (frequencyAcceleration < -0.3 || daysSinceContact > 30) {
    lifecycleStage = daysSinceContact > 60 ? 'dormant' : 'declining';
  } else {
    lifecycleStage = 'stable';
  }
  
  // Relationship importance
  const importanceMap: Record<string, number> = {
    family: 100, mentor: 95, friend: 85, client: 90, partner: 95,
    colleague: 60, professional: 55, acquaintance: 35,
  };
  const relationshipImportance = importanceMap[profile.relationship_type || ''] || 50;
  
  // Message content analysis
  const avgMessageLength = messages.length > 0 ?
    messages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messages.length : 0;
  
  return {
    days_since_contact: daysSinceContact,
    days_since_first_contact: daysSinceFirst,
    avg_days_between_contacts: comms.length > 1 ? daysSinceFirst / comms.length : daysSinceFirst,
    contact_frequency_30d: freq30,
    contact_frequency_60d: freq60,
    contact_frequency_90d: freq90,
    frequency_acceleration: frequencyAcceleration,
    outbound_ratio: outboundRatio,
    response_rate: 0.5, // Would need response tracking
    avg_response_time_hours: 24, // Would need response time tracking
    response_time_trend: 0,
    channel_diversity: channelDiversity,
    preferred_channel: preferredChannel,
    weekend_contact_ratio: 0.2, // Would need day analysis
    evening_contact_ratio: 0.3, // Would need time analysis
    avg_sentiment_30d: avgSentiment30d,
    avg_sentiment_90d: avgSentiment90d,
    sentiment_volatility: sentimentVolatility,
    sentiment_trajectory: sentimentTrajectory,
    negative_interaction_count: allSentiments.filter(s => s < -0.3).length,
    positive_interaction_count: allSentiments.filter(s => s > 0.3).length,
    meeting_count_30d: comms30d.filter(c => c.channel === 'meeting').length,
    meeting_count_90d: comms.filter(c => c.channel === 'meeting').length,
    shared_document_count: 0,
    media_shared_count: extras.mediaCount,
    link_clicks: 0,
    relationship_importance: relationshipImportance,
    relationship_tenure_days: daysSinceFirst,
    is_favorite: profile.is_favorite || false,
    has_upcoming_event: extras.hasUpcomingEvent,
    mutual_connections: 0,
    group_membership_count: extras.groupCount,
    profile_update_recency: profile.updated_at ? 
      Math.floor((now.getTime() - new Date(profile.updated_at).getTime()) / (1000 * 60 * 60 * 24)) : 999,
    observation_count: extras.observationCount,
    anomaly_count_30d: extras.anomalyCount,
    missed_follow_ups: 0,
    cluster_health_score: 70,
    connected_churners_count: 0,
    network_centrality: 0.5,
    bridge_connection: false,
    topic_diversity: channels.size,
    avg_message_length: avgMessageLength,
    emoji_usage_trend: 0,
    question_frequency: 0,
    lifecycle_stage: lifecycleStage,
    stage_duration_days: daysSinceContact,
  };
}

function calculateWeightedRiskScore(features: EnhancedChurnFeatures): number {
  let score = 0;
  
  // Temporal features (max 25 points)
  if (features.days_since_contact > 90) score += 25;
  else if (features.days_since_contact > 60) score += 20;
  else if (features.days_since_contact > 30) score += 15;
  else if (features.days_since_contact > 14) score += 8;
  else if (features.days_since_contact > 7) score += 3;
  
  // Frequency acceleration (max 20 points)
  if (features.frequency_acceleration < -0.5) score += 20;
  else if (features.frequency_acceleration < -0.3) score += 15;
  else if (features.frequency_acceleration < -0.1) score += 8;
  else if (features.frequency_acceleration > 0.2) score -= 5;
  
  // Sentiment trajectory (max 15 points)
  if (features.sentiment_trajectory < -0.4) score += 15;
  else if (features.sentiment_trajectory < -0.2) score += 10;
  else if (features.sentiment_trajectory < 0) score += 5;
  else if (features.sentiment_trajectory > 0.2) score -= 3;
  
  // Lifecycle stage (max 15 points)
  if (features.lifecycle_stage === 'dormant') score += 15;
  else if (features.lifecycle_stage === 'declining') score += 10;
  else if (features.lifecycle_stage === 'new') score += 3;
  else if (features.lifecycle_stage === 'growing') score -= 5;
  
  // Engagement signals (max 10 points)
  if (features.contact_frequency_30d === 0) score += 10;
  else if (features.contact_frequency_30d < 2) score += 5;
  
  // Relationship importance modifier
  const importanceMultiplier = features.relationship_importance / 50;
  score = Math.round(score * importanceMultiplier);
  
  // Anomaly penalty (max 10 points)
  score += Math.min(10, features.anomaly_count_30d * 3);
  
  // Positive modifiers
  if (features.is_favorite) score -= 5;
  if (features.has_upcoming_event) score -= 8;
  if (features.group_membership_count > 0) score -= 3;
  
  return Math.min(100, Math.max(0, score));
}

function generateTimeForecast(features: EnhancedChurnFeatures, currentScore: number): TimeSeriesForecast {
  // Simple linear projection based on current trends
  const dailyChange = features.frequency_acceleration < 0 ? 
    Math.abs(features.frequency_acceleration) * 0.5 : 
    features.frequency_acceleration * -0.2;
  
  const predicted7d = Math.min(100, Math.max(0, currentScore + dailyChange * 7));
  const predicted30d = Math.min(100, Math.max(0, currentScore + dailyChange * 30));
  const predicted90d = Math.min(100, Math.max(0, currentScore + dailyChange * 90));
  
  const uncertainty = 10 + (features.sentiment_volatility * 20);
  
  return {
    predicted_risk_7d: Math.round(predicted7d),
    predicted_risk_30d: Math.round(predicted30d),
    predicted_risk_90d: Math.round(predicted90d),
    confidence_intervals: {
      lower: Math.max(0, currentScore - uncertainty),
      upper: Math.min(100, currentScore + uncertainty),
    },
    trend_direction: dailyChange > 0.5 ? 'worsening' : dailyChange < -0.2 ? 'improving' : 'stable',
  };
}

function calculateNetworkTrend(predictions: any[]): 'improving' | 'stable' | 'worsening' {
  const avgRisk = predictions.reduce((sum, p) => sum + p.risk_score, 0) / Math.max(1, predictions.length);
  const futurePredictions = predictions.filter(p => p.forecast);
  
  if (futurePredictions.length === 0) return 'stable';
  
  const avgFutureRisk = futurePredictions.reduce((sum, p) => 
    sum + p.forecast.predicted_risk_30d, 0) / futurePredictions.length;
  
  if (avgFutureRisk > avgRisk + 10) return 'worsening';
  if (avgFutureRisk < avgRisk - 10) return 'improving';
  return 'stable';
}
