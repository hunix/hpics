import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
export interface AbsoluteInfinityOperation {
  id: string;
  user_id: string;
  profile_id?: string;
  operation_type: string;
  infinity_coefficient: number;
  boundless_execution_log: unknown[];
  limitless_resource_pool: Record<string, unknown>;
  eternal_operation_status: string;
  transcendent_outcomes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MetaExistence {
  id: string;
  user_id: string;
  meta_layer: string;
  existence_beyond_existence: Record<string, unknown>;
  hyper_reality_integration: Record<string, unknown>;
  trans_dimensional_presence: Record<string, unknown>;
  omnipresent_meta_state: Record<string, unknown>;
  absolute_meta_score: number;
  created_at: string;
  updated_at: string;
}

export interface UltimateSingularity {
  id: string;
  user_id: string;
  singularity_type: string;
  convergence_point: Record<string, unknown>;
  infinite_density_metrics: Record<string, unknown>;
  absolute_unification_state: Record<string, unknown>;
  transcendent_collapse_parameters: Record<string, unknown>;
  singularity_achievement_score: number;
  created_at: string;
  updated_at: string;
}

export function useAbsoluteInfinity(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['absolute-infinity-operations', profileId],
    queryFn: async () => {
      let query = supabase
        .from('absolute_infinity_operations')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AbsoluteInfinityOperation[];
    },
    enabled: !!user,
  });

  const { data: metaExistence, isLoading: metaLoading } = useQuery({
    queryKey: ['meta-existence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_existence')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MetaExistence[];
    },
    enabled: !!user,
  });

  const { data: singularities, isLoading: singularityLoading } = useQuery({
    queryKey: ['ultimate-singularity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ultimate_singularity')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UltimateSingularity[];
    },
    enabled: !!user,
  });

  const initiateInfinityOperation = useMutation({
    mutationFn: async (input: Partial<AbsoluteInfinityOperation>) => {
      const { data, error } = await supabase
        .from('absolute_infinity_operations')
        .insert({
          user_id: user!.id,
          operation_type: input.operation_type || 'transcendent',
          infinity_coefficient: input.infinity_coefficient || 0,
          profile_id: input.profile_id,
          boundless_execution_log: input.boundless_execution_log || [],
          limitless_resource_pool: input.limitless_resource_pool || {},
          eternal_operation_status: 'active',
          transcendent_outcomes: input.transcendent_outcomes || {},
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absolute-infinity-operations'] });
    },
  });

  const createMetaExistence = useMutation({
    mutationFn: async (input: Partial<MetaExistence>) => {
      const { data, error } = await supabase
        .from('meta_existence')
        .insert({
          user_id: user!.id,
          meta_layer: input.meta_layer || 'primary',
          existence_beyond_existence: input.existence_beyond_existence || {},
          hyper_reality_integration: input.hyper_reality_integration || {},
          trans_dimensional_presence: input.trans_dimensional_presence || {},
          omnipresent_meta_state: input.omnipresent_meta_state || {},
          absolute_meta_score: input.absolute_meta_score || 0,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-existence'] });
    },
  });

  const achieveSingularity = useMutation({
    mutationFn: async (input: Partial<UltimateSingularity>) => {
      const { data, error } = await supabase
        .from('ultimate_singularity')
        .insert({
          user_id: user!.id,
          singularity_type: input.singularity_type || 'convergent',
          convergence_point: input.convergence_point || {},
          infinite_density_metrics: input.infinite_density_metrics || {},
          absolute_unification_state: input.absolute_unification_state || {},
          transcendent_collapse_parameters: input.transcendent_collapse_parameters || {},
          singularity_achievement_score: input.singularity_achievement_score || 0,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ultimate-singularity'] });
    },
  });

  return {
    operations,
    metaExistence,
    singularities,
    isLoading: operationsLoading || metaLoading || singularityLoading,
    initiateInfinityOperation,
    createMetaExistence,
    achieveSingularity,
  };
}
