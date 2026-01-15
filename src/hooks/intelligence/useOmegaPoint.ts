/**
 * AGIS Phase 12: Omega Point Hook
 * Manages omega point convergence and destiny alignment
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface OmegaPointOperation {
  id: string;
  operationName: string;
  convergenceVector: Record<string, unknown>;
  attractorState: Record<string, unknown>;
  destinyAlignment: number;
  finalityMetrics: Record<string, unknown>;
  transcendencePath: unknown[];
  omegaProximity: number;
  operationStatus: string;
  createdAt: string;
}

export function useOmegaPoint() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations, isLoading } = useQuery({
    queryKey: ['omega-point', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('omega_point_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        operationName: d.operation_name,
        convergenceVector: d.convergence_vector as Record<string, unknown>,
        attractorState: d.attractor_state as Record<string, unknown>,
        destinyAlignment: Number(d.destiny_alignment) || 0,
        finalityMetrics: d.finality_metrics as Record<string, unknown>,
        transcendencePath: d.transcendence_path as unknown[],
        omegaProximity: Number(d.omega_proximity) || 0,
        operationStatus: d.operation_status || 'calculating',
        createdAt: d.created_at,
      })) as OmegaPointOperation[];
    },
    enabled: !!user?.id,
  });

  const initiateOmegaOperation = useMutation({
    mutationFn: async (params: { operationName: string; convergenceVector?: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('omega_point_operations')
        .insert({
          user_id: user.id,
          operation_name: params.operationName,
          convergence_vector: params.convergenceVector || {},
          operation_status: 'calculating',
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omega-point'] });
      toast.success('Omega point operation initiated');
    },
  });

  const alignDestiny = useMutation({
    mutationFn: async (params: { operationId: string; alignment: number }) => {
      const { error } = await supabase
        .from('omega_point_operations')
        .update({ 
          destiny_alignment: params.alignment,
          operation_status: 'aligning',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', params.operationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['omega-point'] });
    },
  });

  const maxOmegaProximity = Math.max(0, ...(operations || []).map(o => o.omegaProximity));

  return {
    operations: operations || [],
    isLoading,
    initiateOmegaOperation,
    alignDestiny,
    maxOmegaProximity,
    averageDestinyAlignment: (operations || []).reduce((sum, o) => sum + o.destinyAlignment, 0) / Math.max(1, (operations || []).length),
  };
}
