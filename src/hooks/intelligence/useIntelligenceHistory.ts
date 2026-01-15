/**
 * Intelligence History Hook
 * Manages historical snapshots and time-series data for AGIS metrics
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface IntelligenceSnapshot {
  id: string;
  profileId: string;
  snapshotDate: Date;
  miceScores: {
    money: number;
    ideology: number;
    compromise: number;
    ego: number;
    composite: number;
  };
  betrayalScores: {
    defectionProbability: number;
    trustScore: number;
    gottmanTotal: number;
  };
  sacredValues: {
    count: number;
    averageProtection: number;
    topValue?: string;
  };
  gottmanScores: {
    criticism: number;
    contempt: number;
    defensiveness: number;
    stonewalling: number;
  };
  overallVulnerability: number;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function useIntelligenceHistory(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch snapshots for a profile
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['intelligence-snapshots', profileId, user?.id],
    queryFn: async () => {
      if (!user?.id || !profileId) return [];
      
      const { data, error } = await supabase
        .from('intelligence_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .eq('profile_id', profileId)
        .order('snapshot_date', { ascending: true });
      
      if (error) throw error;
      return data.map(s => ({
        id: s.id,
        profileId: s.profile_id,
        snapshotDate: new Date(s.snapshot_date),
        miceScores: s.mice_scores as any,
        betrayalScores: s.betrayal_scores as any,
        sacredValues: s.sacred_values as any,
        gottmanScores: s.gottman_scores as any,
        overallVulnerability: s.overall_vulnerability || 0,
      })) as IntelligenceSnapshot[];
    },
    enabled: !!user?.id && !!profileId,
  });

  // Capture new snapshot
  const captureSnapshot = useMutation({
    mutationFn: async (data: Omit<IntelligenceSnapshot, 'id' | 'snapshotDate'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: result, error } = await supabase
        .from('intelligence_snapshots')
        .upsert({
          user_id: user.id,
          profile_id: data.profileId,
          snapshot_date: new Date().toISOString().split('T')[0],
          mice_scores: data.miceScores,
          betrayal_scores: data.betrayalScores,
          sacred_values: data.sacredValues,
          gottman_scores: data.gottmanScores,
          overall_vulnerability: data.overallVulnerability,
        }, {
          onConflict: 'user_id,profile_id,snapshot_date',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-snapshots'] });
      toast.success('Intelligence snapshot captured');
    },
    onError: (error) => {
      toast.error(`Failed to capture snapshot: ${error.message}`);
    },
  });

  // Filter snapshots by time range
  const filterByTimeRange = (range: TimeRange): IntelligenceSnapshot[] => {
    if (!snapshots) return [];
    if (range === 'all') return snapshots;

    const now = new Date();
    const cutoff = new Date();
    
    switch (range) {
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(now.getDate() - 90);
        break;
      case '1y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return snapshots.filter(s => s.snapshotDate >= cutoff);
  };

  // Calculate trends
  const calculateTrends = (range: TimeRange = '30d') => {
    const filtered = filterByTimeRange(range);
    if (filtered.length < 2) return null;

    const first = filtered[0];
    const last = filtered[filtered.length - 1];

    return {
      miceChange: (last.miceScores?.composite || 0) - (first.miceScores?.composite || 0),
      betrayalChange: (last.betrayalScores?.defectionProbability || 0) - (first.betrayalScores?.defectionProbability || 0),
      vulnerabilityChange: (last.overallVulnerability || 0) - (first.overallVulnerability || 0),
      dataPoints: filtered.length,
      dateRange: {
        start: first.snapshotDate,
        end: last.snapshotDate,
      },
    };
  };

  // Detect anomalies (sudden changes)
  const detectAnomalies = (threshold: number = 0.2) => {
    if (!snapshots || snapshots.length < 2) return [];
    
    const anomalies: Array<{
      date: Date;
      metric: string;
      previousValue: number;
      newValue: number;
      change: number;
    }> = [];

    for (let i = 1; i < snapshots.length; i++) {
      const prev = snapshots[i - 1];
      const curr = snapshots[i];

      // Check MICE composite
      const miceChange = Math.abs(
        (curr.miceScores?.composite || 0) - (prev.miceScores?.composite || 0)
      );
      if (miceChange > threshold) {
        anomalies.push({
          date: curr.snapshotDate,
          metric: 'MICE Composite',
          previousValue: prev.miceScores?.composite || 0,
          newValue: curr.miceScores?.composite || 0,
          change: miceChange,
        });
      }

      // Check betrayal probability
      const betrayalChange = Math.abs(
        (curr.betrayalScores?.defectionProbability || 0) - 
        (prev.betrayalScores?.defectionProbability || 0)
      );
      if (betrayalChange > threshold) {
        anomalies.push({
          date: curr.snapshotDate,
          metric: 'Betrayal Risk',
          previousValue: prev.betrayalScores?.defectionProbability || 0,
          newValue: curr.betrayalScores?.defectionProbability || 0,
          change: betrayalChange,
        });
      }
    }

    return anomalies;
  };

  // Get chart data for Recharts
  const getChartData = (range: TimeRange = '30d') => {
    const filtered = filterByTimeRange(range);
    return filtered.map(s => ({
      date: s.snapshotDate.toLocaleDateString(),
      miceComposite: (s.miceScores?.composite || 0) * 100,
      betrayalRisk: (s.betrayalScores?.defectionProbability || 0) * 100,
      trustScore: (s.betrayalScores?.trustScore || 0) * 100,
      vulnerability: (s.overallVulnerability || 0) * 100,
      criticism: (s.gottmanScores?.criticism || 0) * 100,
      contempt: (s.gottmanScores?.contempt || 0) * 100,
      defensiveness: (s.gottmanScores?.defensiveness || 0) * 100,
      stonewalling: (s.gottmanScores?.stonewalling || 0) * 100,
    }));
  };

  return {
    snapshots,
    isLoading,
    captureSnapshot: captureSnapshot.mutate,
    filterByTimeRange,
    calculateTrends,
    detectAnomalies,
    getChartData,
    isCapturing: captureSnapshot.isPending,
  };
}
