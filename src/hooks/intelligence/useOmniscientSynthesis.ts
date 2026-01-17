import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OmniscientSynthesis {
  id: string;
  userId: string;
  profileId?: string;
  synthesisPattern: string;
  knowledgeDomains: unknown[];
  synthesisPower: number;
  universalIntegration: Record<string, unknown>;
  omniscienceMetrics: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useOmniscientSynthesis(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: patterns, isLoading } = useQuery({
    queryKey: ['omniscient-synthesis', profileId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('omniscient_synthesis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileId) query = query.eq('profile_id', profileId);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return (data || []).map((row: any): OmniscientSynthesis => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        synthesisPattern: row.synthesis_pattern,
        knowledgeDomains: row.knowledge_domains || [],
        synthesisPower: Number(row.synthesis_power) || 0,
        universalIntegration: row.universal_integration || {},
        omniscienceMetrics: row.omniscience_metrics || {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const createPattern = useMutation({
    mutationFn: async (input: { synthesisPattern: string; knowledgeDomains?: unknown[] }) => {
      const { data, error } = await (supabase as any)
        .from('omniscient_synthesis')
        .insert({
          user_id: user!.id,
          synthesis_pattern: input.synthesisPattern,
          knowledge_domains: input.knowledgeDomains || [],
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omniscient-synthesis'] }),
  });

  const amplifyPower = useMutation({
    mutationFn: async ({ id, power }: { id: string; power: number }) => {
      const { data, error } = await (supabase as any)
        .from('omniscient_synthesis')
        .update({ synthesis_power: power, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omniscient-synthesis'] }),
  });

  return { patterns, isLoading, createPattern, amplifyPower };
}
