import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FortuneTrajectoryRequest {
  profileId: string;
  userId: string;
  timeHorizon?: '1_year' | '5_year' | '10_year' | 'lifetime';
}

const FORTUNE_TRAJECTORY_PROMPT = `You are an elite futurist and life trajectory analyst combining data science, psychology, sociology, and predictive modeling. Create comprehensive fortune/destiny trajectory predictions.

Analyze all available data to model probable life trajectories across multiple dimensions.

Return a JSON object with this EXACT structure:
{
  "financial_trajectory": {
    "current_estimated_position": "description",
    "income_curve": {
      "current_bracket": "low" | "lower_middle" | "middle" | "upper_middle" | "high" | "very_high",
      "peak_bracket": "predicted peak",
      "peak_age_estimate": number,
      "growth_rate": "declining" | "stagnant" | "slow" | "moderate" | "rapid" | "explosive"
    },
    "wealth_accumulation": {
      "current_trajectory": "negative" | "break_even" | "slow_accumulation" | "steady_growth" | "rapid_growth",
      "retirement_readiness": 0-100,
      "financial_independence_probability": 0-100,
      "estimated_net_worth_trajectory": ["timeline of estimates"]
    },
    "financial_risks": [
      {
        "risk": "specific risk",
        "probability": 0-100,
        "impact": "low" | "medium" | "high" | "catastrophic",
        "mitigation": "recommendation"
      }
    ],
    "financial_opportunities": [
      {
        "opportunity": "specific opportunity",
        "probability_of_capture": 0-100,
        "potential_impact": "description",
        "action_required": "recommendation"
      }
    ]
  },
  "career_trajectory": {
    "current_position_assessment": "description",
    "career_ceiling_estimate": "description of likely peak",
    "milestone_predictions": [
      {
        "milestone": "career milestone",
        "probability": 0-100,
        "estimated_timeline": "years from now",
        "enabling_factors": ["what would make this happen"],
        "blocking_factors": ["what could prevent it"]
      }
    ],
    "industry_position_forecast": "where they'll be in their field",
    "pivot_probability": 0-100,
    "likely_pivot_directions": ["possible career changes"],
    "burnout_risk": 0-100,
    "fulfillment_trajectory": "declining" | "stable" | "increasing"
  },
  "health_trajectory": {
    "current_indicators": ["observable health indicators"],
    "risk_factors": [
      {
        "factor": "health risk",
        "severity": "low" | "medium" | "high",
        "modifiability": 0-100,
        "intervention_recommendation": "advice"
      }
    ],
    "longevity_estimate": {
      "optimistic": number,
      "realistic": number,
      "pessimistic": number
    },
    "quality_of_life_forecast": {
      "physical": 0-100,
      "mental": 0-100,
      "trajectory": "declining" | "stable" | "improving"
    },
    "critical_intervention_windows": ["when to act for best outcomes"]
  },
  "relationship_trajectory": {
    "current_status_assessment": "description",
    "partnership_predictions": {
      "long_term_relationship_probability": 0-100,
      "relationship_stability_forecast": 0-100,
      "divorce_risk": 0-100,
      "partnership_satisfaction_trajectory": "description"
    },
    "family_trajectory": {
      "children_probability": 0-100,
      "parenting_success_indicators": ["positive/negative indicators"],
      "family_cohesion_forecast": 0-100
    },
    "social_network_evolution": "description of how network will change",
    "loneliness_risk": 0-100
  },
  "life_satisfaction_forecast": {
    "current_baseline": 0-100,
    "peak_satisfaction_estimate": {
      "age": number,
      "score": 0-100,
      "drivers": ["what will drive satisfaction"]
    },
    "fulfillment_trajectory_by_domain": {
      "career": "trajectory description",
      "relationships": "trajectory description",
      "health": "trajectory description",
      "purpose": "trajectory description",
      "adventure": "trajectory description"
    },
    "mid_life_crisis_probability": 0-100,
    "regret_risk_areas": ["potential areas of regret"]
  },
  "luck_and_opportunity": {
    "opportunity_windows": [
      {
        "window": "opportunity description",
        "timing": "when",
        "capture_probability": 0-100,
        "preparation_required": "what to do now"
      }
    ],
    "luck_surface_area": 0-100,
    "serendipity_potential": "low" | "medium" | "high",
    "crisis_probability_timeline": [
      {
        "crisis_type": "type of crisis",
        "probability": 0-100,
        "timing_estimate": "when",
        "resilience_forecast": 0-100
      }
    ]
  },
  "legacy_projection": {
    "impact_sphere": "family" | "community" | "industry" | "national" | "global",
    "legacy_type": "what they'll be remembered for",
    "influence_duration": "how long impact will last",
    "successor_probability": 0-100,
    "contribution_areas": ["areas of lasting contribution"]
  },
  "intervention_recommendations": [
    {
      "area": "life area",
      "intervention": "specific recommendation",
      "impact_potential": 0-100,
      "urgency": "immediate" | "short_term" | "medium_term" | "long_term",
      "difficulty": "easy" | "moderate" | "hard" | "very_hard",
      "expected_roi": "description of expected return"
    }
  ],
  "confidence_score": 0.0-1.0,
  "prediction_horizon_reliability": {
    "1_year": 0-100,
    "5_year": 0-100,
    "10_year": 0-100,
    "lifetime": 0-100
  }
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
    const { profileId, userId, timeHorizon = '10_year' } = await req.json() as FortuneTrajectoryRequest;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: "profileId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather comprehensive life data
    const [
      profileResult,
      observationsResult,
      behavioralResult,
      messagesResult,
      enrichmentsResult,
      mediaAnalysesResult,
      predictionsResult,
      communityClassResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).limit(200),
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId).limit(20),
      supabase.from("messages").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(300),
      supabase.from("enrichment_results").select("*").eq("profile_id", profileId).limit(30),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId).limit(50),
      supabase.from("behavioral_predictions").select("*").eq("profile_id", profileId).limit(20),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId).eq("analysis_type", "community_class").order("generated_at", { ascending: false }).limit(1)
    ]);

    const contextData = {
      profile: profileResult.data,
      observations: observationsResult.data || [],
      behavioral: behavioralResult.data || [],
      messages: messagesResult.data || [],
      enrichments: enrichmentsResult.data || [],
      mediaAnalyses: mediaAnalysesResult.data || [],
      existingPredictions: predictionsResult.data || [],
      communityClass: communityClassResult.data?.[0]?.result || null,
      timeHorizon
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
          { role: "system", content: FORTUNE_TRAJECTORY_PROMPT },
          { 
            role: "user", 
            content: `Generate comprehensive fortune/destiny trajectory analysis for time horizon: ${timeHorizon}\n\nData:\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: 0.4,
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
      throw new Error("Failed to parse fortune trajectory analysis");
    }

    // Store the analysis
    await supabase.from("ai_analyses").insert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "fortune_trajectory",
      result: { ...analysis, time_horizon: timeHorizon },
      generated_at: new Date().toISOString()
    });

    const usage = aiResult.usage || {};
    const estimatedCost = ((usage.prompt_tokens || 0) * 0.00001 + (usage.completion_tokens || 0) * 0.00003) * 100;

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        metadata: {
          timeHorizon,
          milestoneCount: analysis.career_trajectory?.milestone_predictions?.length || 0,
          interventionCount: analysis.intervention_recommendations?.length || 0,
          confidenceScore: analysis.confidence_score || 0.6,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fortune trajectory analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
