/**
 * Intelligence Domain Events
 * 
 * Events published by the Intelligence domain for cross-domain communication.
 */

import { DomainEvent } from '@/domains/shared';
import { AnalysisType } from '../entities/Analysis';
import { DossierTemplate, RiskLevel } from '../entities/Dossier';
import { InsightCategory, InsightPriority } from '../entities/Insight';

/**
 * Published when an analysis is completed
 */
export class AnalysisCompleted extends DomainEvent {
  readonly eventType = 'intelligence.analysis_completed';

  constructor(
    readonly profileId: string,
    readonly analysisId: string,
    readonly analysisType: AnalysisType,
    readonly confidence: number,
    readonly insightsCount: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      analysisId: this.analysisId,
      analysisType: this.analysisType,
      confidence: this.confidence,
      insightsCount: this.insightsCount,
    };
  }
}

/**
 * Published when an analysis fails
 */
export class AnalysisFailed extends DomainEvent {
  readonly eventType = 'intelligence.analysis_failed';

  constructor(
    readonly profileId: string,
    readonly analysisType: AnalysisType,
    readonly errorMessage: string
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      analysisType: this.analysisType,
      errorMessage: this.errorMessage,
    };
  }
}

/**
 * Published when a dossier is generated
 */
export class DossierGenerated extends DomainEvent {
  readonly eventType = 'intelligence.dossier_generated';

  constructor(
    readonly profileId: string,
    readonly dossierId: string,
    readonly template: DossierTemplate,
    readonly sectionCount: number,
    readonly overallConfidence: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      dossierId: this.dossierId,
      template: this.template,
      sectionCount: this.sectionCount,
      overallConfidence: this.overallConfidence,
    };
  }
}

/**
 * Published when a dossier is refreshed
 */
export class DossierRefreshed extends DomainEvent {
  readonly eventType = 'intelligence.dossier_refreshed';

  constructor(
    readonly profileId: string,
    readonly dossierId: string,
    readonly previousVersion: number,
    readonly newVersion: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      dossierId: this.dossierId,
      previousVersion: this.previousVersion,
      newVersion: this.newVersion,
    };
  }
}

/**
 * Published when a new insight is discovered
 */
export class InsightDiscovered extends DomainEvent {
  readonly eventType = 'intelligence.insight_discovered';

  constructor(
    readonly profileId: string,
    readonly insightId: string,
    readonly category: InsightCategory,
    readonly priority: InsightPriority,
    readonly title: string
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      insightId: this.insightId,
      category: this.category,
      priority: this.priority,
      title: this.title,
    };
  }
}

/**
 * Published when risk level changes significantly
 */
export class RiskLevelChanged extends DomainEvent {
  readonly eventType = 'intelligence.risk_level_changed';

  constructor(
    readonly profileId: string,
    readonly previousLevel: RiskLevel,
    readonly newLevel: RiskLevel,
    readonly reason: string
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      previousLevel: this.previousLevel,
      newLevel: this.newLevel,
      reason: this.reason,
    };
  }
}

/**
 * Published when intelligence aggregation completes
 */
export class IntelligenceAggregated extends DomainEvent {
  readonly eventType = 'intelligence.aggregated';

  constructor(
    readonly profileId: string,
    readonly sourcesAggregated: number,
    readonly newInsightsGenerated: number
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      sourcesAggregated: this.sourcesAggregated,
      newInsightsGenerated: this.newInsightsGenerated,
    };
  }
}

/**
 * Published when an anomaly is detected
 */
export class AnomalyDetected extends DomainEvent {
  readonly eventType = 'intelligence.anomaly_detected';

  constructor(
    readonly profileId: string,
    readonly anomalyType: string,
    readonly severity: 'low' | 'medium' | 'high' | 'critical',
    readonly description: string
  ) {
    super();
  }

  protected getPayload(): Record<string, unknown> {
    return {
      profileId: this.profileId,
      anomalyType: this.anomalyType,
      severity: this.severity,
      description: this.description,
    };
  }
}
