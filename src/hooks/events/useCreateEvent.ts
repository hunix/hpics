import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EventInput {
  profile_id: string;
  event_type: string;
  title: string;
  description: string;
  event_date: string;
  reminder_frequency: string;
  reminder_days_before: string;
}

export function useCreateEvent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EventInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('events').insert({
        user_id: user.id,
        profile_id: data.profile_id || null,
        event_type: data.event_type as never,
        title: data.title,
        description: data.description || null,
        event_date: data.event_date,
        reminder_frequency: data.reminder_frequency as never,
        reminder_days_before: parseInt(data.reminder_days_before) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
}
