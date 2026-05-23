/**
 * Life Trajectory Prediction Hook
 * Life2vec-inspired trajectory forecasting and vulnerability prediction
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface LifeEvent {
  type: string;
  probability: number;
  timeframe: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  preparationAdvice: string;
  exploitationOpportunity?: string;
}

export interface CrisisWarning {
  type: string;
  probability: number;
  timeframe: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  preventionStrategies: string[];
  supportOpportunities: string[];
}

export interface VulnerabilityWindow {
  startDate: string;
  endDate: string;
  type: string;
  severity: number;
  triggers: string[];
  optimalApproach: string;
  ethicalConsiderations: string[];
}

export interface LifeTrajectoryPrediction {
  profileId: string;
  
  // Overall trajectory
  trajectoryDirection: 'ascending' | 'stable' | 'descending' | 'volatile';
  stabilityScore: number;
  
  // Predicted life events
  predictedEvents: LifeEvent[];
  
  // Crisis early warnings
  crisisWarnings: CrisisWarning[];
  
  // Vulnerability windows
  vulnerabilityWindows: VulnerabilityWindow[];
  
  // Key inflection points
  inflectionPoints: {
    date: string;
    event: string;
    probability: number;
    impact: string;
  }[];
  
  // Relationship trajectory
  relationshipForecast: {
    currentStrength: number;
    projectedStrength: number;
    riskFactors: string[];
    opportunities: string[];
  };
  
  // Career/financial trajectory
  economicForecast: {
    trend: 'growth' | 'stable' | 'decline';
    confidence: number;
    keyFactors: string[];
  };
  
  // Health trajectory
  wellbeingForecast: {
    trend: 'improving' | 'stable' | 'declining';
    riskFactors: string[];
    interventionOpportunities: string[];
  };
  
  confidence: number;
  validUntil: Date;
  analyzedAt: Date;
}

export function useLifeTrajectory() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [predictions, setPredictions] = useState<Map<string, LifeTrajectoryPrediction>>(new Map());

  const predictTrajectory = useCallback(async (
    profileId: string,
    context?: {
      knownLifeEvents?: { event: string; date: Date; impact: string }[];
      demographicData?: Record<string, any>;
      behavioralPatterns?: string[];
      timeHorizon?: '3_months' | '6_months' | '1_year' | '5_years';
    }
  ): Promise<LifeTrajectoryPrediction | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('life-sequence-predictor', {
          userId: user.id,
          profileId,
          context,
          action: 'predict'
        });

      if (error) throw error;

      const prediction = data?.prediction as LifeTrajectoryPrediction;
      
      setPredictions(prev => new Map(prev).set(profileId, prediction));
      toast.success('Life trajectory predicted');

      return prediction;
    } catch (error) {
      console.error('Error predicting life trajectory:', error);
      toast.error('Failed to predict trajectory');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const getCrisisAlerts = useCallback((profileId: string): CrisisWarning[] => {
    const prediction = predictions.get(profileId);
    if (!prediction) return [];
    
    return prediction.crisisWarnings.filter(w => 
      w.severity === 'high' || w.severity === 'critical'
    );
  }, [predictions]);

  const getActiveVulnerabilityWindows = useCallback((profileId: string): VulnerabilityWindow[] => {
    const prediction = predictions.get(profileId);
    if (!prediction) return [];
    
    const now = new Date();
    return prediction.vulnerabilityWindows.filter(w => {
      const start = new Date(w.startDate);
      const end = new Date(w.endDate);
      return now >= start && now <= end;
    });
  }, [predictions]);

  const getUpcomingInflectionPoints = useCallback((
    profileId: string,
    daysAhead: number = 90
  ): LifeTrajectoryPrediction['inflectionPoints'] => {
    const prediction = predictions.get(profileId);
    if (!prediction) return [];
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    
    return prediction.inflectionPoints.filter(p => {
      const date = new Date(p.date);
      return date <= cutoff;
    });
  }, [predictions]);

  const loadPrediction = useCallback(async (profileId: string): Promise<LifeTrajectoryPrediction | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('life_trajectory_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Derive trajectory direction from overall scores
      const careerData = data.career_trajectory as any;
      const financialData = data.financial_trajectory as any;
      const healthData = data.health_trajectory as any;
      
      let trajectoryDirection: LifeTrajectoryPrediction['trajectoryDirection'] = 'stable';
      const trends = [careerData?.trend, financialData?.trend, healthData?.trend].filter(Boolean);
      if (trends.includes('growth') || trends.includes('improving')) trajectoryDirection = 'ascending';
      if (trends.includes('decline') || trends.includes('declining')) trajectoryDirection = 'descending';

      const prediction: LifeTrajectoryPrediction = {
        profileId: data.profile_id || profileId,
        trajectoryDirection,
        stabilityScore: data.confidence_score || 0.5,
        predictedEvents: (data.life_events_sequence as any[]) || [],
        crisisWarnings: (data.crisis_early_warnings as any[]) || [],
        vulnerabilityWindows: (data.vulnerability_windows as any[]) || [],
        inflectionPoints: (data.predicted_outcomes as any[]) || [],
        relationshipForecast: (data.relationship_trajectory as any) || { currentStrength: 0.5, projectedStrength: 0.5, riskFactors: [], opportunities: [] },
        economicForecast: financialData || { trend: 'stable', confidence: 0.5, keyFactors: [] },
        wellbeingForecast: healthData || { trend: 'stable', riskFactors: [], interventionOpportunities: [] },
        confidence: data.confidence_score || 0.7,
        validUntil: new Date(data.valid_until || new Date()),
        analyzedAt: new Date(data.created_at || new Date())
      };

      setPredictions(prev => new Map(prev).set(profileId, prediction));
      return prediction;
    } catch (error) {
      console.error('Error loading prediction:', error);
      return null;
    }
  }, [user]);

  return {
    isAnalyzing,
    predictions,
    predictTrajectory,
    getCrisisAlerts,
    getActiveVulnerabilityWindows,
    getUpcomingInflectionPoints,
    loadPrediction,
    getPrediction: (id: string) => predictions.get(id)
  };
}
