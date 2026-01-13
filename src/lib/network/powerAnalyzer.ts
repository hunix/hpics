/**
 * Power Network Analysis Engine
 * 
 * Advanced network analysis for identifying power structures,
 * vulnerabilities, and optimal influence paths.
 */

export interface NetworkNode {
  id: string;
  name: string;
  type: 'person' | 'organization' | 'group';
  attributes: Record<string, unknown>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface CentralityScores {
  nodeId: string;
  degree: number;
  betweenness: number;
  closeness: number;
  eigenvector: number;
  pagerank: number;
  katz: number;
}

export interface PowerAnalysisResult {
  // Centrality rankings
  topInfluencers: Array<{ nodeId: string; name: string; score: number; reason: string }>;
  gatekeepers: Array<{ nodeId: string; name: string; betweenness: number; controlledPaths: number }>;
  brokers: Array<{ nodeId: string; name: string; communities: string[]; bridgeStrength: number }>;
  
  // Vulnerability analysis
  structuralHoles: Array<{ between: string[]; exploitability: number; description: string }>;
  weakTies: Array<{ nodeId: string; name: string; vulnerability: number; reason: string }>;
  criticalNodes: Array<{ nodeId: string; name: string; impact: number; description: string }>;
  
  // Community structure
  communities: Array<{ id: string; members: string[]; cohesion: number; label?: string }>;
  communityBridges: Array<{ nodeId: string; name: string; communities: string[]; importance: number }>;
  
  // Influence paths
  influencePaths: Map<string, { path: string[]; cost: number }>;
  optimalTargets: Array<{ nodeId: string; name: string; reachability: number; influence: number }>;
  
  // Network health
  density: number;
  averageClustering: number;
  diameter: number;
}

/**
 * Build adjacency list from graph
 */
function buildAdjacencyList(graph: NetworkGraph): Map<string, Map<string, number>> {
  const adj = new Map<string, Map<string, number>>();
  
  for (const node of graph.nodes) {
    adj.set(node.id, new Map());
  }
  
  for (const edge of graph.edges) {
    const sourceAdj = adj.get(edge.source);
    const targetAdj = adj.get(edge.target);
    
    if (sourceAdj) sourceAdj.set(edge.target, edge.weight);
    if (targetAdj) targetAdj.set(edge.source, edge.weight);
  }
  
  return adj;
}

/**
 * Calculate degree centrality
 */
export function calculateDegreeCentrality(graph: NetworkGraph): Map<string, number> {
  const degrees = new Map<string, number>();
  const n = graph.nodes.length;
  
  for (const node of graph.nodes) {
    degrees.set(node.id, 0);
  }
  
  for (const edge of graph.edges) {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + edge.weight);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + edge.weight);
  }
  
  // Normalize
  for (const [nodeId, degree] of degrees) {
    degrees.set(nodeId, degree / (n - 1));
  }
  
  return degrees;
}

/**
 * Calculate betweenness centrality using Brandes algorithm
 */
export function calculateBetweennessCentrality(graph: NetworkGraph): Map<string, number> {
  const betweenness = new Map<string, number>();
  const adj = buildAdjacencyList(graph);
  const n = graph.nodes.length;
  
  for (const node of graph.nodes) {
    betweenness.set(node.id, 0);
  }
  
  for (const source of graph.nodes) {
    // BFS from source
    const stack: string[] = [];
    const pred = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const dist = new Map<string, number>();
    
    for (const node of graph.nodes) {
      pred.set(node.id, []);
      sigma.set(node.id, 0);
      dist.set(node.id, -1);
    }
    
    sigma.set(source.id, 1);
    dist.set(source.id, 0);
    
    const queue: string[] = [source.id];
    
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adj.get(v) || new Map();
      for (const [w] of neighbors) {
        if (dist.get(w) === -1) {
          queue.push(w);
          dist.set(w, dist.get(v)! + 1);
        }
        
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          pred.get(w)!.push(v);
        }
      }
    }
    
    // Accumulation
    const delta = new Map<string, number>();
    for (const node of graph.nodes) {
      delta.set(node.id, 0);
    }
    
    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of pred.get(w)!) {
        const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      }
      if (w !== source.id) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  }
  
  // Normalize
  const normFactor = 2 / ((n - 1) * (n - 2));
  for (const [nodeId, value] of betweenness) {
    betweenness.set(nodeId, value * normFactor);
  }
  
  return betweenness;
}

