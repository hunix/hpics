/**
 * Information Epidemic Modeler (v9.0)
 * 
 * Source: Network Diffusion Framework (IEEE 2024)
 * 
 * Simulate information spreading processes using epidemiological models:
 * SI, SIR, SIS, Independent Cascade (IC), Linear Threshold (LT)
 */

export type EpidemicModel = 'SI' | 'SIR' | 'SIS' | 'IC' | 'LT';

export interface NetworkNode {
  id: string;
  state: 'susceptible' | 'infected' | 'recovered' | 'resistant';
  threshold?: number; // For LT model
  activationTime?: number;
  neighbors: string[];
  attributes: Record<string, number>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number; // Transmission probability
  type: 'trust' | 'influence' | 'communication';
}

export interface SimulationConfig {
  model: EpidemicModel;
  transmissionRate: number; // Beta
  recoveryRate?: number; // Gamma (for SIR/SIS)
  seedNodes: string[];
  maxSteps: number;
  stochastic: boolean;
}

export interface SimulationStep {
  step: number;
  susceptible: number;
  infected: number;
  recovered: number;
  newlyInfected: string[];
  cumulativeReach: number;
}

export interface SimulationResult {
  config: SimulationConfig;
  steps: SimulationStep[];
  finalReach: number;
  peakInfection: { step: number; count: number };
  r0Estimate: number; // Basic reproduction number
  criticalNodes: string[]; // Super-spreaders
  bottlenecks: string[]; // Nodes that limited spread
  timeToSaturation: number;
}

export interface BlastRadiusPrediction {
  hour6: { reach: number; confidence: number };
  hour12: { reach: number; confidence: number };
  hour24: { reach: number; confidence: number };
  hour48: { reach: number; confidence: number };
  finalReach: { reach: number; confidence: number };
}

export interface VaccinationStrategy {
  type: 'random' | 'degree' | 'betweenness' | 'eigenvector' | 'targeted';
  targetNodes: string[];
  expectedReduction: number;
  costPerNode: number;
}

/**
 * Run epidemic simulation on network
 */
