/**
 * Procedural Memory Hook (v3.9.35)
 * React hooks for SOP management and distillation
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

// Types
interface ProceduralMemory {
  id: string;
  user_id: string;
  sop_key: string;
  sop_name: string;
  description: string | null;
  trigger_conditions: string[];
  action_sequence: Array<{ step: number; action: string; expected_outcome: string }>;
  success_criteria: string[];
  source_task_ids: string[];
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ReflectAgentConfig {
  id: string;
  reflection_type: string;
  display_name: string;
  prompt_key: string;
  evaluation_dimensions: Array<{
    name: string;
    weight: number;
    criteria: string;
  }>;
  min_confidence_for_sop: number;
  sop_generation_enabled: boolean;
  failure_analysis_enabled: boolean;
  is_active: boolean;
}

interface TaskReflection {
  id: string;
  user_id: string;
  profile_id: string | null;
  source_execution_id: string | null;
  source_analysis_id: string | null;
  reflection_type: string;
  evaluation_scores: Array<{
    dimension: string;
    score: number;
    rationale: string;
  }>;
  overall_success: boolean;
  distilled_sop_id: string | null;
  failure_analysis: Record<string, unknown> | null;
  improvement_suggestions: string[];
  cost_cents: number;
  created_at: string;
}

interface FailureAnalysisReport {
  id: string;
  user_id: string;
  profile_id: string | null;
  source_execution_id: string | null;
  failure_type: string;
  root_cause_analysis: string;
  contributing_factors: string[];
  recommended_fixes: string[];
  prevented_by_sop_id: string | null;
  severity: string;
  created_at: string;
}

interface DistillationRequest {
  profileId?: string;
  executionId?: string;
  analysisId?: string;
  reflectionType?: string;
  forceReflect?: boolean;
}

interface DistillationResponse {
  success: boolean;
  overallSuccess: boolean;
  weightedScore: number;
  evaluationScores: Array<{ dimension: string; score: number; rationale: string }>;
  distilledSopId: string | null;
  sopGenerated: boolean;
  failureReportId: string | null;
  improvementSuggestions: string[];
  costCents: number;
  timestamp: string;
  error?: string;
}

// Query keys
const sopKeys = {
  all: ['procedural-memory'] as const,
  list: () => [...sopKeys.all, 'list'] as const,
  sop: (id: string) => [...sopKeys.all, 'sop', id] as const,
  byKey: (key: string) => [...sopKeys.all, 'key', key] as const,
  configs: () => [...sopKeys.all, 'configs'] as const,
  reflections: () => [...sopKeys.all, 'reflections'] as const,
  profileReflections: (profileId: string) => [...sopKeys.reflections(), profileId] as const,
  failures: () => [...sopKeys.all, 'failures'] as const,
};

/**
 * Fetch all SOPs for current user
 */
export function useProceduralMemoryList(options?: { activeOnly?: boolean }) {
  return useQuery({
    queryKey: sopKeys.list(),
    queryFn: async () => {
      let query = supabase
        .from('procedural_memory')
        .select('*')
        .order('usage_count', { ascending: false });

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ProceduralMemory[];
    },
  });
}

/**
 * Fetch a specific SOP
 */
export function useSOP(sopId: string | undefined) {
  return useQuery({
    queryKey: sopKeys.sop(sopId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedural_memory')
        .select('*')
        .eq('id', sopId)
        .single();

      if (error) throw error;
      return data as unknown as ProceduralMemory;
    },
    enabled: !!sopId,
  });
}

/**
 * Find applicable SOPs for a given context
 */
export function useApplicableSOPs(contextKeywords: string[]) {
  return useQuery({
    queryKey: [...sopKeys.all, 'applicable', contextKeywords.join(',')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedural_memory')
        .select('*')
        .eq('is_active', true)
        .gte('confidence_score', 0.5)
        .order('success_rate', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Filter by trigger conditions matching context
      const sops = data as unknown as ProceduralMemory[];
      return sops.filter(sop => 
        sop.trigger_conditions?.some(condition =>
          contextKeywords.some(keyword => 
            condition.toLowerCase().includes(keyword.toLowerCase())
          )
        )
      );
    },
    enabled: contextKeywords.length > 0,
  });
}

/**
 * Fetch reflection configurations
 */
export function useReflectAgentConfigs() {
  return useQuery({
    queryKey: sopKeys.configs(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reflect_agent_config')
        .select('*')
        .order('display_name');

      if (error) throw error;
      return data as unknown as ReflectAgentConfig[];
    },
  });
}

/**
 * Fetch reflections for a profile
 */
export function useProfileReflections(profileId: string | undefined) {
  return useQuery({
    queryKey: sopKeys.profileReflections(profileId || ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_reflections')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as TaskReflection[];
    },
    enabled: !!profileId,
  });
}

/**
 * Fetch failure analysis reports
 */
export function useFailureReports(limit: number = 50) {
  return useQuery({
    queryKey: [...sopKeys.failures(), limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('failure_analysis_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as FailureAnalysisReport[];
    },
  });
}

/**
 * Invoke SOP distillation engine
 */
export function useDistillSOP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: DistillationRequest): Promise<DistillationResponse> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await invokeFunction('sop-distillation-engine', {
          userId: user.id,
          profileId: request.profileId,
          executionId: request.executionId,
          analysisId: request.analysisId,
          reflectionType: request.reflectionType || 'task_completion',
          forceReflect: request.forceReflect || false,
        },);

      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Distillation failed');
      
      return data;
    },
    onSuccess: (data) => {
      if (data.sopGenerated) {
        toast.success('SOP distilled successfully', {
          description: `Confidence: ${(data.weightedScore * 100).toFixed(1)}%`,
        });
      } else if (!data.overallSuccess) {
        toast.warning('Task reflection complete', {
          description: 'Failure analysis generated',
        });
      } else {
        toast.info('Reflection complete', {
          description: 'Confidence too low for SOP generation',
        });
      }
      
      queryClient.invalidateQueries({ queryKey: sopKeys.list() });
      queryClient.invalidateQueries({ queryKey: sopKeys.reflections() });
    },
    onError: (error) => {
      toast.error('Distillation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Update SOP
 */
export function useUpdateSOP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<ProceduralMemory> & { id: string }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('procedural_memory')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('SOP updated');
      queryClient.invalidateQueries({ queryKey: sopKeys.list() });
    },
    onError: (error) => {
      toast.error('Failed to update SOP', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

/**
 * Record SOP usage
 */
export function useRecordSOPUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sopId, success }: { sopId: string; success: boolean }) => {
      // Get current SOP
      const { data: sop, error: fetchError } = await supabase
        .from('procedural_memory')
        .select('usage_count, success_rate')
        .eq('id', sopId)
        .single();

      if (fetchError) throw fetchError;

      const currentCount = sop?.usage_count || 0;
      const currentRate = sop?.success_rate || 0;
      const newCount = currentCount + 1;
      const newRate = ((currentRate * currentCount) + (success ? 1 : 0)) / newCount;

      const { error } = await supabase
        .from('procedural_memory')
        .update({
          usage_count: newCount,
          success_rate: newRate,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sopId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sopKeys.list() });
    },
  });
}
