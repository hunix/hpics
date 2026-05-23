import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RelationshipScore {
  id: string;
  profile_id: string;
  overall_score: number;
  frequency_score: number;
  recency_score: number;
  diversity_score: number;
  sentiment_score: number;
  decay_rate: number;
  profiles: {
    first_name: string;
    last_name: string | null;
    is_favorite: boolean;
  };
}

export function useRelationshipScores(limit = 10) {
  const { user } = useAuth();
  return useQuery<RelationshipScore[]>({
    queryKey: ['relationship-scores', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_scores')
        .select(`
          *,
          profiles (first_name, last_name, is_favorite)
        `)
        .order('overall_score', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown) as RelationshipScore[];
    },
  });
}
