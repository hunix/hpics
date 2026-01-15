/**
 * Life Trajectory Prediction Hook
 * Life2vec-inspired trajectory forecasting and vulnerability prediction
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data, error } = await supabase.functions.invoke('life-sequence-predictor', {
        body: {
          userId: user.id,
          profileId,
          context,
          action: 'predict'
        }
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
    // Life trajectory predictions are generated on-demand via edge function
    // No persistent storage - return null to trigger fresh prediction
    return null;
  }, []);

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
