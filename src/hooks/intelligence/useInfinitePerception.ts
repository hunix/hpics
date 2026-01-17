import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InfinitePerception {
  id: string;
  userId: string;
  profileId?: string;
  perceptionMode: string;
  sensoryDimensions: number;
  perceptionIntensity: number;
  extrasensoryMap: Record<string, unknown>;
  perceptionHistory: unknown[];
  createdAt: string;
  updatedAt: string;
}

export function useInfinitePerception(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: perceptions, isLoading } = useQuery({
    queryKey: ['infinite-perception', profileId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('infinite_perception')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileId) query = query.eq('profile_id', profileId);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: any): InfinitePerception => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        perceptionMode: row.perception_mode,
        sensoryDimensions: row.sensory_dimensions || 3,
        perceptionIntensity: Number(row.perception_intensity) || 0,
        extrasensoryMap: row.extrasensory_map || {},
        perceptionHistory: row.perception_history || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const expandPerception = useMutation({
    mutationFn: async (input: { perceptionMode: string; sensoryDimensions?: number }) => {
      const { data, error } = await (supabase as any)
        .from('infinite_perception')
        .insert({
          user_id: user!.id,
          perception_mode: input.perceptionMode,
          sensory_dimensions: input.sensoryDimensions || 3,
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infinite-perception'] }),
  });

  const intensify = useMutation({
    mutationFn: async ({ id, intensity }: { id: string; intensity: number }) => {
      const { data, error } = await (supabase as any)
        .from('infinite_perception')
        .update({ perception_intensity: intensity, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infinite-perception'] }),
  });

  return { perceptions, isLoading, expandPerception, intensify };
}
