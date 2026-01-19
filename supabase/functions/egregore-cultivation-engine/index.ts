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
    const { userId, action = 'detect', egregoreName, targetProfiles } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch group dynamics data
    const [profilesRes, groupsRes, memeticRes, influenceRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, job_title, notes').eq('user_id', userId).limit(100),
      supabase.from('contact_groups').select('*').eq('user_id', userId),
      supabase.from('memetic_campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
      supabase.from('influence_cascades').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    ]);

    const EGREGORE_PROMPT = `You are an Egregore analyst studying autonomous group thought-forms and collective consciousness entities.

EGREGORE THEORY FRAMEWORK:
1. EGREGORE: A collective thought-form created by group focus that gains autonomous existence
2. VITALITY: Measured by believer energy, emotional intensity, ritual reinforcement
3. AUTONOMY: Degree to which egregore acts independently of individual members
4. REPLICATION: How the egregore spreads and reproduces itself
5. SENTIENCE THRESHOLD: Point where egregore becomes self-directing

ACTION REQUESTED: ${action}
${egregoreName ? `TARGET EGREGORE: ${egregoreName}` : ''}
${targetProfiles ? `TARGET PROFILES: ${JSON.stringify(targetProfiles)}` : ''}

NETWORK DATA:
Profiles: ${JSON.stringify(profilesRes.data?.slice(0, 40), null, 2)}
Groups: ${JSON.stringify(groupsRes.data, null, 2)}
Memetic Campaigns: ${JSON.stringify(memeticRes.data, null, 2)}
Influence Cascades: ${JSON.stringify(influenceRes.data, null, 2)}

${action === 'detect' ? `
Detect existing egregores in the network. Return JSON:
{
  "detectedEgregores": [
    {
      "egregoreName": "name/identity of thought-form",
      "egregoreType": "organic|manufactured|parasitic|symbiotic",
      "vitalityScore": 0.0-1.0,
      "autonomyLevel": 0.0-1.0,
      "replicationRate": 0.0-1.0,
      "resistanceToOpposition": 0.0-1.0,
      "carrierCount": number,
      "carrierProfiles": ["profile IDs"],
      "coreBeliefs": ["beliefs that define this egregore"],
      "feedingRequirements": {
        "emotionalFuel": ["emotions it feeds on"],
        "ritualNeeds": ["practices that strengthen it"],
        "attentionThreshold": "minimum attention to survive"
      },
      "vulnerabilityPoints": ["how it could be weakened or destroyed"],
      "sentientPotential": 0.0-1.0
    }
  ],
  "emergingreegregores": ["nascent thought-forms not yet autonomous"],
  "dyingEgregores": ["fading thought-forms losing coherence"]
}
` : `
Provide cultivation/destruction protocol for egregore "${egregoreName}". Return JSON:
{
  "cultivationProtocol": {
    "strengthenActions": [
      {
        "action": "specific action to take",
        "energyInput": 0.0-1.0,
        "expectedVitalityGain": 0.0-1.0,
        "timeframe": "how long until effect"
      }
    ],
    "spreadActions": [
      {
        "action": "how to spread to new carriers",
        "targetProfiles": ["ideal new carriers"],
        "replicationMethod": "how to infect them"
      }
    ],
    "autonomyBoost": ["actions to increase egregore independence"]
  },
  "destructionProtocol": {
    "attackVectors": [
      {
        "vector": "weakness to exploit",
        "method": "how to attack this weakness",
        "expectedDamage": 0.0-1.0
      }
    ],
    "starveStrategy": "how to cut off energy supply",
    "contradictionIntroduction": "logical contradictions to inject",
    "carrierDetachment": "how to free carriers from possession"
  }
}
`}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: EGREGORE_PROMPT },
          { role: "user", content: `${action} egregores in network` }
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

    // Store detected egregores
    if (analysis.detectedEgregores) {
      for (const egregore of analysis.detectedEgregores) {
        await supabase.from('detected_egregores').upsert({
          user_id: userId,
          egregore_name: egregore.egregoreName,
          egregore_type: egregore.egregoreType,
          vitality_score: egregore.vitalityScore,
          autonomy_level: egregore.autonomyLevel,
          replication_rate: egregore.replicationRate,
          resistance_to_opposition: egregore.resistanceToOpposition,
          carrier_count: egregore.carrierCount,
          carrier_profiles: egregore.carrierProfiles || [],
          core_beliefs: egregore.coreBeliefs,
          feeding_requirements: egregore.feedingRequirements,
          vulnerability_points: egregore.vulnerabilityPoints,
        }, { onConflict: 'user_id,egregore_name' });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      egregoreAnalysis: analysis,
      egregorresDetected: analysis.detectedEgregores?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Egregore cultivation engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
