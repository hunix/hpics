// Relationship Lifecycle Detector
// Classifies relationships into stages and generates stage-appropriate recommendations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callAI, parseAIJson, selectModel } from '../_shared/ai-client.ts';
import { applyRateLimit } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type LifecycleStage = 'new' | 'growing' | 'stable' | 'declining' | 'dormant' | 'churned';

interface LifecycleAnalysis {
  stage: LifecycleStage;
  confidence: number;
  indicators: string[];
  daysSinceLastContact: number;
  communicationTrend: 'increasing' | 'stable' | 'decreasing';
  sentimentTrend: 'improving' | 'stable' | 'declining';
  recommendations: Array<{ action: string; urgency: 'immediate' | 'soon' | 'planned' }>;
  transitionPrediction?: {
    likelyNextStage: LifecycleStage;
    probability: number;
    timeframe: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const rateLimitResponse = applyRateLimit(user.id, 'detect-relationship-lifecycle');
    if (rateLimitResponse) return rateLimitResponse;

    const { profileId, includeAllContacts } = await req.json();

    if (includeAllContacts) {
      // Batch process all contacts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type, last_contact_date, created_at')
        .eq('user_id', user.id)
        .limit(100);

      const results = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const analysis = await analyzeLifecycle(supabase, user.id, profile.id, profile);
            return { profileId: profile.id, name: `${profile.first_name} ${profile.last_name}`, ...analysis };
          } catch (e) {
            return { profileId: profile.id, error: e instanceof Error ? e.message : 'Unknown error' };
          }
        })
      );

      return new Response(JSON.stringify({ success: true, results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profileId) {
      return new Response(JSON.stringify({ error: 'Missing profileId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analysis = await analyzeLifecycle(supabase, user.id, profileId, profile);

    // Store the lifecycle analysis
    await supabase.from('relationship_inferences').upsert({
      user_id: user.id,
      profile_id: profileId,
      inference_type: 'lifecycle_stage',
      inference_value: {
        stage: analysis.stage,
        confidence: analysis.confidence,
        indicators: analysis.indicators,
        transitionPrediction: analysis.transitionPrediction,
      },
      confidence_score: analysis.confidence / 100,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'user_id,profile_id,inference_type',
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lifecycle detection error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeLifecycle(
  supabase: any, 
  userId: string, 
  profileId: string,
  profile: any
): Promise<LifecycleAnalysis> {
  // Fetch communication history
  const { data: communications } = await supabase
    .from('communications')
    .select('occurred_at, channel, direction, sentiment_score')
    .eq('profile_id', profileId)
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(100);

  // Fetch messages
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .eq('profile_id', profileId)
    .eq('user_id', userId);

  let messageCount = 0;
  let recentMessageDates: Date[] = [];
  
  if (conversations && conversations.length > 0) {
    const conversationIds = conversations.map((c: any) => c.id);
    const { data: messages } = await supabase
      .from('messages')
      .select('sent_at')
      .in('conversation_id', conversationIds)
      .order('sent_at', { ascending: false })
      .limit(50);
    
    messageCount = messages?.length || 0;
    recentMessageDates = messages?.map((m: any) => new Date(m.sent_at)) || [];
  }

  // Calculate key metrics
  const now = new Date();
  const allDates = [
    ...(communications?.map((c: any) => new Date(c.occurred_at)) || []),
    ...recentMessageDates,
  ].sort((a, b) => b.getTime() - a.getTime());

  const lastContactDate = allDates[0] || (profile.last_contact_date ? new Date(profile.last_contact_date) : null);
  const daysSinceLastContact = lastContactDate 
    ? Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  const createdAt = new Date(profile.created_at);
  const relationshipAgeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate communication trend (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  
  const recentCount = allDates.filter(d => d >= thirtyDaysAgo).length;
  const previousCount = allDates.filter(d => d >= sixtyDaysAgo && d < thirtyDaysAgo).length;
  
  const communicationTrend = recentCount > previousCount * 1.2 
    ? 'increasing' 
    : recentCount < previousCount * 0.8 
      ? 'decreasing' 
      : 'stable';

  // Calculate sentiment trend
  const recentSentiments = communications
    ?.filter((c: any) => new Date(c.occurred_at) >= thirtyDaysAgo)
    ?.map((c: any) => c.sentiment_score)
    ?.filter((s: any) => s !== null) || [];
  
  const previousSentiments = communications
    ?.filter((c: any) => {
      const d = new Date(c.occurred_at);
      return d >= sixtyDaysAgo && d < thirtyDaysAgo;
    })
    ?.map((c: any) => c.sentiment_score)
    ?.filter((s: any) => s !== null) || [];

  const avgRecentSentiment = recentSentiments.length 
    ? recentSentiments.reduce((a: number, b: number) => a + b, 0) / recentSentiments.length 
    : 0;
  const avgPreviousSentiment = previousSentiments.length 
    ? previousSentiments.reduce((a: number, b: number) => a + b, 0) / previousSentiments.length 
    : 0;

  const sentimentTrend = avgRecentSentiment > avgPreviousSentiment + 0.1
    ? 'improving'
    : avgRecentSentiment < avgPreviousSentiment - 0.1
      ? 'declining'
      : 'stable';

  // Determine lifecycle stage
  let stage: LifecycleStage;
  let confidence: number;
  const indicators: string[] = [];

  if (daysSinceLastContact > 180) {
    stage = 'churned';
    confidence = 90;
    indicators.push('No contact in over 6 months');
  } else if (daysSinceLastContact > 90) {
    stage = 'dormant';
    confidence = 85;
    indicators.push('No contact in over 3 months');
  } else if (relationshipAgeDays < 30) {
    stage = 'new';
    confidence = 80;
    indicators.push('Relationship less than 30 days old');
  } else if (communicationTrend === 'decreasing' && sentimentTrend === 'declining') {
    stage = 'declining';
    confidence = 75;
    indicators.push('Decreasing communication frequency');
    indicators.push('Declining sentiment');
  } else if (communicationTrend === 'increasing' || (relationshipAgeDays < 90 && recentCount > 3)) {
    stage = 'growing';
    confidence = 70;
    indicators.push('Increasing communication frequency');
  } else {
    stage = 'stable';
    confidence = 65;
    indicators.push('Consistent communication pattern');
  }

  // Generate recommendations based on stage
  const recommendations = getStageRecommendations(stage, {
    daysSinceLastContact,
    communicationTrend,
    sentimentTrend,
    isFavorite: profile.is_favorite,
  });

  // Predict next stage transition
  const transitionPrediction = predictTransition(stage, {
    communicationTrend,
    sentimentTrend,
    daysSinceLastContact,
  });

  return {
    stage,
    confidence,
    indicators,
    daysSinceLastContact,
    communicationTrend,
    sentimentTrend,
    recommendations,
    transitionPrediction,
  };
}

function getStageRecommendations(
  stage: LifecycleStage, 
  context: { 
    daysSinceLastContact: number; 
    communicationTrend: string; 
    sentimentTrend: string;
    isFavorite: boolean;
  }
): Array<{ action: string; urgency: 'immediate' | 'soon' | 'planned' }> {
  const recommendations: Array<{ action: string; urgency: 'immediate' | 'soon' | 'planned' }> = [];

  switch (stage) {
    case 'new':
      recommendations.push({ action: 'Schedule follow-up within 1 week to build momentum', urgency: 'soon' });
      recommendations.push({ action: 'Add to relevant contact groups', urgency: 'planned' });
      break;
    case 'growing':
      recommendations.push({ action: 'Introduce to mutual connections', urgency: 'planned' });
      recommendations.push({ action: 'Share valuable content or resources', urgency: 'soon' });
      break;
    case 'stable':
      recommendations.push({ action: 'Regular check-in to maintain relationship', urgency: 'planned' });
      if (context.sentimentTrend === 'declining') {
        recommendations.push({ action: 'Address any concerns proactively', urgency: 'soon' });
      }
      break;
    case 'declining':
      recommendations.push({ action: 'Reach out with personalized message', urgency: 'immediate' });
      recommendations.push({ action: 'Offer value or assistance', urgency: 'soon' });
      break;
    case 'dormant':
      recommendations.push({ action: 'Re-engagement outreach required', urgency: 'immediate' });
      recommendations.push({ action: 'Reference shared history or interests', urgency: 'soon' });
      break;
    case 'churned':
      recommendations.push({ action: 'Consider win-back campaign if valuable', urgency: 'planned' });
      recommendations.push({ action: 'Archive or mark for periodic review', urgency: 'planned' });
      break;
  }

  if (context.isFavorite && stage !== 'stable' && stage !== 'growing') {
    recommendations.unshift({ 
      action: 'Priority contact needs attention!', 
      urgency: 'immediate' 
    });
  }

  return recommendations;
}

function predictTransition(
  currentStage: LifecycleStage,
  context: { communicationTrend: string; sentimentTrend: string; daysSinceLastContact: number }
): { likelyNextStage: LifecycleStage; probability: number; timeframe: string } | undefined {
  const { communicationTrend, sentimentTrend, daysSinceLastContact } = context;

  switch (currentStage) {
    case 'new':
      if (communicationTrend === 'increasing') {
        return { likelyNextStage: 'growing', probability: 75, timeframe: '2-4 weeks' };
      }
      return { likelyNextStage: 'dormant', probability: 40, timeframe: '4-8 weeks' };
    
    case 'growing':
      if (communicationTrend === 'decreasing') {
        return { likelyNextStage: 'stable', probability: 60, timeframe: '4-6 weeks' };
      }
      return { likelyNextStage: 'stable', probability: 80, timeframe: '2-3 months' };
    
    case 'stable':
      if (communicationTrend === 'decreasing' && sentimentTrend === 'declining') {
        return { likelyNextStage: 'declining', probability: 65, timeframe: '4-8 weeks' };
      }
      return undefined;
    
    case 'declining':
      if (daysSinceLastContact > 60) {
        return { likelyNextStage: 'dormant', probability: 80, timeframe: '2-4 weeks' };
      }
      return { likelyNextStage: 'dormant', probability: 50, timeframe: '6-8 weeks' };
    
    case 'dormant':
      return { likelyNextStage: 'churned', probability: 70, timeframe: '2-3 months' };
    
    default:
      return undefined;
  }
}
