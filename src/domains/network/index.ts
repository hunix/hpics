/**
 * Network Domain Public API
 * Exports all public types, entities, and hooks
 */

// Entities
export type {
  NetworkGraph,
  NetworkNode,
  NetworkLink,
  NetworkCluster,
  NetworkAnalysis,
  CentralityMetrics,
  StructuralHole,
  NetworkSnapshot,
  CentralityType,
  ClusterAlgorithm,
  NodeRole,
  TrendDirection,
} from './entities/NetworkGraph';

export type {
  Connection,
  ConnectionPrediction,
  ConnectionRecommendation,
  SleepingConnection,
  ConnectionStrength,
  ConnectionTrend,
} from './entities/Connection';

export {
  calculateConnectionStrength,
  calculateConnectionTrend,
} from './entities/Connection';

export type {
  InfluenceFlow,
  InfluencePropagation,
  PropagationWave,
  InfluenceMetrics,
  InfluenceSimulation,
} from './entities/Influence';

export {
  calculateInfluenceDecay,
  identifyBottlenecks,
} from './entities/Influence';

// Events
export type { NetworkDomainEvent } from './events/NetworkEvents';
export {
  NetworkAnalyzed,
  ClustersDetected,
  InfluencersIdentified,
  BridgeConnectorsFound,
  InfluenceSimulated,
  ConnectionsRecommended,
  SleepingConnectionsDetected,
  NetworkHealthUpdated,
} from './events/NetworkEvents';

// Services
export { NetworkService } from './services/NetworkService';
export type { NetworkAnalysisRequest, NetworkSummary } from './services/NetworkService';

// Hooks
export {
  useNetworkGraph,
  useNetworkAnalysis,
  useNetworkSummary,
  useInfluenceSimulation,
  useConnectionRecommendations,
  useSleepingConnections,
  useNetwork,
} from './hooks/useNetworkService';
