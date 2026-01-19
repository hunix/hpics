/**
 * @fileoverview Intelligence & Analysis Type Definitions
 * Consolidated types for AI intelligence, behavioral analysis, and relationship analysis
 * 
 * @deprecated Import directly from @/domains/intelligence for domain entities.
 * This file re-exports for backward compatibility only.
 */

// Re-export domain entities (canonical source)
export type {
  Analysis,
  AnalysisType,
  AnalysisStatus,
  AnalysisResult,
} from '@/domains/intelligence/entities/Analysis';

export type {
  Dossier,
  DossierTemplate,
  DossierSection,
  ThreatAssessment,
} from '@/domains/intelligence/entities/Dossier';

export {
  Insight,
  type InsightPriority,
  type InsightCategory,
  type InsightActionability,
  type InsightEvidence,
} from '@/domains/intelligence/entities/Insight';

// Re-export legacy types for backward compatibility
export {
  type RelationshipAnalysis,
  type BehavioralAnalysis,
  type ChurnPrediction,
  type NetworkAnalysis,
  type ProactiveInsight,
  type CommunicationAnomaly,
  type CrossContactPattern,
  type IntelligenceReport,
  type LifecycleStage,
  type AIUsageSummary,
} from '@/lib/aiIntelligenceTypes';

// Re-export analysis types (explicit for performance)
export type {
  AnalysisTypeConfig,
  MediaAnalysisMode,
  MediaType,
  AnalysisContext,
} from '@/lib/analysisTypes';

export {
  MEDIA_ANALYSIS_MODES,
  ANALYSIS_PURPOSES,
  ANALYSIS_RELATIONSHIPS,
  ANALYSIS_DEPTHS,
  ANALYSIS_TYPES,
  getAnalysisTypeByKey,
  getAnalysisTypesByCategory,
} from '@/lib/analysisTypes';

export {
  type IntelligenceMethodology,
  type MethodologyCategory,
  type DifficultyLevel,
  type ExampleScript,
  type EffectivenessStats,
  type ContactInfluenceProfile,
  type DecisionStyle,
  type InformationPreference,
  type RiskAppetite,
  type TimePressureResponse,
  type ThinkingStyle,
  type AttentionSpan,
  type MemoryAnchor,
  type ApproachStep,
  type TimingPreferences,
  type ChannelPreferences,
  type EvidenceSource,
  type InfluenceStrategy,
  type GoalType,
  type UrgencyLevel,
  type StrategyStatus,
  type StrategyStep,
  type ObjectionHandler,
  type OptimalTiming,
  type Risk,
  type Lesson,
  type InfluenceAction,
  type ActionType,
  type Priority,
  type ActionStatus,
  type MethodologyOutcome,
  type OutcomeLevel,
  GOAL_TYPE_LABELS,
  METHODOLOGY_CATEGORY_LABELS,
  DIFFICULTY_COLORS,
  CIALDINI_PRINCIPLES,
  getSusceptibilityLevel,
  getSuccessProbabilityColor,
} from '@/lib/influenceTypes';
