import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NetworkNode {
  id: string;
  name: string;
  organization?: string;
  isFavorite: boolean;
}

interface NetworkLink {
  source: string;
  target: string;
  weight: number;
}

interface NetworkAnalysis {
  influencers: Array<{ id: string; name: string; score: number; role: string }>;
  communities: Array<{ id: number; size: number; keyMembers: string[] }>;
  bridgeConnectors: Array<{ id: string; name: string; communities: number[] }>;
  recommendations: Array<{ type: string; description: string; priority: string }>;
  healthScore: number;
  insights: string[];
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch network data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, organization, is_favorite')
      .eq('user_id', user.id)
      .limit(500);

    const profileIds = (profiles || []).map(p => p.id);

    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('from_profile_id, to_profile_id, relationship_type')
      .eq('user_id', user.id)
      .in('from_profile_id', profileIds)
      .in('to_profile_id', profileIds);

    const nodes: NetworkNode[] = (profiles || []).map(p => ({
      id: p.id,
      name: `${p.first_name} ${p.last_name || ''}`.trim(),
      organization: p.organization,
      isFavorite: p.is_favorite,
    }));

    const links: NetworkLink[] = (relationships || []).map(r => ({
      source: r.from_profile_id,
      target: r.to_profile_id,
      weight: 1,
    }));

