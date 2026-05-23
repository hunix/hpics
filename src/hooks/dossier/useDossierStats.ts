/**
 * Dossier Stats Hook
 * Fetches intelligence statistics for the Dossier Intelligence page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DossierStats {
  totalDossiers: number;
  activeProfiles: number;
  totalAnalyses: number;
  warfareSimulations: number;
}

export function useDossierStats() {
  return useQuery({
    queryKey: ['dossier-stats'],
    queryFn: async (): Promise<DossierStats | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [dossierCount, profileCount, analysisCount, warfareCount] = await Promise.all([
        supabase.from('dossiers').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('ai_analyses').select('id', { count: 'exact', head: true }),
        supabase.from('cognitive_warfare_operations').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalDossiers: dossierCount.count || 0,
        activeProfiles: profileCount.count || 0,
        totalAnalyses: analysisCount.count || 0,
        warfareSimulations: warfareCount.count || 0,
      };
    },
    staleTime: 60000,
  });
}

export function useDossierList() {
  return useQuery({
    queryKey: ['all-dossiers-page'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('dossiers')
        .select('*, profiles(id, first_name, last_name, organization, job_title)')
        .order('generated_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });
}
