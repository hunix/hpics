/**
 * @fileoverview Temporal Network Analysis
 * Implements time-based network analysis including dormant connection detection,
 * relationship trajectory prediction, and seasonal pattern identification.
 */

import type {
  NetworkNode, NetworkLink, TemporalNetworkMetrics, SleepingConnection,
  TrajectoryPrediction, SeasonalPattern, CommunityEvolution, CommunitySnapshot, CommunityTransition, CommunityHealthMetrics, ClusterMap
} from './types';
import { buildAdjacencyList } from './utils';
import { detectCommunitiesLabelPropagation } from './clustering';

/**
 * Analyzes temporal patterns in network relationships.
 * Identifies sleeping connections, predicts relationship trajectories,
 * and detects seasonal interaction patterns.
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of connections (should include timestamps)
 * @param timeWindowDays - Analysis window in days (default: 365)
 * @returns TemporalNetworkMetrics with sleeping connections, predictions, and patterns
 */
export function analyzeTemporalNetwork(
  nodes: NetworkNode[],
  links: NetworkLink[],
  timeWindowDays = 365
): TemporalNetworkMetrics {
  const now = Date.now();
  const windowStart = now - timeWindowDays * 24 * 60 * 60 * 1000;

  const temporalLinks = links.filter(l => {
    const timestamp = l.timestamp || now;
    return timestamp >= windowStart;
  });

  const pairTimeSeries = new Map<string, number[]>();
  const nodeLastActive = new Map<string, number>();
  const nodeInteractionCounts = new Map<string, number[]>();

  nodes.forEach(n => nodeInteractionCounts.set(n.id, new Array(12).fill(0)));

  temporalLinks.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const timestamp = link.timestamp || now;
    const weight = link.weight || 1;

    const pairKey = [sourceId, targetId].sort().join('-');
    if (!pairTimeSeries.has(pairKey)) pairTimeSeries.set(pairKey, []);
    pairTimeSeries.get(pairKey)!.push(weight);

    nodeLastActive.set(sourceId, Math.max(nodeLastActive.get(sourceId) || 0, timestamp));
    nodeLastActive.set(targetId, Math.max(nodeLastActive.get(targetId) || 0, timestamp));

    const month = new Date(timestamp).getMonth();
    const sourceCounts = nodeInteractionCounts.get(sourceId);
    const targetCounts = nodeInteractionCounts.get(targetId);
    if (sourceCounts) sourceCounts[month]++;
    if (targetCounts) targetCounts[month]++;
  });

  // Calculate relationship strength over time
  const relationshipStrengthOverTime = new Map<string, number[]>();
  pairTimeSeries.forEach((weights, pairKey) => {
    const quarterSize = Math.ceil(weights.length / 4);
    const quarters: number[] = [];
    for (let i = 0; i < 4; i++) {
      const start = i * quarterSize;
      const end = Math.min(start + quarterSize, weights.length);
      const quarterWeights = weights.slice(start, end);
      quarters.push(quarterWeights.length > 0
        ? quarterWeights.reduce((a, b) => a + b, 0) / quarterWeights.length
        : 0);
    }
    relationshipStrengthOverTime.set(pairKey, quarters);
  });

  // Identify sleeping connections
  const sleepingConnections: SleepingConnection[] = [];

  nodes.forEach(node => {
    const lastActive = nodeLastActive.get(node.id) || 0;
    const dormancyDays = Math.floor((now - lastActive) / (24 * 60 * 60 * 1000));

    if (dormancyDays > 30) {
      const historicalStrength = Array.from(pairTimeSeries.entries())
        .filter(([key]) => key.includes(node.id))
        .reduce((sum, [_, weights]) => sum + weights.reduce((a, b) => a + b, 0), 0);

      let revivalPotential: 'high' | 'medium' | 'low' = 'low';
      if (historicalStrength > 10 && dormancyDays < 90) revivalPotential = 'high';
      else if (historicalStrength > 5 || dormancyDays < 180) revivalPotential = 'medium';

      sleepingConnections.push({
        nodeId: node.id,
        lastActiveTimestamp: lastActive,
        historicalStrength,
        dormancyDays,
        revivalPotential,
      });
    }
  });

  // Generate trajectory predictions
  const trajectoryPredictions: TrajectoryPrediction[] = nodes.slice(0, 100).map(node => {
    const nodeStrengths = Array.from(relationshipStrengthOverTime.entries())
      .filter(([key]) => key.includes(node.id))
      .flatMap(([_, quarters]) => quarters);

    const currentStrength = nodeStrengths.length > 0 ? nodeStrengths[nodeStrengths.length - 1] : 0;
    const trend = nodeStrengths.length >= 2
      ? nodeStrengths[nodeStrengths.length - 1] - nodeStrengths[0]
      : 0;

    const trendDirection: TrajectoryPrediction['trend'] =
      trend > 0.2 ? 'strengthening' :
        trend < -0.2 ? 'weakening' :
          currentStrength < 0.1 ? 'dormant' : 'stable';

    return {
      nodeId: node.id,
      currentStrength,
      predictedStrength30d: Math.max(0, currentStrength + trend * 0.25),
      predictedStrength90d: Math.max(0, currentStrength + trend * 0.75),
      trend: trendDirection,
      confidence: nodeStrengths.length >= 4 ? 0.7 : 0.4,
    };
  });

  // Detect seasonal patterns
  const seasonalPatterns: SeasonalPattern[] = nodes.slice(0, 50).map(node => {
    const monthlyCounts = nodeInteractionCounts.get(node.id) || new Array(12).fill(0);
    const avg = monthlyCounts.reduce((a, b) => a + b, 0) / 12;

    const peakMonths = monthlyCounts
      .map((count, month) => ({ month, count }))
      .filter(({ count }) => count > avg * 1.3)
      .map(({ month }) => month);

    const lowMonths = monthlyCounts
      .map((count, month) => ({ month, count }))
      .filter(({ count }) => count < avg * 0.7)
      .map(({ month }) => month);

    const variance = monthlyCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / 12;
    const patternStrength = Math.min(1, variance / (avg * avg + 1));

    return { nodeId: node.id, peakMonths, lowMonths, cyclePeriodDays: 365, patternStrength };
  }).filter(p => p.patternStrength > 0.2);

  return {
    relationshipStrengthOverTime,
    sleepingConnections: sleepingConnections.sort((a, b) => b.historicalStrength - a.historicalStrength),
    trajectoryPredictions,
    seasonalPatterns,
  };
}

