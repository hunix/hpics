import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { subDays, subHours, format, startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';

export type SnapshotType = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface AnalyticsSnapshot {
  id: string;
  user_id: string;
  snapshot_type: SnapshotType;
  period_start: string;
  period_end: string;
  metrics: {
    total_captures: number;
    alerts_generated: number;
    threats_detected: number;
    devices_active: number;
    uptime_percent: number;
    avg_response_time_ms: number;
    fusion_events: number;
  };
  device_stats: Record<string, {
    captures: number;
    alerts: number;
    uptime_percent: number;
  }>;
  alert_summary: {
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    acknowledgment_rate: number;
    avg_resolution_time_hours: number;
  };
  fusion_summary: {
    events_count: number;
    avg_confidence: number;
    threat_breakdown: Record<string, number>;
  };
  trend_indicators: {
    captures: TrendDirection;
    alerts: TrendDirection;
    threats: TrendDirection;
    confidence: TrendDirection;
  };
  created_at: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface DevicePerformanceMetrics {
  device_id: string;
  device_name: string;
  device_type: string;
  captures_24h: number;
  alerts_24h: number;
  uptime_percent: number;
  last_active: string;
  health_score: number;
}

export function useHardwareAnalytics() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent snapshots
  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useQuery({
    queryKey: ['hardware-analytics-snapshots', user?.id],
    queryFn: async (): Promise<AnalyticsSnapshot[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('hardware_analytics_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('period_end', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as AnalyticsSnapshot[];
    },
    enabled: !!user?.id,
  });

  // Fetch real-time device metrics
  const { data: deviceMetrics = [], isLoading: isLoadingDevices } = useQuery({
    queryKey: ['hardware-device-metrics', user?.id],
    queryFn: async (): Promise<DevicePerformanceMetrics[]> => {
      if (!user?.id) return [];

      // Get devices
      const { data: devices, error: devError } = await supabase
        .from('hardware_devices')
        .select('*')
        .eq('user_id', user.id);

      if (devError) throw devError;

      const last24h = subHours(new Date(), 24).toISOString();

      // Get captures per device
      const { data: captures } = await supabase
        .from('rf_signal_captures')
        .select('device_id')
        .eq('user_id', user.id)
        .gte('captured_at', last24h);

      // Get alerts per device
      const { data: alerts } = await supabase
        .from('hardware_alerts')
        .select('device_id')
        .eq('user_id', user.id)
        .gte('created_at', last24h);

      // Aggregate metrics
      return (devices || []).map((device: any) => {
        const deviceCaptures = (captures || []).filter((c: any) => c.device_id === device.id).length;
        const deviceAlerts = (alerts || []).filter((a: any) => a.device_id === device.id).length;
        
        // Calculate health score based on activity and alerts
        const activityScore = Math.min(deviceCaptures / 10, 1) * 50;
        const alertPenalty = Math.min(deviceAlerts * 10, 40);
        const uptimeBonus = device.is_online ? 10 : 0;
        const healthScore = Math.max(0, Math.min(100, activityScore + uptimeBonus - alertPenalty + 40));

        return {
          device_id: device.id,
          device_name: device.device_name || device.device_id,
          device_type: device.device_type,
          captures_24h: deviceCaptures,
          alerts_24h: deviceAlerts,
          uptime_percent: device.is_online ? 100 : 0,
          last_active: device.last_seen_at,
          health_score: healthScore,
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Fetch time series data for charts
  const { data: captureTimeSeries = [] } = useQuery({
    queryKey: ['hardware-capture-timeseries', user?.id],
    queryFn: async (): Promise<TimeSeriesDataPoint[]> => {
      if (!user?.id) return [];

      const last7Days = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from('rf_signal_captures')
        .select('captured_at')
        .eq('user_id', user.id)
        .gte('captured_at', last7Days)
        .order('captured_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
        const day = format(new Date(item.captured_at), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, count]) => ({
        timestamp: date,
        value: count,
        label: format(new Date(date), 'MMM d'),
      }));
    },
    enabled: !!user?.id,
  });

  // Fetch alert time series
  const { data: alertTimeSeries = [] } = useQuery({
    queryKey: ['hardware-alert-timeseries', user?.id],
    queryFn: async (): Promise<TimeSeriesDataPoint[]> => {
      if (!user?.id) return [];

      const last7Days = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from('hardware_alerts')
        .select('created_at, severity')
        .eq('user_id', user.id)
        .gte('created_at', last7Days)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
        const day = format(new Date(item.created_at), 'yyyy-MM-dd');
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([date, count]) => ({
        timestamp: date,
        value: count,
        label: format(new Date(date), 'MMM d'),
      }));
    },
    enabled: !!user?.id,
  });

  // Generate snapshot
  const generateSnapshot = useMutation({
    mutationFn: async (type: SnapshotType) => {
      if (!user?.id) throw new Error('Not authenticated');

      const now = new Date();
      let periodStart: Date;
      
      switch (type) {
        case 'hourly':
          periodStart = subHours(now, 1);
          break;
        case 'daily':
          periodStart = startOfDay(now);
          break;
        case 'weekly':
          periodStart = startOfWeek(now);
          break;
        case 'monthly':
          periodStart = startOfMonth(now);
          break;
      }

      // Fetch aggregated data
      const [capturesRes, alertsRes, fusionRes, devicesRes] = await Promise.all([
        supabase
          .from('rf_signal_captures')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .gte('captured_at', periodStart.toISOString()),
        supabase
          .from('hardware_alerts')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', periodStart.toISOString()),
        supabase
          .from('intelligence_fusion_events')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', periodStart.toISOString()),
        supabase
          .from('hardware_devices')
          .select('*')
          .eq('user_id', user.id),
      ]);

      const alerts = alertsRes.data || [];
      const fusions = fusionRes.data || [];
      const devices = devicesRes.data || [];
      const activeDevices = devices.filter((d: any) => d.is_online).length;

      // Calculate metrics
      const metrics = {
        total_captures: capturesRes.count || 0,
        alerts_generated: alerts.length,
        threats_detected: alerts.filter((a: any) => a.severity === 'critical' || a.severity === 'high').length,
        devices_active: activeDevices,
        uptime_percent: devices.length > 0 ? (activeDevices / devices.length) * 100 : 0,
        avg_response_time_ms: 0,
        fusion_events: fusions.length,
      };

      const alertSummary = {
        by_severity: alerts.reduce((acc: Record<string, number>, a: any) => {
          acc[a.severity] = (acc[a.severity] || 0) + 1;
          return acc;
        }, {}),
        by_type: alerts.reduce((acc: Record<string, number>, a: any) => {
          acc[a.alert_type] = (acc[a.alert_type] || 0) + 1;
          return acc;
        }, {}),
        acknowledgment_rate: alerts.length > 0 
          ? alerts.filter((a: any) => a.is_acknowledged).length / alerts.length * 100 
          : 100,
        avg_resolution_time_hours: 0,
      };

      const fusionSummary = {
        events_count: fusions.length,
        avg_confidence: fusions.length > 0 
          ? fusions.reduce((sum: number, f: any) => sum + (f.confidence_score || 0), 0) / fusions.length 
          : 0,
        threat_breakdown: fusions.reduce((acc: Record<string, number>, f: any) => {
          const level = f.threat_level || 'none';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {}),
      };

      // Insert snapshot
      const { data, error } = await supabase
        .from('hardware_analytics_snapshots')
        .insert({
          user_id: user.id,
          snapshot_type: type,
          period_start: periodStart.toISOString(),
          period_end: now.toISOString(),
          metrics,
          device_stats: {},
          alert_summary: alertSummary,
          fusion_summary: fusionSummary,
          trend_indicators: {
            captures: 'stable',
            alerts: 'stable',
            threats: 'stable',
            confidence: 'stable',
          },
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-analytics-snapshots', user?.id] });
      toast.success('Analytics snapshot generated');
    },
    onError: (error) => {
      toast.error(`Failed to generate snapshot: ${error.message}`);
    },
  });

  // Get latest snapshot by type
  const getLatestSnapshot = useCallback((type: SnapshotType) => {
    return snapshots.find(s => s.snapshot_type === type);
  }, [snapshots]);

  // Calculate aggregate stats
  const aggregateStats = useMemo(() => {
    const latestDaily = getLatestSnapshot('daily');
    
    return {
      totalDevices: deviceMetrics.length,
      activeDevices: deviceMetrics.filter(d => d.uptime_percent > 0).length,
      avgHealthScore: deviceMetrics.length > 0 
        ? deviceMetrics.reduce((sum, d) => sum + d.health_score, 0) / deviceMetrics.length 
        : 0,
      captures24h: deviceMetrics.reduce((sum, d) => sum + d.captures_24h, 0),
      alerts24h: deviceMetrics.reduce((sum, d) => sum + d.alerts_24h, 0),
      latestMetrics: latestDaily?.metrics,
    };
  }, [deviceMetrics, getLatestSnapshot]);

  return {
    snapshots,
    deviceMetrics,
    captureTimeSeries,
    alertTimeSeries,
    aggregateStats,
    isLoading: isLoadingSnapshots || isLoadingDevices,
    // Actions
    generateSnapshot: generateSnapshot.mutate,
    getLatestSnapshot,
    isGenerating: generateSnapshot.isPending,
  };
}
