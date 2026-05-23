import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CommunicationInput {
  profile_id: string;
  channel: string;
  direction: string;
  subject: string;
  content: string;
  duration_minutes: string;
  occurred_at: string;
}

export function useCreateCommunication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CommunicationInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('communications').insert({
        user_id: user.id,
        profile_id: data.profile_id,
        channel: data.channel as never,
        direction: data.direction as never,
        subject: data.subject || null,
        content: data.content || null,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        occurred_at: data.occurred_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contact-communications'] });
    },
  });
}
