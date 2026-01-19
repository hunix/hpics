/**
 * Fusion Domain
 * 
 * Public API for the Fusion bounded context.
 * All external access to fusion functionality should go through this module.
 */

// Entities
export { FusionResult, type FusionEngineType, type FusionPayload, type FusionMetrics } from './entities/FusionResult';
export { DigitalTwin, type BehaviorPattern, type SimulationScenario, type TwinMetrics } from './entities/DigitalTwin';

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
