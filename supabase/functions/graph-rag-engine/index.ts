import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GraphRAGRequest {
  action: 'build' | 'query' | 'traverse' | 'communities';
  profileId?: string;
  query?: string;
  maxHops?: number;
  startNodeId?: string;
}

interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, any>;
  centrality?: number;
  communityId?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
  properties?: Record<string, any>;
}

// Build knowledge graph from profile data
async function buildKnowledgeGraph(
  supabase: any,
  userId: string,
  profileId?: string
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, string>();

  // Get profiles
  let profileQuery = supabase.from('profiles').select('*').eq('user_id', userId);
  if (profileId) {
    profileQuery = profileQuery.eq('id', profileId);
  }
  const { data: profiles } = await profileQuery.limit(100);

  // Create person nodes
  for (const profile of profiles || []) {
    const nodeId = `person_${profile.id}`;
    nodes.push({
      id: nodeId,
      type: 'person',
      label: profile.name || 'Unknown',
      properties: {
        profileId: profile.id,
        email: profile.email,
        company: profile.company,
        title: profile.title,
        trustLevel: profile.trust_level,
        relationshipStrength: profile.relationship_strength
      }
    });
    nodeMap.set(profile.id, nodeId);

    // Create organization nodes
    if (profile.company) {
      const orgNodeId = `org_${profile.company.toLowerCase().replace(/\s+/g, '_')}`;
      if (!nodes.find(n => n.id === orgNodeId)) {
        nodes.push({
          id: orgNodeId,
          type: 'organization',
          label: profile.company,
          properties: { name: profile.company }
        });
      }
      edges.push({
        source: nodeId,
        target: orgNodeId,
        type: 'works_at',
        weight: 1
      });
    }

    // Create topic nodes from interests
    const interests = profile.interests || [];
    for (const interest of interests) {
      const topicNodeId = `topic_${interest.toLowerCase().replace(/\s+/g, '_')}`;
      if (!nodes.find(n => n.id === topicNodeId)) {
        nodes.push({
          id: topicNodeId,
          type: 'topic',
          label: interest,
          properties: { name: interest }
        });
      }
      edges.push({
        source: nodeId,
        target: topicNodeId,
        type: 'interested_in',
        weight: 0.5
      });
    }
  }

  // Get relationships
  const { data: relationships } = await supabase
    .from('contact_relationships')
    .select('*')
    .eq('user_id', userId)
    .limit(500);

  for (const rel of relationships || []) {
    const sourceNode = nodeMap.get(rel.source_profile_id);
    const targetNode = nodeMap.get(rel.target_profile_id);
    
    if (sourceNode && targetNode) {
      edges.push({
        source: sourceNode,
        target: targetNode,
        type: rel.relationship_type || 'connected_to',
        weight: (rel.strength || 50) / 100,
        properties: {
          relationshipId: rel.id,
          strength: rel.strength,
          type: rel.relationship_type
        }
      });
    }
  }

  // Get interactions and create event nodes
  const { data: interactions } = await supabase
    .from('contact_interaction_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  for (const interaction of interactions || []) {
    const personNode = nodeMap.get(interaction.profile_id);
    if (!personNode) continue;

    const eventNodeId = `event_${interaction.id}`;
    nodes.push({
      id: eventNodeId,
      type: 'event',
      label: `${interaction.interaction_type || 'interaction'} - ${new Date(interaction.interaction_date).toLocaleDateString()}`,
      properties: {
        interactionId: interaction.id,
        type: interaction.interaction_type,
        date: interaction.interaction_date,
        sentiment: interaction.sentiment_score
      }
    });

    edges.push({
      source: personNode,
      target: eventNodeId,
      type: 'participated_in',
      weight: 0.3
    });

    // Connect topics from interaction
    const topics = interaction.topics_discussed || [];
    for (const topic of topics) {
      const topicNodeId = `topic_${topic.toLowerCase().replace(/\s+/g, '_')}`;
      if (!nodes.find(n => n.id === topicNodeId)) {
        nodes.push({
          id: topicNodeId,
          type: 'topic',
          label: topic,
          properties: { name: topic }
        });
      }
      edges.push({
        source: eventNodeId,
        target: topicNodeId,
        type: 'about',
        weight: 0.2
      });
    }
  }

  return { nodes, edges };
}

