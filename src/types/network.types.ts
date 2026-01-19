/**
 * @fileoverview Network Analysis Type Definitions
 * Consolidated types for network graph, visualization, and algorithms
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

// Re-export algorithm types (internal implementation)
export * from '@/lib/network/types';
export * from '@/lib/network/types/visualization';
