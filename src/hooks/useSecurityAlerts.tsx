import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  user_id: string;
  alert_type: string;
  category: string;
  severity: string;
  description: string;
  metadata: Record<string, any>;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  created_at: string;
}

export function useSecurityAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch unacknowledged alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['security-alerts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as SecurityAlert[];
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Acknowledge an alert
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      toast.success('Alert acknowledged');
    },
  });

  // Create a new alert
  const createAlert = useCallback(
    async (alert: {
      alert_type: string;
      category: string;
      severity: string;
      description: string;
      metadata?: Record<string, any>;
    }) => {
      if (!user) return;

      const { error } = await supabase.from('security_alerts').insert({
        user_id: user.id,
        ...alert,
        metadata: alert.metadata || {},
      });

      if (error) {
        console.error('Failed to create security alert:', error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
      }
    },
    [user, queryClient]
  );

  // Get alert counts by severity
  const alertCounts = {
    critical: alerts?.filter((a) => a.severity === 'critical').length || 0,
    high: alerts?.filter((a) => a.severity === 'high').length || 0,
    medium: alerts?.filter((a) => a.severity === 'medium').length || 0,
    low: alerts?.filter((a) => a.severity === 'low').length || 0,
    total: alerts?.length || 0,
  };

  return {
    alerts,
    alertCounts,
    isLoading,
    acknowledgeAlert: acknowledgeMutation.mutate,
    createAlert,
    hasCriticalAlerts: alertCounts.critical > 0,
  };
}
