/**
 * Network Analysis Module - Unified exports (v10.0 Enhanced)
 * 
 * IMPORTANT: Uses explicit named exports for IDE performance optimization.
 */

// Core types
export type { NetworkNode, NetworkLink, AdjacencyList, CentralityMap, ClusterMap, HierarchicalCluster, StructuralHole, WeakTie, PredictedLink, ResilienceMetrics, InfluenceFlow, InfluencePropagationResult, PropagationWave, CommunityRole, NodeRole, CommunitySnapshot, CommunityTransition, CommunityHealthMetrics, CommunityEvolution, TemporalNetworkMetrics, SleepingConnection, TrajectoryPrediction, SeasonalPattern, GrowthOpportunity, StrategicConnection, ConnectionRecommendation, NetworkMetrics } from './types';
export { CLUSTER_COLORS, getClusterColor } from './types';

// Visualization types
export type { VisualizationNode, VisualizationLink, NetworkVisualizationData, ColorMode } from './types/visualization';
export { RELATIONSHIP_COLORS, RELATIONSHIP_TYPES } from './types/visualization';

// Utilities
export { buildAdjacencyList, jaccardSimilarity, normalizeMap, bfsReachable, getConnectedComponents, getNodeWeight, getShortestPath } from './utils';

// Centrality algorithms
export { calculatePageRank, calculateClosenessCentrality, calculateBetweennessCentrality, calculateEigenvectorCentrality } from './centrality';

// Clustering algorithms
export { detectClusters, detectCommunitiesLabelPropagation, detectHierarchicalClusters, detectStructuralHoles } from './clustering';

// Influence algorithms
export { calculateInfluencePropagation, simulateInfluencePropagation, traceInfluenceFlow } from './influence';

// Resilience and prediction
export { analyzeNetworkResilience, detectWeakTies, predictLinks, classifyCommunityRoles, identifyGrowthOpportunities, recommendStrategicConnections, calculateNetworkDensity, calculateNetworkMetrics } from './resilience';

// Temporal algorithms
export { analyzeTemporalNetwork, analyzeCommunityEvolution } from './temporal';

// Backward compatibility
export { detectClusters as louvainClusters } from './clustering';
export { calculatePageRank as pageRank } from './centrality';

// === v10.0 Enhanced Engines ===

// GATFELPA Community Detection (Nature Scientific Reports 2025)
export { detectCommunitiesGATFELPA, type GatfelpaConfig, type GatfelpaCommunity, type GatfelpaResult } from './gatfelpa';

// TrustGuard GNN Trust Prediction (arxiv 2023)
export { predictTrust, type TrustPrediction, type TrustFactor } from './trustPrediction';

// TempRL-IM Temporal Influence Maximization (Nature 2026)
export { maximizeTemporalInfluence, type TemporalInfluenceResult } from './temporalInfluence';
