import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getAnalysisTypeByKey } from '@/lib/analysisTypes';

export function useAIModelPreference(analysisType: string) {
  const { user } = useAuth();
  
  const { data: preference } = useQuery({
    queryKey: ['ai-model-preference', user?.id, analysisType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_model_preferences')
        .select('model_key')
        .eq('user_id', user!.id)
        .eq('analysis_type', analysisType)
        .maybeSingle();
      
      if (error) throw error;
      return data?.model_key || null;
    },
    enabled: !!user && !!analysisType,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get the preferred model or fall back to default
  const analysisConfig = getAnalysisTypeByKey(analysisType);
  const defaultModel = analysisConfig?.defaultModel || 'google/gemini-3-flash-preview';
  
  return preference || defaultModel;
}

export function useAllAIModelPreferences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['ai-model-preferences', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_model_preferences')
        .select('analysis_type, model_key')
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      // Convert to a map
      const prefsMap: Record<string, string> = {};
      data?.forEach(pref => {
        prefsMap[pref.analysis_type] = pref.model_key;
      });
      return prefsMap;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
