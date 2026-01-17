import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CognitiveSuperposition {
  id: string;
  userId: string;
  profileId?: string;
  superpositionStates: Record<string, unknown>[];
  collapseProbability: number;
  interferencePatterns: Record<string, unknown>;
  entanglementPartners: string[];
  quantumSignature: string;
  analysisType: string;
  createdAt: string;
}

export function useQuantumCognition(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: superpositions, isLoading } = useQuery({
    queryKey: ['cognitive-superpositions', profileId],
    queryFn: async () => {
      let query = supabase
        .from('cognitive_superpositions')
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
        superpositionStates: row.superposition_states as Record<string, unknown>[] || [],
        collapseProbability: row.collapse_probability || 0,
        interferencePatterns: row.interference_patterns as Record<string, unknown> || {},
        entanglementPartners: row.entanglement_partners || [],
        quantumSignature: row.quantum_signature || '',
        analysisType: row.analysis_type || 'superposition',
        createdAt: row.created_at
      })) as CognitiveSuperposition[];
    },
    enabled: !!user,
  });

  const analyzeQuantumState = useMutation({
    mutationFn: async (input: { profileId: string; analysisType: 'superposition' | 'entanglement' | 'interference' | 'collapse_prediction' }) => {
      const { data, error } = await supabase.functions.invoke('quantum-cognition-engine', {
        body: {
          userId: user!.id,
          profileId: input.profileId,
          analysisType: input.analysisType
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cognitive-superpositions'] });
    }
  });

  return {
    superpositions,
    isLoading,
    analyzeQuantumState: analyzeQuantumState.mutateAsync,
    isAnalyzing: analyzeQuantumState.isPending
  };
}
