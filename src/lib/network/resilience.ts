// Network Resilience and Prediction Analysis

import type {
  NetworkNode, NetworkLink, ResilienceMetrics, WeakTie, PredictedLink,
  ClusterMap, GrowthOpportunity, NodeRole, CommunityRole, StrategicConnection, NetworkMetrics
} from './types';
import { buildAdjacencyList, jaccardSimilarity, getConnectedComponents } from './utils';
import { calculatePageRank, calculateClosenessCentrality, calculateBetweennessCentrality, calculateEigenvectorCentrality } from './centrality';
import { detectClusters } from './clustering';

/**
 * Network Resilience Analysis
 * Measures how robust the network is to node removal
 */
export function analyzeNetworkResilience(
  nodes: NetworkNode[],
  links: NetworkLink[]
): ResilienceMetrics {
  const n = nodes.length;
  if (n === 0) return { averageConnectivity: 0, giantComponentRatio: 0, criticalNodes: [], vulnerabilityScore: 1 };

  const adj = buildAdjacencyList(nodes, links);
  const baseComponents = getConnectedComponents(nodes, adj);
  const giantComponent = Math.max(...baseComponents, 0);
  const giantComponentRatio = giantComponent / n;

  const criticalNodes: string[] = [];
  const nodeImportance: Array<{ id: string; impact: number }> = [];

  nodes.forEach(node => {
    const componentsWithout = getConnectedComponents(nodes, adj, node.id);
    const newGiant = Math.max(...componentsWithout, 0);
    const impact = (giantComponent - newGiant) / giantComponent;

    if (impact > 0.1) criticalNodes.push(node.id);
    nodeImportance.push({ id: node.id, impact });
  });

  let totalDegree = 0;
  nodes.forEach(node => {
    totalDegree += adj.get(node.id)?.size || 0;
  });
  const averageConnectivity = n > 0 ? totalDegree / n : 0;

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
 * Weak Tie Detection (Granovetter's Strength of Weak Ties)
 * Identifies valuable loose connections that bridge different communities
 */
export function detectWeakTies(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: ClusterMap
): WeakTie[] {
  const adj = buildAdjacencyList(nodes, links);
  const weakTies: WeakTie[] = [];

  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const sourceCluster = clusters.get(sourceId);
    const targetCluster = clusters.get(targetId);

    if (sourceCluster !== undefined && targetCluster !== undefined && sourceCluster !== targetCluster) {
      const sourceNeighbors = new Set(adj.get(sourceId)?.keys() || []);
      const targetNeighbors = new Set(adj.get(targetId)?.keys() || []);

      const jaccard = jaccardSimilarity(sourceNeighbors, targetNeighbors);
      const bridgeScore = 1 - jaccard;

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
 * Link Prediction using Adamic-Adar
 */
export function predictLinks(
  nodes: NetworkNode[],
  links: NetworkLink[],
  topK = 20
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

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const n1 = nodes[i].id;
      const n2 = nodes[j].id;

      if (existingLinks.has(`${n1}-${n2}`)) continue;

      const neighbors1 = new Set(adj.get(n1)?.keys() || []);
      const neighbors2 = new Set(adj.get(n2)?.keys() || []);

      const common = [...neighbors1].filter(x => neighbors2.has(x));
      if (common.length === 0) continue;

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
 * Community Role Classification
 */
export function classifyCommunityRoles(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: ClusterMap
): NodeRole[] {
  const adj = buildAdjacencyList(nodes, links);
  const roles: NodeRole[] = [];

  nodes.forEach(node => {
    const nodeCluster = clusters.get(node.id);
    const neighbors = adj.get(node.id);

    if (!neighbors || neighbors.size === 0) {
      roles.push({ nodeId: node.id, role: 'isolated', internalStrength: 0, externalStrength: 0, participation: 0 });
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
    if (internalStrength > 3 && participation < 0.2) role = 'leader';
    else if (participation > 0.5) role = 'connector';
    else if (totalStrength > 2) role = 'active';
    else role = 'peripheral';

    roles.push({ nodeId: node.id, role, internalStrength, externalStrength, participation });
  });

  return roles;
}

/**
 * Identify Network Growth Opportunities
 */
export function identifyGrowthOpportunities(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: ClusterMap
): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];
  const adj = buildAdjacencyList(nodes, links);

  const clusterConnections: Map<string, number> = new Map();
  const clusterSizes: Map<number, number> = new Map();

  clusters.forEach(cluster => {
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
          impact: 0.7,
          description: `Bridge gap between clusters ${uniqueClusters[i]} and ${uniqueClusters[j]}`,
        });
      }
    }
  }

  return opportunities.slice(0, 10);
}

/**
 * Recommend Strategic Connections
 * Identifies high-value connection opportunities based on network position
 */
export function recommendStrategicConnections(
  nodes: NetworkNode[],
  links: NetworkLink[],
  focusNodeId: string,
  topK = 5
): StrategicConnection[] {
  const adj = buildAdjacencyList(nodes, links);
  const clusters = detectClusters(nodes, links);
  const pageRank = calculatePageRank(nodes, links);
  
  const focusCluster = clusters.get(focusNodeId);
  const focusNeighbors = new Set(adj.get(focusNodeId)?.keys() || []);
  
  const recommendations: StrategicConnection[] = [];
  
  nodes.forEach(node => {
    if (node.id === focusNodeId || focusNeighbors.has(node.id)) return;
    
    const nodeCluster = clusters.get(node.id);
    const nodeRank = pageRank.get(node.id) || 0;
    const isNewCluster = nodeCluster !== focusCluster;
    
    // Calculate expected impact based on PageRank and cluster bridging
    let expectedImpact = nodeRank * 10;
    if (isNewCluster) expectedImpact += 0.3;
    
    // Find required introductions (mutual connections)
    const nodeNeighbors = new Set(adj.get(node.id)?.keys() || []);
    const mutualConnections = [...focusNeighbors].filter(x => nodeNeighbors.has(x));
    
    let difficulty: 'easy' | 'medium' | 'hard' = 'hard';
    if (mutualConnections.length >= 2) difficulty = 'easy';
    else if (mutualConnections.length === 1) difficulty = 'medium';
    
    let reason = '';
    if (isNewCluster && nodeRank > 0.05) {
      reason = 'High-influence bridge to new community';
    } else if (nodeRank > 0.1) {
      reason = 'Key influencer in network';
    } else if (isNewCluster) {
      reason = 'Expands reach to new community';
    } else {
      reason = 'Potential collaboration partner';
    }
    
    if (expectedImpact > 0.1) {
      recommendations.push({
        targetNodeId: node.id,
        targetId: node.id, // Backward compatibility alias
        reason,
        expectedImpact: Math.min(1, expectedImpact),
        requiredIntroductions: mutualConnections.slice(0, 3),
        difficulty,
        bridgesCommunities: isNewCluster,
        fillsStructuralHole: isNewCluster && nodeRank > 0.05,
        networkROI: expectedImpact * 10,
        score: expectedImpact,
      });
    }
  });
  
  return recommendations.sort((a, b) => b.expectedImpact - a.expectedImpact).slice(0, topK);
}

/**
 * Calculate Network Density
 */
export function calculateNetworkDensity(
  nodes: NetworkNode[],
  links: NetworkLink[]
): number {
  const n = nodes.length;
  if (n < 2) return 0;
  const maxPossibleLinks = (n * (n - 1)) / 2;
  return links.length / maxPossibleLinks;
}

/**
 * Calculate comprehensive network metrics
 */
export function calculateNetworkMetrics(
  nodes: NetworkNode[],
  links: NetworkLink[]
): NetworkMetrics {
  const pageRank = calculatePageRank(nodes, links);
  const closenessCentrality = calculateClosenessCentrality(nodes, links);
  const betweennessCentrality = calculateBetweennessCentrality(nodes, links);
  const eigenvectorCentrality = calculateEigenvectorCentrality(nodes, links);
  const clusters = detectClusters(nodes, links);
  
  // Get top influencers by PageRank
  const sortedByPageRank = [...pageRank.entries()].sort((a, b) => b[1] - a[1]);
  const topInfluencers = sortedByPageRank.slice(0, 10).map(([id]) => id);
  
  // Get bridge connectors by betweenness
  const sortedByBetweenness = [...betweennessCentrality.entries()].sort((a, b) => b[1] - a[1]);
  const bridgeConnectors = sortedByBetweenness.slice(0, 10).map(([id]) => id);
  
  // Count unique clusters
  const clusterCount = new Set(clusters.values()).size;
  
  return {
    pageRank,
    closenessCentrality,
    betweennessCentrality,
    eigenvectorCentrality,
    clusters,
    topInfluencers,
    bridgeConnectors,
    clusterCount,
  };
}
