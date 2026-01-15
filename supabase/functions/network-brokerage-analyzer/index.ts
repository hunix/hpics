import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Network Brokerage Analyzer
 * Implements structural holes theory (Ronald Burt) for power positioning:
 * - Structural hole identification
 * - Brokerage position calculation
 * - Network constraint analysis
 * - Tertius Gaudens positioning
 * - Bridge opportunity detection
 */

interface NetworkNode {
  id: string;
  name: string;
  group?: string;
  influence: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
}

interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface StructuralHole {
  node_a: string;
  node_b: string;
  disconnection_score: number;
  bridge_value: number;
  groups_connected: string[];
  exploitation_strategy: string;
}

interface BrokeragePosition {
  node_id: string;
  brokerage_score: number;
  constraint_score: number;
  betweenness: number;
  bridges_controlled: number;
  structural_holes: StructuralHole[];
  tertius_gaudens_opportunities: {
    parties: string[];
    play: string;
    benefit: string;
  }[];
  power_position: 'central_broker' | 'bridge' | 'peripheral' | 'gatekeeper';
  recommendations: string[];
}

interface ClusterAnalysis {
  cluster_id: number;
  members: string[];
  density: number;
  key_connector: string;
  external_connections: {
    to_cluster: number;
    through: string;
    strength: number;
  }[];
}

function buildAdjacencyList(graph: NetworkGraph): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  
  graph.nodes.forEach(node => {
    adj.set(node.id, new Set());
  });
  
  graph.edges.forEach(edge => {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  });
  
  return adj;
}

function calculateBetweenness(graph: NetworkGraph): Map<string, number> {
  const betweenness = new Map<string, number>();
  graph.nodes.forEach(node => betweenness.set(node.id, 0));
  
  const adj = buildAdjacencyList(graph);
  
  // Simplified betweenness calculation
  graph.nodes.forEach(source => {
    const distances = new Map<string, number>();
    const paths = new Map<string, number>();
    const queue: string[] = [source.id];
    
    distances.set(source.id, 0);
    paths.set(source.id, 1);
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDist = distances.get(current)!;
      
      adj.get(current)?.forEach(neighbor => {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, currentDist + 1);
          paths.set(neighbor, paths.get(current)!);
          queue.push(neighbor);
        } else if (distances.get(neighbor) === currentDist + 1) {
          paths.set(neighbor, paths.get(neighbor)! + paths.get(current)!);
        }
      });
    }
    
    // Count paths through each node
    graph.nodes.forEach(target => {
      if (target.id !== source.id) {
        graph.nodes.forEach(intermediate => {
          if (intermediate.id !== source.id && intermediate.id !== target.id) {
            // Check if intermediate is on shortest path
            const dSI = distances.get(intermediate.id);
            const dIT = distances.get(target.id);
            const dST = distances.get(target.id);
            
            if (dSI !== undefined && dIT !== undefined && dST !== undefined) {
              if (dSI + 1 === dST) {
                const contribution = (paths.get(intermediate.id) || 0) / (paths.get(target.id) || 1);
                betweenness.set(intermediate.id, (betweenness.get(intermediate.id) || 0) + contribution);
              }
            }
          }
        });
      }
    });
  });
  
  // Normalize
  const maxBetweenness = Math.max(...Array.from(betweenness.values())) || 1;
  betweenness.forEach((value, key) => {
    betweenness.set(key, value / maxBetweenness);
  });
  
  return betweenness;
}

function calculateConstraint(nodeId: string, graph: NetworkGraph): number {
  const adj = buildAdjacencyList(graph);
  const neighbors = adj.get(nodeId) || new Set();
  
  if (neighbors.size === 0) return 1; // Fully constrained if no connections
  
  let constraint = 0;
  
  neighbors.forEach(neighbor => {
    // Calculate proportion of investment in this neighbor
    const pij = 1 / neighbors.size;
    
    // Calculate indirect constraint (neighbors who are also connected to each other)
    let indirectConstraint = 0;
    neighbors.forEach(otherNeighbor => {
      if (otherNeighbor !== neighbor) {
        const neighborAdj = adj.get(neighbor) || new Set();
        if (neighborAdj.has(otherNeighbor)) {
          indirectConstraint += (1 / neighbors.size) * (1 / (neighborAdj.size || 1));
        }
      }
    });
    
    constraint += Math.pow(pij + indirectConstraint, 2);
  });
  
  return Math.min(1, constraint);
}

