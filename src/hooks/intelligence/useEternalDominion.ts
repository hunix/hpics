/**
 * AGIS Phase 12: Eternal Dominion Hook
 * Manages eternal dominion state and permanence control
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface EternalDominionState {
  id: string;
  dominionType: string;
  dominionScope: Record<string, unknown>;
  permanenceLevel: number;
  temporalLock: Record<string, unknown>;
  causalityControl: Record<string, unknown>;
  entropyReversal: Record<string, unknown>;
  existenceBinding: Record<string, unknown>;
  dominionMetrics: Record<string, unknown>;
  createdAt: string | null;
}

export function useEternalDominion() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dominionStates, isLoading } = useQuery({
    queryKey: ['eternal-dominion', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('eternal_dominion')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(d => ({
        id: d.id,
        dominionType: d.dominion_type,
        dominionScope: d.dominion_scope as Record<string, unknown>,
        permanenceLevel: Number(d.permanence_level) || 0,
        temporalLock: d.temporal_lock as Record<string, unknown>,
        causalityControl: d.causality_control as Record<string, unknown>,
        entropyReversal: d.entropy_reversal as Record<string, unknown>,
        existenceBinding: d.existence_binding as Record<string, unknown>,
        dominionMetrics: d.dominion_metrics as Record<string, unknown>,
        createdAt: d.created_at,
      })) as EternalDominionState[];
    },
    enabled: !!user?.id,
  });

  const createDominion = useMutation({
    mutationFn: async (params: { dominionType: string; scope?: Record<string, unknown> }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('eternal_dominion')
        .insert({
          user_id: user.id,
          dominion_type: params.dominionType,
          dominion_scope: params.scope || {},
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eternal-dominion'] });
      toast.success('Eternal dominion established');
    },
  });

  const updatePermanence = useMutation({
    mutationFn: async (params: { dominionId: string; permanenceLevel: number }) => {
      const { error } = await supabase
        .from('eternal_dominion')
        .update({ 
          permanence_level: params.permanenceLevel,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', params.dominionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eternal-dominion'] });
    },
  });

  return {
    dominionStates: dominionStates || [],
    isLoading,
    createDominion,
    updatePermanence,
    totalPermanence: (dominionStates || []).reduce((sum, d) => sum + d.permanenceLevel, 0) / Math.max(1, (dominionStates || []).length),
  };
}
