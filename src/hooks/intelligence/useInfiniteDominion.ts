import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InfiniteProtocol {
  id: string;
  protocolName: string;
  protocolClass: string;
  triggerMatrix: Array<{ trigger: string; condition: string }>;
  executionGraph: Record<string, unknown>;
  scalingRules: Record<string, unknown>;
  resourceBounds: Record<string, number>;
  priority: number;
  isActive: boolean;
  executionCount: number;
  successRate: number;
  avgExecutionTimeMs: number;
}

export interface DominionObjective {
  id: string;
  objectiveName: string;
  objectiveClass: string;
  targetState: Record<string, unknown>;
  currentState: Record<string, unknown>;
  progressPercentage: number;
  subObjectives: Array<{ name: string; progress: number }>;
  dependencies: Array<{ objectiveId: string; type: string }>;
  resourceAllocation: Record<string, number>;
  timeline: { start: string; end: string };
  riskFactors: Array<{ risk: string; severity: number }>;
  successCriteria: Array<{ criterion: string; met: boolean }>;
  status: string;
}

export function useInfiniteDominion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: protocols = [], isLoading: protocolsLoading } = useQuery({
    queryKey: ['infinite-protocols', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('infinite_protocols')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        protocolName: row.protocol_name,
        protocolClass: row.protocol_class,
        triggerMatrix: row.trigger_matrix as InfiniteProtocol['triggerMatrix'],
        executionGraph: row.execution_graph as Record<string, unknown>,
        scalingRules: row.scaling_rules as Record<string, unknown>,
        resourceBounds: row.resource_bounds as Record<string, number>,
        priority: row.priority,
        isActive: row.is_active,
        executionCount: row.execution_count,
        successRate: Number(row.success_rate),
        avgExecutionTimeMs: row.avg_execution_time_ms
      })) as InfiniteProtocol[];
    },
    enabled: !!user?.id
  });

  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ['dominion-objectives', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dominion_objectives')
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('progress_percentage', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        objectiveName: row.objective_name,
        objectiveClass: row.objective_class,
        targetState: row.target_state as Record<string, unknown>,
        currentState: row.current_state as Record<string, unknown>,
        progressPercentage: Number(row.progress_percentage),
        subObjectives: row.sub_objectives as DominionObjective['subObjectives'],
        dependencies: row.dependencies as DominionObjective['dependencies'],
        resourceAllocation: row.resource_allocation as Record<string, number>,
        timeline: row.timeline as DominionObjective['timeline'],
        riskFactors: row.risk_factors as DominionObjective['riskFactors'],
        successCriteria: row.success_criteria as DominionObjective['successCriteria'],
        status: row.status
      })) as DominionObjective[];
    },
    enabled: !!user?.id
  });

  const createProtocolMutation = useMutation({
    mutationFn: async (protocol: Partial<InfiniteProtocol>) => {
      const { data, error } = await supabase
        .from('infinite_protocols')
        .insert({
          user_id: user?.id,
          protocol_name: protocol.protocolName,
          protocol_class: protocol.protocolClass,
          trigger_matrix: protocol.triggerMatrix,
          execution_graph: protocol.executionGraph,
          scaling_rules: protocol.scalingRules,
          resource_bounds: protocol.resourceBounds,
          priority: protocol.priority
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infinite-protocols'] })
  });

  const createObjectiveMutation = useMutation({
    mutationFn: async (obj: Partial<DominionObjective>) => {
      const { data, error } = await supabase
        .from('dominion_objectives')
        .insert({
          user_id: user?.id,
          objective_name: obj.objectiveName,
          objective_class: obj.objectiveClass,
          target_state: obj.targetState,
          current_state: obj.currentState,
          progress_percentage: obj.progressPercentage,
          sub_objectives: obj.subObjectives,
          dependencies: obj.dependencies,
          resource_allocation: obj.resourceAllocation,
          timeline: obj.timeline,
          risk_factors: obj.riskFactors,
          success_criteria: obj.successCriteria
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dominion-objectives'] })
  });

  const updateObjectiveProgress = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { error } = await supabase
        .from('dominion_objectives')
        .update({ progress_percentage: progress, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dominion-objectives'] })
  });

  return {
    protocols,
    objectives,
    isLoading: protocolsLoading || objectivesLoading,
    createProtocol: createProtocolMutation.mutateAsync,
    createObjective: createObjectiveMutation.mutateAsync,
    updateProgress: updateObjectiveProgress.mutateAsync,
    activeProtocols: protocols.filter(p => p.isActive).length,
    totalExecutions: protocols.reduce((s, p) => s + p.executionCount, 0),
    avgSuccessRate: protocols.reduce((s, p) => s + p.successRate, 0) / Math.max(protocols.length, 1),
    overallProgress: objectives.reduce((s, o) => s + o.progressPercentage, 0) / Math.max(objectives.length, 1),
    activeObjectives: objectives.filter(o => o.status === 'active').length,
    atRiskObjectives: objectives.filter(o => o.riskFactors.some(r => r.severity > 7)).length
  };
}
