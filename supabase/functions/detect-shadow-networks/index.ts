import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAIConfig } from "../_shared/platform-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShadowNetworkRequest {
  userId: string;
  targetProfileIds?: string[];
  scanDepth?: 'shallow' | 'deep' | 'exhaustive';
}

const SHADOW_NETWORK_PROMPT = `You are an elite network intelligence analyst specializing in uncovering hidden relationships and shadow networks. Analyze the provided data to detect hidden connections that may not be explicitly stated.

Shadow networks include:
- Hidden relationships (secret affairs, undisclosed business partnerships)
- Communication clusters with unexplained patterns
- Temporal co-occurrence that suggests hidden coordination
- Behavioral correlation without direct link evidence
- Parallel identities and sock puppets
- Indirect influence chains

Return a JSON object with this EXACT structure:
{
  "shadow_connections": [
    {
      "source_profile_id": "id",
      "target_profile_id": "id",
      "connection_type": "hidden_romantic" | "hidden_business" | "secret_alliance" | "covert_communication" | "parallel_identity" | "influence_chain" | "unknown",
      "detection_method": "temporal_correlation" | "behavioral_matching" | "communication_pattern" | "location_overlap" | "linguistic_similarity" | "social_graph_analysis",
      "evidence": [
        {
          "type": "evidence type",
          "description": "specific evidence",
          "strength": 0-100,
          "source": "data source"
        }
      ],
      "confidence": 0.0-1.0,
      "risk_level": "low" | "medium" | "high" | "critical",
      "discovery_timestamp": "ISO timestamp"
    }
  ],
  "communication_clusters": [
    {
      "cluster_id": "unique id",
      "member_profile_ids": ["ids"],
      "communication_density": 0-100,
      "temporal_pattern": "description of timing",
      "topic_signatures": ["common topics"],
      "anomaly_indicators": ["what makes this suspicious"],
      "cluster_purpose_hypothesis": "theory about cluster purpose"
    }
  ],
  "temporal_coincidences": [
    {
      "event_type": "co_location" | "simultaneous_activity" | "coordinated_silence" | "synchronized_behavior",
      "profile_ids": ["involved profiles"],
      "timestamp_range": "time period",
      "frequency": "one_time" | "recurring" | "patterned",
      "statistical_improbability": 0-100,
      "interpretation": "what this might mean"
    }
  ],
  "behavioral_mirrors": [
    {
      "profile_a_id": "id",
      "profile_b_id": "id",
      "mirrored_behaviors": ["specific behaviors"],
      "correlation_score": 0-100,
      "divergence_points": ["where they differ"],
      "parallel_identity_probability": 0-100
    }
  ],
  "influence_chains": [
    {
      "chain_id": "unique id",
      "nodes": [
        {
          "profile_id": "id",
          "position": 1,
          "role": "originator" | "amplifier" | "receiver" | "hub",
          "influence_weight": 0-100
        }
      ],
      "information_flow_direction": "unidirectional" | "bidirectional",
      "chain_strength": 0-100,
      "purpose_hypothesis": "theory about chain purpose"
    }
  ],
  "network_anomalies": [
    {
      "anomaly_type": "missing_link" | "unexpected_bridge" | "isolated_cluster" | "over_connected_node" | "communication_void",
      "description": "specific anomaly",
      "involved_profiles": ["ids"],
      "significance": 0-100,
      "investigation_priority": "low" | "medium" | "high"
    }
  ],
  "secret_relationship_candidates": [
    {
      "profile_ids": ["id1", "id2"],
      "relationship_type_hypothesis": "romantic" | "familial" | "business" | "conspiratorial" | "unknown",
      "concealment_indicators": ["signs of hiding"],
      "exposure_risk": 0-100,
      "confidence": 0-100,
      "evidence_summary": "brief summary"
    }
  ],
  "overall_network_health": {
    "transparency_score": 0-100,
    "hidden_activity_level": "low" | "moderate" | "high" | "extreme",
    "trust_risk_areas": ["areas of concern"],
    "recommended_investigations": ["what to look into"]
  },
  "confidence_score": 0.0-1.0,
  "scan_coverage": 0-100,
  "data_quality": "high" | "medium" | "low"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, targetProfileIds, scanDepth = 'deep' } = await req.json() as ShadowNetworkRequest;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine profiles to analyze (active only)
    let profileIds = targetProfileIds;
    if (!profileIds || profileIds.length === 0) {
      const profilesResult = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(100);
      profileIds = (profilesResult.data || []).map(p => p.id);
    }

    // Gather network data
    const [
      profilesResult,
      messagesResult,
      entityLinksResult,
      crossPatternsResult,
      interactionsResult,
      locationHistoryResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").in("id", profileIds),
      supabase.from("messages").select("*").in("profile_id", profileIds).order("created_at", { ascending: false }).limit(1000),
      supabase.from("entity_links").select("*").or(`source_profile_id.in.(${profileIds.join(',')}),target_profile_id.in.(${profileIds.join(',')})`).limit(500),
      supabase.from("cross_contact_patterns").select("*").eq("user_id", userId).eq("is_active", true).limit(100),
      supabase.from("interactions").select("*").in("profile_id", profileIds).order("created_at", { ascending: false }).limit(500),
      supabase.from("location_history").select("*").in("profile_id", profileIds).order("timestamp", { ascending: false }).limit(200)
    ]);

    const contextData = {
      profiles: profilesResult.data || [],
      messages: messagesResult.data || [],
      entityLinks: entityLinksResult.data || [],
      crossPatterns: crossPatternsResult.data || [],
      interactions: interactionsResult.data || [],
      locationHistory: locationHistoryResult.data || [],
      scanDepth,
      analysisScope: {
        profileCount: profileIds.length,
        messageCount: (messagesResult.data || []).length,
        interactionCount: (interactionsResult.data || []).length
      }
    };

    // Get AI config from platform settings
    const aiConfig = await getAIConfig(supabase, userId);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig.defaultModel,
        messages: [
          { role: "system", content: SHADOW_NETWORK_PROMPT },
          { 
            role: "user", 
            content: `Perform shadow network detection analysis on the following data:\n\n${JSON.stringify(contextData, null, 2)}`
          }
        ],
        temperature: aiConfig.temperature,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI budget exceeded. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse shadow network analysis");
    }

    // Store the analysis
    await supabase.from("ai_analyses").insert({
      profile_id: profileIds[0] || null,
      user_id: userId,
      analysis_type: "shadow_network",
      result: analysis,
      generated_at: new Date().toISOString()
    });

    // Store any high-confidence shadow connections as cross-contact patterns
    const highConfidenceConnections = (analysis.shadow_connections || [])
      .filter((c: any) => c.confidence >= 0.7);

    for (const connection of highConfidenceConnections) {
      await supabase.from("cross_contact_patterns").upsert({
        user_id: userId,
        pattern_type: `shadow_${connection.connection_type}`,
        title: `Hidden ${connection.connection_type} connection detected`,
        description: connection.evidence?.[0]?.description || 'Shadow network connection',
        confidence_score: connection.confidence,
        profiles_involved: [connection.source_profile_id, connection.target_profile_id],
        evidence: { shadow_analysis: connection },
        detected_at: new Date().toISOString(),
        is_active: true
      }, { onConflict: 'id' });
    }

    const usage = aiResult.usage || {};
    const estimatedCost = ((usage.prompt_tokens || 0) * 0.00001 + (usage.completion_tokens || 0) * 0.00003) * 100;

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        metadata: {
          profilesScanned: profileIds.length,
          shadowConnectionsFound: (analysis.shadow_connections || []).length,
          clustersIdentified: (analysis.communication_clusters || []).length,
          anomaliesDetected: (analysis.network_anomalies || []).length,
          confidenceScore: analysis.confidence_score || 0.7,
          estimatedCostCents: estimatedCost.toFixed(4)
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Shadow network detection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
