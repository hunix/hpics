// Compliance Enforcement Engine
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type ViolationSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ViolationStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'escalated' | 'waived';
export type ComplianceCategory = 'data_protection' | 'access_control' | 'document_retention' | 'financial' | 'regulatory' | 'custom';

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: ComplianceCategory;
  severity: ViolationSeverity;
  check: (data: Record<string, unknown>) => Promise<ComplianceCheckResult>;
  autoResolve?: (data: Record<string, unknown>) => Promise<boolean>;
}

export interface ComplianceCheckResult {
  passed: boolean;
  violations: ComplianceViolation[];
  warnings: string[];
  metadata?: Record<string, unknown>;
}

export interface ComplianceViolation {
  ruleId: string;
  ruleName: string;
  category: ComplianceCategory;
  severity: ViolationSeverity;
  description: string;
  affectedEntity: {
    type: string;
    id: string;
    name?: string;
  };
  detectedAt: Date;
  evidence?: Record<string, unknown>;
  suggestedAction?: string;
}

export interface StoredViolation extends ComplianceViolation {
  id: string;
  status: ViolationStatus;
  assignedTo?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  escalatedAt?: Date;
  escalatedTo?: string;
  waivedAt?: Date;
  waivedBy?: string;
  waiverReason?: string;
}

// Built-in compliance rules
const createDataProtectionRules = (): ComplianceRule[] => [
  {
    id: 'dp_001',
    name: 'Sensitive Data Encryption',
    description: 'Ensure sensitive data fields are encrypted',
    category: 'data_protection',
    severity: 'high',
    check: async (data) => {
      const sensitiveFields = ['ssn', 'tax_id', 'bank_account', 'credit_card'];
      const violations: ComplianceViolation[] = [];
      
      for (const field of sensitiveFields) {
        if (data[field] && typeof data[field] === 'string' && !data[field].toString().startsWith('enc:')) {
          violations.push({
            ruleId: 'dp_001',
            ruleName: 'Sensitive Data Encryption',
            category: 'data_protection',
            severity: 'high',
            description: `Unencrypted sensitive field detected: ${field}`,
            affectedEntity: { type: 'field', id: field },
            detectedAt: new Date(),
            suggestedAction: 'Encrypt this field before storage',
          });
        }
      }
      
      return { passed: violations.length === 0, violations, warnings: [] };
    },
  },
  {
    id: 'dp_002',
    name: 'Data Retention Policy',
    description: 'Ensure data does not exceed retention period',
    category: 'document_retention',
    severity: 'medium',
    check: async (data) => {
      const violations: ComplianceViolation[] = [];
      const warnings: string[] = [];
      
      if (data.createdAt) {
        const createdDate = new Date(data.createdAt as string);
        const retentionDays = (data.retentionDays as number) || 365 * 7; // Default 7 years
        const expiryDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        
        if (now > expiryDate) {
          violations.push({
            ruleId: 'dp_002',
            ruleName: 'Data Retention Policy',
            category: 'document_retention',
            severity: 'medium',
            description: 'Data has exceeded retention period',
            affectedEntity: { type: 'record', id: data.id as string },
            detectedAt: new Date(),
            evidence: { createdAt: data.createdAt, expiryDate: expiryDate.toISOString() },
            suggestedAction: 'Archive or delete this record per retention policy',
          });
        } else {
          const warningThreshold = 30 * 24 * 60 * 60 * 1000; // 30 days
          if (expiryDate.getTime() - now.getTime() < warningThreshold) {
            warnings.push(`Record will expire in ${Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))} days`);
          }
        }
      }
      
      return { passed: violations.length === 0, violations, warnings };
    },
  },
];

