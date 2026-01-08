// Advanced Network Analysis Algorithms
// Extends base algorithms with eigenvector centrality, weak ties, link prediction, and more

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
      adj.get(targetId)!.set(sourceId, weight);
    }
  });
  
  return adj;
}

/**
 * Eigenvector Centrality
 * More accurate influence measurement - nodes connected to influential nodes are more influential
 */
export function calculateEigenvectorCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[],
  iterations: number = 100,
  tolerance: number = 1e-6
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();
  
  const adj = buildAdjacencyList(nodes, links);
  const centrality = new Map<string, number>();
  
  // Initialize uniformly
  nodes.forEach(node => centrality.set(node.id, 1 / Math.sqrt(n)));
  
  for (let iter = 0; iter < iterations; iter++) {
    const newCentrality = new Map<string, number>();
    let norm = 0;
    
    nodes.forEach(node => {
      let sum = 0;
      const neighbors = adj.get(node.id);
      if (neighbors) {
        neighbors.forEach((weight, neighborId) => {
          sum += weight * (centrality.get(neighborId) || 0);
        });
      }
      newCentrality.set(node.id, sum);
      norm += sum * sum;
    });
    
    // Normalize
    norm = Math.sqrt(norm);
    if (norm > 0) {
      newCentrality.forEach((val, id) => newCentrality.set(id, val / norm));
    }
    
    // Check convergence
    let maxDiff = 0;
    newCentrality.forEach((val, id) => {
      maxDiff = Math.max(maxDiff, Math.abs(val - (centrality.get(id) || 0)));
    });
    
    newCentrality.forEach((val, id) => centrality.set(id, val));
    
    if (maxDiff < tolerance) break;
  }
  
  // Normalize to 0-1
  const maxVal = Math.max(...centrality.values());
  if (maxVal > 0) {
    centrality.forEach((val, id) => centrality.set(id, val / maxVal));
  }
  
  return centrality;
}

/**
 * Weak Tie Detection (Granovetter's Strength of Weak Ties)
 * Identifies valuable loose connections that bridge different communities
 */
export interface WeakTie {
  nodeId: string;
  targetId: string;
  bridgeScore: number;
  communities: [number, number];
  potentialValue: 'high' | 'medium' | 'low';
}

export function detectWeakTies(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: Map<string, number>
): WeakTie[] {
  const adj = buildAdjacencyList(nodes, links);
  const weakTies: WeakTie[] = [];
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const sourceCluster = clusters.get(sourceId);
    const targetCluster = clusters.get(targetId);
    
    // Weak tie connects different communities
    if (sourceCluster !== undefined && targetCluster !== undefined && sourceCluster !== targetCluster) {
      // Calculate bridge score based on neighborhood overlap (Jaccard coefficient)
      const sourceNeighbors = new Set(adj.get(sourceId)?.keys() || []);
      const targetNeighbors = new Set(adj.get(targetId)?.keys() || []);
      
      const intersection = new Set([...sourceNeighbors].filter(x => targetNeighbors.has(x)));
      const union = new Set([...sourceNeighbors, ...targetNeighbors]);
      
      const jaccard = union.size > 0 ? intersection.size / union.size : 0;
      const bridgeScore = 1 - jaccard; // Low overlap = strong bridge
      
      const weight = link.weight || 1;
      let potentialValue: 'high' | 'medium' | 'low' = 'low';
      if (bridgeScore > 0.7 && weight > 0.5) potentialValue = 'high';
      else if (bridgeScore > 0.4) potentialValue = 'medium';
      
      weakTies.push({
        nodeId: sourceId,
        targetId,
        bridgeScore,
        communities: [sourceCluster, targetCluster],
        potentialValue,
      });
    }
  });
  
  return weakTies.sort((a, b) => b.bridgeScore - a.bridgeScore);
}

/**
 * Link Prediction using Common Neighbors and Adamic-Adar
 * Predicts likely future connections
 */
export interface PredictedLink {
  source: string;
  target: string;
  score: number;
  commonNeighbors: number;
  method: 'adamic_adar' | 'common_neighbors' | 'jaccard';
}

