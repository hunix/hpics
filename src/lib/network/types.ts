// Network Analysis Types - Shared across all network algorithms

export interface NetworkNode {
  id: string;
  [key: string]: any;
}

export interface NetworkLink {
  source: string | NetworkNode;
  target: string | NetworkNode;
  weight?: number;
  timestamp?: number;
  [key: string]: any;
}

export interface AdjacencyList extends Map<string, Map<string, number>> {}

// Centrality types
export type CentralityMap = Map<string, number>;

// Cluster types
export type ClusterMap = Map<string, number>;

export interface HierarchicalCluster {
  level: number;
  clusters: ClusterMap;
  clusterCount: number;
}

export interface StructuralHole {
  bridgeNode: string;
  communities: number[];
  bridgeScore: number;
  potentialValue: string;
}

// Weak tie types
export interface WeakTie {
  nodeId: string;
  targetId: string;
  bridgeScore: number;
  communities: [number, number];
  potentialValue: 'high' | 'medium' | 'low';
}

// Link prediction types
export interface PredictedLink {
  source: string;
  target: string;
  score: number;
  commonNeighbors: number;
  method: 'adamic_adar' | 'common_neighbors' | 'jaccard';
}

// Resilience types
export interface ResilienceMetrics {
  averageConnectivity: number;
  giantComponentRatio: number;
  criticalNodes: string[];
  vulnerabilityScore: number;
}

// Influence types
export interface InfluenceFlow {
  path: string[];
  totalStrength: number;
  bottleneck: string | null;
}

export interface InfluencePropagationResult {
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
}

// Community types
export type CommunityRole = 'leader' | 'connector' | 'active' | 'peripheral' | 'isolated';

export interface NodeRole {
  nodeId: string;
  role: CommunityRole;
  internalStrength: number;
  externalStrength: number;
  participation: number;
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

export interface CommunityEvolution {
  communities: CommunitySnapshot[];
  transitions: CommunityTransition[];
  healthMetrics: CommunityHealthMetrics;
}

// Temporal types
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

// Growth opportunity types
export interface GrowthOpportunity {
  type: 'bridge_gap' | 'strengthen_cluster' | 'add_redundancy';
  nodes: string[];
  impact: number;
  description: string;
}

// Strategic connection types
export interface StrategicConnection {
  targetNodeId: string;
  targetId?: string; // Alias for targetNodeId for backward compatibility
  reason: string;
  expectedImpact: number;
  requiredIntroductions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  bridgesCommunities?: boolean;
  fillsStructuralHole?: boolean;
  networkROI?: number;
  score?: number;
}

// Connection recommendation type (alias for StrategicConnection)
export type ConnectionRecommendation = StrategicConnection;

// Network metrics aggregate type
export interface NetworkMetrics {
  pageRank: Map<string, number>;
  closenessCentrality: Map<string, number>;
  betweennessCentrality: Map<string, number>;
  eigenvectorCentrality: Map<string, number>;
  clusters: Map<string, number>;
  topInfluencers: string[];
  bridgeConnectors: string[];
  clusterCount?: number;
}

// Cluster colors constant
export const CLUSTER_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#a855f7', '#0ea5e9', '#10b981', '#eab308',
];

export function getClusterColor(clusterId: number): string {
  return CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
}