// Calculate node centrality scores
function calculateCentrality(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const centrality = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Build adjacency list
  for (const node of nodes) {
    adjacency.set(node.id, []);
    centrality.set(node.id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  // PageRank-like calculation
  const dampingFactor = 0.85;
  const iterations = 20;
  const numNodes = nodes.length;
  
  // Initialize
  for (const node of nodes) {
    centrality.set(node.id, 1 / numNodes);
  }

  for (let i = 0; i < iterations; i++) {
    const newCentrality = new Map<string, number>();
    
    for (const node of nodes) {
      let rank = (1 - dampingFactor) / numNodes;
      
      for (const [sourceId, targets] of adjacency) {
        if (targets.includes(node.id)) {
          rank += dampingFactor * (centrality.get(sourceId) || 0) / targets.length;
        }
      }
      
      newCentrality.set(node.id, rank);
    }
    
    for (const [id, rank] of newCentrality) {
      centrality.set(id, rank);
    }
  }

  // Normalize to 0-100
  const maxRank = Math.max(...centrality.values());
  for (const [id, rank] of centrality) {
    centrality.set(id, (rank / maxRank) * 100);
  }

  return centrality;
}

// Detect communities using label propagation
function detectCommunities(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
  const communities = new Map<string, number>();
  const adjacency = new Map<string, Array<{ neighbor: string; weight: number }>>();

  // Build weighted adjacency
  for (const node of nodes) {
    adjacency.set(node.id, []);
    communities.set(node.id, nodes.indexOf(node)); // Initial community = index
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push({ neighbor: edge.target, weight: edge.weight });
    adjacency.get(edge.target)?.push({ neighbor: edge.source, weight: edge.weight });
  }

  // Label propagation
  const maxIterations = 10;
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    
    // Shuffle nodes for random order
    const shuffledNodes = [...nodes].sort(() => Math.random() - 0.5);
    
    for (const node of shuffledNodes) {
      const neighbors = adjacency.get(node.id) || [];
      if (neighbors.length === 0) continue;

      // Count community votes weighted by edge weight
      const votes = new Map<number, number>();
      for (const { neighbor, weight } of neighbors) {
        const community = communities.get(neighbor)!;
        votes.set(community, (votes.get(community) || 0) + weight);
      }

      // Find max vote
      let maxVotes = 0;
      let maxCommunity = communities.get(node.id)!;
      for (const [community, voteCount] of votes) {
        if (voteCount > maxVotes) {
          maxVotes = voteCount;
          maxCommunity = community;
        }
      }

      if (maxCommunity !== communities.get(node.id)) {
        communities.set(node.id, maxCommunity);
        changed = true;
      }
    }

    if (!changed) break;
  }

  // Renumber communities to be sequential
  const communityMap = new Map<number, number>();
  let nextCommunity = 0;
  for (const [nodeId, community] of communities) {
    if (!communityMap.has(community)) {
      communityMap.set(community, nextCommunity++);
    }
    communities.set(nodeId, communityMap.get(community)!);
  }

  return communities;
}

// Multi-hop graph traversal
function traverseGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  startNodeId: string,
  maxHops: number
): { visited: string[]; paths: string[][] } {
  const visited = new Set<string>();
  const paths: string[][] = [];
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  function dfs(nodeId: string, path: string[], depth: number) {
    if (depth > maxHops) return;
    
    visited.add(nodeId);
    path.push(nodeId);
    
    if (path.length > 1) {
      paths.push([...path]);
    }

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (!path.includes(neighbor)) {
        dfs(neighbor, path, depth + 1);
      }
    }
    
    path.pop();
  }

  dfs(startNodeId, [], 0);
  
  return { visited: Array.from(visited), paths };
}