export function simulateEpidemic(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  config: SimulationConfig
): SimulationResult {
  // Initialize node states
  const nodeMap = new Map<string, NetworkNode>();
  nodes.forEach(n => {
    nodeMap.set(n.id, {
      ...n,
      state: config.seedNodes.includes(n.id) ? 'infected' : 'susceptible',
      activationTime: config.seedNodes.includes(n.id) ? 0 : undefined,
    });
  });
  
  // Build adjacency list with edge weights
  const adjacency = new Map<string, Array<{ target: string; weight: number }>>();
  edges.forEach(e => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, []);
    adjacency.get(e.source)!.push({ target: e.target, weight: e.weight });
  });
  
  const steps: SimulationStep[] = [];
  let peakInfection = { step: 0, count: 0 };
  const infectionCounts: number[] = [];
  
  for (let step = 0; step < config.maxSteps; step++) {
    const currentInfected = Array.from(nodeMap.values()).filter(n => n.state === 'infected');
    const susceptible = Array.from(nodeMap.values()).filter(n => n.state === 'susceptible');
    const recovered = Array.from(nodeMap.values()).filter(n => n.state === 'recovered');
    
    const newlyInfected: string[] = [];
    
    // Process infections based on model
    switch (config.model) {
      case 'SI':
      case 'SIR':
      case 'SIS':
        for (const infected of currentInfected) {
          const neighbors = adjacency.get(infected.id) || [];
          for (const { target, weight } of neighbors) {
            const targetNode = nodeMap.get(target);
            if (targetNode && targetNode.state === 'susceptible') {
              const effectiveRate = config.transmissionRate * weight;
              if (!config.stochastic || Math.random() < effectiveRate) {
                targetNode.state = 'infected';
                targetNode.activationTime = step;
                newlyInfected.push(target);
              }
            }
          }
        }
        
        // Recovery (SIR/SIS only)
        if (config.model !== 'SI' && config.recoveryRate) {
          for (const infected of currentInfected) {
            if (!config.stochastic || Math.random() < config.recoveryRate) {
              infected.state = config.model === 'SIR' ? 'recovered' : 'susceptible';
            }
          }
        }
        break;
        
      case 'IC':
        // Independent Cascade - each infected node has one chance to infect neighbors
        for (const infected of currentInfected) {
          if (infected.activationTime === step - 1) {
            const neighbors = adjacency.get(infected.id) || [];
            for (const { target, weight } of neighbors) {
              const targetNode = nodeMap.get(target);
              if (targetNode && targetNode.state === 'susceptible') {
                if (!config.stochastic || Math.random() < weight) {
                  targetNode.state = 'infected';
                  targetNode.activationTime = step;
                  newlyInfected.push(target);
                }
              }
            }
          }
        }
        break;
        
      case 'LT':
        // Linear Threshold - activate if sum of neighbor weights exceeds threshold
        for (const node of susceptible) {
          const neighbors = adjacency.get(node.id) || [];
          const activeNeighbors = neighbors.filter(n => {
            const neighbor = nodeMap.get(n.target);
            return neighbor && neighbor.state === 'infected';
          });
          
          const influence = activeNeighbors.reduce((sum, n) => sum + n.weight, 0);
          const threshold = node.threshold ?? 0.5;
          
          if (influence >= threshold) {
            node.state = 'infected';
            node.activationTime = step;
            newlyInfected.push(node.id);
          }
        }
        break;
    }
    
    const infectedCount = Array.from(nodeMap.values()).filter(n => n.state === 'infected').length;
    infectionCounts.push(infectedCount);
    
    if (infectedCount > peakInfection.count) {
      peakInfection = { step, count: infectedCount };
    }
    
    const stepResult: SimulationStep = {
      step,
      susceptible: susceptible.length - newlyInfected.length,
      infected: infectedCount,
      recovered: recovered.length,
      newlyInfected,
      cumulativeReach: Array.from(nodeMap.values()).filter(
        n => n.state === 'infected' || n.state === 'recovered'
      ).length,
    };
    
    steps.push(stepResult);
    
    // Check for convergence
    if (newlyInfected.length === 0 && 
        (config.model === 'SI' || config.model === 'IC' || config.model === 'LT')) {
      break;
    }
  }
  
  // Calculate R0 estimate
  const r0Estimate = calculateR0(steps, config.seedNodes.length);
  
  // Identify critical nodes (super-spreaders)
  const criticalNodes = identifySuperSpreaders(nodeMap, adjacency, steps);
  
  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(nodeMap, adjacency, steps);
  
  // Time to reach 90% of final infection
  const finalReach = steps[steps.length - 1]?.cumulativeReach || 0;
  const saturationThreshold = finalReach * 0.9;
  const timeToSaturation = steps.findIndex(s => s.cumulativeReach >= saturationThreshold);
  
  return {
    config,
    steps,
    finalReach,
    peakInfection,
    r0Estimate,
    criticalNodes,
    bottlenecks,
    timeToSaturation: timeToSaturation >= 0 ? timeToSaturation : config.maxSteps,
  };
}

function calculateR0(steps: SimulationStep[], initialInfected: number): number {
  if (steps.length < 2) return 0;
  
  // Average secondary infections per primary case in early steps
  let totalSecondary = 0;
  let generations = 0;
  
  for (let i = 1; i < Math.min(5, steps.length); i++) {
    const previousInfected = i === 1 ? initialInfected : steps[i - 1].newlyInfected.length;
    if (previousInfected > 0) {
      totalSecondary += steps[i].newlyInfected.length / previousInfected;
      generations++;
    }
  }
  
  return generations > 0 ? totalSecondary / generations : 0;
}

