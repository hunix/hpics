// Network Analysis Algorithms: PageRank, Closeness Centrality, and Cluster Detection

interface NetworkNode {
  id: string;
  [key: string]: any;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight?: number;
  [key: string]: any;
}

// Build adjacency list from nodes and links
function buildAdjacencyList(nodes: NetworkNode[], links: NetworkLink[]): Map<string, Map<string, number>> {
  const adj = new Map<string, Map<string, number>>();
  
  nodes.forEach(node => {
    adj.set(node.id, new Map());
  });
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const weight = link.weight || 1;
    
    if (adj.has(sourceId) && adj.has(targetId)) {
      adj.get(sourceId)!.set(targetId, weight);
      adj.get(targetId)!.set(sourceId, weight); // Undirected graph
    }
  });
  
  return adj;
}

/**
 * PageRank Algorithm
 * Calculates the importance/influence of each node based on incoming connections
 * @param nodes - Array of network nodes
 * @param links - Array of network links
 * @param dampingFactor - Probability of following a link (default 0.85)
 * @param iterations - Number of iterations for convergence (default 100)
 * @returns Map of node IDs to PageRank scores (0-1)
 */
export function calculatePageRank(
  nodes: NetworkNode[],
  links: NetworkLink[],
  dampingFactor: number = 0.85,
  iterations: number = 100
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();
  
  const adj = buildAdjacencyList(nodes, links);
  const ranks = new Map<string, number>();
  const outDegree = new Map<string, number>();
  
  // Initialize ranks uniformly
  const initialRank = 1 / n;
  nodes.forEach(node => {
    ranks.set(node.id, initialRank);
    const neighbors = adj.get(node.id);
    outDegree.set(node.id, neighbors ? neighbors.size : 0);
  });
  
  // Iteratively calculate PageRank
  for (let i = 0; i < iterations; i++) {
    const newRanks = new Map<string, number>();
    
    nodes.forEach(node => {
      let rankSum = 0;
      
      // Sum contributions from all nodes linking to this node
      adj.forEach((neighbors, neighborId) => {
        if (neighbors.has(node.id)) {
          const neighborOutDegree = outDegree.get(neighborId) || 1;
          const neighborRank = ranks.get(neighborId) || 0;
          rankSum += neighborRank / neighborOutDegree;
        }
      });
      
      // Apply damping factor
      const newRank = (1 - dampingFactor) / n + dampingFactor * rankSum;
      newRanks.set(node.id, newRank);
    });
    
    // Update ranks
    newRanks.forEach((rank, id) => ranks.set(id, rank));
  }
  
  // Normalize to 0-1 range
  const maxRank = Math.max(...ranks.values());
  if (maxRank > 0) {
    ranks.forEach((rank, id) => ranks.set(id, rank / maxRank));
  }
  
  return ranks;
}

/**
 * Closeness Centrality Algorithm
 * Measures how close a node is to all other nodes in the network
 * Higher values indicate nodes that can reach others more quickly
 * @param nodes - Array of network nodes
 * @param links - Array of network links
 * @returns Map of node IDs to closeness centrality scores (0-1)
 */
export function calculateClosenessCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[]
): Map<string, number> {
  const n = nodes.length;
  if (n <= 1) return new Map(nodes.map(node => [node.id, 1]));
  
  const adj = buildAdjacencyList(nodes, links);
  const closeness = new Map<string, number>();
  
  nodes.forEach(node => {
    // BFS to find shortest paths to all other nodes
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { id: string; distance: number }[] = [{ id: node.id, distance: 0 }];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      distances.set(current.id, current.distance);
      
      const neighbors = adj.get(current.id);
      if (neighbors) {
        neighbors.forEach((_, neighborId) => {
          if (!visited.has(neighborId)) {
            queue.push({ id: neighborId, distance: current.distance + 1 });
          }
        });
      }
    }
    
    // Calculate closeness as inverse of average distance
    const totalDistance = Array.from(distances.values()).reduce((a, b) => a + b, 0);
    const reachableNodes = distances.size - 1; // Exclude self
    
    if (reachableNodes > 0 && totalDistance > 0) {
      // Normalized closeness: (n-1) / sum of distances to all reachable nodes
      closeness.set(node.id, reachableNodes / totalDistance);
    } else {
      closeness.set(node.id, 0);
    }
  });
  
  // Normalize to 0-1 range
  const maxCloseness = Math.max(...closeness.values());
  if (maxCloseness > 0) {
    closeness.forEach((value, id) => closeness.set(id, value / maxCloseness));
  }
  
  return closeness;
}

/**
 * Betweenness Centrality Algorithm
 * Measures how often a node lies on shortest paths between other nodes
 * Identifies "bridge" nodes that connect different parts of the network
 * @param nodes - Array of network nodes
 * @param links - Array of network links
 * @returns Map of node IDs to betweenness centrality scores (0-1)
 */
