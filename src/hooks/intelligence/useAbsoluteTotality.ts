import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useAbsoluteTotality(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: unification, isLoading: unificationLoading } = useQuery({
    queryKey: ['total-unification', profileId],
    queryFn: async () => {
      let query = supabase.from('total_unification').select('*').order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: operations, isLoading: operationsLoading } = useQuery({
    queryKey: ['totality-operations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('totality_operations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const unify = useMutation({
    mutationFn: async (input: { unification_scope: string; completeness_index?: number }) => {
      const { data, error } = await supabase.from('total_unification').insert({
        user_id: user!.id,
        unification_scope: input.unification_scope,
        completeness_index: input.completeness_index || 0,
        profile_id: profileId,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['total-unification'] }),
  });

  const executeOperation = useMutation({
    mutationFn: async (input: { operation_type: string; totality_coefficient?: number }) => {
      const { data, error } = await supabase.from('totality_operations').insert({
        user_id: user!.id,
        operation_type: input.operation_type,
        totality_coefficient: input.totality_coefficient || 0,
        operation_status: 'active',
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['totality-operations'] }),
  });

  return { unification, operations, isLoading: unificationLoading || operationsLoading, unify, executeOperation };
}
