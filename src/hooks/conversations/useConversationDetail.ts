import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useContactProfile(contactId: string | undefined) {
  return useQuery({
    queryKey: ['profile', contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('id', contactId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export interface MessageRow {
  id: string;
  content: string;
  is_from_contact: boolean;
  sent_at: string;
  media_id: string | null;
  media_filename: string | null;
  media_type: string | null;
  media: { id: string; file_url: string; mime_type: string | null; storage_path: string | null } | null;
}

export function useConversationMessages(conversationId: string | undefined, initialLoad: number, batchSize: number) {
  return useInfiniteQuery({
    queryKey: ['conversation-messages', conversationId],
    enabled: !!conversationId,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const limit = pageParam ? batchSize : initialLoad;
      let query = supabase
        .from('messages')
        .select('id, content, is_from_contact, sent_at, media_id, media_filename, media_type, media:media_id(id, file_url, mime_type, storage_path)')
        .eq('conversation_id', conversationId!)
        .order('sent_at', { ascending: false })
        .limit(limit);
      if (pageParam) {
        query = query.lt('sent_at', pageParam);
      }
      const { data, error } = await query;
      if (error) throw error;
      return ((data ?? []) as unknown) as MessageRow[];
    },
    getNextPageParam: (lastPage, allPages) => {
      const expectedSize = allPages.length === 1 ? initialLoad : batchSize;
      if (lastPage.length < expectedSize) return undefined;
      return lastPage[lastPage.length - 1]?.sent_at;
    },
  });
}

export interface ConversationMediaItem {
  id: string;
  file_url: string;
  mime_type: string | null;
  storage_path: string | null;
  sent_at: string;
  message_content: string;
  media_filename: string | null;
}

export function useConversationMedia(conversationId: string | undefined) {
  return useQuery<ConversationMediaItem[]>({
    queryKey: ['conversation-media', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('sent_at, content, media_filename, media:media_id(id, file_url, mime_type, storage_path)')
        .eq('conversation_id', conversationId!)
        .not('media_id', 'is', null)
        .order('sent_at', { ascending: false });
      if (error) throw error;
      type Row = {
        sent_at: string;
        content: string;
        media_filename: string | null;
        media: { id: string; file_url: string; mime_type: string | null; storage_path: string | null } | null;
      };
      return ((data ?? []) as unknown as Row[])
        .filter((m): m is Row & { media: NonNullable<Row['media']> } => m.media !== null)
        .map((m) => ({
          id: m.media.id,
          file_url: m.media.file_url,
          mime_type: m.media.mime_type,
          storage_path: m.media.storage_path,
          sent_at: m.sent_at,
          message_content: m.content,
          media_filename: m.media_filename,
        }));
    },
  });
}