/**
 * Analyzes how communities evolve over time.
 * Tracks community snapshots, member transitions, and calculates
 * health metrics including cohesion, fragmentation risk, and growth potential.
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of connections between nodes
 * @param previousClusters - Optional previous cluster state for transition detection
 * @returns CommunityEvolution with snapshots, transitions, and health metrics
 */
export function analyzeCommunityEvolution(
  nodes: NetworkNode[],
  links: NetworkLink[],
  previousClusters?: ClusterMap
): CommunityEvolution {
  const adj = buildAdjacencyList(nodes, links);
  const currentClusters = detectCommunitiesLabelPropagation(nodes, adj);

  const communityMembers = new Map<number, string[]>();
  currentClusters.forEach((clusterId, nodeId) => {
    if (!communityMembers.has(clusterId)) communityMembers.set(clusterId, []);
    communityMembers.get(clusterId)!.push(nodeId);
  });

  const communities: CommunitySnapshot[] = Array.from(communityMembers.entries()).map(([id, members]) => {
    let internalEdges = 0;
    let externalEdges = 0;

    members.forEach(nodeId => {
      const neighbors = adj.get(nodeId);
      if (neighbors) {
        neighbors.forEach((_, neighborId) => {
          if (members.includes(neighborId)) internalEdges++;
          else externalEdges++;
        });
      }
    });

    const possibleInternal = members.length * (members.length - 1);
    const cohesion = possibleInternal > 0 ? internalEdges / possibleInternal : 0;

    let leaderNodeId: string | null = null;
    let maxDegree = 0;
    members.forEach(nodeId => {
      const neighbors = adj.get(nodeId);
      if (neighbors && neighbors.size > maxDegree) {
        maxDegree = neighbors.size;
        leaderNodeId = nodeId;
      }
    });

    return {
      id,
      members,
      size: members.length,
      cohesion,
      leaderNodeId,
      externalConnections: externalEdges / 2,
    };
  });

  const transitions: CommunityTransition[] = [];
  if (previousClusters) {
    currentClusters.forEach((newCluster, nodeId) => {
      const oldCluster = previousClusters.get(nodeId);
      if (oldCluster !== undefined && oldCluster !== newCluster) {
        transitions.push({
          fromCommunityId: oldCluster,
          toCommunityId: newCluster,
          nodeId,
          transitionType: 'leave',
        });
      }
    });
  }

  const avgCohesion = communities.length > 0
    ? communities.reduce((sum, c) => sum + c.cohesion, 0) / communities.length
    : 0;

  const keyConnectors = nodes
    .filter(n => {
      const neighbors = adj.get(n.id);
      if (!neighbors) return false;
      const externalClusters = new Set<number>();
      neighbors.forEach((_, neighborId) => {
        const cluster = currentClusters.get(neighborId);
        if (cluster !== currentClusters.get(n.id)) externalClusters.add(cluster!);
      });
      return externalClusters.size >= 2;
    })
    .slice(0, 10)
    .map(n => n.id);

  const healthMetrics: CommunityHealthMetrics = {
    avgCohesion,
    fragmentationRisk: communities.length > 1 && avgCohesion < 0.3 ? 0.7 : 0.3,
    growthPotential: communities.filter(c => c.size < 5).length / (communities.length || 1),
    keyConnectors,
  };

  return { communities, transitions, healthMetrics };
}
