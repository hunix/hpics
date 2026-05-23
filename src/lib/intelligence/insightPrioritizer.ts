/**
 * @fileoverview Insight Prioritization Engine
 * Ranks and filters intelligence insights by relevance, actionability, and impact
 */

import { supabase } from '@/integrations/supabase/client';

export interface Insight {
  id: string;
  type: string;
  content: any;
  source: string;
  confidence: number;
  createdAt: string | null;
  profileId?: string | null;
  metadata?: Record<string, any>;
}

export interface PrioritizedInsight {
  insightId: string;
  originalInsight: Insight;
  priorityScore: number;
  priorityRank: number;
  relevanceScore: number;
  actionabilityScore: number;
  impactScore: number;
  confidenceScore: number;
  timeSensitivity: {
    urgency: 'immediate' | 'today' | 'this_week' | 'this_month' | 'flexible';
    expiresAt: string | null;
    optimalWindow: string;
  };
  recommendedAction: string;
  reasoning: string;
}

export interface PrioritizationResult {
  prioritizedInsights: PrioritizedInsight[];
  categories: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
    informational: string[];
  };
  actionQueue: Array<{
    insightId: string;
    action: string;
    scheduledFor: string;
    estimatedDuration: string;
  }>;
  suppressedInsights: Array<{
    insightId: string;
    reason: string;
  }>;
}

export interface UserContext {
  currentGoals: string[];
  recentActions: string[];
  activeRelationships: string[];
  timeAvailable: string;
  focusAreas: string[];
}

export interface UserPreferences {
  priorityCategories: string[];
  suppressedTypes: string[];
  minimumConfidence: number;
  actionableOnly: boolean;
  maxInsightsPerDay: number;
}

/**
 * Local prioritization scoring for quick sorting
 */
export function calculateLocalPriorityScore(insight: Insight, context?: UserContext): number {
  let score = 0;
  
  // Base confidence score (0-25)
  score += insight.confidence * 25;
  
  // Recency score (0-20)
  const ageHours = (Date.now() - new Date(insight.createdAt).getTime()) / (1000 * 60 * 60);
  if (ageHours < 1) score += 20;
  else if (ageHours < 24) score += 15;
  else if (ageHours < 72) score += 10;
  else if (ageHours < 168) score += 5;
  
  // Type-based scoring (0-25)
  const typeScores: Record<string, number> = {
    'churn_risk': 25,
    'anomaly': 23,
    'opportunity': 22,
    'relationship_change': 20,
    'behavioral_shift': 18,
    'prediction': 15,
    'pattern': 12,
    'observation': 8,
    'informational': 5
  };
  score += typeScores[insight.type] || 10;
  
  // Context relevance (0-20)
  if (context) {
    if (insight.metadata?.relatedGoals?.some((g: string) => context.currentGoals.includes(g))) {
      score += 15;
    }
    if (context.focusAreas.some(area => insight.type.includes(area))) {
      score += 10;
    }
  }
  
  // Actionability boost (0-10)
  if (insight.metadata?.actionable) score += 10;
  if (insight.metadata?.hasRecommendation) score += 5;
  
  return Math.min(100, score);
}

/**
 * Quick local filtering and sorting
 */
