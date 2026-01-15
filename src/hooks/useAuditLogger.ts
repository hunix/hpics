/**
 * Audit Logger Hook
 * AGIS Phase 6 - Immutable audit chain for security-sensitive operations
 */

import { useCallback, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AuditAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'access_denied'
  | 'technique_deployed'
  | 'analysis_run'
  | 'data_fusion'
  | 'correlation_detected'
  | 'vulnerability_accessed'
  | 'script_generated'
  | 'campaign_started'
  | 'campaign_ended';

export type AuditDomain =
  | 'trauma_exploitation'
  | 'addiction_formation'
  | 'coercive_control'
  | 'identity_destabilization'
  | 'learned_helplessness'
  | 'stockholm_syndrome'
  | 'cult_tactics'
  | 'breaking_point'
  | 'dependency_orchestration'
  | 'data_fusion'
  | 'mice_analysis'
  | 'betrayal_prediction'
  | 'semantic_warfare'
  | 'memetic_engineering'
  | 'general';

export interface AuditEntry {
  id: string;
  userId: string;
  action: AuditAction;
  domain: AuditDomain;
  profileId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  previousHash: string | null;
  entryHash: string;
  createdAt: Date;
}

export interface AuditLogOptions {
  action: AuditAction;
  domain: AuditDomain;
  profileId?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Simple hash function for audit chain (in production, use crypto)
function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export function useAuditLogger() {
  const { user } = useAuth();
  const lastHashRef = useRef<string | null>(null);

  // Fetch recent audit entries
  const auditQuery = useQuery({
    queryKey: ['audit-log', user?.id],
    queryFn: async (): Promise<AuditEntry[]> => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from('immutable_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      return (data || []).map((entry: Record<string, unknown>) => ({
        id: entry.id as string,
        userId: entry.user_id as string,
        action: entry.action_type as AuditAction,
        domain: (entry.entity_type as AuditDomain) || 'general',
        profileId: entry.entity_id as string | undefined,
        details: (entry.changes as Record<string, unknown>) || {},
        previousHash: entry.previous_hash as string | null,
        entryHash: entry.entry_hash as string,
        createdAt: new Date(entry.created_at as string),
      }));
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get last hash for chain continuity
  const getLastHash = useCallback(async (): Promise<string | null> => {
    if (lastHashRef.current) return lastHashRef.current;

    if (!user?.id) return null;

    const { data } = await supabase
      .from('immutable_audit_logs')
      .select('metadata')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hash = (data?.metadata as Record<string, unknown>)?.entry_hash as string | null;
    lastHashRef.current = hash;
    return hash;
  }, [user?.id]);

  // Log audit entry mutation
  const logMutation = useMutation({
    mutationFn: async (options: AuditLogOptions): Promise<AuditEntry | null> => {
      if (!user?.id) return null;

      const previousHash = await getLastHash();
      
      // Create entry content for hashing
      const entryContent = JSON.stringify({
        userId: user.id,
        action: options.action,
        domain: options.domain,
        profileId: options.profileId,
        details: options.details || {},
        previousHash,
        timestamp: new Date().toISOString(),
      });

      const entryHash = simpleHash(entryContent);

      const { data, error } = await supabase
        .from('immutable_audit_logs')
        .insert({
          user_id: user.id,
          action_type: options.action,
          entity_type: options.domain,
          entity_id: options.profileId,
          changes: options.details || {},
          metadata: { previous_hash: previousHash, entry_hash: entryHash, ...(options.metadata || {}) },
        } as never)
        .select()
        .single();

      if (error) {
        console.error('Audit log error:', error);
        return null;
      }

      // Update last hash reference
      lastHashRef.current = entryHash;

      return {
        id: data.id,
        userId: user.id,
        action: options.action,
        domain: options.domain,
        profileId: options.profileId,
        details: options.details || {},
        previousHash,
        entryHash,
        createdAt: new Date(),
      };
    },
  });

  // Convenience logging functions
  const logView = useCallback((domain: AuditDomain, profileId?: string, details?: Record<string, unknown>) => {
    return logMutation.mutateAsync({ action: 'view', domain, profileId, details });
  }, [logMutation]);

  const logTechniqueDeployed = useCallback((
    domain: AuditDomain, 
    profileId: string, 
    techniqueName: string,
    details?: Record<string, unknown>
  ) => {
    return logMutation.mutateAsync({
      action: 'technique_deployed',
      domain,
      profileId,
      details: { techniqueName, ...details },
    });
  }, [logMutation]);

  const logAnalysisRun = useCallback((
    domain: AuditDomain,
    profileId: string,
    analysisType: string,
    details?: Record<string, unknown>
  ) => {
    return logMutation.mutateAsync({
      action: 'analysis_run',
      domain,
      profileId,
      details: { analysisType, ...details },
    });
  }, [logMutation]);

  const logAccessDenied = useCallback((
    domain: AuditDomain,
    reason: string,
    details?: Record<string, unknown>
  ) => {
    return logMutation.mutateAsync({
      action: 'access_denied',
      domain,
      details: { reason, ...details },
    });
  }, [logMutation]);

  const logScriptGenerated = useCallback((
    domain: AuditDomain,
    profileId: string,
    scriptType: string,
    details?: Record<string, unknown>
  ) => {
    return logMutation.mutateAsync({
      action: 'script_generated',
      domain,
      profileId,
      details: { scriptType, ...details },
    });
  }, [logMutation]);

  const logDataFusion = useCallback((
    profileId: string,
    sourcesUsed: string[],
    correlationsFound: number,
    details?: Record<string, unknown>
  ) => {
    return logMutation.mutateAsync({
      action: 'data_fusion',
      domain: 'data_fusion',
      profileId,
      details: { sourcesUsed, correlationsFound, ...details },
    });
  }, [logMutation]);

  // Verify audit chain integrity
  const verifyChain = useCallback(async (): Promise<{
    valid: boolean;
    brokenAt?: string;
    totalEntries: number;
    validEntries: number;
  }> => {
    if (!user?.id) {
      return { valid: false, totalEntries: 0, validEntries: 0 };
    }

    const { data } = await supabase
      .from('immutable_audit_logs')
      .select('id, metadata, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      return { valid: true, totalEntries: 0, validEntries: 0 };
    }

    let validEntries = 0;
    let brokenAt: string | undefined;

    for (let i = 0; i < data.length; i++) {
      const entry = data[i];
      const metadata = entry.metadata as Record<string, unknown> | null;
      const entryHash = metadata?.entry_hash as string | undefined;
      const previousHash = metadata?.previous_hash as string | null | undefined;
      const prevMetadata = i > 0 ? (data[i - 1].metadata as Record<string, unknown> | null) : null;
      const expectedPreviousHash = i === 0 ? null : prevMetadata?.entry_hash as string | undefined;

      if (previousHash === expectedPreviousHash) {
        validEntries++;
      } else if (!brokenAt) {
        brokenAt = entry.id;
      }
    }

    return {
      valid: validEntries === data.length,
      brokenAt,
      totalEntries: data.length,
      validEntries,
    };
  }, [user?.id]);

  return {
    // Queries
    auditEntries: auditQuery.data || [],
    isLoading: auditQuery.isLoading,

    // Generic log
    log: logMutation.mutateAsync,
    isLogging: logMutation.isPending,

    // Convenience methods
    logView,
    logTechniqueDeployed,
    logAnalysisRun,
    logAccessDenied,
    logScriptGenerated,
    logDataFusion,

    // Chain verification
    verifyChain,
  };
}
