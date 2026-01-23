import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CoercionResistanceRequest {
  profileId: string;
  userId?: string;
}

const COERCION_RESISTANCE_PROMPT = `You are an expert psychologist specializing in coercion resistance and psychological resilience assessment.

Analyze the subject's resistance to various forms of coercive influence, from subtle pressure to aggressive manipulation tactics.

Return a JSON object with this EXACT structure:
{
  "overall_resistance_score": 0-100,
  "resistance_tier": "highly_resistant" | "resistant" | "average" | "susceptible" | "highly_susceptible",
  "pressure_resistance": {
    "social_pressure": {
      "resistance": 0-100,
      "breaking_point_indicators": ["what would break them"],
      "effective_pressure_types": ["peer", "authority", "group"],
      "resistance_mechanisms": ["how they resist"]
    },
    "emotional_pressure": {
      "resistance": 0-100,
      "emotional_vulnerabilities": ["guilt", "shame", "fear"],
      "escalation_threshold": "low" | "moderate" | "high",
      "effective_approaches": ["what works"]
    },
    "economic_pressure": {
      "resistance": 0-100,
      "financial_vulnerability": 0-100,
      "career_leverage_susceptibility": 0-100,
      "material_motivations": ["what they value"]
    },
    "physical_proximity_pressure": {
      "resistance": 0-100,
      "personal_space_sensitivity": 0-100,
      "intimidation_susceptibility": 0-100
    }
  },
  "psychological_resilience": {
    "stress_tolerance": 0-100,
    "cognitive_load_capacity": 0-100,
    "emotional_regulation": 0-100,
    "decision_making_under_pressure": 0-100,
    "recovery_speed": "fast" | "moderate" | "slow"
  },
  "compliance_triggers": [
    {
      "trigger": "description",
      "effectiveness": 0-100,
      "activation_method": "how to activate",
      "countering_mechanism": "what prevents it"
    }
  ],
  "breaking_points": [
    {
      "scenario": "situation that would break resistance",
      "threshold": "low" | "moderate" | "high" | "extreme",
      "exploitation_approach": "how to reach this point",
      "recovery_likelihood": 0-100
    }
  ],
  "authority_response_patterns": {
    "deference_level": 0-100,
    "questioning_tendency": 0-100,
    "blind_obedience_risk": 0-100,
    "authority_types_effective": ["types they defer to"]
  },
  "social_isolation_vulnerability": {
    "isolation_tolerance": 0-100,
    "support_network_dependency": 0-100,
    "solo_decision_capability": 0-100
  },
  "effective_coercion_techniques": [
    {
      "technique": "name",
      "effectiveness": 0-100,
      "implementation": "how to apply",
      "expected_response": "likely reaction",
      "timeline": "how long it takes"
    }
  ],
  "resistance_building_recommendations": [
    {
      "area": "vulnerability area",
      "recommendation": "how to strengthen resistance",
      "priority": "high" | "medium" | "low"
    }
  ],
  "confidence_score": 0.0-1.0
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'coercion-resistance-assessor', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Handle both user tokens and service role calls
    const authHeader = req.headers.get("Authorization");
    const body = await req.json() as CoercionResistanceRequest;
    
    // Normalize parameter names
    const profileId = body.profileId || (body as any).profile_id;
    let userId = body.userId || (body as any).user_id;
    
    // Check if service role call or user token
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;
    
    if (!isServiceRoleCall && authHeader) {
      const { data: { user }, error: authError } = await supabase.auth.getUser(token!);
      if (!authError && user) {
        userId = user.id;
      }
    }

    if (!profileId) {
      return new Response(
        JSON.stringify({ error: "profileId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather psychological data
    // NOTE: messages table has no profile_id column - must join via conversations
    const [
      profileResult,
      messagesResult,
      observationsResult,
      behavioralResult,
      psychProfileResult,
      previousAnalysesResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("messages").select("*, conversations!inner(profile_id)").eq("conversations.profile_id", profileId).order("created_at", { ascending: false }).limit(200),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).limit(100),
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId).limit(10),
      supabase.from("psychological_profiles").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId).in("analysis_type", ["manipulation_vulnerability", "behavioral_dna", "psychological"]).limit(10)
    ]);

    const contextData = {
      profile: profileResult.data,
      messages: messagesResult.data?.slice(0, 100) || [],
      observations: observationsResult.data || [],
      behavioral: behavioralResult.data || [],
      psychProfile: psychProfileResult.data,
      previousAnalyses: previousAnalysesResult.data || []
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: COERCION_RESISTANCE_PROMPT },
          { 
            role: "user", 
            content: `Assess coercion resistance for this subject:\n\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
      throw new Error("Failed to parse coercion resistance analysis");
    }

    // Store the analysis using upsert for idempotency
    await supabase.from("ai_analyses").upsert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "coercion_resistance",
      result: analysis,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    const usage = aiResult.usage || {};
    const estimatedCost = ((usage.prompt_tokens || 0) * 0.00001 + (usage.completion_tokens || 0) * 0.00003) * 100;

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        metadata: {
          overallResistance: analysis.overall_resistance_score,
          resistanceTier: analysis.resistance_tier,
          breakingPointCount: analysis.breaking_points?.length || 0,
          effectiveTechniques: analysis.effective_coercion_techniques?.length || 0,
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Coercion resistance assessment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
