/**
 * Edge Function Registry Helper
 * 
 * Provides database-driven function configuration management.
 * Eliminates hardcoded function lists and enables dynamic function management.
 * 
 * @version 3.9.0
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

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
}

export interface SchemaValidation {
  tables: string[];
  columns: Record<string, string[]>;
}

/**
 * Load function configuration from database
 */
export async function getFunctionConfig(
  supabase: SupabaseClient,
  functionName: string
): Promise<FunctionConfig | null> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('*')
    .eq('function_name', functionName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.warn(`[FunctionRegistry] Failed to load config for ${functionName}:`, error.message);
    return null;
  }

  return data as FunctionConfig;
}

/**
 * Validate that a function exists in the registry
 */
export async function validateFunctionExists(
  supabase: SupabaseClient,
  functionName: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('id, is_active')
    .eq('function_name', functionName)
    .single();

  if (error || !data) {
    return false;
  }

  return data.is_active === true;
}

/**
 * Get schema validation rules for a function
 */
export async function getSchemaValidation(
  supabase: SupabaseClient,
  functionName: string
): Promise<SchemaValidation> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('expected_tables, expected_columns')
    .eq('function_name', functionName)
    .single();

  if (error || !data) {
    return { tables: [], columns: {} };
  }

  return {
    tables: data.expected_tables || [],
    columns: (data.expected_columns as Record<string, string[]>) || {}
  };
}

/**
 * Get all active functions by category
 */
export async function getFunctionsByCategory(
  supabase: SupabaseClient,
  category: string
): Promise<FunctionConfig[]> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error(`[FunctionRegistry] Failed to load functions for category ${category}:`, error.message);
    return [];
  }

  return (data || []) as FunctionConfig[];
}

/**
 * Get all active functions by AGIS phase level
 */
export async function getFunctionsByPhase(
  supabase: SupabaseClient,
  phaseLevel: number
): Promise<FunctionConfig[]> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('*')
    .eq('phase_level', phaseLevel)
    .eq('is_active', true)
    .order('display_name');

  if (error) {
    console.error(`[FunctionRegistry] Failed to load functions for phase ${phaseLevel}:`, error.message);
    return [];
  }

  return (data || []) as FunctionConfig[];
}

/**
 * Get critical functions that should always be monitored
 */
export async function getCriticalFunctions(
  supabase: SupabaseClient
): Promise<FunctionConfig[]> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .select('*')
    .eq('is_critical', true)
    .eq('is_active', true)
    .order('phase_level');

  if (error) {
    console.error('[FunctionRegistry] Failed to load critical functions:', error.message);
    return [];
  }

  return (data || []) as FunctionConfig[];
}

/**
 * Get function dependencies (for execution ordering)
 */
export async function getFunctionDependencies(
  supabase: SupabaseClient,
  functionName: string
): Promise<string[]> {
  const config = await getFunctionConfig(supabase, functionName);
  return config?.dependencies || [];
}

/**
 * Validate table name against schema mapping
 * Prevents querying incorrect table names
 */
export function validateTableName(tableName: string): { valid: boolean; correctName: string } {
  // Schema mappings from custom knowledge
  const tableMappings: Record<string, string> = {
    'interactions': 'contact_interaction_notes',
    'notes': 'contact_interaction_notes',
    'observations': 'contact_observations',
  };

  const columnMappings: Record<string, Record<string, string>> = {
    'profiles': {
      'occupation': 'job_title'
    },
    'contact_life_milestones': {
      'milestone_date': 'event_date'
    },
    'platform_config': {
      'override_value': 'config_value'
    }
  };

  const correctName = tableMappings[tableName] || tableName;
  return {
    valid: tableName === correctName,
    correctName
  };
}

/**
 * Register or update a function in the registry
 */
export async function registerFunction(
  supabase: SupabaseClient,
  config: Partial<FunctionConfig> & { function_name: string; display_name: string }
): Promise<FunctionConfig | null> {
  const { data, error } = await supabase
    .from('edge_function_registry')
    .upsert({
      ...config,
      updated_at: new Date().toISOString()
    }, { onConflict: 'function_name' })
    .select()
    .single();

  if (error) {
    console.error(`[FunctionRegistry] Failed to register ${config.function_name}:`, error.message);
    return null;
  }

  return data as FunctionConfig;
}

/**
 * Disable a function in the registry
 */
export async function disableFunction(
  supabase: SupabaseClient,
  functionName: string
): Promise<boolean> {
  const { error } = await supabase
    .from('edge_function_registry')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('function_name', functionName);

  if (error) {
    console.error(`[FunctionRegistry] Failed to disable ${functionName}:`, error.message);
    return false;
  }

  return true;
}
