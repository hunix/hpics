/**
 * Differential Sync Engine
 * Handles incremental syncing with deduplication across all data sources
 */

import { supabase } from '@/integrations/supabase/client';
import { createMessageFingerprint, createSocialPostFingerprint } from './hashUtils';

export type SyncSourceType = 
  | 'instagram' 
  | 'linkedin' 
  | 'threads' 
  | 'twitter' 
  | 'whatsapp' 
  | 'gmail' 
  | 'outlook'
  | 'location'
  | 'biometrics';

export interface SyncCursor {
  id: string;
  user_id: string;
  source_type: SyncSourceType;
  source_identifier: string | null;
  profile_id: string | null;
  last_sync_at: string | null;
  last_item_timestamp: string | null;
  last_item_id: string | null;
  items_synced_total: number;
  sync_hash: string | null;
  sync_status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsSkipped: number;
  newCursor: Partial<SyncCursor>;
  errors: string[];
}

// Get or create sync cursor for a source
export async function getOrCreateSyncCursor(
  sourceType: SyncSourceType,
  sourceIdentifier: string,
  profileId?: string
): Promise<SyncCursor | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to get existing cursor
  const { data: existing } = await supabase
    .from('sync_cursors')
    .select('*')
    .eq('user_id', user.id)
    .eq('source_type', sourceType)
    .eq('source_identifier', sourceIdentifier)
    .maybeSingle();

  if (existing) {
    return existing as SyncCursor;
  }

  // Create new cursor
  const { data: created, error } = await supabase
    .from('sync_cursors')
    .insert({
      user_id: user.id,
      source_type: sourceType,
      source_identifier: sourceIdentifier,
      profile_id: profileId,
      sync_status: 'idle',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create sync cursor:', error);
    return null;
  }

  return created as SyncCursor;
}

// Update sync cursor after successful sync
export async function updateSyncCursor(
  cursorId: string,
  updates: Partial<Omit<SyncCursor, 'metadata'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('sync_cursors')
    .update({
      last_sync_at: updates.last_sync_at,
      last_item_timestamp: updates.last_item_timestamp,
      last_item_id: updates.last_item_id,
      items_synced_total: updates.items_synced_total,
      sync_status: updates.sync_status,
      error_message: updates.error_message,
    })
    .eq('id', cursorId);

  return !error;
}

// Set sync status
export async function setSyncStatus(
  cursorId: string,
  status: 'idle' | 'syncing' | 'error' | 'completed',
  errorMessage?: string
): Promise<void> {
  await supabase
    .from('sync_cursors')
    .update({
      sync_status: status,
      error_message: errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cursorId);
}

// Check if message already exists using fingerprint
export async function checkMessageExists(fingerprint: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('message_fingerprints')
    .select('id')
    .eq('user_id', user.id)
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  return !!data;
}

// Batch check for existing messages
export async function batchCheckMessages(
  fingerprints: string[]
): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const existingSet = new Set<string>();
  
  // Check in batches of 100
  const batchSize = 100;
  for (let i = 0; i < fingerprints.length; i += batchSize) {
    const batch = fingerprints.slice(i, i + batchSize);
    const { data } = await supabase
      .from('message_fingerprints')
      .select('fingerprint')
      .eq('user_id', user.id)
      .in('fingerprint', batch);
    
    if (data) {
      data.forEach(row => existingSet.add(row.fingerprint));
    }
  }

  return existingSet;
}

// Store message fingerprint after successful import
export async function storeMessageFingerprint(
  conversationId: string,
  messageId: string,
  fingerprint: string,
  sourceType: SyncSourceType
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('message_fingerprints')
    .upsert({
      user_id: user.id,
      conversation_id: conversationId,
      message_id: messageId,
      fingerprint,
      source_type: sourceType,
    }, {
      onConflict: 'user_id,fingerprint',
      ignoreDuplicates: true,
    });
}

// Get all sync cursors for dashboard
export async function getAllSyncCursors(): Promise<SyncCursor[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('sync_cursors')
    .select('*')
    .eq('user_id', user.id)
    .order('last_sync_at', { ascending: false, nullsFirst: false });

  return (data || []) as SyncCursor[];
}

// Filter new items based on cursor
export function filterNewItems<T extends { timestamp: string; id?: string }>(
  items: T[],
  cursor: SyncCursor
): T[] {
  if (!cursor.last_item_timestamp) {
    return items;
  }

  const lastTimestamp = new Date(cursor.last_item_timestamp).getTime();
  
  return items.filter(item => {
    const itemTime = new Date(item.timestamp).getTime();
    
    // After last synced timestamp
    if (itemTime > lastTimestamp) return true;
    
    // Same timestamp but different ID (handle items posted at same second)
    if (itemTime === lastTimestamp && item.id && item.id !== cursor.last_item_id) {
      return true;
    }
    
    return false;
  });
}

// Calculate items to sync with deduplication
export async function prepareIncrementalSync<T extends {
  timestamp: string | Date;
  sender?: string;
  content?: string;
  id?: string;
}>(
  items: T[],
  sourceType: SyncSourceType
): Promise<{
  newItems: T[];
  existingFingerprints: Set<string>;
  fingerprints: Map<T, string>;
}> {
  const fingerprints = new Map<T, string>();
  
  // Generate fingerprints for all items
  for (const item of items) {
    let fp: string;
    
    if (sourceType === 'instagram' || sourceType === 'linkedin' || 
        sourceType === 'threads' || sourceType === 'twitter') {
      fp = await createSocialPostFingerprint(
        sourceType,
        item.id || '',
        item.timestamp
      );
    } else {
      fp = await createMessageFingerprint(
        item.timestamp,
        item.sender || '',
        item.content || ''
      );
    }
    
    fingerprints.set(item, fp);
  }

  // Check which already exist
  const allFingerprints = Array.from(fingerprints.values());
  const existingFingerprints = await batchCheckMessages(allFingerprints);

  // Filter to only new items
  const newItems = items.filter(item => {
    const fp = fingerprints.get(item);
    return fp && !existingFingerprints.has(fp);
  });

  return { newItems, existingFingerprints, fingerprints };
}

// Sync status helper
export function getSyncStatusDisplay(cursor: SyncCursor): {
  status: 'idle' | 'syncing' | 'error' | 'success';
  message: string;
  lastSync: string | null;
} {
  const lastSync = cursor.last_sync_at 
    ? new Date(cursor.last_sync_at).toLocaleString()
    : null;

  if (cursor.sync_status === 'error') {
    return {
      status: 'error',
      message: cursor.error_message || 'Sync failed',
      lastSync,
    };
  }

  if (cursor.sync_status === 'syncing') {
    return {
      status: 'syncing',
      message: 'Syncing...',
      lastSync,
    };
  }

  if (cursor.items_synced_total > 0) {
    return {
      status: 'success',
      message: `${cursor.items_synced_total} items synced`,
      lastSync,
    };
  }

  return {
    status: 'idle',
    message: 'Not synced yet',
    lastSync,
  };
}