export function predictLinks(
  nodes: NetworkNode[],
  links: NetworkLink[],
  topK: number = 20
): PredictedLink[] {
  const adj = buildAdjacencyList(nodes, links);
  const existingLinks = new Set<string>();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    existingLinks.add(`${sourceId}-${targetId}`);
    existingLinks.add(`${targetId}-${sourceId}`);
  });
  
  const predictions: PredictedLink[] = [];
  
  // For each pair of unconnected nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i].id;
      const n2 = nodes[j].id;
      
      if (existingLinks.has(`${n1}-${n2}`)) continue;
      
      const neighbors1 = new Set(adj.get(n1)?.keys() || []);
      const neighbors2 = new Set(adj.get(n2)?.keys() || []);
      
      // Common neighbors
      const common = [...neighbors1].filter(x => neighbors2.has(x));
      if (common.length === 0) continue;
      
      // Adamic-Adar score (weights rare common neighbors higher)
      let adamicAdar = 0;
      common.forEach(cn => {
        const degree = adj.get(cn)?.size || 1;
        adamicAdar += 1 / Math.log(degree + 1);
      });
      
      predictions.push({
        source: n1,
        target: n2,
        score: adamicAdar,
        commonNeighbors: common.length,
        method: 'adamic_adar',
      });
    }
  }
  
  return predictions.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Network Resilience Analysis
 * Measures how robust the network is to node removal
 */
export interface ResilienceMetrics {
  averageConnectivity: number;
  giantComponentRatio: number;
  criticalNodes: string[];
  vulnerabilityScore: number;
}

export function analyzeNetworkResilience(
  nodes: NetworkNode[],
  links: NetworkLink[]
): ResilienceMetrics {
  const n = nodes.length;
  if (n === 0) return { averageConnectivity: 0, giantComponentRatio: 0, criticalNodes: [], vulnerabilityScore: 1 };
  
  const adj = buildAdjacencyList(nodes, links);
  
  // Calculate connected components
  function getComponents(excludeNode?: string): number[] {
    const visited = new Set<string>();
    const components: number[] = [];
    
    nodes.forEach(node => {
      if (node.id === excludeNode || visited.has(node.id)) return;
      
      // BFS
      const queue = [node.id];
      let componentSize = 0;
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        if (visited.has(current) || current === excludeNode) continue;
        visited.add(current);
        componentSize++;
        
        const neighbors = adj.get(current);
        if (neighbors) {
          neighbors.forEach((_, neighborId) => {
            if (!visited.has(neighborId) && neighborId !== excludeNode) {
              queue.push(neighborId);
            }
          });
        }
      }
      
      if (componentSize > 0) components.push(componentSize);
    });
    
    return components;
  }
  
  const baseComponents = getComponents();
  const giantComponent = Math.max(...baseComponents, 0);
  const giantComponentRatio = giantComponent / n;
  
  // Find critical nodes (removal significantly reduces giant component)
  const criticalNodes: string[] = [];
  const nodeImportance: Array<{ id: string; impact: number }> = [];
  
  nodes.forEach(node => {
    const componentsWithout = getComponents(node.id);
    const newGiant = Math.max(...componentsWithout, 0);
    const impact = (giantComponent - newGiant) / giantComponent;
    
    if (impact > 0.1) {
      criticalNodes.push(node.id);
    }
    nodeImportance.push({ id: node.id, impact });
  });
  
  // Average connectivity (average degree)
  let totalDegree = 0;
  nodes.forEach(node => {
    totalDegree += adj.get(node.id)?.size || 0;
  });
  const averageConnectivity = n > 0 ? totalDegree / n : 0;
  
  // Vulnerability score (0 = robust, 1 = fragile)
  const topNodes = nodeImportance.sort((a, b) => b.impact - a.impact).slice(0, 3);
  const vulnerabilityScore = topNodes.reduce((sum, n) => sum + n.impact, 0) / 3;
  
  return {
    averageConnectivity,
    giantComponentRatio,
    criticalNodes: criticalNodes.slice(0, 10),
    vulnerabilityScore: Math.min(1, vulnerabilityScore),
  };
}

/**
 * Influence Flow Paths
 * Traces how information/influence flows through the network
 */
export interface InfluenceFlow {
  path: string[];
  totalStrength: number;
  bottleneck: string | null;
}

export function traceInfluenceFlow(
  nodes: NetworkNode[],
  links: NetworkLink[],
  sourceId: string,
  targetId: string
): InfluenceFlow | null {
  const adj = buildAdjacencyList(nodes, links);
  
  // BFS to find shortest path
  const visited = new Map<string, { prev: string | null; strength: number }>();
  const queue: Array<{ id: string; strength: number }> = [{ id: sourceId, strength: 1 }];
  visited.set(sourceId, { prev: null, strength: 1 });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    
    if (current.id === targetId) {
      // Reconstruct path
      const path: string[] = [];
      let node: string | null = targetId;
      let minStrength = 1;
      let bottleneck: string | null = null;
      
      while (node) {
        path.unshift(node);
        const data = visited.get(node);
        if (data && data.strength < minStrength) {
          minStrength = data.strength;
          bottleneck = node;
        }
        node = data?.prev || null;
      }
      
      return {
        path,
        totalStrength: minStrength,
        bottleneck: bottleneck !== sourceId && bottleneck !== targetId ? bottleneck : null,
      };
    }
    
    const neighbors = adj.get(current.id);
    if (neighbors) {
      neighbors.forEach((weight, neighborId) => {
        if (!visited.has(neighborId)) {
          const newStrength = Math.min(current.strength, weight);
          visited.set(neighborId, { prev: current.id, strength: newStrength });
          queue.push({ id: neighborId, strength: newStrength });
        }
      });
    }
  }
  
  return null;
}

