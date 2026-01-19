/**
 * Influence Entity
 * Represents influence propagation and flow in the network
 */

export interface InfluenceFlow {
  path: string[];
  totalStrength: number;
  bottleneck: string | null;
  hops: number;
}

export interface InfluencePropagation {
  seedNode: string;
  reachableNodes: Map<string, number>;
  maxReach: number;
  avgTimeToReach: number;
  propagationWaves: PropagationWave[];
  bottlenecks: string[];
}

export interface PropagationWave {
  step: number;
  nodesReached: string[];
  cumulativeReach: number;
  influenceStrength: number;
}

export interface InfluenceMetrics {
  nodeId: string;
  directInfluence: number;
  indirectInfluence: number;
  totalInfluence: number;
  influenceRank: number;
  reachability: number;
}

export interface InfluenceSimulation {
  id: string;
  seedNodes: string[];
  steps: number;
  decayFactor: number;
  results: InfluencePropagation[];
  timestamp: Date;
}

// Calculate influence decay over hops
export function calculateInfluenceDecay(
  initialStrength: number,
  hops: number,
  decayFactor: number = 0.5
): number {
  return initialStrength * Math.pow(decayFactor, hops);
}

// Identify bottlenecks in influence flow
export function identifyBottlenecks(
  propagation: InfluencePropagation,
  threshold: number = 0.3
): string[] {
  const bottlenecks: string[] = [];
  
  propagation.propagationWaves.forEach((wave, i) => {
    if (i > 0) {
      const prevWave = propagation.propagationWaves[i - 1];
      const growthRate = wave.nodesReached.length / Math.max(prevWave.nodesReached.length, 1);
      
      if (growthRate < threshold) {
        // Find nodes that limited the spread
        wave.nodesReached.forEach(nodeId => {
          if (!bottlenecks.includes(nodeId)) {
            bottlenecks.push(nodeId);
          }
        });
      }
    }
  });
  
  return bottlenecks;
}
