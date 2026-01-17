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
    const { userId, profileId, timeWindowDays = 30 } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindowDays);

    // Fetch events from multiple domains for synchronicity detection
    const [interactionsRes, milestonesRes, anomaliesRes, predictionsRes] = await Promise.all([
      supabase.from('interactions').select('*').eq('profile_id', profileId).gte('interaction_date', startDate.toISOString()).order('interaction_date', { ascending: false }),
      supabase.from('life_milestones').select('*').eq('profile_id', profileId).gte('occurred_at', startDate.toISOString()),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', profileId).gte('detected_at', startDate.toISOString()),
      supabase.from('behavioral_predictions').select('*').eq('profile_id', profileId).gte('created_at', startDate.toISOString()),
    ]);

    const SYNCHRONICITY_PROMPT = `You are a Synchronicity analyst detecting meaningful coincidences and acausal connecting principles.

JUNG'S SYNCHRONICITY FRAMEWORK:
1. MEANINGFUL COINCIDENCE: Events connected by meaning, not causation
2. ACAUSAL CONNECTING PRINCIPLE: Non-causal correlations between psychic and physical events  
3. ARCHETYPAL ACTIVATION: Synchronicities often accompany archetypal constellation
4. NUMINOUS TIMING: Moments of heightened meaning-potential
5. PARTICIPATION MYSTIQUE: When observer and observed become entangled

EVENTS FROM MULTIPLE DOMAINS (past ${timeWindowDays} days):
Interactions: ${JSON.stringify(interactionsRes.data, null, 2)}
Life Milestones: ${JSON.stringify(milestonesRes.data, null, 2)}
Behavioral Anomalies: ${JSON.stringify(anomaliesRes.data, null, 2)}
Predictions Made: ${JSON.stringify(predictionsRes.data, null, 2)}

Detect synchronistic patterns. Return JSON:
{
  "synchronisticEvents": [
    {
      "eventDescription": "description of meaningful coincidence",
      "involvedEvents": ["list of correlated events"],
      "meaningScore": 0.0-1.0,
      "acausalCorrelation": 0.0-1.0,
      "timingWindow": {
        "start": "ISO date",
        "end": "ISO date", 
        "peakMeaning": "ISO date of highest significance"
      },
      "themeArchetype": "what archetype is being activated",
      "exploitationPotential": 0.0-1.0
    }
  ],
  "coincidenceClusters": [
    {
      "clusterTheme": "overarching meaning theme",
      "events": ["event IDs in cluster"],
      "patternRecognitionScore": 0.0-1.0,
      "nextPredictedWindow": "ISO date when pattern may repeat"
    }
  ],
  "artificialSynchronicityProtocols": [
    {
      "desiredOutcome": "what you want to happen",
      "orchestrationSteps": ["seemingly unrelated events to arrange"],
      "timingOptimization": "when to execute for maximum meaning",
      "deniabilityScore": 0.0-1.0
    }
  ],
  "optimalInfluenceWindows": [
    {
      "windowStart": "ISO date",
      "windowEnd": "ISO date",
      "meaningPotential": 0.0-1.0,
      "recommendedAction": "what to do during this window",
      "synchronicityTrigger": "how to activate meaningful coincidence"
    }
  ]
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
          { role: "system", content: SYNCHRONICITY_PROMPT },
          { role: "user", content: `Analyze synchronicity patterns for profile ${profileId}` }
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

    // Store synchronistic events
    if (analysis.synchronisticEvents) {
      for (const event of analysis.synchronisticEvents) {
        await supabase.from('synchronistic_events').insert({
          user_id: userId,
          profile_id: profileId,
          event_description: event.eventDescription,
          meaning_score: event.meaningScore,
          acausal_correlation: event.acausalCorrelation,
          timing_window: event.timingWindow,
          exploitation_potential: event.exploitationPotential,
          optimal_intervention_time: event.timingWindow?.peakMeaning,
        });
      }
    }

    // Store coincidence clusters
    if (analysis.coincidenceClusters) {
      for (const cluster of analysis.coincidenceClusters) {
        await supabase.from('coincidence_clusters').insert({
          user_id: userId,
          cluster_name: `${cluster.clusterTheme}-${Date.now()}`,
          cluster_theme: cluster.clusterTheme,
          events: cluster.events,
          pattern_recognition_score: cluster.patternRecognitionScore,
          next_predicted_window: cluster.nextPredictedWindow,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      synchronicityAnalysis: analysis,
      eventsDetected: analysis.synchronisticEvents?.length || 0,
      clustersFound: analysis.coincidenceClusters?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Synchronicity engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