export function quickPrioritize(
  insights: Insight[],
  context?: UserContext,
  preferences?: UserPreferences
): Insight[] {
  let filtered = insights;
  
  // Apply preference filters
  if (preferences) {
    if (preferences.minimumConfidence > 0) {
      filtered = filtered.filter(i => i.confidence >= preferences.minimumConfidence);
    }
    if (preferences.suppressedTypes.length > 0) {
      filtered = filtered.filter(i => !preferences.suppressedTypes.includes(i.type));
    }
    if (preferences.actionableOnly) {
      filtered = filtered.filter(i => i.metadata?.actionable);
    }
  }
  
  // Score and sort
  const scored = filtered.map(insight => ({
    insight,
    score: calculateLocalPriorityScore(insight, context)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // Apply limit
  const limit = preferences?.maxInsightsPerDay || 50;
  return scored.slice(0, limit).map(s => s.insight);
}

/**
 * Full AI-powered prioritization via edge function
 */
export async function prioritizeInsightsWithAI(
  insights: Insight[],
  userContext: UserContext,
  preferences: UserPreferences
): Promise<PrioritizationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('insight-prioritizer', {
      body: {
        insights,
        userContext,
        preferences
      }
    });

    if (error) throw error;
    
    if (!data?.success) {
      throw new Error(data?.error || 'Prioritization failed');
    }

    return data.prioritization;
  } catch (error) {
    console.error('AI prioritization failed, using local fallback:', error);
    
    // Fallback to local prioritization
    const prioritized = quickPrioritize(insights, userContext, preferences);
    
    return {
      prioritizedInsights: prioritized.map((insight, index) => ({
        insightId: insight.id,
        originalInsight: insight,
        priorityScore: calculateLocalPriorityScore(insight, userContext),
        priorityRank: index + 1,
        relevanceScore: 0.5,
        actionabilityScore: insight.metadata?.actionable ? 0.8 : 0.3,
        impactScore: 0.5,
        confidenceScore: insight.confidence,
        timeSensitivity: {
          urgency: 'flexible' as const,
          expiresAt: null,
          optimalWindow: 'anytime'
        },
        recommendedAction: 'Review insight',
        reasoning: 'Local prioritization fallback'
      })),
      categories: {
        critical: [],
        high: prioritized.slice(0, 5).map(i => i.id),
        medium: prioritized.slice(5, 15).map(i => i.id),
        low: prioritized.slice(15, 30).map(i => i.id),
        informational: prioritized.slice(30).map(i => i.id)
      },
      actionQueue: [],
      suppressedInsights: []
    };
  }
}

/**
 * Get insights for a specific contact with prioritization
 */
export async function getContactInsightsPrioritized(
  profileId: string,
  userContext: UserContext,
  preferences: UserPreferences
): Promise<PrioritizationResult> {
  // Fetch recent insights for the contact
  const { data: analysisEvents } = await supabase
    .from('analysis_events')
    .select('*')
    .eq('profile_id', profileId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!analysisEvents || analysisEvents.length === 0) {
    return {
      prioritizedInsights: [],
      categories: { critical: [], high: [], medium: [], low: [], informational: [] },
      actionQueue: [],
      suppressedInsights: []
    };
  }

  const insights: Insight[] = analysisEvents.map(event => ({
    id: event.id,
    type: event.analysis_type,
    content: event.raw_result,
    source: event.source_type || 'analysis',
    confidence: event.confidence_score || 0.5,
    createdAt: event.created_at,
    profileId: event.profile_id,
    metadata: {
      keyInsights: event.key_insights,
      tags: event.tags,
      actionable: (event.key_insights?.length ?? 0) > 0
    }
  }));

  return prioritizeInsightsWithAI(insights, userContext, preferences);
}

/**
 * Get network-wide insights prioritized
 */
export async function getNetworkInsightsPrioritized(
  userId: string,
  userContext: UserContext,
  preferences: UserPreferences,
  limit = 50
): Promise<PrioritizationResult> {
  // Fetch recent insights across all contacts
  const { data: analysisEvents } = await supabase
    .from('analysis_events')
    .select('*')
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit * 2); // Fetch more for filtering

  if (!analysisEvents || analysisEvents.length === 0) {
    return {
      prioritizedInsights: [],
      categories: { critical: [], high: [], medium: [], low: [], informational: [] },
      actionQueue: [],
      suppressedInsights: []
    };
  }

  const insights: Insight[] = analysisEvents.map(event => ({
    id: event.id,
    type: event.analysis_type,
    content: event.raw_result,
    source: event.source_type || 'analysis',
    confidence: event.confidence_score || 0.5,
    createdAt: event.created_at,
    profileId: event.profile_id || undefined,
    metadata: {
      keyInsights: event.key_insights,
      tags: event.tags,
      actionable: (event.key_insights?.length ?? 0) > 0
    }
  }));

  return prioritizeInsightsWithAI(insights, userContext, preferences);
}
