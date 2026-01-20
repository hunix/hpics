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
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profileId, eventId, eventTitle, eventDate } = await req.json();

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    // Fetch profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Fetch recent communications
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: communications } = await supabase
      .from('communications')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .gte('occurred_at', thirtyDaysAgo)
      .order('occurred_at', { ascending: false })
      .limit(10);

    // Fetch relationship score
    const { data: relationshipScore } = await supabase
      .from('relationship_scores')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .single();

    // Fetch behavioral predictions
    const { data: predictions } = await supabase
      .from('behavioral_predictions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    // Fetch threat assessment
    const { data: threat } = await supabase
      .from('threat_assessments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .single();

    // Fetch recent observations
    const { data: observations } = await supabase
      .from('contact_observations')
      .select('*')
      .eq('profile_id', profileId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Build briefing
    const briefing = {
      recentCommunications: (communications || []).map((c: any) => ({
        channel: c.channel,
        direction: c.direction,
        subject: c.subject,
        occurred_at: c.occurred_at,
        sentiment_score: c.sentiment_score,
      })),
      keyTopics: extractKeyTopics(communications || [], observations || []),
      riskAlerts: buildRiskAlerts(relationshipScore, predictions || [], threat),
      talkingPoints: generateTalkingPoints(profile, communications || [], observations || []),
      relationshipHealth: relationshipScore?.overall_score || 50,
      lastContact: communications?.[0]?.occurred_at || null,
    };

    // Store the briefing
    await supabase
      .from('ai_analyses')
      .upsert({
        user_id: user.id,
        profile_id: profileId,
        analysis_type: 'meeting_prep',
        result: briefing,
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,profile_id,analysis_type',
      });

    return new Response(
      JSON.stringify({ success: true, briefing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating meeting prep:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractKeyTopics(communications: any[], observations: any[]): string[] {
  const topics = new Set<string>();
  
  // Extract from communication subjects
  (communications || []).forEach((c: any) => {
    if (c.subject) {
      // Simple keyword extraction
      const words = c.subject.split(/\s+/).filter((w: string) => w.length > 4);
      words.slice(0, 2).forEach((w: string) => topics.add(w.toLowerCase()));
    }
  });

  // Extract from observations
  (observations || []).forEach((o: any) => {
    if (o.category) {
      topics.add(o.category.replace('_', ' '));
    }
  });

  return Array.from(topics).slice(0, 5);
}

function buildRiskAlerts(relationshipScore: any, predictions: any[], threat: any): string[] {
  const alerts: string[] = [];

  // Check relationship health
  if (relationshipScore?.overall_score && relationshipScore.overall_score < 50) {
    alerts.push('Relationship health is below average - consider addressing any concerns');
  }

  // Check sentiment trend
  if (relationshipScore?.sentiment_score && relationshipScore.sentiment_score < 0) {
    alerts.push('Recent sentiment has been negative - approach with care');
  }

  // Check predictions for churn risk
  const prediction = predictions?.[0];
  if (prediction?.prediction_type === 'churn_risk' && prediction.prediction_value?.probability > 0.5) {
    alerts.push('High churn risk detected - prioritize relationship strengthening');
  }

  // Check threat assessment
  if (threat?.overall_risk_score && threat.overall_risk_score > 60) {
    alerts.push('Elevated risk profile - review threat assessment before meeting');
  }

  return alerts;
}

function generateTalkingPoints(profile: any, communications: any[], observations: any[]): string[] {
  const points: string[] = [];

  // Personal interests
  if (profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0) {
    points.push(`Ask about their interest in ${profile.interests[0]}`);
  }

  // Recent life events
  const recentObs = (observations || []).find((o: any) => 
    o.category === 'life_event' || o.category === 'achievement'
  );
  if (recentObs) {
    points.push(`Follow up on: ${recentObs.observation?.substring(0, 50) || 'recent event'}`);
  }

  // Work-related
  if (profile.organization || profile.job_title) {
    points.push(`Discuss their work at ${profile.organization || 'their company'}`);
  }

  // Communication gaps
  const lastComm = communications?.[0];
  if (lastComm) {
    const daysSinceContact = Math.floor((Date.now() - new Date(lastComm.occurred_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceContact > 30) {
      points.push('Acknowledge the gap since last contact - ask what\'s new');
    }
  }

  // Default if no specific points
  if (points.length === 0) {
    points.push('Ask about recent projects or activities');
    points.push('Inquire about their current priorities');
  }

  return points.slice(0, 4);
}
