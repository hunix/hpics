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

  // Health check short-circuit via GET query param
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'mass-formation-analyzer', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { userId, populationSegment = 'network', analysisDepth = 'standard' } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch population sentiment and behavioral data
    const [profilesRes, sentimentRes, narrativesRes, groupsRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, job_title').eq('user_id', userId).limit(100),
      supabase.from('ai_analyses').select('*').eq('user_id', userId).eq('analysis_type', 'sentiment').order('generated_at', { ascending: false }).limit(50),
      supabase.from('semantic_warfare_campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('contact_groups').select('*').eq('user_id', userId),
    ]);

    const MASS_FORMATION_PROMPT = `You are a Mass Formation Psychosis analyst using Mattias Desmet's framework for detecting pre-totalitarian psychological conditions.

DESMET'S MASS FORMATION CONDITIONS:
1. FREE-FLOATING ANXIETY: Generalized anxiety without clear cause
2. SOCIAL ATOMIZATION: Lack of meaningful social bonds
3. MEANING DEFICIT: Sense of purposelessness and disconnection
4. FREE-FLOATING FRUSTRATION: Undirected aggression seeking outlet
5. FOCAL OBJECT EMERGENCE: Single issue absorbing all anxiety
6. HYPNOTIC FOCUS: Crowd becomes hypnotically fixated on narrative
7. TOTALITARIAN CRYSTALLIZATION: Mass becomes willing to sacrifice everything for focal object

POPULATION SEGMENT: ${populationSegment}
ANALYSIS DEPTH: ${analysisDepth}

NETWORK DATA:
Profiles: ${JSON.stringify(profilesRes.data?.slice(0, 40), null, 2)}
Sentiment Analysis: ${JSON.stringify(sentimentRes.data, null, 2)}
Narrative Campaigns: ${JSON.stringify(narrativesRes.data, null, 2)}
Group Structures: ${JSON.stringify(groupsRes.data, null, 2)}

Analyze for mass formation conditions. Return JSON:
{
  "massFormationIndicators": {
    "anxietyIndex": 0.0-1.0,
    "anxietySources": ["identifiable anxiety sources"],
    "freeFloatingPercentage": 0.0-1.0,
    "socialAtomizationScore": 0.0-1.0,
    "meaningDeficitScore": 0.0-1.0,
    "freeFloatingFrustration": 0.0-1.0
  },
  "focalObjectAnalysis": {
    "currentFocalObject": "issue/narrative capturing attention",
    "focalObjectStrength": 0.0-1.0,
    "competingObjects": ["other potential focal points"],
    "crystallizationProbability": 0.0-1.0
  },
  "tippingPointPrediction": {
    "probability": 0.0-1.0,
    "estimatedDate": "ISO date if applicable",
    "catalystEvents": ["events that could trigger tipping"],
    "preventionMethods": ["how to prevent mass formation"]
  },
  "hypnoticSusceptibility": {
    "populationScore": 0.0-1.0,
    "highlyHypnotizable": ["profile IDs most susceptible"],
    "resistant": ["profile IDs showing resistance"],
    "influencerPotential": ["who could lead the mass"]
  },
  "narrativeCrystallization": {
    "dominantNarrative": "the story gaining control",
    "crystallizationStage": "emerging|consolidating|dominant|totalitarian",
    "adherentCount": number,
    "zealotPercentage": 0.0-1.0,
    "counterNarrativeEffectiveness": {
      "current": 0.0-1.0,
      "potentialStrategies": ["what could counter the narrative"]
    }
  },
  "exploitationProtocol": {
    "accelerateMethods": ["how to speed up mass formation if desired"],
    "directMethods": ["how to steer the mass once formed"],
    "harvestMethods": ["how to benefit from the mass formation"]
  },
  "totalitarianPotential": 0.0-1.0
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
          { role: "system", content: MASS_FORMATION_PROMPT },
          { role: "user", content: `Analyze mass formation conditions in population segment: ${populationSegment}` }
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

    // Store mass formation indicators
    const indicators = analysis.massFormationIndicators || {};
    const focal = analysis.focalObjectAnalysis || {};
    const tipping = analysis.tippingPointPrediction || {};
    
    const { data: insertedIndicator } = await supabase.from('mass_formation_indicators').insert({
      user_id: userId,
      population_segment: populationSegment,
      anxiety_index: indicators.anxietyIndex || 0,
      social_atomization_score: indicators.socialAtomizationScore || 0,
      meaning_deficit_score: indicators.meaningDeficitScore || 0,
      free_floating_frustration: indicators.freeFloatingFrustration || 0,
      focal_object: focal.currentFocalObject,
      focal_object_strength: focal.focalObjectStrength || 0,
      tipping_point_probability: tipping.probability || 0,
      estimated_tipping_date: tipping.estimatedDate,
      hypnotic_susceptibility: analysis.hypnoticSusceptibility?.populationScore || 0,
    }).select().single();

    // Store narrative crystallization
    if (analysis.narrativeCrystallization && insertedIndicator) {
      const narr = analysis.narrativeCrystallization;
      await supabase.from('narrative_crystallization').insert({
        user_id: userId,
        mass_formation_id: insertedIndicator.id,
        narrative: narr.dominantNarrative || 'unknown',
        crystallization_stage: narr.crystallizationStage || 'emerging',
        adherent_count: narr.adherentCount || 0,
        zealot_percentage: narr.zealotPercentage || 0,
        totalitarian_potential: analysis.totalitarianPotential || 0,
        counter_narrative_effectiveness: narr.counterNarrativeEffectiveness || {},
      });
    }

    // Persist to ai_analyses for section enablement (use first profile or userId as profile_id)
    const primaryProfileId = profilesRes.data?.[0]?.id || userId;
    await supabase.from('ai_analyses').upsert({
      user_id: userId,
      profile_id: primaryProfileId,
      analysis_type: 'mass_formation',
      result: analysis,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    return new Response(JSON.stringify({
      success: true,
      populationSegment,
      massFormationAnalysis: analysis,
      tippingPointProbability: tipping.probability || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Mass formation analyzer error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
