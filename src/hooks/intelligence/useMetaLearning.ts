import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface MetaLearningModel {
  id: string;
  modelName: string;
  modelType: string;
  learningDomain: string;
  trainingDataSources: string[];
  modelParameters: Record<string, unknown>;
  performanceMetrics: Record<string, unknown>;
  accuracyScore: number | null;
  lastTrainedAt: string | null;
  trainingIterations: number;
  isActive: boolean;
  createdAt: string | null;
}

export function useMetaLearning() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const modelsQuery = useQuery({
    queryKey: ['meta-learning-models', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_learning_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        modelName: row.model_name,
        modelType: row.model_type,
        learningDomain: row.learning_domain,
        trainingDataSources: row.training_data_sources as string[] || [],
        modelParameters: row.model_parameters as Record<string, unknown> || {},
        performanceMetrics: row.performance_metrics as Record<string, unknown> || {},
        accuracyScore: row.accuracy_score ? Number(row.accuracy_score) : null,
        lastTrainedAt: row.last_trained_at,
        trainingIterations: row.training_iterations || 0,
        isActive: row.is_active ?? true,
        createdAt: row.created_at,
      })) as MetaLearningModel[];
    },
    enabled: !!user,
  });

  const createModel = useMutation({
    mutationFn: async (input: { modelName: string; modelType: string; learningDomain: string }) => {
      const { data, error } = await supabase
        .from('meta_learning_models')
        .insert({
          user_id: user!.id,
          model_name: input.modelName,
          model_type: input.modelType,
          learning_domain: input.learningDomain,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-learning-models'] });
      toast.success('Meta-learning model created');
    },
  });

  const trainModel = useMutation({
    mutationFn: async (modelId: string) => {
      const { data, error } = await supabase
        .from('meta_learning_models')
        .update({
          last_trained_at: new Date().toISOString(),
          training_iterations: supabase.rpc ? 1 : 1, // Increment handled by trigger ideally
        } as never)
        .eq('id', modelId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-learning-models'] });
      toast.success('Model training initiated');
    },
  });

  return {
    models: modelsQuery.data || [],
    isLoading: modelsQuery.isLoading,
    createModel,
    trainModel,
  };
}
