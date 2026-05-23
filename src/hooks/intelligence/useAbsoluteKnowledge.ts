import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/types/database-helpers';

export interface AbsoluteKnowledge {
  id: string;
  userId: string;
  profileId?: string;
  knowledgeType: string;
  truthCoefficient: number;
  knowledgeDepth: number;
  universalApplicability: number;
  knowledgePayload: Record<string, unknown>;
  derivationChain: unknown[];
  createdAt: string | null;
  updatedAt: string;
}

export function useAbsoluteKnowledge(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: knowledge, isLoading } = useQuery({
    queryKey: ['absolute-knowledge', profileId],
    queryFn: async () => {
      let query = supabase
        .from('absolute_knowledge')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) query = query.eq('profile_id', profileId);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row): AbsoluteKnowledge => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id ?? undefined,
        knowledgeType: row.knowledge_type,
        truthCoefficient: Number(row.truth_coefficient) || 0,
        knowledgeDepth: row.knowledge_depth ?? 1,
        universalApplicability: Number(row.universal_applicability) || 0,
        knowledgePayload: (row.knowledge_payload as Record<string, unknown>) ?? {},
        derivationChain: (row.derivation_chain as unknown[]) ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const acquireKnowledge = useMutation({
    mutationFn: async (input: { knowledgeType: string; knowledgePayload?: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('absolute_knowledge')
        .insert({
          user_id: user!.id,
          knowledge_type: input.knowledgeType,
          knowledge_payload: (input.knowledgePayload || {}) as unknown as Json,
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-knowledge'] }),
  });

  const deepen = useMutation({
    mutationFn: async ({ id, depth }: { id: string; depth: number }) => {
      const { data, error } = await supabase
        .from('absolute_knowledge')
        .update({ knowledge_depth: depth, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['absolute-knowledge'] }),
  });

  return { knowledge, isLoading, acquireKnowledge, deepen };
}