/**
 * Calculate closeness centrality
 */
export function calculateClosenessCentrality(graph: NetworkGraph): Map<string, number> {
  const closeness = new Map<string, number>();
  const adj = buildAdjacencyList(graph);
  const n = graph.nodes.length;
  
  for (const source of graph.nodes) {
    // BFS to find shortest paths
    const dist = new Map<string, number>();
    for (const node of graph.nodes) {
      dist.set(node.id, Infinity);
    }
    dist.set(source.id, 0);
    
    const queue: string[] = [source.id];
    
    while (queue.length > 0) {
      const v = queue.shift()!;
      const neighbors = adj.get(v) || new Map();
      
      for (const [w] of neighbors) {
        if (dist.get(w) === Infinity) {
          dist.set(w, dist.get(v)! + 1);
          queue.push(w);
        }
      }
    }
    
    // Sum of distances
    let totalDist = 0;
    let reachable = 0;
    for (const [, d] of dist) {
      if (d !== Infinity && d > 0) {
        totalDist += d;
        reachable++;
      }
    }
    
    if (totalDist > 0) {
      closeness.set(source.id, reachable / totalDist);
    } else {
      closeness.set(source.id, 0);
    }
  }
  
  return closeness;
}

/**
 * Calculate PageRank
 */
export function calculatePageRank(
  graph: NetworkGraph,
  damping: number = 0.85,
  iterations: number = 100
): Map<string, number> {
  const n = graph.nodes.length;
  const adj = buildAdjacencyList(graph);
  
  // Initialize PageRank
  let pr = new Map<string, number>();
  for (const node of graph.nodes) {
    pr.set(node.id, 1 / n);
  }
  
  // Calculate out-degrees
  const outDegree = new Map<string, number>();
  for (const node of graph.nodes) {
    const neighbors = adj.get(node.id);
    outDegree.set(node.id, neighbors ? neighbors.size : 0);
  }
  
  // Power iteration
  for (let i = 0; i < iterations; i++) {
    const newPr = new Map<string, number>();
    
    for (const node of graph.nodes) {
      let rank = (1 - damping) / n;
      
      // Sum contributions from incoming links
      for (const [sourceId, neighbors] of adj) {
        if (neighbors.has(node.id)) {
          const sourceDegree = outDegree.get(sourceId) || 1;
          rank += damping * (pr.get(sourceId) || 0) / sourceDegree;
        }
      }
      
      newPr.set(node.id, rank);
    }
    
    pr = newPr;
  }
  
  return pr;
}

/**
 * Calculate Katz centrality
 */
export function calculateKatzCentrality(
  graph: NetworkGraph,
  alpha: number = 0.1,
  beta: number = 1,
  iterations: number = 100
): Map<string, number> {
  const n = graph.nodes.length;
  const adj = buildAdjacencyList(graph);
  
  let katz = new Map<string, number>();
  for (const node of graph.nodes) {
    katz.set(node.id, beta);
  }
  
  for (let i = 0; i < iterations; i++) {
    const newKatz = new Map<string, number>();
    
    for (const node of graph.nodes) {
      let score = beta;
      
      for (const [sourceId, neighbors] of adj) {
        if (neighbors.has(node.id)) {
          score += alpha * (katz.get(sourceId) || 0);
        }
      }
      
      newKatz.set(node.id, score);
    }
    
    katz = newKatz;
  }
  
  // Normalize
  const maxKatz = Math.max(...katz.values());
  for (const [nodeId, value] of katz) {
    katz.set(nodeId, value / maxKatz);
  }
  
  return katz;
}

/**
 * Detect communities using label propagation
 */
