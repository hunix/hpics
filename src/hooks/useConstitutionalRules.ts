/**
 * Constitutional Rules Hook
 * 
 * Provides CRUD operations for AI constitutional rules.
 * All rules are stored in the database for dynamic management.
 * 
 * @version 3.9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { toast } from 'sonner';

export interface ConstitutionalRule {
  id: string;
  rule_key: string;
  rule_category: string;
  rule_name: string;
  rule_text: string;
  evaluation_prompt: string | null;
  severity: 'info' | 'warning' | 'block' | 'escalate';
  action_on_violation: 'log' | 'warn' | 'block' | 'rewrite' | 'escalate';
  applies_to_functions: string[];
  applies_to_categories: string[];
  priority: number;
  is_active: boolean;
  is_system: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConstitutionalViolation {
  id: string;
  rule_id: string | null;
  user_id: string;
  function_name: string | null;
  input_content: string | null;
  output_content: string | null;
  violation_reason: string | null;
  severity: string | null;
  action_taken: string | null;
  was_overridden: boolean;
  override_reason: string | null;
  overridden_by: string | null;
  created_at: string;
}

export type RuleCategory = 'legal' | 'ethical' | 'operational' | 'brand' | 'safety' | 'privacy';
export type RuleSeverity = 'info' | 'warning' | 'block' | 'escalate';
export type ViolationAction = 'log' | 'warn' | 'block' | 'rewrite' | 'escalate';

const RULES_QUERY_KEY = ['constitutional-rules'];
const VIOLATIONS_QUERY_KEY = ['constitutional-violations'];

export function useConstitutionalRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load all constitutional rules
  const {
    data: rules,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: RULES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('constitutional_rules' as any)
        .select('*')
        .order('priority', { ascending: true })) as any;

      if (error) throw error;
      return (data || []) as unknown as ConstitutionalRule[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user
  });

  // Get active rules only
  const activeRules = useMemo(() => {
    return rules?.filter(r => r.is_active) || [];
  }, [rules]);

  // Group by category
  const byCategory = useMemo(() => {
    const grouped: Record<string, ConstitutionalRule[]> = {};
    for (const rule of activeRules) {
      if (!grouped[rule.rule_category]) {
        grouped[rule.rule_category] = [];
      }
      grouped[rule.rule_category].push(rule);
    }
    return grouped;
  }, [activeRules]);

  // Group by severity
  const bySeverity = useMemo(() => {
    const grouped: Record<string, ConstitutionalRule[]> = {};
    for (const rule of activeRules) {
      if (!grouped[rule.severity]) {
        grouped[rule.severity] = [];
      }
      grouped[rule.severity].push(rule);
    }
    return grouped;
  }, [activeRules]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set((rules || []).map(r => r.rule_category))].sort();
  }, [rules]);

  // Create new rule
  const createRule = useMutation({
    mutationFn: async (rule: Omit<ConstitutionalRule, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>) => {
      const { data, error } = await (supabase
        .from('constitutional_rules' as any)
        .insert({
          ...rule,
          created_by: user?.id,
          updated_by: user?.id
        })
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as ConstitutionalRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
      toast.success('Constitutional rule created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create rule', { description: error.message });
    }
  });

  // Update existing rule
  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ConstitutionalRule> }) => {
      const { data, error } = await (supabase
        .from('constitutional_rules' as any)
        .update({
          ...updates,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as ConstitutionalRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
      toast.success('Rule updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update rule', { description: error.message });
    }
  });

  // Delete rule (only non-system rules)
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const rule = rules?.find(r => r.id === id);
      if (rule?.is_system) {
        throw new Error('Cannot delete system rules');
      }

      const { error } = await (supabase
        .from('constitutional_rules' as any)
        .delete()
        .eq('id', id)) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
      toast.success('Rule deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete rule', { description: error.message });
    }
  });

  // Toggle rule active status
  const toggleRuleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await (supabase
        .from('constitutional_rules' as any)
        .update({
          is_active: isActive,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RULES_QUERY_KEY });
    }
  });

  return {
    // Data
    rules: rules || [],
    activeRules,
    byCategory,
    bySeverity,
    categories,

    // State
    isLoading,
    error,
    refetch,

    // Mutations
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus
  };
}

/**
 * Hook for viewing constitutional violations
 */
export function useConstitutionalViolations(options?: { functionName?: string; limit?: number }) {
  const { user } = useAuth();

  const {
    data: violations,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...VIOLATIONS_QUERY_KEY, options?.functionName, options?.limit],
    queryFn: async () => {
      let query = (supabase
        .from('constitutional_violations' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 100)) as any;

      if (options?.functionName) {
        query = query.eq('function_name', options.functionName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as ConstitutionalViolation[];
    },
    staleTime: 60 * 1000,
    enabled: !!user
  });

  // Get violation stats
  const stats = useMemo(() => {
    if (!violations) return null;

    const bySeverity: Record<string, number> = {};
    const byFunction: Record<string, number> = {};

    for (const v of violations) {
      const severity = v.severity || 'unknown';
      bySeverity[severity] = (bySeverity[severity] || 0) + 1;

      const fn = v.function_name || 'unknown';
      byFunction[fn] = (byFunction[fn] || 0) + 1;
    }

    return {
      total: violations.length,
      bySeverity,
      byFunction,
      overriddenCount: violations.filter(v => v.was_overridden).length
    };
  }, [violations]);

  return {
    violations: violations || [],
    stats,
    isLoading,
    error,
    refetch
  };
}

// Query keys factory
export const constitutionalRulesKeys = {
  all: RULES_QUERY_KEY,
  byCategory: (category: string) => [...RULES_QUERY_KEY, 'category', category],
  violations: VIOLATIONS_QUERY_KEY
};
