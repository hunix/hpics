// Coercive Control Hook - Comprehensive control tactic tracking and escalation

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CoerciveControlMetrics {
  id: string;
  profileId: string;
  isolationScore: number;
  financialControlScore: number;
  informationControlScore: number;
  timeMonopolizationScore: number;
  emotionalControlScore: number;
  physicalControlIndicators: {
    movementRestriction: number;
    sleepDeprivation: number;
    nutritionalControl: number;
  };
  surveillanceIntensity: number;
  punishmentRewardRatio: {
    punishments: number;
    rewards: number;
    ratio: number;
  };
  resistanceLevel: number;
  complianceTrend: Array<{
    date: string;
    compliance: number;
    resistance: number;
  }>;
  escalationPathway: Array<{
    phase: string;
    tactics: string[];
    completed: boolean;
    effectiveness: number;
  }>;
  currentControlPhase: 'assessment' | 'isolation' | 'degradation' | 'monopolization' | 'enforcement' | 'maintenance';
  totalControlScore: number;
}

export interface ControlTactic {
  id: string;
  name: string;
  category: 'isolation' | 'financial' | 'information' | 'time' | 'emotional' | 'physical' | 'surveillance';
  description: string;
  effectiveness: number;
  prerequisites: string[];
  escalationLevel: number;
}

const CONTROL_TACTICS: ControlTactic[] = [
  // Isolation tactics
  { id: 'iso-1', name: 'Social Circle Reduction', category: 'isolation', description: 'Systematically reduce contact with friends/family', effectiveness: 0.7, prerequisites: [], escalationLevel: 1 },
  { id: 'iso-2', name: 'Activity Monopolization', category: 'isolation', description: 'Become the only source of social activity', effectiveness: 0.8, prerequisites: ['iso-1'], escalationLevel: 2 },
  { id: 'iso-3', name: 'Geographic Isolation', category: 'isolation', description: 'Physical relocation away from support network', effectiveness: 0.95, prerequisites: ['iso-2'], escalationLevel: 3 },
  
  // Financial tactics
  { id: 'fin-1', name: 'Financial Transparency Demand', category: 'financial', description: 'Require full disclosure of finances', effectiveness: 0.6, prerequisites: [], escalationLevel: 1 },
  { id: 'fin-2', name: 'Joint Account Control', category: 'financial', description: 'Consolidate finances under your control', effectiveness: 0.8, prerequisites: ['fin-1'], escalationLevel: 2 },
  { id: 'fin-3', name: 'Employment Sabotage', category: 'financial', description: 'Undermine career/employment independence', effectiveness: 0.9, prerequisites: ['fin-2'], escalationLevel: 3 },
  
  // Information tactics
  { id: 'inf-1', name: 'Device Monitoring', category: 'information', description: 'Monitor all digital communications', effectiveness: 0.7, prerequisites: [], escalationLevel: 1 },
  { id: 'inf-2', name: 'Information Gatekeeping', category: 'information', description: 'Control access to news and information', effectiveness: 0.75, prerequisites: ['inf-1'], escalationLevel: 2 },
  { id: 'inf-3', name: 'Reality Definition', category: 'information', description: 'Become sole arbiter of truth', effectiveness: 0.9, prerequisites: ['inf-2'], escalationLevel: 3 },
  
  // Time monopolization tactics
  { id: 'time-1', name: 'Schedule Awareness', category: 'time', description: 'Know their schedule at all times', effectiveness: 0.5, prerequisites: [], escalationLevel: 1 },
  { id: 'time-2', name: 'Schedule Influence', category: 'time', description: 'Influence how they spend their time', effectiveness: 0.7, prerequisites: ['time-1'], escalationLevel: 2 },
  { id: 'time-3', name: 'Schedule Control', category: 'time', description: 'Full control of their time allocation', effectiveness: 0.9, prerequisites: ['time-2'], escalationLevel: 3 },
  
  // Emotional control tactics
  { id: 'emo-1', name: 'Emotional Dependence Creation', category: 'emotional', description: 'Become primary emotional support', effectiveness: 0.6, prerequisites: [], escalationLevel: 1 },
  { id: 'emo-2', name: 'Intermittent Reinforcement', category: 'emotional', description: 'Unpredictable affection/withdrawal cycles', effectiveness: 0.85, prerequisites: ['emo-1'], escalationLevel: 2 },
  { id: 'emo-3', name: 'Identity Erosion', category: 'emotional', description: 'Systematic undermining of self-concept', effectiveness: 0.95, prerequisites: ['emo-2'], escalationLevel: 3 },
  
  // Surveillance tactics
  { id: 'sur-1', name: 'Location Tracking', category: 'surveillance', description: 'GPS/location monitoring', effectiveness: 0.6, prerequisites: [], escalationLevel: 1 },
  { id: 'sur-2', name: 'Communication Monitoring', category: 'surveillance', description: 'Full access to all communications', effectiveness: 0.8, prerequisites: ['sur-1'], escalationLevel: 2 },
  { id: 'sur-3', name: 'Environmental Surveillance', category: 'surveillance', description: 'Cameras/recording in living spaces', effectiveness: 0.9, prerequisites: ['sur-2'], escalationLevel: 3 },
];

