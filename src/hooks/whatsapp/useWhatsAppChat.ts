import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useWhatsAppConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-config', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useWhatsAppConversation(profileId: string, profileName: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-conversation', profileId],
    enabled: !!user && !!profileId,
    queryFn: async () => {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('platform', 'whatsapp')
        .maybeSingle();
      if (existing) return existing;

      if (!user?.id) throw new Error('Not authenticated');
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          platform: 'whatsapp',
          title: `WhatsApp with ${profileName}`,
        })
        .select()
        .single();
      if (error) throw error;
      return newConv;
    },
  });
}

export function useWhatsAppMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId!)
        .order('sent_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWhatsAppMessageSubscription(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`whatsapp-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);
}
