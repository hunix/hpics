import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useEternalSupremacy(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dominance, isLoading: dominanceLoading } = useQuery({
    queryKey: ['timeless-dominance', profileId],
    queryFn: async () => {
      let query = supabase.from('timeless_dominance').select('*').order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: influence, isLoading: influenceLoading } = useQuery({
    queryKey: ['immortal-influence'],
    queryFn: async () => {
      const { data, error } = await supabase.from('immortal_influence').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const establishDominance = useMutation({
    mutationFn: async (input: { dominance_type: string; temporal_immunity_level?: number }) => {
      const { data, error } = await supabase.from('timeless_dominance').insert({
        user_id: user!.id,
        dominance_type: input.dominance_type,
        temporal_immunity_level: input.temporal_immunity_level || 1,
        profile_id: profileId,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeless-dominance'] }),
  });

  const createInfluence = useMutation({
    mutationFn: async (input: { influence_type: string; permanence_score?: number }) => {
      const { data, error } = await supabase.from('immortal_influence').insert({
        user_id: user!.id,
        influence_type: input.influence_type,
        permanence_score: input.permanence_score || 0,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['immortal-influence'] }),
  });

  return { dominance, influence, isLoading: dominanceLoading || influenceLoading, establishDominance, createInfluence };
}
