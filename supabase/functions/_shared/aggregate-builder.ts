/**
 * Aggregate Builder Utilities
 * Handles merging and computing aggregate state from analysis events
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { AnalysisType } from "./event-store.ts";

export interface AggregateState {
  // Psychological Profile
  personality_traits?: {
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
    confidence?: number;
    trend?: Array<{ date: string; values: Record<string, number> }>;
  };
  
  // Communication Patterns
  communication_style?: {
    formality?: number;
    directness?: number;
    emotionality?: number;
    verbosity?: number;
    preferred_channels?: string[];
    response_patterns?: Record<string, unknown>;
  };
  
  // Behavioral Patterns
  behavioral_patterns?: {
    decision_making_style?: string;
    conflict_resolution?: string;
    stress_indicators?: string[];
    motivators?: string[];
    values?: string[];
  };
  
  // Biometric Data
  biometric_summary?: {
    face_confidence?: number;
    voice_confidence?: number;
    expression_baseline?: Record<string, unknown>;
    voice_characteristics?: Record<string, unknown>;
  };
  
  // Relationship Intelligence
  relationship_context?: {
    interaction_frequency?: number;
    sentiment_trend?: number;
    key_topics?: string[];
    shared_interests?: string[];
    relationship_health?: number;
  };
  
  // Insights
  key_insights?: string[];
  tags?: string[];
  last_updated?: string;
  confidence_score?: number;
}

/**
 * Deep merges two objects, with newer values taking precedence
 */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  
  for (const key in source) {
    if (source[key] === null || source[key] === undefined) {
      continue;
    }
    
    if (
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key]) &&
      result[key] !== null
    ) {
      // Recursively merge objects
      result[key] = deepMerge(
        result[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>
      );
    } else if (Array.isArray(source[key])) {
      // For arrays, we have special handling based on key
      if (key === 'key_insights' || key === 'tags' || key.endsWith('_list')) {
        // Merge and dedupe string arrays
        const existingArray = Array.isArray(result[key]) ? result[key] as string[] : [];
        const newArray = source[key] as string[];
        result[key] = [...new Set([...existingArray, ...newArray])];
      } else if (key === 'trend' || key.endsWith('_history')) {
        // Append to time series, keeping last N items
        const existingArray = Array.isArray(result[key]) ? result[key] as unknown[] : [];
        const newArray = source[key] as unknown[];
        result[key] = [...existingArray, ...newArray].slice(-100); // Keep last 100
      } else {
        // Replace array
        result[key] = source[key];
      }
    } else if (typeof source[key] === 'number' && typeof result[key] === 'number') {
      // For numeric values, we can optionally compute weighted average
      // For now, just take the newer value
      result[key] = source[key];
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Computes aggregate statistics from events
 */
export function computeAggregateStats(
  events: Array<{
    confidence_score?: number | null;
    created_at: string;
    analysis_subtype?: string | null;
  }>
): {
  average_confidence: number | null;
  event_count: number;
  analysis_subtypes: string[];
  date_range: { first: string; last: string } | null;
} {
  if (!events.length) {
    return {
      average_confidence: null,
      event_count: 0,
      analysis_subtypes: [],
      date_range: null
    };
  }

  const confidenceScores = events
    .map(e => e.confidence_score)
    .filter((c): c is number => c !== null && c !== undefined);

  const subtypes = [...new Set(
    events
      .map(e => e.analysis_subtype)
      .filter((s): s is string => s !== null && s !== undefined)
  )];

  const sortedDates = events
    .map(e => e.created_at)
    .sort();

  return {
    average_confidence: confidenceScores.length > 0
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
      : null,
    event_count: events.length,
    analysis_subtypes: subtypes,
    date_range: {
      first: sortedDates[0],
      last: sortedDates[sortedDates.length - 1]
    }
  };
}

/**
 * Builds a comprehensive profile from multiple aggregate types
 */
export async function buildComprehensiveProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId: string
): Promise<AggregateState> {
  const aggregateTypes: AnalysisType[] = [
    'psychological',
    'linguistic',
    'behavioral',
    'biometric',
    'facial',
    'voice'
  ];

  const { data: aggregates } = await supabase
    .from('analysis_aggregates')
    .select('aggregate_type, current_state, average_confidence, last_analysis_at')
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .in('aggregate_type', aggregateTypes);

  if (!aggregates?.length) {
    return {};
  }

  let comprehensive: AggregateState = {};
  let totalConfidence = 0;
  let confidenceCount = 0;

  for (const agg of aggregates) {
    const aggregate = agg as Record<string, unknown>;
    const state = aggregate.current_state as Record<string, unknown>;
    comprehensive = deepMerge(comprehensive as Record<string, unknown>, state) as AggregateState;
    
    const avgConf = aggregate.average_confidence as number | null;
    if (avgConf) {
      totalConfidence += avgConf;
      confidenceCount++;
    }
  }

  comprehensive.last_updated = new Date().toISOString();
  comprehensive.confidence_score = confidenceCount > 0
    ? totalConfidence / confidenceCount
    : undefined;

  return comprehensive;
}

/**
 * Gets aggregates that need rebuilding
 */
export async function getAggregatesNeedingRebuild(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number = 10
): Promise<Array<{ id: string; profile_id: string; aggregate_type: string }>> {
  const { data } = await supabase
    .from('analysis_aggregates')
    .select('id, profile_id, aggregate_type')
    .eq('user_id', userId)
    .eq('needs_rebuild', true)
    .limit(limit);

  return data || [];
}

/**
 * Marks aggregate as needing rebuild
 */
export async function markForRebuild(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  profileId: string,
  aggregateType: AnalysisType
): Promise<boolean> {
  const updateData: Record<string, unknown> = { 
    needs_rebuild: true, 
    updated_at: new Date().toISOString() 
  };
  
  const { error } = await supabase
    .from('analysis_aggregates')
    .update(updateData as never)
    .eq('user_id', userId)
    .eq('profile_id', profileId)
    .eq('aggregate_type', aggregateType);

  return !error;
}

/**
 * Generates insights from aggregate state
 */
export function generateInsightsFromAggregate(
  aggregate: AggregateState,
  analysisType: AnalysisType
): string[] {
  const insights: string[] = [];

  // Personality insights
  if (aggregate.personality_traits) {
    const traits = aggregate.personality_traits;
    
    if (traits.extraversion !== undefined) {
      if (traits.extraversion > 0.7) {
        insights.push('Highly extroverted - thrives in social settings');
      } else if (traits.extraversion < 0.3) {
        insights.push('Introverted - prefers deep one-on-one conversations');
      }
    }
    
    if (traits.openness !== undefined && traits.openness > 0.7) {
      insights.push('Very open to new experiences and ideas');
    }
  }

  // Communication insights
  if (aggregate.communication_style) {
    const style = aggregate.communication_style;
    
    if (style.directness !== undefined && style.directness > 0.7) {
      insights.push('Communicates directly - appreciates straightforward conversations');
    }
    
    if (style.preferred_channels?.length) {
      insights.push(`Preferred communication: ${style.preferred_channels.slice(0, 3).join(', ')}`);
    }
  }

  // Relationship insights
  if (aggregate.relationship_context) {
    const context = aggregate.relationship_context;
    
    if (context.sentiment_trend !== undefined) {
      if (context.sentiment_trend > 0.2) {
        insights.push('Relationship sentiment is trending positively');
      } else if (context.sentiment_trend < -0.2) {
        insights.push('Relationship sentiment needs attention');
      }
    }
    
    if (context.shared_interests?.length) {
      insights.push(`Shared interests: ${context.shared_interests.slice(0, 5).join(', ')}`);
    }
  }

  return insights;
}

/**
 * Calculates confidence trend over time
 */
export function calculateConfidenceTrend(
  events: Array<{ confidence_score?: number | null; created_at: string }>
): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
  const scored = events
    .filter(e => e.confidence_score !== null && e.confidence_score !== undefined)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (scored.length < 5) {
    return 'insufficient_data';
  }

  // Compare first half to second half
  const midpoint = Math.floor(scored.length / 2);
  const firstHalf = scored.slice(0, midpoint);
  const secondHalf = scored.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / secondHalf.length;

  const diff = secondAvg - firstAvg;

  if (diff > 0.05) return 'improving';
  if (diff < -0.05) return 'declining';
  return 'stable';
}
