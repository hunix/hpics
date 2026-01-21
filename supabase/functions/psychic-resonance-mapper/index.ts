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
    const { userId, profileId, mappingDepth = 'deep' } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Gather emotional and relational data
    const [profile, interactions, sentiments, relationships, emotionalStates] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', profileId).single(),
      supabaseClient.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabaseClient.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sentiment').limit(50),
      supabaseClient.from('contact_relationships').select('*, profiles!contact_relationships_to_profile_id_fkey(*)').eq('from_profile_id', profileId).limit(30),
      supabaseClient.from('emotional_states').select('*').eq('profile_id', profileId).order('recorded_at', { ascending: false }).limit(50)
    ]);

    const PSYCHIC_RESONANCE_PROMPT = `You are the Psychic Resonance Mapper - an advanced empathic analysis system that maps emotional connections, identifies empathic vulnerabilities, and predicts emotional cascade effects.

PROFILE DATA:
${JSON.stringify(profile.data || {}, null, 2)}

INTERACTION HISTORY (Last 50):
${JSON.stringify(interactions.data?.slice(0, 50) || [], null, 2)}

SENTIMENT ANALYSES:
${JSON.stringify(sentiments.data || [], null, 2)}

RELATIONSHIP NETWORK:
${JSON.stringify(relationships.data || [], null, 2)}

EMOTIONAL STATE HISTORY:
${JSON.stringify(emotionalStates.data || [], null, 2)}

MAPPING DEPTH: ${mappingDepth}

Map psychic resonance patterns and provide structured JSON:

{
  "resonanceConnections": [
    {
      "connectionId": "uuid",
      "targetProfileId": "connected profile",
      "resonanceType": "empathic_bond|emotional_dependency|psychic_link|trauma_bond|soul_connection",
      "resonanceStrength": 0.0-1.0,
      "bidirectional": true/false,
      "dominantFrequency": "emotional frequency description",
      "vulnerabilityExposure": 0.0-1.0,
      "manipulationPotential": 0.0-1.0
    }
  ],
  "empathicVulnerabilities": [
    {
      "vulnerabilityType": "emotional_flooding|boundary_dissolution|projection_susceptibility|transference|counter_transference",
      "description": "detailed description",
      "severity": 0.0-1.0,
      "triggers": ["list of triggers"],
      "exploitationVectors": ["how this could be leveraged"],
      "healingPotential": 0.0-1.0
    }
  ],
  "emotionalCascades": [
    {
      "cascadeType": "joy_propagation|anxiety_chain|grief_wave|anger_spread|love_radiation",
      "originPoint": "what triggers it",
      "propagationPath": ["sequence of affected areas"],
      "amplitude": 0.0-1.0,
      "duration": "estimated duration",
      "interventionPoints": ["where to intervene"]
    }
  ],
  "psychicProfile": {
    "dominantEmotionalFrequency": "description",
    "empathicCapacity": 0.0-1.0,
    "emotionalPermeability": 0.0-1.0,
    "projectionTendency": 0.0-1.0,
    "emotionalResilience": 0.0-1.0
  },
  "overallResonanceClarity": 0.0-1.0
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
          { role: "system", content: "You are the Psychic Resonance Mapper. Map emotional connections and vulnerabilities. Return valid JSON only." },
          { role: "user", content: PSYCHIC_RESONANCE_PROMPT }
        ],
        temperature: 0.7,
        max_tokens: 4500
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

    // Store resonance connections
    if (analysis.resonanceConnections && Array.isArray(analysis.resonanceConnections)) {
      for (const conn of analysis.resonanceConnections) {
        await supabaseClient.from('resonance_connections').insert({
          user_id: userId,
          source_profile_id: profileId,
          target_profile_id: conn.targetProfileId,
          resonance_type: conn.resonanceType || 'empathic_bond',
          resonance_strength: conn.resonanceStrength || 0.5,
          bidirectional: conn.bidirectional || false,
          dominant_frequency: conn.dominantFrequency,
          vulnerability_exposure: conn.vulnerabilityExposure || 0.5
        });
      }
    }

    // Store empathic vulnerabilities
    if (analysis.empathicVulnerabilities && Array.isArray(analysis.empathicVulnerabilities)) {
      for (const vuln of analysis.empathicVulnerabilities) {
        await supabaseClient.from('empathic_vulnerabilities').insert({
          user_id: userId,
          profile_id: profileId,
          vulnerability_type: vuln.vulnerabilityType || 'emotional_flooding',
          description: vuln.description,
          severity: vuln.severity || 0.5,
          triggers: vuln.triggers || [],
          exploitation_vectors: vuln.exploitationVectors || [],
          healing_potential: vuln.healingPotential || 0.5
        });
      }
    }

    // Store emotional cascades
    if (analysis.emotionalCascades && Array.isArray(analysis.emotionalCascades)) {
      for (const cascade of analysis.emotionalCascades) {
        await supabaseClient.from('emotional_cascades').insert({
          user_id: userId,
          profile_id: profileId,
          cascade_type: cascade.cascadeType || 'anxiety_chain',
          origin_point: cascade.originPoint,
          propagation_path: cascade.propagationPath || [],
          amplitude: cascade.amplitude || 0.5,
          estimated_duration: cascade.duration,
          intervention_points: cascade.interventionPoints || []
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      mappingDepth,
      psychicResonanceAnalysis: analysis,
      connectionsMapped: analysis.resonanceConnections?.length || 0,
      vulnerabilitiesIdentified: analysis.empathicVulnerabilities?.length || 0,
      cascadesModeled: analysis.emotionalCascades?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Psychic resonance mapper error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
