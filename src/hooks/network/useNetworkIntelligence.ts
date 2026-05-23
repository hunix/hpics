import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NetworkHealthStats {
  totalContacts: number;
  favorites: number;
  healthDistribution: { healthy: number; atRisk: number; declining: number; critical: number };
  pendingActions: number;
  unresolvedAnomalies: number;
  averageScore: number;
  scoredContacts: number;
}

export function useNetworkHealthStats() {
  const { user } = useAuth();
  return useQuery<NetworkHealthStats>({
    queryKey: ['network-health-stats', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [profilesRes, scoresRes, actionsRes, anomaliesRes] = await Promise.all([
        supabase.from('profiles').select('id, is_favorite, relationship_type', { count: 'exact' }).eq('is_active', true),
        supabase.from('relationship_scores').select('overall_score, sentiment_score'),
        supabase.from('influence_actions').select('id, status').eq('status', 'pending'),
        supabase.from('behavioral_anomalies').select('id, severity').eq('is_resolved', false),
      ]);

      const profiles = profilesRes.data ?? [];
      const scores = scoresRes.data ?? [];

      const healthy = scores.filter((s) => (s.overall_score || 0) >= 70).length;
      const atRisk = scores.filter((s) => (s.overall_score || 0) >= 40 && (s.overall_score || 0) < 70).length;
      const declining = scores.filter((s) => (s.overall_score || 0) >= 20 && (s.overall_score || 0) < 40).length;
      const critical = scores.filter((s) => (s.overall_score || 0) < 20).length;
      const total = profiles.length;

      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((acc, s) => acc + (s.overall_score || 0), 0) / scores.length)
        : 0;

      return {
        totalContacts: total,
        favorites: profiles.filter((p) => p.is_favorite).length,
        healthDistribution: { healthy, atRisk, declining, critical },
        pendingActions: actionsRes.data?.length ?? 0,
        unresolvedAnomalies: anomaliesRes.data?.length ?? 0,
        averageScore: avgScore,
        scoredContacts: scores.length,
      };
    },
  });
}

export function useTopInfluencers(limit = 5) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['top-influencers', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_influence_profiles')
        .select(`
          profile_id,
          influence_score,
          profiles (first_name, last_name, avatar_url, relationship_type)
        `)
        .order('influence_score', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRelationshipTypeDistribution() {
  const { user } = useAuth();
  return useQuery<Record<string, number>>({
    queryKey: ['relationship-type-distribution', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('relationship_type');
      if (error) throw error;
      const distribution: Record<string, number> = {};
      (data ?? []).forEach((p) => {
        const type = p.relationship_type || 'other';
        distribution[type] = (distribution[type] || 0) + 1;
      });
      return distribution;
    },
  });
}
