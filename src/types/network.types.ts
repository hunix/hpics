/**
 * @fileoverview Network Analysis Type Definitions (v3.7.4)
 * Consolidated types for network graph, visualization, and algorithms
 * 
 * PERFORMANCE OPTIMIZED: Explicit exports instead of export *
 * 
 * @deprecated Import directly from @/domains/network for domain entities.
 * This file re-exports for backward compatibility only.
 */

// Re-export domain entities (canonical source)
export type { 
  NetworkGraph,
  NetworkNode,
  NetworkLink,
  NetworkCluster,
  NetworkAnalysis,
  NetworkSnapshot,
  CentralityType,
  ClusterAlgorithm,
  NodeRole,
  TrendDirection,
  StructuralHole,
  CentralityMetrics,
} from '@/domains/network/entities/NetworkGraph';

export type {
  Connection,
  ConnectionStrength,
} from '@/domains/network/entities/Connection';

export type {
  InfluenceFlow,
  InfluencePropagation,
  InfluenceMetrics,
  InfluenceSimulation,
  PropagationWave,
} from '@/domains/network/entities/Influence';

// Re-export algorithm types (explicit exports for performance)
export type {
  NetworkNode as AlgorithmNetworkNode,
  NetworkLink as AlgorithmNetworkLink,
  AdjacencyList,
  CentralityMap,
  ClusterMap,
  HierarchicalCluster,
  StructuralHole as AlgorithmStructuralHole,
  WeakTie,
  PredictedLink,
  ResilienceMetrics,
  InfluenceFlow as AlgorithmInfluenceFlow,
  InfluencePropagationResult,
  PropagationWave as AlgorithmPropagationWave,
  CommunityRole,
  NodeRole as AlgorithmNodeRole,
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
} from '@/lib/network/types';

export {
  CLUSTER_COLORS,
  getClusterColor,
} from '@/lib/network/types';

// Re-export visualization types (explicit exports for performance)
export type {
  VisualizationNode,
  VisualizationLink,
  NetworkVisualizationData,
  ColorMode,
} from '@/lib/network/types/visualization';

export {
  RELATIONSHIP_COLORS,
  RELATIONSHIP_TYPES,
} from '@/lib/network/types/visualization';
