/**
 * Fusion Domain (v3.9.0)
 * 
 * Public API for the Fusion bounded context.
 * All external access to fusion functionality should go through this module.
 */

// Entities
export { FusionResult, type FusionEngineType, type FusionPayload, type FusionMetrics } from './entities/FusionResult';
export { DigitalTwin, type BehaviorPattern, type SimulationScenario, type TwinMetrics } from './entities/DigitalTwin';

// Repositories (v3.9.0)
export type { 
  IFusionRepository, 
  IDigitalTwinRepository,
  FusionQueryOptions,
  DigitalTwinQueryOptions,
} from './repositories';
export { 
  FUSION_ANALYSIS_TYPES,
  ANALYSIS_TYPE_TO_ENGINE,
} from './repositories';

// Services
export { 
  FusionService, 
  getFusionService,
  type FusionRequest,
  type FusionResponse,
  type BatchFusionRequest,
} from './services/FusionService';

// Events
export {
  FusionCompleted,
  BatchFusionCompleted,
  DigitalTwinUpdated,
  TwinSimulationRun,
  FusionAnomalyDetected,
  EntityMatchIdentified,
} from './events/FusionEvents';

// Hooks
export {
  useFusionService,
  useFusionResults,
  useDigitalTwin,
  useFusionEnginesStatus,
} from './hooks/useFusionService';
