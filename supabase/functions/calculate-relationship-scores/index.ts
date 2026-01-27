import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getRelationshipConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Weights for different interaction types
const INTERACTION_WEIGHTS = {
  in_person: 10,
  video_call: 8,
  phone: 6,
  email: 4,
  message: 3,
  social_media: 2,
  other: 2,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader || '' } } }
    );

    // Get user from auth header
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { profileId, recalculateAll } = await req.json().catch(() => ({}));

    // Get profiles to calculate scores for (active contacts only)
    let profilesQuery = supabaseClient
      .from('profiles')
      .select('id, is_favorite, last_contact_date')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (profileId && !recalculateAll) {
      profilesQuery = profilesQuery.eq('id', profileId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;
    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'No profiles found', updated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get relationship configuration from platform config
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const relationshipConfig = await getRelationshipConfig(serviceClient, user.id);
    const BASE_DECAY_RATE = relationshipConfig.decayRateDaily;
    const FAVORITE_DECAY_MULTIPLIER = relationshipConfig.favoriteDecayMultiplier;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const updatedScores = [];

    for (const profile of profiles) {
      // Get communications for this profile
      const { data: communications } = await supabaseClient
        .from('communications')
        .select('channel, occurred_at, sentiment_score, direction')
        .eq('profile_id', profile.id)
        .gte('occurred_at', ninetyDaysAgo.toISOString())
        .order('occurred_at', { ascending: false });

      // Get messages for this profile (through conversations)
      const { data: conversations } = await supabaseClient
        .from('conversations')
        .select('id, last_message_at, message_count')
        .eq('profile_id', profile.id)
        .gte('last_message_at', ninetyDaysAgo.toISOString());

      // Calculate frequency score (0-100)
      // Based on number of interactions in last 30 days
      const recentComms = communications?.filter(c => 
        new Date(c.occurred_at) >= thirtyDaysAgo
      ) || [];
      const recentConversations = conversations?.filter(c => 
        c.last_message_at && new Date(c.last_message_at) >= thirtyDaysAgo
      ) || [];
      
      const totalRecentInteractions = recentComms.length + recentConversations.length;
      // Target: 4 interactions per month = 100
      const frequencyScore = Math.min(100, Math.round((totalRecentInteractions / 4) * 100));

      // Calculate recency score (0-100)
      // Based on days since last contact
      let recencyScore = 50;
      const lastContactDate = profile.last_contact_date ? new Date(profile.last_contact_date) : null;
      if (lastContactDate) {
        const daysSinceContact = Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceContact <= 7) recencyScore = 100;
        else if (daysSinceContact <= 14) recencyScore = 85;
        else if (daysSinceContact <= 30) recencyScore = 70;
        else if (daysSinceContact <= 60) recencyScore = 50;
        else if (daysSinceContact <= 90) recencyScore = 30;
        else recencyScore = 10;
      }

      // Calculate diversity score (0-100)
      // Based on variety of communication channels used
      const uniqueChannels = new Set(communications?.map(c => c.channel) || []);
      const platformCount = new Set(conversations?.map(c => 'message') || []).size;
      const totalChannels = uniqueChannels.size + (platformCount > 0 ? 1 : 0);
      // Target: 3+ different channels = 100
      const diversityScore = Math.min(100, Math.round((totalChannels / 3) * 100));

      // Calculate sentiment score (0-100)
      // Based on average sentiment of communications
      const sentimentValues = communications
        ?.filter(c => c.sentiment_score !== null)
        .map(c => c.sentiment_score) || [];
      let sentimentScore = 50; // Neutral default
      if (sentimentValues.length > 0) {
        const avgSentiment = sentimentValues.reduce((a, b) => a + b, 0) / sentimentValues.length;
        // Sentiment is typically -1 to 1, convert to 0-100
        sentimentScore = Math.round((avgSentiment + 1) * 50);
      }

      // Calculate weighted interaction score
      let weightedInteractionScore = 0;
      communications?.forEach(comm => {
        const weight = INTERACTION_WEIGHTS[comm.channel as keyof typeof INTERACTION_WEIGHTS] || 2;
        const recencyMultiplier = new Date(comm.occurred_at) >= thirtyDaysAgo ? 1.5 : 1;
        weightedInteractionScore += weight * recencyMultiplier;
      });

      // Normalize weighted score to 0-100 (target: 50 weighted points = 100)
      const normalizedWeightedScore = Math.min(100, Math.round((weightedInteractionScore / 50) * 100));

      // Calculate decay rate using platform config
      const decayRate = profile.is_favorite ? (BASE_DECAY_RATE * FAVORITE_DECAY_MULTIPLIER) : BASE_DECAY_RATE;
      const daysSinceLastContact = lastContactDate
        ? Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      const currentDecayImpact = Math.min(50, daysSinceLastContact * decayRate);

      // Calculate overall score with weighted components
      const overallScore = Math.max(0, Math.min(100, Math.round(
        (frequencyScore * 0.25) +
        (recencyScore * 0.30) +
        (diversityScore * 0.15) +
        (sentimentScore * 0.15) +
        (normalizedWeightedScore * 0.15) -
        currentDecayImpact
      )));

      // Upsert the score
      const { error: upsertError } = await supabaseClient
        .from('relationship_scores')
        .upsert({
          profile_id: profile.id,
          user_id: user.id,
          overall_score: overallScore,
          frequency_score: frequencyScore,
          recency_score: recencyScore,
          diversity_score: diversityScore,
          sentiment_score: sentimentScore,
          decay_rate: -currentDecayImpact / 10, // Normalized decay rate for display
          last_calculated_at: now.toISOString(),
        }, {
          onConflict: 'profile_id,user_id',
        });

      if (upsertError) {
        console.error('Error upserting score for profile', profile.id, upsertError);
      } else {
        updatedScores.push({
          profileId: profile.id,
          overallScore,
          frequencyScore,
          recencyScore,
          diversityScore,
          sentimentScore,
        });
      }
    }

    console.log(`Updated ${updatedScores.length} relationship scores for user ${user.id}`);

    return new Response(JSON.stringify({ 
      message: 'Scores calculated successfully',
      updated: updatedScores.length,
      scores: updatedScores,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error calculating relationship scores:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
