import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePrimordialGenesis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: origins, isLoading: originsLoading } = useQuery({
    queryKey: ['primordial-origins', profileId],
    queryFn: async () => {
      let query = (supabase as any).from('primordial_origins').select('*').order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: synthesis, isLoading: synthesisLoading } = useQuery({
    queryKey: ['genesis-synthesis'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('genesis_synthesis').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createOrigin = useMutation({
    mutationFn: async (input: { origin_type: string; genesis_power_level?: number }) => {
      const { data, error } = await (supabase as any).from('primordial_origins').insert({
        user_id: user!.id,
        origin_type: input.origin_type,
        genesis_power_level: input.genesis_power_level || 1,
        profile_id: profileId,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['primordial-origins'] }),
  });

  const createSynthesis = useMutation({
    mutationFn: async (input: { synthesis_type: string; creation_potential?: number }) => {
      const { data, error } = await (supabase as any).from('genesis_synthesis').insert({
        user_id: user!.id,
        synthesis_type: input.synthesis_type,
        creation_potential: input.creation_potential || 0,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['genesis-synthesis'] }),
  });

  return { origins, synthesis, isLoading: originsLoading || synthesisLoading, createOrigin, createSynthesis };
}
