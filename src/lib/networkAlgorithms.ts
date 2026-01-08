// Network Analysis Algorithms: PageRank, Closeness Centrality, Cluster Detection, and Advanced ML

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
      
      adj.forEach((neighbors, neighborId) => {
        if (neighbors.has(node.id)) {
          const neighborOutDegree = outDegree.get(neighborId) || 1;
          const neighborRank = ranks.get(neighborId) || 0;
          rankSum += neighborRank / neighborOutDegree;
        }
      });
      
      const newRank = (1 - dampingFactor) / n + dampingFactor * rankSum;
      newRanks.set(node.id, newRank);
    });
    
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
    
    const totalDistance = Array.from(distances.values()).reduce((a, b) => a + b, 0);
    const reachableNodes = distances.size - 1;
    
    if (reachableNodes > 0 && totalDistance > 0) {
      closeness.set(node.id, reachableNodes / totalDistance);
    } else {
      closeness.set(node.id, 0);
    }
  });
  
  const maxCloseness = Math.max(...closeness.values());
  if (maxCloseness > 0) {
    closeness.forEach((value, id) => closeness.set(id, value / maxCloseness));
  }
  
  return closeness;
}

/**
 * Betweenness Centrality Algorithm
 * Measures how often a node lies on shortest paths between other nodes
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
  
  const maxBetweenness = Math.max(...betweenness.values());
  if (maxBetweenness > 0) {
    betweenness.forEach((value, id) => betweenness.set(id, value / maxBetweenness));
  }
  
  return betweenness;
}

/**
 * Community Detection using Louvain-like Modularity Optimization
 */
