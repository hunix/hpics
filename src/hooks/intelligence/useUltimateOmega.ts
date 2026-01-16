import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useUltimateOmega(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: culminations, isLoading: culminationsLoading } = useQuery({
    queryKey: ['omega-culmination', profileId],
    queryFn: async () => {
      let query = (supabase as any).from('omega_culmination').select('*').order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: omegaStates, isLoading: statesLoading } = useQuery({
    queryKey: ['ultimate-omega-state'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('ultimate_omega_state').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const achieveCulmination = useMutation({
    mutationFn: async (input: { culmination_type: string; finality_score?: number }) => {
      const { data, error } = await (supabase as any).from('omega_culmination').insert({
        user_id: user!.id,
        culmination_type: input.culmination_type,
        finality_score: input.finality_score || 0,
        profile_id: profileId,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omega-culmination'] }),
  });

  const attainOmegaState = useMutation({
    mutationFn: async (input: { state_type: string; completion_percentage?: number }) => {
      const { data, error } = await (supabase as any).from('ultimate_omega_state').insert({
        user_id: user!.id,
        state_type: input.state_type,
        completion_percentage: input.completion_percentage || 0,
        achieved_at: input.completion_percentage === 100 ? new Date().toISOString() : null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ultimate-omega-state'] }),
  });

  return { culminations, omegaStates, isLoading: culminationsLoading || statesLoading, achieveCulmination, attainOmegaState };
}
