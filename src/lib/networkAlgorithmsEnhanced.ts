// Enhanced Network Analysis Algorithms
// Adds influence propagation, temporal analysis, and community evolution

interface NetworkNode {
  id: string;
  [key: string]: any;
}

interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight?: number;
  timestamp?: number;
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

// ============================================
// INFLUENCE PROPAGATION SIMULATION
// ============================================

export interface InfluencePropagationResult {
  seedNode: string;
  reachableNodes: Map<string, number>; // node -> time step reached
  maxReach: number;
  avgTimeToReach: number;
  propagationWaves: PropagationWave[];
  bottlenecks: string[];
}

interface PropagationWave {
  step: number;
  nodesReached: string[];
  cumulativeReach: number;
}

export function simulateInfluencePropagation(
  nodes: NetworkNode[],
  links: NetworkLink[],
  seedNodeId: string,
  propagationProbability: number = 0.3,
  maxSteps: number = 10,
  simulations: number = 100
): InfluencePropagationResult {
  const adj = buildAdjacencyList(nodes, links);
  
  // Run multiple simulations and aggregate results
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
          
          // Probability modified by edge weight
          const effectiveProb = propagationProbability * weight;
          if (Math.random() < effectiveProb) {
            newlyInfected.push(neighborId);
            reachTime.set(neighborId, step);
          }
        });
      });
      
      newlyInfected.forEach(n => infected.add(n));
    }
    
    // Record reach times for this simulation
    nodes.forEach(n => {
      const times = reachCounts.get(n.id)!;
      times.push(reachTime.has(n.id) ? reachTime.get(n.id)! : -1);
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
  
  // Identify bottlenecks (nodes that when removed significantly reduce reach)
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
  
  // Test removing each node
  nodes.slice(0, 50).forEach(node => {
    if (node.id === seedNodeId) return;
    
    const filteredNodes = nodes.filter(n => n.id !== node.id);
    const filteredLinks = links.filter(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return sourceId !== node.id && targetId !== node.id;
    });
    
    // Quick BFS to measure reach without this node
    const adj = buildAdjacencyList(filteredNodes, filteredLinks);
    const visited = new Set<string>([seedNodeId]);
    const queue = [seedNodeId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = adj.get(current);
      if (neighbors) {
        neighbors.forEach((_, neighborId) => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        });
      }
    }
    
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

// ============================================
// TEMPORAL NETWORK ANALYSIS
// ============================================

export interface TemporalNetworkMetrics {
  relationshipStrengthOverTime: Map<string, number[]>;
  sleepingConnections: SleepingConnection[];
  trajectoryPredictions: TrajectoryPrediction[];
  seasonalPatterns: SeasonalPattern[];
}

export interface SleepingConnection {
  nodeId: string;
  lastActiveTimestamp: number;
  historicalStrength: number;
  dormancyDays: number;
  revivalPotential: 'high' | 'medium' | 'low';
}

export interface TrajectoryPrediction {
  nodeId: string;
  currentStrength: number;
  predictedStrength30d: number;
  predictedStrength90d: number;
  trend: 'strengthening' | 'stable' | 'weakening' | 'dormant';
  confidence: number;
}

export interface SeasonalPattern {
  nodeId: string;
  peakMonths: number[];
  lowMonths: number[];
  cyclePeriodDays: number;
  patternStrength: number;
}

export function analyzeTemporalNetwork(
  nodes: NetworkNode[],
  links: NetworkLink[],
  timeWindowDays: number = 365
): TemporalNetworkMetrics {
  const now = Date.now();
  const windowStart = now - timeWindowDays * 24 * 60 * 60 * 1000;
  
  // Filter links to time window and add timestamps
  const temporalLinks = links.filter(l => {
    const timestamp = l.timestamp || now;
    return timestamp >= windowStart;
  });
  
  // Build time series for each node pair
  const pairTimeSeries = new Map<string, number[]>();
  const nodeLastActive = new Map<string, number>();
  const nodeInteractionCounts = new Map<string, number[]>();
  
  // Initialize monthly buckets (12 months)
  nodes.forEach(n => {
    nodeInteractionCounts.set(n.id, new Array(12).fill(0));
  });
  
  temporalLinks.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    const timestamp = link.timestamp || now;
    const weight = link.weight || 1;
    
    // Track pair time series
    const pairKey = [sourceId, targetId].sort().join('-');
    if (!pairTimeSeries.has(pairKey)) {
      pairTimeSeries.set(pairKey, []);
    }
    pairTimeSeries.get(pairKey)!.push(weight);
    
    // Track last active
    nodeLastActive.set(sourceId, Math.max(nodeLastActive.get(sourceId) || 0, timestamp));
    nodeLastActive.set(targetId, Math.max(nodeLastActive.get(targetId) || 0, timestamp));
    
    // Track monthly interactions
    const month = new Date(timestamp).getMonth();
    const sourceCounts = nodeInteractionCounts.get(sourceId);
    const targetCounts = nodeInteractionCounts.get(targetId);
    if (sourceCounts) sourceCounts[month]++;
    if (targetCounts) targetCounts[month]++;
  });
  
  // Calculate relationship strength over time
  const relationshipStrengthOverTime = new Map<string, number[]>();
  pairTimeSeries.forEach((weights, pairKey) => {
    // Divide into 4 quarters
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
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  nodes.forEach(node => {
    const lastActive = nodeLastActive.get(node.id) || 0;
    const dormancyDays = Math.floor((now - lastActive) / (24 * 60 * 60 * 1000));
    
    if (dormancyDays > 30) {
      // Calculate historical strength
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
    
    const currentStrength = nodeStrengths.length > 0 
      ? nodeStrengths[nodeStrengths.length - 1] 
      : 0;
    
    // Simple linear projection
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
    
    // Simple pattern strength based on variance
    const variance = monthlyCounts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / 12;
    const patternStrength = Math.min(1, variance / (avg * avg + 1));
    
    return {
      nodeId: node.id,
      peakMonths,
      lowMonths,
      cyclePeriodDays: 365, // Assuming annual cycle
      patternStrength,
    };
  }).filter(p => p.patternStrength > 0.2);
  
  return {
    relationshipStrengthOverTime,
    sleepingConnections: sleepingConnections.sort((a, b) => b.historicalStrength - a.historicalStrength),
    trajectoryPredictions,
    seasonalPatterns,
  };
}

// ============================================
// COMMUNITY EVOLUTION ANALYSIS
// ============================================

export interface CommunityEvolution {
  communities: CommunitySnapshot[];
  transitions: CommunityTransition[];
  healthMetrics: CommunityHealthMetrics;
}

export interface CommunitySnapshot {
  id: number;
  members: string[];
  size: number;
  cohesion: number;
  leaderNodeId: string | null;
  externalConnections: number;
}

export interface CommunityTransition {
  fromCommunityId: number;
  toCommunityId: number;
  nodeId: string;
  transitionType: 'join' | 'leave' | 'merge' | 'split';
}

export interface CommunityHealthMetrics {
  avgCohesion: number;
  fragmentationRisk: number;
  growthPotential: number;
  keyConnectors: string[];
}

export function analyzeCommunityEvolution(
  nodes: NetworkNode[],
  links: NetworkLink[],
  previousClusters?: Map<string, number>
): CommunityEvolution {
  const adj = buildAdjacencyList(nodes, links);
  
  // Detect current communities using label propagation
  const currentClusters = detectCommunitiesLabelPropagation(nodes, adj);
  
  // Build community snapshots
  const communityMembers = new Map<number, string[]>();
  currentClusters.forEach((clusterId, nodeId) => {
    if (!communityMembers.has(clusterId)) {
      communityMembers.set(clusterId, []);
    }
    communityMembers.get(clusterId)!.push(nodeId);
  });
  
  const communities: CommunitySnapshot[] = Array.from(communityMembers.entries()).map(([id, members]) => {
    // Calculate cohesion (internal edge density)
    let internalEdges = 0;
    let externalEdges = 0;
    
    members.forEach(nodeId => {
      const neighbors = adj.get(nodeId);
      if (neighbors) {
        neighbors.forEach((_, neighborId) => {
          if (members.includes(neighborId)) {
            internalEdges++;
          } else {
            externalEdges++;
          }
        });
      }
    });
    
    const possibleInternal = members.length * (members.length - 1);
    const cohesion = possibleInternal > 0 ? internalEdges / possibleInternal : 0;
    
    // Find leader (highest degree within community)
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
  
  // Detect transitions if we have previous clusters
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
        transitions.push({
          fromCommunityId: oldCluster,
          toCommunityId: newCluster,
          nodeId,
          transitionType: 'join',
        });
      }
    });
  }
  
  // Calculate health metrics
  const avgCohesion = communities.length > 0 
    ? communities.reduce((sum, c) => sum + c.cohesion, 0) / communities.length 
    : 0;
  
  // Find key connectors (nodes with high betweenness between communities)
  const keyConnectors: string[] = [];
  nodes.forEach(node => {
    const neighbors = adj.get(node.id);
    if (!neighbors) return;
    
    const nodeCluster = currentClusters.get(node.id);
    let crossCommunityEdges = 0;
    neighbors.forEach((_, neighborId) => {
      if (currentClusters.get(neighborId) !== nodeCluster) {
        crossCommunityEdges++;
      }
    });
    
    if (crossCommunityEdges >= 2) {
      keyConnectors.push(node.id);
    }
  });
  
  const fragmentationRisk = communities.filter(c => c.size < 3).length / Math.max(1, communities.length);
  const growthPotential = keyConnectors.length / Math.max(1, nodes.length);
  
  return {
    communities,
    transitions,
    healthMetrics: {
      avgCohesion,
      fragmentationRisk,
      growthPotential,
      keyConnectors: keyConnectors.slice(0, 10),
    },
  };
}

function detectCommunitiesLabelPropagation(
  nodes: NetworkNode[],
  adj: Map<string, Map<string, number>>,
  maxIterations: number = 20
): Map<string, number> {
  // Initialize each node with unique label
  const labels = new Map<string, number>();
  nodes.forEach((node, index) => labels.set(node.id, index));
  
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    
    // Shuffle nodes for random order
    const shuffled = [...nodes].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(node => {
      const neighbors = adj.get(node.id);
      if (!neighbors || neighbors.size === 0) return;
      
      // Count neighbor labels weighted by edge weight
      const labelCounts = new Map<number, number>();
      neighbors.forEach((weight, neighborId) => {
        const neighborLabel = labels.get(neighborId) || 0;
        labelCounts.set(neighborLabel, (labelCounts.get(neighborLabel) || 0) + weight);
      });
      
      // Find most common label
      let maxCount = 0;
      let newLabel = labels.get(node.id)!;
      labelCounts.forEach((count, label) => {
        if (count > maxCount) {
          maxCount = count;
          newLabel = label;
        }
      });
      
      if (labels.get(node.id) !== newLabel) {
        labels.set(node.id, newLabel);
        changed = true;
      }
    });
    
    if (!changed) break;
  }
  
  // Normalize labels to consecutive integers
  const uniqueLabels = [...new Set(labels.values())];
  const labelMap = new Map(uniqueLabels.map((l, i) => [l, i]));
  
  const normalizedLabels = new Map<string, number>();
  labels.forEach((label, nodeId) => {
    normalizedLabels.set(nodeId, labelMap.get(label) || 0);
  });
  
  return normalizedLabels;
}