export function calculateBetweennessCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[]
): Map<string, number> {
  const n = nodes.length;
  if (n <= 2) return new Map(nodes.map(node => [node.id, 0]));
  
  const adj = buildAdjacencyList(nodes, links);
  const betweenness = new Map<string, number>();
  nodes.forEach(node => betweenness.set(node.id, 0));
  
  // For each node as source, compute shortest paths
  nodes.forEach(source => {
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    nodes.forEach(node => predecessors.set(node.id, []));
    
    const sigma = new Map<string, number>();
    nodes.forEach(node => sigma.set(node.id, 0));
    sigma.set(source.id, 1);
    
    const dist = new Map<string, number>();
    nodes.forEach(node => dist.set(node.id, -1));
    dist.set(source.id, 0);
    
    const queue: string[] = [source.id];
    
    // BFS
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);
      
      const neighbors = adj.get(v);
      if (neighbors) {
        neighbors.forEach((_, w) => {
          if (dist.get(w) === -1) {
            queue.push(w);
            dist.set(w, dist.get(v)! + 1);
          }
          
          if (dist.get(w) === dist.get(v)! + 1) {
            sigma.set(w, sigma.get(w)! + sigma.get(v)!);
            predecessors.get(w)!.push(v);
          }
        });
      }
    }
    
    // Accumulation
    const delta = new Map<string, number>();
    nodes.forEach(node => delta.set(node.id, 0));
    
    while (stack.length > 0) {
      const w = stack.pop()!;
      predecessors.get(w)!.forEach(v => {
        const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      });
      
      if (w !== source.id) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  });
  
  // Normalize
  const maxBetweenness = Math.max(...betweenness.values());
  if (maxBetweenness > 0) {
    betweenness.forEach((value, id) => betweenness.set(id, value / maxBetweenness));
  }
  
  return betweenness;
}

/**
 * Community Detection using Louvain-like Modularity Optimization
 * Groups nodes into clusters based on dense connections
 * @param nodes - Array of network nodes
 * @param links - Array of network links
 * @returns Map of node IDs to cluster IDs (0-indexed)
 */
export function detectClusters(
  nodes: NetworkNode[],
  links: NetworkLink[]
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();
  
  const adj = buildAdjacencyList(nodes, links);
  const clusters = new Map<string, number>();
  
  // Initialize each node in its own cluster
  nodes.forEach((node, i) => clusters.set(node.id, i));
  
  // Calculate total edge weight
  let totalWeight = 0;
  links.forEach(link => {
    totalWeight += (link.weight || 1) * 2; // Count both directions
  });
  
  if (totalWeight === 0) {
    // No links - each node is its own cluster
    return clusters;
  }
  
  // Calculate node weights (sum of edge weights)
  const nodeWeights = new Map<string, number>();
  nodes.forEach(node => {
    const neighbors = adj.get(node.id);
    let weight = 0;
    if (neighbors) {
      neighbors.forEach(w => weight += w);
    }
    nodeWeights.set(node.id, weight);
  });
  
  // Iteratively optimize modularity
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    // Try moving each node to a neighbor's cluster
    for (const node of nodes) {
      const nodeId = node.id;
      const currentCluster = clusters.get(nodeId)!;
      const neighbors = adj.get(nodeId);
      
      if (!neighbors || neighbors.size === 0) continue;
      
      // Find best cluster among neighbors
      const neighborClusters = new Set<number>();
      neighbors.forEach((_, neighborId) => {
        neighborClusters.add(clusters.get(neighborId)!);
      });
      
      let bestCluster = currentCluster;
      let bestGain = 0;
      
      neighborClusters.forEach(targetCluster => {
        if (targetCluster === currentCluster) return;
        
        // Calculate modularity gain for moving to target cluster
        let gain = 0;
        neighbors.forEach((weight, neighborId) => {
          if (clusters.get(neighborId) === targetCluster) {
            gain += weight;
          }
          if (clusters.get(neighborId) === currentCluster && neighborId !== nodeId) {
            gain -= weight;
          }
        });
        
        if (gain > bestGain) {
          bestGain = gain;
          bestCluster = targetCluster;
        }
      });
      
      if (bestCluster !== currentCluster) {
        clusters.set(nodeId, bestCluster);
        improved = true;
      }
    }
  }
  
  // Renumber clusters to be contiguous
  const uniqueClusters = new Set(clusters.values());
  const clusterMap = new Map<number, number>();
  let newId = 0;
  uniqueClusters.forEach(oldId => {
    clusterMap.set(oldId, newId++);
  });
  
  clusters.forEach((oldId, nodeId) => {
    clusters.set(nodeId, clusterMap.get(oldId)!);
  });
  
  return clusters;
}

// Cluster colors - distinct, visually appealing colors
export const CLUSTER_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#eab308', // Yellow
];

/**
 * Get a color for a cluster ID
 */
export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

/**
 * Calculate all network metrics at once
 */
export interface NetworkMetrics {
  pageRank: Map<string, number>;
  closenessCentrality: Map<string, number>;
  betweennessCentrality: Map<string, number>;
  clusters: Map<string, number>;
  clusterCount: number;
}

export function calculateNetworkMetrics(
  nodes: NetworkNode[],
  links: NetworkLink[]
): NetworkMetrics {
  const pageRank = calculatePageRank(nodes, links);
  const closenessCentrality = calculateClosenessCentrality(nodes, links);
  const betweennessCentrality = calculateBetweennessCentrality(nodes, links);
  const clusters = detectClusters(nodes, links);
  const clusterCount = new Set(clusters.values()).size;
  
  return {
    pageRank,
    closenessCentrality,
    betweennessCentrality,
    clusters,
    clusterCount,
  };
}
