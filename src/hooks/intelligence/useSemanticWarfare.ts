// Semantic Warfare Hook - Term warfare and definition control

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { FramingStrategy } from '@/lib/warfare/semanticWarfareEngine';
import type { Tables } from '@/integrations/supabase/types';

type SemanticOperationRecord = Tables<'semantic_operations'>;

export function useSemanticWarfare() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all semantic operations
  const operationsQuery = useQuery({
    queryKey: ['semantic-operations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('semantic_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SemanticOperationRecord[];
    },
    enabled: !!user?.id,
  });

  // Analyze a term for semantic warfare opportunities
  const analyzeTermMutation = useMutation({
    mutationFn: async (params: { term: string; context: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase.functions.invoke('semantic-warfare-engine', {
        body: {
          term: params.term,
          context: params.context,
          analysisType: 'full',
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-operations'] });
      toast.success('Term analysis complete');
    },
    onError: (error) => {
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  // Create a new semantic operation
  const createOperationMutation = useMutation({
    mutationFn: async (params: {
      targetTerm: string;
      currentDefinition: string;
      targetDefinition: string;
      strategies?: FramingStrategy[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('semantic_operations')
        .insert({
          user_id: user.id,
          target_term: params.targetTerm,
          current_definition: params.currentDefinition,
          target_definition: params.targetDefinition,
          overton_position: 0,
          shift_progress: 0,
          status: 'planning',
          strategies: params.strategies || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-operations'] });
      toast.success('Semantic operation created');
    },
    onError: (error) => {
      toast.error(`Failed to create operation: ${error.message}`);
    },
  });

  // Update operation progress
  const updateProgressMutation = useMutation({
    mutationFn: async (params: { operationId: string; progress: number; status?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = {
        shift_progress: params.progress,
        updated_at: new Date().toISOString(),
      };
      
      if (params.status) {
        updateData.status = params.status;
      }
      
      const { data, error } = await supabase
        .from('semantic_operations')
        .update(updateData)
        .eq('id', params.operationId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semantic-operations'] });
    },
  });

  return {
    operations: operationsQuery.data || [],
    isLoading: operationsQuery.isLoading,
    analyzeTerm: analyzeTermMutation.mutate,
    isAnalyzing: analyzeTermMutation.isPending,
    createOperation: createOperationMutation.mutate,
    isCreating: createOperationMutation.isPending,
    updateProgress: updateProgressMutation.mutate,
  };
}
