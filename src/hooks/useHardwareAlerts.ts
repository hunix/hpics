import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertType = 
  | 'device_offline' 
  | 'anomaly_detected' 
  | 'threat_identified' 
  | 'signal_interference' 
  | 'battery_low' 
  | 'connection_lost'
  | 'sweep_complete'
  | 'mission_update'
  | 'sensor_threshold';

export interface HardwareAlert {
  id: string;
  user_id: string;
  device_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  source_data: Record<string, unknown>;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  auto_resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertParams {
  device_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  description?: string;
  source_data?: Record<string, unknown>;
}

export function useHardwareAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch unacknowledged alerts
  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['hardware-alerts', user?.id],
    queryFn: async (): Promise<HardwareAlert[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('hardware_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as unknown as HardwareAlert[];
    },
    enabled: !!user?.id,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch all alerts including acknowledged
  const { data: allAlerts = [] } = useQuery({
    queryKey: ['hardware-alerts-all', user?.id],
    queryFn: async (): Promise<HardwareAlert[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('hardware_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return (data || []) as unknown as HardwareAlert[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for new alerts
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('hardware-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hardware_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newAlert = payload.new as HardwareAlert;
          queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user.id] });
          
          // Show toast for critical/high alerts
          if (newAlert.severity === 'critical') {
            toast.error(`🚨 CRITICAL: ${newAlert.title}`, {
              description: newAlert.description || undefined,
              duration: 10000,
            });
          } else if (newAlert.severity === 'high') {
            toast.warning(`⚠️ ${newAlert.title}`, {
              description: newAlert.description || undefined,
              duration: 7000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'hardware_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user.id] });
          queryClient.invalidateQueries({ queryKey: ['hardware-alerts-all', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Create new alert
  const createAlert = useMutation({
    mutationFn: async (params: CreateAlertParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hardware_alerts')
        .insert({
          user_id: user.id,
          device_id: params.device_id || null,
          alert_type: params.alert_type,
          severity: params.severity,
          title: params.title,
          description: params.description || null,
          source_data: params.source_data || {},
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user?.id] });
    },
    onError: (error) => {
      toast.error(`Failed to create alert: ${error.message}`);
    },
  });

  // Acknowledge alert
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('hardware_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.email || user.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts-all', user?.id] });
      toast.success('Alert acknowledged');
    },
  });

  // Acknowledge all alerts
  const acknowledgeAll = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('hardware_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user.email || user.id,
        })
        .eq('user_id', user.id)
        .eq('is_acknowledged', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts-all', user?.id] });
      toast.success('All alerts acknowledged');
    },
  });

  // Resolve alert with notes
  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: string; notes: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('hardware_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['hardware-alerts-all', user?.id] });
      toast.success('Alert resolved');
    },
  });

  // Delete old alerts
  const clearOldAlerts = useCallback(async (daysOld: number = 30) => {
    if (!user?.id) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await supabase
      .from('hardware_alerts')
      .delete()
      .eq('user_id', user.id)
      .eq('is_acknowledged', true)
      .lt('created_at', cutoffDate.toISOString());

    queryClient.invalidateQueries({ queryKey: ['hardware-alerts-all', user?.id] });
  }, [user?.id, queryClient]);

  // Categorize alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const highAlerts = alerts.filter(a => a.severity === 'high');
  const mediumAlerts = alerts.filter(a => a.severity === 'medium');
  const lowAlerts = alerts.filter(a => a.severity === 'low');

  // Alert counts by type
  const alertsByType = alerts.reduce((acc, alert) => {
    const type = alert.alert_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {} as Record<AlertType, HardwareAlert[]>);

  return {
    alerts,
    allAlerts,
    isLoading,
    error,
    // Categorized
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    alertsByType,
    // Counts
    totalUnacknowledged: alerts.length,
    criticalCount: criticalAlerts.length,
    hasCritical: criticalAlerts.length > 0,
    // Actions
    createAlert: createAlert.mutate,
    acknowledgeAlert: acknowledgeAlert.mutate,
    acknowledgeAll: acknowledgeAll.mutate,
    resolveAlert: resolveAlert.mutate,
    clearOldAlerts,
    isCreating: createAlert.isPending,
    isAcknowledging: acknowledgeAlert.isPending,
  };
}
