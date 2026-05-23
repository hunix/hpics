import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RecentAnalysis {
  id: string;
  analysis_type: string;
  generated_at: string;
  profiles: { first_name: string | null; last_name: string | null } | null;
}

export interface InsightsContact {
  id: string;
  first_name: string;
  last_name: string | null;
  relationship_type: string | null;
}

export interface MatrixProfile {
  id: string;
  first_name: string;
  last_name: string | null;
}

export function useRecentAIAnalyses(limit = 10) {
  const { user } = useAuth();
  return useQuery<RecentAnalysis[]>({
    queryKey: ['recent-analyses', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*, profiles(first_name, last_name)')
        .order('generated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as RecentAnalysis[];
    },
  });
}

export function useInsightsContacts(limit = 6) {
  const { user } = useAuth();
  return useQuery<InsightsContact[]>({
    queryKey: ['contacts-for-insights', user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, relationship_type')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as InsightsContact[];
    },
  });
}

export function useActiveProfilesForMatrix() {
  const { user } = useAuth();
  return useQuery<MatrixProfile[]>({
    queryKey: ['profiles-for-matrix', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return (data ?? []) as MatrixProfile[];
    },
  });
}
