import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface SynchronisticEvent { id: string; userId: string; profileId?: string; eventType: string; meaningfulnessScore: number; connectedElements: string[]; temporalProximity: string; causalityAnalysis: Record<string, unknown>; exploitationPotential: number; createdAt: string; }
export interface CoincidenceCluster { id: string; userId: string; clusterType: string; clusterSize: number; significanceScore: number; memberEvents: string[]; emergentPattern: Record<string, unknown>; interventionRecommendations: string[]; createdAt: string; }

export function useSynchronicity(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['synchronistic-events', profileId],
    queryFn: async () => {
      let query = supabase.from('synchronistic_events').select('*').order('created_at', { ascending: false });
      if (profileId) { query = query.eq('profile_id', profileId); }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string, userId: row.user_id as string, profileId: row.profile_id as string,
        eventType: (row.event_description || '') as string, meaningfulnessScore: (row.meaning_score || 0) as number,
        connectedElements: (row.related_events || []) as string[], temporalProximity: '' as string,
        causalityAnalysis: { acausalCorrelation: row.acausal_correlation } as Record<string, unknown>,
        exploitationPotential: (row.exploitation_potential || 0) as number, createdAt: row.created_at as string
      })) as SynchronisticEvent[];
    },
    enabled: !!user,
  });

  const { data: clusters, isLoading: clustersLoading } = useQuery({
    queryKey: ['coincidence-clusters', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('coincidence_clusters').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string, userId: row.user_id as string, clusterType: (row.cluster_theme || '') as string,
        clusterSize: 0 as number, significanceScore: (row.total_meaning_score || row.pattern_recognition_score || 0) as number,
        memberEvents: [] as string[], emergentPattern: {} as Record<string, unknown>, interventionRecommendations: [] as string[],
        createdAt: row.created_at as string
      })) as CoincidenceCluster[];
    },
    enabled: !!user,
  });

  const analyzeSynchronicity = useMutation({
    mutationFn: async (input: { profileId: string; timeWindowDays?: number }) => {
      const { data, error } = await invokeFunction('synchronicity-engine', { userId: user!.id, profileId: input.profileId, timeWindowDays: input.timeWindowDays || 30 });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['synchronistic-events'] }); queryClient.invalidateQueries({ queryKey: ['coincidence-clusters'] }); }
  });

  return { events, clusters, isLoading: eventsLoading || clustersLoading, analyzeSynchronicity: analyzeSynchronicity.mutateAsync, isAnalyzing: analyzeSynchronicity.isPending, highMeaningfulnessEvents: events?.filter(e => e.meaningfulnessScore > 0.7) || [] };
}
