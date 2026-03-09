import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UniversalAwareness {
  id: string;
  userId: string;
  profileId?: string;
  awarenessType: string;
  dimensionalScope: Record<string, unknown>;
  perceptionDepth: number;
  omniscientIndex: number;
  awarenessMatrix: Record<string, unknown>;
  consciousnessLinks: unknown[];
  createdAt: string;
  updatedAt: string;
}

export function useUniversalAwareness(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: awareness, isLoading } = useQuery({
    queryKey: ['universal-awareness', profileId],
    queryFn: async () => {
      let query = supabase
        .from('universal_awareness')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileId) query = query.eq('profile_id', profileId);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: any): UniversalAwareness => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        awarenessType: row.awareness_type,
        dimensionalScope: row.dimensional_scope || {},
        perceptionDepth: row.perception_depth || 1,
        omniscientIndex: Number(row.omniscient_index) || 0,
        awarenessMatrix: row.awareness_matrix || {},
        consciousnessLinks: row.consciousness_links || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const expandAwareness = useMutation({
    mutationFn: async (input: { awarenessType: string; dimensionalScope?: Record<string, unknown>; perceptionDepth?: number }) => {
      const { data, error } = await supabase
        .from('universal_awareness')
        .insert({
          user_id: user!.id,
          awareness_type: input.awarenessType,
          dimensional_scope: input.dimensionalScope || {},
          perception_depth: input.perceptionDepth || 1,
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universal-awareness'] }),
  });

  const updateOmniscience = useMutation({
    mutationFn: async ({ id, omniscientIndex }: { id: string; omniscientIndex: number }) => {
      const { data, error } = await (supabase as any)
        .from('universal_awareness')
        .update({ omniscient_index: omniscientIndex, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['universal-awareness'] }),
  });

  return { awareness, isLoading, expandAwareness, updateOmniscience };
}
