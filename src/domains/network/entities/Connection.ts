/**
 * Connection Entity
 * Represents a relationship between two nodes in the network
 */

export type ConnectionStrength = 'strong' | 'moderate' | 'weak' | 'dormant';
export type ConnectionTrend = 'growing' | 'stable' | 'declining' | 'reviving';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  weight: number;
  strength: ConnectionStrength;
  trend: ConnectionTrend;
  
  // Temporal data
  firstContactDate: Date | null;
  lastContactDate: Date | null;
  interactionCount: number;
  
  // Analysis
  isBridge: boolean;
  bridgeScore: number;
  communities: number[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectionPrediction {
  sourceId: string;
  targetId: string;
  score: number;
  commonNeighbors: number;
  method: 'adamic_adar' | 'common_neighbors' | 'jaccard';
  reason: string;
}

export interface ConnectionRecommendation {
  targetNodeId: string;
  reason: string;
  expectedImpact: number;
  requiredIntroductions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  bridgesCommunities: boolean;
  fillsStructuralHole: boolean;
  networkROI: number;
}

export interface SleepingConnection {
  nodeId: string;
  targetId: string;
  lastActiveDate: Date;
  historicalStrength: number;
  dormancyDays: number;
  revivalPotential: 'high' | 'medium' | 'low';
}

// Helper functions
export function calculateConnectionStrength(
  interactionCount: number,
  daysSinceContact: number
): ConnectionStrength {
  if (daysSinceContact > 180 || interactionCount === 0) return 'dormant';
  if (interactionCount > 20 && daysSinceContact < 30) return 'strong';
  if (interactionCount > 5 && daysSinceContact < 90) return 'moderate';
  return 'weak';
}

export function calculateConnectionTrend(
  recentInteractions: number,
  historicalAverage: number
): ConnectionTrend {
  const ratio = recentInteractions / Math.max(historicalAverage, 1);
  if (ratio > 1.5) return 'growing';
  if (ratio < 0.5) return 'declining';
  if (recentInteractions > 0 && historicalAverage === 0) return 'reviving';
  return 'stable';
}