const createAccessControlRules = (): ComplianceRule[] => [
  {
    id: 'ac_001',
    name: 'Unauthorized Access Attempt',
    description: 'Detect unauthorized access patterns',
    category: 'access_control',
    severity: 'critical',
    check: async (data) => {
      const violations: ComplianceViolation[] = [];
      
      const accessAttempts = (data.accessAttempts as number) || 0;
      const failedAttempts = (data.failedAttempts as number) || 0;
      
      if (failedAttempts > 5) {
        violations.push({
          ruleId: 'ac_001',
          ruleName: 'Unauthorized Access Attempt',
          category: 'access_control',
          severity: 'critical',
          description: `Multiple failed access attempts detected: ${failedAttempts} failures`,
          affectedEntity: { type: 'user', id: data.userId as string },
          detectedAt: new Date(),
          evidence: { accessAttempts, failedAttempts },
          suggestedAction: 'Review access logs and consider temporary account lock',
        });
      }
      
      return { passed: violations.length === 0, violations, warnings: [] };
    },
  },
];

export function useComplianceEnforcement() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<ComplianceCheckResult | null>(null);

  // All built-in rules
  const builtInRules: ComplianceRule[] = [
    ...createDataProtectionRules(),
    ...createAccessControlRules(),
  ];

  const runComplianceCheck = useCallback(async (
    data: Record<string, unknown>,
    rules: ComplianceRule[] = builtInRules
  ): Promise<ComplianceCheckResult> => {
    setIsChecking(true);
    
    try {
      const allViolations: ComplianceViolation[] = [];
      const allWarnings: string[] = [];

      for (const rule of rules) {
        try {
          const result = await rule.check(data);
          allViolations.push(...result.violations);
          allWarnings.push(...result.warnings);
        } catch (error) {
          console.error(`Compliance rule ${rule.id} failed:`, error);
          allWarnings.push(`Rule ${rule.name} could not be evaluated`);
        }
      }

      const result: ComplianceCheckResult = {
        passed: allViolations.length === 0,
        violations: allViolations,
        warnings: allWarnings,
        metadata: {
          rulesChecked: rules.length,
          checkedAt: new Date().toISOString(),
          checkedBy: user?.id,
        },
      };

      setLastCheckResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, [builtInRules, user?.id]);

  const checkEmployeeCompliance = useCallback(async (employeeData: Record<string, unknown>) => {
    const employeeRules = builtInRules.filter(r => 
      r.category === 'data_protection' || r.category === 'access_control'
    );
    return runComplianceCheck(employeeData, employeeRules);
  }, [builtInRules, runComplianceCheck]);

  const checkDocumentCompliance = useCallback(async (documentData: Record<string, unknown>) => {
    const documentRules = builtInRules.filter(r => 
      r.category === 'document_retention' || r.category === 'data_protection'
    );
    return runComplianceCheck(documentData, documentRules);
  }, [builtInRules, runComplianceCheck]);

  const checkTransactionCompliance = useCallback(async (transactionData: Record<string, unknown>) => {
    const transactionRules = builtInRules.filter(r => 
      r.category === 'financial' || r.category === 'regulatory'
    );
    return runComplianceCheck(transactionData, transactionRules);
  }, [builtInRules, runComplianceCheck]);

  const resolveViolation = useCallback(async (
    violationId: string,
    resolution: { notes: string; action?: string }
  ): Promise<boolean> => {
    try {
      // In a full implementation, this would update the compliance_violations table
      console.log('Resolving violation:', violationId, resolution);
      return true;
    } catch (error) {
      console.error('Failed to resolve violation:', error);
      return false;
    }
  }, []);

  const escalateViolation = useCallback(async (
    violationId: string,
    escalation: { to: string; reason: string }
  ): Promise<boolean> => {
    try {
      console.log('Escalating violation:', violationId, escalation);
      return true;
    } catch (error) {
      console.error('Failed to escalate violation:', error);
      return false;
    }
  }, []);

  const runProactiveCheck = useCallback(async (scope: 'all' | 'critical' | 'recent' = 'recent') => {
    // This would scan recent data for compliance issues
    console.log('Running proactive compliance check with scope:', scope);
    return { checked: 0, violations: 0, warnings: 0 };
  }, []);

  return {
    isChecking,
    lastCheckResult,
    runComplianceCheck,
    checkEmployeeCompliance,
    checkDocumentCompliance,
    checkTransactionCompliance,
    resolveViolation,
    escalateViolation,
    runProactiveCheck,
    builtInRules,
  };
}
