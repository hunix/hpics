import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI, parseAIJson, selectModel } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": (Deno.env.get("CORS_ALLOWED_ORIGIN") ?? "*"),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { observationId, profileId, category, observation, contactName } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate JWT
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing AI analyses for this contact
    const [behavioralRes, facialRes, bodyRes, vocalRes] = await Promise.all([
      supabase.from("behavioral_analyses").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(3),
      supabase.from("facial_analyses").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(3),
      supabase.from("body_language_analyses").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(3),
      supabase.from("vocal_analyses").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }).limit(3),
    ]);

    const existingAnalyses = {
      behavioral: behavioralRes.data || [],
      facial: facialRes.data || [],
      body_language: bodyRes.data || [],
      vocal: vocalRes.data || [],
    };

    // Also fetch contact interests and communications for context
    const [interestsRes, commsRes] = await Promise.all([
      supabase.from("contact_interests").select("*").eq("profile_id", profileId).limit(20),
      supabase.from("communications").select("*").eq("profile_id", profileId).order("occurred_at", { ascending: false }).limit(10),
    ]);

    const categoryDescriptions: Record<string, string> = {
      personality: "Big Five personality traits (openness, conscientiousness, extraversion, agreeableness, neuroticism), values, motivations",
      communication: "Communication style, responsiveness, preferred channels, expression patterns, listening skills",
      behavioral: "Behavioral patterns, habits, reactions, decision-making tendencies, stress responses",
      professional: "Work ethic, leadership style, collaboration approach, expertise areas, professional demeanor",
    };

    const systemPrompt = `You are an expert behavioral analyst and psychologist. Your task is to validate a user's personal observation about a contact by comparing it against existing AI analyses and interaction data.

Be scientific and evidence-based. Look for:
1. Supporting evidence from existing analyses that aligns with the observation
2. Challenging evidence that contradicts the observation
3. Gaps in data that make validation difficult

Category focus: ${categoryDescriptions[category] || category}

Respond with a JSON object (no markdown):
{
  "validation_status": "validated" | "challenged" | "inconclusive",
  "confidence_score": 0.0-1.0,
  "summary": "2-3 sentence summary of the validation result",
  "supporting_evidence": ["evidence point 1", "evidence point 2"],
  "challenging_evidence": ["counter point 1"],
  "recommendation": "What the user should look for to confirm/refute this observation"
}`;

    const userPrompt = `Contact: ${contactName}

USER'S OBSERVATION (Category: ${category}):
"${observation}"

EXISTING AI ANALYSES:
${JSON.stringify(existingAnalyses, null, 2)}

COMMUNICATION HISTORY SUMMARY:
${JSON.stringify(commsRes.data?.map(c => ({ channel: c.channel, sentiment: c.sentiment_score, date: c.occurred_at })) || [], null, 2)}

KNOWN INTERESTS:
${JSON.stringify(interestsRes.data?.map(i => i.name) || [], null, 2)}

Validate this observation against the available data. Be thorough but concise.`;

    // Use unified AI client
    const aiResponse = await callAI({
      model: selectModel("balanced"),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      userId,
      functionName: "validate-observation",
      profileId,
      temperature: 0.3,
      metadata: { category, observationLength: observation?.length || 0 },
    });

    const validationResult = parseAIJson(aiResponse.content, {
      validation_status: "inconclusive",
      confidence_score: 0.5,
      summary: "Unable to parse AI response. Please try again.",
      supporting_evidence: [],
      challenging_evidence: [],
      recommendation: "Try providing more specific observations.",
    }) as any;

    // Update the observation with validation results
    const { error: updateError } = await supabase
      .from("contact_observations")
      .update({
        ai_validation_status: validationResult.validation_status,
        ai_confidence_score: validationResult.confidence_score,
        ai_validation_result: {
          summary: validationResult.summary,
          supporting_evidence: validationResult.supporting_evidence,
          challenging_evidence: validationResult.challenging_evidence,
          recommendation: validationResult.recommendation,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", observationId);

    if (updateError) {
      console.error("Failed to update observation:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true, result: validationResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("validate-observation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
