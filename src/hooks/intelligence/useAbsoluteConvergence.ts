import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConvergenceProtocol {
  id: string;
  protocolName: string;
  protocolType: string;
  triggerConditions: Array<{ condition: string; threshold: number }>;
  executionSequence: Array<{ step: number; action: string; params: Record<string, unknown> }>;
  convergenceRules: Record<string, unknown>;
  priority: number;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  successRate: number;
}

export interface AbsoluteObjective {
  id: string;
  objectiveName: string;
  objectiveType: string;
  targetState: Record<string, unknown>;
  currentProgress: number;
  subObjectives: Array<{ name: string; progress: number; status: string }>;
  dependencies: Array<{ objectiveId: string; type: string }>;
  blockers: Array<{ blocker: string; severity: number }>;
  resourcesRequired: Record<string, number>;
  estimatedCompletion?: string;
  priorityScore: number;
  status: string;
}

export function useAbsoluteConvergence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: protocols = [], isLoading: protocolsLoading } = useQuery({
    queryKey: ['convergence-protocols', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('convergence_protocols')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        protocolName: row.protocol_name,
        protocolType: row.protocol_type,
        triggerConditions: row.trigger_conditions as ConvergenceProtocol['triggerConditions'],
        executionSequence: row.execution_sequence as ConvergenceProtocol['executionSequence'],
        convergenceRules: row.convergence_rules as Record<string, unknown>,
        priority: row.priority,
        isActive: row.is_active,
        executionCount: row.execution_count,
        lastExecutedAt: row.last_executed_at,
        successRate: Number(row.success_rate)
      })) as ConvergenceProtocol[];
    },
    enabled: !!user?.id
  });

  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['absolute-objectives', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('absolute_objectives')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('priority_score', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        objectiveName: row.objective_name,
        objectiveType: row.objective_type,
        targetState: row.target_state as Record<string, unknown>,
        currentProgress: Number(row.current_progress),
        subObjectives: row.sub_objectives as AbsoluteObjective['subObjectives'],
        dependencies: row.dependencies as AbsoluteObjective['dependencies'],
        blockers: row.blockers as AbsoluteObjective['blockers'],
        resourcesRequired: row.resources_required as Record<string, number>,
        estimatedCompletion: row.estimated_completion,
        priorityScore: Number(row.priority_score),
        status: row.status
      })) as AbsoluteObjective[];
    },
    enabled: !!user?.id
  });

  const createProtocolMutation = useMutation({
    mutationFn: async (protocol: Partial<ConvergenceProtocol>) => {
      const { data, error } = await supabase
        .from('convergence_protocols')
        .insert({
          user_id: user?.id,
          protocol_name: protocol.protocolName,
          protocol_type: protocol.protocolType,
          trigger_conditions: protocol.triggerConditions,
          execution_sequence: protocol.executionSequence,
          convergence_rules: protocol.convergenceRules,
          priority: protocol.priority
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['convergence-protocols'] })
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (objective: Partial<AbsoluteObjective>) => {
      const { data, error } = await supabase
        .from('absolute_objectives')
        .insert({
          user_id: user?.id,
          objective_name: objective.objectiveName,
          objective_type: objective.objectiveType,
          target_state: objective.targetState,
          current_progress: objective.currentProgress,
          sub_objectives: objective.subObjectives,
          dependencies: objective.dependencies,
          blockers: objective.blockers,
          resources_required: objective.resourcesRequired,
          priority_score: objective.priorityScore
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-objectives'] })
  });

  const updateObjectiveProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { error } = await supabase
        .from('absolute_objectives')
        .update({ current_progress: progress, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-objectives'] })
  });

  return {
    protocols,
    objectives,
    isLoading: protocolsLoading || objectivesLoading,
    createProtocol: createProtocolMutation.mutateAsync,
    createObjective: createObjectiveMutation.mutateAsync,
    updateProgress: updateObjectiveProgress.mutateAsync,
    activeProtocols: protocols.filter(p => p.isActive).length,
    avgSuccessRate: protocols.reduce((sum, p) => sum + p.successRate, 0) / Math.max(protocols.length, 1),
    totalExecutions: protocols.reduce((sum, p) => sum + p.executionCount, 0),
    overallProgress: objectives.reduce((sum, o) => sum + o.currentProgress, 0) / Math.max(objectives.length, 1),
    activeObjectives: objectives.filter(o => o.status === 'active').length,
    blockedObjectives: objectives.filter(o => o.blockers.length > 0).length
  };
}
