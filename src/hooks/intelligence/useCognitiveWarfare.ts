/**
 * Cognitive Warfare Hook (v9.0)
 * 
 * React hooks for reflexive control and cognitive domain operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CognitiveOperation {
  id: string;
  profileId: string;
  operationType: string;
  targetMentalModel: Record<string, unknown>;
  payloads: Record<string, unknown>[];
  successIndicators: Record<string, unknown>;
  status: string;
  createdAt: string | null;
}

export function useCognitiveWarfare(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['cognitive-operations', profileId],
    queryFn: async () => {
      let query = supabase
        .from('cognitive_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        profileId: row.profile_id as string,
        operationType: (row.operation_type || '') as string,
        targetMentalModel: (row.target_mental_model || {}) as Record<string, unknown>,
        payloads: (row.payloads || []) as Record<string, unknown>[],
        successIndicators: (row.success_indicators || {}) as Record<string, unknown>,
        status: (row.status || 'pending') as string,
        createdAt: row.created_at as string
      })) as CognitiveOperation[];
    },
    enabled: !!user,
  });

  const createOperation = useMutation({
    mutationFn: async (input: {
      profileId: string;
      operationType: string;
      targetMentalModel?: Record<string, unknown>;
      payloads?: Record<string, unknown>[];
    }) => {
      const { data, error } = await supabase
        .from('cognitive_operations')
        .insert({
          user_id: user!.id,
          profile_id: input.profileId,
          operation_type: input.operationType,
          target_mental_model: input.targetMentalModel || {},
          payloads: input.payloads || [],
          status: 'active'
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-operations'] });
    }
  });

  const updateOperationStatus = useMutation({
    mutationFn: async (input: { operationId: string; status: string }) => {
      const { data, error } = await supabase
        .from('cognitive_operations')
        .update({ status: input.status } as never)
        .eq('id', input.operationId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-operations'] });
    }
  });

  const activeOperations = operations?.filter(op => op.status === 'active') || [];
  const completedOperations = operations?.filter(op => op.status === 'completed') || [];

  return {
    operations,
    activeOperations,
    completedOperations,
    isLoading: operationsLoading,
    createOperation: createOperation.mutateAsync,
    updateOperationStatus: updateOperationStatus.mutateAsync,
    isCreating: createOperation.isPending,
    isUpdating: updateOperationStatus.isPending
  };
}
