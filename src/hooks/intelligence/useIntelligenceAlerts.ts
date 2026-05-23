import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface IntelligenceAlert {
  id: string;
  rule_id: string | null;
  profile_id: string | null;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  title: string;
  description: string | null;
  evidence: Record<string, unknown>;
  is_acknowledged: boolean;
  acknowledged_at: string | null;
  is_dismissed: boolean;
  created_at: string;
  profile?: { first_name: string; last_name: string | null };
}

export interface IntelligenceAlertRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  conditions: Record<string, unknown>;
  severity: string;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
}

export interface CreateAlertRuleInput {
  name: string;
  rule_type: string;
  severity: string;
  conditions: Record<string, unknown>;
}

const keys = {
  alerts: (userId?: string) => ['intelligence-alerts', userId] as const,
  rules:  (userId?: string) => ['intelligence-rules',  userId] as const,
};

export function useIntelligenceAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.alerts(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intelligence_alerts')
        .select(`
          *,
          profile:profiles(first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as IntelligenceAlert[];
    },
  });
}

export function useIntelligenceAlertRules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.rules(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intelligence_alert_rules')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as IntelligenceAlertRule[];
    },
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success('Alert acknowledged');
    },
  });
}

export function useDismissAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('intelligence_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success('Alert dismissed');
    },
  });
}

export function useCreateAlertRule() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAlertRuleInput) => {
      const { error } = await supabase.from('intelligence_alert_rules').insert({
        user_id: user!.id,
        name: input.name,
        rule_type: input.rule_type,
        severity: input.severity,
        conditions: input.conditions,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-rules'] });
      toast.success('Alert rule created');
    },
  });
}

export function useToggleAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('intelligence_alert_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-rules'] });
    },
  });
}

export function useProcessAlertRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ rules_processed: number; alerts_triggered: number }> => {
      const { data, error } = await invokeFunction('process-alert-rules');
      if (error) throw error;
      return data as { rules_processed: number; alerts_triggered: number };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['intelligence-alerts'] });
      toast.success(`Processed ${data.rules_processed} rules, triggered ${data.alerts_triggered} alerts`);
    },
    onError: (error: Error) => {
      toast.error('Failed to process rules: ' + error.message);
    },
  });
}