// ============================================
// STRATEGIC CONNECTION RECOMMENDER
// ============================================

export interface ConnectionRecommendation {
  sourceId: string;
  targetId: string;
  score: number;
  networkROI: number;
  reason: string;
  bridgesCommunities: boolean;
  fillsStructuralHole: boolean;
}

export function recommendStrategicConnections(
  nodes: NetworkNode[],
  links: NetworkLink[],
  focusNodeId: string,
  topK: number = 10
): ConnectionRecommendation[] {
  const adj = buildAdjacencyList(nodes, links);
  const clusters = detectCommunitiesLabelPropagation(nodes, adj);
  const focusCluster = clusters.get(focusNodeId);
  
  const existingConnections = new Set<string>();
  const focusNeighbors = adj.get(focusNodeId);
  if (focusNeighbors) {
    focusNeighbors.forEach((_, neighborId) => {
      existingConnections.add(neighborId);
    });
  }
  
  const recommendations: ConnectionRecommendation[] = [];
  
  nodes.forEach(node => {
    if (node.id === focusNodeId || existingConnections.has(node.id)) return;
    
    const nodeCluster = clusters.get(node.id);
    const bridgesCommunities = nodeCluster !== focusCluster;
    
    // Calculate common neighbors (Adamic-Adar)
    const nodeNeighbors = adj.get(node.id);
    let adamicAdarScore = 0;
    const commonNeighbors: string[] = [];
    
    if (focusNeighbors && nodeNeighbors) {
      focusNeighbors.forEach((_, focusNeighborId) => {
        if (nodeNeighbors.has(focusNeighborId)) {
          commonNeighbors.push(focusNeighborId);
          const degree = adj.get(focusNeighborId)?.size || 1;
          adamicAdarScore += 1 / Math.log(degree + 1);
        }
      });
    }
    
    // Check if this fills a structural hole
    const fillsStructuralHole = bridgesCommunities && commonNeighbors.length === 0;
    
    // Calculate network ROI
    const nodeDegree = nodeNeighbors?.size || 0;
    const networkROI = bridgesCommunities ? nodeDegree * 1.5 : nodeDegree;
    
    // Generate reason
    let reason = '';
    if (fillsStructuralHole) {
      reason = `Bridges to a new community with ${nodeDegree} connections`;
    } else if (commonNeighbors.length > 0) {
      reason = `${commonNeighbors.length} mutual connections suggest compatibility`;
    } else if (bridgesCommunities) {
      reason = 'Extends reach to different network segment';
    } else {
      reason = 'Strengthens local network density';
    }
    
    const score = adamicAdarScore + (bridgesCommunities ? 2 : 0) + (fillsStructuralHole ? 3 : 0);
    
    recommendations.push({
      sourceId: focusNodeId,
      targetId: node.id,
      score,
      networkROI,
      reason,
      bridgesCommunities,
      fillsStructuralHole,
    });
  });
  
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
