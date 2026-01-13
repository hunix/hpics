import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InferenceRequest {
  profileId?: string; // If provided, infer relationships for this profile
  fullScan?: boolean; // If true, scan all profiles
  maxDepth?: number; // Max path depth for transitive connections
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId, fullScan = false, maxDepth = 3 } = await req.json() as InferenceRequest;

    // Get profiles to analyze
    let profilesToAnalyze: string[] = [];
    
    if (profileId) {
      profilesToAnalyze = [profileId];
    } else if (fullScan) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(100);
      profilesToAnalyze = (profiles || []).map(p => p.id);
    } else {
      return new Response(JSON.stringify({ error: "Provide profileId or set fullScan=true" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = {
      transitive_connections: [] as any[],
      shared_organizations: [] as any[],
      opportunities: [] as any[],
      total_inferences: 0
    };

    // Get all entity links for context
    const { data: allLinks } = await supabase
      .from("entity_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "confirmed");

    // Get all profiles for context
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, company, title, relationship_type")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const profileMap = new Map((allProfiles || []).map(p => [p.id, p]));

    // Build adjacency list for graph traversal
    const adjacencyList = new Map<string, Set<string>>();
    (allLinks || []).forEach(link => {
      if (!adjacencyList.has(link.source_profile_id)) {
        adjacencyList.set(link.source_profile_id, new Set());
      }
      adjacencyList.get(link.source_profile_id)!.add(link.target_profile_id);
      
      // Bidirectional
      if (!adjacencyList.has(link.target_profile_id)) {
        adjacencyList.set(link.target_profile_id, new Set());
      }
      adjacencyList.get(link.target_profile_id)!.add(link.source_profile_id);
    });

    for (const sourceId of profilesToAnalyze) {
      // 1. Find transitive connections (2nd and 3rd degree)
      const transitiveConnections = findTransitiveConnections(
        sourceId,
        adjacencyList,
        profileMap,
        maxDepth
      );

      for (const conn of transitiveConnections) {
        // Check if inference already exists
        const { data: existing } = await supabase
          .from("relationship_inferences")
          .select("id")
          .eq("user_id", user.id)
          .eq("source_profile_id", sourceId)
          .eq("target_profile_id", conn.targetId)
          .eq("inference_type", "transitive_connection")
          .single();

        if (!existing) {
          const { error } = await supabase.from("relationship_inferences").insert({
            user_id: user.id,
            source_profile_id: sourceId,
            target_profile_id: conn.targetId,
            inference_type: "transitive_connection",
            path_profiles: conn.path,
            path_distance: conn.distance,
            relationship_strength: conn.strength,
            confidence_score: Math.max(0.3, 1 - (conn.distance * 0.2)),
            evidence: { 
              path_names: conn.pathNames,
              connection_type: conn.distance === 2 ? "2nd_degree" : "3rd_degree"
            },
            opportunity_score: calculateOpportunityScore(conn, profileMap),
            opportunity_type: determineOpportunityType(conn, profileMap)
          });

          if (!error) {
            results.transitive_connections.push(conn);
            results.total_inferences++;
          }
        }
      }

      // 2. Find shared organization connections
      const sourceProfile = profileMap.get(sourceId);
      if (sourceProfile?.company) {
        const sharedOrgProfiles = (allProfiles || []).filter(p => 
          p.id !== sourceId && 
          p.company && 
          p.company.toLowerCase() === sourceProfile.company.toLowerCase()
        );

        for (const sharedProfile of sharedOrgProfiles) {
          const { data: existing } = await supabase
            .from("relationship_inferences")
            .select("id")
            .eq("user_id", user.id)
            .eq("source_profile_id", sourceId)
            .eq("target_profile_id", sharedProfile.id)
            .eq("inference_type", "shared_organization")
            .single();

          if (!existing) {
            const { error } = await supabase.from("relationship_inferences").insert({
              user_id: user.id,
              source_profile_id: sourceId,
              target_profile_id: sharedProfile.id,
              inference_type: "shared_organization",
              path_distance: 1,
              relationship_strength: 0.7,
              confidence_score: 0.85,
              evidence: { 
                shared_company: sourceProfile.company,
                source_title: sourceProfile.title,
                target_title: sharedProfile.title
              },
              opportunity_score: 0.8,
              opportunity_type: "collaboration"
            });

            if (!error) {
              results.shared_organizations.push({
                source: sourceProfile,
                target: sharedProfile,
                company: sourceProfile.company
              });
              results.total_inferences++;
            }
          }
        }
      }
    }

    // 3. Use AI to identify high-value networking opportunities
    if (results.transitive_connections.length > 0) {
      const opportunities = await identifyOpportunities(
        user.id,
        results.transitive_connections.slice(0, 10),
        profileMap
      );
      results.opportunities = opportunities;
    }

    return new Response(JSON.stringify({
      success: true,
      profiles_analyzed: profilesToAnalyze.length,
      ...results
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("infer-relationships error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function findTransitiveConnections(
  sourceId: string,
  adjacencyList: Map<string, Set<string>>,
  profileMap: Map<string, any>,
  maxDepth: number
): any[] {
  const connections: any[] = [];
  const visited = new Set<string>([sourceId]);
  const queue: Array<{ id: string; path: string[]; distance: number; strength: number }> = [];

  // Initialize with direct connections
  const directConnections = adjacencyList.get(sourceId) || new Set();
  directConnections.forEach(id => {
    visited.add(id);
    queue.push({ id, path: [sourceId, id], distance: 1, strength: 1.0 });
  });

  while (queue.length > 0) {
    const { id, path, distance, strength } = queue.shift()!;

    if (distance >= 2 && distance <= maxDepth) {
      // This is a transitive connection (2nd degree or beyond)
      const profile = profileMap.get(id);
      connections.push({
        targetId: id,
        path,
        pathNames: path.map(pid => {
          const p = profileMap.get(pid);
          return p ? `${p.first_name} ${p.last_name || ''}`.trim() : pid;
        }),
        distance,
        strength: strength * 0.7, // Decay strength with each hop
        targetProfile: profile
      });
    }

    if (distance < maxDepth) {
      const nextConnections = adjacencyList.get(id) || new Set();
      nextConnections.forEach(nextId => {
        if (!visited.has(nextId)) {
          visited.add(nextId);
          queue.push({
            id: nextId,
            path: [...path, nextId],
            distance: distance + 1,
            strength: strength * 0.7
          });
        }
      });
    }
  }

  return connections;
}

function calculateOpportunityScore(conn: any, profileMap: Map<string, any>): number {
  const target = profileMap.get(conn.targetId);
  if (!target) return 0.3;

  let score = 0.5;
  
  // Higher score for shorter paths
  score += (4 - conn.distance) * 0.1;
  
  // Higher score for business relationships
  if (target.relationship_type === 'business' || target.relationship_type === 'professional') {
    score += 0.15;
  }
  
  // Higher score if they have a company
  if (target.company) score += 0.1;
  
  // Higher score for C-level or senior titles
  if (target.title) {
    const seniorTitles = ['ceo', 'cto', 'cfo', 'vp', 'director', 'head', 'chief'];
    if (seniorTitles.some(t => target.title.toLowerCase().includes(t))) {
      score += 0.15;
    }
  }

  return Math.min(1, Math.max(0, score));
}

function determineOpportunityType(conn: any, profileMap: Map<string, any>): string {
  const target = profileMap.get(conn.targetId);
  if (!target) return 'introduction';

  if (target.relationship_type === 'business' || target.company) {
    return 'strategic_alliance';
  }
  
  if (conn.distance === 2) {
    return 'introduction';
  }
  
  return 'collaboration';
}

async function identifyOpportunities(
  userId: string,
  connections: any[],
  profileMap: Map<string, any>
): Promise<any[]> {
  if (connections.length === 0) return [];

  const connectionsDesc = connections.map(c => {
    const target = profileMap.get(c.targetId);
    return `- ${c.pathNames.join(' → ')} (${c.distance} degrees, ${target?.company || 'no company'}, ${target?.title || 'no title'})`;
  }).join('\n');

  const prompt = `Analyze these discovered network connections and identify the top 3 highest-value networking opportunities:

${connectionsDesc}

For each opportunity, explain:
1. Why this connection is valuable
2. How the introduction path can be leveraged
3. Specific action to take

Respond with JSON: { "opportunities": [{ "target_path": string, "value_reason": string, "action": string, "priority": "high"|"medium"|"low" }] }`;

  try {
    const response = await callAI({
      userId,
      functionName: "infer-relationships",
      messages: [
        { role: "system", content: "You are a networking strategist. Identify high-value connection opportunities." },
        { role: "user", content: prompt }
      ],
      model: "google/gemini-2.5-flash",
      temperature: 0.4,
      maxTokens: 1000,
    });

    const parsed = JSON.parse(response.content);
    return parsed.opportunities || [];
  } catch (e) {
    console.error("Failed to identify opportunities:", e);
    return [];
  }
}
