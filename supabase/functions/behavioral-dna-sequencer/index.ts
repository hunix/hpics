import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BehavioralDNARequest {
  profileId: string;
  userId: string;
}

const BEHAVIORAL_DNA_PROMPT = `You are an elite behavioral scientist and psychological profiler. Create a comprehensive "Behavioral DNA" profile that captures the complete behavioral fingerprint of the individual.

Extract 50+ behavioral traits across multiple dimensions and identify micro-patterns that predict future behavior.

Return a JSON object with this EXACT structure:
{
  "behavioral_genome": {
    "core_traits": [
      {
        "trait": "trait name",
        "category": "personality" | "cognitive" | "social" | "emotional" | "motivational",
        "strength": 0-100,
        "consistency": 0-100,
        "evidence": ["specific evidence"],
        "expression_contexts": ["when this shows"]
      }
    ],
    "trait_clusters": [
      {
        "cluster_name": "name",
        "traits": ["trait names"],
        "dominant_pattern": "description",
        "prediction_accuracy": 0-100
      }
    ]
  },
  "decision_architecture": {
    "primary_archetype": "rational" | "intuitive" | "emotional" | "social" | "risk_seeking" | "risk_averse",
    "secondary_archetype": "string",
    "decision_speed": "impulsive" | "quick" | "moderate" | "deliberate" | "paralyzed",
    "information_needs": "minimal" | "moderate" | "comprehensive" | "exhaustive",
    "regret_sensitivity": 0-100,
    "sunk_cost_vulnerability": 0-100,
    "decision_fatigue_threshold": "low" | "medium" | "high"
  },
  "risk_tolerance_matrix": {
    "overall_tolerance": 0-100,
    "financial_risk": 0-100,
    "social_risk": 0-100,
    "career_risk": 0-100,
    "physical_risk": 0-100,
    "emotional_risk": 0-100,
    "context_sensitivity": "description of how context affects risk taking"
  },
  "habit_ecosystem": {
    "habit_loops": [
      {
        "cue": "trigger",
        "routine": "behavior",
        "reward": "payoff",
        "strength": 0-100,
        "changeability": 0-100
      }
    ],
    "keystone_habits": ["habits that influence others"],
    "habit_formation_speed": "slow" | "moderate" | "fast",
    "habit_adherence": 0-100
  },
  "behavioral_tells": {
    "deception_tells": [
      {
        "tell": "specific behavior",
        "reliability": 0-100,
        "context": "when it appears"
      }
    ],
    "stress_tells": [
      {
        "tell": "specific behavior",
        "reliability": 0-100,
        "intensity_indicator": true | false
      }
    ],
    "excitement_tells": [
      {
        "tell": "specific behavior",
        "reliability": 0-100
      }
    ],
    "discomfort_tells": [
      {
        "tell": "specific behavior",
        "reliability": 0-100
      }
    ]
  },
  "micro_patterns": {
    "communication_timing": {
      "peak_response_hours": ["hours"],
      "response_latency_baseline": "description",
      "urgency_indicators": ["what indicates urgency"],
      "avoidance_signals": ["what indicates avoidance"]
    },
    "linguistic_fingerprint": {
      "vocabulary_tier": "basic" | "moderate" | "sophisticated" | "elite",
      "sentence_complexity": "simple" | "moderate" | "complex",
      "emotional_expression": "reserved" | "moderate" | "expressive",
      "signature_phrases": ["frequently used phrases"],
      "hedge_words_frequency": "low" | "moderate" | "high"
    },
    "behavioral_rhythms": {
      "energy_cycles": "description",
      "productivity_patterns": "description",
      "social_energy_management": "description"
    }
  },
  "behavioral_consistency_matrix": {
    "overall_consistency": 0-100,
    "context_variance": [
      {
        "context": "situation type",
        "behavior_shift": "how behavior changes",
        "reliability": 0-100
      }
    ],
    "mask_detection": {
      "social_masking_level": 0-100,
      "authentic_contexts": ["where they're most real"],
      "performance_contexts": ["where they perform"]
    }
  },
  "prediction_models": {
    "response_predictions": [
      {
        "scenario": "situation description",
        "predicted_response": "likely behavior",
        "confidence": 0-100,
        "alternative_responses": ["other possibilities"]
      }
    ],
    "trigger_response_map": [
      {
        "trigger": "specific trigger",
        "likely_response": "predicted behavior",
        "escalation_path": "if trigger intensifies",
        "de_escalation_approach": "how to calm"
      }
    ]
  },
  "manipulation_vulnerability": {
    "overall_vulnerability": 0-100,
    "effective_vectors": [
      {
        "vector": "manipulation approach",
        "effectiveness": 0-100,
        "defense_awareness": 0-100
      }
    ],
    "resistant_to": ["approaches that don't work"],
    "cognitive_biases": [
      {
        "bias": "bias name",
        "strength": 0-100,
        "exploitation_method": "how to leverage"
      }
    ]
  },
  "behavioral_evolution": {
    "recent_changes": ["observed behavioral changes"],
    "stability_indicators": ["signs of stable patterns"],
    "growth_trajectory": "description",
    "predicted_future_patterns": ["where behavior is heading"]
  },
  "confidence_score": 0.0-1.0,
  "sample_size_adequacy": "low" | "medium" | "high",
  "data_recency": "fresh" | "moderate" | "stale"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit via GET query param - before any auth/body parsing
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'behavioral-dna-sequencer', timestamp: Date.now() }), {
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
    const token = authHeader?.replace("Bearer ", "");
    const isServiceRoleCall = token === supabaseKey;
    
    const body = await req.json();
    
    // Normalize parameter names (support both camelCase and snake_case)
    const profileId = body.profileId || body.profile_id;
    let userId = body.userId || body.user_id;
    
    // For non-service-role calls, validate user token
    if (!isServiceRoleCall && authHeader && token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    if (!profileId || !userId) {
      return new Response(
        JSON.stringify({ error: "profileId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Gather extensive behavioral data + NEW: biometric signals for v5.0
    const [
      profileResult,
      messagesResult,
      observationsResult,
      behavioralResult,
      voiceInsightsResult,
      mediaAnalysesResult,
      interactionsResult,
      biometricsResult // v5.0: HRV, stress, heart rate data
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", profileId).single(),
      supabase.from("messages").select("*, conversations!inner(profile_id)").eq("conversations.profile_id", profileId).order("created_at", { ascending: false }).limit(500),
      supabase.from("contact_observations").select("*").eq("profile_id", profileId).limit(200),
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId).limit(20),
      supabase.from("voice_insights").select("*").eq("profile_id", profileId).limit(50),
      supabase.from("media_analyses").select("*").eq("profile_id", profileId).limit(100),
      supabase.from("contact_interaction_notes").select("id, profile_id, interaction_type, interaction_date, note_text, mood_observed, topics_discussed, relationship_temperature").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(200),
      // v5.0: Fetch biometric data (HRV, stress levels, heart rate)
      supabase.from("interaction_biometrics").select("*").eq("profile_id", profileId).order("recorded_at", { ascending: false }).limit(100)
    ]);

    // v5.0: Extract biometric behavioral signals
    const biometrics = biometricsResult.data || [];
    const biometricSignals = biometrics.length > 0 ? {
      avgHeartRate: biometrics.reduce((acc: number, b: any) => acc + (b.heart_rate_bpm || 0), 0) / biometrics.length,
      avgHRV: biometrics.reduce((acc: number, b: any) => acc + (b.hrv_ms || 0), 0) / biometrics.length,
      avgStress: biometrics.reduce((acc: number, b: any) => acc + (b.stress_level || 0), 0) / biometrics.length,
      stressTrend: biometrics.slice(0, 10).map((b: any) => ({ stress: b.stress_level, at: b.recorded_at })),
      peakStressMoments: biometrics.filter((b: any) => b.stress_level > 70).length,
      totalRecordings: biometrics.length
    } : null;

    const contextData = {
      profile: profileResult.data,
      messages: messagesResult.data || [],
      observations: observationsResult.data || [],
      behavioral: behavioralResult.data || [],
      voiceInsights: voiceInsightsResult.data || [],
      mediaAnalyses: mediaAnalysesResult.data || [],
      interactions: interactionsResult.data || [],
      // v5.0: Include biometric behavioral signals
      biometricBehavioralSignals: biometricSignals,
      dataStats: {
        messageCount: (messagesResult.data || []).length,
        observationCount: (observationsResult.data || []).length,
        interactionCount: (interactionsResult.data || []).length,
        biometricCount: biometrics.length
      }
    };

    // Get AI config from platform settings
    const aiConfig = await getAIConfig(supabase, userId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig.defaultModel,
        messages: [
          { role: "system", content: BEHAVIORAL_DNA_PROMPT },
          { 
            role: "user", 
            content: `Perform comprehensive Behavioral DNA sequencing on the following data:\n\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: aiConfig.temperature,
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
      throw new Error("Failed to parse behavioral DNA analysis");
    }

    // Store the analysis using upsert for idempotency
    await supabase.from("ai_analyses").upsert({
      profile_id: profileId,
      user_id: userId,
      analysis_type: "behavioral_dna",
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
          traitCount: analysis.behavioral_genome?.core_traits?.length || 0,
          sampleSizeAdequacy: analysis.sample_size_adequacy || 'medium',
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Behavioral DNA sequencing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
