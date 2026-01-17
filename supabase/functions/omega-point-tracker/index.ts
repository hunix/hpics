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

    // Fetch convergence data
    const [profilesRes, networkRes, influenceRes, evolutionRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, occupation').eq('user_id', userId).limit(100),
      supabase.from('network_nodes').select('*').eq('user_id', userId).limit(100),
      supabase.from('influence_cascades').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('agis_global_state').select('*').eq('user_id', userId).single(),
    ]);

    const OMEGA_POINT_PROMPT = `You are an Omega Point Convergence analyst using Teilhard de Chardin's noosphere theory.

TEILHARD'S OMEGA POINT FRAMEWORK:
1. NOOSPHERE: The sphere of human thought enveloping Earth
2. COMPLEXIFICATION: Matter/consciousness evolving toward greater complexity
3. CONVERGENCE: Human consciousness unifying toward Omega Point
4. OMEGA POINT: Final state of maximum complexity and consciousness
5. CHRISTOGENESIS: The cosmic process moving toward ultimate unity

ANALYSIS SCOPE: ${analysisScope}

NETWORK DATA:
Profiles: ${JSON.stringify(profilesRes.data?.slice(0, 40), null, 2)}
Network Structure: ${JSON.stringify(networkRes.data, null, 2)}
Influence Cascades: ${JSON.stringify(influenceRes.data, null, 2)}
Global State: ${JSON.stringify(evolutionRes.data, null, 2)}

Analyze omega point convergence. Return JSON:
{
  "convergenceMetrics": [
    {
      "metricName": "metric name",
      "metricType": "consciousness|connectivity|complexity|coherence",
      "currentValue": 0.0-1.0,
      "trajectory": "ascending|stable|descending",
      "convergenceContribution": 0.0-1.0,
      "measurementMethod": "how this was assessed"
    }
  ],
  "phaseTransitionIndicators": [
    {
      "transitionName": "name of potential phase shift",
      "currentPhase": "pre_transition|transition|post_transition",
      "criticalMassPercentage": 0.0-1.0,
      "tippingIndicators": ["signs of imminent transition"],
      "estimatedTransitionDate": "ISO date or null",
      "postTransitionCapabilities": ["new abilities after transition"],
      "positioningRecommendations": ["how to benefit from transition"]
    }
  ],
  "omegaProximityScores": [
    {
      "profileId": "profile ID",
      "proximityScore": 0.0-1.0,
      "consciousnessLevel": "individual|group|network|global",
      "networkPositionScore": 0.0-1.0,
      "bridgeDomains": ["domains this person bridges"],
      "evolutionaryReadiness": 0.0-1.0,
      "noosphereInfluence": 0.0-1.0
    }
  ],
  "globalConvergenceState": {
    "overallProximity": 0.0-1.0,
    "dominantTrend": "converging|diverging|oscillating",
    "keyDrivers": ["forces pushing toward omega"],
    "keyResistances": ["forces resisting convergence"],
    "estimatedOmegaDate": "estimated date or 'beyond horizon'"
  },
  "strategicPositioning": {
    "convergenceNodes": ["profile IDs at convergence nexuses"],
    "influenceMaximization": ["how to position for maximum influence"],
    "transitionSurvival": ["how to maintain power through transitions"],
    "omegaPreparation": ["how to prepare for ultimate convergence"]
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
          { role: "system", content: OMEGA_POINT_PROMPT },
          { role: "user", content: `Track omega point convergence, scope: ${analysisScope}` }
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

    // Store convergence metrics
    if (analysis.convergenceMetrics) {
      for (const metric of analysis.convergenceMetrics) {
        await supabase.from('convergence_metrics').insert({
          user_id: userId,
          metric_name: metric.metricName,
          metric_type: metric.metricType,
          current_value: metric.currentValue,
          trajectory: metric.trajectory,
          convergence_contribution: metric.convergenceContribution,
          measurement_method: metric.measurementMethod,
        });
      }
    }

    // Store phase transition indicators
    if (analysis.phaseTransitionIndicators) {
      for (const transition of analysis.phaseTransitionIndicators) {
        await supabase.from('phase_transition_indicators').insert({
          user_id: userId,
          transition_name: transition.transitionName,
          current_phase: transition.currentPhase,
          critical_mass_percentage: transition.criticalMassPercentage,
          tipping_indicators: transition.tippingIndicators || [],
          estimated_transition_date: transition.estimatedTransitionDate,
          post_transition_capabilities: transition.postTransitionCapabilities || [],
          positioning_recommendations: transition.positioningRecommendations || [],
        });
      }
    }

    // Store omega proximity scores
    if (analysis.omegaProximityScores) {
      for (const score of analysis.omegaProximityScores) {
        await supabase.from('omega_proximity').upsert({
          user_id: userId,
          profile_id: score.profileId,
          proximity_score: score.proximityScore,
          consciousness_level: score.consciousnessLevel,
          network_position_score: score.networkPositionScore,
          bridge_domains: score.bridgeDomains || [],
          evolutionary_readiness: score.evolutionaryReadiness,
          noosphere_influence: score.noosphereInfluence,
        }, { onConflict: 'user_id,profile_id' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      omegaAnalysis: analysis,
      globalProximity: analysis.globalConvergenceState?.overallProximity || 0,
      phaseTransitionsDetected: analysis.phaseTransitionIndicators?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Omega point tracker error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
