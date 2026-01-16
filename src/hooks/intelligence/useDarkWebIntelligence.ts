/**
 * Dark Web Intelligence Hook
 * Underground monitoring and threat intelligence
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DarkWebMention {
  id: string;
  profileId?: string;
  mentionSource: string;
  sourceType: string;
  contentSnippet?: string;
  fullContent?: string;
  threatScore: number;
  relevanceScore: number;
  entitiesMentioned: Array<{ entity: string; type: string; context: string }>;
  contextAnalysis: Record<string, unknown>;
  sourceCredibility: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface CredentialExposure {
  id: string;
  profileId?: string;
  exposureType: string;
  affectedService?: string;
  exposureSeverity: string;
  credentialTypes: string[];
  breachSource?: string;
  breachDate?: string;
  dataExposed: Record<string, unknown>;
  remediationStatus: string;
  remediationActions: Array<{ action: string; completedAt?: string; status: string }>;
  discoveredAt: string;
}

export interface ThreatIntelligence {
  id: string;
  profileId?: string;
  threatType: string;
  threatName?: string;
  threatLevel: string;
  threatVector: Record<string, unknown>;
  indicatorsOfCompromise: Array<{ type: string; value: string; confidence: number }>;
  attackPatterns: Array<{ pattern: string; likelihood: number }>;
  mitigationStrategies: Array<{ strategy: string; effectiveness: number; implemented: boolean }>;
  intelSources: string[];
  confidenceScore: number;
  isActive: boolean;
  firstDetectedAt: string;
}

export interface UndergroundActivity {
  id: string;
  profileId?: string;
  activityType: string;
  platform?: string;
  activityDetails: Record<string, unknown>;
  riskAssessment: Record<string, unknown>;
  financialIndicators: Record<string, unknown>;
  connectionsDetected: Array<{ entity: string; relationship: string; confidence: number }>;
  monitoringPriority: string;
  lastActivityAt?: string;
}

export function useDarkWebIntelligence(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: mentions, isLoading: mentionsLoading } = useQuery({
    queryKey: ['dark-web-mentions', profileId],
    queryFn: async () => {
      let query = supabase
        .from('dark_web_mentions')
        .select('*')
        .eq('user_id', user!.id)
        .order('threat_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((m): DarkWebMention => ({
        id: m.id,
        profileId: m.profile_id,
        mentionSource: m.mention_source,
        sourceType: m.source_type || 'forum',
        contentSnippet: m.content_snippet,
        fullContent: m.full_content,
        threatScore: Number(m.threat_score) || 0,
        relevanceScore: Number(m.relevance_score) || 0,
        entitiesMentioned: (m.entities_mentioned as any) || [],
        contextAnalysis: (m.context_analysis as any) || {},
        sourceCredibility: Number(m.source_credibility) || 0,
        firstSeenAt: m.first_seen_at,
        lastSeenAt: m.last_seen_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: exposures, isLoading: exposuresLoading } = useQuery({
    queryKey: ['credential-exposures', profileId],
    queryFn: async () => {
      let query = supabase
        .from('credential_exposures')
        .select('*')
        .eq('user_id', user!.id)
        .order('discovered_at', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((e): CredentialExposure => ({
        id: e.id,
        profileId: e.profile_id,
        exposureType: e.exposure_type,
        affectedService: e.affected_service,
        exposureSeverity: e.exposure_severity || 'medium',
        credentialTypes: (e.credential_types as any) || [],
        breachSource: e.breach_source,
        breachDate: e.breach_date,
        dataExposed: (e.data_exposed as any) || {},
        remediationStatus: e.remediation_status || 'unresolved',
        remediationActions: (e.remediation_actions as any) || [],
        discoveredAt: e.discovered_at,
      }));
    },
    enabled: !!user?.id,
  });

  const { data: threats, isLoading: threatsLoading } = useQuery({
    queryKey: ['threat-intelligence', profileId],
    queryFn: async () => {
      let query = supabase
        .from('threat_intelligence')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('confidence_score', { ascending: false });

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((t): ThreatIntelligence => ({
        id: t.id,
        profileId: t.profile_id,
        threatType: t.threat_type,
        threatName: t.threat_name,
        threatLevel: t.threat_level || 'medium',
        threatVector: (t.threat_vector as any) || {},
        indicatorsOfCompromise: (t.indicators_of_compromise as any) || [],
        attackPatterns: (t.attack_patterns as any) || [],
        mitigationStrategies: (t.mitigation_strategies as any) || [],
        intelSources: (t.intel_sources as any) || [],
        confidenceScore: Number(t.confidence_score) || 0,
        isActive: t.is_active ?? true,
        firstDetectedAt: t.first_detected_at,
      }));
    },
    enabled: !!user?.id,
  });

  const scanDarkWeb = useMutation({
    mutationFn: async (params: { profileId?: string; searchTerms?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('dark-web-monitor', {
        body: { 
          profileId: params.profileId,
          searchTerms: params.searchTerms,
          action: 'scan',
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dark-web-mentions'] });
      queryClient.invalidateQueries({ queryKey: ['credential-exposures'] });
      queryClient.invalidateQueries({ queryKey: ['threat-intelligence'] });
      toast.success('Dark web scan initiated');
    },
    onError: (error) => {
      toast.error(`Scan failed: ${error.message}`);
    },
  });

  const updateRemediation = useMutation({
    mutationFn: async (params: { exposureId: string; action: string; status: string }) => {
      const exposure = exposures?.find(e => e.id === params.exposureId);
      if (!exposure) throw new Error('Exposure not found');

      const updatedActions = [
        ...exposure.remediationActions,
        { action: params.action, status: params.status, completedAt: new Date().toISOString() },
      ];

      const { data, error } = await supabase
        .from('credential_exposures')
        .update({
          remediation_actions: updatedActions,
          remediation_status: params.status === 'completed' ? 'resolved' : 'in_progress',
        })
        .eq('id', params.exposureId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credential-exposures'] });
      toast.success('Remediation updated');
    },
  });

  // Computed metrics
  const criticalMentions = mentions?.filter(m => m.threatScore >= 0.8) || [];
  const unresolvedExposures = exposures?.filter(e => e.remediationStatus === 'unresolved') || [];
  const highThreats = threats?.filter(t => t.threatLevel === 'high' || t.threatLevel === 'critical') || [];
  const overallThreatScore = mentions?.length 
    ? mentions.reduce((sum, m) => sum + m.threatScore, 0) / mentions.length 
    : 0;

  return {
    mentions,
    exposures,
    threats,
    isLoading: mentionsLoading || exposuresLoading || threatsLoading,
    scanDarkWeb: scanDarkWeb.mutate,
    updateRemediation: updateRemediation.mutate,
    isScanning: scanDarkWeb.isPending,
    criticalMentions,
    unresolvedExposures,
    highThreats,
    overallThreatScore,
    totalMentions: mentions?.length || 0,
    totalExposures: exposures?.length || 0,
  };
}
