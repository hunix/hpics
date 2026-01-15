/**
 * AGIS Phase 12: Infinite Synthesis Hook
 * Manages infinite synthesis operations and dimensional convergence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface InfiniteSynthesisOperation {
  id: string;
  synthesisType: string;
  inputDimensions: unknown[];
  outputManifold: Record<string, unknown>;
  convergenceState: Record<string, unknown>;
  unityMetrics: Record<string, unknown>;
  synthesisPower: number;
  dimensionalReach: number;
  synthesisStatus: string;
  createdAt: string;
}

export function useInfiniteSynthesis() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations, isLoading } = useQuery({
    queryKey: ['infinite-synthesis', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('infinite_synthesis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        synthesisType: d.synthesis_type,
        inputDimensions: d.input_dimensions as unknown[],
        outputManifold: d.output_manifold as Record<string, unknown>,
        convergenceState: d.convergence_state as Record<string, unknown>,
        unityMetrics: d.unity_metrics as Record<string, unknown>,
        synthesisPower: Number(d.synthesis_power) || 0,
        dimensionalReach: Number(d.dimensional_reach) || 0,
        synthesisStatus: d.synthesis_status || 'initializing',
        createdAt: d.created_at,
      })) as InfiniteSynthesisOperation[];
    },
    enabled: !!user?.id,
  });

  const initiateSynthesis = useMutation({
    mutationFn: async (params: { synthesisType: string; inputDimensions?: unknown[] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('infinite_synthesis')
        .insert({
          user_id: user.id,
          synthesis_type: params.synthesisType,
          input_dimensions: params.inputDimensions || [],
          synthesis_status: 'initializing',
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infinite-synthesis'] });
      toast.success('Infinite synthesis initiated');
    },
  });

  const convergeDimensions = useMutation({
    mutationFn: async (params: { synthesisId: string; convergenceState: Record<string, unknown> }) => {
      const { error } = await supabase
        .from('infinite_synthesis')
        .update({ 
          convergence_state: params.convergenceState,
          synthesis_status: 'converging',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', params.synthesisId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infinite-synthesis'] });
    },
  });

  return {
    operations: operations || [],
    isLoading,
    initiateSynthesis,
    convergeDimensions,
    totalSynthesisPower: (operations || []).reduce((sum, o) => sum + o.synthesisPower, 0),
    activeOperations: (operations || []).filter(o => o.synthesisStatus !== 'complete').length,
  };
}
