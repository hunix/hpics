import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useCallback, useEffect } from 'react';

export interface DeviceHealthCheck {
  id: string;
  device_id: string;
  user_id: string;
  check_type: 'battery' | 'connectivity' | 'performance' | 'full';
  health_score: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    battery_level?: number;
    signal_strength?: number;
    uptime_hours?: number;
    error_count?: number;
    response_time_ms?: number;
  };
  issues_detected: string[];
  recommendations: string[];
  next_check_at?: string;
  created_at: string;
}

export interface DeviceHealthSummary {
  device_id: string;
  device_name: string;
  device_type: string;
  current_status: 'healthy' | 'warning' | 'critical';
  health_score: number;
  battery_level?: number;
  last_health_check_at?: string;
  maintenance_due_at?: string;
  issues_count: number;
}

export function useDeviceHealthMonitoring() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all health checks
  const { data: healthChecks, isLoading: isLoadingChecks, error: checksError } = useQuery({
    queryKey: ['device-health-checks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('device_health_checks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DeviceHealthCheck[];
    },
    enabled: !!user?.id,
  });

  // Fetch devices with health status
  const { data: devicesWithHealth, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices-with-health', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('hardware_devices')
        .select('id, device_name, device_type, is_online, battery_level, health_status, last_health_check_at, maintenance_due_at')
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Get latest health check for each device
      const { data: latestChecks } = await supabase
        .from('device_health_checks')
        .select('device_id, health_score, issues_detected')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const checksMap = (latestChecks || []).reduce((acc, check) => {
        const key = check.device_id;
        if (key && !acc[key]) {
          acc[key] = check;
        }
        return acc;
      }, {} as Record<string, any>);

      return (data || []).map(device => ({
        device_id: device.id,
        device_name: device.device_name,
        device_type: device.device_type,
        current_status: (device.health_status || 'healthy') as 'healthy' | 'warning' | 'critical',
        health_score: checksMap[device.id]?.health_score || 100,
        battery_level: device.battery_level,
        last_health_check_at: device.last_health_check_at,
        maintenance_due_at: device.maintenance_due_at,
        issues_count: checksMap[device.id]?.issues_detected?.length || 0,
      })) as DeviceHealthSummary[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription for health updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('device-health-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_health_checks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['device-health-checks'] });
          queryClient.invalidateQueries({ queryKey: ['devices-with-health'] });
          
          if (payload.eventType === 'INSERT') {
            const check = payload.new as DeviceHealthCheck;
            if (check.status === 'critical') {
              toast.error(`Critical health issue detected`, {
                description: `Device requires immediate attention`,
              });
            } else if (check.status === 'warning') {
              toast.warning(`Health warning detected`, {
                description: `Device health score: ${check.health_score}%`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Run health check mutation
  const runHealthCheck = useMutation({
    mutationFn: async ({ deviceId, checkType = 'full' }: { deviceId: string; checkType?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get device info
      const { data: device, error: deviceError } = await supabase
        .from('hardware_devices')
        .select('*')
        .eq('id', deviceId)
        .eq('user_id', user.id)
        .single();

      if (deviceError) throw deviceError;

      // Health check uses only telemetry that's actually present on
      // the device row. We don't fabricate battery/signal/uptime
      // numbers when the device hasn't reported them — undefined
      // values are skipped from the score calculation entirely so the
      // health score reflects measured signal, not Math.random()
      // padding.
      const batteryLevel = device.battery_level ?? null;
      const signalStrength = device.signal_strength ?? null;
      // device_health_checks.metrics stores only what we measured.
      const metrics: Record<string, number | string | null> = {
        battery_level: batteryLevel,
        signal_strength: signalStrength,
      };

      // Calculate health score using only available signal. Each
      // contributing factor's max penalty is proportional so missing
      // data doesn't unfairly inflate health.
      let healthScore = 100;
      const issuesDetected: string[] = [];
      const recommendations: string[] = [];

      if (batteryLevel !== null) {
        if (batteryLevel < 20) {
          healthScore -= 30;
          issuesDetected.push('Critical battery level');
          recommendations.push('Charge device immediately');
        } else if (batteryLevel < 50) {
          healthScore -= 10;
          issuesDetected.push('Low battery level');
          recommendations.push('Consider charging device');
        }
      }

      if (signalStrength !== null) {
        if (signalStrength < 30) {
          healthScore -= 25;
          issuesDetected.push('Poor signal strength');
          recommendations.push('Check antenna or relocate device');
        } else if (signalStrength < 60) {
          healthScore -= 10;
          issuesDetected.push('Moderate signal strength');
        }
      }

      if (!device.is_online) {
        healthScore -= 40;
        issuesDetected.push('Device is offline');
        recommendations.push('Check power and network connection');
      }

      // If we have neither battery nor signal nor an offline signal,
      // we can't honestly score the device. Surface that to the user.
      if (batteryLevel === null && signalStrength === null && device.is_online) {
        issuesDetected.push('No telemetry — device has not reported metrics');
        recommendations.push('Verify the device agent is running and reporting');
      }

      healthScore = Math.max(0, healthScore);
      const status = healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical';

      // Create health check record
      const { data: healthCheck, error } = await supabase
        .from('device_health_checks')
        .insert({
          device_id: deviceId,
          user_id: user.id,
          check_type: checkType,
          health_score: healthScore,
          status,
          metrics,
          issues_detected: issuesDetected,
          recommendations,
          next_check_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update device health status. Only write battery_level back if
      // we actually have a measured value — otherwise leave the column
      // alone.
      const updatePayload: Record<string, unknown> = {
        health_status: status,
        last_health_check_at: new Date().toISOString(),
      };
      if (batteryLevel !== null) updatePayload.battery_level = batteryLevel;

      await supabase
        .from('hardware_devices')
        .update(updatePayload)
        .eq('id', deviceId);

      return healthCheck;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['device-health-checks'] });
      queryClient.invalidateQueries({ queryKey: ['devices-with-health'] });
      queryClient.invalidateQueries({ queryKey: ['hardware-devices'] });
      toast.success('Health check completed', {
        description: `Health score: ${data.health_score}%`,
      });
    },
    onError: (error) => {
      toast.error('Health check failed', { description: error.message });
    },
  });

  // Schedule maintenance mutation
  const scheduleMaintenance = useMutation({
    mutationFn: async ({ deviceId, maintenanceDate }: { deviceId: string; maintenanceDate: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('hardware_devices')
        .update({ maintenance_due_at: maintenanceDate })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { deviceId, maintenanceDate };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices-with-health'] });
      toast.success('Maintenance scheduled');
    },
    onError: (error) => {
      toast.error('Failed to schedule maintenance', { description: error.message });
    },
  });

  // Get health history for a device
  const getHealthHistory = useCallback(async (deviceId: string, days: number = 30) => {
    if (!user?.id) return [];
    
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('device_health_checks')
      .select('*')
      .eq('device_id', deviceId)
      .eq('user_id', user.id)
      .gte('created_at', startDate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as DeviceHealthCheck[];
  }, [user?.id]);

  // Get devices needing attention
  const devicesNeedingAttention = (devicesWithHealth || []).filter(
    d => d.current_status !== 'healthy' || d.issues_count > 0
  );

  const devicesNeedingMaintenance = (devicesWithHealth || []).filter(
    d => d.maintenance_due_at && new Date(d.maintenance_due_at) <= new Date()
  );

  // Stats
  const stats = {
    totalDevices: devicesWithHealth?.length || 0,
    healthyDevices: devicesWithHealth?.filter(d => d.current_status === 'healthy').length || 0,
    warningDevices: devicesWithHealth?.filter(d => d.current_status === 'warning').length || 0,
    criticalDevices: devicesWithHealth?.filter(d => d.current_status === 'critical').length || 0,
    averageHealthScore: devicesWithHealth?.length 
      ? Math.round(devicesWithHealth.reduce((sum, d) => sum + d.health_score, 0) / devicesWithHealth.length)
      : 100,
    lowBatteryDevices: devicesWithHealth?.filter(d => (d.battery_level || 100) < 20).length || 0,
  };

  return {
    healthChecks,
    devicesWithHealth,
    devicesNeedingAttention,
    devicesNeedingMaintenance,
    stats,
    isLoading: isLoadingChecks || isLoadingDevices,
    error: checksError,
    runHealthCheck: runHealthCheck.mutate,
    isRunningCheck: runHealthCheck.isPending,
    scheduleMaintenance: scheduleMaintenance.mutate,
    getHealthHistory,
  };
}
