/**
 * Kill Switch & Containment System
 * 
 * Provides emergency shutdown and containment capabilities for AI agents.
 * All configuration is stored in the database.
 * 
 * @version 3.9.0
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface KillSwitch {
  id: string;
  agent_id: string;
  agent_type: 'edge_function' | 'workflow' | 'tribunal' | 'agent';
  display_name: string | null;
  is_enabled: boolean;
  containment_mode: 'none' | 'soft' | 'hard';
  disabled_reason: string | null;
  disabled_at: string | null;
  disabled_by: string | null;
  auto_disable_conditions: Record<string, unknown>;
  error_threshold: number;
  error_window_minutes: number;
  current_error_count: number;
  last_error_at: string | null;
  escalation_contacts: string[];
}

export interface KillSwitchStatus {
  enabled: boolean;
  containmentMode: 'none' | 'soft' | 'hard';
  reason?: string;
  disabledAt?: string;
}

/**
 * Check if an agent is enabled
 */
export async function checkKillSwitch(
  supabase: SupabaseClient,
  agentId: string
): Promise<KillSwitchStatus> {
  const { data, error } = await supabase
    .from('agent_kill_switches')
    .select('is_enabled, containment_mode, disabled_reason, disabled_at')
    .eq('agent_id', agentId)
    .single();

  if (error) {
    // No kill switch configured = enabled
    if (error.code === 'PGRST116') {
      return { enabled: true, containmentMode: 'none' };
    }
    console.warn(`[KillSwitch] Failed to check status for ${agentId}:`, error.message);
    return { enabled: true, containmentMode: 'none' };
  }

  return {
    enabled: data.is_enabled,
    containmentMode: data.containment_mode || 'none',
    reason: data.disabled_reason || undefined,
    disabledAt: data.disabled_at || undefined
  };
}

/**
 * Disable an agent via kill switch
 */
export async function disableAgent(
  supabase: SupabaseClient,
  agentId: string,
  agentType: 'edge_function' | 'workflow' | 'tribunal' | 'agent',
  reason: string,
  disabledBy?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('agent_kill_switches')
    .upsert({
      agent_id: agentId,
      agent_type: agentType,
      is_enabled: false,
      disabled_reason: reason,
      disabled_at: new Date().toISOString(),
      disabled_by: disabledBy || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'agent_id' });

  if (error) {
    console.error(`[KillSwitch] Failed to disable ${agentId}:`, error.message);
    return false;
  }

  console.warn(`[KillSwitch] Agent ${agentId} disabled: ${reason}`);
  return true;
}

/**
 * Re-enable an agent
 */
export async function enableAgent(
  supabase: SupabaseClient,
  agentId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('agent_kill_switches')
    .update({
      is_enabled: true,
      containment_mode: 'none',
      disabled_reason: null,
      disabled_at: null,
      disabled_by: null,
      current_error_count: 0,
      updated_at: new Date().toISOString()
    })
    .eq('agent_id', agentId);

  if (error) {
    console.error(`[KillSwitch] Failed to enable ${agentId}:`, error.message);
    return false;
  }

  console.info(`[KillSwitch] Agent ${agentId} re-enabled`);
  return true;
}

/**
 * Set containment mode for an agent
 */
