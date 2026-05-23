import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LogFollowupInput {
  contactId: string;
  channel: string;
}

export function useLogFollowup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, channel }: LogFollowupInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('communications').insert({
        profile_id: contactId,
        user_id: user.id,
        channel: channel as never,
        direction: 'outbound',
        subject: 'Follow-up',
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ last_contact_date: new Date().toISOString() })
        .eq('id', contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-up-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
