/**
 * Biometric-Psychological Fusion Hook
 * Correlates biometric data with psychological analysis for predictive intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FusionProfile {
  profileId: string;
  biometricSignals: {
    voiceStress: number;
    facialMicroexpressions: number;
    keystrokeDynamics: number;
    gaitAnalysis: number;
  };
  psychologicalIndicators: {
    darkTriadScore: number;
    attachmentStyle: string;
    miceVulnerability: number;
    betrayalRisk: number;
  };
  fusionScore: number;
  correlations: Array<{
    biometric: string;
    psychological: string;
    correlation: number;
    significance: string;
  }>;
  predictedBehaviors: Array<{
    behavior: string;
    probability: number;
    timeframe: string;
  }>;
}

export function useBiometricPsychFusion(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch biometric data
  const biometricsQuery = useQuery({
    queryKey: ['biometric-fusion', profileId, user?.id],
    queryFn: async () => {
      if (!user?.id || !profileId) return null;

      // Fetch biometric data
      const { data: biometrics } = await supabase
        .from('behavioral_biometrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      // Fetch psychology assessment
      const { data: psychology } = await supabase
        .from('psychology_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      // Fetch MICE assessment
      const { data: mice } = await supabase
        .from('mice_assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      // Fetch betrayal prediction
      const { data: betrayal } = await supabase
        .from('betrayal_predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      // Fetch attachment profile
      const { data: attachment } = await supabase
        .from('attachment_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .maybeSingle();

      return {
        biometrics,
        psychology,
        mice,
        betrayal,
        attachment,
      };
    },
    enabled: !!user?.id && !!profileId,
  });

  // Calculate fusion profile
  const fusionProfile: FusionProfile | null = biometricsQuery.data ? (() => {
    const { biometrics, psychology, mice, betrayal, attachment } = biometricsQuery.data;
    
    const biometricSignals = {
      voiceStress: (biometrics?.stress_indicators as any)?.voice_stress || 0.5,
      facialMicroexpressions: (biometrics?.emotional_state_markers as any)?.microexpression_score || 0.5,
      keystrokeDynamics: (biometrics?.keystroke_profile as any)?.consistency_score || 0.5,
      gaitAnalysis: (biometrics?.gait_signature as any)?.regularity_score || 0.5,
    };

    const psychologicalIndicators = {
      darkTriadScore: (psychology?.dark_triad_scores as any)?.composite || 0.5,
      attachmentStyle: attachment?.attachment_style || 'unknown',
      miceVulnerability: mice?.recruitment_likelihood || 0.5,
      betrayalRisk: betrayal?.defection_probability || 0.3,
    };

    // Calculate correlations between biometric and psychological signals
    const correlations = [
      {
        biometric: 'Voice Stress',
        psychological: 'Betrayal Risk',
        correlation: Math.min(1, biometricSignals.voiceStress + psychologicalIndicators.betrayalRisk * 0.5),
        significance: biometricSignals.voiceStress > 0.7 ? 'high' : 'moderate',
      },
      {
        biometric: 'Microexpressions',
        psychological: 'Dark Triad',
        correlation: Math.abs(biometricSignals.facialMicroexpressions - psychologicalIndicators.darkTriadScore),
        significance: psychologicalIndicators.darkTriadScore > 0.6 ? 'high' : 'low',
      },
      {
        biometric: 'Keystroke Dynamics',
        psychological: 'MICE Vulnerability',
        correlation: (biometricSignals.keystrokeDynamics + psychologicalIndicators.miceVulnerability) / 2,
        significance: 'moderate',
      },
    ];

    // Generate predicted behaviors based on fusion
    const predictedBehaviors = [];
    
    if (psychologicalIndicators.betrayalRisk > 0.7 && biometricSignals.voiceStress > 0.6) {
      predictedBehaviors.push({
        behavior: 'Likely to defect under pressure',
        probability: Math.min(0.95, psychologicalIndicators.betrayalRisk + 0.15),
        timeframe: '1-3 weeks',
      });
    }
    
    if (psychologicalIndicators.miceVulnerability > 0.6) {
      predictedBehaviors.push({
        behavior: 'Susceptible to recruitment approach',
        probability: psychologicalIndicators.miceVulnerability,
        timeframe: 'Immediate',
      });
    }

    if (psychologicalIndicators.darkTriadScore > 0.5) {
      predictedBehaviors.push({
        behavior: 'Manipulative tendencies in negotiations',
        probability: psychologicalIndicators.darkTriadScore,
        timeframe: 'Ongoing',
      });
    }

    // Calculate overall fusion score
    const fusionScore = (
      (biometricSignals.voiceStress + biometricSignals.facialMicroexpressions + 
       biometricSignals.keystrokeDynamics + biometricSignals.gaitAnalysis) / 4 * 0.4 +
      (psychologicalIndicators.darkTriadScore + psychologicalIndicators.miceVulnerability + 
       psychologicalIndicators.betrayalRisk) / 3 * 0.6
    );

    return {
      profileId: profileId!,
      biometricSignals,
      psychologicalIndicators,
      fusionScore,
      correlations,
      predictedBehaviors,
    };
  })() : null;

  // Run fusion analysis
  const runAnalysis = useMutation({
    mutationFn: async () => {
      if (!user?.id || !profileId) throw new Error('Missing profile');
      
      // Trigger re-fetch of all data
      await queryClient.invalidateQueries({ queryKey: ['biometric-fusion', profileId] });
      toast.success('Fusion analysis complete');
      return fusionProfile;
    },
  });

  return {
    fusionProfile,
    isLoading: biometricsQuery.isLoading,
    runAnalysis: runAnalysis.mutate,
    isAnalyzing: runAnalysis.isPending,
    rawData: biometricsQuery.data,
  };
}