export function detectClusters(
  nodes: NetworkNode[],
  links: NetworkLink[]
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();
  
  const adj = buildAdjacencyList(nodes, links);
  const clusters = new Map<string, number>();
  
  nodes.forEach((node, i) => clusters.set(node.id, i));
  
  let totalWeight = 0;
  links.forEach(link => {
    totalWeight += (link.weight || 1) * 2;
  });
  
  if (totalWeight === 0) {
    return clusters;
  }
  
  const nodeWeights = new Map<string, number>();
  nodes.forEach(node => {
    const neighbors = adj.get(node.id);
    let weight = 0;
    if (neighbors) {
      neighbors.forEach(w => weight += w);
    }
    nodeWeights.set(node.id, weight);
  });
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (const node of nodes) {
      const nodeId = node.id;
      const currentCluster = clusters.get(nodeId)!;
      const neighbors = adj.get(nodeId);
      
      if (!neighbors || neighbors.size === 0) continue;
      
      const neighborClusters = new Set<number>();
      neighbors.forEach((_, neighborId) => {
        neighborClusters.add(clusters.get(neighborId)!);
      });
      
      let bestCluster = currentCluster;
      let bestGain = 0;
      
      neighborClusters.forEach(targetCluster => {
        if (targetCluster === currentCluster) return;
        
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

// Cluster colors
export const CLUSTER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#a855f7', '#0ea5e9', '#10b981', '#eab308',
];

export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}

// ==================================
// ADVANCED ML ALGORITHMS
// ==================================

/**
 * Influence Propagation Algorithm
 * Simulates how influence spreads through the network from seed nodes
 * Useful for identifying cascade effects and reach
 */
export function calculateInfluencePropagation(
  nodes: NetworkNode[],
  links: NetworkLink[],
  seedNodes: string[],
  decayFactor: number = 0.5,
  iterations: number = 10
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();
  
  const adj = buildAdjacencyList(nodes, links);
  const influence = new Map<string, number>();
  
  // Initialize all nodes to 0, seed nodes to 1
  nodes.forEach(node => {
    influence.set(node.id, seedNodes.includes(node.id) ? 1 : 0);
  });
  
  // Propagate influence iteratively
  for (let iter = 0; iter < iterations; iter++) {
    const newInfluence = new Map<string, number>();
    
    nodes.forEach(node => {
      const nodeId = node.id;
      let receivedInfluence = 0;
      
      // Sum influence from all neighbors
      const neighbors = adj.get(nodeId);
      if (neighbors) {
        neighbors.forEach((weight, neighborId) => {
          const neighborInfluence = influence.get(neighborId) || 0;
          receivedInfluence += neighborInfluence * weight * decayFactor;
        });
      }
      
      // Current influence = max of current value or received influence
      const current = influence.get(nodeId) || 0;
      newInfluence.set(nodeId, Math.max(current, Math.min(1, current + receivedInfluence)));
    });
    
    newInfluence.forEach((val, id) => influence.set(id, val));
  }
  
  return influence;
}

/**
 * Hierarchical Cluster Detection
 * Builds nested community structure for drill-down analysis
 * Returns Map of node ID -> array of cluster IDs at each level
 */
export interface HierarchicalCluster {
  level: number;
  clusters: Map<string, number>;
  clusterCount: number;
}

export function detectHierarchicalClusters(
  nodes: NetworkNode[],
  links: NetworkLink[],
  levels: number = 3
): HierarchicalCluster[] {
  const results: HierarchicalCluster[] = [];
  let currentNodes = [...nodes];
  let currentLinks = [...links];
  
  for (let level = 0; level < levels; level++) {
    const clusters = detectClusters(currentNodes, currentLinks);
    const clusterCount = new Set(clusters.values()).size;
    
    results.push({
      level,
      clusters: new Map(clusters),
      clusterCount,
    });
    
    // If we're at max granularity (each node is own cluster), stop
    if (clusterCount >= currentNodes.length * 0.9) break;
    
    // Create super-nodes for next level (aggregate clusters)
    const clusterNodes: Map<number, NetworkNode> = new Map();
    const clusterWeights: Map<string, number> = new Map(); // "clusterId1-clusterId2" -> weight
    
    clusters.forEach((clusterId, nodeId) => {
      if (!clusterNodes.has(clusterId)) {
        clusterNodes.set(clusterId, { id: `cluster_${level}_${clusterId}` });
      }
    });
    
    // Aggregate links between clusters
    currentLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const sourceCluster = clusters.get(sourceId);
      const targetCluster = clusters.get(targetId);
      
      if (sourceCluster !== undefined && targetCluster !== undefined && sourceCluster !== targetCluster) {
        const key = sourceCluster < targetCluster 
          ? `${sourceCluster}-${targetCluster}` 
          : `${targetCluster}-${sourceCluster}`;
        const currentWeight = clusterWeights.get(key) || 0;
        clusterWeights.set(key, currentWeight + (link.weight || 1));
      }
    });
    
    // Build new nodes and links for next level
    currentNodes = Array.from(clusterNodes.values());
    currentLinks = [];
    clusterWeights.forEach((weight, key) => {
      const [c1, c2] = key.split('-').map(Number);
      currentLinks.push({
        source: `cluster_${level}_${c1}`,
        target: `cluster_${level}_${c2}`,
        weight,
      });
    });
    
    if (currentNodes.length <= 2) break;
  }
  
  return results;
}

/**
 * Structural Hole Detection
 * Identifies gaps between communities that represent networking opportunities
 */
export interface StructuralHole {
  bridgeNode: string;
  communities: number[];
  bridgeScore: number;
  potentialValue: string;
}

