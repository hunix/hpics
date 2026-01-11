// DEPRECATED: This file is kept for backward compatibility
// Please import from '@/lib/network' instead

export {
  // Types
  type WeakTie,
  type PredictedLink,
  type ResilienceMetrics,
  type InfluenceFlow,
  type NodeRole,
  type CommunityRole,
  type GrowthOpportunity,
  
  // Functions
  calculateEigenvectorCentrality,
  detectWeakTies,
  predictLinks,
  analyzeNetworkResilience,
  traceInfluenceFlow,
  classifyCommunityRoles,
  identifyGrowthOpportunities,
} from './network';
