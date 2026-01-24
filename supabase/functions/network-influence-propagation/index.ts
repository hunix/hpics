import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NetworkNode {
  id: string;
  name: string;
  influence_susceptibility: number; // 0-1
  influence_power: number; // 0-1
  current_state: 'susceptible' | 'influenced' | 'resistant';
  recovery_rate: number; // Rate of becoming resistant
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number; // Influence strength
  direction: 'unidirectional' | 'bidirectional';
}

interface PropagationRequest {
  userId: string;
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  seedNodes: string[]; // Initial influencers
  propagationModel: 'sir' | 'independent_cascade' | 'linear_threshold';
  simulationSteps: number;
  interventionNodes?: string[]; // Nodes to protect/target
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userId,
      nodes,
      edges,
      seedNodes,
      propagationModel,
      simulationSteps,
      interventionNodes = [],
    }: PropagationRequest = await req.json();

    // Build adjacency list with weights
    const adjacency: Record<string, { target: string; weight: number }[]> = {};
    for (const node of nodes) {
      adjacency[node.id] = [];
    }
    for (const edge of edges) {
      adjacency[edge.source].push({ target: edge.target, weight: edge.weight });
      if (edge.direction === 'bidirectional') {
        adjacency[edge.target].push({ target: edge.source, weight: edge.weight });
      }
    }

    // Initialize node states
    const nodeStates: Record<string, 'susceptible' | 'influenced' | 'resistant'> = {};
    const nodeMap: Record<string, NetworkNode> = {};
    for (const node of nodes) {
      nodeStates[node.id] = seedNodes.includes(node.id) ? 'influenced' : node.current_state;
      nodeMap[node.id] = node;
    }

    // Run propagation simulation
    const timeline: {
      step: number;
      susceptible: number;
      influenced: number;
      resistant: number;
      newly_influenced: string[];
    }[] = [];

    const influenceHistory: Record<string, { influenced_at: number; influenced_by: string | null }> = {};
    for (const seed of seedNodes) {
      influenceHistory[seed] = { influenced_at: 0, influenced_by: null };
    }

    for (let step = 0; step <= simulationSteps; step++) {
      const newlyInfluenced: string[] = [];
      const newStates = { ...nodeStates };

      if (propagationModel === 'sir') {
        // SIR Model
        for (const node of nodes) {
          if (nodeStates[node.id] === 'susceptible') {
            // Check if neighbors influence this node
            let influenceProbability = 0;
            let influencer: string | null = null;

            for (const neighbor of adjacency[node.id]) {
              if (nodeStates[neighbor.target] === 'influenced') {
                const influence = neighbor.weight * nodeMap[neighbor.target].influence_power * node.influence_susceptibility;
                if (influence > influenceProbability) {
                  influenceProbability = influence;
                  influencer = neighbor.target;
                }
              }
            }

            if (Math.random() < influenceProbability) {
              newStates[node.id] = 'influenced';
              newlyInfluenced.push(node.id);
              influenceHistory[node.id] = { influenced_at: step, influenced_by: influencer };
            }
          } else if (nodeStates[node.id] === 'influenced') {
            // Recovery
            if (Math.random() < node.recovery_rate) {
              newStates[node.id] = 'resistant';
            }
          }
        }
      } else if (propagationModel === 'independent_cascade') {
        // Independent Cascade Model
        const justInfluenced = Object.entries(nodeStates)
          .filter(([_, state]) => state === 'influenced')
          .filter(([id, _]) => influenceHistory[id]?.influenced_at === step - 1 || step === 0)
          .map(([id, _]) => id);

        for (const influencerId of justInfluenced) {
          for (const neighbor of adjacency[influencerId]) {
            if (nodeStates[neighbor.target] === 'susceptible') {
              const node = nodeMap[neighbor.target];
              const probability = neighbor.weight * nodeMap[influencerId].influence_power * node.influence_susceptibility;
              
              if (Math.random() < probability) {
                newStates[neighbor.target] = 'influenced';
                newlyInfluenced.push(neighbor.target);
                influenceHistory[neighbor.target] = { influenced_at: step, influenced_by: influencerId };
              }
            }
          }
        }
      } else if (propagationModel === 'linear_threshold') {
        // Linear Threshold Model
        for (const node of nodes) {
          if (nodeStates[node.id] === 'susceptible') {
            let totalInfluence = 0;
            let maxInfluencer: string | null = null;
            let maxInfluence = 0;

            for (const neighbor of adjacency[node.id]) {
              if (nodeStates[neighbor.target] === 'influenced') {
                const influence = neighbor.weight * nodeMap[neighbor.target].influence_power;
                totalInfluence += influence;
                if (influence > maxInfluence) {
                  maxInfluence = influence;
                  maxInfluencer = neighbor.target;
                }
              }
            }

            const threshold = 1 - node.influence_susceptibility;
            if (totalInfluence >= threshold) {
              newStates[node.id] = 'influenced';
              newlyInfluenced.push(node.id);
              influenceHistory[node.id] = { influenced_at: step, influenced_by: maxInfluencer };
            }
          }
        }
      }

      Object.assign(nodeStates, newStates);

      const counts = {
        susceptible: Object.values(nodeStates).filter(s => s === 'susceptible').length,
        influenced: Object.values(nodeStates).filter(s => s === 'influenced').length,
        resistant: Object.values(nodeStates).filter(s => s === 'resistant').length,
      };

      timeline.push({
        step,
        ...counts,
        newly_influenced: newlyInfluenced,
      });

      // Early termination if no more changes possible
      if (step > 0 && newlyInfluenced.length === 0 && 
          timeline[step].influenced === timeline[step - 1].influenced) {
        break;
      }
    }

    // Calculate influence maximization metrics
    const influenceSpread = Object.values(nodeStates).filter(s => s !== 'susceptible').length;
    const spreadPercentage = (influenceSpread / nodes.length) * 100;

    // Identify key spreaders (nodes that influenced the most others)
    const spreaderCounts: Record<string, number> = {};
    for (const [_, history] of Object.entries(influenceHistory)) {
      if (history.influenced_by) {
        spreaderCounts[history.influenced_by] = (spreaderCounts[history.influenced_by] || 0) + 1;
      }
    }

    const keySpreaders = Object.entries(spreaderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({
        node_id: id,
        name: nodeMap[id]?.name || id,
        influenced_count: count,
        influence_power: nodeMap[id]?.influence_power || 0,
      }));

    // Identify firebreaks (critical nodes to block propagation)
    const firebreaks = nodes
      .filter(n => adjacency[n.id].length > 3)
      .filter(n => nodeStates[n.id] === 'susceptible' || interventionNodes.includes(n.id))
      .map(n => ({
        node_id: n.id,
        name: n.name,
        connection_count: adjacency[n.id].length,
        blocking_impact: estimateBlockingImpact(n.id, adjacency, nodeStates),
      }))
      .sort((a, b) => b.blocking_impact - a.blocking_impact)
      .slice(0, 5);

    // Echo chamber detection (highly connected influenced clusters)
    const echoChambers = detectEchoChambers(nodes, edges, nodeStates);

    return new Response(
      JSON.stringify({
        user_id: userId,
        propagation_model: propagationModel,
        simulation_steps: timeline.length - 1,
        final_state: {
          susceptible: timeline[timeline.length - 1].susceptible,
          influenced: timeline[timeline.length - 1].influenced,
          resistant: timeline[timeline.length - 1].resistant,
        },
        influence_spread: influenceSpread,
        spread_percentage: spreadPercentage,
        timeline,
        key_spreaders: keySpreaders,
        firebreaks,
        echo_chambers: echoChambers,
        influence_history: influenceHistory,
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Network Influence Propagation error:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function estimateBlockingImpact(
  nodeId: string,
  adjacency: Record<string, { target: string; weight: number }[]>,
  nodeStates: Record<string, string>
): number {
  // Count downstream susceptible nodes
  const visited = new Set<string>();
  let impact = 0;

  function dfs(current: string) {
    if (visited.has(current)) return;
    visited.add(current);
    
    for (const neighbor of adjacency[current] || []) {
      if (nodeStates[neighbor.target] === 'susceptible') {
        impact += neighbor.weight;
        dfs(neighbor.target);
      }
    }
  }

  for (const neighbor of adjacency[nodeId] || []) {
    if (nodeStates[neighbor.target] === 'susceptible') {
      dfs(neighbor.target);
    }
  }

  return impact;
}

function detectEchoChambers(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  nodeStates: Record<string, string>
): { nodes: string[]; density: number; homogeneity: number }[] {
  // Simple clustering by connected influenced nodes
  const influencedNodes = nodes.filter(n => nodeStates[n.id] === 'influenced');
  const adjacency: Record<string, Set<string>> = {};
  
  for (const node of influencedNodes) {
    adjacency[node.id] = new Set();
  }
  
  for (const edge of edges) {
    if (nodeStates[edge.source] === 'influenced' && nodeStates[edge.target] === 'influenced') {
      adjacency[edge.source]?.add(edge.target);
      if (edge.direction === 'bidirectional') {
        adjacency[edge.target]?.add(edge.source);
      }
    }
  }

  // Find connected components among influenced nodes
  const visited = new Set<string>();
  const chambers: { nodes: string[]; density: number; homogeneity: number }[] = [];

  for (const node of influencedNodes) {
    if (visited.has(node.id)) continue;
    
    const component: string[] = [];
    const queue = [node.id];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      component.push(current);
      
      for (const neighbor of adjacency[current] || []) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= 3) {
      // Calculate density
      let edgeCount = 0;
      for (const n of component) {
        for (const neighbor of adjacency[n] || []) {
          if (component.includes(neighbor)) edgeCount++;
        }
      }
      const maxEdges = component.length * (component.length - 1);
      const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

      chambers.push({
        nodes: component,
        density,
        homogeneity: 1, // All influenced
      });
    }
  }

  return chambers.sort((a, b) => b.nodes.length - a.nodes.length).slice(0, 3);
}
