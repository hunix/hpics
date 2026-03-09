import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/types/database-helpers';

export interface RealityComprehension {
  id: string;
  userId: string;
  profileId?: string;
  comprehensionScope: string;
  realityLayers: number;
  comprehensionIndex: number;
  frameworkModel: Record<string, unknown>;
  paradoxResolution: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export function useRealityComprehension(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: comprehensions, isLoading } = useQuery({
    queryKey: ['reality-comprehension', profileId],
    queryFn: async () => {
      let query = supabase
        .from('reality_comprehension')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) query = query.eq('profile_id', profileId);

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row): RealityComprehension => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id ?? undefined,
        comprehensionScope: row.comprehension_scope ?? '',
        realityLayers: row.reality_layers ?? 1,
        comprehensionIndex: Number(row.comprehension_index) || 0,
        frameworkModel: (row.framework_model as Record<string, unknown>) ?? {},
        paradoxResolution: (row.paradox_resolution as Record<string, unknown>) ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    enabled: !!user,
  });

  const expandComprehension = useMutation({
    mutationFn: async (input: { comprehensionScope: string; realityLayers?: number }) => {
      const { data, error } = await supabase
        .from('reality_comprehension')
        .insert({
          user_id: user!.id,
          comprehension_scope: input.comprehensionScope,
          reality_layers: input.realityLayers || 1,
          profile_id: profileId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reality-comprehension'] }),
  });

  const resolveParadox = useMutation({
    mutationFn: async ({ id, paradox }: { id: string; paradox: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from('reality_comprehension')
        .update({ paradox_resolution: paradox as unknown as Json, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reality-comprehension'] }),
  });

  return { comprehensions, isLoading, expandComprehension, resolveParadox };
}
