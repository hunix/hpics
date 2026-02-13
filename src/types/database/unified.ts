/**
 * Unified Analysis & Prediction types for the consolidated database schema.
 * These types correspond to unified_analysis_store and unified_prediction_store tables.
 * 
 * @module types/database/unified
 */

import type { Database, Json } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

// ============================================
// Unified Analysis Store types
// ============================================
export type UnifiedAnalysis = Tables['unified_analysis_store']['Row'];
export type UnifiedAnalysisInsert = Tables['unified_analysis_store']['Insert'];
export type UnifiedAnalysisUpdate = Tables['unified_analysis_store']['Update'];

// ============================================
// Unified Prediction Store types
// ============================================
export type UnifiedPrediction = Tables['unified_prediction_store']['Row'];
export type UnifiedPredictionInsert = Tables['unified_prediction_store']['Insert'];
export type UnifiedPredictionUpdate = Tables['unified_prediction_store']['Update'];

// ============================================
// Unified Event Log types
// ============================================
export type UnifiedEvent = Tables['unified_event_log']['Row'];
export type UnifiedEventInsert = Tables['unified_event_log']['Insert'];
export type UnifiedEventUpdate = Tables['unified_event_log']['Update'];

// ============================================
// Analysis Domain constants
// ============================================
export const ANALYSIS_DOMAINS = {
  INTELLIGENCE: 'intelligence',
  PSYCHOLOGICAL: 'psychological',
  PREDICTION: 'prediction',
  BIOMETRIC: 'biometric',
  WARFARE: 'warfare',
  NETWORK: 'network',
  FUSION: 'fusion',
} as const;

export type AnalysisDomain = typeof ANALYSIS_DOMAINS[keyof typeof ANALYSIS_DOMAINS];

// ============================================
// Prediction Domain constants
// ============================================
export const PREDICTION_DOMAINS = {
  BEHAVIORAL: 'behavioral',
  NETWORK: 'network',
  TEMPORAL: 'temporal',
  FINANCIAL: 'financial',
} as const;

export type PredictionDomain = typeof PREDICTION_DOMAINS[keyof typeof PREDICTION_DOMAINS];

// ============================================
// Event Domain constants
// ============================================
export const EVENT_DOMAINS = {
  AUDIT: 'audit',
  CASCADE: 'cascade',
  ANALYSIS: 'analysis',
  SYSTEM: 'system',
} as const;

export type EventDomain = typeof EVENT_DOMAINS[keyof typeof EVENT_DOMAINS];

// ============================================
// Helper types for typed result access
// ============================================

/** Type-safe access to analysis results stored as JSONB */
export interface TypedAnalysisResult<T = Record<string, unknown>> {
  analysis: UnifiedAnalysis;
  typedResult: T;
}

/** Parse a unified analysis result into a typed structure */
export function parseAnalysisResult<T>(analysis: UnifiedAnalysis): T {
  return analysis.result as unknown as T;
}

/** Parse a unified prediction into a typed structure */
export function parsePredictionResult<T>(prediction: UnifiedPrediction): T {
  return prediction.prediction as unknown as T;
}