export function detectStructuralHoles(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: Map<string, number>
): StructuralHole[] {
  const adj = buildAdjacencyList(nodes, links);
  const holes: StructuralHole[] = [];
  
  // Find nodes that connect multiple clusters
  nodes.forEach(node => {
    const nodeId = node.id;
    const nodeCluster = clusters.get(nodeId);
    const neighbors = adj.get(nodeId);
    
    if (!neighbors || neighbors.size < 2) return;
    
    // Count connections to each cluster
    const clusterConnections: Map<number, number> = new Map();
    neighbors.forEach((weight, neighborId) => {
      const neighborCluster = clusters.get(neighborId);
      if (neighborCluster !== undefined) {
        const current = clusterConnections.get(neighborCluster) || 0;
        clusterConnections.set(neighborCluster, current + weight);
      }
    });
    
    // If connected to multiple clusters, this is a bridge
    const connectedClusters = Array.from(clusterConnections.keys());
    if (connectedClusters.length >= 2) {
      // Calculate bridge score based on how balanced the connections are
      const weights = Array.from(clusterConnections.values());
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      const entropy = weights.reduce((acc, w) => {
        const p = w / totalWeight;
        return acc - (p > 0 ? p * Math.log2(p) : 0);
      }, 0);
      const maxEntropy = Math.log2(connectedClusters.length);
      const bridgeScore = maxEntropy > 0 ? entropy / maxEntropy : 0;
      
      // Determine potential value description
      let potentialValue = 'Low';
      if (bridgeScore > 0.8 && connectedClusters.length >= 3) {
        potentialValue = 'Very High - Key connector between multiple communities';
      } else if (bridgeScore > 0.6) {
        potentialValue = 'High - Strong bridge between communities';
      } else if (bridgeScore > 0.4) {
        potentialValue = 'Medium - Moderate bridging potential';
      }
      
      holes.push({
        bridgeNode: nodeId,
        communities: connectedClusters,
        bridgeScore: Math.round(bridgeScore * 100) / 100,
        potentialValue,
      });
    }
  });
  
  // Sort by bridge score descending
  holes.sort((a, b) => b.bridgeScore - a.bridgeScore);
  
  return holes;
}

/**
 * Network Density Calculation
 * Measures how connected the network is (0-1)
 */
export function calculateNetworkDensity(nodes: NetworkNode[], links: NetworkLink[]): number {
  const n = nodes.length;
  if (n <= 1) return 0;
  
  const maxPossibleEdges = (n * (n - 1)) / 2;
  return links.length / maxPossibleEdges;
}

/**
 * Average Clustering Coefficient
 * Measures the tendency of nodes to cluster together
 */
export function calculateClusteringCoefficient(nodes: NetworkNode[], links: NetworkLink[]): Map<string, number> {
  const adj = buildAdjacencyList(nodes, links);
  const coefficients = new Map<string, number>();
  
  nodes.forEach(node => {
    const neighbors = adj.get(node.id);
    if (!neighbors || neighbors.size < 2) {
      coefficients.set(node.id, 0);
      return;
    }
    
    const neighborIds = Array.from(neighbors.keys());
    let triangles = 0;
    
    // Count edges between neighbors
    for (let i = 0; i < neighborIds.length; i++) {
      for (let j = i + 1; j < neighborIds.length; j++) {
        const nAdj = adj.get(neighborIds[i]);
        if (nAdj && nAdj.has(neighborIds[j])) {
          triangles++;
        }
      }
    }
    
    const possibleTriangles = (neighborIds.length * (neighborIds.length - 1)) / 2;
    coefficients.set(node.id, possibleTriangles > 0 ? triangles / possibleTriangles : 0);
  });
  
  return coefficients;
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
  density?: number;
  clusteringCoefficients?: Map<string, number>;
  structuralHoles?: StructuralHole[];
}

export function calculateNetworkMetrics(
  nodes: NetworkNode[],
  links: NetworkLink[],
  includeAdvanced: boolean = false
): NetworkMetrics {
  const pageRank = calculatePageRank(nodes, links);
  const closenessCentrality = calculateClosenessCentrality(nodes, links);
  const betweennessCentrality = calculateBetweennessCentrality(nodes, links);
  const clusters = detectClusters(nodes, links);
  const clusterCount = new Set(clusters.values()).size;
  
  const metrics: NetworkMetrics = {
    pageRank,
    closenessCentrality,
    betweennessCentrality,
    clusters,
    clusterCount,
  };
  
  if (includeAdvanced) {
    metrics.density = calculateNetworkDensity(nodes, links);
    metrics.clusteringCoefficients = calculateClusteringCoefficient(nodes, links);
    metrics.structuralHoles = detectStructuralHoles(nodes, links, clusters);
  }
  
  return metrics;
}
