/**
 * @fileoverview Intelligence & Analysis Type Definitions
 * Consolidated types for AI intelligence, behavioral analysis, and relationship analysis
 */

// Re-export from original locations for backward compatibility
// Note: Some types have duplicates across files, using explicit exports to avoid conflicts
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

export * from '@/lib/analysisTypes';

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
