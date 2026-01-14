import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface IntentNode {
  id: string;
  name: string;
  type: 'intent' | 'behavior' | 'context' | 'outcome';
  prior_probability: number;
  states: string[];
}

interface BayesianRequest {
  profileId: string;
  nodes: IntentNode[];
  edges: { from: string; to: string; cpt: number[][] }[]; // Conditional probability tables
  observations: { node_id: string; observed_state: string }[];
  queryNodes: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profileId, nodes, edges, observations, queryNodes }: BayesianRequest = await req.json();

    // Build adjacency list and CPT lookup
    const children: Record<string, string[]> = {};
    const parents: Record<string, string[]> = {};
    const cpts: Record<string, number[][]> = {};

    for (const node of nodes) {
      children[node.id] = [];
      parents[node.id] = [];
    }

    for (const edge of edges) {
      children[edge.from].push(edge.to);
      parents[edge.to].push(edge.from);
      cpts[`${edge.from}->${edge.to}`] = edge.cpt;
    }

    // Initialize beliefs with priors
    const beliefs: Record<string, number[]> = {};
    for (const node of nodes) {
      beliefs[node.id] = node.states.map((_, i) => 
        i === 0 ? node.prior_probability : (1 - node.prior_probability) / (node.states.length - 1)
      );
    }

    // Apply observations (set observed nodes to certainty)
    for (const obs of observations) {
      const node = nodes.find(n => n.id === obs.node_id);
      if (node) {
        const stateIdx = node.states.indexOf(obs.observed_state);
        if (stateIdx >= 0) {
          beliefs[node.id] = node.states.map((_, i) => i === stateIdx ? 1 : 0);
        }
      }
    }

    // Belief Propagation (simplified - forward pass)
    const topoOrder = topologicalSort(nodes, parents);
    
    for (const nodeId of topoOrder) {
      const nodeParents = parents[nodeId];
      if (nodeParents.length === 0) continue;

      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // Update belief based on parents
      const newBelief: number[] = new Array(node.states.length).fill(0);
      
      for (let stateIdx = 0; stateIdx < node.states.length; stateIdx++) {
        // Sum over all parent configurations
        let prob = 0;
        const parentConfigs = generateParentConfigs(nodeParents, nodes, beliefs);
        
        for (const config of parentConfigs) {
          let configProb = 1;
          for (const [parentId, parentStateIdx] of Object.entries(config)) {
            configProb *= beliefs[parentId][parentStateIdx as number];
          }
          
          // Look up CPT for this configuration
          const cptKey = `${nodeParents[0]}->${nodeId}`;
          const cpt = cpts[cptKey];
          if (cpt && cpt[config[nodeParents[0]] as number]) {
            configProb *= cpt[config[nodeParents[0]] as number][stateIdx] || 0.5;
          }
          
          prob += configProb;
        }
        newBelief[stateIdx] = prob;
      }

      // Normalize
      const sum = newBelief.reduce((a, b) => a + b, 0);
      if (sum > 0) {
        beliefs[nodeId] = newBelief.map(p => p / sum);
      }
    }

    // Extract posterior probabilities for query nodes
    const posteriors: Record<string, { state: string; probability: number }[]> = {};
    for (const queryNodeId of queryNodes) {
      const node = nodes.find(n => n.id === queryNodeId);
      if (node && beliefs[node.id]) {
        posteriors[queryNodeId] = node.states.map((state, idx) => ({
          state,
          probability: beliefs[node.id][idx],
        }));
      }
    }

    // Compute most likely intent configuration
    const intentNodes = nodes.filter(n => n.type === 'intent');
    const mostLikelyIntents = intentNodes.map(node => {
      const belief = beliefs[node.id];
      const maxIdx = belief.indexOf(Math.max(...belief));
      return {
        intent: node.name,
        most_likely_state: node.states[maxIdx],
        confidence: belief[maxIdx],
        all_probabilities: node.states.map((s, i) => ({ state: s, prob: belief[i] })),
      };
    });

    // Calculate entropy (uncertainty) for each query node
    const uncertainties: Record<string, number> = {};
    for (const nodeId of queryNodes) {
      const belief = beliefs[nodeId];
      if (belief) {
        uncertainties[nodeId] = -belief.reduce((sum, p) => {
          if (p > 0) sum += p * Math.log2(p);
          return sum;
        }, 0);
      }
    }

    // What-if analysis: simulate different observations
    const whatIfAnalysis: { scenario: string; impact: Record<string, number> }[] = [];
    
    // Simulate removing each observation to see its impact
    for (const obs of observations) {
      const filteredObs = observations.filter(o => o.node_id !== obs.node_id);
      const altBeliefs = runInference(nodes, edges, cpts, parents, filteredObs);
      
      const impact: Record<string, number> = {};
      for (const queryId of queryNodes) {
        const original = beliefs[queryId][0];
        const alternative = altBeliefs[queryId]?.[0] || 0.5;
        impact[queryId] = Math.abs(original - alternative);
      }
      
      whatIfAnalysis.push({
        scenario: `Without observing ${obs.node_id}=${obs.observed_state}`,
        impact,
      });
    }

    return new Response(
      JSON.stringify({
        profile_id: profileId,
        posterior_probabilities: posteriors,
        most_likely_intents: mostLikelyIntents,
        uncertainties,
        what_if_analysis: whatIfAnalysis,
        observations_used: observations.length,
        network_nodes: nodes.length,
        inference_method: 'belief_propagation',
        analyzed_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Bayesian Intent Network error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function topologicalSort(nodes: IntentNode[], parents: Record<string, string[]>): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const parentId of parents[nodeId]) {
      visit(parentId);
    }
    result.push(nodeId);
  }

  for (const node of nodes) {
    visit(node.id);
  }

  return result;
}

function generateParentConfigs(
  parentIds: string[], 
  nodes: IntentNode[], 
  beliefs: Record<string, number[]>
): Record<string, number>[] {
  if (parentIds.length === 0) return [{}];
  
  const configs: Record<string, number>[] = [];
  const parentNode = nodes.find(n => n.id === parentIds[0]);
  if (!parentNode) return [{}];

  const restConfigs = generateParentConfigs(parentIds.slice(1), nodes, beliefs);
  
  for (let i = 0; i < parentNode.states.length; i++) {
    for (const rest of restConfigs) {
      configs.push({ [parentIds[0]]: i, ...rest });
    }
  }
  
  return configs;
}

function runInference(
  nodes: IntentNode[],
  edges: { from: string; to: string; cpt: number[][] }[],
  cpts: Record<string, number[][]>,
  parents: Record<string, string[]>,
  observations: { node_id: string; observed_state: string }[]
): Record<string, number[]> {
  const beliefs: Record<string, number[]> = {};
  
  for (const node of nodes) {
    beliefs[node.id] = node.states.map((_, i) => 
      i === 0 ? node.prior_probability : (1 - node.prior_probability) / (node.states.length - 1)
    );
  }

  for (const obs of observations) {
    const node = nodes.find(n => n.id === obs.node_id);
    if (node) {
      const stateIdx = node.states.indexOf(obs.observed_state);
      if (stateIdx >= 0) {
        beliefs[node.id] = node.states.map((_, i) => i === stateIdx ? 1 : 0);
      }
    }
  }

  return beliefs;
}
