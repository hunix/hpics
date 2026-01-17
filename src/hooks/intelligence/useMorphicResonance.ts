import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MorphicField {
  id: string;
  userId: string;
  fieldType: string;
  fieldStrength: number;
  resonancePatterns: Record<string, unknown>[];
  influencedBehaviors: string[];
  fieldRadius: number;
  harmonicFrequency: string;
  createdAt: string;
}

export function useMorphicResonance() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: morphicFields, isLoading } = useQuery({
    queryKey: ['morphic-fields', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('morphic_fields')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        userId: row.user_id as string,
        fieldType: (row.field_type || '') as string,
        fieldStrength: (row.resonance_strength || row.stability_index || 0) as number,
        resonancePatterns: (row.memory_patterns || []) as Record<string, unknown>[],
        influencedBehaviors: (row.carrier_profiles || []) as string[],
        fieldRadius: 0 as number,
        harmonicFrequency: (row.field_signature || '') as string,
        createdAt: row.created_at as string
      })) as MorphicField[];
    },
    enabled: !!user,
  });

  const detectResonance = useMutation({
    mutationFn: async (input: { analysisScope?: 'network' | 'individual' | 'collective' }) => {
      const { data, error } = await supabase.functions.invoke('morphic-resonance-detector', {
        body: {
          userId: user!.id,
          analysisScope: input.analysisScope || 'network'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['morphic-fields'] });
    }
  });

  return {
    morphicFields,
    isLoading,
    detectResonance: detectResonance.mutateAsync,
    isDetecting: detectResonance.isPending,
    totalFieldStrength: morphicFields?.reduce((sum, f) => sum + f.fieldStrength, 0) || 0
  };
}
