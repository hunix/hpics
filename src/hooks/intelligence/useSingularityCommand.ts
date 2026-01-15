import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SingularityObjective {
  id: string;
  objectiveName: string;
  objectiveType: string;
  priorityLevel: number;
  targetProfiles: string[];
  successCriteria: Record<string, unknown>;
  constraintParameters: Record<string, unknown>;
  subObjectives: unknown[];
  progressPercentage: number;
  estimatedCompletion: string | null;
  resourceRequirements: Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface StrategicSynthesis {
  id: string;
  profileId: string | null;
  synthesisType: string;
  inputSources: Record<string, unknown>;
  synthesizedStrategy: Record<string, unknown>;
  confidenceScore: number | null;
  riskAssessment: Record<string, unknown>;
  resourceEfficiency: number | null;
  timelineProjection: Record<string, unknown>;
  alternativeStrategies: unknown[];
  recommendationRank: number | null;
  status: string;
  createdAt: string;
}

export interface SystemEvolution {
  id: string;
  evolutionType: string;
  affectedComponents: string[];
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  improvementMetrics: Record<string, unknown>;
  triggerReason: string | null;
  autonomous: boolean;
  approvedAt: string | null;
  appliedAt: string | null;
  rollbackAvailable: boolean;
  createdAt: string;
}

export function useSingularityCommand() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const objectivesQuery = useQuery({
    queryKey: ['singularity-objectives', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('singularity_objectives')
        .select('*')
        .order('priority_level', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        objectiveName: row.objective_name,
        objectiveType: row.objective_type,
        priorityLevel: row.priority_level || 5,
        targetProfiles: row.target_profiles || [],
        successCriteria: row.success_criteria as Record<string, unknown>,
        constraintParameters: row.constraint_parameters as Record<string, unknown> || {},
        subObjectives: row.sub_objectives as unknown[] || [],
        progressPercentage: row.progress_percentage ? Number(row.progress_percentage) : 0,
        estimatedCompletion: row.estimated_completion,
        resourceRequirements: row.resource_requirements as Record<string, unknown> || {},
        status: row.status || 'active',
        createdAt: row.created_at,
      })) as SingularityObjective[];
    },
    enabled: !!user,
  });

  const synthesisQuery = useQuery({
    queryKey: ['strategic-synthesis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategic_synthesis')
        .select('*')
        .order('recommendation_rank', { ascending: true, nullsFirst: false });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        synthesisType: row.synthesis_type,
        inputSources: row.input_sources as Record<string, unknown>,
        synthesizedStrategy: row.synthesized_strategy as Record<string, unknown>,
        confidenceScore: row.confidence_score ? Number(row.confidence_score) : null,
        riskAssessment: row.risk_assessment as Record<string, unknown> || {},
        resourceEfficiency: row.resource_efficiency ? Number(row.resource_efficiency) : null,
        timelineProjection: row.timeline_projection as Record<string, unknown> || {},
        alternativeStrategies: row.alternative_strategies as unknown[] || [],
        recommendationRank: row.recommendation_rank,
        status: row.status || 'proposed',
        createdAt: row.created_at,
      })) as StrategicSynthesis[];
    },
    enabled: !!user,
  });

  const evolutionQuery = useQuery({
    queryKey: ['system-evolution', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_evolution_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        evolutionType: row.evolution_type,
        affectedComponents: row.affected_components || [],
        beforeState: row.before_state as Record<string, unknown> | null,
        afterState: row.after_state as Record<string, unknown> | null,
        improvementMetrics: row.improvement_metrics as Record<string, unknown> || {},
        triggerReason: row.trigger_reason,
        autonomous: row.autonomous ?? false,
        approvedAt: row.approved_at,
        appliedAt: row.applied_at,
        rollbackAvailable: row.rollback_available ?? true,
        createdAt: row.created_at,
      })) as SystemEvolution[];
    },
    enabled: !!user,
  });

  const createObjective = useMutation({
    mutationFn: async (input: { 
      objectiveName: string; 
      objectiveType: string;
      priorityLevel: number;
      successCriteria: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('singularity_objectives')
        .insert({
          user_id: user!.id,
          objective_name: input.objectiveName,
          objective_type: input.objectiveType,
          priority_level: input.priorityLevel,
          success_criteria: input.successCriteria,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['singularity-objectives'] });
      toast.success('Singularity objective created');
    },
  });

  const activeObjectives = (objectivesQuery.data || []).filter(o => o.status === 'active');
  const pendingSyntheses = (synthesisQuery.data || []).filter(s => s.status === 'proposed');
  const recentEvolutions = evolutionQuery.data?.slice(0, 10) || [];

  return {
    objectives: objectivesQuery.data || [],
    activeObjectives,
    syntheses: synthesisQuery.data || [],
    pendingSyntheses,
    evolutions: evolutionQuery.data || [],
    recentEvolutions,
    isLoading: objectivesQuery.isLoading || synthesisQuery.isLoading || evolutionQuery.isLoading,
    createObjective,
  };
}
