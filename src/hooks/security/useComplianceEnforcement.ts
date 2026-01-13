// Compliance Enforcement Hook - Rule validation with DB persistence
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';
type ViolationStatus = 'open' | 'acknowledged' | 'resolved' | 'ignored';

interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  severity: ViolationSeverity;
  entityTypes: string[];
  validate: (entity: Record<string, unknown>) => boolean | string;
  autoResolve?: boolean;
}

interface ComplianceViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  entityType: string;
  entityId?: string;
  severity: ViolationSeverity;
  description: string;
  status: ViolationStatus;
  detectedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

interface ComplianceState {
  violations: ComplianceViolation[];
  isChecking: boolean;
  lastCheckAt: string | null;
}

// Built-in compliance rules
const defaultRules: ComplianceRule[] = [
  {
    id: 'data-retention',
    name: 'Data Retention Policy',
    description: 'Data must not exceed retention period',
    severity: 'high',
    entityTypes: ['profile', 'document', 'media'],
    validate: (entity) => {
      const createdAt = entity.created_at as string;
      if (!createdAt) return true;
      const age = Date.now() - new Date(createdAt).getTime();
      const maxAge = 365 * 24 * 60 * 60 * 1000 * 7; // 7 years
      return age <= maxAge || 'Data exceeds maximum retention period';
    },
  },
  {
    id: 'pii-protection',
    name: 'PII Protection',
    description: 'Personal information must be properly secured',
    severity: 'critical',
    entityTypes: ['profile'],
    validate: (entity) => {
      // Check for unencrypted sensitive fields
      const sensitiveFields = ['ssn', 'social_security', 'passport'];
      for (const field of sensitiveFields) {
        if (entity[field] && typeof entity[field] === 'string') {
          return `Unprotected sensitive field: ${field}`;
        }
      }
      return true;
    },
  },
  {
    id: 'consent-required',
    name: 'Consent Verification',
    description: 'User consent must be obtained for data processing',
    severity: 'high',
    entityTypes: ['profile'],
    validate: (entity) => {
      if (entity.requires_consent && !entity.consent_given) {
        return 'Missing required consent for data processing';
      }
      return true;
    },
  },
  {
    id: 'access-logging',
    name: 'Access Logging',
    description: 'Sensitive data access must be logged',
    severity: 'medium',
    entityTypes: ['document', 'media'],
    validate: (entity) => {
      if (entity.is_sensitive && !entity.access_logged) {
        return 'Sensitive data access not being logged';
      }
      return true;
    },
  },
];

