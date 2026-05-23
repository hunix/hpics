/**
 * Chronotype Analysis Hook
 * Analyzes circadian patterns and optimal influence timing
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export type ChronotypeType = 'lion' | 'bear' | 'wolf' | 'dolphin';

export interface ChronotypeProfile {
  profileId: string;
  chronotype: ChronotypeType;
  confidence: number;
  
  // Peak performance windows
  cognitivePeaks: {
    type: 'analytical' | 'creative' | 'social' | 'decision';
    startHour: number;
    endHour: number;
    intensity: number;
  }[];
  
  // Vulnerability windows
  complianceWindows: {
    startHour: number;
    endHour: number;
    susceptibilityScore: number;
    reason: string;
    optimalApproach: string;
  }[];
  
  // Energy patterns
  energyPattern: {
    hour: number;
    level: number;
    cognitiveLoad: number;
  }[];
  
  // Optimal contact times
  optimalContactTimes: {
    purpose: string;
    bestTime: string;
    alternativeTime: string;
    avoidTime: string;
    reasoning: string;
  }[];
  
  // Sleep patterns
  sleepPattern: {
    typicalBedtime: string;
    typicalWakeTime: string;
    sleepQuality: number;
  };
  
  analyzedAt: Date;
}

export function useChronotypeAnalysis() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, ChronotypeProfile>>(new Map());

  const analyzeChronotype = useCallback(async (
    profileId: string,
    behavioralData?: {
      communicationTimestamps?: Date[];
      activityPatterns?: { hour: number; activity: string }[];
      knownSchedule?: string;
    }
  ): Promise<ChronotypeProfile | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('chronotype-analyzer', {
          userId: user.id,
          profileId,
          behavioralData,
          action: 'analyze'
        });

      if (error) throw error;

      const profile = data?.profile as ChronotypeProfile;
      
      // Save to database
      await supabase.from('chronotype_profiles').upsert({
        user_id: user.id,
        profile_id: profileId,
        chronotype: profile.chronotype,
        confidence_score: profile.confidence,
        cognitive_peaks: profile.cognitivePeaks,
        compliance_windows: profile.complianceWindows,
        energy_pattern: profile.energyPattern,
        optimal_contact_times: profile.optimalContactTimes,
        sleep_pattern: profile.sleepPattern,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,profile_id' });

      setProfiles(prev => new Map(prev).set(profileId, profile));
      toast.success('Chronotype profile analyzed');

      return profile;
    } catch (error) {
      console.error('Error analyzing chronotype:', error);
      toast.error('Failed to analyze chronotype');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const getOptimalTime = useCallback((
    profileId: string,
    purpose: 'persuasion' | 'negotiation' | 'request' | 'difficult_conversation'
  ): { time: string; reason: string } | null => {
    const profile = profiles.get(profileId);
    if (!profile) return null;

    const optimal = profile.optimalContactTimes.find(t => 
      t.purpose.toLowerCase().includes(purpose) || purpose.includes(t.purpose.toLowerCase())
    );

    if (optimal) {
      return { time: optimal.bestTime, reason: optimal.reasoning };
    }

    // Default to highest compliance window
    const bestWindow = profile.complianceWindows.reduce((best, current) => 
      current.susceptibilityScore > best.susceptibilityScore ? current : best
    );

    return {
      time: `${bestWindow.startHour}:00 - ${bestWindow.endHour}:00`,
      reason: bestWindow.reason
    };
  }, [profiles]);

  const isVulnerableNow = useCallback((profileId: string): {
    isVulnerable: boolean;
    window?: ChronotypeProfile['complianceWindows'][0];
    score: number;
  } => {
    const profile = profiles.get(profileId);
    if (!profile) return { isVulnerable: false, score: 0 };

    const currentHour = new Date().getHours();
    const activeWindow = profile.complianceWindows.find(w => 
      currentHour >= w.startHour && currentHour < w.endHour
    );

    return {
      isVulnerable: !!activeWindow && activeWindow.susceptibilityScore > 0.6,
      window: activeWindow,
      score: activeWindow?.susceptibilityScore || 0
    };
  }, [profiles]);

  const loadProfile = useCallback(async (profileId: string): Promise<ChronotypeProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chronotype_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      const complianceData = data.compliance_windows as any;
      const optimalContactTimes = (data.optimal_persuasion_times as any) || 
        data.cognitive_peak_hours?.map((h: number) => ({ purpose: 'general', startHour: h, endHour: h + 2 })) || [];
      
      const isOwl = data.chronotype?.includes('owl');
      const bedtime = isOwl ? '00:00' : '23:00';
      const wakeTime = isOwl ? '08:00' : '07:00';

      const profile: ChronotypeProfile = {
        profileId: data.profile_id || profileId,
        chronotype: data.chronotype as ChronotypeType,
        confidence: data.morningness_eveningness_score || 0.85,
        cognitivePeaks: data.cognitive_peak_hours?.map((h: number) => ({ type: 'analytical' as const, startHour: h, endHour: h + 2, intensity: 0.8 })) || [],
        complianceWindows: complianceData?.primary ? [complianceData.primary] : [],
        energyPattern: [],
        optimalContactTimes,
        sleepPattern: { typicalBedtime: bedtime, typicalWakeTime: wakeTime, sleepQuality: 0.7 },
        analyzedAt: new Date(data.updated_at || new Date())
      };

      setProfiles(prev => new Map(prev).set(profileId, profile));
      return profile;
    } catch (error) {
      console.error('Error loading chronotype profile:', error);
      return null;
    }
  }, [user]);

  return {
    isAnalyzing,
    profiles,
    analyzeChronotype,
    getOptimalTime,
    isVulnerableNow,
    loadProfile,
    getProfile: (id: string) => profiles.get(id)
  };
}
