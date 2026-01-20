import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NetworkNode {
  id: string;
  name: string;
  type?: string;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

interface CentralityScores {
  eigenvector: Map<string, number>;
  betweenness: Map<string, number>;
  closeness: Map<string, number>;
  pageRank: Map<string, number>;
}

interface Community {
  id: number;
  members: string[];
  cohesion: number;
  bridgeContacts: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check short-circuit - respond before any auth/validation (GET ?healthCheck=1)
  const url = new URL(req.url);
  if (url.searchParams.get('healthCheck') === '1') {
    return new Response(JSON.stringify({ ok: true, function: 'analyze-network-graph', timestamp: Date.now() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const isServiceRoleCall = token === SUPABASE_SERVICE_ROLE_KEY;
    
    let userId: string;
    
    if (isServiceRoleCall) {
      // For service role calls, parse body to get userId
      const body = await req.json().catch(() => ({}));
      userId = body.userId || body.user_id;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'userId is required for service calls' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Validate user token
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = user.id;
    }

    console.log('Analyzing network graph for user:', userId);

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_type')
      .eq('user_id', userId);

    if (!profiles || profiles.length < 2) {
      return new Response(JSON.stringify({ 
        error: 'Need at least 2 contacts for network analysis',
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch relationships
    const { data: relationships } = await supabase
      .from('contact_relationships')
      .select('from_profile_id, to_profile_id, relationship_type, strength')
      .eq('user_id', userId);

    // Build graph
    const nodes: NetworkNode[] = profiles.map(p => ({
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      type: p.relationship_type || 'contact',
    }));

    const edges: NetworkEdge[] = [];
    const adjacencyList = new Map<string, Map<string, number>>();

    // Initialize adjacency list
    nodes.forEach(node => {
      adjacencyList.set(node.id, new Map());
    });

    // Add edges from relationships
    (relationships || []).forEach(rel => {
      const weight = rel.strength || 50;
      edges.push({
        source: rel.from_profile_id,
        target: rel.to_profile_id,
        weight: weight / 100,
      });

      // Bidirectional for analysis
      const fromNeighbors = adjacencyList.get(rel.from_profile_id);
      const toNeighbors = adjacencyList.get(rel.to_profile_id);
      if (fromNeighbors) fromNeighbors.set(rel.to_profile_id, weight / 100);
      if (toNeighbors) toNeighbors.set(rel.from_profile_id, weight / 100);
    });

    // Calculate network metrics
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

    // Calculate centrality scores
    const centrality = calculateCentrality(nodes, adjacencyList);

    // Detect communities using label propagation
    const communities = detectCommunities(nodes, adjacencyList);

    // Calculate clustering coefficient (simplified)
    const avgClustering = calculateAvgClustering(nodes, adjacencyList);

    // Identify key players
    const topInfluencers = getTopNodes(centrality.eigenvector, 5);
    const bridgeConnectors = getTopNodes(centrality.betweenness, 5);
    const hubNodes = getTopNodes(centrality.closeness, 5);

    // Predict potential connections
    const predictedConnections = predictLinks(nodes, adjacencyList, 10);

    // Identify structural holes
    const structuralHoles = identifyStructuralHoles(communities, adjacencyList);

    // Calculate influence paths
    const influencePaths = calculateInfluencePaths(nodes, adjacencyList);

    const result = {
      metrics: {
        nodeCount,
        edgeCount,
        density: Math.round(density * 1000) / 1000,
        averageClustering: Math.round(avgClustering * 1000) / 1000,
      },
      centrality: {
        eigenvector: Object.fromEntries(centrality.eigenvector),
        betweenness: Object.fromEntries(centrality.betweenness),
        closeness: Object.fromEntries(centrality.closeness),
        pageRank: Object.fromEntries(centrality.pageRank),
      },
      keyPlayers: {
        topInfluencers,
        bridgeConnectors,
        hubNodes,
      },
      communities,
      predictedConnections,
      structuralHoles,
      influencePaths,
      analyzedAt: new Date().toISOString(),
    };

    // Store analysis (upsert for idempotency)
    await supabase.from('ai_analyses').upsert({
      profile_id: profiles[0].id, // Store under first profile
      user_id: userId,
      analysis_type: 'network_graph',
      result: result,
      generated_at: new Date().toISOString()
    }, { onConflict: 'profile_id,analysis_type' });

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: userId,
      function_name: 'analyze-network-graph',
      model_name: 'local-graph',
      provider: 'local',
      estimated_cost_cents: 0,
      status: 'completed',
    });

    return new Response(JSON.stringify({
      success: true,
      analysis: result,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Network analysis error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateCentrality(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): CentralityScores {
  const eigenvector = calculateEigenvectorCentrality(nodes, adjacencyList);
  const betweenness = calculateBetweennessCentrality(nodes, adjacencyList);
  const closeness = calculateClosenessCentrality(nodes, adjacencyList);
  const pageRank = calculatePageRank(nodes, adjacencyList);

  return { eigenvector, betweenness, closeness, pageRank };
}

function calculateEigenvectorCentrality(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>,
  iterations: number = 100,
  tolerance: number = 1e-6
): Map<string, number> {
  const scores = new Map<string, number>();
  
  // Initialize with equal scores
  nodes.forEach(node => scores.set(node.id, 1 / nodes.length));

  for (let i = 0; i < iterations; i++) {
    const newScores = new Map<string, number>();
    let maxChange = 0;

    nodes.forEach(node => {
      let sum = 0;
      const neighbors = adjacencyList.get(node.id) || new Map();
      neighbors.forEach((weight, neighborId) => {
        sum += weight * (scores.get(neighborId) || 0);
      });
      newScores.set(node.id, sum);
    });

    // Normalize
    const norm = Math.sqrt(Array.from(newScores.values()).reduce((a, b) => a + b * b, 0));
    if (norm > 0) {
      newScores.forEach((value, key) => {
        const normalized = value / norm;
        maxChange = Math.max(maxChange, Math.abs(normalized - (scores.get(key) || 0)));
        scores.set(key, normalized);
      });
    }

    if (maxChange < tolerance) break;
  }

  return scores;
}

function calculateBetweennessCentrality(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): Map<string, number> {
  const betweenness = new Map<string, number>();
  nodes.forEach(node => betweenness.set(node.id, 0));

  // Brandes algorithm
  nodes.forEach(source => {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const distance = new Map<string, number>();
    const delta = new Map<string, number>();

    nodes.forEach(node => {
      predecessors.set(node.id, []);
      sigma.set(node.id, 0);
      distance.set(node.id, -1);
      delta.set(node.id, 0);
    });

    sigma.set(source.id, 1);
    distance.set(source.id, 0);

    const queue: string[] = [source.id];

    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);

      const neighbors = adjacencyList.get(v) || new Map();
      neighbors.forEach((_, w) => {
        if (distance.get(w) === -1) {
          distance.set(w, (distance.get(v) || 0) + 1);
          queue.push(w);
        }
        if (distance.get(w) === (distance.get(v) || 0) + 1) {
          sigma.set(w, (sigma.get(w) || 0) + (sigma.get(v) || 0));
          predecessors.get(w)?.push(v);
        }
      });
    }

    while (stack.length > 0) {
      const w = stack.pop()!;
      predecessors.get(w)?.forEach(v => {
        const contribution = ((sigma.get(v) || 0) / (sigma.get(w) || 1)) * (1 + (delta.get(w) || 0));
        delta.set(v, (delta.get(v) || 0) + contribution);
      });
      if (w !== source.id) {
        betweenness.set(w, (betweenness.get(w) || 0) + (delta.get(w) || 0));
      }
    }
  });

  // Normalize
  const n = nodes.length;
  if (n > 2) {
    const norm = 2 / ((n - 1) * (n - 2));
    betweenness.forEach((value, key) => {
      betweenness.set(key, value * norm);
    });
  }

  return betweenness;
}

function calculateClosenessCentrality(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): Map<string, number> {
  const closeness = new Map<string, number>();

  nodes.forEach(source => {
    const distances = bfsDistances(source.id, adjacencyList);
    let totalDistance = 0;
    let reachable = 0;

    distances.forEach((dist, nodeId) => {
      if (nodeId !== source.id && dist < Infinity) {
        totalDistance += dist;
        reachable++;
      }
    });

    const centrality = reachable > 0 ? reachable / totalDistance : 0;
    closeness.set(source.id, centrality);
  });

  return closeness;
}

function calculateAvgClustering(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): number {
  let totalCoeff = 0;
  let count = 0;

  nodes.forEach(node => {
    const neighbors = Array.from((adjacencyList.get(node.id) || new Map()).keys());
    if (neighbors.length < 2) return;

    let triangles = 0;
    const possible = (neighbors.length * (neighbors.length - 1)) / 2;

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const ni = adjacencyList.get(neighbors[i]) || new Map();
        if (ni.has(neighbors[j])) triangles++;
      }
    }

    if (possible > 0) {
      totalCoeff += triangles / possible;
      count++;
    }
  });

  return count > 0 ? totalCoeff / count : 0;
}

function calculatePageRank(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>,
  damping: number = 0.85,
  iterations: number = 100
): Map<string, number> {
  const n = nodes.length;
  const pageRank = new Map<string, number>();
  
  nodes.forEach(node => pageRank.set(node.id, 1 / n));

  for (let i = 0; i < iterations; i++) {
    const newRank = new Map<string, number>();
    
    nodes.forEach(node => {
      let incomingSum = 0;
      
      // Find all nodes that link to this node
      nodes.forEach(other => {
        const neighbors = adjacencyList.get(other.id) || new Map();
        if (neighbors.has(node.id)) {
          const outDegree = neighbors.size;
          if (outDegree > 0) {
            incomingSum += (pageRank.get(other.id) || 0) / outDegree;
          }
        }
      });

      newRank.set(node.id, (1 - damping) / n + damping * incomingSum);
    });

    // Copy new ranks
    newRank.forEach((value, key) => pageRank.set(key, value));
  }

  return pageRank;
}

function bfsDistances(
  source: string,
  adjacencyList: Map<string, Map<string, number>>
): Map<string, number> {
  const distances = new Map<string, number>();
  distances.set(source, 0);

  const queue = [source];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = distances.get(current) || 0;
    const neighbors = adjacencyList.get(current) || new Map();

    neighbors.forEach((_, neighbor) => {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, currentDist + 1);
        queue.push(neighbor);
      }
    });
  }

  return distances;
}

function detectCommunities(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): Community[] {
  // Label propagation algorithm
  const labels = new Map<string, number>();
  nodes.forEach((node, i) => labels.set(node.id, i));

  for (let iteration = 0; iteration < 50; iteration++) {
    let changed = false;
    
    // Shuffle nodes for randomness
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(node => {
      const neighbors = adjacencyList.get(node.id) || new Map();
      if (neighbors.size === 0) return;

      // Count neighbor labels
      const labelCounts = new Map<number, number>();
      neighbors.forEach((weight, neighborId) => {
        const label = labels.get(neighborId) || 0;
        labelCounts.set(label, (labelCounts.get(label) || 0) + weight);
      });

      // Find most common label
      let maxLabel = labels.get(node.id) || 0;
      let maxCount = 0;
      labelCounts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          maxLabel = label;
        }
      });

      if (maxLabel !== labels.get(node.id)) {
        labels.set(node.id, maxLabel);
        changed = true;
      }
    });

    if (!changed) break;
  }

  // Group nodes by community
  const communityMap = new Map<number, string[]>();
  labels.forEach((label, nodeId) => {
    const members = communityMap.get(label) || [];
    members.push(nodeId);
    communityMap.set(label, members);
  });

  // Build community objects
  const communities: Community[] = [];
  let communityId = 0;
  
  communityMap.forEach((members) => {
    if (members.length >= 2) {
      const cohesion = calculateCommunityCohesion(members, adjacencyList);
      const bridgeContacts = findBridgeContacts(members, adjacencyList, labels);
      
      communities.push({
        id: communityId++,
        members,
        cohesion,
        bridgeContacts,
      });
    }
  });

  return communities.sort((a, b) => b.members.length - a.members.length);
}

function calculateCommunityCohesion(
  members: string[],
  adjacencyList: Map<string, Map<string, number>>
): number {
  if (members.length < 2) return 1;

  let internalEdges = 0;
  let totalPossible = (members.length * (members.length - 1)) / 2;

  const memberSet = new Set(members);
  members.forEach(member => {
    const neighbors = adjacencyList.get(member) || new Map();
    neighbors.forEach((_, neighbor) => {
      if (memberSet.has(neighbor) && member < neighbor) {
        internalEdges++;
      }
    });
  });

  return totalPossible > 0 ? internalEdges / totalPossible : 0;
}

function findBridgeContacts(
  members: string[],
  adjacencyList: Map<string, Map<string, number>>,
  labels: Map<string, number>
): string[] {
  const bridges: string[] = [];
  const memberSet = new Set(members);
  const memberLabel = labels.get(members[0]);

  members.forEach(member => {
    const neighbors = adjacencyList.get(member) || new Map();
    let hasExternalConnection = false;
    
    neighbors.forEach((_, neighbor) => {
      if (!memberSet.has(neighbor) && labels.get(neighbor) !== memberLabel) {
        hasExternalConnection = true;
      }
    });

    if (hasExternalConnection) {
      bridges.push(member);
    }
  });

  return bridges;
}

function predictLinks(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>,
  limit: number
): { source: string; target: string; score: number; method: string }[] {
  const predictions: { source: string; target: string; score: number; method: string }[] = [];

  // Common neighbors + Adamic-Adar
  nodes.forEach((nodeA, i) => {
    nodes.slice(i + 1).forEach(nodeB => {
      const neighborsA = adjacencyList.get(nodeA.id) || new Map();
      const neighborsB = adjacencyList.get(nodeB.id) || new Map();

      // Skip if already connected
      if (neighborsA.has(nodeB.id)) return;

      // Find common neighbors
      const commonNeighbors: string[] = [];
      neighborsA.forEach((_, neighbor) => {
        if (neighborsB.has(neighbor)) {
          commonNeighbors.push(neighbor);
        }
      });

      if (commonNeighbors.length > 0) {
        // Adamic-Adar score
        let aaScore = 0;
        commonNeighbors.forEach(common => {
          const degree = (adjacencyList.get(common) || new Map()).size;
          if (degree > 1) {
            aaScore += 1 / Math.log(degree);
          }
        });

        predictions.push({
          source: nodeA.id,
          target: nodeB.id,
          score: aaScore,
          method: 'adamic_adar',
        });
      }
    });
  });

  return predictions
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function identifyStructuralHoles(
  communities: Community[],
  adjacencyList: Map<string, Map<string, number>>
): { nodeId: string; bridgedCommunities: number[]; score: number }[] {
  const holes: { nodeId: string; bridgedCommunities: number[]; score: number }[] = [];

  // Find nodes that bridge multiple communities
  const nodeToCommunity = new Map<string, number>();
  communities.forEach(comm => {
    comm.members.forEach(member => {
      nodeToCommunity.set(member, comm.id);
    });
  });

  communities.forEach(comm => {
    comm.bridgeContacts.forEach(bridge => {
      const neighbors = adjacencyList.get(bridge) || new Map();
      const connectedCommunities = new Set<number>();
      
      neighbors.forEach((_, neighbor) => {
        const neighborComm = nodeToCommunity.get(neighbor);
        if (neighborComm !== undefined && neighborComm !== comm.id) {
          connectedCommunities.add(neighborComm);
        }
      });

      if (connectedCommunities.size > 0) {
        holes.push({
          nodeId: bridge,
          bridgedCommunities: [comm.id, ...connectedCommunities],
          score: connectedCommunities.size / (communities.length - 1),
        });
      }
    });
  });

  return holes.sort((a, b) => b.score - a.score);
}

function calculateInfluencePaths(
  nodes: NetworkNode[],
  adjacencyList: Map<string, Map<string, number>>
): { from: string; to: string; pathLength: number; intermediaries: string[] }[] {
  const paths: { from: string; to: string; pathLength: number; intermediaries: string[] }[] = [];

  // Find shortest paths between high-degree nodes
  const degrees = new Map<string, number>();
  nodes.forEach(node => {
    degrees.set(node.id, (adjacencyList.get(node.id) || new Map()).size);
  });

  const highDegreeNodes = nodes
    .filter(n => (degrees.get(n.id) || 0) >= 3)
    .slice(0, 10);

  highDegreeNodes.forEach((source, i) => {
    highDegreeNodes.slice(i + 1).forEach(target => {
      const path = findShortestPath(source.id, target.id, adjacencyList);
      if (path && path.length > 2) {
        paths.push({
          from: source.id,
          to: target.id,
          pathLength: path.length - 1,
          intermediaries: path.slice(1, -1),
        });
      }
    });
  });

  return paths.slice(0, 20);
}

function findShortestPath(
  source: string,
  target: string,
  adjacencyList: Map<string, Map<string, number>>
): string[] | null {
  const visited = new Set<string>();
  const queue: { node: string; path: string[] }[] = [{ node: source, path: [source] }];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    
    if (node === target) return path;
    
    if (visited.has(node)) continue;
    visited.add(node);

    const neighbors = adjacencyList.get(node) || new Map();
    neighbors.forEach((_, neighbor) => {
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, path: [...path, neighbor] });
      }
    });
  }

  return null;
}

function getTopNodes(scores: Map<string, number>, limit: number): string[] {
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
