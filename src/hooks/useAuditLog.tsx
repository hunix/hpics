import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useClearance, ClearanceLevel } from './useClearance';

interface AuditLogEntry {
  id: string;
  sequence_number: number;
  previous_hash: string;
  current_hash: string;
  user_id: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  data_classification: ClearanceLevel | null;
  clearance_used: ClearanceLevel | null;
  ip_address: string | null;
  user_agent: string | null;
  request_metadata: Record<string, any> | null;
  response_status: string | null;
  created_at: string;
}

export function useAuditLog() {
  const { user, session } = useAuth();
  const { hasClearance } = useClearance();
  const queryClient = useQueryClient();

  // Log an audit event
  const logEvent = useCallback(
    async (event: {
      action_type: string;
      resource_type: string;
      resource_id?: string;
      data_classification?: ClearanceLevel;
      metadata?: Record<string, any>;
    }) => {
      if (!user || !session) return null;

      try {
        const { data, error } = await supabase.functions.invoke('log-audit-event', {
          body: event,
        });

        if (error) throw error;

        // Invalidate audit logs cache
        queryClient.invalidateQueries({ queryKey: ['audit-logs'] });

        return data;
      } catch (error) {
        console.error('Failed to log audit event:', error);
        return null;
      }
    },
    [user, session, queryClient]
  );

  // Fetch audit logs (requires SECRET clearance)
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('immutable_audit_logs')
        .select('*')
        .order('sequence_number', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLogEntry[];
    },
    enabled: !!user && hasClearance('secret'),
  });

  // Verify hash chain integrity
  const verifyChain = useCallback(
    async (logs: AuditLogEntry[]): Promise<{ valid: boolean; brokenAt?: number }> => {
      if (!logs || logs.length === 0) {
        return { valid: true };
      }

      // Sort by sequence number ascending
      const sorted = [...logs].sort((a, b) => a.sequence_number - b.sequence_number);

      for (let i = 1; i < sorted.length; i++) {
        const current = sorted[i];
        const previous = sorted[i - 1];

        if (current.previous_hash !== previous.current_hash) {
          console.error(`Chain broken at sequence ${current.sequence_number}`);
          return { valid: false, brokenAt: current.sequence_number };
        }
      }

      return { valid: true };
    },
    []
  );

  // Get logs by resource
  const getLogsByResource = useCallback(
    async (resourceType: string, resourceId: string): Promise<AuditLogEntry[]> => {
      if (!hasClearance('secret')) return [];

      const { data, error } = await supabase
        .from('immutable_audit_logs')
        .select('*')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch resource logs:', error);
        return [];
      }

      return data as AuditLogEntry[];
    },
    [hasClearance]
  );

  // Get logs by user
  const getLogsByUser = useCallback(
    async (userId: string): Promise<AuditLogEntry[]> => {
      if (!hasClearance('secret')) return [];

      const { data, error } = await supabase
        .from('immutable_audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Failed to fetch user logs:', error);
        return [];
      }

      return data as AuditLogEntry[];
    },
    [hasClearance]
  );

  // Get audit summary statistics
  const getAuditSummary = useCallback(() => {
    if (!auditLogs) return null;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentLogs = auditLogs.filter(
      (log) => new Date(log.created_at) > last24h
    );
    const weekLogs = auditLogs.filter(
      (log) => new Date(log.created_at) > last7d
    );

    // Count by action type
    const actionCounts: Record<string, number> = {};
    for (const log of recentLogs) {
      actionCounts[log.action_type] = (actionCounts[log.action_type] || 0) + 1;
    }

    // Count by classification
    const classificationCounts: Record<string, number> = {};
    for (const log of recentLogs) {
      const cls = log.data_classification || 'unclassified';
      classificationCounts[cls] = (classificationCounts[cls] || 0) + 1;
    }

    return {
      total: auditLogs.length,
      last24h: recentLogs.length,
      last7d: weekLogs.length,
      actionCounts,
      classificationCounts,
    };
  }, [auditLogs]);

  return {
    logEvent,
    auditLogs,
    isLoading,
    verifyChain,
    getLogsByResource,
    getLogsByUser,
    getAuditSummary,
    canViewLogs: hasClearance('secret'),
  };
}
