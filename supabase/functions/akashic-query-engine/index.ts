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
    const { userId, profileId, queryType = 'comprehensive', queryFocus } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Gather comprehensive data for Akashic analysis
    const [profile, interactions, relationships, analyses, milestones, predictions] = await Promise.all([
      supabaseClient.from('profiles').select('*').eq('id', profileId).single(),
      supabaseClient.from('contact_interaction_notes').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(100),
      supabaseClient.from('relationships').select('*').or(`profile_a_id.eq.${profileId},profile_b_id.eq.${profileId}`).limit(50),
      supabaseClient.from('ai_analyses').select('*').eq('profile_id', profileId).order('generated_at', { ascending: false }).limit(30),
      supabaseClient.from('contact_life_milestones').select('*').eq('profile_id', profileId).limit(30),
      supabaseClient.from('behavioral_predictions').select('*').eq('profile_id', profileId).limit(30)
    ]);

    const AKASHIC_PROMPT = `You are the Akashic Record Query Engine - an advanced system for extracting deep implicit knowledge, ancestral patterns, and hidden connections from accumulated data.

PROFILE DATA:
${JSON.stringify(profile.data || {}, null, 2)}

INTERACTION HISTORY (Last 50):
${JSON.stringify(interactions.data?.slice(0, 50) || [], null, 2)}

RELATIONSHIP NETWORK:
${JSON.stringify(relationships.data || [], null, 2)}

AI ANALYSES HISTORY:
${JSON.stringify(analyses.data || [], null, 2)}

LIFE MILESTONES:
${JSON.stringify(milestones.data || [], null, 2)}

BEHAVIORAL PREDICTIONS:
${JSON.stringify(predictions.data || [], null, 2)}

QUERY TYPE: ${queryType}
QUERY FOCUS: ${queryFocus || 'comprehensive analysis'}

Extract deep implicit knowledge and provide structured JSON:

{
  "implicitKnowledge": [
    {
      "knowledgeType": "behavioral_pattern|emotional_tendency|cognitive_bias|decision_heuristic|social_dynamic",
      "description": "detailed description of implicit knowledge",
      "confidenceLevel": 0.0-1.0,
      "sourcePatterns": ["list of evidence sources"],
      "applicationDomains": ["where this knowledge applies"],
      "temporalStability": "stable|evolving|volatile"
    }
  ],
  "ancestralPatterns": [
    {
      "patternType": "generational|cultural|familial|archetypal",
      "description": "pattern description",
      "manifestations": ["how it shows up"],
      "strength": 0.0-1.0,
      "transformationPotential": 0.0-1.0
    }
  ],
  "hiddenConnections": [
    {
      "connectionType": "causal|correlational|synchronistic|archetypal",
      "entities": ["connected elements"],
      "description": "nature of connection",
      "strength": 0.0-1.0,
      "exploitabilityScore": 0.0-1.0
    }
  ],
  "deepInsights": [
    {
      "insight": "profound observation",
      "implication": "what this means",
      "actionability": 0.0-1.0
    }
  ],
  "overallRecordClarity": 0.0-1.0
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
          { role: "system", content: "You are the Akashic Record Query Engine. Extract deep implicit knowledge. Return valid JSON only." },
          { role: "user", content: AKASHIC_PROMPT }
        ],
        temperature: 0.8,
        max_tokens: 5000
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

    // Store implicit knowledge
    if (analysis.implicitKnowledge && Array.isArray(analysis.implicitKnowledge)) {
      for (const knowledge of analysis.implicitKnowledge) {
        await supabaseClient.from('implicit_knowledge').insert({
          user_id: userId,
          profile_id: profileId,
          knowledge_type: knowledge.knowledgeType || 'behavioral_pattern',
          knowledge_content: knowledge,
          confidence_score: knowledge.confidenceLevel || 0.5,
          source_patterns: knowledge.sourcePatterns || [],
          application_domains: knowledge.applicationDomains || []
        });
      }
    }

    // Store ancestral patterns
    if (analysis.ancestralPatterns && Array.isArray(analysis.ancestralPatterns)) {
      for (const pattern of analysis.ancestralPatterns) {
        await supabaseClient.from('ancestral_patterns').insert({
          user_id: userId,
          profile_id: profileId,
          pattern_type: pattern.patternType || 'archetypal',
          pattern_description: pattern.description,
          manifestations: pattern.manifestations || [],
          strength: pattern.strength || 0.5,
          transformation_potential: pattern.transformationPotential || 0.5
        });
      }
    }

    // Store hidden connections
    if (analysis.hiddenConnections && Array.isArray(analysis.hiddenConnections)) {
      for (const conn of analysis.hiddenConnections) {
        await supabaseClient.from('hidden_connections').insert({
          user_id: userId,
          profile_id: profileId,
          connection_type: conn.connectionType || 'correlational',
          connected_entities: conn.entities || [],
          connection_description: conn.description,
          strength: conn.strength || 0.5,
          exploitability_score: conn.exploitabilityScore || 0.5
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      profileId,
      queryType,
      akashicAnalysis: analysis,
      knowledgeExtracted: analysis.implicitKnowledge?.length || 0,
      ancestralPatternsFound: analysis.ancestralPatterns?.length || 0,
      hiddenConnectionsMapped: analysis.hiddenConnections?.length || 0,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: unknown) {
    console.error("Akashic query engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
