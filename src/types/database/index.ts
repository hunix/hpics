/**
 * Database Type Modules Index
 * 
 * Re-exports all domain-specific database types.
 * Import from here or from individual modules for better tree-shaking.
 * 
 * @example
 * import type { UnifiedAnalysis, ANALYSIS_DOMAINS } from '@/types/database';
 */

export {
  type UnifiedAnalysis,
  type UnifiedAnalysisInsert,
  type UnifiedAnalysisUpdate,
  type UnifiedPrediction,
  type UnifiedPredictionInsert,
  type UnifiedPredictionUpdate,
  type UnifiedEvent,
  type UnifiedEventInsert,
  type UnifiedEventUpdate,
  type AnalysisDomain,
  type PredictionDomain,
  type EventDomain,
  type TypedAnalysisResult,
  ANALYSIS_DOMAINS,
  PREDICTION_DOMAINS,
  EVENT_DOMAINS,
  parseAnalysisResult,
  parsePredictionResult,
} from './unified';