function identifySuperSpreaders(
  nodeMap: Map<string, NetworkNode>,
  adjacency: Map<string, Array<{ target: string; weight: number }>>,
  steps: SimulationStep[]
): string[] {
  const infectionCounts = new Map<string, number>();
  
  for (const step of steps) {
    for (const newlyInfected of step.newlyInfected) {
      const node = nodeMap.get(newlyInfected);
      if (node?.activationTime !== undefined && node.activationTime > 0) {
        // Find who infected this node
        const neighbors = Array.from(adjacency.entries())
          .filter(([_, targets]) => targets.some(t => t.target === newlyInfected))
          .map(([source]) => source);
        
        for (const source of neighbors) {
          const sourceNode = nodeMap.get(source);
          if (sourceNode && sourceNode.state === 'infected' && 
              sourceNode.activationTime !== undefined &&
              sourceNode.activationTime < node.activationTime) {
            infectionCounts.set(source, (infectionCounts.get(source) || 0) + 1);
          }
        }
      }
    }
  }
  
  return Array.from(infectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
}

function identifyBottlenecks(
  nodeMap: Map<string, NetworkNode>,
  adjacency: Map<string, Array<{ target: string; weight: number }>>,
  steps: SimulationStep[]
): string[] {
  // Nodes that are infected but have few/no downstream infections
  const downstreamCounts = new Map<string, number>();
  
  for (const [id, node] of nodeMap.entries()) {
    if (node.state === 'infected' || node.state === 'recovered') {
      const neighbors = adjacency.get(id) || [];
      const infectedDownstream = neighbors.filter(n => {
        const neighbor = nodeMap.get(n.target);
        return neighbor && 
               (neighbor.state === 'infected' || neighbor.state === 'recovered') &&
               neighbor.activationTime !== undefined &&
               node.activationTime !== undefined &&
               neighbor.activationTime > node.activationTime;
      }).length;
      
      if (infectedDownstream === 0 && neighbors.length > 0) {
        downstreamCounts.set(id, neighbors.length);
      }
    }
  }
  
  return Array.from(downstreamCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);
}

/**
 * Predict blast radius at various time horizons
 */
export function predictBlastRadius(
  simulationResults: SimulationResult[],
  networkSize: number
): BlastRadiusPrediction {
  const reaches = simulationResults.map(r => r.steps);
  
  // Calculate mean and confidence interval at each horizon
  const getReachAtStep = (step: number): { reach: number; confidence: number } => {
    const values = reaches.map(steps => {
      const s = steps.find(st => st.step === step) || steps[steps.length - 1];
      return s ? s.cumulativeReach / networkSize : 0;
    });
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
    );
    
    return {
      reach: mean,
      confidence: 1 - (stdDev / Math.max(mean, 0.01)),
    };
  };
  
  return {
    hour6: getReachAtStep(6),
    hour12: getReachAtStep(12),
    hour24: getReachAtStep(24),
    hour48: getReachAtStep(48),
    finalReach: {
      reach: simulationResults.reduce((sum, r) => sum + r.finalReach, 0) / 
             simulationResults.length / networkSize,
      confidence: 0.85,
    },
  };
}

/**
 * Simulate panic propagation with Weber-Fechner dynamics
 */
export function simulatePanicPropagation(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  seedNodes: string[],
  panicIntensity: number
): SimulationResult {
  // Apply Weber-Fechner law: perceived intensity = k * log(stimulus/threshold)
  const weberFechnerTransmission = (baseRate: number, intensity: number): number => {
    const k = 0.5;
    const threshold = 0.1;
    const perceivedIntensity = k * Math.log(Math.max(intensity, threshold) / threshold);
    return Math.min(1, baseRate * perceivedIntensity);
  };
  
  // Modify edges with panic intensity
  const panicEdges = edges.map(e => ({
    ...e,
    weight: weberFechnerTransmission(e.weight, panicIntensity),
  }));
  
  return simulateEpidemic(nodes, panicEdges, {
    model: 'IC',
    transmissionRate: 0.8,
    seedNodes,
    maxSteps: 100,
    stochastic: true,
  });
}

/**
 * Calculate optimal vaccination (counter-narrative) strategy
 */