/**
 * Community Role Classification
 * Classifies nodes based on their role in the network
 */
export type CommunityRole = 'leader' | 'connector' | 'active' | 'peripheral' | 'isolated';

export interface NodeRole {
  nodeId: string;
  role: CommunityRole;
  internalStrength: number;
  externalStrength: number;
  participation: number;
}

export function classifyCommunityRoles(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: Map<string, number>
): NodeRole[] {
  const adj = buildAdjacencyList(nodes, links);
  const roles: NodeRole[] = [];
  
  nodes.forEach(node => {
    const nodeCluster = clusters.get(node.id);
    const neighbors = adj.get(node.id);
    
    if (!neighbors || neighbors.size === 0) {
      roles.push({
        nodeId: node.id,
        role: 'isolated',
        internalStrength: 0,
        externalStrength: 0,
        participation: 0,
      });
      return;
    }
    
    let internalStrength = 0;
    let externalStrength = 0;
    
    neighbors.forEach((weight, neighborId) => {
      const neighborCluster = clusters.get(neighborId);
      if (neighborCluster === nodeCluster) {
        internalStrength += weight;
      } else {
        externalStrength += weight;
      }
    });
    
    const totalStrength = internalStrength + externalStrength;
    const participation = totalStrength > 0 ? externalStrength / totalStrength : 0;
    
    let role: CommunityRole;
    if (internalStrength > 3 && participation < 0.2) {
      role = 'leader';
    } else if (participation > 0.5) {
      role = 'connector';
    } else if (totalStrength > 2) {
      role = 'active';
    } else {
      role = 'peripheral';
    }
    
    roles.push({
      nodeId: node.id,
      role,
      internalStrength,
      externalStrength,
      participation,
    });
  });
  
  return roles;
}

/**
 * Network Growth Opportunities
 * Identifies strategic connections that would strengthen the network
 */
export interface GrowthOpportunity {
  type: 'bridge_gap' | 'strengthen_cluster' | 'add_redundancy';
  nodes: string[];
  impact: number;
  description: string;
}

export function identifyGrowthOpportunities(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: Map<string, number>
): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];
  const adj = buildAdjacencyList(nodes, links);
  
  // Find cluster connections
  const clusterConnections: Map<string, number> = new Map();
  const clusterSizes: Map<number, number> = new Map();
  
  clusters.forEach((cluster) => {
    clusterSizes.set(cluster, (clusterSizes.get(cluster) || 0) + 1);
  });
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const c1 = clusters.get(sourceId);
    const c2 = clusters.get(targetId);
    
    if (c1 !== undefined && c2 !== undefined && c1 !== c2) {
      const key = c1 < c2 ? `${c1}-${c2}` : `${c2}-${c1}`;
      clusterConnections.set(key, (clusterConnections.get(key) || 0) + 1);
    }
  });
  
  // Find weakly connected clusters
  const uniqueClusters = Array.from(new Set(clusters.values()));
  for (let i = 0; i < uniqueClusters.length; i++) {
    for (let j = i + 1; j < uniqueClusters.length; j++) {
      const key = `${uniqueClusters[i]}-${uniqueClusters[j]}`;
      const connections = clusterConnections.get(key) || 0;
      const avgSize = ((clusterSizes.get(uniqueClusters[i]) || 0) + (clusterSizes.get(uniqueClusters[j]) || 0)) / 2;
      
      if (connections < avgSize * 0.1 && avgSize > 3) {
        opportunities.push({
          type: 'bridge_gap',
          nodes: [],
          impact: avgSize * 0.5,
          description: `Communities ${uniqueClusters[i]} and ${uniqueClusters[j]} have weak inter-connections`,
        });
      }
    }
  }
  
  // Find single points of failure
  const resilience = analyzeNetworkResilience(nodes, links);
  resilience.criticalNodes.slice(0, 3).forEach(nodeId => {
    opportunities.push({
      type: 'add_redundancy',
      nodes: [nodeId],
      impact: 0.8,
      description: `Node ${nodeId} is a critical bridge - add redundant connections`,
    });
  });
  
  return opportunities.sort((a, b) => b.impact - a.impact).slice(0, 10);
}