function identifyStructuralHoles(graph: NetworkGraph): StructuralHole[] {
  const holes: StructuralHole[] = [];
  const adj = buildAdjacencyList(graph);
  const nodeGroups = new Map(graph.nodes.map(n => [n.id, n.group || 'default']));
  
  // Find pairs of nodes that are not connected but have a common connection
  graph.nodes.forEach((nodeA, i) => {
    graph.nodes.slice(i + 1).forEach(nodeB => {
      const aNeighbors = adj.get(nodeA.id) || new Set();
      const bNeighbors = adj.get(nodeB.id) || new Set();
      
      // Check if not directly connected
      if (!aNeighbors.has(nodeB.id)) {
        // Check if different groups
        const groupA = nodeGroups.get(nodeA.id);
        const groupB = nodeGroups.get(nodeB.id);
        
        if (groupA !== groupB) {
          const disconnectionScore = 1 - (
            [...aNeighbors].filter(n => bNeighbors.has(n)).length / 
            Math.max(aNeighbors.size, bNeighbors.size, 1)
          );
          
          if (disconnectionScore > 0.7) {
            holes.push({
              node_a: nodeA.name,
              node_b: nodeB.name,
              disconnection_score: disconnectionScore,
              bridge_value: (nodeA.influence + nodeB.influence) / 2,
              groups_connected: [groupA || 'unknown', groupB || 'unknown'],
              exploitation_strategy: `Bridge ${nodeA.name} and ${nodeB.name} to control information flow between ${groupA} and ${groupB}`
            });
          }
        }
      }
    });
  });
  
  return holes.sort((a, b) => b.bridge_value - a.bridge_value);
}

function findTertiusGaudens(graph: NetworkGraph, userId: string): BrokeragePosition['tertius_gaudens_opportunities'] {
  const opportunities: BrokeragePosition['tertius_gaudens_opportunities'] = [];
  const adj = buildAdjacencyList(graph);
  
  const userNeighbors = adj.get(userId) || new Set();
  
  // Find pairs of user's connections who are not connected to each other
  const neighborList = [...userNeighbors];
  for (let i = 0; i < neighborList.length; i++) {
    for (let j = i + 1; j < neighborList.length; j++) {
      const neighborA = neighborList[i];
      const neighborB = neighborList[j];
      
      const aNeighbors = adj.get(neighborA) || new Set();
      
      if (!aNeighbors.has(neighborB)) {
        const nodeA = graph.nodes.find(n => n.id === neighborA);
        const nodeB = graph.nodes.find(n => n.id === neighborB);
        
        if (nodeA && nodeB) {
          opportunities.push({
            parties: [nodeA.name, nodeB.name],
            play: 'Control information flow and frame narratives between these parties',
            benefit: 'Play each side, extract value from both, or create dependency'
          });
        }
      }
    }
  }
  
  return opportunities.slice(0, 10); // Top 10 opportunities
}

function determinePowerPosition(
  brokerageScore: number,
  constraintScore: number,
  betweenness: number,
  bridgesControlled: number
): BrokeragePosition['power_position'] {
  if (brokerageScore > 0.7 && constraintScore < 0.3) {
    return 'central_broker';
  } else if (bridgesControlled > 2 && betweenness > 0.5) {
    return 'gatekeeper';
  } else if (bridgesControlled > 0) {
    return 'bridge';
  } else {
    return 'peripheral';
  }
}