export function detectCommunities(graph: NetworkGraph): Map<string, string> {
  const adj = buildAdjacencyList(graph);
  const labels = new Map<string, string>();
  
  // Initialize each node with its own label
  for (const node of graph.nodes) {
    labels.set(node.id, node.id);
  }
  
  // Iterate until convergence
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Shuffle nodes for random order
    const nodes = [...graph.nodes].sort(() => Math.random() - 0.5);
    
    for (const node of nodes) {
      const neighbors = adj.get(node.id);
      if (!neighbors || neighbors.size === 0) continue;
      
      // Count neighbor labels
      const labelCounts = new Map<string, number>();
      for (const [neighborId, weight] of neighbors) {
        const neighborLabel = labels.get(neighborId)!;
        labelCounts.set(neighborLabel, (labelCounts.get(neighborLabel) || 0) + weight);
      }
      
      // Find most common label
      let maxCount = 0;
      let bestLabel = labels.get(node.id)!;
      for (const [label, count] of labelCounts) {
        if (count > maxCount) {
          maxCount = count;
          bestLabel = label;
        }
      }
      
      if (bestLabel !== labels.get(node.id)) {
        labels.set(node.id, bestLabel);
        changed = true;
      }
    }
  }
  
  return labels;
}

/**
 * Find structural holes (gaps between communities)
 */
export function findStructuralHoles(
  graph: NetworkGraph,
  communities: Map<string, string>
): Array<{ between: string[]; exploitability: number; description: string }> {
  const holes: Array<{ between: string[]; exploitability: number; description: string }> = [];
  
  // Group nodes by community
  const communityMembers = new Map<string, Set<string>>();
  for (const [nodeId, communityId] of communities) {
    if (!communityMembers.has(communityId)) {
      communityMembers.set(communityId, new Set());
    }
    communityMembers.get(communityId)!.add(nodeId);
  }
  
  // Count cross-community edges
  const crossEdges = new Map<string, number>();
  const adj = buildAdjacencyList(graph);
  
  for (const [nodeId, neighbors] of adj) {
    const nodeCommunity = communities.get(nodeId)!;
    
    for (const [neighborId] of neighbors) {
      const neighborCommunity = communities.get(neighborId)!;
      
      if (nodeCommunity !== neighborCommunity) {
        const key = [nodeCommunity, neighborCommunity].sort().join('-');
        crossEdges.set(key, (crossEdges.get(key) || 0) + 1);
      }
    }
  }
  
  // Find pairs with few cross-edges
  const communityIds = Array.from(communityMembers.keys());
  for (let i = 0; i < communityIds.length; i++) {
    for (let j = i + 1; j < communityIds.length; j++) {
      const c1 = communityIds[i];
      const c2 = communityIds[j];
      const key = [c1, c2].sort().join('-');
      const edges = crossEdges.get(key) || 0;
      
      const size1 = communityMembers.get(c1)!.size;
      const size2 = communityMembers.get(c2)!.size;
      const potentialEdges = size1 * size2;
      
      const density = edges / potentialEdges;
      
      if (density < 0.1 && potentialEdges > 4) {
        holes.push({
          between: [c1, c2],
          exploitability: 1 - density,
          description: `Weak connection between communities (${edges} edges, ${Math.round(density * 100)}% density)`
        });
      }
    }
  }
  
  return holes.sort((a, b) => b.exploitability - a.exploitability);
}

/**
 * Find shortest path between two nodes
 */
export function findShortestPath(
  graph: NetworkGraph,
  source: string,
  target: string
): string[] | null {
  const adj = buildAdjacencyList(graph);
  
  const visited = new Set<string>();
  const parent = new Map<string, string>();
  const queue: string[] = [source];
  visited.add(source);
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current === target) {
      // Reconstruct path
      const path: string[] = [target];
      let node = target;
      while (parent.has(node)) {
        node = parent.get(node)!;
        path.unshift(node);
      }
      return path;
    }
    
    const neighbors = adj.get(current) || new Map();
    for (const [neighbor] of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  
  return null;
}

/**
 * Calculate power score combining multiple centrality measures
 */
export function calculatePowerScore(
  centralities: CentralityScores,
  weights: {
    degree?: number;
    betweenness?: number;
    closeness?: number;
    eigenvector?: number;
    pagerank?: number;
    katz?: number;
  } = {}
): number {
  const defaultWeights = {
    degree: 0.1,
    betweenness: 0.25,
    closeness: 0.15,
    eigenvector: 0.15,
    pagerank: 0.2,
    katz: 0.15
  };
  
  const w = { ...defaultWeights, ...weights };
  
  return (
    centralities.degree * w.degree +
    centralities.betweenness * w.betweenness +
    centralities.closeness * w.closeness +
    centralities.eigenvector * w.eigenvector +
    centralities.pagerank * w.pagerank +
    centralities.katz * w.katz
  );
}

/**
 * Perform comprehensive power analysis
 */
