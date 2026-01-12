import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RomanticIntelligenceRequest {
  profileId: string;
  userId: string;
  depth?: 'basic' | 'comprehensive' | 'deep';
}

const ROMANTIC_ANALYSIS_PROMPT = `You are an elite relationship psychologist and romantic intelligence analyst with expertise in attachment theory, love languages, and compatibility science.

Analyze the provided data about this person and generate a comprehensive romantic intelligence profile.

Return a JSON object with this EXACT structure:
{
  "attachment_style": {
    "primary": "secure" | "anxious" | "avoidant" | "disorganized",
    "secondary": "string describing nuance",
    "substyle": "specific variant from 12 substyles",
    "triggers": ["list of attachment triggers"],
    "healing_areas": ["areas needing growth"],
    "confidence": 0.0-1.0
  },
  "love_languages": [
    {
      "language": "words_of_affirmation" | "acts_of_service" | "receiving_gifts" | "quality_time" | "physical_touch",
      "priority": 1-5,
      "intensity": 0-100,
      "expression_style": "how they express this",
      "reception_needs": "how they need to receive this"
    }
  ],
  "romantic_patterns": {
    "pursuit_style": "pursuer" | "distancer" | "balanced",
    "conflict_style": "fight" | "flight" | "freeze" | "fawn",
    "intimacy_comfort": 0-100,
    "commitment_readiness": 0-100,
    "vulnerability_capacity": 0-100,
    "jealousy_tendency": 0-100,
    "possessiveness_risk": 0-100
  },
  "compatibility_markers": {
    "ideal_partner_traits": ["list of ideal traits"],
    "dealbreakers": ["absolute dealbreakers"],
    "relationship_values": ["core relationship values"],
    "communication_needs": ["specific communication needs"],
    "growth_areas": ["where they need partner support"]
  },
  "courtship_intelligence": {
    "approach_preferences": ["preferred approaches"],
    "turn_offs": ["things that push them away"],
    "romance_style": "grand_gestures" | "subtle_consistent" | "practical" | "experiential",
    "pace_preference": "fast" | "moderate" | "slow",
    "decision_making": "heart" | "head" | "balanced"
  },
  "intimacy_profile": {
    "emotional_intimacy_need": 0-100,
    "physical_affection_style": "description",
    "boundaries": ["known boundaries"],
    "trust_building_time": "fast" | "moderate" | "slow",
    "past_trauma_indicators": ["any indicators noted"]
  },
  "relationship_trajectory": {
    "current_readiness": "not_ready" | "casually_open" | "seeking" | "committed",
    "timeline_preferences": "description of timeline",
    "life_stage_alignment": "description",
    "predicted_challenges": ["potential challenges"],
    "success_factors": ["factors for success"]
  },
  "strategic_recommendations": [
    {
      "area": "category",
      "recommendation": "specific advice",
      "priority": "high" | "medium" | "low",
      "timing": "when to apply"
    }
  ],
  "confidence_score": 0.0-1.0,
  "data_quality": "high" | "medium" | "low"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { profileId, userId, depth = 'comprehensive' } = await req.json() as RomanticIntelligenceRequest;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: "profileId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather comprehensive data
    const [
      profileResult,
      messagesResult,
      observationsResult,
      behavioralResult,
      mediaAnalysesResult,
      previousAnalysesResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("messages").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).limit(100),
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(10),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId).limit(50),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId).in("analysis_type", ["emotional", "behavioral", "psychological"]).limit(10)
    ]);

    const contextData = {
      profile: profileResult.data,
      messages: messagesResult.data || [],
      observations: observationsResult.data || [],
      behavioral: behavioralResult.data || [],
      mediaAnalyses: mediaAnalysesResult.data || [],
      previousAnalyses: previousAnalysesResult.data || [],
      analysisDepth: depth
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ROMANTIC_ANALYSIS_PROMPT },
          { 
            role: "user", 
            content: `Analyze the following data for romantic intelligence profiling:\n\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI budget exceeded. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse romantic intelligence analysis");
    }

    // Store the analysis
    await supabase.from("ai_analyses").insert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "romantic_intelligence",
      result: analysis,
      generated_at: new Date().toISOString()
    });

    const usage = aiResult.usage || {};
    const estimatedCost = ((usage.prompt_tokens || 0) * 0.00001 + (usage.completion_tokens || 0) * 0.00003) * 100;

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        metadata: {
          depth,
          dataQuality: analysis.data_quality || 'medium',
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Romantic intelligence analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
