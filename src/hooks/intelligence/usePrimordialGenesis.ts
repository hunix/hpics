/**
 * usePrimordialGenesis Hook - v3.9.14
 * Aligned with actual database schema
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PrimordialOrigin {
  id: string;
  user_id: string;
  profile_id: string | null;
  origin_type: string;
  genesis_power_level: number;
  origin_narrative: string | null;
  foundational_patterns: unknown[];
  created_at: string;
  updated_at: string;
}

interface GenesisSynthesis {
  id: string;
  user_id: string;
  profile_id: string | null;
  synthesis_mode: string;
  synthesis_intensity: number | null;
  element_fusion: unknown;
  synthesis_output: unknown;
  created_at: string;
  updated_at: string;
}

export function usePrimordialGenesis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: origins, isLoading: originsLoading } = useQuery({
    queryKey: ['primordial-origins', profileId],
    queryFn: async () => {
      let query = supabase.from('primordial_origins').select('*').order('created_at', { ascending: false });
      if (profileId) query = query.eq('profile_id', profileId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as PrimordialOrigin[];
    },
    enabled: !!user,
  });

  const { data: synthesis, isLoading: synthesisLoading } = useQuery({
    queryKey: ['genesis-synthesis'],
    queryFn: async () => {
      const { data, error } = await supabase.from('genesis_synthesis').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as GenesisSynthesis[];
    },
    enabled: !!user,
  });

  const createOrigin = useMutation({
    mutationFn: async (input: { origin_type: string; genesis_power_level?: number }) => {
      const { data, error } = await supabase.from('primordial_origins').insert({
        user_id: user!.id,
        origin_type: input.origin_type,
        genesis_power_level: input.genesis_power_level || 1,
        profile_id: profileId,
      }).select().single();
      if (error) throw error;
      return data as unknown as PrimordialOrigin;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['primordial-origins'] }),
  });

  const createSynthesis = useMutation({
    mutationFn: async (input: { synthesis_mode: string; synthesis_intensity?: number }) => {
      const { data, error } = await supabase.from('genesis_synthesis').insert({
        user_id: user!.id,
        synthesis_mode: input.synthesis_mode,
        synthesis_intensity: input.synthesis_intensity || 0,
      }).select().single();
      if (error) throw error;
      return data as unknown as GenesisSynthesis;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['genesis-synthesis'] }),
  });

  return { origins, synthesis, isLoading: originsLoading || synthesisLoading, createOrigin, createSynthesis };
}
