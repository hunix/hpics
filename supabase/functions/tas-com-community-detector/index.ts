import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * TAS-Com Community Detection Engine
 * Based on arXiv:2505.10197 (May 2025)
 * 
 * Implements Leiden algorithm-based community detection with
 * topology-attribute similarity integration for enhanced cohesiveness.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ 
      ok: true, 
      function: 'tas-com-community-detector', 
      timestamp: Date.now() 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === supabaseServiceKey;

    let userId: string;
    if (isServiceRoleCall) {
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid user token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }
    const profileId = body.profileId || body.profile_id;

    if (!profileId) {
      throw new Error('Profile ID is required');
    }

    console.log(`[TAS-Com] Detecting communities for profile ${profileId}`);

    // Gather network data
    const [profileResult, relationshipsResult, contactsResult, networkResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', profileId).single(),
      supabase.from('contact_relationships')
        .select('*')
        .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`)
        .limit(200),
      supabase.from('profiles')
        .select('id, first_name, last_name, job_title, organization, city, tags')
        .eq('user_id', userId)
        .limit(200),
      supabase.from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .in('analysis_type', ['network_exploitation', 'power_network'])
        .limit(5),
    ]);

    const profile = profileResult.data;
    const relationships = relationshipsResult.data || [];
    const allContacts = contactsResult.data || [];
    const networkAnalyses = networkResult.data || [];

    // Build graph representation
    const graph = buildGraph(profileId, relationships, allContacts);
    
    // Run Leiden-based community detection with attribute similarity
    const communities = detectCommunities(graph, allContacts);
    
    // Calculate community metrics
    const communityMetrics = calculateCommunityMetrics(communities, graph);
    
    // Identify bridging opportunities
    const bridgingOpportunities = findBridgingOpportunities(communities, graph);
    
    // Generate strategic insights
    const strategicInsights = generateStrategicInsights(communities, communityMetrics, bridgingOpportunities);

    const detectionResult = {
      profileId,
      modelVersion: '1.0.0-tascom',
      analyzedAt: new Date().toISOString(),
      graph: {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.length,
      },
      communities,
      communityMetrics,
      bridgingOpportunities,
      strategicInsights,
    };

    // Persist to ai_analyses
    await supabase
      .from('ai_analyses')
      .upsert({
        profile_id: profileId,
        user_id: userId,
        analysis_type: 'tas_com_community',
        result: detectionResult,
        confidence_score: communityMetrics.overallConfidence,
        model_used: 'tas-com-leiden-v1.0',
        tokens_used: 0,
        cost_cents: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'profile_id,analysis_type',
      });

    console.log(`[TAS-Com] Detected ${communities.length} communities for ${profileId}`);

    return new Response(JSON.stringify({
      success: true,
      detectionResult,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[TAS-Com] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

interface Graph {
  nodes: Map<string, { id: string; attributes: Record<string, any> }>;
  edges: Array<{ source: string; target: string; weight: number }>;
  adjacency: Map<string, Set<string>>;
}

function buildGraph(focusProfileId: string, relationships: any[], contacts: any[]): Graph {
  const nodes = new Map<string, { id: string; attributes: Record<string, any> }>();
  const edges: Array<{ source: string; target: string; weight: number }> = [];
  const adjacency = new Map<string, Set<string>>();

  // Add all contacts as nodes
  for (const contact of contacts) {
    nodes.set(contact.id, {
      id: contact.id,
      attributes: {
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        company: contact.company,
        jobTitle: contact.job_title,
        city: contact.city,
        tags: contact.tags || [],
      },
    });
    adjacency.set(contact.id, new Set());
  }

  // Add edges from relationships
  for (const rel of relationships) {
    const source = rel.from_profile_id;
    const target = rel.to_profile_id;
    
    if (!nodes.has(source) || !nodes.has(target)) continue;

    const weight = calculateEdgeWeight(rel);
    edges.push({ source, target, weight });
    
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  }

  return { nodes, edges, adjacency };
}

function calculateEdgeWeight(relationship: any): number {
  let weight = 0.5;
  
  if (relationship.trust_score) {
    weight += relationship.trust_score * 0.3;
  }
  if (relationship.relationship_strength === 'strong') {
    weight += 0.2;
  }
  if (relationship.is_mutual) {
    weight += 0.1;
  }
  
  return Math.min(1, weight);
}

function detectCommunities(graph: Graph, contacts: any[]): any[] {
  // Simplified Leiden-inspired algorithm with attribute similarity
  const communities: Map<string, string[]> = new Map();
  const nodeToComm: Map<string, string> = new Map();
  
  // Initial partition: each node in its own community
  let commId = 0;
  for (const nodeId of graph.nodes.keys()) {
    const cId = `comm_${commId++}`;
    communities.set(cId, [nodeId]);
    nodeToComm.set(nodeId, cId);
  }

  // Iteratively merge communities based on modularity gain + attribute similarity
  let improved = true;
  let iterations = 0;
  const maxIterations = 10;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (const nodeId of graph.nodes.keys()) {
      const currentComm = nodeToComm.get(nodeId)!;
      const neighbors = graph.adjacency.get(nodeId) || new Set();
      
      // Find best community to join
      let bestComm = currentComm;
      let bestGain = 0;

      const neighborComms = new Set<string>();
      for (const neighbor of neighbors) {
        neighborComms.add(nodeToComm.get(neighbor)!);
      }

      for (const candidateComm of neighborComms) {
        if (candidateComm === currentComm) continue;

        const gain = calculateModularityGain(nodeId, currentComm, candidateComm, graph, communities, nodeToComm) +
                     calculateAttributeSimilarityGain(nodeId, candidateComm, graph, communities);

        if (gain > bestGain) {
          bestGain = gain;
          bestComm = candidateComm;
        }
      }

      // Move node if beneficial
      if (bestComm !== currentComm && bestGain > 0.01) {
        // Remove from current
        const currentMembers = communities.get(currentComm) || [];
        communities.set(currentComm, currentMembers.filter(n => n !== nodeId));
        
        // Add to new
        const newMembers = communities.get(bestComm) || [];
        newMembers.push(nodeId);
        communities.set(bestComm, newMembers);
        
        nodeToComm.set(nodeId, bestComm);
        improved = true;
      }
    }
  }

  // Convert to output format
  const result: any[] = [];
  for (const [commId, members] of communities.entries()) {
    if (members.length === 0) continue;

    const memberDetails = members.map(id => {
      const node = graph.nodes.get(id);
      return {
        id,
        name: node?.attributes.name || 'Unknown',
        company: node?.attributes.company,
        role: node?.attributes.jobTitle,
      };
    });

    // Identify community characteristics
    const companies = memberDetails.map(m => m.company).filter(Boolean);
    const dominantCompany = findMostCommon(companies);
    
    result.push({
      id: commId,
      size: members.length,
      members: memberDetails,
      characteristics: {
        dominantCompany,
        cohesion: calculateCohesion(members, graph),
      },
    });
  }

  // Sort by size
  return result.sort((a, b) => b.size - a.size);
}

function calculateModularityGain(
  nodeId: string,
  fromComm: string,
  toComm: string,
  graph: Graph,
  communities: Map<string, string[]>,
  nodeToComm: Map<string, string>
): number {
  const m = graph.edges.length || 1;
  const neighbors = graph.adjacency.get(nodeId) || new Set();
  
  let gainIn = 0;
  let gainOut = 0;

  for (const neighbor of neighbors) {
    if (nodeToComm.get(neighbor) === toComm) gainIn++;
    if (nodeToComm.get(neighbor) === fromComm) gainOut++;
  }

  return (gainIn - gainOut) / m;
}

function calculateAttributeSimilarityGain(
  nodeId: string,
  toComm: string,
  graph: Graph,
  communities: Map<string, string[]>
): number {
  const nodeAttrs = graph.nodes.get(nodeId)?.attributes || {};
  const commMembers = communities.get(toComm) || [];
  
  if (commMembers.length === 0) return 0;

  let similarity = 0;
  for (const memberId of commMembers) {
    const memberAttrs = graph.nodes.get(memberId)?.attributes || {};
    
    // Company match
    if (nodeAttrs.company && nodeAttrs.company === memberAttrs.company) {
      similarity += 0.3;
    }
    
    // Tag overlap
    const nodeTags = new Set(nodeAttrs.tags || []);
    const memberTags = memberAttrs.tags || [];
    for (const tag of memberTags) {
      if (nodeTags.has(tag)) similarity += 0.1;
    }
  }

  return similarity / commMembers.length;
}

function calculateCohesion(members: string[], graph: Graph): number {
  if (members.length < 2) return 1;

  let internalEdges = 0;
  const memberSet = new Set(members);

  for (const edge of graph.edges) {
    if (memberSet.has(edge.source) && memberSet.has(edge.target)) {
      internalEdges++;
    }
  }

  const maxPossible = (members.length * (members.length - 1)) / 2;
  return maxPossible > 0 ? internalEdges / maxPossible : 0;
}

function findMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function calculateCommunityMetrics(communities: any[], graph: Graph): Record<string, any> {
  const validCommunities = communities.filter(c => c.size > 1);
  
  return {
    totalCommunities: validCommunities.length,
    averageSize: validCommunities.length > 0 
      ? validCommunities.reduce((sum, c) => sum + c.size, 0) / validCommunities.length 
      : 0,
    largestCommunity: validCommunities[0]?.size || 0,
    averageCohesion: validCommunities.length > 0
      ? validCommunities.reduce((sum, c) => sum + c.characteristics.cohesion, 0) / validCommunities.length
      : 0,
    overallConfidence: Math.min(0.9, 0.5 + (validCommunities.length * 0.05) + (graph.edges.length * 0.01)),
  };
}

function findBridgingOpportunities(communities: any[], graph: Graph): any[] {
  const opportunities: any[] = [];

  // Find nodes that connect different communities
  for (const [nodeId, neighbors] of graph.adjacency.entries()) {
    const nodeCommunities = new Set<string>();
    
    for (const comm of communities) {
      if (comm.members.some((m: any) => m.id === nodeId || neighbors.has(m.id))) {
        nodeCommunities.add(comm.id);
      }
    }

    if (nodeCommunities.size >= 2) {
      const node = graph.nodes.get(nodeId);
      opportunities.push({
        nodeId,
        nodeName: node?.attributes.name || 'Unknown',
        bridgesBetween: [...nodeCommunities],
        bridgingScore: nodeCommunities.size / communities.length,
      });
    }
  }

  return opportunities.sort((a, b) => b.bridgingScore - a.bridgingScore).slice(0, 10);
}

function generateStrategicInsights(communities: any[], metrics: Record<string, any>, bridges: any[]): string[] {
  const insights: string[] = [];

  if (metrics.totalCommunities > 3) {
    insights.push(`Network is fragmented into ${metrics.totalCommunities} distinct communities - multiple entry points available`);
  } else if (metrics.totalCommunities === 1) {
    insights.push('Network is highly cohesive - single influence point may cascade widely');
  }

  if (metrics.averageCohesion > 0.5) {
    insights.push('High community cohesion detected - information spreads quickly within groups');
  }

  if (bridges.length > 0) {
    insights.push(`${bridges.length} bridging nodes identified - key leverage points for cross-community influence`);
    const topBridge = bridges[0];
    insights.push(`Top bridging node: ${topBridge.nodeName} connects ${topBridge.bridgesBetween.length} communities`);
  }

  if (communities[0]?.characteristics.dominantCompany) {
    insights.push(`Largest community associated with ${communities[0].characteristics.dominantCompany}`);
  }

  return insights;
}
