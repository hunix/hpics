/**
 * Shared Query Helpers for Edge Functions
 * 
 * CRITICAL SCHEMA NOTES:
 * - The `messages` table does NOT have a `profile_id` column
 * - Messages link to profiles via: messages.conversation_id → conversations.profile_id
 * - Always use these helpers or the join pattern when querying messages for a profile
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface MessageWithConversation {
  id: string;
  conversation_id: string;
  user_id: string;
  is_from_contact: boolean;
  content: string | null;
  sent_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  whatsapp_message_id: string | null;
  whatsapp_status: string | null;
  media_id: string | null;
  media_type: string | null;
  media_filename: string | null;
  // Joined from conversations
  conversations?: {
    profile_id: string;
  };
}

/**
 * Get messages for a specific profile by joining through conversations
 * 
 * Usage:
 * const messages = await getMessagesForProfile(supabase, profileId, { limit: 100 });
 */
export async function getMessagesForProfile(
  supabase: SupabaseClient,
  profileId: string,
  options: {
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
    select?: string;
  } = {}
): Promise<MessageWithConversation[]> {
  const {
    limit = 100,
    orderBy = 'sent_at',
    ascending = false,
    select = '*'
  } = options;

  // Use !inner join to filter messages by profile_id through conversations
  const { data, error } = await supabase
    .from('messages')
    .select(`${select}, conversations!inner(profile_id)`)
    .eq('conversations.profile_id', profileId)
    .order(orderBy, { ascending })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages for profile:', error);
    return [];
  }

  return (data || []) as unknown as MessageWithConversation[];
}

/**
 * Get messages for multiple profiles
 */
export async function getMessagesForProfiles(
  supabase: SupabaseClient,
  profileIds: string[],
  options: {
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
    select?: string;
  } = {}
): Promise<MessageWithConversation[]> {
  const {
    limit = 500,
    orderBy = 'sent_at',
    ascending = false,
    select = '*'
  } = options;

  if (!profileIds.length) return [];

  // Use !inner join with in() filter
  const { data, error } = await supabase
    .from('messages')
    .select(`${select}, conversations!inner(profile_id)`)
    .in('conversations.profile_id', profileIds)
    .order(orderBy, { ascending })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages for profiles:', error);
    return [];
  }

  return (data || []) as unknown as MessageWithConversation[];
}

/**
 * Get conversation IDs for a profile (useful when you need to query messages separately)
 */
export async function getConversationIdsForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error fetching conversation IDs:', error);
    return [];
  }

  return (data || []).map(c => c.id);
}

/**
 * Count messages for a profile
 */
export async function countMessagesForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<number> {
  const conversationIds = await getConversationIdsForProfile(supabase, profileId);
  
  if (!conversationIds.length) return 0;

  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversationIds);

  if (error) {
    console.error('Error counting messages:', error);
    return 0;
  }

  return count || 0;
}
