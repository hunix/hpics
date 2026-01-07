import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ServerSideMessage {
  id: string;
  content: string;
  is_from_contact: boolean;
  sent_at: string;
  conversation_id: string;
  profile_id: string;
}

interface UseServerSideMessagesOptions {
  conversationId?: string;
  profileId?: string;
  searchQuery?: string;
  pageSize?: number;
  enabled?: boolean;
}

export function useServerSideMessages({
  conversationId,
  profileId,
  searchQuery,
  pageSize = 50,
  enabled = true,
}: UseServerSideMessagesOptions) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['server-messages', user?.id, conversationId, profileId, searchQuery],
    queryFn: async ({ pageParam }) => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase.rpc('search_messages_v2', {
        p_user_id: user.id,
        p_conversation_id: conversationId || null,
        p_profile_id: profileId || null,
        p_search_query: searchQuery || null,
        p_limit: pageSize,
        p_cursor_time: pageParam || null,
      });

      if (error) throw error;
      
      const messages = (data || []) as ServerSideMessage[];
      const lastMessage = messages[messages.length - 1];
      
      return {
        messages,
        nextCursor: messages.length === pageSize ? lastMessage?.sent_at : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !!user?.id,
    staleTime: 10000,
  });
}

// Hook for searching messages across all conversations
export function useGlobalMessageSearch(searchQuery: string, enabled = true) {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['global-message-search', user?.id, searchQuery],
    queryFn: async ({ pageParam }) => {
      if (!user?.id || !searchQuery) throw new Error('No user or search query');

      const { data, error } = await supabase.rpc('search_messages_v2', {
        p_user_id: user.id,
        p_search_query: searchQuery,
        p_limit: 50,
        p_cursor_time: pageParam || null,
      });

      if (error) throw error;
      
      const messages = (data || []) as ServerSideMessage[];
      const lastMessage = messages[messages.length - 1];
      
      return {
        messages,
        nextCursor: messages.length === 50 ? lastMessage?.sent_at : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !!user?.id && !!searchQuery && searchQuery.length >= 2,
    staleTime: 30000,
  });
}