export function analyzeNetworkPower(graph: NetworkGraph): PowerAnalysisResult {
  // Calculate all centrality measures
  const degree = calculateDegreeCentrality(graph);
  const betweenness = calculateBetweennessCentrality(graph);
  const closeness = calculateClosenessCentrality(graph);
  const pagerank = calculatePageRank(graph);
  const katz = calculateKatzCentrality(graph);
  
  // Detect communities
  const communityLabels = detectCommunities(graph);
  
  // Compile centrality scores
  const allScores: CentralityScores[] = graph.nodes.map(node => ({
    nodeId: node.id,
    degree: degree.get(node.id) || 0,
    betweenness: betweenness.get(node.id) || 0,
    closeness: closeness.get(node.id) || 0,
    eigenvector: 0, // Simplified - would need proper eigenvector calculation
    pagerank: pagerank.get(node.id) || 0,
    katz: katz.get(node.id) || 0
  }));
  
  // Find top influencers (by composite power score)
  const powerScores = allScores.map(scores => ({
    nodeId: scores.nodeId,
    name: graph.nodes.find(n => n.id === scores.nodeId)?.name || scores.nodeId,
    score: calculatePowerScore(scores)
  }));
  powerScores.sort((a, b) => b.score - a.score);
  
  const topInfluencers = powerScores.slice(0, 5).map(p => ({
    ...p,
    reason: 'High combined centrality across multiple measures'
  }));
  
  // Find gatekeepers (high betweenness)
  const gatekeepers = allScores
    .sort((a, b) => b.betweenness - a.betweenness)
    .slice(0, 5)
    .map(s => ({
      nodeId: s.nodeId,
      name: graph.nodes.find(n => n.id === s.nodeId)?.name || s.nodeId,
      betweenness: s.betweenness,
      controlledPaths: Math.round(s.betweenness * graph.nodes.length * 10)
    }));
  
  // Find community bridges
  const communityMembers = new Map<string, string[]>();
  for (const [nodeId, label] of communityLabels) {
    if (!communityMembers.has(label)) {
      communityMembers.set(label, []);
    }
    communityMembers.get(label)!.push(nodeId);
  }
  
  const communities = Array.from(communityMembers.entries()).map(([id, members]) => ({
    id,
    members,
    cohesion: members.length > 1 ? 0.5 : 0 // Simplified cohesion
  }));
  
  // Find structural holes
  const structuralHoles = findStructuralHoles(graph, communityLabels);
  
  // Find weak ties (low degree nodes connecting communities)
  const weakTies = allScores
    .filter(s => s.degree < 0.3 && s.betweenness > 0.1)
    .slice(0, 5)
    .map(s => ({
      nodeId: s.nodeId,
      name: graph.nodes.find(n => n.id === s.nodeId)?.name || s.nodeId,
      vulnerability: 1 - s.degree,
      reason: 'Low connectivity but bridges important paths'
    }));
  
  // Find critical nodes (removal would fragment network)
  const criticalNodes = allScores
    .filter(s => s.betweenness > 0.2)
    .slice(0, 5)
    .map(s => ({
      nodeId: s.nodeId,
      name: graph.nodes.find(n => n.id === s.nodeId)?.name || s.nodeId,
      impact: s.betweenness,
      description: 'Removal would disrupt network connectivity'
    }));
  
  // Calculate influence paths (simplified - just to self)
  const influencePaths = new Map<string, { path: string[]; cost: number }>();
  
  // Find optimal targets (high influence, reachable)
  const optimalTargets = powerScores
    .slice(0, 10)
    .map(p => ({
      nodeId: p.nodeId,
      name: p.name,
      reachability: closeness.get(p.nodeId) || 0,
      influence: p.score
    }));
  
  // Calculate network health metrics
  const density = (2 * graph.edges.length) / (graph.nodes.length * (graph.nodes.length - 1));
  const avgClustering = 0.3; // Simplified
  const diameter = Math.ceil(Math.log2(graph.nodes.length)) + 2; // Approximation
  
  return {
    topInfluencers,
    gatekeepers,
    brokers: [], // Would need more sophisticated analysis
    structuralHoles,
    weakTies,
    criticalNodes,
    communities,
    communityBridges: [], // Would need cross-community analysis
    influencePaths,
    optimalTargets,
    density,
    averageClustering: avgClustering,
    diameter
  };
}