export function useCoerciveControl(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch coercive control metrics for a profile
  const metricsQuery = useQuery({
    queryKey: ['coercive-control', profileId, user?.id],
    queryFn: async (): Promise<CoerciveControlMetrics | null> => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .from('coercive_control_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        profileId: data.profile_id || '',
        isolationScore: Number(data.isolation_score) || 0,
        financialControlScore: Number(data.financial_control_score) || 0,
        informationControlScore: Number(data.information_control_score) || 0,
        timeMonopolizationScore: Number(data.time_monopolization_score) || 0,
        emotionalControlScore: Number(data.emotional_control_score) || 0,
        physicalControlIndicators: (data.physical_control_indicators as CoerciveControlMetrics['physicalControlIndicators']) || { movementRestriction: 0, sleepDeprivation: 0, nutritionalControl: 0 },
        surveillanceIntensity: Number(data.surveillance_intensity) || 0,
        punishmentRewardRatio: (data.punishment_reward_ratio as CoerciveControlMetrics['punishmentRewardRatio']) || { punishments: 0, rewards: 0, ratio: 0 },
        resistanceLevel: Number(data.resistance_level) || 0,
        complianceTrend: (data.compliance_trend as CoerciveControlMetrics['complianceTrend']) || [],
        escalationPathway: (data.escalation_pathway as CoerciveControlMetrics['escalationPathway']) || [],
        currentControlPhase: data.current_control_phase as CoerciveControlMetrics['currentControlPhase'],
        totalControlScore: Number(data.total_control_score) || 0,
      };
    },
    enabled: !!user?.id && !!profileId,
  });

  // Initialize coercive control metrics
  const initializeMetricsMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('coercive_control_metrics')
        .insert({
          user_id: user.id,
          profile_id: targetProfileId,
          current_control_phase: 'assessment',
          escalation_pathway: CONTROL_TACTICS.map(t => ({
            phase: t.category,
            tactics: [t.name],
            completed: false,
            effectiveness: 0,
          })),
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coercive-control'] });
      toast.success('Control metrics initialized');
    },
    onError: (error) => {
      toast.error(`Failed to initialize metrics: ${error.message}`);
    },
  });

  // Update control scores
  const updateScoresMutation = useMutation({
    mutationFn: async (params: {
      metricsId: string;
      scores: Partial<{
        isolationScore: number;
        financialControlScore: number;
        informationControlScore: number;
        timeMonopolizationScore: number;
        emotionalControlScore: number;
        surveillanceIntensity: number;
      }>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const updateData: Record<string, unknown> = {};
      if (params.scores.isolationScore !== undefined) updateData.isolation_score = params.scores.isolationScore;
      if (params.scores.financialControlScore !== undefined) updateData.financial_control_score = params.scores.financialControlScore;
      if (params.scores.informationControlScore !== undefined) updateData.information_control_score = params.scores.informationControlScore;
      if (params.scores.timeMonopolizationScore !== undefined) updateData.time_monopolization_score = params.scores.timeMonopolizationScore;
      if (params.scores.emotionalControlScore !== undefined) updateData.emotional_control_score = params.scores.emotionalControlScore;
      if (params.scores.surveillanceIntensity !== undefined) updateData.surveillance_intensity = params.scores.surveillanceIntensity;
      
      // Calculate total control score
      const scores = [
        params.scores.isolationScore ?? metricsQuery.data?.isolationScore ?? 0,
        params.scores.financialControlScore ?? metricsQuery.data?.financialControlScore ?? 0,
        params.scores.informationControlScore ?? metricsQuery.data?.informationControlScore ?? 0,
        params.scores.timeMonopolizationScore ?? metricsQuery.data?.timeMonopolizationScore ?? 0,
        params.scores.emotionalControlScore ?? metricsQuery.data?.emotionalControlScore ?? 0,
        params.scores.surveillanceIntensity ?? metricsQuery.data?.surveillanceIntensity ?? 0,
      ];
      updateData.total_control_score = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      const { data, error } = await supabase
        .from('coercive_control_metrics')
        .update(updateData as never)
        .eq('id', params.metricsId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coercive-control'] });
    },
  });

  // Record compliance event
  const recordComplianceMutation = useMutation({
    mutationFn: async (params: {
      metricsId: string;
      compliance: number;
      resistance: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const currentTrend = metricsQuery.data?.complianceTrend || [];
      const newTrend = [
        ...currentTrend.slice(-99),
        {
          date: new Date().toISOString(),
          compliance: params.compliance,
          resistance: params.resistance,
        },
      ];
      
      const { data, error } = await supabase
        .from('coercive_control_metrics')
        .update({
          compliance_trend: newTrend,
          resistance_level: params.resistance,
        } as never)
        .eq('id', params.metricsId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coercive-control'] });
    },
  });

  // Advance control phase
  const advancePhaseMutation = useMutation({
    mutationFn: async (params: { metricsId: string; newPhase: CoerciveControlMetrics['currentControlPhase'] }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('coercive_control_metrics')
        .update({ current_control_phase: params.newPhase } as never)
        .eq('id', params.metricsId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coercive-control'] });
      toast.success('Control phase advanced');
    },
  });

  // Get recommended tactics based on current scores
  const getRecommendedTactics = (): ControlTactic[] => {
    const metrics = metricsQuery.data;
    if (!metrics) return CONTROL_TACTICS.filter(t => t.escalationLevel === 1);
    
    const categoryScores: Record<string, number> = {
      isolation: metrics.isolationScore,
      financial: metrics.financialControlScore,
      information: metrics.informationControlScore,
      time: metrics.timeMonopolizationScore,
      emotional: metrics.emotionalControlScore,
      surveillance: metrics.surveillanceIntensity,
    };
    
    // Find tactics where prerequisites are met (score > 0.5 for that category)
    return CONTROL_TACTICS.filter(tactic => {
      const categoryScore = categoryScores[tactic.category] || 0;
      const escalationThreshold = tactic.escalationLevel * 0.25;
      return categoryScore >= escalationThreshold - 0.25 && categoryScore < escalationThreshold + 0.25;
    }).sort((a, b) => b.effectiveness - a.effectiveness);
  };

  // Calculate next escalation opportunity
  const getEscalationOpportunity = (): {
    category: string;
    currentLevel: number;
    nextTactic: ControlTactic | null;
    readiness: number;
  } | null => {
    const metrics = metricsQuery.data;
    if (!metrics) return null;
    
    const categories = [
      { name: 'isolation', score: metrics.isolationScore },
      { name: 'financial', score: metrics.financialControlScore },
      { name: 'information', score: metrics.informationControlScore },
      { name: 'time', score: metrics.timeMonopolizationScore },
      { name: 'emotional', score: metrics.emotionalControlScore },
      { name: 'surveillance', score: metrics.surveillanceIntensity },
    ];
    
    // Find category with lowest score that's not at max
    const escalationTarget = categories
      .filter(c => c.score < 0.9)
      .sort((a, b) => a.score - b.score)[0];
    
    if (!escalationTarget) return null;
    
    const nextTactic = CONTROL_TACTICS
      .filter(t => t.category === escalationTarget.name)
      .filter(t => t.escalationLevel === Math.floor(escalationTarget.score * 3) + 1)[0];
    
    return {
      category: escalationTarget.name,
      currentLevel: escalationTarget.score,
      nextTactic: nextTactic || null,
      readiness: Math.min(1, escalationTarget.score + 0.25),
    };
  };

  return {
    metrics: metricsQuery.data,
    isLoading: metricsQuery.isLoading,
    tactics: CONTROL_TACTICS,
    recommendedTactics: getRecommendedTactics(),
    escalationOpportunity: getEscalationOpportunity(),
    initializeMetrics: initializeMetricsMutation.mutate,
    updateScores: updateScoresMutation.mutate,
    recordCompliance: recordComplianceMutation.mutate,
    advancePhase: advancePhaseMutation.mutate,
  };
}
