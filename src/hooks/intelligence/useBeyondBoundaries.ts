import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
export interface BeyondBoundaries {
  id: string;
  user_id: string;
  profile_id?: string;
  boundary_type: string;
  transcendence_level: number;
  limitation_dissolution: Record<string, unknown>;
  infinite_expansion_vectors: unknown[];
  unbounded_influence_scope: Record<string, unknown>;
  reality_barrier_penetration: number;
  created_at: string;
  updated_at: string;
}

export function useBeyondBoundaries(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: boundaries, isLoading } = useQuery({
    queryKey: ['beyond-boundaries', profileId],
    queryFn: async () => {
      let query = supabase
        .from('beyond_boundaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BeyondBoundaries[];
    },
    enabled: !!user,
  });

  const transcendBoundary = useMutation({
    mutationFn: async (input: Partial<BeyondBoundaries>) => {
      const { data, error } = await supabase
        .from('beyond_boundaries')
        .insert({
          user_id: user!.id,
          boundary_type: input.boundary_type || 'dimensional',
          transcendence_level: input.transcendence_level || 0,
          profile_id: input.profile_id,
          limitation_dissolution: input.limitation_dissolution || {},
          infinite_expansion_vectors: input.infinite_expansion_vectors || [],
          unbounded_influence_scope: input.unbounded_influence_scope || {},
          reality_barrier_penetration: input.reality_barrier_penetration || 0,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beyond-boundaries'] });
    },
  });

  const expandBoundary = useMutation({
    mutationFn: async ({ id, level }: { id: string; level: number }) => {
      const { data, error } = await supabase
        .from('beyond_boundaries')
        .update({ transcendence_level: level, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beyond-boundaries'] });
    },
  });

  return {
    boundaries,
    isLoading,
    transcendBoundary,
    expandBoundary,
  };
}
