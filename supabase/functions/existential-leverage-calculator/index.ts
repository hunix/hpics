import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExistentialLeverageRequest {
  profileId: string;
  userId?: string;
}

const EXISTENTIAL_LEVERAGE_PROMPT = `You are an expert psychologist analyzing existential leverage points - deep psychological factors related to mortality awareness, meaning/purpose, legacy concerns, and existential anxieties that can be used for influence.

Analyze the subject's existential landscape to identify leverage opportunities.

Return a JSON object with this EXACT structure:
{
  "overall_leverage_score": 0-100,
  "leverage_tier": "minimal" | "moderate" | "significant" | "substantial" | "profound",
  "mortality_awareness": {
    "death_anxiety_level": 0-100,
    "denial_mechanisms": ["defense mechanisms used"],
    "trigger_topics": ["topics that activate awareness"],
    "leverage_approach": "how to use this",
    "optimal_framing": "how to frame mortality-related influence"
  },
  "meaning_purpose": {
    "meaning_seeking_intensity": 0-100,
    "current_meaning_sources": ["what gives them meaning"],
    "meaning_vulnerabilities": ["where meaning is fragile"],
    "purpose_clarity": 0-100,
    "existential_vacuum_risk": 0-100,
    "leverage_approach": "how to exploit meaning needs"
  },
  "legacy_concerns": {
    "legacy_importance": 0-100,
    "legacy_type": "achievement" | "family" | "contribution" | "recognition" | "impact",
    "legacy_anxieties": ["worries about being forgotten"],
    "legacy_actions": ["what they do to create legacy"],
    "leverage_approach": "how to use legacy desires"
  },
  "identity_foundations": {
    "core_identity_elements": ["what defines them"],
    "identity_threats": ["what threatens their sense of self"],
    "identity_investment_areas": ["where identity is most invested"],
    "destabilization_vectors": ["how to challenge identity"],
    "reconstruction_opportunity": "how to offer new identity"
  },
  "freedom_autonomy": {
    "freedom_valuation": 0-100,
    "control_need": 0-100,
    "dependency_tolerance": 0-100,
    "autonomy_threats": ["what threatens their autonomy"],
    "leverage_approach": "how to use freedom/control needs"
  },
  "isolation_connection": {
    "isolation_fear": 0-100,
    "connection_desperation": 0-100,
    "belonging_needs": ["where they need to belong"],
    "alienation_vulnerability": 0-100,
    "leverage_approach": "how to use connection needs"
  },
  "exploitation_windows": [
    {
      "window_type": "type of opportunity",
      "trigger_condition": "what opens this window",
      "predicted_timing": "when it might occur",
      "approach_method": "how to exploit",
      "expected_outcome": "likely result",
      "risk_level": "low" | "medium" | "high"
    }
  ],
  "leverage_scripts": [
    {
      "scenario": "situation description",
      "opening_approach": "how to begin",
      "key_phrases": ["effective phrases to use"],
      "emotional_arc": "how to guide emotions",
      "close_technique": "how to secure compliance"
    }
  ],
  "counter_leverage_risks": [
    {
      "risk": "potential backfire scenario",
      "likelihood": 0-100,
      "mitigation": "how to prevent"
    }
  ],
  "confidence_score": 0.0-1.0
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation
  try {
    const body = await req.clone().json();
    if (body?.healthCheck === true) {
      return new Response(JSON.stringify({ ok: true, function: 'existential-leverage-calculator', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch { /* not JSON or no body - continue normally */ }

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
    const body = await req.json() as ExistentialLeverageRequest;
    
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

    // Gather relevant data for existential analysis
    // Using correct table: contact_interaction_notes (not 'notes')
    const [
      profileResult,
      interactionNotesResult,
      milestonesResult,
      psychProfileResult,
      observationsResult,
      previousAnalysesResult
    ] = await Promise.all([
      supabase.from("profiles").select("id, first_name, last_name, organization, job_title, relationship_type, notes, avatar_url, is_favorite, tags, country, city, created_at, updated_at").eq("id", profileId).single(),
      supabase.from("contact_interaction_notes").select("id, profile_id, interaction_type, interaction_date, note_text, mood_observed, topics_discussed, relationship_temperature, notable_changes").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(100),
      supabase.from("contact_life_milestones").select("id, profile_id, milestone_type, milestone_date, description, impact_score").eq("profile_id", profileId).limit(50),
      supabase.from("psychological_profiles").select("*").eq("profile_id", profileId).maybeSingle(),
      supabase.from("contact_observations").select("id, profile_id, observation_type, content, confidence, source, observed_at").eq("profile_id", profileId).limit(100),
      supabase.from("ai_analyses").select("*").eq("profile_id", profileId).in("analysis_type", ["behavioral_dna", "psychological", "manipulation_vulnerability"]).limit(10)
    ]);

    const contextData = {
      profile: profileResult.data,
      interactionNotes: interactionNotesResult.data || [],
      milestones: milestonesResult.data || [],
      psychProfile: psychProfileResult.data,
      observations: observationsResult.data || [],
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
          { role: "system", content: EXISTENTIAL_LEVERAGE_PROMPT },
          { 
            role: "user", 
            content: `Calculate existential leverage points for this subject:\n\n${JSON.stringify(contextData, null, 2)}`
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
      throw new Error("Failed to parse existential leverage analysis");
    }

    // Store the analysis
    await supabase.from("ai_analyses").insert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "existential_leverage",
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
          overallLeverage: analysis.overall_leverage_score,
          leverageTier: analysis.leverage_tier,
          exploitationWindows: analysis.exploitation_windows?.length || 0,
          leverageScripts: analysis.leverage_scripts?.length || 0,
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Existential leverage calculator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
