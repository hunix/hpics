import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InferenceProfile {
  id: string | null;
  first_name: string;
  last_name: string | null;
  organization: string | null;
  avatar_url: string | null;
}

export interface RelationshipInference {
  id: string;
  source_profile_id: string;
  target_profile_id: string;
  inference_type: string;
  path_distance: number;
  confidence_score: number;
  opportunity_score: number;
  opportunity_type: string;
  evidence: Record<string, unknown>;
  created_at: string;
  source_profile: InferenceProfile | null;
  target_profile: InferenceProfile | null;
}

export function useRelationshipInferences(limit = 50) {
  const { user } = useAuth();
  return useQuery<RelationshipInference[]>({
    queryKey: ['relationship-inferences', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_inferences')
        .select(`
          *,
          source_profile:profiles!relationship_inferences_source_profile_id_fkey(id, first_name, last_name, organization, avatar_url),
          target_profile:profiles!relationship_inferences_target_profile_id_fkey(id, first_name, last_name, organization, avatar_url)
        `)
        .order('opportunity_score', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as RelationshipInference[];
    },
  });
}
