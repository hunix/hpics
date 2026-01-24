// Sacred Values Hook - Identify non-negotiable beliefs for influence operations

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { 
  identifySacredValues,
  generateManipulationVectors,
  calculateMoralFoundations,
  MORAL_FOUNDATIONS,
} from '@/lib/warfare/sacredValuesMapper';

export function useSacredValues(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch sacred values for a profile
  const valuesQuery = useQuery({
    queryKey: ['sacred-values', profileId],
    queryFn: async () => {
      if (!user?.id || !profileId) return [];
      
      const { data, error } = await supabase
        .from('sacred_values')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .order('protection_level', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!profileId,
  });

  // Fetch all sacred values mappings
  const allValuesQuery = useQuery({
    queryKey: ['sacred-values-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('sacred_values')
        .select(`
          *,
        profiles:profile_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('protection_level', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Run sacred values analysis
  const analyzeMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('sacred-values-mapper', {
        body: {
          profileId: targetProfileId,
          analysisDepth: 'comprehensive',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacred-values'] });
      queryClient.invalidateQueries({ queryKey: ['sacred-values-all'] });
      toast.success('Sacred values analysis complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Add a sacred value observation
  const addObservationMutation = useMutation({
    mutationFn: async (params: {
      profileId: string;
      domain: string;
      protectionLevel: number;
      violationTriggers?: string[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const insertData = {
        user_id: user.id,
        profile_id: params.profileId,
        value_domain: params.domain,
        protection_level: params.protectionLevel,
        tribal_associations: [],
        violation_triggers: params.violationTriggers || [],
        emotional_intensity: params.protectionLevel,
        identity_centrality: params.protectionLevel * 0.8,
      };
      
      const { data, error } = await supabase
        .from('sacred_values')
        .insert(insertData as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sacred-values'] });
      toast.success('Sacred value recorded');
    },
    onError: (error) => {
      toast.error(`Failed to record: ${error.message}`);
    },
  });

  // Group values by domain
  const valuesByDomain = (valuesQuery.data || []).reduce((acc, value) => {
    const domain = value.value_domain || 'other';
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(value);
    return acc;
  }, {} as Record<string, typeof valuesQuery.data>);

  // Get highest protection values
  const criticalValues = (valuesQuery.data || [])
    .filter(v => (v.protection_level || 0) > 0.8);

  return {
    values: valuesQuery.data || [],
    allValues: allValuesQuery.data || [],
    valuesByDomain,
    criticalValues,
    isLoading: valuesQuery.isLoading || allValuesQuery.isLoading,
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
    addObservation: addObservationMutation.mutate,
    moralFoundations: MORAL_FOUNDATIONS,
    identifySacredValues,
    generateManipulationVectors,
    calculateMoralFoundations,
  };
}
