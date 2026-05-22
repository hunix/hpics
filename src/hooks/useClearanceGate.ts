/**
 * Clearance Gate Hook
 * AGIS Phase 6 - Security hardening with clearance-based data masking
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ClearanceLevel = 
  | 'public' 
  | 'confidential' 
  | 'secret' 
  | 'top_secret' 
  | 'compartmented';

export type DataClassification = 
  | 'unclassified'
  | 'sensitive'
  | 'confidential' 
  | 'secret'
  | 'top_secret';

export interface ClearanceConfig {
  level: ClearanceLevel;
  compartments?: string[];
  expiresAt?: Date;
  grantedBy?: string;
}

export interface MaskingRule {
  field: string;
  requiredClearance: ClearanceLevel;
  maskPattern: 'full' | 'partial' | 'hash' | 'redact';
}

const CLEARANCE_HIERARCHY: Record<ClearanceLevel, number> = {
  public: 0,
  confidential: 1,
  secret: 2,
  top_secret: 3,
  compartmented: 4,
};

const CLASSIFICATION_TO_CLEARANCE: Record<DataClassification, ClearanceLevel> = {
  unclassified: 'public',
  sensitive: 'confidential',
  confidential: 'confidential',
  secret: 'secret',
  top_secret: 'top_secret',
};

// Default masking rules for AGIS domains
const DEFAULT_MASKING_RULES: MaskingRule[] = [
  // Trauma exploitation data
  { field: 'trauma_details', requiredClearance: 'top_secret', maskPattern: 'full' },
  { field: 'exploitation_scripts', requiredClearance: 'top_secret', maskPattern: 'redact' },
  { field: 'vulnerability_windows', requiredClearance: 'secret', maskPattern: 'partial' },
  
  // Addiction formation data
  { field: 'addiction_protocols', requiredClearance: 'top_secret', maskPattern: 'full' },
  { field: 'reinforcement_schedules', requiredClearance: 'secret', maskPattern: 'partial' },
  
  // Coercive control data
  { field: 'coercive_tactics', requiredClearance: 'top_secret', maskPattern: 'redact' },
  { field: 'isolation_strategies', requiredClearance: 'top_secret', maskPattern: 'full' },
  
  // MICE assessment data
  { field: 'mice_scores', requiredClearance: 'secret', maskPattern: 'partial' },
  { field: 'compromise_vectors', requiredClearance: 'top_secret', maskPattern: 'full' },
  
  // Betrayal prediction data
  { field: 'defection_probability', requiredClearance: 'secret', maskPattern: 'partial' },
  { field: 'trust_erosion_timeline', requiredClearance: 'secret', maskPattern: 'partial' },
  
  // Identity destabilization
  { field: 'gaslighting_scripts', requiredClearance: 'top_secret', maskPattern: 'redact' },
  { field: 'reality_distortion_techniques', requiredClearance: 'top_secret', maskPattern: 'full' },
  
  // Personal data
  { field: 'ssn', requiredClearance: 'secret', maskPattern: 'hash' },
  { field: 'financial_accounts', requiredClearance: 'secret', maskPattern: 'partial' },
  { field: 'medical_records', requiredClearance: 'secret', maskPattern: 'full' },
];

export function useClearanceGate() {
  const { user } = useAuth();

  // Fetch user's clearance level
  const clearanceQuery = useQuery({
    queryKey: ['user-clearance', user?.id],
    queryFn: async (): Promise<ClearanceConfig> => {
      if (!user?.id) {
        return { level: 'public' };
      }

      // Check app_settings for clearance configuration
      const { data } = await supabase
        .from('app_settings')
        .select('setting_value, metadata')
        .eq('user_id', user.id)
        .eq('setting_key', 'security_clearance')
        .maybeSingle();

      if (!data) {
        // Default to confidential for authenticated users
        return { level: 'confidential' };
      }

      const metadata = data.metadata as Record<string, unknown> | null;
      
      return {
        level: (data.setting_value as ClearanceLevel) || 'confidential',
        compartments: (metadata?.compartments as string[]) || [],
        expiresAt: metadata?.expires_at ? new Date(metadata.expires_at as string) : undefined,
        grantedBy: metadata?.granted_by as string | undefined,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const userClearance = clearanceQuery.data?.level || 'public';
  const userCompartments = clearanceQuery.data?.compartments || [];

  // Check if user has required clearance
  const hasClearance = useCallback((required: ClearanceLevel, compartment?: string): boolean => {
    const userLevel = CLEARANCE_HIERARCHY[userClearance];
    const requiredLevel = CLEARANCE_HIERARCHY[required];

    // Check level first
    if (userLevel < requiredLevel) {
      return false;
    }

    // Check compartment if required
    if (compartment && required === 'compartmented') {
      return userCompartments.includes(compartment);
    }

    return true;
  }, [userClearance, userCompartments]);

  // Check if data classification is accessible
  const canAccessClassification = useCallback((classification: DataClassification): boolean => {
    const requiredClearance = CLASSIFICATION_TO_CLEARANCE[classification];
    return hasClearance(requiredClearance);
  }, [hasClearance]);

  // Mask data based on clearance level
  const maskData = useCallback(<T extends Record<string, unknown>>(
    data: T,
    customRules?: MaskingRule[]
  ): T => {
    const rules = customRules || DEFAULT_MASKING_RULES;
    const masked = { ...data };

    rules.forEach(rule => {
      if (rule.field in masked && !hasClearance(rule.requiredClearance)) {
        switch (rule.maskPattern) {
          case 'full':
            masked[rule.field as keyof T] = '[CLASSIFIED]' as T[keyof T];
            break;
          case 'partial': {
            const value = masked[rule.field];
            if (typeof value === 'string' && value.length > 4) {
              masked[rule.field as keyof T] = `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}` as T[keyof T];
            } else if (typeof value === 'number') {
              masked[rule.field as keyof T] = Math.round(value / 10) * 10 as T[keyof T];
            } else {
              masked[rule.field as keyof T] = '[REDACTED]' as T[keyof T];
            }
            break;
          }
          case 'hash': {
            const hashValue = masked[rule.field];
            if (typeof hashValue === 'string') {
              masked[rule.field as keyof T] = `***${hashValue.slice(-4)}` as T[keyof T];
            } else {
              masked[rule.field as keyof T] = '****' as T[keyof T];
            }
            break;
          }
          case 'redact':
            masked[rule.field as keyof T] = '[REDACTED - INSUFFICIENT CLEARANCE]' as T[keyof T];
            break;
        }
      }
    });

    return masked;
  }, [hasClearance]);

  // Get accessible fields for a data type
  const getAccessibleFields = useCallback((
    allFields: string[],
    customRules?: MaskingRule[]
  ): string[] => {
    const rules = customRules || DEFAULT_MASKING_RULES;
    const restrictedFields = new Set(
      rules
        .filter(rule => !hasClearance(rule.requiredClearance))
        .map(rule => rule.field)
    );

    return allFields.filter(field => !restrictedFields.has(field));
  }, [hasClearance]);

  // Check if clearance is expired
  const isClearanceExpired = useMemo(() => {
    if (!clearanceQuery.data?.expiresAt) return false;
    return new Date() > clearanceQuery.data.expiresAt;
  }, [clearanceQuery.data?.expiresAt]);

  // Get clearance display info
  const getClearanceDisplay = useCallback((level: ClearanceLevel) => {
    const displays: Record<ClearanceLevel, { label: string; color: string; bgColor: string }> = {
      public: { label: 'Public', color: 'text-gray-500', bgColor: 'bg-gray-500/20' },
      confidential: { label: 'Confidential', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
      secret: { label: 'Secret', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
      top_secret: { label: 'Top Secret', color: 'text-red-500', bgColor: 'bg-red-500/20' },
      compartmented: { label: 'Compartmented', color: 'text-purple-500', bgColor: 'bg-purple-500/20' },
    };
    return displays[level];
  }, []);

  return {
    // Current clearance
    clearance: clearanceQuery.data,
    clearanceLevel: userClearance,
    compartments: userCompartments,
    isLoading: clearanceQuery.isLoading,
    isClearanceExpired,

    // Checks
    hasClearance,
    canAccessClassification,

    // Data operations
    maskData,
    getAccessibleFields,

    // Display helpers
    getClearanceDisplay,
    clearanceHierarchy: CLEARANCE_HIERARCHY,
  };
}