export function useComplianceEnforcement(customRules?: ComplianceRule[]) {
  const { user } = useAuth();
  const rules = [...defaultRules, ...(customRules || [])];
  
  const [state, setState] = useState<ComplianceState>({
    violations: [],
    isChecking: false,
    lastCheckAt: null,
  });

  // Generate violation ID
  const generateId = () => `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  // Persist violation to database
  const persistViolation = useCallback(async (violation: ComplianceViolation): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('compliance_violations')
        .insert({
          user_id: user.id,
          rule_id: violation.ruleId,
          entity_type: violation.entityType,
          entity_id: violation.entityId,
          severity: violation.severity,
          description: violation.description,
          status: violation.status,
        });
    } catch (error) {
      console.error('Failed to persist violation:', error);
    }
  }, [user]);

  // Check single entity against all applicable rules
  const checkEntity = useCallback(async (
    entityType: string,
    entity: Record<string, unknown>,
    entityId?: string
  ): Promise<ComplianceViolation[]> => {
    const violations: ComplianceViolation[] = [];
    const applicableRules = rules.filter(r => r.entityTypes.includes(entityType));

    for (const rule of applicableRules) {
      const result = rule.validate(entity);
      
      if (result !== true) {
        const violation: ComplianceViolation = {
          id: generateId(),
          ruleId: rule.id,
          ruleName: rule.name,
          entityType,
          entityId,
          severity: rule.severity,
          description: typeof result === 'string' ? result : rule.description,
          status: 'open',
          detectedAt: new Date().toISOString(),
        };
        
        violations.push(violation);
        await persistViolation(violation);
      }
    }

    setState(prev => ({
      ...prev,
      violations: [...prev.violations, ...violations],
      lastCheckAt: new Date().toISOString(),
    }));

    return violations;
  }, [rules, persistViolation]);

  // Batch check multiple entities
  const checkEntities = useCallback(async (
    entityType: string,
    entities: Array<Record<string, unknown> & { id?: string }>
  ): Promise<ComplianceViolation[]> => {
    setState(prev => ({ ...prev, isChecking: true }));
    
    const allViolations: ComplianceViolation[] = [];
    
    for (const entity of entities) {
      const violations = await checkEntity(entityType, entity, entity.id);
      allViolations.push(...violations);
    }
    
    setState(prev => ({ ...prev, isChecking: false }));
    
    return allViolations;
  }, [checkEntity]);

  // Resolve a violation
  const resolveViolation = useCallback(async (
    violationId: string,
    notes?: string
  ): Promise<void> => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      violations: prev.violations.map(v => 
        v.id === violationId
          ? { ...v, status: 'resolved' as ViolationStatus, resolvedAt: new Date().toISOString(), resolutionNotes: notes }
          : v
      ),
    }));

    // Update in database
    try {
      await supabase
        .from('compliance_violations')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq('user_id', user.id)
        .eq('rule_id', state.violations.find(v => v.id === violationId)?.ruleId);
    } catch (error) {
      console.error('Failed to update violation:', error);
    }
  }, [user, state.violations]);

  // Acknowledge a violation (mark as seen but not resolved)
  const acknowledgeViolation = useCallback(async (violationId: string): Promise<void> => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      violations: prev.violations.map(v => 
        v.id === violationId ? { ...v, status: 'acknowledged' as ViolationStatus } : v
      ),
    }));

    try {
      await supabase
        .from('compliance_violations')
        .update({ status: 'acknowledged' })
        .eq('user_id', user.id)
        .eq('rule_id', state.violations.find(v => v.id === violationId)?.ruleId);
    } catch (error) {
      console.error('Failed to update violation:', error);
    }
  }, [user, state.violations]);

  // Ignore a violation
  const ignoreViolation = useCallback(async (violationId: string): Promise<void> => {
    if (!user) return;

    setState(prev => ({
      ...prev,
      violations: prev.violations.map(v => 
        v.id === violationId ? { ...v, status: 'ignored' as ViolationStatus } : v
      ),
    }));

    try {
      await supabase
        .from('compliance_violations')
        .update({ status: 'ignored' })
        .eq('user_id', user.id)
        .eq('rule_id', state.violations.find(v => v.id === violationId)?.ruleId);
    } catch (error) {
      console.error('Failed to update violation:', error);
    }
  }, [user, state.violations]);

  // Load violations from database
  const loadViolations = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('compliance_violations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'acknowledged'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const violations: ComplianceViolation[] = data.map(row => ({
          id: row.id,
          ruleId: row.rule_id,
          ruleName: rules.find(r => r.id === row.rule_id)?.name || row.rule_id,
          entityType: row.entity_type,
          entityId: row.entity_id || undefined,
          severity: row.severity as ViolationSeverity,
          description: row.description || '',
          status: row.status as ViolationStatus,
          detectedAt: row.created_at,
          resolvedAt: row.resolved_at || undefined,
          resolutionNotes: row.resolution_notes || undefined,
        }));

        setState(prev => ({ ...prev, violations }));
      }
    } catch (error) {
      console.error('Failed to load violations:', error);
    }
  }, [user, rules]);

  // Get violations by severity
  const getViolationsBySeverity = useCallback((severity: ViolationSeverity): ComplianceViolation[] => {
    return state.violations.filter(v => v.severity === severity && v.status === 'open');
  }, [state.violations]);

  // Get open violations count
  const openViolationsCount = state.violations.filter(v => v.status === 'open').length;
  const criticalViolationsCount = state.violations.filter(v => v.status === 'open' && v.severity === 'critical').length;

  return {
    state,
    rules,
    checkEntity,
    checkEntities,
    resolveViolation,
    acknowledgeViolation,
    ignoreViolation,
    loadViolations,
    getViolationsBySeverity,
    openViolationsCount,
    criticalViolationsCount,
    isCompliant: openViolationsCount === 0,
    hasCriticalViolations: criticalViolationsCount > 0,
  };
}

export type { ComplianceRule, ComplianceViolation, ViolationSeverity, ViolationStatus };
