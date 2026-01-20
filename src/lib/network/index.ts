/**
 * Network Analysis Module - Unified exports
 * Consolidates all network algorithms into a single optimized module
 * 
 * IMPORTANT: Uses explicit named exports for IDE performance optimization.
 * Heavy algorithms are still available but imported when needed.
 */

// Core types from types.ts
export type {
  NetworkNode,
  NetworkLink,
  AdjacencyList,
  CentralityMap,
  ClusterMap,
  HierarchicalCluster,
  StructuralHole,
  WeakTie,
  PredictedLink,
  ResilienceMetrics,
  InfluenceFlow,
  InfluencePropagationResult,
  PropagationWave,
  CommunityRole,
  NodeRole,
  CommunitySnapshot,
  CommunityTransition,
  CommunityHealthMetrics,
  CommunityEvolution,
  TemporalNetworkMetrics,
  SleepingConnection,
  TrajectoryPrediction,
  SeasonalPattern,
  GrowthOpportunity,
  StrategicConnection,
  ConnectionRecommendation,
  NetworkMetrics,
} from './types';

export { CLUSTER_COLORS, getClusterColor } from './types';

// Re-export visualization types with correct names
export type {
  VisualizationNode,
  VisualizationLink,
  NetworkVisualizationData,
  ColorMode,
} from './types/visualization';

export { RELATIONSHIP_COLORS, RELATIONSHIP_TYPES } from './types/visualization';

// Re-export utilities
export { 
  buildAdjacencyList, 
  jaccardSimilarity, 
  normalizeMap, 
  bfsReachable, 
  getConnectedComponents, 
  getNodeWeight, 
  getShortestPath 
} from './utils';

// Re-export centrality algorithms
export { 
  calculatePageRank, 
  calculateClosenessCentrality, 
  calculateBetweennessCentrality, 
  calculateEigenvectorCentrality 
} from './centrality';

// Re-export clustering algorithms
export { 
  detectClusters, 
  detectCommunitiesLabelPropagation, 
  detectHierarchicalClusters, 
  detectStructuralHoles 
} from './clustering';

// Re-export influence algorithms
export { 
  calculateInfluencePropagation, 
  simulateInfluencePropagation, 
  traceInfluenceFlow 
} from './influence';

// Re-export resilience and prediction algorithms
export { 
  analyzeNetworkResilience, 
  detectWeakTies, 
  predictLinks, 
  classifyCommunityRoles, 
  identifyGrowthOpportunities,
  recommendStrategicConnections,
  calculateNetworkDensity,
  calculateNetworkMetrics
} from './resilience';

// Re-export temporal algorithms
export { 
  analyzeTemporalNetwork, 
  analyzeCommunityEvolution 
} from './temporal';

// Backward compatibility exports - maps to original function names
export { detectClusters as louvainClusters } from './clustering';
export { calculatePageRank as pageRank } from './centrality';
