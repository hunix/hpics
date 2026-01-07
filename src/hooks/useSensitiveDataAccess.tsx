import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useClearance, ClearanceLevel } from './useClearance';
import { toast } from 'sonner';

interface AccessLogEntry {
  table_name: string;
  record_id: string;
  access_type: 'view' | 'export' | 'modify';
  data_classification: 'public' | 'internal' | 'confidential' | 'restricted';
  metadata?: Record<string, any>;
}

// Data classification levels for government-class security
export const DATA_CLASSIFICATION = {
  public: { level: 0, label: 'Public', color: 'text-green-600', requiredClearance: 'uncleared' as ClearanceLevel },
  internal: { level: 1, label: 'Internal', color: 'text-blue-600', requiredClearance: 'uncleared' as ClearanceLevel },
  confidential: { level: 2, label: 'Confidential', color: 'text-yellow-600', requiredClearance: 'confidential' as ClearanceLevel },
  restricted: { level: 3, label: 'Restricted', color: 'text-red-600', requiredClearance: 'secret' as ClearanceLevel },
} as const;

// Table to classification mapping
export const TABLE_CLASSIFICATIONS: Record<string, keyof typeof DATA_CLASSIFICATION> = {
  profiles: 'internal',
  contact_methods: 'confidential',
  contact_bank_accounts: 'restricted',
  contact_payment_accounts: 'restricted',
  contact_financial_history: 'restricted',
  contact_identity_documents: 'restricted',
  contact_personal_info: 'confidential',
  oauth_tokens: 'restricted',
  email_messages: 'confidential',
  messages: 'confidential',
  meeting_recordings: 'confidential',
  behavioral_analyses: 'restricted',
  facial_analyses: 'restricted',
  vocal_analyses: 'restricted',
  whatsapp_config: 'restricted',
  outlook_config: 'restricted',
  psychological_profiles: 'restricted',
  trust_assessments: 'restricted',
  contact_biometrics: 'restricted',
  biometric_samples: 'restricted',
  immutable_audit_logs: 'restricted',
  encryption_keys: 'restricted',
};

export function useSensitiveDataAccess() {
  const { user } = useAuth();
  const { hasClearance, currentClearance } = useClearance();
  const accessCache = useRef<Map<string, number>>(new Map());
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const MAX_SENSITIVE_ACCESSES = 50; // Max accesses per minute

  // Log sensitive data access for audit trail
  const logAccess = useCallback(
    async (entry: AccessLogEntry) => {
      if (!user) return;

      const cacheKey = `${entry.table_name}:${entry.record_id}:${entry.access_type}`;
      const now = Date.now();
      const lastAccess = accessCache.current.get(cacheKey) || 0;

      // Rate limiting check
      const classification = DATA_CLASSIFICATION[entry.data_classification];
      if (classification.level >= 2) {
        // Confidential or higher
        const recentAccesses = Array.from(accessCache.current.values()).filter(
          (time) => now - time < RATE_LIMIT_WINDOW
        ).length;

        if (recentAccesses >= MAX_SENSITIVE_ACCESSES) {
          toast.error('Access rate limit exceeded. Please wait before accessing more sensitive data.');
          console.warn('[SECURITY] Rate limit exceeded for sensitive data access', {
            user_id: user.id,
            attempted_access: entry,
          });
          return false;
        }
      }

      // Update cache
      accessCache.current.set(cacheKey, now);

      // Log to console for now (in production, this would go to a secure audit log)
      console.log('[AUDIT] Sensitive data access', {
        user_id: user.id,
        timestamp: new Date().toISOString(),
        ...entry,
      });

      // For restricted data, log to database
      if (classification.level >= 3) {
        try {
          await supabase.from('ai_usage_logs').insert({
            user_id: user.id,
            function_name: 'sensitive_data_access',
            model_name: 'audit',
            provider: 'system',
            estimated_cost_cents: 0,
            prompt_summary: `Access to ${entry.table_name}:${entry.record_id} (${entry.access_type})`,
            request_metadata: entry as any,
          });
        } catch (error) {
          console.error('[AUDIT] Failed to log sensitive access', error);
        }
      }

      return true;
    },
    [user]
  );

  // Check if user can access sensitive data based on clearance
  const canAccess = useCallback(
    (tableName: string): boolean => {
      const classificationKey = TABLE_CLASSIFICATIONS[tableName] || 'public';
      const classification = DATA_CLASSIFICATION[classificationKey];
      
      // Check if user has required clearance for this data classification
      return hasClearance(classification.requiredClearance);
    },
    [hasClearance]
  );

  // Get classification for a table
  const getClassification = useCallback((tableName: string) => {
    const level = TABLE_CLASSIFICATIONS[tableName] || 'public';
    return DATA_CLASSIFICATION[level];
  }, []);

  // Mask sensitive data for display
  const maskSensitive = useCallback(
    (value: string, type: 'email' | 'phone' | 'account' | 'partial') => {
      if (!value) return '';
      
      switch (type) {
        case 'email':
          const [local, domain] = value.split('@');
          return `${local.slice(0, 2)}***@${domain}`;
        case 'phone':
          return `***-***-${value.slice(-4)}`;
        case 'account':
          return `****${value.slice(-4)}`;
        case 'partial':
          return `${value.slice(0, 3)}***${value.slice(-3)}`;
        default:
          return value;
      }
    },
    []
  );

  return {
    logAccess,
    canAccess,
    getClassification,
    maskSensitive,
    DATA_CLASSIFICATION,
    TABLE_CLASSIFICATIONS,
  };
}
