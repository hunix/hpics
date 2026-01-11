// DEPRECATED: This file is kept for backward compatibility
// Please import from '@/lib/network' instead

export {
  // Types
  type NetworkNode,
  type NetworkLink,
  type ClusterMap,
  type CentralityMap,
  type HierarchicalCluster,
  type StructuralHole,
  type NetworkMetrics,
  
  // Functions
  calculatePageRank,
  calculateClosenessCentrality,
  calculateBetweennessCentrality,
  detectClusters,
  detectHierarchicalClusters,
  detectStructuralHoles,
  calculateInfluencePropagation,
  calculateNetworkDensity,
  calculateNetworkMetrics,
  
  // Constants
  CLUSTER_COLORS,
  getClusterColor,
  
  // Utilities
  buildAdjacencyList,
} from './network';
