import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommunityClassRequest {
  profileId: string;
  userId: string;
}

const COMMUNITY_CLASS_PROMPT = `You are an expert sociologist and social stratification analyst. Analyze the provided data to determine the subject's community class position, cultural capital, and social mobility trajectory.

Use a 9-tier classification system:
1. Lower-Lower (extreme poverty, marginalized)
2. Middle-Lower (working poor)
3. Upper-Lower (stable working class)
4. Lower-Middle (aspirational middle)
5. Middle-Middle (established middle)
6. Upper-Middle (professional class)
7. Lower-Upper (affluent professionals)
8. Middle-Upper (wealthy, high influence)
9. Upper-Upper (elite, generational wealth)

Return a JSON object with this EXACT structure:
{
  "stratum": 1-9,
  "stratum_label": "descriptive label",
  "cultural_capital": {
    "education_tier": "high_school" | "some_college" | "bachelors" | "masters" | "doctorate" | "elite_institution",
    "education_prestige": 0-100,
    "refinement_score": 0-100,
    "taste_markers": ["specific cultural taste indicators"],
    "cultural_competencies": ["areas of cultural knowledge"],
    "aesthetic_preferences": "description of aesthetic sensibilities"
  },
  "economic_capital": {
    "income_bracket": "estimate or range",
    "wealth_indicators": ["observable wealth signals"],
    "consumption_patterns": ["spending/lifestyle patterns"],
    "financial_stability": 0-100,
    "asset_indicators": ["home ownership, investments, etc."]
  },
  "social_capital": {
    "network_reach_score": 0-100,
    "leverage_potential": "low" | "medium" | "high" | "very_high",
    "connection_quality": "description of connection types",
    "institutional_access": ["institutions they have access to"],
    "gate_keeper_proximity": 0-100
  },
  "symbolic_capital": {
    "prestige_score": 0-100,
    "status_markers": ["status symbols and signals"],
    "recognition_level": "local" | "regional" | "national" | "international",
    "authority_domains": ["areas where they have authority"]
  },
  "mobility_analysis": {
    "trajectory": "ascending" | "stable" | "descending",
    "velocity": "slow" | "moderate" | "rapid",
    "origin_class": 1-9,
    "mobility_distance": -8 to 8,
    "barriers": ["obstacles to mobility"],
    "enablers": ["factors supporting mobility"],
    "ceiling_estimate": 1-9
  },
  "class_anxiety_indicators": {
    "anxiety_level": 0-100,
    "aspiration_markers": ["signs of class aspiration"],
    "insecurity_signals": ["class insecurity behaviors"],
    "over_compensation": ["areas of over-compensation"]
  },
  "social_climbing_patterns": {
    "active_climbing": true | false,
    "strategies_observed": ["specific strategies used"],
    "network_cultivation": "description of networking behavior",
    "credential_seeking": ["credentials being pursued"]
  },
  "strategic_implications": [
    {
      "insight": "specific insight",
      "leverage_opportunity": "how to use this",
      "risk": "potential risk",
      "approach": "recommended approach"
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
    const { profileId, userId } = await req.json() as CommunityClassRequest;

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: "profileId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather data for analysis
    const [
      profileResult,
      observationsResult,
      enrichmentsResult,
      mediaAnalysesResult,
      brandIntelResult,
      messagesResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).limit(100),
      supabase.from("enrichment_results").select("*").eq("profile_id", profileId).limit(20),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId).limit(50),
      supabase.from("brand_intelligence").select("*").eq("profile_id", profileId).limit(5),
      supabase.from("messages").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(100)
    ]);

    const contextData = {
      profile: profileResult.data,
      observations: observationsResult.data || [],
      enrichments: enrichmentsResult.data || [],
      mediaAnalyses: mediaAnalysesResult.data || [],
      brandIntelligence: brandIntelResult.data || [],
      messages: messagesResult.data || []
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
          { role: "system", content: COMMUNITY_CLASS_PROMPT },
          { 
            role: "user", 
            content: `Analyze the following data for community class assessment:\n\n${JSON.stringify(contextData, null, 2)}`
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
      throw new Error("Failed to parse community class analysis");
    }

    // Store the analysis
    await supabase.from("ai_analyses").insert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "community_class",
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
          stratum: analysis.stratum,
          stratumLabel: analysis.stratum_label,
          mobilityTrajectory: analysis.mobility_analysis?.trajectory,
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Community class analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
