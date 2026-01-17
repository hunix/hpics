import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MetaDimensionalSynthesis {
  id: string;
  userId: string;
  profileId?: string;
  synthesisType: string;
  dimensionalLayers: number;
  synthesisCoherence: number;
  crossDimensionalMap: Record<string, unknown>;
  synthesisOutcomes: Record<string, unknown>;
  temporalBinding: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useMetaDimensionalSynthesis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: synthesis, isLoading } = useQuery({
    queryKey: ['meta-dimensional-synthesis', profileId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('meta_dimensional_synthesis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileId) query = query.eq('profile_id', profileId);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: any): MetaDimensionalSynthesis => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        synthesisType: row.synthesis_type,
        dimensionalLayers: row.dimensional_layers || 1,
        synthesisCoherence: Number(row.synthesis_coherence) || 0,
        crossDimensionalMap: row.cross_dimensional_map || {},
        synthesisOutcomes: row.synthesis_outcomes || {},
        temporalBinding: row.temporal_binding || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const createSynthesis = useMutation({
    mutationFn: async (input: { synthesisType: string; dimensionalLayers?: number }) => {
      const { data, error } = await (supabase as any)
        .from('meta_dimensional_synthesis')
        .insert({
          user_id: user!.id,
          synthesis_type: input.synthesisType,
          dimensional_layers: input.dimensionalLayers || 1,
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meta-dimensional-synthesis'] }),
  });

  const updateCoherence = useMutation({
    mutationFn: async ({ id, coherence }: { id: string; coherence: number }) => {
      const { data, error } = await (supabase as any)
        .from('meta_dimensional_synthesis')
        .update({ synthesis_coherence: coherence, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meta-dimensional-synthesis'] }),
  });

  return { synthesis, isLoading, createSynthesis, updateCoherence };
}
