/**
 * @fileoverview Network Influence and Propagation Analysis
 * Implements influence spreading, propagation simulation, and flow tracing.
 */

import type { NetworkNode, NetworkLink, InfluencePropagationResult, InfluenceFlow, PropagationWave } from './types';
import { buildAdjacencyList, bfsReachable } from './utils';

/**
 * Calculates influence propagation from seed nodes through the network.
 * Uses iterative spreading with exponential decay to simulate how
 * influence/information flows from initial sources.
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of connections between nodes
 * @param seedNodes - Array of node IDs to start propagation from
 * @param decayFactor - How much influence decreases per hop (0-1, default: 0.5)
 * @param iterations - Number of propagation rounds (default: 10)
 * @returns Map of nodeId to influence score (0-1)
 * 
 * @example
 * const influence = calculateInfluencePropagation(nodes, links, ['ceo-node'], 0.5, 10);
 * influence.get('employee-node'); // Returns influence received (e.g., 0.25)
 */
export function calculateInfluencePropagation(
  nodes: NetworkNode[],
  links: NetworkLink[],
  seedNodes: string[],
  decayFactor = 0.5,
  iterations = 10
): Map<string, number> {
  const n = nodes.length;
  if (n === 0) return new Map();

  const adj = buildAdjacencyList(nodes, links);
  const influence = new Map<string, number>();

  nodes.forEach(node => {
    influence.set(node.id, seedNodes.includes(node.id) ? 1 : 0);
  });

  for (let iter = 0; iter < iterations; iter++) {
    const newInfluence = new Map<string, number>();

    nodes.forEach(node => {
      let receivedInfluence = 0;
      const neighbors = adj.get(node.id);

      if (neighbors) {
        neighbors.forEach((weight, neighborId) => {
          const neighborInfluence = influence.get(neighborId) || 0;
          receivedInfluence += neighborInfluence * weight * decayFactor;
        });
      }

      const current = influence.get(node.id) || 0;
      newInfluence.set(node.id, Math.max(current, Math.min(1, current + receivedInfluence)));
    });

    newInfluence.forEach((val, id) => influence.set(id, val));
  }

  return influence;
}

/**
 * Simulates influence propagation with Monte Carlo sampling.
 * Runs multiple simulations to generate probabilistic reach estimates
 * and identifies bottleneck nodes that limit spread.
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of connections between nodes
 * @param seedNodeId - Starting node for propagation
 * @param propagationProbability - Chance of spreading per edge (default: 0.3)
 * @param maxSteps - Maximum propagation hops (default: 10)
 * @param simulations - Number of Monte Carlo runs (default: 100)
 * @returns Detailed propagation results including waves and bottlenecks
 */
export function simulateInfluencePropagation(
  nodes: NetworkNode[],
  links: NetworkLink[],
  seedNodeId: string,
  propagationProbability = 0.3,
  maxSteps = 10,
  simulations = 100
): InfluencePropagationResult {
  const adj = buildAdjacencyList(nodes, links);
  const reachCounts = new Map<string, number[]>();
  nodes.forEach(n => reachCounts.set(n.id, []));

  for (let sim = 0; sim < simulations; sim++) {
    const infected = new Set<string>([seedNodeId]);
    const reachTime = new Map<string, number>([[seedNodeId, 0]]);

    for (let step = 1; step <= maxSteps; step++) {
      const newlyInfected: string[] = [];

      infected.forEach(nodeId => {
        const neighbors = adj.get(nodeId);
        if (!neighbors) return;

        neighbors.forEach((weight, neighborId) => {
          if (infected.has(neighborId)) return;
          const effectiveProb = propagationProbability * weight;
          if (Math.random() < effectiveProb) {
            newlyInfected.push(neighborId);
            reachTime.set(neighborId, step);
          }
        });
      });

      newlyInfected.forEach(n => infected.add(n));
    }

    nodes.forEach(n => {
      reachCounts.get(n.id)!.push(reachTime.has(n.id) ? reachTime.get(n.id)! : -1);
    });
  }

  // Aggregate results
  const avgReachTime = new Map<string, number>();
  reachCounts.forEach((times, nodeId) => {
    const validTimes = times.filter(t => t >= 0);
    if (validTimes.length > 0) {
      avgReachTime.set(nodeId, validTimes.reduce((a, b) => a + b, 0) / validTimes.length);
    }
  });

  // Build propagation waves
  const waves: PropagationWave[] = [];
  for (let step = 0; step <= maxSteps; step++) {
    const nodesAtStep = Array.from(avgReachTime.entries())
      .filter(([_, time]) => Math.round(time) === step)
      .map(([id]) => id);

    if (nodesAtStep.length > 0 || step === 0) {
      waves.push({
        step,
        nodesReached: nodesAtStep,
        cumulativeReach: waves.length > 0
          ? waves[waves.length - 1].cumulativeReach + nodesAtStep.length
          : nodesAtStep.length,
      });
    }
  }

  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(nodes, links, seedNodeId, avgReachTime);

  const allTimes = Array.from(avgReachTime.values());
  const avgTimeToReach = allTimes.length > 0
    ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
    : 0;

  return {
    seedNode: seedNodeId,
    reachableNodes: avgReachTime,
    maxReach: avgReachTime.size,
    avgTimeToReach,
    propagationWaves: waves,
    bottlenecks,
  };
}

function identifyBottlenecks(
  nodes: NetworkNode[],
  links: NetworkLink[],
  seedNodeId: string,
  originalReach: Map<string, number>
): string[] {
  const bottlenecks: Array<{ id: string; impact: number }> = [];
  const originalSize = originalReach.size;

  nodes.slice(0, 50).forEach(node => {
    if (node.id === seedNodeId) return;

    const filteredNodes = nodes.filter(n => n.id !== node.id);
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return sourceId !== node.id && targetId !== node.id;
    });

    const adj = buildAdjacencyList(filteredNodes, filteredLinks);
    const visited = bfsReachable(adj, seedNodeId);

    const impact = (originalSize - visited.size) / originalSize;
    if (impact > 0.1) {
      bottlenecks.push({ id: node.id, impact });
    }
  });

  return bottlenecks
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5)
    .map(b => b.id);
}

/**
 * Traces the influence flow path between two nodes.
 * Finds the strongest path (by edge weights) using BFS and
 * identifies bottleneck nodes that constrain the flow.
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of connections between nodes
 * @param sourceId - Starting node ID
 * @param targetId - Destination node ID
 * @returns InfluenceFlow with path, strength, and bottleneck, or null if unreachable
 */
export function traceInfluenceFlow(
  nodes: NetworkNode[],
  links: NetworkLink[],
  sourceId: string,
  targetId: string
): InfluenceFlow | null {
  const adj = buildAdjacencyList(nodes, links);
  const visited = new Map<string, { prev: string | null; strength: number }>();
  const queue: Array<{ id: string; strength: number }> = [{ id: sourceId, strength: 1 }];
  visited.set(sourceId, { prev: null, strength: 1 });

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.id === targetId) {
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
