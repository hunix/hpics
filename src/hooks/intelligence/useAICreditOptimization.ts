/**
 * AI Credit Optimization Hook
 * AGIS Phase 4 - Tiered analysis, semantic caching, batch processing
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ModelTier = 'speed' | 'balanced' | 'quality' | 'nextgen';
export type ModelProvider = 'google' | 'openai';

export interface ModelConfig {
  tier: ModelTier;
  provider: ModelProvider;
  modelName: string;
  costMultiplier: number;
  qualityScore: number;
  speedScore: number;
}

export interface CacheStats {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  tokensSaved: number;
  costSavedCents: number;
}

export interface UsageStats {
  dailySpendCents: number;
  weeklySpendCents: number;
  monthlySpendCents: number;
  dailyLimitCents: number | null;
  weeklyLimitCents: number | null;
  monthlyLimitCents: number | null;
  budgetUtilization: number;
}

export interface BatchJob {
  id: string;
  jobType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  estimatedCostCents: number;
  actualCostCents: number | null;
  createdAt: Date;
  completedAt: Date | null;
}

const TIER_MODELS: Record<ModelTier, Record<ModelProvider, string>> = {
  speed: { google: 'google/gemini-2.5-flash-lite', openai: 'openai/gpt-5-nano' },
  balanced: { google: 'google/gemini-2.5-flash', openai: 'openai/gpt-5-mini' },
  quality: { google: 'google/gemini-2.5-pro', openai: 'openai/gpt-5' },
  nextgen: { google: 'google/gemini-3-pro-preview', openai: 'openai/gpt-5' },
};

const MODEL_CONFIGS: Record<ModelTier, Omit<ModelConfig, 'modelName' | 'provider'>> = {
  speed: { tier: 'speed', costMultiplier: 0.25, qualityScore: 6, speedScore: 10 },
  balanced: { tier: 'balanced', costMultiplier: 0.5, qualityScore: 8, speedScore: 8 },
  quality: { tier: 'quality', costMultiplier: 1.0, qualityScore: 10, speedScore: 5 },
  nextgen: { tier: 'nextgen', costMultiplier: 1.5, qualityScore: 10, speedScore: 4 },
};

export function useAICreditOptimization() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [preferredProvider, setPreferredProvider] = useState<ModelProvider>('google');

  // Fetch cache statistics
  const cacheStatsQuery = useQuery({
    queryKey: ['ai-cache-stats', user?.id],
    queryFn: async (): Promise<CacheStats> => {
      if (!user?.id) return { totalHits: 0, totalMisses: 0, hitRate: 0, tokensSaved: 0, costSavedCents: 0 };

      const { data } = await supabase
        .from('ai_request_cache')
        .select('hit_count, tokens_saved, cost_saved_cents')
        .eq('user_id', user.id);

      if (!data || data.length === 0) {
        return { totalHits: 0, totalMisses: 0, hitRate: 0, tokensSaved: 0, costSavedCents: 0 };
      }

      const totalHits = data.reduce((sum, r) => sum + (r.hit_count || 0), 0);
      const tokensSaved = data.reduce((sum, r) => sum + (r.tokens_saved || 0), 0);
      const costSavedCents = data.reduce((sum, r) => sum + (r.cost_saved_cents || 0), 0);
      
      // Estimate misses based on total requests
      const { count: totalRequests } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalMisses = (totalRequests || 0) - totalHits;
      const hitRate = totalHits > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

      return { totalHits, totalMisses, hitRate, tokensSaved, costSavedCents };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch usage statistics
  const usageStatsQuery = useQuery({
    queryKey: ['ai-usage-stats', user?.id],
    queryFn: async (): Promise<UsageStats> => {
      if (!user?.id) {
        return {
          dailySpendCents: 0,
          weeklySpendCents: 0,
          monthlySpendCents: 0,
          dailyLimitCents: null,
          weeklyLimitCents: null,
          monthlyLimitCents: null,
          budgetUtilization: 0,
        };
      }

      const now = new Date();
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      const weekStartISO = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [{ data: usage }, { data: prefs }] = await Promise.all([
        supabase
          .from('ai_usage_logs')
          .select('actual_cost_cents, created_at')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('created_at', monthStart),
        supabase
          .from('user_preferences')
          .select('ai_budget_daily_limit_cents, ai_budget_weekly_limit_cents, ai_budget_monthly_limit_cents')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const dailySpendCents = (usage || [])
        .filter((u: { created_at: string }) => u.created_at >= dayStart)
        .reduce((sum: number, u: { actual_cost_cents: number | null }) => sum + (u.actual_cost_cents || 0), 0);

      const weeklySpendCents = (usage || [])
        .filter((u: { created_at: string }) => u.created_at >= weekStartISO)
        .reduce((sum: number, u: { actual_cost_cents: number | null }) => sum + (u.actual_cost_cents || 0), 0);

      const monthlySpendCents = (usage || [])
        .reduce((sum: number, u: { actual_cost_cents: number | null }) => sum + (u.actual_cost_cents || 0), 0);

      const dailyLimitCents = prefs?.ai_budget_daily_limit_cents || null;
      const weeklyLimitCents = prefs?.ai_budget_weekly_limit_cents || null;
      const monthlyLimitCents = prefs?.ai_budget_monthly_limit_cents || null;

      // Calculate budget utilization (use most restrictive limit)
      let budgetUtilization = 0;
      if (dailyLimitCents && dailySpendCents > 0) {
        budgetUtilization = Math.max(budgetUtilization, (dailySpendCents / dailyLimitCents) * 100);
      }
      if (weeklyLimitCents && weeklySpendCents > 0) {
        budgetUtilization = Math.max(budgetUtilization, (weeklySpendCents / weeklyLimitCents) * 100);
      }
      if (monthlyLimitCents && monthlySpendCents > 0) {
        budgetUtilization = Math.max(budgetUtilization, (monthlySpendCents / monthlyLimitCents) * 100);
      }

      return {
        dailySpendCents,
        weeklySpendCents,
        monthlySpendCents,
        dailyLimitCents,
        weeklyLimitCents,
        monthlyLimitCents,
        budgetUtilization,
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  // Fetch batch jobs
  const batchJobsQuery = useQuery({
    queryKey: ['batch-jobs', user?.id],
    queryFn: async (): Promise<BatchJob[]> => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      return (data || []).map((job: Record<string, unknown>) => ({
        id: job.id as string,
        jobType: job.job_type as string,
        status: job.status as BatchJob['status'],
        totalItems: job.total_items as number,
        processedItems: job.processed_items as number,
        estimatedCostCents: job.estimated_cost_cents as number,
        actualCostCents: job.actual_cost_cents as number | null,
        createdAt: new Date(job.created_at as string),
        completedAt: job.completed_at ? new Date(job.completed_at as string) : null,
      }));
    },
    enabled: !!user?.id,
  });

  // Select optimal model based on task complexity and budget
  const selectOptimalModel = useCallback((
    taskComplexity: 'low' | 'medium' | 'high' | 'critical',
    preferQuality = false
  ): ModelConfig => {
    let tier: ModelTier;

    // Check budget utilization
    const budgetUtilization = usageStatsQuery.data?.budgetUtilization || 0;
    const isNearBudget = budgetUtilization > 80;

    if (isNearBudget && taskComplexity !== 'critical') {
      tier = 'speed';
    } else {
      switch (taskComplexity) {
        case 'low':
          tier = 'speed';
          break;
        case 'medium':
          tier = preferQuality ? 'balanced' : 'speed';
          break;
        case 'high':
          tier = 'quality';
          break;
        case 'critical':
          tier = 'nextgen';
          break;
        default:
          tier = 'balanced';
      }
    }

    const modelName = TIER_MODELS[tier][preferredProvider];
    const config = MODEL_CONFIGS[tier];

    return {
      ...config,
      provider: preferredProvider,
      modelName,
    };
  }, [preferredProvider, usageStatsQuery.data?.budgetUtilization]);

  // Clear expired cache entries
  const clearExpiredCacheMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('ai_request_cache')
        .delete()
        .eq('user_id', user.id)
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-cache-stats', user?.id] });
    },
  });

  // Queue batch analysis job
  const queueBatchJobMutation = useMutation({
    mutationFn: async ({ jobType, profileIds }: { jobType: string; profileIds: string[] }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('batch_jobs')
        .insert({
          user_id: user.id,
          job_type: jobType,
          total_items: profileIds.length,
          processed_items: 0,
          status: 'pending',
          estimated_cost_cents: profileIds.length * 5, // Rough estimate
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-jobs', user?.id] });
    },
  });

  // Computed values
  const estimatedMonthlySavings = useMemo(() => {
    const cacheStats = cacheStatsQuery.data;
    if (!cacheStats) return 0;
    // Extrapolate current savings to monthly
    return Math.round(cacheStats.costSavedCents * 4.3); // ~4.3 weeks per month
  }, [cacheStatsQuery.data]);

  return {
    // Stats
    cacheStats: cacheStatsQuery.data,
    usageStats: usageStatsQuery.data,
    batchJobs: batchJobsQuery.data || [],
    estimatedMonthlySavings,

    // Loading states
    isLoadingCache: cacheStatsQuery.isLoading,
    isLoadingUsage: usageStatsQuery.isLoading,
    isLoadingBatchJobs: batchJobsQuery.isLoading,

    // Model selection
    selectOptimalModel,
    preferredProvider,
    setPreferredProvider,
    modelConfigs: MODEL_CONFIGS,
    tierModels: TIER_MODELS,

    // Actions
    clearExpiredCache: clearExpiredCacheMutation.mutateAsync,
    queueBatchJob: queueBatchJobMutation.mutateAsync,
  };
}
