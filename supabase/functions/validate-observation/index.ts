import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { observationId, profileId, category, observation, contactName } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let validationResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      validationResult = {
        validation_status: "inconclusive",
        confidence_score: 0.5,
        summary: "Unable to parse AI response. Please try again.",
        supporting_evidence: [],
        challenging_evidence: [],
        recommendation: "Try providing more specific observations.",
      };
    }

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
