// Network Centrality Algorithms

import type { NetworkNode, NetworkLink, CentralityMap } from './types';
import { buildAdjacencyList, normalizeMap } from './utils';

/**
 * PageRank Algorithm
 * Calculates importance/influence based on incoming connections
 */
export function calculatePageRank(
  nodes: NetworkNode[],
  links: NetworkLink[],
  dampingFactor = 0.85,
  iterations = 100
): CentralityMap {
  const n = nodes.length;
  if (n === 0) return new Map();

  const adj = buildAdjacencyList(nodes, links);
  const ranks = new Map<string, number>();
  const outDegree = new Map<string, number>();

  const initialRank = 1 / n;
  nodes.forEach(node => {
    ranks.set(node.id, initialRank);
    const neighbors = adj.get(node.id);
    outDegree.set(node.id, neighbors ? neighbors.size : 0);
  });

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
      newRanks.set(node.id, (1 - dampingFactor) / n + dampingFactor * rankSum);
    });

    newRanks.forEach((rank, id) => ranks.set(id, rank));
  }

  return normalizeMap(ranks);
}

/**
 * Closeness Centrality
 * Measures how close a node is to all other nodes
 */
export function calculateClosenessCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[]
): CentralityMap {
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
    closeness.set(node.id, reachableNodes > 0 && totalDistance > 0 ? reachableNodes / totalDistance : 0);
  });

  return normalizeMap(closeness);
}

/**
 * Betweenness Centrality
 * Measures how often a node lies on shortest paths
 */
export function calculateBetweennessCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[]
): CentralityMap {
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

  return normalizeMap(betweenness);
}

/**
 * Eigenvector Centrality
 * Nodes connected to influential nodes are more influential
 */
export function calculateEigenvectorCentrality(
  nodes: NetworkNode[],
  links: NetworkLink[],
  iterations = 100,
  tolerance = 1e-6
): CentralityMap {
  const n = nodes.length;
  if (n === 0) return new Map();

  const adj = buildAdjacencyList(nodes, links);
  const centrality = new Map<string, number>();

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

    norm = Math.sqrt(norm);
    if (norm > 0) {
      newCentrality.forEach((val, id) => newCentrality.set(id, val / norm));
    }

    let maxDiff = 0;
    newCentrality.forEach((val, id) => {
      maxDiff = Math.max(maxDiff, Math.abs(val - (centrality.get(id) || 0)));
    });

    newCentrality.forEach((val, id) => centrality.set(id, val));
    if (maxDiff < tolerance) break;
  }

  return normalizeMap(centrality);
}
