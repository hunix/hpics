import { supabase } from '@/integrations/supabase/client';
import type { ExistingConversation } from './types';

export async function findExistingWhatsAppConversation(
  profileId: string,
  userId: string
): Promise<ExistingConversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, message_count, last_message_at, started_at')
    .eq('profile_id', profileId)
    .eq('user_id', userId)
    .eq('platform', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    messageCount: data.message_count || 0,
    lastMessageAt: data.last_message_at,
    startedAt: data.started_at,
  };
}

export async function getExistingMessageHashes(
  conversationId: string
): Promise<Set<string>> {
  const hashes = new Set<string>();
  
  const { data, error } = await supabase
    .from('messages')
    .select('sent_at, content, is_from_contact')
    .eq('conversation_id', conversationId);

  if (error || !data) {
    return hashes;
  }

  for (const msg of data) {
    const hash = createMessageHash(
      msg.sent_at,
      msg.content || '',
      msg.is_from_contact || false
    );
    hashes.add(hash);
  }

  return hashes;
}

export function createMessageHash(
  sentAt: string,
  content: string,
  isFromContact: boolean
): string {
  // Create a simple hash from message properties
  const normalized = `${sentAt}|${content.trim().toLowerCase()}|${isFromContact}`;
  return normalized;
}

export async function deleteConversationMessages(
  conversationId: string
): Promise<void> {
  // First delete associated media
  const { data: messages } = await supabase
    .from('messages')
    .select('media_id')
    .eq('conversation_id', conversationId)
    .not('media_id', 'is', null);

  if (messages && messages.length > 0) {
    const mediaIds = messages.map(m => m.media_id).filter((v): v is string => v !== null);
    if (mediaIds.length > 0) {
      await supabase
        .from('media')
        .delete()
        .in('id', mediaIds);
    }
  }

  // Delete all messages
  await supabase
    .from('messages')
    .delete()
    .eq('conversation_id', conversationId);

  // Reset conversation counts
  await supabase
    .from('conversations')
    .update({
      message_count: 0,
      last_message_at: null,
    })
    .eq('id', conversationId);
}
