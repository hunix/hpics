import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AddMessageInput {
  content: string;
  isFromContact: boolean;
}

export function useAddMessage(conversationId: string | undefined, currentMessageCount: number) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, isFromContact }: AddMessageInput) => {
      if (!conversationId) throw new Error('conversationId required');
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        user_id: user.id,
        content,
        is_from_contact: isFromContact,
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: currentMessageCount + 1,
        })
        .eq('id', conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
  });
}
