import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IntelligenceIndicators {
  hasMediaAnalysis: boolean;
  hasVoiceInsights: boolean;
  hasDocuments: boolean;
  hasDossier: boolean;
  mediaCount: number;
  voiceCount: number;
  documentCount: number;
}

/**
 * Hook to fetch intelligence indicators for a contact profile.
 * Efficiently checks for presence of various intelligence sources.
 */
export function useContactIntelligenceIndicators(profileId: string | undefined) {
  return useQuery({
    queryKey: ['contact-intelligence-indicators', profileId],
    queryFn: async (): Promise<IntelligenceIndicators> => {
      if (!profileId) {
        return {
          hasMediaAnalysis: false,
          hasVoiceInsights: false,
          hasDocuments: false,
          hasDossier: false,
          mediaCount: 0,
          voiceCount: 0,
          documentCount: 0,
        };
      }

      // Fetch all counts in parallel
      const [mediaRes, voiceRes, documentRes, dossierRes] = await Promise.all([
        // Media analyses count
        supabase
          .from('ai_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .in('analysis_type', ['comprehensive', 'facial', 'behavioral', 'environmental']),
        
        // Voice insights count
        supabase
          .from('voice_insights')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId),
        
        // Document analyses count
        supabase
          .from('ai_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .eq('analysis_type', 'document'),
        
        // Dossier check
        supabase
          .from('ai_analyses')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', profileId)
          .eq('analysis_type', 'intelligence_dossier'),
      ]);

      const mediaCount = mediaRes.count || 0;
      const voiceCount = voiceRes.count || 0;
      const documentCount = documentRes.count || 0;
      const dossierCount = dossierRes.count || 0;

      return {
        hasMediaAnalysis: mediaCount > 0,
        hasVoiceInsights: voiceCount > 0,
        hasDocuments: documentCount > 0,
        hasDossier: dossierCount > 0,
        mediaCount,
        voiceCount,
        documentCount,
      };
    },
    enabled: !!profileId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Batch fetch intelligence indicators for multiple profiles.
 * More efficient when displaying many contacts at once.
 */
export function useMultipleContactIntelligenceIndicators(profileIds: string[]) {
  return useQuery({
    queryKey: ['batch-intelligence-indicators', profileIds.join(',')],
    queryFn: async (): Promise<Record<string, IntelligenceIndicators>> => {
      if (profileIds.length === 0) {
        return {};
      }

      // Fetch all data in parallel
      const [mediaRes, voiceRes, dossierRes] = await Promise.all([
        supabase
          .from('ai_analyses')
          .select('profile_id')
          .in('profile_id', profileIds)
          .in('analysis_type', ['comprehensive', 'facial', 'behavioral', 'environmental']),
        
        supabase
          .from('voice_insights')
          .select('profile_id')
          .in('profile_id', profileIds),
        
        supabase
          .from('ai_analyses')
          .select('profile_id')
          .in('profile_id', profileIds)
          .eq('analysis_type', 'intelligence_dossier'),
      ]);

      // Build a map of indicators per profile
      const result: Record<string, IntelligenceIndicators> = {};
      
      // Initialize all profiles
      for (const id of profileIds) {
        result[id] = {
          hasMediaAnalysis: false,
          hasVoiceInsights: false,
          hasDocuments: false,
          hasDossier: false,
          mediaCount: 0,
          voiceCount: 0,
          documentCount: 0,
        };
      }

      // Count media analyses
      const mediaCounts: Record<string, number> = {};
      for (const row of mediaRes.data || []) {
        if (row.profile_id) {
          mediaCounts[row.profile_id] = (mediaCounts[row.profile_id] || 0) + 1;
        }
      }
      for (const [id, count] of Object.entries(mediaCounts)) {
        if (result[id]) {
          result[id].hasMediaAnalysis = count > 0;
          result[id].mediaCount = count;
        }
      }

      // Count voice insights
      const voiceCounts: Record<string, number> = {};
      for (const row of voiceRes.data || []) {
        if (row.profile_id) {
          voiceCounts[row.profile_id] = (voiceCounts[row.profile_id] || 0) + 1;
        }
      }
      for (const [id, count] of Object.entries(voiceCounts)) {
        if (result[id]) {
          result[id].hasVoiceInsights = count > 0;
          result[id].voiceCount = count;
        }
      }

      // Mark dossiers
      for (const row of dossierRes.data || []) {
        if (row.profile_id && result[row.profile_id]) {
          result[row.profile_id].hasDossier = true;
        }
      }

      return result;
    },
    enabled: profileIds.length > 0,
    staleTime: 30000,
  });
}
