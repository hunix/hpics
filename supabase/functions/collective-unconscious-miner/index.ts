import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JUNGIAN_ARCHETYPES = [
  'Hero', 'Shadow', 'Anima', 'Animus', 'Self', 'Persona', 'Wise Old Man', 'Great Mother',
  'Trickster', 'Child', 'Maiden', 'Rebel', 'Lover', 'Creator', 'Ruler', 'Caregiver',
  'Sage', 'Innocent', 'Explorer', 'Magician', 'Jester', 'Everyman'
];

const HERO_JOURNEY_STAGES = [
  'ordinary_world', 'call_to_adventure', 'refusal_of_call', 'meeting_mentor',
  'crossing_threshold', 'tests_allies_enemies', 'approach_innermost_cave',
  'ordeal', 'reward', 'road_back', 'resurrection', 'return_with_elixir'
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, profileId, depth = 'standard' } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch all communications and behavioral data
    const [profileRes, notesRes, interactionsRes, psychRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('notes').select('content, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabase.from('interactions').select('*').eq('profile_id', profileId).order('interaction_date', { ascending: false }).limit(50),
      supabase.from('psychology_assessments').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
    ]);

    const COLLECTIVE_UNCONSCIOUS_PROMPT = `You are a Jungian depth psychology analyst mining the Collective Unconscious layer of the psyche.

JUNGIAN FRAMEWORK:
1. ARCHETYPES: Universal patterns inherited in the collective unconscious
   - Primary: ${JUNGIAN_ARCHETYPES.join(', ')}
2. SHADOW: Repressed aspects of personality projected onto others
3. ANIMA/ANIMUS: Contrasexual soul image driving unconscious attractions
4. PERSONAL MYTH: The archetypal story pattern an individual lives by
5. HERO'S JOURNEY STAGES: ${HERO_JOURNEY_STAGES.join(', ')}

TARGET PROFILE:
${JSON.stringify(profileRes.data, null, 2)}

COMMUNICATIONS (for symbolic content):
${JSON.stringify(notesRes.data?.slice(0, 50), null, 2)}

INTERACTIONS (behavioral patterns):
${JSON.stringify(interactionsRes.data?.slice(0, 30), null, 2)}

PSYCHOLOGICAL ASSESSMENTS:
${JSON.stringify(psychRes.data, null, 2)}

ANALYSIS DEPTH: ${depth}

Extract Jungian symbolic content. Return JSON:
{
  "dominantArchetypes": [
    {
      "archetype": "archetype name",
      "activationStrength": 0.0-1.0,
      "manifestations": ["specific behaviors/statements showing this archetype"],
      "shadowAspect": "how this archetype's shadow manifests"
    }
  ],
  "shadowProjections": [
    {
      "projectedTrait": "what they project onto others",
      "projectionIntensity": 0.0-1.0,
      "likelyTargets": ["types of people they project onto"],
      "integrationPotential": 0.0-1.0,
      "exploitationVector": "how to use this projection"
    }
  ],
  "animaAnimusDynamic": {
    "type": "anima|animus",
    "developmentLevel": "primitive|differentiated|integrated",
    "idealization": "what they seek in partners/idols",
    "projectionPatterns": ["how this manifests in relationships"],
    "vulnerabilities": ["how to exploit this dynamic"]
  },
  "personalMyth": {
    "mythicPattern": "the archetypal story they're living",
    "currentStage": "hero's journey stage",
    "protagonistRole": "their role in their story",
    "antagonistProjection": "who/what plays villain",
    "questObject": "what they're seeking",
    "fatalFlaw": "tragic weakness in their narrative"
  },
  "unconsciousDrivers": [
    {
      "driver": "unconscious motivation",
      "strength": 0.0-1.0,
      "triggerSymbols": ["symbols that activate this"],
      "manipulationProtocol": "how to leverage this"
    }
  ],
  "symbolicVulnerabilities": {
    "powerSymbols": ["symbols they respond to with power/authority"],
    "nurturingSymbols": ["symbols triggering care/trust"],
    "fearSymbols": ["symbols activating anxiety/avoidance"],
    "desireSymbols": ["symbols activating longing/attraction"]
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
          { role: "system", content: COLLECTIVE_UNCONSCIOUS_PROMPT },
          { role: "user", content: `Mine collective unconscious patterns for profile ${profileId}` }
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

    // Store archetypal activations
    if (analysis.dominantArchetypes) {
      for (const archetype of analysis.dominantArchetypes) {
        await supabase.from('archetypal_activations').insert({
          user_id: userId,
          profile_id: profileId,
          archetype: archetype.archetype,
          activation_strength: archetype.activationStrength,
          shadow_projection: { aspect: archetype.shadowAspect },
          anima_animus_dynamic: analysis.animaAnimusDynamic || {},
          personal_myth: analysis.personalMyth?.mythicPattern,
          myth_stage: analysis.personalMyth?.currentStage || 'ordinary_world',
          unconscious_drivers: analysis.unconsciousDrivers || [],
        });
      }
    }

    // Store shadow projections
    if (analysis.shadowProjections) {
      for (const projection of analysis.shadowProjections) {
        await supabase.from('shadow_projections').insert({
          user_id: userId,
          source_profile_id: profileId,
          projected_trait: projection.projectedTrait,
          projection_intensity: projection.projectionIntensity,
          integration_potential: projection.integrationPotential,
          exploitation_vectors: [{ vector: projection.exploitationVector }],
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      jungianAnalysis: analysis,
      archetypesDetected: analysis.dominantArchetypes?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Collective unconscious miner error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
