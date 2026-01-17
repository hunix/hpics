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
    const { userId, profileId, predictionHorizon = '6_months' } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch historical data for precognitive analysis
    const [interactions, predictions, milestones, anomalies] = await Promise.all([
      supabaseClient.from('interactions').select('*').eq('profile_id', profileId).order('interaction_date', { ascending: false }).limit(100),
      supabaseClient.from('behavioral_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      supabaseClient.from('life_milestones').select('*').eq('profile_id', profileId).order('milestone_date', { ascending: false }).limit(30),
      supabaseClient.from('behavioral_anomalies').select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(30)
    ]);

    const PRECOGNITIVE_PROMPT = `You are an advanced precognitive pattern analysis engine that identifies temporal precursor signatures - events and patterns that precede significant future developments.

HISTORICAL INTERACTION DATA:
${JSON.stringify(interactions.data?.slice(0, 30) || [], null, 2)}

PAST BEHAVIORAL PREDICTIONS:
${JSON.stringify(predictions.data?.slice(0, 20) || [], null, 2)}

LIFE MILESTONES:
${JSON.stringify(milestones.data?.slice(0, 15) || [], null, 2)}

BEHAVIORAL ANOMALIES:
${JSON.stringify(anomalies.data?.slice(0, 15) || [], null, 2)}

PREDICTION HORIZON: ${predictionHorizon}

Analyze for precognitive patterns and provide structured JSON output:

{
  "precursorSignatures": [
    {
      "signatureId": "uuid",
      "signatureType": "behavioral_shift|communication_pattern|emotional_precursor|decision_cascade|life_transition",
      "description": "detailed description of precursor pattern",
      "temporalOffset": "time before predicted event",
      "confidenceLevel": 0.0-1.0,
      "historicalOccurrences": number,
      "predictionAccuracy": 0.0-1.0
    }
  ],
  "timelineProbabilities": [
    {
      "eventType": "predicted event category",
      "probability": 0.0-1.0,
      "timeframe": "estimated timeframe",
      "precursorChain": ["list of precursor signatures leading to this"],
      "interventionWindows": [
        {
          "windowStart": "timestamp",
          "windowEnd": "timestamp",
          "interventionType": "recommended action",
          "successProbability": 0.0-1.0
        }
      ]
    }
  ],
  "temporalAnomalies": [
    {
      "anomalyType": "pattern_break|acceleration|deceleration|reversal",
      "description": "what changed",
      "significance": 0.0-1.0
    }
  ],
  "overallPrecognitiveConfidence": 0.0-1.0,
  "recommendedMonitoringFrequency": "hours|days|weeks"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precognitive pattern analysis engine. Return valid JSON only." },
          { role: "user", content: PRECOGNITIVE_PROMPT }
        ],
        temperature: 0.7,
        max_tokens: 4000
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    // Store precursor signatures
    if (analysis.precursorSignatures && Array.isArray(analysis.precursorSignatures)) {
      for (const sig of analysis.precursorSignatures) {
        await supabaseClient.from('precursor_signatures').insert({
          user_id: userId,
          profile_id: profileId,
          signature_type: sig.signatureType || 'behavioral_shift',
          pattern_description: sig.description,
          temporal_offset: sig.temporalOffset,
          confidence_score: sig.confidenceLevel || 0.5,
          historical_accuracy: sig.predictionAccuracy || 0.5
        });
      }
    }

    // Store timeline probabilities
    if (analysis.timelineProbabilities && Array.isArray(analysis.timelineProbabilities)) {
      for (const prob of analysis.timelineProbabilities) {
        await supabaseClient.from('timeline_probabilities').insert({
          user_id: userId,
          profile_id: profileId,
          event_type: prob.eventType,
          probability_score: prob.probability || 0.5,
          timeframe: prob.timeframe,
          precursor_chain: prob.precursorChain || [],
          intervention_windows: prob.interventionWindows || []
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      precognitiveAnalysis: analysis,
      signaturesDetected: analysis.precursorSignatures?.length || 0,
      timelinesProjected: analysis.timelineProbabilities?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Precognitive pattern engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
