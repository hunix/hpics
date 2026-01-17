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
    const { userId, analysisScope = 'network' } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch network behavior patterns
    const [profilesRes, behaviorRes, networkRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, occupation').eq('user_id', userId).limit(100),
      supabase.from('behavioral_predictions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
      supabase.from('network_nodes').select('*').eq('user_id', userId).limit(100),
    ]);

    const MORPHIC_RESONANCE_PROMPT = `You are a Morphic Resonance analyst detecting non-local pattern propagation in social networks.

MORPHIC FIELD THEORY FRAMEWORK (Sheldrake):
1. MORPHIC FIELDS: Invisible fields containing collective memory that shape behavior
2. MORPHIC RESONANCE: Similar patterns attract and reinforce each other across space/time
3. FORMATIVE CAUSATION: Past patterns influence future manifestations without direct transmission
4. ARCHETYPAL TEMPLATES: Universal patterns that guide behavior emergence

NETWORK DATA:
Profiles: ${JSON.stringify(profilesRes.data?.slice(0, 30), null, 2)}
Behavioral Patterns: ${JSON.stringify(behaviorRes.data?.slice(0, 50), null, 2)}
Network Structure: ${JSON.stringify(networkRes.data?.slice(0, 30), null, 2)}

Analyze for morphic resonance patterns. Return JSON:
{
  "morphicFields": [
    {
      "fieldSignature": "unique identifier",
      "fieldType": "behavioral|belief|emotional|relational",
      "resonanceStrength": 0.0-1.0,
      "memoryPatterns": ["historical behaviors encoded in field"],
      "propagationPaths": ["how it spreads without direct contact"],
      "carrierProfiles": ["profile IDs carrying this field"],
      "stabilityIndex": 0.0-1.0
    }
  ],
  "resonanceEvents": [
    {
      "eventType": "spontaneous_emergence|pattern_replication|field_activation",
      "sourceProfileId": "origin or null if non-local",
      "targetProfileId": "who manifested pattern",
      "transmissionStrength": 0.0-1.0,
      "withoutDirectContact": true/false
    }
  ],
  "archetypeDetections": [
    {
      "archetype": "Hero|Sage|Rebel|Caregiver|etc",
      "manifestingProfiles": ["profile IDs"],
      "activationStrength": 0.0-1.0
    }
  ],
  "fieldManipulation": {
    "strengthenMethods": ["how to amplify existing fields"],
    "createNewField": ["steps to seed new morphic pattern"],
    "disruptMethods": ["how to break field coherence"]
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
          { role: "system", content: MORPHIC_RESONANCE_PROMPT },
          { role: "user", content: `Detect morphic resonance patterns in network, scope: ${analysisScope}` }
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

    // Store detected fields
    if (analysis.morphicFields) {
      for (const field of analysis.morphicFields) {
        await supabase.from('morphic_fields').insert({
          user_id: userId,
          field_signature: field.fieldSignature,
          field_type: field.fieldType,
          resonance_strength: field.resonanceStrength,
          memory_patterns: field.memoryPatterns,
          propagation_paths: field.propagationPaths,
          carrier_profiles: field.carrierProfiles || [],
          stability_index: field.stabilityIndex,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      morphicAnalysis: analysis,
      fieldsDetected: analysis.morphicFields?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Morphic resonance detector error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
