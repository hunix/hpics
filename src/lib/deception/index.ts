/**
 * Deception Analysis Module Index (v9.0)
 * 
 * Centralized exports for deception detection and analysis.
 */

// Core Deception Analyzer
export {
  analyzeLinguisticDeception,
  analyzeFacialDeception,
  analyzeVocalDeception,
  type DeceptionIndicator,
  type MicroExpression,
  type VoiceStressMarker,
  type LinguisticMarker,
  type CrossModalConflict,
  type DeceptionAnalysisResult,
  type DeceptionTimelineEvent,
} from './deceptionAnalyzer';

// Multimodal Fusion Engine
export {
  analyzeDeception,
  analyzeTextualDeception,
  type DeceptionAnalysis,
  type ModalityResults,
  type FusionWeights,
  type TextualAnalysis,
  type AcousticAnalysis,
  type VisualAnalysis,
  type PhysiologicalAnalysis,
  type DeceptionTimeline,
  type DeceptionMarkers,
  type DeceptionRiskLevel,
  type LinguisticMarkerType,
  type VoiceStressType,
} from './multimodalFusionEngine';

// Cognitive Load Analyzer
export {
  analyzeCognitiveLoad,
  compareCognitiveLoad,
  type CognitiveLoadMetrics,
  type LoadComponents,
  type LatencyMetrics,
  type ComplexityMetrics,
  type ErrorMetrics,
  type PauseMetrics,
  type TemporalPattern,
  type LinguisticIndicator,
} from './cognitiveLoadAnalyzer';

// SUE Analyzer
export {
  analyzeSUE,
  type SUEAnalysisResult,
  type EvidenceItem,
  type StatementEvidencePair,
  type CounterInterrogationIndicator,
  type DisclosureRecommendation,
} from './sueAnalyzer';

// CBCA/RM Scorer
export {
  scoreCBCA,
  type CBCAResult,
  type CBCACriteria,
  type RealityMonitoringCriteria,
  type ValidityChecklist,
} from './cbcaScorer';

// Temporal Congruence Analyzer
export {
  analyzeTemporalCongruence,
  type TemporalCongruenceResult,
  type TemporalClaim,
  type KnownEvent,
  type TemporalInconsistency,
} from './temporalCongruenceAnalyzer';
