// Network Analysis Utilities - Shared helper functions

import type { NetworkNode, NetworkLink, AdjacencyList } from './types';

/**
 * Build adjacency list from nodes and links
 * Core utility used by all network algorithms
 */
export function buildAdjacencyList(
  nodes: NetworkNode[],
  links: NetworkLink[]
): AdjacencyList {
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
 * Extract node ID from node or string
 */
export function getNodeId(node: string | NetworkNode): string {
  return typeof node === 'string' ? node : node.id;
}

/**
 * Calculate Jaccard similarity between two sets
 */
export function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Normalize a map of values to 0-1 range
 */
export function normalizeMap(map: Map<string, number>): Map<string, number> {
  const maxVal = Math.max(...map.values(), 0);
  if (maxVal > 0) {
    map.forEach((val, id) => map.set(id, val / maxVal));
  }
  return map;
}

/**
 * BFS to find all reachable nodes from a source
 */
export function bfsReachable(
  adj: AdjacencyList,
  sourceId: string,
  excludeNode?: string
): Set<string> {
  const visited = new Set<string>();
  const queue = [sourceId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current) || current === excludeNode) continue;
    visited.add(current);

    const neighbors = adj.get(current);
    if (neighbors) {
      neighbors.forEach((_, neighborId) => {
        if (!visited.has(neighborId) && neighborId !== excludeNode) {
          queue.push(neighborId);
        }
      });
    }
  }

  return visited;
}

/**
 * Get connected components of a graph
 */
export function getConnectedComponents(
  nodes: NetworkNode[],
  adj: AdjacencyList,
  excludeNode?: string
): number[] {
  const visited = new Set<string>();
  const components: number[] = [];

  nodes.forEach(node => {
    if (node.id === excludeNode || visited.has(node.id)) return;

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

/**
 * Calculate total edge weight for a node
 */
export function getNodeWeight(adj: AdjacencyList, nodeId: string): number {
  const neighbors = adj.get(nodeId);
  if (!neighbors) return 0;
  let weight = 0;
  neighbors.forEach(w => (weight += w));
  return weight;
}

/**
 * Get shortest path between two nodes using BFS
 */
export function getShortestPath(
  adj: AdjacencyList,
  sourceId: string,
  targetId: string
): string[] | null {
  const visited = new Map<string, string | null>();
  const queue = [sourceId];
  visited.set(sourceId, null);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === targetId) {
      // Reconstruct path
      const path: string[] = [];
      let node: string | null = targetId;
      while (node) {
        path.unshift(node);
        node = visited.get(node) || null;
      }
      return path;
    }

    const neighbors = adj.get(current);
    if (neighbors) {
      neighbors.forEach((_, neighborId) => {
        if (!visited.has(neighborId)) {
          visited.set(neighborId, current);
          queue.push(neighborId);
        }
      });
    }
  }

  return null;
}
