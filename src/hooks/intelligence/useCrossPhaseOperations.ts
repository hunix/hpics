import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CrossPhaseOperation {
  id: string;
  profileId: string | null;
  operationName: string;
  operationType: string;
  phasesInvolved: string[];
  phaseObjectives: Record<string, unknown>;
  synchronizationRules: Record<string, unknown>;
  executionTimeline: Record<string, unknown>;
  status: string;
  successProbability: number | null;
  resourceAllocation: Record<string, unknown>;
  startedAt: string | null;
  completedAt: string | null;
  outcomeAnalysis: Record<string, unknown> | null;
  createdAt: string | null;
}

export function useCrossPhaseOperations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const operationsQuery = useQuery({
    queryKey: ['cross-phase-operations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cross_phase_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        operationName: row.operation_name,
        operationType: row.operation_type,
        phasesInvolved: row.phases_involved || [],
        phaseObjectives: row.phase_objectives as Record<string, unknown> || {},
        synchronizationRules: row.synchronization_rules as Record<string, unknown> || {},
        executionTimeline: row.execution_timeline as Record<string, unknown> || {},
        status: row.status || 'planning',
        successProbability: row.success_probability ? Number(row.success_probability) : null,
        resourceAllocation: row.resource_allocation as Record<string, unknown> || {},
        startedAt: row.started_at,
        completedAt: row.completed_at,
        outcomeAnalysis: row.outcome_analysis as Record<string, unknown> | null,
        createdAt: row.created_at,
      })) as CrossPhaseOperation[];
    },
    enabled: !!user,
  });

  const createOperation = useMutation({
    mutationFn: async (input: { 
      operationName: string; 
      operationType: string; 
      phasesInvolved: string[];
      profileId?: string;
    }) => {
      const { data, error } = await supabase
        .from('cross_phase_operations')
        .insert({
          user_id: user!.id,
          operation_name: input.operationName,
          operation_type: input.operationType,
          phases_involved: input.phasesInvolved,
          profile_id: input.profileId || null,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-phase-operations'] });
      toast.success('Cross-phase operation created');
    },
  });

  const executeOperation = useMutation({
    mutationFn: async (operationId: string) => {
      const { data, error } = await supabase
        .from('cross_phase_operations')
        .update({
          status: 'executing',
          started_at: new Date().toISOString(),
        } as never)
        .eq('id', operationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-phase-operations'] });
      toast.success('Operation execution started');
    },
  });

  const activeOperations = (operationsQuery.data || []).filter(op => op.status === 'executing');
  const planningOperations = (operationsQuery.data || []).filter(op => op.status === 'planning');

  return {
    operations: operationsQuery.data || [],
    activeOperations,
    planningOperations,
    isLoading: operationsQuery.isLoading,
    createOperation,
    executeOperation,
  };
}
