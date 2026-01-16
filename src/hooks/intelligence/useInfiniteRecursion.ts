import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
export interface InfiniteRecursion {
  id: string;
  user_id: string;
  profile_id?: string;
  recursion_type: string;
  recursion_depth: number;
  self_amplification_score: number;
  perpetual_cycle_config: Record<string, unknown>;
  fractal_influence_map: Record<string, unknown>;
  infinite_loop_status: Record<string, unknown>;
  meta_recursion_layers: unknown[];
  created_at: string;
  updated_at: string;
}

export function useInfiniteRecursion(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: recursions, isLoading } = useQuery({
    queryKey: ['infinite-recursion', profileId],
    queryFn: async () => {
      let query = supabase
        .from('infinite_recursion')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as InfiniteRecursion[];
    },
    enabled: !!user,
  });

  const createRecursion = useMutation({
    mutationFn: async (input: Partial<InfiniteRecursion>) => {
      const { data, error } = await supabase
        .from('infinite_recursion')
        .insert({
          user_id: user!.id,
          recursion_type: input.recursion_type || 'fractal',
          recursion_depth: input.recursion_depth || 0,
          self_amplification_score: input.self_amplification_score || 0,
          profile_id: input.profile_id,
          perpetual_cycle_config: input.perpetual_cycle_config || {},
          fractal_influence_map: input.fractal_influence_map || {},
          infinite_loop_status: input.infinite_loop_status || {},
          meta_recursion_layers: input.meta_recursion_layers || [],
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infinite-recursion'] });
    },
  });

  const amplifyRecursion = useMutation({
    mutationFn: async ({ id, depth }: { id: string; depth: number }) => {
      const { data, error } = await supabase
        .from('infinite_recursion')
        .update({ recursion_depth: depth, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['infinite-recursion'] });
    },
  });

  return {
    recursions,
    isLoading,
    createRecursion,
    amplifyRecursion,
  };
}
