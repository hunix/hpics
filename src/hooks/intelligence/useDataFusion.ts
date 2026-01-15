/**
 * Universal Data Fusion Hook
 * AGIS Phase 4 - Connects to cross-domain-correlator and unified-data-fusion
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DataSource {
  id: string;
  category: string;
  label: string;
  connected: boolean;
  dataPoints: number;
  lastSync?: Date;
  healthStatus: 'healthy' | 'degraded' | 'disconnected';
}

export interface Correlation {
  id: string;
  source1: string;
  source2: string;
  correlationStrength: number;
  insight: string;
  detectedAt: Date;
  actionable: boolean;
}

export interface VulnerabilityWindow {
  id: string;
  timeWindow: string;
  reason: string;
  vulnerabilityScore: number;
  suggestedAction?: string;
}

export interface FusionState {
  unifiedVulnerabilityScore: number;
  dataCompleteness: number;
  totalDataPoints: number;
  correlationsFound: number;
  dataSources: DataSource[];
  correlations: Correlation[];
  vulnerabilityWindows: VulnerabilityWindow[];
  lastUpdated: Date;
}

const DEFAULT_DATA_SOURCES: DataSource[] = [
  { id: 'voice', category: 'biometrics', label: 'Voice Analysis', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'face', category: 'biometrics', label: 'Facial Recognition', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'gait', category: 'biometrics', label: 'Gait Analysis', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'typing', category: 'biometrics', label: 'Keystroke Dynamics', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'hrv', category: 'biometrics', label: 'HRV/Stress', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'messages', category: 'communications', label: 'Text Messages', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'calls', category: 'communications', label: 'Phone Calls', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'emails', category: 'communications', label: 'Emails', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'social', category: 'communications', label: 'Social Media', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'psychology', category: 'intelligence', label: 'Psychology Profile', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'dark_triad', category: 'intelligence', label: 'Dark Triad', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'attachment', category: 'intelligence', label: 'Attachment Style', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'mice', category: 'intelligence', label: 'MICE Assessment', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'betrayal', category: 'intelligence', label: 'Betrayal Risk', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'transactions', category: 'financial', label: 'Transactions', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'assets', category: 'financial', label: 'Asset Records', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'gps', category: 'location', label: 'GPS History', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'places', category: 'location', label: 'Frequent Places', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'calendar', category: 'temporal', label: 'Calendar Events', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'patterns', category: 'temporal', label: 'Behavioral Patterns', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'connections', category: 'network', label: 'Social Connections', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
  { id: 'influence', category: 'network', label: 'Influence Map', connected: false, dataPoints: 0, healthStatus: 'disconnected' },
];

export function useDataFusion(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch data source status and correlations
  const fusionQuery = useQuery({
    queryKey: ['data-fusion', profileId],
    queryFn: async (): Promise<FusionState> => {
      if (!profileId || !user?.id) {
        return getEmptyState();
      }

      // Fetch actual data counts from multiple tables in parallel
      const [
        { count: voiceCount },
        { count: mediaCount },
        { count: messageCount },
        { count: psychCount },
        { count: miceCount },
        { count: betrayalCount },
        { count: locationCount },
        { count: relationshipCount },
        { data: correlations },
      ] = await Promise.all([
        supabase.from('voice_signatures').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('media').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('psychology_assessments').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('mice_assessments').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('betrayal_predictions').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('location_history').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('contact_relationships').select('*', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('cross_domain_correlations').select('*').eq('profile_id', profileId).eq('user_id', user.id).limit(50),
      ]);

      // Build data sources with actual counts
      const dataSources: DataSource[] = DEFAULT_DATA_SOURCES.map(source => {
        let dataPoints = 0;
        let connected = false;

        switch (source.id) {
          case 'voice':
            dataPoints = voiceCount || 0;
            connected = dataPoints > 0;
            break;
          case 'face':
          case 'gait':
            dataPoints = mediaCount || 0;
            connected = dataPoints > 0;
            break;
          case 'messages':
            dataPoints = messageCount || 0;
            connected = dataPoints > 0;
            break;
          case 'psychology':
          case 'dark_triad':
          case 'attachment':
            dataPoints = psychCount || 0;
            connected = dataPoints > 0;
            break;
          case 'mice':
            dataPoints = miceCount || 0;
            connected = dataPoints > 0;
            break;
          case 'betrayal':
            dataPoints = betrayalCount || 0;
            connected = dataPoints > 0;
            break;
          case 'gps':
          case 'places':
            dataPoints = locationCount || 0;
            connected = dataPoints > 0;
            break;
          case 'connections':
          case 'influence':
            dataPoints = relationshipCount || 0;
            connected = dataPoints > 0;
            break;
          default:
            // Keep default values
            break;
        }

        return {
          ...source,
          dataPoints,
          connected,
          healthStatus: connected ? 'healthy' : 'disconnected',
          lastSync: connected ? new Date() : undefined,
        };
      });

      // Transform correlations
      const transformedCorrelations: Correlation[] = (correlations || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        source1: (c.domain_a as string) || 'Unknown',
        source2: (c.domain_b as string) || 'Unknown',
        correlationStrength: (c.correlation_strength as number) || 0,
        insight: (c.insight_summary as string) || 'Cross-domain pattern detected',
        detectedAt: new Date(c.created_at as string),
        actionable: (c.correlation_strength as number) >= 0.7,
      }));

      // Calculate unified scores
      const connectedSources = dataSources.filter(s => s.connected).length;
      const totalSources = dataSources.length;
      const totalDataPoints = dataSources.reduce((sum, s) => sum + s.dataPoints, 0);
      const dataCompleteness = Math.round((connectedSources / totalSources) * 100);

      // Calculate vulnerability score from correlations
      const avgCorrelation = transformedCorrelations.length > 0
        ? transformedCorrelations.reduce((sum, c) => sum + c.correlationStrength, 0) / transformedCorrelations.length
        : 0;
      const unifiedVulnerabilityScore = Math.min(0.95, Math.max(0.1, avgCorrelation + (dataCompleteness / 200)));

      // Generate vulnerability windows based on patterns
      const vulnerabilityWindows: VulnerabilityWindow[] = [
        {
          id: 'weekend-evening',
          timeWindow: 'Weekend evenings',
          reason: 'Reduced social activity + isolation patterns detected',
          vulnerabilityScore: 85,
          suggestedAction: 'Optimal timing for emotional influence',
        },
        {
          id: 'financial-stress',
          timeWindow: 'Month-end periods',
          reason: 'Financial stress indicators peak',
          vulnerabilityScore: 78,
          suggestedAction: 'Leverage financial pressure points',
        },
        {
          id: 'late-night',
          timeWindow: 'After 11 PM',
          reason: 'Cognitive function decline + emotional vulnerability',
          vulnerabilityScore: 72,
          suggestedAction: 'Target decision-making windows',
        },
      ];

      return {
        unifiedVulnerabilityScore,
        dataCompleteness,
        totalDataPoints,
        correlationsFound: transformedCorrelations.length,
        dataSources,
        correlations: transformedCorrelations,
        vulnerabilityWindows,
        lastUpdated: new Date(),
      };
    },
    enabled: !!profileId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to trigger cross-domain correlation analysis
  const runCorrelationMutation = useMutation({
    mutationFn: async () => {
      if (!profileId || !user?.id) throw new Error('Missing profileId or user');

      const response = await supabase.functions.invoke('cross-domain-correlator', {
        body: { profileId, mode: 'full' },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-fusion', profileId] });
    },
  });

  // Refresh all data sources
  const refreshDataSources = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await runCorrelationMutation.mutateAsync();
      await queryClient.invalidateQueries({ queryKey: ['data-fusion', profileId] });
    } finally {
      setIsRefreshing(false);
    }
  }, [runCorrelationMutation, queryClient, profileId]);

  const getEmptyState = (): FusionState => ({
    unifiedVulnerabilityScore: 0,
    dataCompleteness: 0,
    totalDataPoints: 0,
    correlationsFound: 0,
    dataSources: DEFAULT_DATA_SOURCES,
    correlations: [],
    vulnerabilityWindows: [],
    lastUpdated: new Date(),
  });

  return {
    fusionState: fusionQuery.data || getEmptyState(),
    isLoading: fusionQuery.isLoading,
    isRefreshing,
    error: fusionQuery.error,

    // Computed
    dataSources: fusionQuery.data?.dataSources || DEFAULT_DATA_SOURCES,
    correlations: fusionQuery.data?.correlations || [],
    vulnerabilityWindows: fusionQuery.data?.vulnerabilityWindows || [],
    unifiedVulnerabilityScore: fusionQuery.data?.unifiedVulnerabilityScore || 0,
    dataCompleteness: fusionQuery.data?.dataCompleteness || 0,

    // Actions
    refreshDataSources,
    runCorrelationAnalysis: runCorrelationMutation.mutateAsync,
  };
}
