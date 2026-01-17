import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SynchronisticEvent {
  id: string;
  userId: string;
  profileId?: string;
  eventType: string;
  meaningfulnessScore: number;
  connectedElements: string[];
  temporalProximity: string;
  causalityAnalysis: Record<string, unknown>;
  exploitationPotential: number;
  createdAt: string;
}

export interface CoincidenceCluster {
  id: string;
  userId: string;
  clusterType: string;
  clusterSize: number;
  significanceScore: number;
  memberEvents: string[];
  emergentPattern: Record<string, unknown>;
  interventionRecommendations: string[];
  createdAt: string;
}

export function useSynchronicity(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['synchronistic-events', profileId],
    queryFn: async () => {
      let query = supabase
        .from('synchronistic_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        eventType: row.event_type,
        meaningfulnessScore: row.meaningfulness_score || 0,
        connectedElements: row.connected_elements || [],
        temporalProximity: row.temporal_proximity || '',
        causalityAnalysis: row.causality_analysis as Record<string, unknown> || {},
        exploitationPotential: row.exploitation_potential || 0,
        createdAt: row.created_at
      })) as SynchronisticEvent[];
    },
    enabled: !!user,
  });

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['coincidence-clusters', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coincidence_clusters')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        clusterType: row.cluster_type,
        clusterSize: row.cluster_size || 0,
        significanceScore: row.significance_score || 0,
        memberEvents: row.member_events || [],
        emergentPattern: row.emergent_pattern as Record<string, unknown> || {},
        interventionRecommendations: row.intervention_recommendations || [],
        createdAt: row.created_at
      })) as CoincidenceCluster[];
    },
    enabled: !!user,
  });

  const analyzeSynchronicity = useMutation({
    mutationFn: async (input: { profileId: string; timeWindowDays?: number }) => {
      const { data, error } = await supabase.functions.invoke('synchronicity-engine', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          timeWindowDays: input.timeWindowDays || 30
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['synchronistic-events'] });
      queryClient.invalidateQueries({ queryKey: ['coincidence-clusters'] });
    }
  });

  return {
    events,
    clusters,
    isLoading: eventsLoading || clustersLoading,
    analyzeSynchronicity: analyzeSynchronicity.mutateAsync,
    isAnalyzing: analyzeSynchronicity.isPending,
    highMeaningfulnessEvents: events?.filter(e => e.meaningfulnessScore > 0.7) || []
  };
}