// Query the graph with semantic matching
function queryGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  query: string,
  centrality: Map<string, number>,
  communities: Map<string, number>
): any[] {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const results: Array<{ node: GraphNode; score: number; context: any }> = [];

  for (const node of nodes) {
    let score = 0;
    const label = node.label.toLowerCase();
    const props = JSON.stringify(node.properties).toLowerCase();

    // Term matching
    for (const term of queryTerms) {
      if (label.includes(term)) score += 10;
      if (props.includes(term)) score += 5;
    }

    // Boost by centrality
    score *= 1 + (centrality.get(node.id) || 0) / 100;

    if (score > 0) {
      // Find connected nodes for context
      const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
      const connectedNodes = connectedEdges.map(e => 
        e.source === node.id ? e.target : e.source
      ).slice(0, 5);

      results.push({
        node: {
          ...node,
          centrality: centrality.get(node.id),
          communityId: communities.get(node.id)
        },
        score,
        context: {
          connectedTo: connectedNodes,
          edgeCount: connectedEdges.length,
          community: communities.get(node.id)
        }
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, profileId, query, maxHops, startNodeId } = await req.json() as GraphRAGRequest;

    console.log(`[GraphRAG] Action: ${action}`);

    // Build the knowledge graph
    const { nodes, edges } = await buildKnowledgeGraph(supabase, user.id, profileId);
    
    // Calculate metrics
    const centrality = calculateCentrality(nodes, edges);
    const communities = detectCommunities(nodes, edges);

    // Update nodes with metrics
    for (const node of nodes) {
      node.centrality = centrality.get(node.id);
      node.communityId = communities.get(node.id);
    }

    // Store nodes and edges in database
    if (action === 'build') {
      // Clear existing graph
      await supabase.from('knowledge_graph_edges').delete().eq('user_id', user.id);
      await supabase.from('knowledge_graph_nodes').delete().eq('user_id', user.id);

      // Insert nodes
      const nodeInserts = nodes.map(n => ({
        user_id: user.id,
        node_type: n.type,
        node_label: n.label,
        properties: n.properties,
        centrality_score: n.centrality,
        community_id: n.communityId,
        source_entity_id: n.properties.profileId || null,
        source_entity_type: n.type
      }));

      const { data: insertedNodes } = await supabase
        .from('knowledge_graph_nodes')
        .insert(nodeInserts)
        .select();

      // Create node ID mapping
      const dbNodeMap = new Map<string, string>();
      if (insertedNodes) {
        nodes.forEach((n, i) => {
          if (insertedNodes[i]) {
            dbNodeMap.set(n.id, insertedNodes[i].id);
          }
        });

        // Insert edges
        const edgeInserts = edges
          .filter(e => dbNodeMap.has(e.source) && dbNodeMap.has(e.target))
          .map(e => ({
            user_id: user.id,
            source_node_id: dbNodeMap.get(e.source),
            target_node_id: dbNodeMap.get(e.target),
            relationship_type: e.type,
            weight: e.weight,
            properties: e.properties || {}
          }));

        await supabase.from('knowledge_graph_edges').insert(edgeInserts);
      }
    }

    let result: any = {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      communityCount: new Set(communities.values()).size
    };

    if (action === 'build') {
      // Get community summaries
      const communityStats = new Map<number, { count: number; types: string[] }>();
      for (const node of nodes) {
        const cid = node.communityId!;
        if (!communityStats.has(cid)) {
          communityStats.set(cid, { count: 0, types: [] });
        }
        communityStats.get(cid)!.count++;
        if (!communityStats.get(cid)!.types.includes(node.type)) {
          communityStats.get(cid)!.types.push(node.type);
        }
      }

      result = {
        ...result,
        status: 'built',
        topCentralNodes: nodes
          .sort((a, b) => (b.centrality || 0) - (a.centrality || 0))
          .slice(0, 10)
          .map(n => ({ id: n.id, label: n.label, type: n.type, centrality: Math.round(n.centrality || 0) })),
        communities: Array.from(communityStats.entries()).map(([id, stats]) => ({
          id,
          memberCount: stats.count,
          nodeTypes: stats.types
        }))
      };
    }

    if (action === 'query' && query) {
      const queryResults = queryGraph(nodes, edges, query, centrality, communities);
      result = {
        ...result,
        query,
        results: queryResults.map(r => ({
          nodeId: r.node.id,
          label: r.node.label,
          type: r.node.type,
          score: Math.round(r.score),
          centrality: Math.round(r.node.centrality || 0),
          community: r.context.community,
          connections: r.context.edgeCount
        }))
      };
    }

    if (action === 'traverse' && startNodeId) {
      const traversalResult = traverseGraph(nodes, edges, startNodeId, maxHops || 3);
      result = {
        ...result,
        startNode: startNodeId,
        maxHops: maxHops || 3,
        nodesReached: traversalResult.visited.length,
        paths: traversalResult.paths.slice(0, 20)
      };
    }

    if (action === 'communities') {
      const communityNodes = new Map<number, GraphNode[]>();
      for (const node of nodes) {
        const cid = node.communityId!;
        if (!communityNodes.has(cid)) {
          communityNodes.set(cid, []);
        }
        communityNodes.get(cid)!.push(node);
      }

      result = {
        ...result,
        communities: Array.from(communityNodes.entries()).map(([id, members]) => ({
          id,
          size: members.length,
          members: members.slice(0, 10).map(m => ({
            id: m.id,
            label: m.label,
            type: m.type,
            centrality: Math.round(m.centrality || 0)
          })),
          topNode: members.sort((a, b) => (b.centrality || 0) - (a.centrality || 0))[0]?.label
        }))
      };
    }

    console.log(`[GraphRAG] Complete. ${nodes.length} nodes, ${edges.length} edges`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GraphRAG] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
