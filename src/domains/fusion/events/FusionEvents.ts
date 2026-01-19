/**
 * Fusion Domain Events
 * 
 * Events published by the Fusion domain for cross-domain communication.
 */

import { DomainEvent } from '@/domains/shared';
import { FusionEngineType } from '../entities/FusionResult';

/**
 * Published when a fusion operation completes
 */
export class FusionCompleted extends DomainEvent {
  readonly eventType = 'fusion.completed';

  constructor(
    readonly profileId: string,
    readonly engineType: FusionEngineType,
    readonly confidence: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      engineType: this.engineType,
      confidence: this.confidence,
    };
  }
}

/**
 * Published when a batch fusion operation completes
 */
export class BatchFusionCompleted extends DomainEvent {
  readonly eventType = 'fusion.batch_completed';

  constructor(
    readonly profileId: string,
    readonly engineResults: Array<{ engine: FusionEngineType; success: boolean; confidence?: number }>,
    readonly totalProcessingTimeMs: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      engineResults: this.engineResults,
      totalProcessingTimeMs: this.totalProcessingTimeMs,
    };
  }
}

/**
 * Published when a digital twin is created or updated
 */
export class DigitalTwinUpdated extends DomainEvent {
  readonly eventType = 'fusion.digital_twin_updated';

  constructor(
    readonly profileId: string,
    readonly patternsAdded: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      patternsAdded: this.patternsAdded,
    };
  }
}

/**
 * Published when a simulation is run on a digital twin
 */
export class TwinSimulationRun extends DomainEvent {
  readonly eventType = 'fusion.twin_simulation_run';

  constructor(
    readonly profileId: string,
    readonly scenarioName: string,
    readonly predictedOutcome: string,
    readonly probability: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      scenarioName: this.scenarioName,
      predictedOutcome: this.predictedOutcome,
      probability: this.probability,
    };
  }
}

/**
 * Published when fusion detects a significant anomaly
 */
export class FusionAnomalyDetected extends DomainEvent {
  readonly eventType = 'fusion.anomaly_detected';

  constructor(
    readonly profileId: string,
    readonly anomalyType: string,
    readonly severity: 'low' | 'medium' | 'high' | 'critical',
    readonly details: Record<string, unknown>
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      anomalyType: this.anomalyType,
      severity: this.severity,
      details: this.details,
    };
  }
}

/**
 * Published when entity resolution identifies a potential match
 */
export class EntityMatchIdentified extends DomainEvent {
  readonly eventType = 'fusion.entity_match_identified';

  constructor(
    readonly sourceProfileId: string,
    readonly matchedProfileId: string,
    readonly matchConfidence: number,
    readonly matchReason: string
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      sourceProfileId: this.sourceProfileId,
      matchedProfileId: this.matchedProfileId,
      matchConfidence: this.matchConfidence,
      matchReason: this.matchReason,
    };
  }
}
