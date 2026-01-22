/**
 * Edge Function Registry Hook
 * 
 * Provides access to database-driven edge function configuration.
 * Replaces hardcoded function lists with dynamic registry.
 * 
 * @version 3.9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMemo, useCallback } from 'react';

export interface FunctionConfig {
  id: string;
  function_name: string;
  display_name: string;
  description: string | null;
  category: string;
  phase_level: number;
  is_critical: boolean;
  is_active: boolean;
  health_check_enabled: boolean;
  expected_tables: string[];
  expected_columns: Record<string, string[]>;
  timeout_ms: number;
  retry_config: {
    maxRetries: number;
    backoffMs: number;
  };
  input_schema: Record<string, unknown> | null;
  output_schema: Record<string, unknown> | null;
  dependencies: string[];
  rate_limit_per_minute: number;
  cost_tier: string;
  created_at: string;
  updated_at: string;
}

export interface FunctionsByCategory {
  [category: string]: FunctionConfig[];
}

export interface FunctionsByPhase {
  [phase: number]: FunctionConfig[];
}

const REGISTRY_QUERY_KEY = ['edge-function-registry'];

export function useEdgeFunctionRegistry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load all registered functions from database
  const {
    data: functions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: REGISTRY_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_registry')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FunctionConfig[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user
  });

  // Get active functions only
  const activeFunctions = useMemo(() => {
    return functions?.filter(f => f.is_active) || [];
  }, [functions]);

  // Group by category
  const byCategory = useMemo<FunctionsByCategory>(() => {
    const grouped: FunctionsByCategory = {};
    for (const fn of activeFunctions) {
      if (!grouped[fn.category]) {
        grouped[fn.category] = [];
      }
      grouped[fn.category].push(fn);
    }
    return grouped;
  }, [activeFunctions]);

  // Group by phase
  const byPhase = useMemo<FunctionsByPhase>(() => {
    const grouped: FunctionsByPhase = {};
    for (const fn of activeFunctions) {
      if (!grouped[fn.phase_level]) {
        grouped[fn.phase_level] = [];
      }
      grouped[fn.phase_level].push(fn);
    }
    return grouped;
  }, [activeFunctions]);

  // Get critical functions
  const criticalFunctions = useMemo(() => {
    return activeFunctions.filter(f => f.is_critical);
  }, [activeFunctions]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(activeFunctions.map(f => f.category))].sort();
  }, [activeFunctions]);

  // Get unique phases
  const phases = useMemo(() => {
    return [...new Set(activeFunctions.map(f => f.phase_level))].sort((a, b) => a - b);
  }, [activeFunctions]);

  // Validate function exists before invoking
  const validateFunction = useCallback((functionName: string): FunctionConfig | null => {
    const fn = functions?.find(f => f.function_name === functionName);
    if (!fn) {
      console.warn(`[FunctionRegistry] Function ${functionName} not found in registry`);
      return null;
    }
    if (!fn.is_active) {
      console.warn(`[FunctionRegistry] Function ${functionName} is disabled`);
      return null;
    }
    return fn;
  }, [functions]);

  // Get function by name
  const getFunction = useCallback((functionName: string): FunctionConfig | undefined => {
    return functions?.find(f => f.function_name === functionName);
  }, [functions]);

  // Check if function exists and is active
  const isFunctionActive = useCallback((functionName: string): boolean => {
    const fn = functions?.find(f => f.function_name === functionName);
    return fn?.is_active === true;
  }, [functions]);

  // Update function status
  const updateFunctionStatus = useMutation({
    mutationFn: async ({ functionName, isActive }: { functionName: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('edge_function_registry')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('function_name', functionName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRY_QUERY_KEY });
    }
  });

  // Update function configuration
  const updateFunctionConfig = useMutation({
    mutationFn: async ({ functionName, updates }: { functionName: string; updates: Partial<FunctionConfig> }) => {
      const { error } = await supabase
        .from('edge_function_registry')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('function_name', functionName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRY_QUERY_KEY });
    }
  });

  // Register a new function
  const registerFunction = useMutation({
    mutationFn: async (config: Partial<FunctionConfig> & { function_name: string; display_name: string }) => {
      const { data, error } = await supabase
        .from('edge_function_registry')
        .upsert({
          ...config,
          category: config.category || 'core',
          phase_level: config.phase_level || 1,
          updated_at: new Date().toISOString()
        }, { onConflict: 'function_name' })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FunctionConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REGISTRY_QUERY_KEY });
    }
  });

  return {
    // Data
    functions: functions || [],
    activeFunctions,
    byCategory,
    byPhase,
    criticalFunctions,
    categories,
    phases,

    // State
    isLoading,
    error,

    // Utilities
    validateFunction,
    getFunction,
    isFunctionActive,
    refetch,

    // Mutations
    updateFunctionStatus,
    updateFunctionConfig,
    registerFunction
  };
}

// Query keys factory for external use
export const functionRegistryKeys = {
  all: REGISTRY_QUERY_KEY,
  byCategory: (category: string) => [...REGISTRY_QUERY_KEY, 'category', category],
  byPhase: (phase: number) => [...REGISTRY_QUERY_KEY, 'phase', phase],
  byName: (name: string) => [...REGISTRY_QUERY_KEY, 'name', name]
};
