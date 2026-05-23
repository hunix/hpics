import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface DetectedEgregore {
  id: string;
  userId: string;
  egregoreName: string;
  egregoreType: string;
  memberCount: number;
  cohesionStrength: number;
  dominantNarratives: string[];
  ritualPatterns: Record<string, unknown>[];
  influenceRadius: number;
  lifecyclePhase: string;
  createdAt: string | null;
}

export interface EgregoreCultivation {
  id: string;
  userId: string;
  egregoreId?: string;
  cultivationType: string;
  cultivationStrength: number;
  growthProtocols: Record<string, unknown>[];
  targetOutcomes: string[];
  progressMetrics: Record<string, unknown>;
  createdAt: string | null;
}

export function useEgregoreCultivation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: egregores, isLoading: egregoresLoading } = useQuery({
    queryKey: ['detected-egregores', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('detected_egregores')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        egregoreName: (row.egregore_name || '') as string,
        egregoreType: (row.egregore_type || '') as string,
        memberCount: (row.member_count || row.carrier_count || 0) as number,
        cohesionStrength: (row.cohesion_strength || row.influence_strength || 0) as number,
        dominantNarratives: (row.dominant_narratives || []) as string[],
        ritualPatterns: (row.ritual_patterns || []) as Record<string, unknown>[],
        influenceRadius: (row.influence_radius || 0) as number,
        lifecyclePhase: (row.lifecycle_phase || row.life_cycle_stage || 'emerging') as string,
        createdAt: row.created_at as string
      })) as DetectedEgregore[];
    },
    enabled: !!user,
  });

  const { data: cultivations, isLoading: cultivationsLoading } = useQuery({
    queryKey: ['egregore-cultivations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('egregore_cultivation')
        .select('*')
        .eq('user_id', user!.id)
        .order('executed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        egregoreId: row.egregore_id as string,
        cultivationType: (row.action_type || row.cultivation_action || '') as string,
        cultivationStrength: (row.effectiveness_score || row.energy_input || 0) as number,
        growthProtocols: [] as Record<string, unknown>[],
        targetOutcomes: [] as string[],
        progressMetrics: (row.actual_outcome || row.expected_outcome || {}) as Record<string, unknown>,
        createdAt: (row.executed_at || '') as string
      })) as EgregoreCultivation[];
    },
    enabled: !!user,
  });

  const detectEgregores = useMutation({
    mutationFn: async (input: { action?: 'detect' | 'cultivate' | 'destroy'; egregoreName?: string }) => {
      const { data, error } = await invokeFunction('egregore-cultivation-engine', {
          userId: user!.id,
          action: input.action || 'detect',
          egregoreName: input.egregoreName
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detected-egregores'] });
      queryClient.invalidateQueries({ queryKey: ['egregore-cultivations'] });
    }
  });

  return {
    egregores,
    cultivations,
    isLoading: egregoresLoading || cultivationsLoading,
    detectEgregores: detectEgregores.mutateAsync,
    isDetecting: detectEgregores.isPending,
    strongestEgregore: egregores?.reduce((max, e) => e.cohesionStrength > (max?.cohesionStrength || 0) ? e : max, null as DetectedEgregore | null),
    totalInfluenceRadius: egregores?.reduce((sum, e) => sum + e.influenceRadius, 0) || 0
  };
}