function analyzeNetworkPosition(
  userId: string,
  graph: NetworkGraph
): BrokeragePosition {
  const adj = buildAdjacencyList(graph);
  const betweennessMap = calculateBetweenness(graph);
  const structuralHoles = identifyStructuralHoles(graph);
  
  const betweenness = betweennessMap.get(userId) || 0;
  const constraint = calculateConstraint(userId, graph);
  
  // Calculate brokerage score (inverse of constraint)
  const brokerageScore = 1 - constraint;
  
  // Find bridges this user controls
  const userHoles = structuralHoles.filter(hole => {
    const neighbors = adj.get(userId) || new Set();
    return graph.nodes.some(n => n.name === hole.node_a && neighbors.has(n.id)) &&
           graph.nodes.some(n => n.name === hole.node_b && neighbors.has(n.id));
  });
  
  const tertiusOpportunities = findTertiusGaudens(graph, userId);
  
  const powerPosition = determinePowerPosition(
    brokerageScore, 
    constraint, 
    betweenness,
    userHoles.length
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (constraint > 0.6) {
    recommendations.push('High network constraint: Diversify connections across different groups');
  }
  
  if (userHoles.length > 0) {
    recommendations.push(`You control ${userHoles.length} structural hole(s) - leverage these for information arbitrage`);
  }
  
  if (tertiusOpportunities.length > 0) {
    recommendations.push(`${tertiusOpportunities.length} tertius gaudens opportunities available - play disconnected parties`);
  }
  
  if (betweenness > 0.5) {
    recommendations.push('High betweenness: Many paths go through you - use gatekeeper power strategically');
  } else {
    recommendations.push('Low betweenness: Seek introductions to connect disparate groups');
  }
  
  return {
    node_id: userId,
    brokerage_score: brokerageScore,
    constraint_score: constraint,
    betweenness,
    bridges_controlled: userHoles.length,
    structural_holes: userHoles,
    tertius_gaudens_opportunities: tertiusOpportunities,
    power_position: powerPosition,
    recommendations
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, network_graph, target_node_id } = await req.json();

    let result;

    switch (action) {
      case 'analyze_position':
        if (!network_graph || !target_node_id) {
          throw new Error('network_graph and target_node_id required');
        }
        result = analyzeNetworkPosition(target_node_id, network_graph);
        break;
        
      case 'identify_holes':
        if (!network_graph) {
          throw new Error('network_graph required');
        }
        result = {
          structural_holes: identifyStructuralHoles(network_graph),
          total_holes: identifyStructuralHoles(network_graph).length,
          bridge_opportunities: identifyStructuralHoles(network_graph).slice(0, 5)
        };
        break;
        
      case 'calculate_constraint':
        if (!network_graph || !target_node_id) {
          throw new Error('network_graph and target_node_id required');
        }
        const constraint = calculateConstraint(target_node_id, network_graph);
        result = {
          node_id: target_node_id,
          constraint_score: constraint,
          interpretation: constraint > 0.6 
            ? 'High constraint: Your contacts are well connected to each other, limiting your brokerage power'
            : 'Low constraint: Your contacts are not well connected, giving you brokerage opportunities'
        };
        break;
        
      case 'find_tertius':
        if (!network_graph || !target_node_id) {
          throw new Error('network_graph and target_node_id required');
        }
        result = {
          opportunities: findTertiusGaudens(network_graph, target_node_id),
          strategy: 'The "third who benefits" - profit from the tension or lack of connection between others'
        };
        break;
        
      case 'build_from_contacts':
        // Build network graph from user's contacts
        const { data: profiles } = await supabaseClient
          .from('profiles')
          .select('id, first_name, last_name, company, relationship_score')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        const { data: relationships } = await supabaseClient
          .from('profile_relationships')
          .select('source_profile_id, target_profile_id, relationship_type, strength')
          .eq('user_id', user.id);
        
        if (profiles && relationships) {
          const graph: NetworkGraph = {
            nodes: [
              { id: 'user', name: 'You', influence: 1 },
              ...profiles.map(p => ({
                id: p.id,
                name: `${p.first_name} ${p.last_name}`.trim() || 'Unknown',
                group: p.company || 'default',
                influence: (p.relationship_score || 50) / 100
              }))
            ],
            edges: [
              ...profiles.map(p => ({
                source: 'user',
                target: p.id,
                strength: (p.relationship_score || 50) / 100
              })),
              ...(relationships || []).map(r => ({
                source: r.source_profile_id,
                target: r.target_profile_id,
                strength: r.strength || 0.5
              }))
            ]
          };
          
          result = analyzeNetworkPosition('user', graph);
          
          // Store analysis
          await supabaseClient.from('network_brokerage').upsert({
            user_id: user.id,
            profile_id: null, // This is user's own analysis
            brokerage_score: result.brokerage_score,
            constraint_score: result.constraint_score,
            betweenness_centrality: result.betweenness,
            structural_holes_bridged: result.bridges_controlled,
            disconnected_clusters: result.structural_holes,
            bridge_opportunities: result.structural_holes.slice(0, 5),
            tertius_gaudens_positions: result.tertius_gaudens_opportunities,
            network_control_coefficient: result.brokerage_score * (1 - result.constraint_score),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,profile_id'
          });
        } else {
          result = { error: 'No contacts found to analyze' };
        }
        break;
        
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Network brokerage analyzer error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
