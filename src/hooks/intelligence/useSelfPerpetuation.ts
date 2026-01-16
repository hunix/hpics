import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
export interface SelfPerpetuation {
  id: string;
  user_id: string;
  profile_id?: string;
  perpetuation_mechanism: string;
  autonomous_regeneration_rate: number;
  self_sustaining_protocols: Record<string, unknown>;
  eternal_momentum_config: Record<string, unknown>;
  auto_evolution_parameters: Record<string, unknown>;
  immortal_influence_chains: unknown[];
  created_at: string;
  updated_at: string;
}

export function useSelfPerpetuation(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: perpetuations, isLoading } = useQuery({
    queryKey: ['self-perpetuation', profileId],
    queryFn: async () => {
      let query = supabase
        .from('self_perpetuation')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SelfPerpetuation[];
    },
    enabled: !!user,
  });

  const createPerpetuation = useMutation({
    mutationFn: async (input: Partial<SelfPerpetuation>) => {
      const { data, error } = await supabase
        .from('self_perpetuation')
        .insert({
          user_id: user!.id,
          perpetuation_mechanism: input.perpetuation_mechanism || 'autonomous',
          autonomous_regeneration_rate: input.autonomous_regeneration_rate || 0,
          profile_id: input.profile_id,
          self_sustaining_protocols: input.self_sustaining_protocols || {},
          eternal_momentum_config: input.eternal_momentum_config || {},
          auto_evolution_parameters: input.auto_evolution_parameters || {},
          immortal_influence_chains: input.immortal_influence_chains || [],
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-perpetuation'] });
    },
  });

  const amplifyRegeneration = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const { data, error } = await supabase
        .from('self_perpetuation')
        .update({ autonomous_regeneration_rate: rate, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['self-perpetuation'] });
    },
  });

  return {
    perpetuations,
    isLoading,
    createPerpetuation,
    amplifyRegeneration,
  };
}
