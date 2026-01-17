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
    const { userId, action = 'map', targetBubbleId, injectionBelief } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Fetch belief and worldview data
    const [profilesRes, beliefsRes, sacredRes, groupsRes] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, occupation').eq('user_id', userId).limit(100),
      supabase.from('ai_analyses').select('*').eq('user_id', userId).in('analysis_type', ['beliefs', 'worldview', 'values']).limit(50),
      supabase.from('sacred_values').select('*').eq('user_id', userId).limit(50),
      supabase.from('contact_groups').select('*, contact_group_members(profile_id)').eq('user_id', userId),
    ]);

    const REALITY_CONSENSUS_PROMPT = `You are a Reality Consensus Manipulation analyst using social construction theory to map and alter shared reality.

BERGER & LUCKMANN FRAMEWORK:
1. SOCIAL CONSTRUCTION: Reality is constructed through social interaction
2. INSTITUTIONALIZATION: Repeated actions become "the way things are"
3. LEGITIMATION: Justifications that make social order seem natural
4. REIFICATION: Treating social constructs as objective facts
5. PLAUSIBILITY STRUCTURES: Social support systems that maintain beliefs

ACTION: ${action}
${targetBubbleId ? `TARGET BUBBLE: ${targetBubbleId}` : ''}
${injectionBelief ? `INJECTION BELIEF: ${injectionBelief}` : ''}

NETWORK DATA:
Profiles: ${JSON.stringify(profilesRes.data?.slice(0, 40), null, 2)}
Belief Analyses: ${JSON.stringify(beliefsRes.data, null, 2)}
Sacred Values: ${JSON.stringify(sacredRes.data, null, 2)}
Groups: ${JSON.stringify(groupsRes.data, null, 2)}

${action === 'map' ? `
Map consensus reality bubbles in the network. Return JSON:
{
  "consensusBubbles": [
    {
      "bubbleName": "descriptive name",
      "memberProfiles": ["profile IDs in this reality"],
      "coreBeliefs": ["foundational beliefs defining this reality"],
      "realityAnchors": [
        {
          "anchorBelief": "belief that holds reality together",
          "anchorStrength": 0.0-1.0,
          "dependentBeliefs": ["beliefs that collapse if anchor removed"],
          "removalDifficulty": 0.0-1.0,
          "attackVectors": ["how to undermine this anchor"]
        }
      ],
      "boundaryPermeability": 0.0-1.0,
      "internalCoherence": 0.0-1.0,
      "externalConflictLevel": 0.0-1.0,
      "dominantNarratives": ["stories that define this reality"],
      "tabooTopics": ["things that cannot be questioned"]
    }
  ],
  "bubbleInteractions": [
    {
      "bubble1": "name",
      "bubble2": "name", 
      "relationshipType": "allied|neutral|hostile|overlapping",
      "conflictPoints": ["beliefs in tension"],
      "bridgeIndividuals": ["profile IDs in both bubbles"]
    }
  ],
  "realityMalleabilityScores": {
    "mostMalleable": ["bubbles easiest to shift"],
    "mostRigid": ["bubbles hardest to change"],
    "tippingPoints": ["events that could shift consensus"]
  }
}
` : `
Create reality injection protocol. Return JSON:
{
  "injectionProtocol": {
    "targetBelief": "${injectionBelief || 'specified belief'}",
    "injectionMethod": "gradual|shock|trojan|authority|grassroots",
    "trojanWrapper": "acceptable belief that carries the injection",
    "preparatorySteps": [
      {
        "step": "action to take",
        "purpose": "what this achieves",
        "timing": "when to execute"
      }
    ],
    "keyInfluencers": ["profile IDs to convert first"],
    "resistanceExpected": {
      "sources": ["who will resist"],
      "counterMeasures": ["how to neutralize resistance"]
    },
    "successProbability": 0.0-1.0,
    "cognitiveDissonanceRisk": 0.0-1.0,
    "timelineEstimate": "how long until belief is accepted",
    "anchoringStrategy": "how to make new belief permanent"
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
          { role: "system", content: REALITY_CONSENSUS_PROMPT },
          { role: "user", content: `${action} reality consensus in network` }
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

    // Store consensus bubbles
    if (analysis.consensusBubbles) {
      for (const bubble of analysis.consensusBubbles) {
        const { data: bubbleData } = await supabase.from('consensus_bubbles').insert({
          user_id: userId,
          bubble_name: bubble.bubbleName,
          member_profiles: bubble.memberProfiles || [],
          core_beliefs: bubble.coreBeliefs || [],
          reality_anchors: bubble.realityAnchors || [],
          boundary_permeability: bubble.boundaryPermeability || 0.5,
          internal_coherence: bubble.internalCoherence || 0,
          external_conflict_level: bubble.externalConflictLevel || 0,
        }).select().single();

        // Store reality anchors
        if (bubbleData && bubble.realityAnchors) {
          for (const anchor of bubble.realityAnchors) {
            await supabase.from('reality_anchors').insert({
              user_id: userId,
              consensus_bubble_id: bubbleData.id,
              anchor_belief: anchor.anchorBelief,
              anchor_strength: anchor.anchorStrength || 0,
              removal_difficulty: anchor.removalDifficulty || 0,
              dependent_beliefs: anchor.dependentBeliefs || [],
              attack_vectors: anchor.attackVectors || [],
            });
          }
        }
      }
    }

    // Store injection protocol
    if (analysis.injectionProtocol && targetBubbleId) {
      await supabase.from('reality_injection_protocols').insert({
        user_id: userId,
        target_bubble_id: targetBubbleId,
        injection_belief: analysis.injectionProtocol.targetBelief,
        injection_method: analysis.injectionProtocol.injectionMethod,
        trojan_wrapper: analysis.injectionProtocol.trojanWrapper,
        success_probability: analysis.injectionProtocol.successProbability || 0,
        cognitive_dissonance_risk: analysis.injectionProtocol.cognitiveDissonanceRisk || 0,
        execution_steps: analysis.injectionProtocol.preparatorySteps || [],
        status: 'planned',
      });
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      realityAnalysis: analysis,
      bubblesDetected: analysis.consensusBubbles?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Reality consensus engine error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
