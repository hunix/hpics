// Network Analysis Module - Unified exports
// Consolidates all network algorithms into a single optimized module

// Re-export all types
export * from './types';

// Re-export utilities
export { buildAdjacencyList, jaccardSimilarity, normalizeMap, bfsReachable, getConnectedComponents, getNodeWeight, getShortestPath } from './utils';

// Re-export centrality algorithms
export { calculatePageRank, calculateClosenessCentrality, calculateBetweennessCentrality, calculateEigenvectorCentrality } from './centrality';

// Re-export clustering algorithms
export { detectClusters, detectCommunitiesLabelPropagation, detectHierarchicalClusters, detectStructuralHoles } from './clustering';

// Re-export influence algorithms
export { calculateInfluencePropagation, simulateInfluencePropagation, traceInfluenceFlow } from './influence';

// Re-export resilience and prediction algorithms
export { analyzeNetworkResilience, detectWeakTies, predictLinks, classifyCommunityRoles, identifyGrowthOpportunities } from './resilience';

// Re-export temporal algorithms
export { analyzeTemporalNetwork, analyzeCommunityEvolution } from './temporal';

// Backward compatibility exports - maps to original function names
export { detectClusters as louvainClusters } from './clustering';
export { calculatePageRank as pageRank } from './centrality';