    if (nodes.length < 3) {
      return new Response(JSON.stringify({
        success: true,
        analysis: {
          influencers: [],
          communities: [],
          bridgeConnectors: [],
          recommendations: [{ type: 'growth', description: 'Add more contacts to build your network', priority: 'high' }],
          healthScore: 0,
          insights: ['Network too small for meaningful analysis'],
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build adjacency list
    const adj = new Map<string, Map<string, number>>();
    nodes.forEach(n => adj.set(n.id, new Map()));
    links.forEach(l => {
      adj.get(l.source)?.set(l.target, l.weight);
      adj.get(l.target)?.set(l.source, l.weight);
    });

    // Calculate PageRank
    const pageRank = new Map<string, number>();
    const n = nodes.length;
    const d = 0.85;
    nodes.forEach(node => pageRank.set(node.id, 1 / n));

    for (let iter = 0; iter < 50; iter++) {
      const newRanks = new Map<string, number>();
      nodes.forEach(node => {
        let sum = 0;
        adj.forEach((neighbors, neighborId) => {
          if (neighbors.has(node.id)) {
            const outDegree = adj.get(neighborId)?.size || 1;
            sum += (pageRank.get(neighborId) || 0) / outDegree;
          }
        });
        newRanks.set(node.id, (1 - d) / n + d * sum);
      });
      newRanks.forEach((v, k) => pageRank.set(k, v));
    }

    // Normalize PageRank
    const maxPR = Math.max(...pageRank.values());
    if (maxPR > 0) pageRank.forEach((v, k) => pageRank.set(k, v / maxPR));

    // Simple community detection
    const clusters = new Map<string, number>();
    nodes.forEach((node, i) => clusters.set(node.id, i));

    for (let iter = 0; iter < 20; iter++) {
      let changed = false;
      nodes.forEach(node => {
        const neighbors = adj.get(node.id);
        if (!neighbors || neighbors.size === 0) return;

        const clusterCounts = new Map<number, number>();
        neighbors.forEach((_, nid) => {
          const c = clusters.get(nid)!;
          clusterCounts.set(c, (clusterCounts.get(c) || 0) + 1);
        });

        let bestCluster = clusters.get(node.id)!;
        let bestCount = 0;
        clusterCounts.forEach((count, c) => {
          if (count > bestCount) {
            bestCount = count;
            bestCluster = c;
          }
        });

        if (bestCluster !== clusters.get(node.id)) {
          clusters.set(node.id, bestCluster);
          changed = true;
        }
      });
      if (!changed) break;
    }

    // Renumber clusters
    const uniqueClusters = [...new Set(clusters.values())];
    const clusterMap = new Map(uniqueClusters.map((c, i) => [c, i]));
    clusters.forEach((c, id) => clusters.set(id, clusterMap.get(c)!));

    // Get top influencers
    const influencers = [...pageRank.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, score]) => ({
        id,
        name: nodes.find(n => n.id === id)?.name || 'Unknown',
        score,
        role: score > 0.8 ? 'leader' : score > 0.5 ? 'connector' : 'active',
      }));

    // Get community info
    const communitySizes = new Map<number, string[]>();
    clusters.forEach((c, id) => {
      if (!communitySizes.has(c)) communitySizes.set(c, []);
      communitySizes.get(c)!.push(id);
    });

    const communities = [...communitySizes.entries()]
      .filter(([_, members]) => members.length > 1)
      .map(([id, members]) => ({
        id,
        size: members.length,
        keyMembers: members
          .sort((a, b) => (pageRank.get(b) || 0) - (pageRank.get(a) || 0))
          .slice(0, 3)
          .map(mid => nodes.find(n => n.id === mid)?.name || 'Unknown'),
      }));

    // Find bridge connectors
    const bridgeConnectors: Array<{ id: string; name: string; communities: number[] }> = [];
    nodes.forEach(node => {
      const neighbors = adj.get(node.id);
      if (!neighbors) return;

      const connectedCommunities = new Set<number>();
      neighbors.forEach((_, nid) => {
        connectedCommunities.add(clusters.get(nid)!);
      });

      if (connectedCommunities.size > 1) {
        bridgeConnectors.push({
          id: node.id,
          name: node.name,
          communities: [...connectedCommunities],
        });
      }
    });

    // Calculate health score
    const density = nodes.length > 1 ? (2 * links.length) / (nodes.length * (nodes.length - 1)) : 0;
    const avgDegree = links.length * 2 / nodes.length;
    const diversityScore = communities.length / Math.max(1, Math.sqrt(nodes.length));
    const healthScore = Math.min(100, (density * 30 + (avgDegree / 5) * 30 + diversityScore * 40));

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let insights: string[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "user",
              content: `Analyze this professional network and provide 3-5 strategic insights (JSON array of strings):
              - ${nodes.length} contacts
              - ${links.length} connections  
              - ${communities.length} communities
              - ${bridgeConnectors.length} bridge connectors
              - Network density: ${(density * 100).toFixed(1)}%
              - Top influencer: ${influencers[0]?.name || 'None'}
              - Health score: ${healthScore.toFixed(0)}/100`,
            }],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "[]";
          const match = content.match(/\[[\s\S]*\]/);
          if (match) {
            insights = JSON.parse(match[0]);
          }
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    if (insights.length === 0) {
      insights = [
        healthScore > 70 ? "Your network is well-connected and diverse" : "Consider expanding your network connections",
        bridgeConnectors.length > 3 ? "You have strong bridge connectors between communities" : "Identify and nurture connections that bridge communities",
        communities.length > 2 ? `Your network has ${communities.length} distinct communities` : "Work on diversifying your network into more communities",
      ];
    }

    // Generate recommendations
    const recommendations: Array<{ type: string; description: string; priority: string }> = [];
    
    if (density < 0.1) {
      recommendations.push({
        type: 'density',
        description: 'Network is sparse - introduce contacts who share interests',
        priority: 'high',
      });
    }

    if (bridgeConnectors.length < communities.length - 1) {
      recommendations.push({
        type: 'bridges',
        description: 'Create more connections between communities',
        priority: 'medium',
      });
    }

    const isolatedNodes = nodes.filter(n => (adj.get(n.id)?.size || 0) === 0);
    if (isolatedNodes.length > 0) {
      recommendations.push({
        type: 'integration',
        description: `${isolatedNodes.length} contacts are isolated - connect them to your network`,
        priority: 'medium',
      });
    }

    const analysis: NetworkAnalysis = {
      influencers,
      communities,
      bridgeConnectors: bridgeConnectors.slice(0, 10),
      recommendations,
      healthScore,
      insights,
    };

    // Store analysis results
    await supabase.from('ai_analyses').insert({
      user_id: user.id,
      profile_id: user.id, // Network-wide analysis
      analysis_type: 'network_deep',
      result: analysis,
    });

    return new Response(JSON.stringify({
      success: true,
      analysis,
      stats: {
        totalNodes: nodes.length,
        totalLinks: links.length,
        density,
        avgDegree,
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Network analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
