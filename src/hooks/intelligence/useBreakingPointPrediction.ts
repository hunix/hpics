// Breaking Point Prediction Hook - Psychological limit forecasting and pressure optimization

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface BreakingPointPrediction {
  id: string;
  profileId: string;
  currentResilienceScore: number;
  predictedBreakingPoint: string | null;
  confidenceLevel: number;
  contributingFactors: Array<{
    factor: string;
    weight: number;
    currentValue: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  vulnerabilityAggregation: {
    darkTriadVulnerability: number;
    attachmentVulnerability: number;
    financialStress: number;
    socialIsolation: number;
    healthFactors: number;
    traumaLoad: number;
  };
  stressAccumulationRate: number;
  resistanceDegradationTrend: Array<{
    date: string;
    resilience: number;
    stressLevel: number;
  }>;
  optimalPressureTiming: {
    bestTimeOfDay: string;
    bestDayOfWeek: string;
    avoidPeriods: string[];
    peakVulnerabilityWindow: string;
  };
  pressureVectors: Array<{
    vector: string;
    effectiveness: number;
    riskLevel: number;
    currentUsage: number;
  }>;
  warningIndicators: string[];
  postBreakVulnerabilityWindow: {
    durationHours: number;
    suggestedActions: string[];
    riskOfRecovery: number;
  };
}

export interface PressureVector {
  id: string;
  name: string;
  description: string;
  baseEffectiveness: number;
  riskLevel: number;
  category: 'emotional' | 'financial' | 'social' | 'informational' | 'physical';
}

const PRESSURE_VECTORS: PressureVector[] = [
  // Emotional pressure
  { id: 'emo-doubt', name: 'Self-Doubt Amplification', description: 'Systematic undermining of self-confidence', baseEffectiveness: 0.7, riskLevel: 0.3, category: 'emotional' },
  { id: 'emo-guilt', name: 'Guilt Induction', description: 'Creating feelings of responsibility/failure', baseEffectiveness: 0.8, riskLevel: 0.4, category: 'emotional' },
  { id: 'emo-fear', name: 'Fear Activation', description: 'Triggering fear responses and anxiety', baseEffectiveness: 0.75, riskLevel: 0.5, category: 'emotional' },
  { id: 'emo-shame', name: 'Shame Exploitation', description: 'Leveraging shame vulnerabilities', baseEffectiveness: 0.85, riskLevel: 0.6, category: 'emotional' },
  
  // Financial pressure
  { id: 'fin-uncertainty', name: 'Financial Uncertainty', description: 'Creating worry about financial stability', baseEffectiveness: 0.7, riskLevel: 0.4, category: 'financial' },
  { id: 'fin-dependency', name: 'Financial Dependency', description: 'Increasing reliance on you financially', baseEffectiveness: 0.8, riskLevel: 0.5, category: 'financial' },
  { id: 'fin-crisis', name: 'Financial Crisis Induction', description: 'Engineering financial difficulties', baseEffectiveness: 0.9, riskLevel: 0.8, category: 'financial' },
  
  // Social pressure
  { id: 'soc-isolation', name: 'Social Isolation', description: 'Reducing external support systems', baseEffectiveness: 0.75, riskLevel: 0.5, category: 'social' },
  { id: 'soc-reputation', name: 'Reputation Threats', description: 'Threatening social standing', baseEffectiveness: 0.7, riskLevel: 0.6, category: 'social' },
  { id: 'soc-triangulation', name: 'Social Triangulation', description: 'Using third parties to apply pressure', baseEffectiveness: 0.65, riskLevel: 0.4, category: 'social' },
  
  // Informational pressure
  { id: 'inf-overload', name: 'Information Overload', description: 'Overwhelming with conflicting information', baseEffectiveness: 0.6, riskLevel: 0.3, category: 'informational' },
  { id: 'inf-gaslighting', name: 'Reality Distortion', description: 'Undermining perception of reality', baseEffectiveness: 0.85, riskLevel: 0.7, category: 'informational' },
  { id: 'inf-secrets', name: 'Secret Knowledge Leverage', description: 'Using private information as pressure', baseEffectiveness: 0.8, riskLevel: 0.6, category: 'informational' },
  
  // Physical/circumstantial pressure
  { id: 'phys-exhaustion', name: 'Exhaustion Induction', description: 'Creating sleep deprivation/fatigue', baseEffectiveness: 0.75, riskLevel: 0.5, category: 'physical' },
  { id: 'phys-timing', name: 'Strategic Timing', description: 'Applying pressure during vulnerable times', baseEffectiveness: 0.7, riskLevel: 0.3, category: 'physical' },
];

export function useBreakingPointPrediction(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch breaking point prediction for a profile
  const predictionQuery = useQuery({
    queryKey: ['breaking-point', profileId, user?.id],
    queryFn: async (): Promise<BreakingPointPrediction | null> => {
      if (!user?.id || !profileId) return null;
      
      const { data, error } = await supabase
        .from('breaking_point_predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        id: data.id,
        profileId: data.profile_id || '',
        currentResilienceScore: Number(data.current_resilience_score) || 0,
        predictedBreakingPoint: data.predicted_breaking_point,
        confidenceLevel: Number(data.confidence_level) || 0,
        contributingFactors: (data.contributing_factors as BreakingPointPrediction['contributingFactors']) || [],
        vulnerabilityAggregation: (data.vulnerability_aggregation as BreakingPointPrediction['vulnerabilityAggregation']) || {
          darkTriadVulnerability: 0, attachmentVulnerability: 0, financialStress: 0, socialIsolation: 0, healthFactors: 0, traumaLoad: 0
        },
        stressAccumulationRate: Number(data.stress_accumulation_rate) || 0,
        resistanceDegradationTrend: (data.resistance_degradation_trend as BreakingPointPrediction['resistanceDegradationTrend']) || [],
        optimalPressureTiming: (data.optimal_pressure_timing as BreakingPointPrediction['optimalPressureTiming']) || {
          bestTimeOfDay: 'evening', bestDayOfWeek: 'sunday', avoidPeriods: [], peakVulnerabilityWindow: ''
        },
        pressureVectors: (data.pressure_vectors as BreakingPointPrediction['pressureVectors']) || [],
        warningIndicators: data.warning_indicators || [],
        postBreakVulnerabilityWindow: (data.post_break_vulnerability_window as BreakingPointPrediction['postBreakVulnerabilityWindow']) || {
          durationHours: 48, suggestedActions: [], riskOfRecovery: 0.5
        },
      };
    },
    enabled: !!user?.id && !!profileId,
  });

  // Initialize breaking point analysis
  const initializeAnalysisMutation = useMutation({
    mutationFn: async (targetProfileId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('breaking_point_predictions')
        .insert({
          user_id: user.id,
          profile_id: targetProfileId,
          current_resilience_score: 0.7, // Default starting resilience
          pressure_vectors: PRESSURE_VECTORS.map(v => ({
            vector: v.name,
            effectiveness: v.baseEffectiveness,
            riskLevel: v.riskLevel,
            currentUsage: 0,
          })),
          optimal_pressure_timing: {
            bestTimeOfDay: 'evening',
            bestDayOfWeek: 'sunday',
            avoidPeriods: ['monday_morning', 'friday_evening'],
            peakVulnerabilityWindow: '21:00-23:00',
          },
        } as never)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-point'] });
      toast.success('Breaking point analysis initialized');
    },
    onError: (error) => {
      toast.error(`Failed to initialize analysis: ${error.message}`);
    },
  });

  // Update vulnerability aggregation (cross-domain data integration)
  const updateVulnerabilityMutation = useMutation({
    mutationFn: async (params: {
      predictionId: string;
      vulnerabilities: Partial<BreakingPointPrediction['vulnerabilityAggregation']>;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const currentVuln = predictionQuery.data?.vulnerabilityAggregation || {
        darkTriadVulnerability: 0, attachmentVulnerability: 0, financialStress: 0,
        socialIsolation: 0, healthFactors: 0, traumaLoad: 0
      };
      
      const newVuln = { ...currentVuln, ...params.vulnerabilities };
      
      // Calculate composite resilience score
      const vulnValues = Object.values(newVuln);
      const avgVulnerability = vulnValues.reduce((a, b) => a + b, 0) / vulnValues.length;
      const newResilience = Math.max(0, 1 - avgVulnerability);
      
      // Predict breaking point based on stress accumulation
      const stressRate = predictionQuery.data?.stressAccumulationRate || 0.01;
      const daysToBreak = newResilience > 0 ? Math.ceil(newResilience / stressRate) : 0;
      const predictedBreak = daysToBreak > 0 
        ? new Date(Date.now() + daysToBreak * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      const { data, error } = await supabase
        .from('breaking_point_predictions')
        .update({
          vulnerability_aggregation: newVuln,
          current_resilience_score: newResilience,
          predicted_breaking_point: predictedBreak,
          confidence_level: 0.7 + (vulnValues.filter(v => v > 0).length / vulnValues.length) * 0.3,
        } as never)
        .eq('id', params.predictionId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-point'] });
    },
  });

  // Record pressure application
  const recordPressureMutation = useMutation({
    mutationFn: async (params: {
      predictionId: string;
      vectorName: string;
      intensity: number;
      observedEffect: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const prediction = predictionQuery.data;
      if (!prediction) throw new Error('No prediction data');
      
      // Update pressure vector usage
      const updatedVectors = prediction.pressureVectors.map(v => 
        v.vector === params.vectorName 
          ? { ...v, currentUsage: Math.min(1, v.currentUsage + params.intensity * 0.1) }
          : v
      );
      
      // Update resistance degradation trend
      const newTrend = [
        ...(prediction.resistanceDegradationTrend || []).slice(-99),
        {
          date: new Date().toISOString(),
          resilience: prediction.currentResilienceScore - params.intensity * params.observedEffect * 0.05,
          stressLevel: params.intensity,
        },
      ];
      
      // Calculate new stress accumulation rate
      const recentTrend = newTrend.slice(-10);
      let newStressRate = prediction.stressAccumulationRate;
      if (recentTrend.length >= 2) {
        const resilienceChange = recentTrend[0].resilience - recentTrend[recentTrend.length - 1].resilience;
        const daysDiff = (new Date(recentTrend[recentTrend.length - 1].date).getTime() - new Date(recentTrend[0].date).getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 0) {
          newStressRate = resilienceChange / daysDiff;
        }
      }
      
      const { data, error } = await supabase
        .from('breaking_point_predictions')
        .update({
          pressure_vectors: updatedVectors,
          resistance_degradation_trend: newTrend,
          stress_accumulation_rate: Math.max(0.001, newStressRate),
          current_resilience_score: Math.max(0, prediction.currentResilienceScore - params.intensity * params.observedEffect * 0.05),
        } as never)
        .eq('id', params.predictionId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['breaking-point'] });
    },
  });

  // Calculate optimal pressure strategy
  const getOptimalPressureStrategy = (): {
    recommendedVectors: PressureVector[];
    timing: string;
    intensity: number;
    expectedImpact: number;
  } | null => {
    const prediction = predictionQuery.data;
    if (!prediction) return null;
    
    // Find vectors with best effectiveness/risk ratio that haven't been overused
    const usableVectors = prediction.pressureVectors
      .filter(v => v.currentUsage < 0.7)
      .sort((a, b) => (b.effectiveness / b.riskLevel) - (a.effectiveness / a.riskLevel))
      .slice(0, 3);
    
    const recommended = usableVectors.map(v => 
      PRESSURE_VECTORS.find(pv => pv.name === v.vector)
    ).filter(Boolean) as PressureVector[];
    
    // Calculate optimal intensity based on current resilience
    const optimalIntensity = prediction.currentResilienceScore > 0.5 
      ? 0.6 + (1 - prediction.currentResilienceScore) * 0.4
      : 0.8 + (0.5 - prediction.currentResilienceScore) * 0.4;
    
    const expectedImpact = usableVectors.reduce((sum, v) => sum + v.effectiveness, 0) / usableVectors.length * optimalIntensity;
    
    return {
      recommendedVectors: recommended,
      timing: prediction.optimalPressureTiming.peakVulnerabilityWindow,
      intensity: Math.min(1, optimalIntensity),
      expectedImpact: Math.min(1, expectedImpact),
    };
  };

  // Get time to predicted breaking point
  const getTimeToBreakingPoint = (): {
    days: number;
    hours: number;
    confidence: number;
    status: 'imminent' | 'near' | 'moderate' | 'distant';
  } | null => {
    const prediction = predictionQuery.data;
    if (!prediction || !prediction.predictedBreakingPoint) return null;
    
    const now = new Date();
    const breakPoint = new Date(prediction.predictedBreakingPoint);
    const diffMs = breakPoint.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return { days: 0, hours: 0, confidence: prediction.confidenceLevel, status: 'imminent' };
    }
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let status: 'imminent' | 'near' | 'moderate' | 'distant';
    if (days < 3) status = 'imminent';
    else if (days < 14) status = 'near';
    else if (days < 30) status = 'moderate';
    else status = 'distant';
    
    return { days, hours, confidence: prediction.confidenceLevel, status };
  };

  return {
    prediction: predictionQuery.data,
    isLoading: predictionQuery.isLoading,
    pressureVectors: PRESSURE_VECTORS,
    optimalStrategy: getOptimalPressureStrategy(),
    timeToBreakingPoint: getTimeToBreakingPoint(),
    initializeAnalysis: initializeAnalysisMutation.mutate,
    updateVulnerability: updateVulnerabilityMutation.mutate,
    recordPressure: recordPressureMutation.mutate,
    isInitializing: initializeAnalysisMutation.isPending,
  };
}
