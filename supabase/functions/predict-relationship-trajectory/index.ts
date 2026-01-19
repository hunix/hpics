import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrajectoryPrediction {
  profileId: string;
  profileName: string;
  currentHealth: number;
  predictedHealth30Days: number;
  predictedHealth90Days: number;
  trajectory: 'growing' | 'stable' | 'declining' | 'at_risk';
  churnProbability: number;
  opportunityScore: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  confidence: number;
}

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    const body = await req.json().catch(() => ({}));
    let userId: string;

    if (isServiceRoleCall) {
      // For service role calls, get userId from body
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Normal user token validation
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      try {
        const { data: { user }, error: authError } = await authClient.auth.getUser(token);
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        userId = user.id;
      } catch (authError) {
        console.error('Auth error:', authError);
        return new Response(JSON.stringify({ error: 'Session expired. Please log in again.' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create supabase client with service role for service calls, or user context otherwise
    const supabase = createClient(
      supabaseUrl,
      isServiceRoleCall ? supabaseServiceKey : supabaseAnonKey,
      isServiceRoleCall ? {} : { global: { headers: { Authorization: authHeader } } }
    );

    const profileIds = body.profileIds as string[] | undefined;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch active profiles only
    let profileQuery = supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_type, is_favorite')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (profileIds && profileIds.length > 0) {
      profileQuery = profileQuery.in('id', profileIds);
    }
    
    const { data: profiles } = await profileQuery;

    // Fetch communications
    const { data: communications } = await supabase
      .from('communications')
      .select('profile_id, occurred_at, sentiment_score, channel')
      .eq('user_id', userId)
      .gte('occurred_at', ninetyDaysAgo.toISOString());

    // Fetch messages
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, profile_id')
      .eq('user_id', userId);

    const { data: messages } = await supabase
      .from('messages')
      .select('conversation_id, sent_at, is_from_contact')
      .eq('user_id', userId)
      .gte('sent_at', ninetyDaysAgo.toISOString());

    // Fetch events
    const { data: events } = await supabase
      .from('events')
      .select('profile_id, event_date, event_type')
      .eq('user_id', userId);

    // Fetch interaction notes
    const { data: notes } = await supabase
      .from('contact_interaction_notes')
      .select('profile_id, interaction_date, mood_observed, relationship_temperature')
      .eq('user_id', userId)
      .gte('interaction_date', ninetyDaysAgo.toISOString());

    const conversationToProfile = new Map(conversations?.map(c => [c.id, c.profile_id]) || []);

    const predictions: TrajectoryPrediction[] = [];

    for (const profile of profiles || []) {
      const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      
      // Get profile communications
      const profileComms = communications?.filter(c => c.profile_id === profile.id) || [];
      const recentComms = profileComms.filter(c => new Date(c.occurred_at) >= thirtyDaysAgo);
      const olderComms = profileComms.filter(c => 
        new Date(c.occurred_at) >= ninetyDaysAgo && new Date(c.occurred_at) < thirtyDaysAgo
      );

      // Get profile messages
      const profileMessages = messages?.filter(m => 
        conversationToProfile.get(m.conversation_id) === profile.id
      ) || [];
      const recentMessages = profileMessages.filter(m => new Date(m.sent_at) >= thirtyDaysAgo);
      const olderMessages = profileMessages.filter(m => 
        new Date(m.sent_at) >= ninetyDaysAgo && new Date(m.sent_at) < thirtyDaysAgo
      );

      // Get events
      const profileEvents = events?.filter(e => e.profile_id === profile.id) || [];
      const upcomingEvents = profileEvents.filter(e => new Date(e.event_date) >= now);
      const importantEvents = upcomingEvents.filter(e => 
        ['birthday', 'anniversary', 'wedding'].includes(e.event_type)
      );

      // Get interaction notes
      const profileNotes = notes?.filter(n => n.profile_id === profile.id) || [];

      // Calculate activity trends
      const recentActivity = recentComms.length + recentMessages.length;
      const olderActivity = olderComms.length + olderMessages.length;
      const activityRatio = olderActivity > 0 ? recentActivity / (olderActivity / 2) : recentActivity > 0 ? 2 : 0;

      // Calculate sentiment trend
      const recentSentiments = recentComms
        .filter(c => c.sentiment_score !== null)
        .map(c => c.sentiment_score as number);
      const avgRecentSentiment = recentSentiments.length > 0
        ? recentSentiments.reduce((a, b) => a + b, 0) / recentSentiments.length
        : 0.5;

      // Calculate reciprocity
      const recentIncoming = recentMessages.filter(m => m.is_from_contact).length;
      const recentOutgoing = recentMessages.filter(m => !m.is_from_contact).length;
      const reciprocityBalance = (recentIncoming + 1) / (recentOutgoing + 1);

      // Get mood trend from notes
      const moodScores: Record<string, number> = {
        'great': 1, 'good': 0.75, 'neutral': 0.5, 'stressed': 0.25, 'difficult': 0
      };
      const recentMoods = profileNotes
        .filter(n => n.mood_observed)
        .map(n => moodScores[n.mood_observed as string] ?? 0.5);
      const avgMood = recentMoods.length > 0
        ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
        : 0.5;

      // Calculate current health score (0-100)
      let currentHealth = 50; // Base
      currentHealth += (activityRatio - 1) * 15; // Activity trend impact
      currentHealth += (avgRecentSentiment - 0.5) * 30; // Sentiment impact
      currentHealth += (avgMood - 0.5) * 20; // Mood impact
      currentHealth += Math.min(Math.abs(Math.log(reciprocityBalance)), 1) * -10; // Reciprocity imbalance penalty
      currentHealth += profile.is_favorite ? 10 : 0; // Favorite bonus
      currentHealth += upcomingEvents.length * 5; // Upcoming events bonus
      currentHealth = Math.max(0, Math.min(100, currentHealth));

      // Predict future health
      const trendMultiplier = activityRatio >= 1 ? 1.1 : 0.9;
      const sentimentTrend = avgRecentSentiment > 0.5 ? 1.05 : avgRecentSentiment < 0.3 ? 0.85 : 1;
      
      let predictedHealth30 = currentHealth * trendMultiplier * sentimentTrend;
      predictedHealth30 += importantEvents.filter(e => {
        const eventDate = new Date(e.event_date);
        return eventDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }).length * 5;
      predictedHealth30 = Math.max(0, Math.min(100, predictedHealth30));

      let predictedHealth90 = predictedHealth30 * trendMultiplier;
      predictedHealth90 += importantEvents.length * 3;
      predictedHealth90 = Math.max(0, Math.min(100, predictedHealth90));

      // Determine trajectory
      let trajectory: TrajectoryPrediction['trajectory'];
      if (predictedHealth90 > currentHealth + 10) {
        trajectory = 'growing';
      } else if (predictedHealth90 < currentHealth - 15) {
        trajectory = currentHealth < 40 ? 'at_risk' : 'declining';
      } else {
        trajectory = 'stable';
      }

      // Calculate churn probability
      const daysSinceContact = recentActivity === 0 
        ? olderActivity === 0 ? 90 : 45
        : 0;
      let churnProbability = 0;
      churnProbability += (100 - currentHealth) * 0.4;
      churnProbability += Math.min(daysSinceContact, 60) * 0.5;
      churnProbability += avgRecentSentiment < 0.3 ? 20 : 0;
      churnProbability = Math.max(0, Math.min(100, churnProbability));

      // Calculate opportunity score
      let opportunityScore = 0;
      opportunityScore += importantEvents.length * 20;
      opportunityScore += (currentHealth / 100) * 30;
      opportunityScore += activityRatio > 1.5 ? 20 : activityRatio > 1 ? 10 : 0;
      opportunityScore += profile.is_favorite ? 15 : 0;
      opportunityScore = Math.max(0, Math.min(100, opportunityScore));

      // Identify factors
      const positiveFactors: string[] = [];
      const negativeFactors: string[] = [];

      if (activityRatio > 1.2) positiveFactors.push('Increasing communication frequency');
      if (activityRatio < 0.8) negativeFactors.push('Declining communication frequency');
      if (avgRecentSentiment > 0.6) positiveFactors.push('Positive sentiment in conversations');
      if (avgRecentSentiment < 0.4) negativeFactors.push('Negative sentiment detected');
      if (reciprocityBalance > 0.8 && reciprocityBalance < 1.2) positiveFactors.push('Balanced communication');
      if (reciprocityBalance < 0.5 || reciprocityBalance > 2) negativeFactors.push('Communication imbalance');
      if (importantEvents.length > 0) positiveFactors.push(`${importantEvents.length} upcoming important event(s)`);
      if (daysSinceContact > 30) negativeFactors.push('Extended period without contact');
      if (profile.is_favorite) positiveFactors.push('Priority contact');

      // Generate recommendations
      const recommendations: string[] = [];
      if (trajectory === 'declining' || trajectory === 'at_risk') {
        recommendations.push('Schedule a personal check-in call');
        if (importantEvents.length > 0) {
          recommendations.push(`Prepare for ${importantEvents[0].event_type} on ${importantEvents[0].event_date}`);
        }
      }
      if (reciprocityBalance < 0.5) {
        recommendations.push('Increase your outreach frequency');
      }
      if (reciprocityBalance > 2) {
        recommendations.push('Consider responding more promptly to their messages');
      }
      if (opportunityScore > 70) {
        recommendations.push('Great time for a meaningful gesture or meeting');
      }

      // Calculate confidence based on data availability
      const dataPoints = profileComms.length + profileMessages.length + profileNotes.length;
      const confidence = Math.min(95, 40 + dataPoints * 3);

      predictions.push({
        profileId: profile.id,
        profileName: name,
        currentHealth: Math.round(currentHealth),
        predictedHealth30Days: Math.round(predictedHealth30),
        predictedHealth90Days: Math.round(predictedHealth90),
        trajectory,
        churnProbability: Math.round(churnProbability),
        opportunityScore: Math.round(opportunityScore),
        factors: {
          positive: positiveFactors,
          negative: negativeFactors,
        },
        recommendations,
        confidence: Math.round(confidence),
      });
    }

    // Sort by at-risk first, then by current health
    predictions.sort((a, b) => {
      const trajectoryOrder = { at_risk: 0, declining: 1, stable: 2, growing: 3 };
      const trajDiff = trajectoryOrder[a.trajectory] - trajectoryOrder[b.trajectory];
      if (trajDiff !== 0) return trajDiff;
      return a.currentHealth - b.currentHealth;
    });

    console.log(`Generated trajectory predictions for ${predictions.length} profiles`);

    return new Response(JSON.stringify({
      success: true,
      predictions,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Trajectory prediction error:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
