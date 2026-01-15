// Memetic Propagation Engine - Viral idea engineering with SIR epidemic modeling

export interface Meme {
  id: string;
  content: string;
  format: 'narrative' | 'slogan' | 'image-text' | 'video' | 'ritual';
  emotionalPayload: EmotionalPayload;
  replicability: number; // 0-1
  fidelity: number; // How well it maintains meaning during spread
  longevity: number; // How long it remains active
}

export interface EmotionalPayload {
  anger: number;
  fear: number;
  joy: number;
  disgust: number;
  surprise: number;
  sadness: number;
  primaryEmotion: string;
  intensity: number;
}

export interface MemeticCampaign {
  id: string;
  meme: Meme;
  targetDemographics: string[];
  seedNodes: string[]; // Initial spreaders
  propagationModel: PropagationModel;
  status: 'planning' | 'seeding' | 'spreading' | 'peak' | 'declining';
  metrics: CampaignMetrics;
}

export interface PropagationModel {
  type: 'SIR' | 'SEIR' | 'complex_contagion';
  parameters: {
    beta: number; // Infection rate
    gamma: number; // Recovery rate
    sigma?: number; // Incubation rate (SEIR only)
    threshold?: number; // Adoption threshold (complex contagion)
  };
}

export interface CampaignMetrics {
  reach: number;
  engagementRate: number;
  shareRate: number;
  sentimentShift: number;
  R0: number; // Basic reproduction number
  currentPhase: 'exponential' | 'linear' | 'saturation' | 'decline';
}

// Dawkins' original memetic fitness criteria
export const MEMETIC_FITNESS_FACTORS = {
  FECUNDITY: {
    name: 'Fecundity',
    description: 'Rate of replication',
    weight: 0.35,
  },
  FIDELITY: {
    name: 'Fidelity',
    description: 'Accuracy of copies',
    weight: 0.25,
  },
  LONGEVITY: {
    name: 'Longevity',
    description: 'Lifespan of copies',
    weight: 0.2,
  },
  ADAPTABILITY: {
    name: 'Adaptability',
    description: 'Mutation to fit new contexts',
    weight: 0.2,
  },
} as const;

// Emotional contagion multipliers (based on Berger & Milkman research)
export const EMOTION_VIRALITY = {
  anger: 2.3,
  anxiety: 1.8,
  awe: 1.7,
  joy: 1.5,
  sadness: 0.6,
  contentment: 0.4,
} as const;

// Calculate SIR model dynamics
export function calculateSIRDynamics(
  susceptible: number,
  infected: number,
  recovered: number,
  beta: number,
  gamma: number,
  timeStep: number = 1
): { S: number; I: number; R: number } {
  const N = susceptible + infected + recovered;
  
  const newInfections = (beta * susceptible * infected) / N * timeStep;
  const newRecoveries = gamma * infected * timeStep;
  
  return {
    S: Math.max(0, susceptible - newInfections),
    I: Math.max(0, infected + newInfections - newRecoveries),
    R: recovered + newRecoveries,
  };
}

// Calculate R0 (basic reproduction number)
export function calculateR0(beta: number, gamma: number): number {
  return beta / gamma;
}

// Evaluate meme fitness
export function evaluateMemeticFitness(meme: Meme): number {
  const { replicability, fidelity, longevity } = meme;
  const { intensity, primaryEmotion } = meme.emotionalPayload;
  
  // Get virality multiplier for primary emotion
  const viralityMultiplier = EMOTION_VIRALITY[primaryEmotion as keyof typeof EMOTION_VIRALITY] || 1;
  
  // Calculate weighted fitness
  const baseFitness = (
    (replicability * MEMETIC_FITNESS_FACTORS.FECUNDITY.weight) +
    (fidelity * MEMETIC_FITNESS_FACTORS.FIDELITY.weight) +
    (longevity * MEMETIC_FITNESS_FACTORS.LONGEVITY.weight) +
    (0.7 * MEMETIC_FITNESS_FACTORS.ADAPTABILITY.weight) // Default adaptability
  );
  
  // Apply emotional multiplier
  return baseFitness * (1 + (viralityMultiplier - 1) * intensity);
}

// Identify optimal seed nodes
export function identifySeedNodes(
  networkGraph: { nodes: string[]; edges: [string, string][] },
  count: number = 5
): string[] {
  // Calculate degree centrality for each node
  const degreeCentrality: Record<string, number> = {};
  
  networkGraph.nodes.forEach(node => {
    degreeCentrality[node] = networkGraph.edges.filter(
      ([a, b]) => a === node || b === node
    ).length;
  });
  
  // Sort by centrality and return top nodes
  return Object.entries(degreeCentrality)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([node]) => node);
}

// Predict campaign trajectory
export function predictCampaignTrajectory(
  initialInfected: number,
  population: number,
  R0: number,
  days: number = 30
): Array<{ day: number; S: number; I: number; R: number }> {
  const trajectory: Array<{ day: number; S: number; I: number; R: number }> = [];
  
  let S = population - initialInfected;
  let I = initialInfected;
  let R = 0;
  
  const gamma = 0.1; // Average recovery rate
  const beta = R0 * gamma;
  
  for (let day = 0; day <= days; day++) {
    trajectory.push({ day, S: Math.round(S), I: Math.round(I), R: Math.round(R) });
    const next = calculateSIRDynamics(S, I, R, beta, gamma);
    S = next.S;
    I = next.I;
    R = next.R;
  }
  
  return trajectory;
}
