// Dependency Tracking Hook - Multi-factor dependency creation and monitoring

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DependencyScore {
  id: string;
  profileId: string;
  emotionalDependency: number;
  financialDependency: number;
  socialDependency: number;
  informationalDependency: number;
  narcissisticSupplyDependency: number;
  attachmentDependency: number;
  isolationFactor: number;
  withdrawalSeverityPrediction: {
    mildWithdrawal: number;
    moderateWithdrawal: number;
    severeWithdrawal: number;
    panicLevel: number;
  };
  exitPreventionProtocols: Array<{
    protocol: string;
    trigger: string;
    effectiveness: number;
    deployed: boolean;
  }>;
  dependencyCreationTactics: Array<{
    tactic: string;
    category: string;
    status: 'planned' | 'active' | 'completed';
    effectiveness: number;
  }>;
  totalDependencyScore: number;
  dependencyTrend: Array<{
    date: string;
    score: number;
    dominantType: string;
  }>;
}

export interface DependencyTactic {
  id: string;
  name: string;
  category: 'emotional' | 'financial' | 'social' | 'informational' | 'supply' | 'attachment';
  description: string;
  effectiveness: number;
  timeToEffect: string;
  prerequisites: string[];
}

const DEPENDENCY_TACTICS: DependencyTactic[] = [
  // Emotional dependency tactics
  { id: 'emo-1', name: 'Exclusive Emotional Support', category: 'emotional', description: 'Become their only emotional confidant', effectiveness: 0.8, timeToEffect: '2-4 weeks', prerequisites: [] },
  { id: 'emo-2', name: 'Emotional Volatility Creation', category: 'emotional', description: 'Create emotional instability they need you to stabilize', effectiveness: 0.85, timeToEffect: '4-8 weeks', prerequisites: ['emo-1'] },
  { id: 'emo-3', name: 'Emotional Anchoring', category: 'emotional', description: 'Associate all positive emotions with your presence', effectiveness: 0.9, timeToEffect: '8-12 weeks', prerequisites: ['emo-2'] },
  
  // Financial dependency tactics
  { id: 'fin-1', name: 'Financial Assistance', category: 'financial', description: 'Provide financial help to create obligation', effectiveness: 0.7, timeToEffect: '1-2 weeks', prerequisites: [] },
  { id: 'fin-2', name: 'Joint Financial Entanglement', category: 'financial', description: 'Intertwine finances in complex ways', effectiveness: 0.85, timeToEffect: '4-8 weeks', prerequisites: ['fin-1'] },
  { id: 'fin-3', name: 'Financial Capability Reduction', category: 'financial', description: 'Reduce their ability to be financially independent', effectiveness: 0.95, timeToEffect: '12-24 weeks', prerequisites: ['fin-2'] },
  
  // Social dependency tactics
  { id: 'soc-1', name: 'Social Circle Integration', category: 'social', description: 'Become central to their social activities', effectiveness: 0.7, timeToEffect: '4-8 weeks', prerequisites: [] },
  { id: 'soc-2', name: 'Relationship Mediation', category: 'social', description: 'Become necessary for their other relationships', effectiveness: 0.75, timeToEffect: '8-12 weeks', prerequisites: ['soc-1'] },
  { id: 'soc-3', name: 'Social Identity Fusion', category: 'social', description: 'Their social identity becomes inseparable from you', effectiveness: 0.9, timeToEffect: '16-24 weeks', prerequisites: ['soc-2'] },
  
  // Informational dependency tactics
  { id: 'inf-1', name: 'Information Provider', category: 'informational', description: 'Become their primary information source', effectiveness: 0.6, timeToEffect: '2-4 weeks', prerequisites: [] },
  { id: 'inf-2', name: 'Decision Guide', category: 'informational', description: 'They consult you for all decisions', effectiveness: 0.8, timeToEffect: '8-12 weeks', prerequisites: ['inf-1'] },
  { id: 'inf-3', name: 'Cognitive Dependency', category: 'informational', description: 'They cannot process information without you', effectiveness: 0.95, timeToEffect: '24+ weeks', prerequisites: ['inf-2'] },
  
  // Narcissistic supply dependency
  { id: 'sup-1', name: 'Validation Monopoly', category: 'supply', description: 'Become sole source of validation', effectiveness: 0.75, timeToEffect: '4-8 weeks', prerequisites: [] },
  { id: 'sup-2', name: 'Ego Sustenance', category: 'supply', description: 'Their self-worth depends on your approval', effectiveness: 0.85, timeToEffect: '8-16 weeks', prerequisites: ['sup-1'] },
  { id: 'sup-3', name: 'Identity Definition', category: 'supply', description: 'You define who they are', effectiveness: 0.95, timeToEffect: '24+ weeks', prerequisites: ['sup-2'] },
  
  // Attachment dependency
  { id: 'att-1', name: 'Secure Base Positioning', category: 'attachment', description: 'Become their attachment figure', effectiveness: 0.7, timeToEffect: '8-12 weeks', prerequisites: [] },
  { id: 'att-2', name: 'Anxious Attachment Cultivation', category: 'attachment', description: 'Create anxious attachment through inconsistency', effectiveness: 0.85, timeToEffect: '12-20 weeks', prerequisites: ['att-1'] },
  { id: 'att-3', name: 'Trauma Bond Formation', category: 'attachment', description: 'Form a trauma bond through cycles', effectiveness: 0.95, timeToEffect: '24+ weeks', prerequisites: ['att-2'] },
];

