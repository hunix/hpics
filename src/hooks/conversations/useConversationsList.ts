import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useConversationsList(profileId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('profile_id', profileId!)
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface CreateConversationInput {
  platform: string;
  title: string;
}

export function useCreateConversation(profileId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateConversationInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!profileId) throw new Error('profileId required');
      const { data: convo, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          platform: data.platform as never,
          title: data.title || `${data.platform} conversation`,
        })
        .select()
        .single();
      if (error) throw error;
      return convo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', profileId] });
    },
  });
}

export function useDeleteConversation(profileId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', profileId] });
    },
  });
}