export function calculateVaccinationStrategy(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  budget: number,
  costPerVaccination: number
): VaccinationStrategy {
  const maxVaccinations = Math.floor(budget / costPerVaccination);
  
  // Calculate node centralities
  const degreeCentrality = new Map<string, number>();
  const betweennessCentrality = new Map<string, number>();
  
  // Simple degree centrality
  edges.forEach(e => {
    degreeCentrality.set(e.source, (degreeCentrality.get(e.source) || 0) + 1);
    degreeCentrality.set(e.target, (degreeCentrality.get(e.target) || 0) + 1);
  });
  
  // Sort by degree and select top nodes
  const targetNodes = Array.from(degreeCentrality.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxVaccinations)
    .map(([id]) => id);
  
  // Estimate reduction based on centrality coverage
  const totalDegree = Array.from(degreeCentrality.values()).reduce((a, b) => a + b, 0);
  const vaccinatedDegree = targetNodes.reduce(
    (sum, id) => sum + (degreeCentrality.get(id) || 0), 0
  );
  const expectedReduction = vaccinatedDegree / totalDegree;
  
  return {
    type: 'degree',
    targetNodes,
    expectedReduction,
    costPerNode: costPerVaccination,
  };
}

/**
 * Run Monte Carlo simulations for confidence intervals
 */
export function runMonteCarloSimulations(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  config: SimulationConfig,
  numSimulations: number = 1000
): {
  results: SimulationResult[];
  meanReach: number;
  stdDevReach: number;
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
} {
  const results: SimulationResult[] = [];
  
  for (let i = 0; i < numSimulations; i++) {
    const result = simulateEpidemic(
      JSON.parse(JSON.stringify(nodes)), // Deep copy
      edges,
      { ...config, stochastic: true }
    );
    results.push(result);
  }
  
  const reaches = results.map(r => r.finalReach).sort((a, b) => a - b);
  const meanReach = reaches.reduce((a, b) => a + b, 0) / reaches.length;
  const stdDevReach = Math.sqrt(
    reaches.reduce((sum, r) => sum + Math.pow(r - meanReach, 2), 0) / reaches.length
  );
  
  return {
    results,
    meanReach,
    stdDevReach,
    percentiles: {
      p5: reaches[Math.floor(reaches.length * 0.05)],
      p25: reaches[Math.floor(reaches.length * 0.25)],
      p50: reaches[Math.floor(reaches.length * 0.50)],
      p75: reaches[Math.floor(reaches.length * 0.75)],
      p95: reaches[Math.floor(reaches.length * 0.95)],
    },
  };
}

/**
 * Detect coordinated inauthentic behavior signatures
 */
export function detectCoordinatedBehavior(
  activationTimes: Map<string, number>,
  edges: NetworkEdge[]
): {
  isCoordinated: boolean;
  confidence: number;
  suspiciousClusters: string[][];
  signatures: string[];
} {
  const signatures: string[] = [];
  const suspiciousClusters: string[][] = [];
  
  // Check for synchronized activation (bot-like behavior)
  const timeGroups = new Map<number, string[]>();
  activationTimes.forEach((time, nodeId) => {
    if (!timeGroups.has(time)) timeGroups.set(time, []);
    timeGroups.get(time)!.push(nodeId);
  });
  
  // Unusually large synchronous groups
  for (const [time, nodes] of timeGroups.entries()) {
    if (nodes.length > 10) {
      suspiciousClusters.push(nodes);
      signatures.push(`Synchronized activation: ${nodes.length} nodes at t=${time}`);
    }
  }
  
  // Check for perfect cascade patterns (no randomness)
  const activationDeltas: number[] = [];
  const sortedActivations = Array.from(activationTimes.entries())
    .sort((a, b) => a[1] - b[1]);
  
  for (let i = 1; i < sortedActivations.length; i++) {
    activationDeltas.push(sortedActivations[i][1] - sortedActivations[i - 1][1]);
  }
  
  if (activationDeltas.length > 10) {
    const uniqueDeltas = new Set(activationDeltas).size;
    if (uniqueDeltas < activationDeltas.length * 0.1) {
      signatures.push('Highly regular activation intervals - possible automation');
    }
  }
  
  const isCoordinated = suspiciousClusters.length > 0 || signatures.length > 1;
  const confidence = Math.min(1, signatures.length * 0.3 + suspiciousClusters.length * 0.2);
  
  return {
    isCoordinated,
    confidence,
    suspiciousClusters,
    signatures,
  };
}