export async function setContainmentMode(
  supabase: SupabaseClient,
  agentId: string,
  mode: 'none' | 'soft' | 'hard',
  reason?: string
): Promise<boolean> {
  const { error } = await supabase
    .from('agent_kill_switches')
    .upsert({
      agent_id: agentId,
      containment_mode: mode,
      disabled_reason: reason || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'agent_id' });

  if (error) {
    console.error(`[KillSwitch] Failed to set containment mode for ${agentId}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Record an error for an agent (for auto-disable tracking)
 */
export async function recordAgentError(
  supabase: SupabaseClient,
  agentId: string,
  agentType: 'edge_function' | 'workflow' | 'tribunal' | 'agent'
): Promise<{ disabled: boolean; reason?: string }> {
  // Get current kill switch state
  const { data: current, error: fetchError } = await supabase
    .from('agent_kill_switches')
    .select('*')
    .eq('agent_id', agentId)
    .single();

  const now = new Date();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error(`[KillSwitch] Failed to fetch state for ${agentId}:`, fetchError.message);
    return { disabled: false };
  }

  // Initialize or get current values
  const errorThreshold = current?.error_threshold || 10;
  const errorWindowMinutes = current?.error_window_minutes || 60;
  let errorCount = current?.current_error_count || 0;
  const lastErrorAt = current?.last_error_at ? new Date(current.last_error_at) : null;

  // Check if we're within the error window
  if (lastErrorAt) {
    const windowMs = errorWindowMinutes * 60 * 1000;
    if (now.getTime() - lastErrorAt.getTime() > windowMs) {
      // Reset error count if outside window
      errorCount = 0;
    }
  }

  // Increment error count
  errorCount++;

  // Check if we should auto-disable
  const shouldDisable = errorCount >= errorThreshold;

  const { error: updateError } = await supabase
    .from('agent_kill_switches')
    .upsert({
      agent_id: agentId,
      agent_type: agentType,
      current_error_count: errorCount,
      last_error_at: now.toISOString(),
      is_enabled: shouldDisable ? false : (current?.is_enabled ?? true),
      disabled_reason: shouldDisable ? `Auto-disabled: ${errorCount} errors in ${errorWindowMinutes} minutes` : current?.disabled_reason,
      disabled_at: shouldDisable ? now.toISOString() : current?.disabled_at,
      updated_at: now.toISOString()
    }, { onConflict: 'agent_id' });

  if (updateError) {
    console.error(`[KillSwitch] Failed to record error for ${agentId}:`, updateError.message);
    return { disabled: false };
  }

  if (shouldDisable) {
    console.warn(`[KillSwitch] Agent ${agentId} auto-disabled after ${errorCount} errors`);
    return {
      disabled: true,
      reason: `Auto-disabled: ${errorCount} errors in ${errorWindowMinutes} minutes`
    };
  }

  return { disabled: false };
}

/**
 * Get all kill switches with their current status
 */
export async function getAllKillSwitches(
  supabase: SupabaseClient
): Promise<KillSwitch[]> {
  const { data, error } = await supabase
    .from('agent_kill_switches')
    .select('*')
    .order('agent_id');

  if (error) {
    console.error('[KillSwitch] Failed to fetch all kill switches:', error.message);
    return [];
  }

  return (data || []) as KillSwitch[];
}

/**
 * Emergency shutdown - disable all agents of a type
 */
export async function emergencyShutdown(
  supabase: SupabaseClient,
  agentType: 'edge_function' | 'workflow' | 'tribunal' | 'agent' | 'all',
  reason: string,
  disabledBy?: string
): Promise<number> {
  let query = supabase
    .from('agent_kill_switches')
    .update({
      is_enabled: false,
      containment_mode: 'hard',
      disabled_reason: `EMERGENCY: ${reason}`,
      disabled_at: new Date().toISOString(),
      disabled_by: disabledBy || null,
      updated_at: new Date().toISOString()
    });

  if (agentType !== 'all') {
    query = query.eq('agent_type', agentType);
  }

  const { data, error } = await query.select('id');

  if (error) {
    console.error('[KillSwitch] Emergency shutdown failed:', error.message);
    return 0;
  }

  console.error(`[KillSwitch] EMERGENCY SHUTDOWN: ${data?.length || 0} agents disabled. Reason: ${reason}`);
  return data?.length || 0;
}

/**
 * Wrapper to check kill switch before executing an agent
 */
export async function withKillSwitch<T>(
  supabase: SupabaseClient,
  agentId: string,
  agentType: 'edge_function' | 'workflow' | 'tribunal' | 'agent',
  operation: () => Promise<T>
): Promise<{ result: T | null; blocked: boolean; reason?: string }> {
  // Check kill switch
  const status = await checkKillSwitch(supabase, agentId);

  if (!status.enabled) {
    return {
      result: null,
      blocked: true,
      reason: status.reason || 'Agent is disabled'
    };
  }

  // Containment mode: soft = log only, hard = block
  if (status.containmentMode === 'hard') {
    return {
      result: null,
      blocked: true,
      reason: `Agent is in hard containment: ${status.reason || 'Unknown reason'}`
    };
  }

  if (status.containmentMode === 'soft') {
    console.warn(`[KillSwitch] Agent ${agentId} is in soft containment: ${status.reason || 'Unknown reason'}`);
  }

  try {
    const result = await operation();
    return { result, blocked: false };
  } catch (error) {
    // Record error
    await recordAgentError(supabase, agentId, agentType);
    throw error;
  }
}
