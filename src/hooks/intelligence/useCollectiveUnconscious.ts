import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ArchetypalActivation {
  id: string;
  userId: string;
  profileId?: string;
  archetypeType: string;
  activationStrength: number;
  manifestationPatterns: Record<string, unknown>[];
  shadowAspects: string[];
  integrationLevel: number;
  createdAt: string;
}

export interface ShadowProjection {
  id: string;
  userId: string;
  sourceProfileId?: string;
  targetProfileId?: string;
  projectionType: string;
  projectionIntensity: number;
  projectedContent: Record<string, unknown>;
  integrationOpportunities: string[];
  createdAt: string;
}

export function useCollectiveUnconscious(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: archetypes, isLoading: archetypesLoading } = useQuery({
    queryKey: ['archetypal-activations', profileId],
    queryFn: async () => {
      let query = supabase
        .from('archetypal_activations')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        profileId: row.profile_id as string,
        archetypeType: (row.archetype_type || row.archetype || '') as string,
        activationStrength: (row.activation_strength || 0) as number,
        manifestationPatterns: (row.manifestation_patterns || []) as Record<string, unknown>[],
        shadowAspects: (row.shadow_aspects || []) as string[],
        integrationLevel: (row.integration_level || row.shadow_integration || 0) as number,
        createdAt: row.created_at as string
      })) as ArchetypalActivation[];
    },
    enabled: !!user,
  });

  const { data: shadowProjections, isLoading: shadowLoading } = useQuery({
    queryKey: ['shadow-projections', profileId],
    queryFn: async () => {
      let query = supabase
        .from('shadow_projections')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.or(`source_profile_id.eq.${profileId},target_profile_id.eq.${profileId}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        sourceProfileId: row.source_profile_id as string,
        targetProfileId: row.target_profile_id as string,
        projectionType: (row.projection_type || row.projected_trait || '') as string,
        projectionIntensity: (row.projection_intensity || 0) as number,
        projectedContent: (row.projected_content || {}) as Record<string, unknown>,
        integrationOpportunities: (row.integration_opportunities || []) as string[],
        createdAt: row.created_at as string
      })) as ShadowProjection[];
    },
    enabled: !!user,
  });

  const mineUnconscious = useMutation({
    mutationFn: async (input: { profileId: string; miningDepth?: 'surface' | 'deep' | 'abyssal' }) => {
      const { data, error } = await supabase.functions.invoke('collective-unconscious-miner', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          miningDepth: input.miningDepth || 'deep'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['archetypal-activations'] });
      queryClient.invalidateQueries({ queryKey: ['shadow-projections'] });
    }
  });

  return {
    archetypes,
    shadowProjections,
    isLoading: archetypesLoading || shadowLoading,
    mineUnconscious: mineUnconscious.mutateAsync,
    isMining: mineUnconscious.isPending,
    dominantArchetype: archetypes?.reduce((max, a) => a.activationStrength > (max?.activationStrength || 0) ? a : max, null as ArchetypalActivation | null)
  };
}
