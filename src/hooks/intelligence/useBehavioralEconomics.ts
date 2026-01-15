/**
 * Behavioral Economics Hook
 * Cognitive bias exploitation and economic behavior prediction
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CognitiveBias {
  name: string;
  description: string;
  susceptibility: number;
  exploitationTechniques: string[];
  ethicalConsiderations: string[];
}

export interface FinancialPsychologyProfile {
  profileId: string;
  
  // Risk profile
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'speculative';
  lossAversion: number; // Kahneman's loss aversion coefficient (typically 2-2.5)
  
  // Cognitive biases (0-1 susceptibility)
  biases: {
    endowmentEffect: number;
    sunkCostFallacy: number;
    mentalAccounting: number;
    hyperbolicDiscounting: number;
    statusQuoBias: number;
    anchoringBias: number;
    confirmationBias: number;
    availabilityHeuristic: number;
    representativenessHeuristic: number;
  };
  
  // Decision patterns
  decisionPatterns: {
    pattern: string;
    frequency: number;
    triggers: string[];
    exploitationOpportunity: string;
  }[];
  
  // Spending patterns
  spendingProfile: {
    category: string;
    sensitivity: number;
    triggers: string[];
  }[];
  
  // Negotiation vulnerabilities
  negotiationVulnerabilities: {
    weakness: string;
    severity: number;
    counterStrategy: string;
    exploitationMethod: string;
  }[];
  
  // Optimal framing strategies
  framingStrategies: {
    context: string;
    optimalFrame: string;
    example: string;
    expectedEffect: string;
  }[];
  
  confidence: number;
  analyzedAt: Date;
}

export interface AnchorRecommendation {
  context: string;
  targetValue: number;
  optimalAnchor: number;
  anchorRatio: number;
  justification: string;
  presentationStrategy: string;
  expectedCounterAnchor: number;
  responseStrategy: string;
}

export function useBehavioralEconomics() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, FinancialPsychologyProfile>>(new Map());

  const analyzeProfile = useCallback(async (
    profileId: string,
    context?: {
      knownPurchases?: { item: string; price: number; date: Date }[];
      negotiationHistory?: { outcome: string; context: string }[];
      financialBehaviors?: string[];
    }
  ): Promise<FinancialPsychologyProfile | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('behavioral-economics-engine', {
        body: {
          userId: user.id,
          profileId,
          context,
          action: 'analyze_profile'
        }
      });

      if (error) throw error;

      const profile = data?.profile as FinancialPsychologyProfile;
      
      // Save to database
      await supabase.from('financial_psychology_profiles').upsert({
        user_id: user.id,
        profile_id: profileId,
        risk_tolerance: profile.riskTolerance,
        loss_aversion_coefficient: profile.lossAversion,
        cognitive_biases: profile.biases,
        decision_patterns: profile.decisionPatterns,
        spending_profile: profile.spendingProfile,
        negotiation_vulnerabilities: profile.negotiationVulnerabilities,
        framing_strategies: profile.framingStrategies,
        confidence_score: profile.confidence,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,profile_id' });

      setProfiles(prev => new Map(prev).set(profileId, profile));
      toast.success('Financial psychology profile analyzed');

      return profile;
    } catch (error) {
      console.error('Error analyzing behavioral economics profile:', error);
      toast.error('Failed to analyze profile');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const generateAnchor = useCallback(async (
    profileId: string,
    targetValue: number,
    context: string
  ): Promise<AnchorRecommendation | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('behavioral-economics-engine', {
        body: {
          userId: user.id,
          profileId,
          targetValue,
          context,
          action: 'generate_anchor'
        }
      });

      if (error) throw error;
      return data?.anchor as AnchorRecommendation;
    } catch (error) {
      console.error('Error generating anchor:', error);
      return null;
    }
  }, [user]);

  const getOptimalFrame = useCallback((
    profileId: string,
    value: number,
    context: 'gain' | 'loss' | 'certainty' | 'probability'
  ): { frame: string; rationale: string } | null => {
    const profile = profiles.get(profileId);
    if (!profile) return null;

    const lossAversion = profile.lossAversion;
    
    switch (context) {
      case 'gain':
        return {
          frame: `You stand to gain $${value.toFixed(2)}`,
          rationale: 'Standard gain framing for moderate impact'
        };
      case 'loss':
        // Loss framing is ~2x more effective due to loss aversion
        return {
          frame: `You risk losing $${value.toFixed(2)}`,
          rationale: `Loss aversion coefficient of ${lossAversion.toFixed(1)} suggests ${Math.round(lossAversion * 100)}% stronger response`
        };
      case 'certainty':
        return {
          frame: `Guaranteed ${value > 0 ? 'benefit' : 'cost'} of $${Math.abs(value).toFixed(2)}`,
          rationale: 'Certainty effect increases perceived value'
        };
      case 'probability':
        return {
          frame: `${Math.round(Math.random() * 30 + 70)}% chance of ${value > 0 ? 'gaining' : 'losing'} $${Math.abs(value).toFixed(2)}`,
          rationale: 'Probability weighting can increase perceived expected value'
        };
      default:
        return null;
    }
  }, [profiles]);

  const exploitBias = useCallback(async (
    profileId: string,
    biasType: keyof FinancialPsychologyProfile['biases'],
    context: string
  ): Promise<{ strategy: string; script: string; warnings: string[] } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase.functions.invoke('behavioral-economics-engine', {
        body: {
          userId: user.id,
          profileId,
          biasType,
          context,
          action: 'exploit_bias'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating bias exploitation strategy:', error);
      return null;
    }
  }, [user]);

  const loadProfile = useCallback(async (profileId: string): Promise<FinancialPsychologyProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('financial_psychology_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const profile: FinancialPsychologyProfile = {
        profileId: data.profile_id,
        riskTolerance: (data.risk_profile as any) || 'moderate',
        lossAversion: data.loss_aversion_score || 2.25,
        biases: {
          endowmentEffect: data.endowment_effect_susceptibility || 0,
          sunkCostFallacy: data.sunk_cost_susceptibility || 0,
          mentalAccounting: 0.5,
          hyperbolicDiscounting: data.hyperbolic_discounting_rate || 0,
          statusQuoBias: data.status_quo_bias || 0,
          anchoringBias: data.anchoring_susceptibility || 0,
          confirmationBias: 0.5,
          availabilityHeuristic: 0.5,
          representativenessHeuristic: 0.5
        },
        decisionPatterns: (data.mental_accounting_patterns as any) || [],
        spendingProfile: (data.spending_triggers as any) || [],
        negotiationVulnerabilities: [],
        framingStrategies: [],
        confidence: 0.85,
        analyzedAt: new Date(data.updated_at)
      };

      setProfiles(prev => new Map(prev).set(profileId, profile));
      return profile;
    } catch (error) {
      console.error('Error loading financial psychology profile:', error);
      return null;
    }
  }, [user]);

  return {
    isAnalyzing,
    profiles,
    analyzeProfile,
    generateAnchor,
    getOptimalFrame,
    exploitBias,
    loadProfile,
    getProfile: (id: string) => profiles.get(id)
  };
}
