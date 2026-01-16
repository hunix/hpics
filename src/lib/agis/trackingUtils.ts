// AGIS Phase Tracking Utilities
// Centralized patterns for cross-phase operation tracking

export interface TrackingContext {
  phase: number;
  operationType: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

export interface TrackedMutationOptions {
  phase: number;
  operationType: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Creates a tracked mutation wrapper that automatically records to AGIS analytics
 */
export function createTrackingContext(phase: number, operationType: string, metadata?: Record<string, unknown>): TrackingContext {
  return {
    phase,
    operationType,
    startTime: Date.now(),
    metadata,
  };
}

/**
 * Calculates duration from tracking context
 */
export function getTrackingDuration(context: TrackingContext): number {
  return Date.now() - context.startTime;
}

/**
 * Phase number mappings for standardized tracking
 */
export const PHASE_OPERATION_MAP = {
  // Phase 2-3: Tactical & Cognitive Warfare
  mice_analysis: { phase: 3, type: 'mice_assessment' },
  betrayal_prediction: { phase: 3, type: 'betrayal_analysis' },
  semantic_warfare: { phase: 3, type: 'semantic_operation' },
  
  // Phase 5: Omniscient Command
  autonomous_campaign: { phase: 5, type: 'autonomous_operation' },
  network_cascade: { phase: 5, type: 'network_warfare' },
  
  // Phase 6: Reality Engineering
  reality_framework: { phase: 6, type: 'reality_engineering' },
  belief_architecture: { phase: 6, type: 'belief_manipulation' },
  
  // Phase 7: Singularity
  singularity_objective: { phase: 7, type: 'singularity_synthesis' },
  strategic_synthesis: { phase: 7, type: 'strategic_synthesis' },
} as const;

/**
 * Get phase info from operation key
 */
export function getPhaseFromOperation(operationKey: keyof typeof PHASE_OPERATION_MAP): { phase: number; type: string } {
  return PHASE_OPERATION_MAP[operationKey];
}
