/**
 * Message Deduplication Engine
 * Universal deduplication for WhatsApp, Email, and other message imports
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  createMessageFingerprint, 
  batchCreateFingerprints,
  normalizeContent 
} from '@/lib/sync/hashUtils';

export interface DeduplicationResult {
  totalItems: number;
  uniqueItems: number;
  duplicates: number;
  newItems: number;
  mergedItems: number;
}

export interface MessageItem {
  timestamp: Date | string;
  sender: string;
  content: string;
  mediaHash?: string;
  originalIndex?: number;
}

export type MergeStrategy = 'skip' | 'update' | 'append';

// Check batch of messages for duplicates
export async function checkDuplicates(
  conversationId: string,
  messages: MessageItem[]
): Promise<{
  newMessages: MessageItem[];
  duplicateMessages: MessageItem[];
  fingerprints: Map<number, string>;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { 
      newMessages: messages, 
      duplicateMessages: [], 
      fingerprints: new Map() 
    };
  }

  // Generate fingerprints for all messages
  const fingerprints = new Map<number, string>();
  const fingerprintItems = messages.map((msg, idx) => ({
    timestamp: msg.timestamp,
    sender: msg.sender,
    content: msg.content,
    mediaHash: msg.mediaHash,
    index: msg.originalIndex ?? idx,
  }));

  const fps = await batchCreateFingerprints(fingerprintItems);
  fingerprintItems.forEach((item, i) => {
    fingerprints.set(item.index, fps[i]);
  });

  // Check which fingerprints already exist
  const { data: existing } = await supabase
    .from('message_fingerprints')
    .select('fingerprint')
    .eq('user_id', user.id)
    .in('fingerprint', fps);

  const existingSet = new Set(existing?.map(e => e.fingerprint) || []);

  // Split into new and duplicate
  const newMessages: MessageItem[] = [];
  const duplicateMessages: MessageItem[] = [];

  messages.forEach((msg, idx) => {
    const index = msg.originalIndex ?? idx;
    const fp = fingerprints.get(index);
    
    if (fp && existingSet.has(fp)) {
      duplicateMessages.push(msg);
    } else {
      newMessages.push(msg);
    }
  });

  return { newMessages, duplicateMessages, fingerprints };
}

// Store fingerprints after successful import
export async function storeFingerprints(
  conversationId: string,
  messageData: Array<{
    messageId: string;
    fingerprint: string;
  }>,
  sourceType: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || messageData.length === 0) return;

  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < messageData.length; i += batchSize) {
    const batch = messageData.slice(i, i + batchSize);
    
    await supabase
      .from('message_fingerprints')
      .upsert(
        batch.map(item => ({
          user_id: user.id,
          conversation_id: conversationId,
          message_id: item.messageId,
          fingerprint: item.fingerprint,
          source_type: sourceType,
        })),
        { 
          onConflict: 'user_id,fingerprint',
          ignoreDuplicates: true 
        }
      );
  }
}

// Deduplicate within a single import (remove internal duplicates)
export function deduplicateWithinImport(
  messages: MessageItem[]
): { unique: MessageItem[]; internalDuplicates: number } {
  const seen = new Set<string>();
  const unique: MessageItem[] = [];
  let internalDuplicates = 0;

  for (const msg of messages) {
    // Create a quick hash for internal dedup (doesn't need to be async)
    const quickHash = `${new Date(msg.timestamp).getTime()}|${msg.sender}|${normalizeContent(msg.content)}`;
    
    if (!seen.has(quickHash)) {
      seen.add(quickHash);
      unique.push(msg);
    } else {
      internalDuplicates++;
    }
  }

  return { unique, internalDuplicates };
}

// Find similar messages (near-duplicates)
export function findSimilarMessages(
  messages: MessageItem[],
  threshold: number = 0.9
): Map<number, number[]> {
  const similarGroups = new Map<number, number[]>();
  
  for (let i = 0; i < messages.length; i++) {
    const msg1 = messages[i];
    const similar: number[] = [];

    for (let j = i + 1; j < messages.length; j++) {
      const msg2 = messages[j];
      
      // Check if same sender and close in time
      if (msg1.sender !== msg2.sender) continue;
      
      const timeDiff = Math.abs(
        new Date(msg1.timestamp).getTime() - new Date(msg2.timestamp).getTime()
      );
      if (timeDiff > 60000) continue; // More than 1 minute apart

      // Check content similarity
      const similarity = calculateSimilarity(msg1.content, msg2.content);
      if (similarity >= threshold) {
        similar.push(j);
      }
    }

    if (similar.length > 0) {
      similarGroups.set(i, similar);
    }
  }

  return similarGroups;
}

// Simple Jaccard similarity for text
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeContent(text1).split(' ').filter(w => w.length > 2));
  const words2 = new Set(normalizeContent(text2).split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Process import with full deduplication
export async function processImportWithDeduplication(
  conversationId: string,
  messages: MessageItem[],
  sourceType: string,
  mergeStrategy: MergeStrategy = 'skip'
): Promise<DeduplicationResult> {
  // Step 1: Remove internal duplicates
  const { unique, internalDuplicates } = deduplicateWithinImport(messages);

  // Step 2: Check against existing messages
  const { newMessages, duplicateMessages, fingerprints } = await checkDuplicates(
    conversationId,
    unique.map((msg, idx) => ({ ...msg, originalIndex: idx }))
  );

  const result: DeduplicationResult = {
    totalItems: messages.length,
    uniqueItems: unique.length,
    duplicates: duplicateMessages.length + internalDuplicates,
    newItems: newMessages.length,
    mergedItems: 0,
  };

  // Step 3: Handle based on merge strategy
  if (mergeStrategy === 'update' && duplicateMessages.length > 0) {
    // For update strategy, we might want to update existing messages
    // This is more complex and depends on the use case
    result.mergedItems = duplicateMessages.length;
  }

  return result;
}

// Email-specific deduplication using Message-ID
export async function checkEmailDuplicates(
  messageIds: string[]
): Promise<Set<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const existingIds = new Set<string>();

  // Check fingerprints table for email message IDs
  const batchSize = 100;
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    
    const { data } = await supabase
      .from('message_fingerprints')
      .select('metadata->message_id')
      .eq('user_id', user.id)
      .in('metadata->message_id', batch);

    if (data) {
      data.forEach(row => {
        if (row['metadata->message_id']) {
          existingIds.add(row['metadata->message_id'] as string);
        }
      });
    }
  }

  return existingIds;
}
