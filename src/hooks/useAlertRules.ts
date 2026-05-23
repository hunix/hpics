import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { invokeFunction } from '@/lib/api';

export type RuleType = 'threshold' | 'pattern' | 'anomaly' | 'schedule';

export interface AlertRuleConditions {
  device_type?: string;
  metric?: string;
  operator?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  threshold?: number;
  pattern?: string;
}

export interface AlertRuleActions {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  notification_channels?: ('in_app' | 'push' | 'email')[];
  auto_resolve?: boolean;
  cooldown_minutes?: number;
}

export interface AlertRule {
  id: string;
  user_id: string;
  rule_name: string;
  rule_type: RuleType;
  conditions: AlertRuleConditions;
  actions: AlertRuleActions;
  is_active: boolean;
  priority: number;
  cooldown_minutes: number;
  last_triggered_at?: string;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAlertRuleParams {
  rule_name: string;
  rule_type?: RuleType;
  conditions: AlertRuleConditions;
  actions?: AlertRuleActions;
  is_active?: boolean;
  priority?: number;
  cooldown_minutes?: number;
}

export function useAlertRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch alert rules
  const { data: rules, isLoading, error } = useQuery({
    queryKey: ['alert-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        conditions: r.conditions as AlertRuleConditions,
        actions: r.actions as AlertRuleActions,
      })) as AlertRule[];
    },
    enabled: !!user?.id,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('alert-rules-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alert_rules',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Create rule mutation
  const createRule = useMutation({
    mutationFn: async (params: CreateAlertRuleParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          rule_name: params.rule_name,
          rule_type: params.rule_type || 'threshold',
          conditions: params.conditions as any,
          actions: (params.actions || { severity: 'medium', notification_channels: ['in_app'] }) as any,
          is_active: params.is_active ?? true,
          priority: params.priority ?? 5,
          cooldown_minutes: params.cooldown_minutes ?? 15,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule created');
    },
    onError: (error) => {
      toast.error('Failed to create rule', { description: error.message });
    },
  });

  // Update rule mutation
  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AlertRule> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const updateData: any = { ...updates, updated_at: new Date().toISOString() };
      if (updates.conditions) updateData.conditions = updates.conditions as any;
      if (updates.actions) updateData.actions = updates.actions as any;

      const { data, error } = await supabase
        .from('alert_rules')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule updated');
    },
    onError: (error) => {
      toast.error('Failed to update rule', { description: error.message });
    },
  });

  // Toggle rule active state
  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('alert_rules')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success(variables.is_active ? 'Rule activated' : 'Rule deactivated');
    },
  });

  // Delete rule mutation
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', ruleId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete rule', { description: error.message });
    },
  });

  // Process telemetry through rules (via edge function)
  const processTelemetry = useMutation({
    mutationFn: async (telemetry: {
      device_id: string;
      device_type: string;
      metrics: Record<string, number>;
    }) => {
      const { data, error } = await invokeFunction('alert-service', telemetry,);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.alerts_triggered > 0) {
        queryClient.invalidateQueries({ queryKey: ['hardware-alerts'] });
        toast.warning(`${data.alerts_triggered} alert(s) triggered`);
      }
    },
  });

  // Stats
  const activeRules = (rules || []).filter(r => r.is_active);
  const stats = {
    totalRules: rules?.length || 0,
    activeRules: activeRules.length,
    inactiveRules: (rules?.length || 0) - activeRules.length,
    totalTriggers: rules?.reduce((sum, r) => sum + r.trigger_count, 0) || 0,
    byType: {
      threshold: rules?.filter(r => r.rule_type === 'threshold').length || 0,
      pattern: rules?.filter(r => r.rule_type === 'pattern').length || 0,
      anomaly: rules?.filter(r => r.rule_type === 'anomaly').length || 0,
      schedule: rules?.filter(r => r.rule_type === 'schedule').length || 0,
    },
  };

  return {
    rules,
    activeRules,
    stats,
    isLoading,
    error,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    toggleRule: toggleRule.mutate,
    deleteRule: deleteRule.mutate,
    processTelemetry: processTelemetry.mutate,
    isProcessing: processTelemetry.isPending,
  };
}
