/**
 * @fileoverview Supabase Vault helpers for API key management
 * All keys are stored encrypted in vault.secrets, scoped per-user
 */

import { supabase } from '@/integrations/supabase/client';

export interface VaultSaveResult {
  name: string;
  success: boolean;
  error?: string;
}

/** Save a single API key to Vault with readback verification */
export async function saveApiKey(name: string, value: string): Promise<VaultSaveResult> {
  try {
    const { error: saveError } = await supabase.rpc('store_api_key', {
      p_name: name,
      p_value: value,
    });
    if (saveError) throw saveError;

    // Readback verification
    const { data: readback, error: readError } = await supabase.rpc('get_api_key', {
      p_name: name,
    });
    if (readError) throw readError;

    if (readback !== value) {
      return { name, success: false, error: 'Key did not persist — readback mismatch' };
    }

    return { name, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { name, success: false, error: message };
  }
}

/** Read a single API key from Vault */
export async function getApiKey(name: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_api_key', { p_name: name });
  if (error) {
    console.error(`[vault] Failed to read key "${name}":`, error.message);
    return null;
  }
  return data as string | null;
}

/** Check which keys exist in Vault (name → boolean map) */
export async function checkApiKeys(names: string[]): Promise<Record<string, boolean>> {
  if (names.length === 0) return {};
  const { data, error } = await supabase.rpc('check_api_keys', { p_names: names });
  if (error) {
    console.error('[vault] Failed to check keys:', error.message);
    return Object.fromEntries(names.map((n) => [n, false]));
  }
  return (data as unknown as Record<string, boolean>) ?? {};
}

/** Delete a single API key from Vault */
export async function deleteApiKey(name: string): Promise<boolean> {
  const { error } = await supabase.rpc('delete_api_key', { p_name: name });
  if (error) {
    console.error(`[vault] Failed to delete key "${name}":`, error.message);
    return false;
  }
  return true;
}

/** Batch save with readback verification, returns per-key results */
export async function saveApiKeys(
  entries: Array<{ name: string; value: string }>
): Promise<VaultSaveResult[]> {
  const results = await Promise.all(
    entries.map(({ name, value }) => saveApiKey(name, value))
  );
  return results;
}
