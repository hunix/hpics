/**
 * Attachment Vulnerability Analysis Hook
 * Analyzes attachment styles and identifies exploitation vectors
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface AttachmentProfile {
  profileId: string;
  attachmentStyle: AttachmentStyle;
  secondaryStyle?: AttachmentStyle;
  confidence: number;
  
  // Sensitivity metrics (0-1 scale)
  abandonmentSensitivity: number;
  rejectionSensitivity: number;
  egoThreatSensitivity: number;
  narcissisticSupplyNeed: number;
  intermittentReinforcementSusceptibility: number;
  
  // Vulnerability windows
  vulnerabilityWindows: {
    trigger: string;
    timing: string;
    duration: string;
    exploitationMethod: string;
  }[];
  
  // Trigger phrases that activate attachment responses
  triggerPhrases: string[];
  
  // Exploitation playbook
  exploitationPlaybook: {
    approach: string;
    techniques: string[];
    warnings: string[];
    ethicalBoundaries: string[];
  };
  
  // Evidence basis
  evidenceBasis: {
    communicationPatterns: string[];
    behavioralIndicators: string[];
    historicalEvents: string[];
  };
  
  analyzedAt: Date;
}

export function useAttachmentAnalysis() {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [profiles, setProfiles] = useState<Map<string, AttachmentProfile>>(new Map());

  const analyzeAttachment = useCallback(async (
    profileId: string,
    additionalContext?: {
      recentInteractions?: string[];
      knownTrauma?: string[];
      relationshipHistory?: string[];
    }
  ): Promise<AttachmentProfile | null> => {
    if (!user) return null;
    setIsAnalyzing(true);

    try {
      const { data, error } = await invokeFunction('attachment-vulnerability-analyzer', {
          userId: user.id,
          profileId,
          additionalContext,
          action: 'analyze'
        });

      if (error) throw error;

      const profile = data?.profile as AttachmentProfile;
      
      // Save to database
      await supabase.from('attachment_profiles').upsert({
        user_id: user.id,
        profile_id: profileId,
        attachment_style: profile.attachmentStyle,
        abandonment_sensitivity: profile.abandonmentSensitivity,
        rejection_sensitivity: profile.rejectionSensitivity,
        ego_threat_sensitivity: profile.egoThreatSensitivity,
        narcissistic_supply_need: profile.narcissisticSupplyNeed,
        intermittent_reinforcement_susceptibility: profile.intermittentReinforcementSusceptibility,
        vulnerability_windows: profile.vulnerabilityWindows,
        trigger_phrases: profile.triggerPhrases,
        exploitation_playbook: profile.exploitationPlaybook,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,profile_id' });

      setProfiles(prev => new Map(prev).set(profileId, profile));
      toast.success('Attachment profile analyzed');

      return profile;
    } catch (error) {
      console.error('Error analyzing attachment:', error);
      toast.error('Failed to analyze attachment');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user]);

  const getVulnerabilityWindow = useCallback(async (
    profileId: string
  ): Promise<{ isOpen: boolean; window?: AttachmentProfile['vulnerabilityWindows'][0] } | null> => {
    if (!user) return null;

    try {
      const { data, error } = await invokeFunction('attachment-vulnerability-analyzer', {
          userId: user.id,
          profileId,
          action: 'check_vulnerability_window'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking vulnerability window:', error);
      return null;
    }
  }, [user]);

  const loadProfile = useCallback(async (profileId: string): Promise<AttachmentProfile | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('attachment_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      const profile: AttachmentProfile = {
        profileId: data.profile_id ?? '',
        attachmentStyle: data.attachment_style as AttachmentStyle,
        confidence: 0.85,
        abandonmentSensitivity: data.abandonment_sensitivity || 0,
        rejectionSensitivity: data.rejection_sensitivity || 0,
        egoThreatSensitivity: data.ego_threat_sensitivity || 0,
        narcissisticSupplyNeed: data.narcissistic_supply_need || 0,
        intermittentReinforcementSusceptibility: data.intermittent_reinforcement_susceptibility || 0,
        vulnerabilityWindows: (data.vulnerability_windows as any) || [],
        triggerPhrases: data.trigger_phrases || [],
        exploitationPlaybook: (data.exploitation_playbook as any) || { approach: '', techniques: [], warnings: [], ethicalBoundaries: [] },
        evidenceBasis: { communicationPatterns: [], behavioralIndicators: [], historicalEvents: [] },
        analyzedAt: new Date(data.updated_at ?? Date.now())
      };

      setProfiles(prev => new Map(prev).set(profileId, profile));
      return profile;
    } catch (error) {
      console.error('Error loading attachment profile:', error);
      return null;
    }
  }, [user]);

  return {
    isAnalyzing,
    profiles,
    analyzeAttachment,
    getVulnerabilityWindow,
    loadProfile,
    getProfile: (id: string) => profiles.get(id)
  };
}
