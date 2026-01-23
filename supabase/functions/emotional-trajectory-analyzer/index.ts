import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'emotional-trajectory-analyzer', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, timeRange = 180 } = await req.json();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    // Gather emotional data across time
    const [
      { data: messages },
      { data: voiceInsights },
      { data: facialAnalyses },
      { data: interactions },
      { data: observations }
    ] = await Promise.all([
      // NOTE: messages table has no profile_id column - must join via conversations
      // Also: messages has 'sent_at' not 'received_at'
      supabase.from('messages')
        .select('content, sent_at, conversations!inner(profile_id)')
        .eq('conversations.profile_id', profileId)
        .gte('sent_at', cutoffDate.toISOString())
        .order('sent_at', { ascending: true })
        .limit(1000),
      supabase.from('voice_insights')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('media_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'facial')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('contact_interaction_notes')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('contact_observations')
        .select('*')
        .eq('profile_id', profileId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: true })
    ]);

    const EMOTIONAL_TRAJECTORY_PROMPT = `You are an expert in emotional intelligence and psychological trajectory analysis. Analyze the following longitudinal emotional data to map emotional patterns, predict future states, and identify intervention opportunities.

Provide comprehensive emotional trajectory analysis in this JSON format:
{
  "currentEmotionalState": {
    "primaryEmotion": "string",
    "secondaryEmotions": ["string"],
    "intensity": 1-10,
    "stability": 1-10,
    "authenticity": 0-1
  },
  "emotionalBaseline": {
    "dominantMood": "string",
    "typicalRange": { "low": number, "high": number },
    "volatility": 1-10,
    "resilience": 1-10
  },
  "trajectoryAnalysis": {
    "overallTrend": "improving|stable|declining|volatile",
    "trendStrength": 0-1,
    "keyInflectionPoints": [
      {
        "timestamp": "string",
        "emotionalShift": "string",
        "magnitude": number,
        "possibleCause": "string"
      }
    ],
    "cyclicalPatterns": [
      {
        "pattern": "string",
        "frequency": "string",
        "predictability": 0-1
      }
    ]
  },
  "emotionalTriggers": {
    "positiveTrigers": [
      {
        "trigger": "string",
        "intensity": number,
        "frequency": number
      }
    ],
    "negativeTrigers": [
      {
        "trigger": "string",
        "intensity": number,
        "frequency": number
      }
    ]
  },
  "moodPredictions": {
    "next24Hours": {
      "predictedMood": "string",
      "confidence": 0-1,
      "riskFactors": ["string"]
    },
    "nextWeek": {
      "predictedTrend": "string",
      "confidence": 0-1,
      "opportunities": ["string"]
    },
    "nextMonth": {
      "predictedTrajectory": "string",
      "confidence": 0-1,
      "interventionPoints": ["string"]
    }
  },
  "emotionalNeeds": {
    "unmetNeeds": ["string"],
    "overindulgedNeeds": ["string"],
    "balanceRecommendations": ["string"]
  },
  "relationshipEmotionalDynamics": {
    "emotionalAvailability": 1-10,
    "reciprocityBalance": -100 to 100,
    "emotionalSafety": 1-10,
    "vulnerabilityCapacity": 1-10
  },
  "stressIndicators": {
    "currentStressLevel": 1-10,
    "stressTrend": "increasing|stable|decreasing",
    "primaryStressors": ["string"],
    "copingEffectiveness": 1-10
  },
  "emotionalGrowthOpportunities": [
    {
      "area": "string",
      "currentState": "string",
      "potentialGrowth": "string",
      "suggestedApproach": "string"
    }
  ],
  "warningSignals": [
    {
      "signal": "string",
      "severity": "critical|concerning|monitor",
      "timeframe": "string",
      "recommendedAction": "string"
    }
  ],
  "optimalEngagementWindows": [
    {
      "timeWindow": "string",
      "emotionalState": "string",
      "recommendedTopics": ["string"],
      "topicsToAvoid": ["string"]
    }
  ]
}`;

    const emotionalData = {
      messages: messages || [],
      voiceInsights: voiceInsights || [],
      facialAnalyses: facialAnalyses || [],
      interactions: interactions || [],
      observations: observations || [],
      timeRange
    };

    // Get AI config for model selection
    const aiConfig = await getAIConfig(supabase, userId);

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiConfig.qualityModel, // Use quality model for trajectory analysis
        messages: [
          { role: 'system', content: EMOTIONAL_TRAJECTORY_PROMPT },
          { role: 'user', content: JSON.stringify(emotionalData) }
        ],
        temperature: aiConfig.temperature,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e: any) {
      analysis = { raw: content, parseError: true };
    }

    // Store emotional trajectory analysis
    await supabase.from('ai_analyses').insert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'emotional_trajectory',
      result: analysis,
      generated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      dataPoints: {
        messages: messages?.length || 0,
        voiceInsights: voiceInsights?.length || 0,
        facialAnalyses: facialAnalyses?.length || 0,
        interactions: interactions?.length || 0
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Emotional trajectory analyzer error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
