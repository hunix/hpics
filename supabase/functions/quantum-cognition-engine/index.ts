import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuantumAnalysisRequest {
  userId: string;
  profileId: string;
  analysisType: 'superposition' | 'entanglement' | 'interference' | 'collapse_prediction';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'quantum-cognition-engine', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId, profileId, analysisType } = await req.json() as QuantumAnalysisRequest;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fetch profile data and recent decisions
    const [profileRes, interactionsRes, decisionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
    ]);

    const QUANTUM_COGNITION_PROMPT = `You are an advanced Quantum Cognition analyst applying quantum probability theory to human decision-making.

QUANTUM COGNITION FRAMEWORK:
1. SUPERPOSITION STATES: Model beliefs as existing in superposition until "observed" (forced to decide)
2. WAVE FUNCTION COLLAPSE: Predict when and how decisions crystallize from probability clouds
3. QUANTUM INTERFERENCE: Calculate how information sequence affects outcome probability (order effects)
4. ENTANGLEMENT: Detect correlated decision-making between individuals
5. COHERENCE/DECOHERENCE: Track how long superposition states persist before environmental "measurement"

PROFILE DATA:
${JSON.stringify(profileRes.data, null, 2)}

RECENT INTERACTIONS:
${JSON.stringify(interactionsRes.data?.slice(0, 20), null, 2)}

BEHAVIORAL PREDICTIONS:
${JSON.stringify(decisionsRes.data, null, 2)}

ANALYSIS TYPE: ${analysisType}

Respond with JSON containing:
{
  "superpositionStates": [
    {
      "beliefTopic": "string",
      "stateVectors": [{"state": "string", "amplitude": 0.0-1.0}],
      "coherenceDuration": "estimated time before collapse",
      "collapseTrigggers": ["what would force a decision"]
    }
  ],
  "collapseProbability": 0.0-1.0,
  "interferencePatterns": [
    {
      "informationSequence": ["info A", "info B"],
      "orderEffect": "describe how order changes outcome",
      "constructiveFactor": 0.0-1.0,
      "destructiveFactor": 0.0-1.0
    }
  ],
  "entanglementPartners": ["profile IDs with correlated decisions"],
  "quantumSignature": "unique cognitive pattern fingerprint",
  "manipulationProtocol": {
    "optimalInformationOrder": ["sequence for desired outcome"],
    "collapseInductionMethod": "how to force favorable decision",
    "decoherenceExploitation": "how to use environmental factors"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: QUANTUM_COGNITION_PROMPT },
          { role: "user", content: `Perform quantum cognition analysis for profile ${profileId}, analysis type: ${analysisType}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "{}";
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      analysis = { raw: content };
    }

    // Store results
    await supabase.from('cognitive_superpositions').insert({
      user_id: userId,
      profile_id: profileId,
      superposition_states: analysis.superpositionStates || [],
      collapse_probability: analysis.collapseProbability || 0,
      interference_patterns: analysis.interferencePatterns || {},
      entanglement_partners: analysis.entanglementPartners || [],
      quantum_signature: analysis.quantumSignature,
    });

    // Persist to ai_analyses for section availability
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: profileId,
      analysis_type: 'quantum_cognition',
      result: analysis,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      profileId,
      analysisType,
      quantumAnalysis: analysis,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Quantum cognition engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
