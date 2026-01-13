import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PredictionRequest {
  profileId: string;
  predictionTypes?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId, predictionTypes = ['optimal_outreach_time', 'communication_style', 'engagement_probability'] } = await req.json() as PredictionRequest;

    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather feature data for the profile
    const [
      { data: profile },
      { data: communications },
      { data: messages },
      { data: observations },
      { data: baselines }
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("communications").select("*").eq("profile_id", profileId).order("occurred_at", { ascending: false }).limit(100),
      supabase.from("messages").select("*").eq("profile_id", profileId).order("sent_at", { ascending: false }).limit(100),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).order("observed_at", { ascending: false }).limit(50),
      supabase.from("behavioral_baselines").select("*").eq("profile_id", profileId).limit(5)
    ]);

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract features for ML prediction
    const features = extractFeatures(communications || [], messages || [], observations || [], baselines || []);

    // Get AI config for model selection
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const aiConfig = await getAIConfig(supabaseService, user.id);

    // Generate predictions using AI
    const predictions = await generatePredictions(
      user.id,
      profileId,
      profile,
      features,
      predictionTypes,
      aiConfig
    );

    // Store predictions
    const { error: insertError } = await supabase
      .from("behavioral_predictions")
      .upsert(predictions.map((p: any) => ({
        ...p,
        user_id: user.id,
        profile_id: profileId,
        features_used: features,
        model_version: "v1.0-gemini",
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Valid for 7 days
      })), { 
        onConflict: 'user_id,profile_id,prediction_type',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error("Failed to store predictions:", insertError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      predictions,
      features_summary: {
        communication_count: features.communicationCount,
        message_count: features.messageCount,
        avg_response_time_hours: features.avgResponseTimeHours,
        preferred_channels: features.preferredChannels,
        active_hours: features.activeHours
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("train-behavior-model error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractFeatures(
  communications: any[],
  messages: any[],
  observations: any[],
  baselines: any[]
) {
  // Communication timing analysis
  const commTimes = communications.map(c => new Date(c.occurred_at));
  const msgTimes = messages.map(m => new Date(m.sent_at));
  const allTimes = [...commTimes, ...msgTimes];

  // Extract hour distribution
  const hourCounts: Record<number, number> = {};
  const dayOfWeekCounts: Record<number, number> = {};
  
  allTimes.forEach(t => {
    const hour = t.getHours();
    const dow = t.getDay();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    dayOfWeekCounts[dow] = (dayOfWeekCounts[dow] || 0) + 1;
  });

  // Find peak hours
  const activeHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  const activeDays = Object.entries(dayOfWeekCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([day]) => parseInt(day));

  // Channel preference
  const channelCounts: Record<string, number> = {};
  communications.forEach(c => {
    channelCounts[c.channel] = (channelCounts[c.channel] || 0) + 1;
  });
  const preferredChannels = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([channel]) => channel);

  // Response time calculation (simplified)
  const responseTimes: number[] = [];
  for (let i = 1; i < communications.length; i++) {
    const curr = new Date(communications[i].occurred_at).getTime();
    const prev = new Date(communications[i-1].occurred_at).getTime();
    const diff = Math.abs(curr - prev) / (1000 * 60 * 60); // hours
    if (diff < 168) { // Within a week
      responseTimes.push(diff);
    }
  }
  const avgResponseTimeHours = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : null;

  // Sentiment trend
  const sentimentScores = communications
    .filter(c => c.sentiment_score != null)
    .map(c => c.sentiment_score);
  const avgSentiment = sentimentScores.length > 0
    ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
    : null;

  // Recency
  const lastContact = allTimes.length > 0 
    ? Math.max(...allTimes.map(t => t.getTime()))
    : null;
  const daysSinceContact = lastContact 
    ? (Date.now() - lastContact) / (1000 * 60 * 60 * 24)
    : null;

  return {
    communicationCount: communications.length,
    messageCount: messages.length,
    observationCount: observations.length,
    avgResponseTimeHours,
    avgSentiment,
    activeHours,
    activeDays,
    preferredChannels,
    daysSinceContact,
    hasBaseline: baselines.length > 0,
    baselineTypes: baselines.map(b => b.baseline_type)
  };
}

async function generatePredictions(
  userId: string,
  profileId: string,
  profile: any,
  features: any,
  predictionTypes: string[],
  aiConfig: any
) {
  const prompt = `You are a behavioral prediction AI analyzing relationship patterns.

Contact Profile:
- Name: ${profile.first_name} ${profile.last_name || ''}
- Company: ${profile.company || 'Unknown'}
- Relationship Type: ${profile.relationship_type || 'Unknown'}

Behavioral Features:
- Total Communications: ${features.communicationCount}
- Total Messages: ${features.messageCount}
- Average Response Time: ${features.avgResponseTimeHours ? features.avgResponseTimeHours.toFixed(1) + ' hours' : 'Unknown'}
- Average Sentiment: ${features.avgSentiment ? (features.avgSentiment * 100).toFixed(0) + '%' : 'Unknown'}
- Active Hours (24h): ${features.activeHours.join(', ') || 'Unknown'}
- Active Days (0=Sun): ${features.activeDays.join(', ') || 'Unknown'}
- Preferred Channels: ${features.preferredChannels.join(', ') || 'Unknown'}
- Days Since Last Contact: ${features.daysSinceContact ? features.daysSinceContact.toFixed(1) : 'Unknown'}

Generate predictions for the following types: ${predictionTypes.join(', ')}

Respond with a JSON object containing predictions for each type. Each prediction should have:
- prediction_type: string
- prediction_value: object with specific predictions
- confidence_score: number 0-1
- reasoning: string explaining the prediction`;

  const response = await callAI({
    userId,
    functionName: "train-behavior-model",
    profileId,
    messages: [
      { role: "system", content: "You are a behavioral prediction AI. Return valid JSON only." },
      { role: "user", content: prompt }
    ],
    model: aiConfig.speedModel, // Use speed model for predictions
    temperature: aiConfig.temperature,
    maxTokens: 2000,
  });

  try {
    const parsed = JSON.parse(response.content);
    const predictions = parsed.predictions || [];
    
    // Ensure proper structure
    return predictions.map((p: any) => ({
      prediction_type: p.prediction_type,
      prediction_value: p.prediction_value || p,
      confidence_score: Math.min(1, Math.max(0, p.confidence_score || 0.5))
    }));
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    // Return default predictions
    return predictionTypes.map(type => ({
      prediction_type: type,
      prediction_value: { status: "generation_failed", raw: response.content?.substring(0, 500) },
      confidence_score: 0.3
    }));
  }
}
