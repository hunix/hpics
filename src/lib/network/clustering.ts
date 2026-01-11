// Network Clustering and Community Detection

import type { NetworkNode, NetworkLink, ClusterMap, HierarchicalCluster, StructuralHole } from './types';
import { buildAdjacencyList, getNodeWeight } from './utils';

/**
 * Community Detection using Louvain-like Modularity Optimization
 */
export function detectClusters(nodes: NetworkNode[], links: NetworkLink[]): ClusterMap {
  const n = nodes.length;
  if (n === 0) return new Map();

  const adj = buildAdjacencyList(nodes, links);
  const clusters = new Map<string, number>();

  nodes.forEach((node, i) => clusters.set(node.id, i));

  let totalWeight = 0;
  links.forEach(link => {
    totalWeight += (link.weight || 1) * 2;
  });

  if (totalWeight === 0) return clusters;

  const nodeWeights = new Map<string, number>();
  nodes.forEach(node => nodeWeights.set(node.id, getNodeWeight(adj, node.id)));

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
          if (clusters.get(neighborId) === targetCluster) gain += weight;
          if (clusters.get(neighborId) === currentCluster && neighborId !== nodeId) gain -= weight;
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
  uniqueClusters.forEach(oldId => clusterMap.set(oldId, newId++));
  clusters.forEach((oldId, nodeId) => clusters.set(nodeId, clusterMap.get(oldId)!));

  return clusters;
}

/**
 * Label Propagation Community Detection
 */
export function detectCommunitiesLabelPropagation(
  nodes: NetworkNode[],
  adj: Map<string, Map<string, number>>
): ClusterMap {
  const labels = new Map<string, number>();
  nodes.forEach((node, i) => labels.set(node.id, i));

  let changed = true;
  let iterations = 0;

  while (changed && iterations < 100) {
    changed = false;
    iterations++;

    const shuffled = [...nodes].sort(() => Math.random() - 0.5);

    for (const node of shuffled) {
      const neighbors = adj.get(node.id);
      if (!neighbors || neighbors.size === 0) continue;

      const labelCounts = new Map<number, number>();
      neighbors.forEach((weight, neighborId) => {
        const neighborLabel = labels.get(neighborId)!;
        labelCounts.set(neighborLabel, (labelCounts.get(neighborLabel) || 0) + weight);
      });

      let maxCount = 0;
      let bestLabel = labels.get(node.id)!;
      labelCounts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          bestLabel = label;
        }
      });

      if (bestLabel !== labels.get(node.id)) {
        labels.set(node.id, bestLabel);
        changed = true;
      }
    }
  }

  return labels;
}

/**
 * Hierarchical Cluster Detection
 * Builds nested community structure for drill-down analysis
 */
export function detectHierarchicalClusters(
  nodes: NetworkNode[],
  links: NetworkLink[],
  levels = 3
): HierarchicalCluster[] {
  const results: HierarchicalCluster[] = [];
  let currentNodes = [...nodes];
  let currentLinks = [...links];

  for (let level = 0; level < levels; level++) {
    const clusters = detectClusters(currentNodes, currentLinks);
    const clusterCount = new Set(clusters.values()).size;

    results.push({ level, clusters: new Map(clusters), clusterCount });

    if (clusterCount >= currentNodes.length * 0.9) break;

    // Create super-nodes for next level
    const clusterNodes: Map<number, NetworkNode> = new Map();
    const clusterWeights: Map<string, number> = new Map();

    clusters.forEach((clusterId) => {
      if (!clusterNodes.has(clusterId)) {
        clusterNodes.set(clusterId, { id: `cluster_${level}_${clusterId}` });
      }
    });

    currentLinks.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      const sourceCluster = clusters.get(sourceId);
      const targetCluster = clusters.get(targetId);

      if (sourceCluster !== undefined && targetCluster !== undefined && sourceCluster !== targetCluster) {
        const key = sourceCluster < targetCluster
          ? `${sourceCluster}-${targetCluster}`
          : `${targetCluster}-${sourceCluster}`;
        clusterWeights.set(key, (clusterWeights.get(key) || 0) + (link.weight || 1));
      }
    });

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
 * Identifies gaps between communities representing networking opportunities
 */
export function detectStructuralHoles(
  nodes: NetworkNode[],
  links: NetworkLink[],
  clusters: ClusterMap
): StructuralHole[] {
  const adj = buildAdjacencyList(nodes, links);
  const holes: StructuralHole[] = [];

  nodes.forEach(node => {
    const nodeId = node.id;
    const nodeCluster = clusters.get(nodeId);
    const neighbors = adj.get(nodeId);

    if (!neighbors || neighbors.size < 2) return;

    const clusterConnections: Map<number, number> = new Map();
    neighbors.forEach((weight, neighborId) => {
      const neighborCluster = clusters.get(neighborId);
      if (neighborCluster !== undefined) {
        clusterConnections.set(neighborCluster, (clusterConnections.get(neighborCluster) || 0) + weight);
      }
    });

    const connectedClusters = Array.from(clusterConnections.keys());
    if (connectedClusters.length > 1) {
      const clusterConnectionCount = new Map<string, number>();
      links.forEach(link => {
        const srcId = typeof link.source === 'string' ? link.source : link.source.id;
        const tgtId = typeof link.target === 'string' ? link.target : link.target.id;
        const srcCluster = clusters.get(srcId);
        const tgtCluster = clusters.get(tgtId);

        if (srcCluster !== undefined && tgtCluster !== undefined && srcCluster !== tgtCluster) {
          const key = srcCluster < tgtCluster ? `${srcCluster}-${tgtCluster}` : `${tgtCluster}-${srcCluster}`;
          clusterConnectionCount.set(key, (clusterConnectionCount.get(key) || 0) + 1);
        }
      });

      for (let i = 0; i < connectedClusters.length; i++) {
        for (let j = i + 1; j < connectedClusters.length; j++) {
          const c1 = connectedClusters[i];
          const c2 = connectedClusters[j];
          const key = c1 < c2 ? `${c1}-${c2}` : `${c2}-${c1}`;
          const totalBridges = clusterConnectionCount.get(key) || 0;

          if (totalBridges < 5) {
            const nodeContribution = (clusterConnections.get(c1) || 0) + (clusterConnections.get(c2) || 0);
            const bridgeScore = totalBridges > 0 ? nodeContribution / totalBridges : 1;

            holes.push({
              bridgeNode: nodeId,
              communities: [c1, c2],
              bridgeScore: Math.min(1, bridgeScore),
              potentialValue: bridgeScore > 0.5 ? 'High - key bridge' : 'Medium - secondary bridge',
            });
          }
        }
      }
    }
  });

  return holes.sort((a, b) => b.bridgeScore - a.bridgeScore).slice(0, 20);
}
