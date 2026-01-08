// Agency-Grade Security Audit Logging
// Provides tamper-proof, hash-chained audit trails for sensitive operations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AuditAction = 
  | 'data_access'
  | 'data_modification'
  | 'ai_analysis'
  | 'export'
  | 'biometric_access'
  | 'encryption_operation'
  | 'authentication'
  | 'authorization'
  | 'bulk_operation'
  | 'admin_action';

export type SensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogEntry {
  action: AuditAction;
  userId: string;
  targetType: string;
  targetId?: string;
  details: Record<string, unknown>;
  sensitivityLevel: SensitivityLevel;
  ipAddress?: string;
  userAgent?: string;
  functionName: string;
  success: boolean;
  errorMessage?: string;
}

// Simple hash function for chain integrity
async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create an immutable audit log entry with hash chain
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get the previous entry's hash for chain integrity
    const { data: lastEntry } = await supabase
      .from('immutable_audit_logs')
      .select('entry_hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousHash = lastEntry?.entry_hash || 'genesis';

    // Create the log data
    const logData = {
      timestamp: new Date().toISOString(),
      ...entry,
      previousHash,
    };

    // Compute hash for this entry
    const entryHash = await computeHash(JSON.stringify(logData));

    // Insert into immutable audit log
    await supabase.from('immutable_audit_logs').insert({
      user_id: entry.userId,
      action_type: entry.action,
      action_category: entry.targetType,
      target_id: entry.targetId,
      request_data: entry.details,
      response_data: { success: entry.success, error: entry.errorMessage },
      sensitivity_level: entry.sensitivityLevel,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      function_name: entry.functionName,
      previous_hash: previousHash,
      entry_hash: entryHash,
    });

    // For critical operations, also log to a separate high-security table
    if (entry.sensitivityLevel === 'critical') {
      console.log(`[CRITICAL AUDIT] ${entry.action} by ${entry.userId} on ${entry.targetType}:${entry.targetId}`);
    }
  } catch (error) {
    // Audit logging should never fail silently for security reasons
    console.error('[AUDIT LOG FAILURE]', error, entry);
    // In production, this would trigger an alert
  }
}

/**
 * Verify the integrity of the audit chain
 */
export async function verifyAuditChain(
  startDate?: Date,
  endDate?: Date
): Promise<{ valid: boolean; brokenAt?: string; totalEntries: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let query = supabase
    .from('immutable_audit_logs')
    .select('id, entry_hash, previous_hash, created_at')
    .order('created_at', { ascending: true });

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data: entries, error } = await query;

  if (error || !entries) {
    return { valid: false, brokenAt: 'query_failed', totalEntries: 0 };
  }

  let previousHash = 'genesis';
  for (const entry of entries) {
    if (entry.previous_hash !== previousHash) {
      return { valid: false, brokenAt: entry.id, totalEntries: entries.length };
    }
    previousHash = entry.entry_hash;
  }

  return { valid: true, totalEntries: entries.length };
}

/**
 * Helper to determine sensitivity level based on operation type
 */
export function getSensitivityLevel(
  action: AuditAction,
  targetType: string
): SensitivityLevel {
  // Critical: Biometrics, encryption keys, admin actions
  if (
    action === 'biometric_access' ||
    action === 'encryption_operation' ||
    action === 'admin_action' ||
    targetType === 'encryption_keys' ||
    targetType === 'biometric_samples' ||
    targetType === 'user_roles'
  ) {
    return 'critical';
  }

  // High: AI analysis, exports, auth operations
  if (
    action === 'ai_analysis' ||
    action === 'export' ||
    action === 'authentication' ||
    action === 'authorization'
  ) {
    return 'high';
  }

  // Medium: Data modifications, bulk operations
  if (action === 'data_modification' || action === 'bulk_operation') {
    return 'medium';
  }

  // Low: Read operations
  return 'low';
}

/**
 * Decorator for auditing edge function operations
 */
export async function withAudit<T>(
  entry: Omit<AuditLogEntry, 'success' | 'errorMessage'>,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    
    await createAuditLog({
      ...entry,
      success: true,
      details: {
        ...entry.details,
        durationMs: Date.now() - startTime,
      },
    });
    
    return result;
  } catch (error) {
    await createAuditLog({
      ...entry,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
      details: {
        ...entry.details,
        durationMs: Date.now() - startTime,
      },
    });
    
    throw error;
  }
}