export function useDependencyTracking(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch dependency scores for a profile
  const dependencyQuery = useQuery({
    queryKey: ['dependency-scores', profileId, user?.id],
    queryFn: async (): Promise<DependencyScore | null> => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .from('dependency_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        profileId: data.profile_id || '',
        emotionalDependency: Number(data.emotional_dependency) || 0,
        financialDependency: Number(data.financial_dependency) || 0,
        socialDependency: Number(data.social_dependency) || 0,
        informationalDependency: Number(data.informational_dependency) || 0,
        narcissisticSupplyDependency: Number(data.narcissistic_supply_dependency) || 0,
        attachmentDependency: Number(data.attachment_dependency) || 0,
        isolationFactor: Number(data.isolation_factor) || 0,
        withdrawalSeverityPrediction: (data.withdrawal_severity_prediction as DependencyScore['withdrawalSeverityPrediction']) || {
          mildWithdrawal: 0, moderateWithdrawal: 0, severeWithdrawal: 0, panicLevel: 0
        },
        exitPreventionProtocols: (data.exit_prevention_protocols as DependencyScore['exitPreventionProtocols']) || [],
        dependencyCreationTactics: (data.dependency_creation_tactics as DependencyScore['dependencyCreationTactics']) || [],
        totalDependencyScore: Number(data.total_dependency_score) || 0,
        dependencyTrend: (data.dependency_trend as DependencyScore['dependencyTrend']) || [],
      };
    },
    enabled: !!user?.id && !!profileId,
  });

  // Initialize dependency tracking
  const initializeTrackingMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('dependency_scores')
        .insert({
          user_id: user.id,
          profile_id: targetProfileId,
          exit_prevention_protocols: [
            { protocol: 'Guilt Activation', trigger: 'exit_mention', effectiveness: 0.7, deployed: false },
            { protocol: 'Future Faking', trigger: 'dissatisfaction', effectiveness: 0.8, deployed: false },
            { protocol: 'Trauma Bond Reinforcement', trigger: 'independence_attempt', effectiveness: 0.85, deployed: false },
            { protocol: 'Isolation Reminder', trigger: 'external_support_seeking', effectiveness: 0.75, deployed: false },
          ],
          dependency_creation_tactics: DEPENDENCY_TACTICS.slice(0, 6).map(t => ({
            tactic: t.name,
            category: t.category,
            status: 'planned',
            effectiveness: 0,
          })),
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependency-scores'] });
      toast.success('Dependency tracking initialized');
    },
    onError: (error) => {
      toast.error(`Failed to initialize tracking: ${error.message}`);
    },
  });

  // Update dependency scores
  const updateScoresMutation = useMutation({
    mutationFn: async (params: {
      dependencyId: string;
      scores: Partial<{
        emotionalDependency: number;
        financialDependency: number;
        socialDependency: number;
        informationalDependency: number;
        narcissisticSupplyDependency: number;
        attachmentDependency: number;
        isolationFactor: number;
      }>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const current = dependencyQuery.data;
      const newScores = {
        emotionalDependency: params.scores.emotionalDependency ?? current?.emotionalDependency ?? 0,
        financialDependency: params.scores.financialDependency ?? current?.financialDependency ?? 0,
        socialDependency: params.scores.socialDependency ?? current?.socialDependency ?? 0,
        informationalDependency: params.scores.informationalDependency ?? current?.informationalDependency ?? 0,
        narcissisticSupplyDependency: params.scores.narcissisticSupplyDependency ?? current?.narcissisticSupplyDependency ?? 0,
        attachmentDependency: params.scores.attachmentDependency ?? current?.attachmentDependency ?? 0,
        isolationFactor: params.scores.isolationFactor ?? current?.isolationFactor ?? 0,
      };
      
      // Calculate total with isolation as multiplier
      const baseScore = (
        newScores.emotionalDependency +
        newScores.financialDependency +
        newScores.socialDependency +
        newScores.informationalDependency +
        newScores.narcissisticSupplyDependency +
        newScores.attachmentDependency
      ) / 6;
      const totalScore = Math.min(1, baseScore * (1 + newScores.isolationFactor * 0.5));
      
      // Calculate withdrawal severity
      const withdrawalPrediction = {
        mildWithdrawal: Math.min(1, totalScore * 0.5),
        moderateWithdrawal: Math.min(1, totalScore * 0.75),
        severeWithdrawal: Math.min(1, totalScore),
        panicLevel: Math.min(1, totalScore * 1.2 * newScores.attachmentDependency),
      };
      
      // Find dominant dependency type
      const scoreEntries = Object.entries(newScores).filter(([k]) => k !== 'isolationFactor');
      const dominant = scoreEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      // Update trend
      const newTrend = [
        ...(current?.dependencyTrend || []).slice(-99),
        { date: new Date().toISOString(), score: totalScore, dominantType: dominant },
      ];
      
      const updateData: Record<string, unknown> = {
        emotional_dependency: newScores.emotionalDependency,
        financial_dependency: newScores.financialDependency,
        social_dependency: newScores.socialDependency,
        informational_dependency: newScores.informationalDependency,
        narcissistic_supply_dependency: newScores.narcissisticSupplyDependency,
        attachment_dependency: newScores.attachmentDependency,
        isolation_factor: newScores.isolationFactor,
        total_dependency_score: totalScore,
        withdrawal_severity_prediction: withdrawalPrediction,
        dependency_trend: newTrend,
      };
      
      const { data, error } = await supabase
        .from('dependency_scores')
        .update(updateData as never)
        .eq('id', params.dependencyId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependency-scores'] });
    },
  });

  // Deploy exit prevention protocol
  const deployProtocolMutation = useMutation({
    mutationFn: async (params: { dependencyId: string; protocolIndex: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const current = dependencyQuery.data;
      if (!current) throw new Error('No dependency data');
      
      const protocols = [...current.exitPreventionProtocols];
      protocols[params.protocolIndex] = {
        ...protocols[params.protocolIndex],
        deployed: true,
      };
      
      const { data, error } = await supabase
        .from('dependency_scores')
        .update({ exit_prevention_protocols: protocols } as never)
        .eq('id', params.dependencyId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependency-scores'] });
      toast.success('Exit prevention protocol deployed');
    },
  });

  // Activate dependency tactic
  const activateTacticMutation = useMutation({
    mutationFn: async (params: { dependencyId: string; tacticIndex: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const current = dependencyQuery.data;
      if (!current) throw new Error('No dependency data');
      
      const tactics = [...current.dependencyCreationTactics];
      tactics[params.tacticIndex] = {
        ...tactics[params.tacticIndex],
        status: 'active',
      };
      
      const { data, error } = await supabase
        .from('dependency_scores')
        .update({ dependency_creation_tactics: tactics } as never)
        .eq('id', params.dependencyId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependency-scores'] });
    },
  });

  // Get recommended next tactics
  const getRecommendedTactics = (): DependencyTactic[] => {
    const current = dependencyQuery.data;
    if (!current) return DEPENDENCY_TACTICS.filter(t => t.prerequisites.length === 0);
    
    const activeTactics = current.dependencyCreationTactics
      .filter(t => t.status === 'active' || t.status === 'completed')
      .map(t => t.tactic);
    
    return DEPENDENCY_TACTICS.filter(tactic => {
      // Not already active
      if (activeTactics.includes(tactic.name)) return false;
      // Prerequisites met
      return tactic.prerequisites.every(prereq => 
        activeTactics.includes(prereq)
      );
    }).sort((a, b) => b.effectiveness - a.effectiveness);
  };

  // Calculate exit risk
  const calculateExitRisk = (): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    mitigatingFactors: string[];
    vulnerabilities: string[];
  } | null => {
    const current = dependencyQuery.data;
    if (!current) return null;
    
    // Exit risk is inversely proportional to dependency
    const exitRisk = 1 - current.totalDependencyScore;
    
    const mitigatingFactors: string[] = [];
    const vulnerabilities: string[] = [];
    
    if (current.emotionalDependency > 0.7) mitigatingFactors.push('High emotional dependency');
    if (current.financialDependency > 0.7) mitigatingFactors.push('Financial entanglement');
    if (current.isolationFactor > 0.6) mitigatingFactors.push('Limited external support');
    if (current.attachmentDependency > 0.7) mitigatingFactors.push('Strong attachment bond');
    
    if (current.socialDependency < 0.3) vulnerabilities.push('External social connections');
    if (current.informationalDependency < 0.3) vulnerabilities.push('Independent information access');
    if (current.isolationFactor < 0.4) vulnerabilities.push('Active support network');
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (exitRisk < 0.25) riskLevel = 'low';
    else if (exitRisk < 0.5) riskLevel = 'medium';
    else if (exitRisk < 0.75) riskLevel = 'high';
    else riskLevel = 'critical';
    
    return { riskLevel, riskScore: exitRisk, mitigatingFactors, vulnerabilities };
  };

  return {
    dependency: dependencyQuery.data,
    isLoading: dependencyQuery.isLoading,
    allTactics: DEPENDENCY_TACTICS,
    recommendedTactics: getRecommendedTactics(),
    exitRisk: calculateExitRisk(),
    initializeTracking: initializeTrackingMutation.mutate,
    updateScores: updateScoresMutation.mutate,
    deployProtocol: deployProtocolMutation.mutate,
    activateTactic: activateTacticMutation.mutate,
  };
}
