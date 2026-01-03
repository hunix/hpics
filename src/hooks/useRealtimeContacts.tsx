import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useRealtimeContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast.info('New contact added');
          } else if (payload.eventType === 'UPDATE') {
            // Invalidate specific contact query
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: ['contact', payload.new.id] });
            }
          } else if (payload.eventType === 'DELETE') {
            toast.info('Contact removed');
          }
          
          // Invalidate contacts list
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['recent-contacts'] });
        }
      )
      .subscribe();

    // Subscribe to communications changes
    const communicationsChannel = supabase
      .channel('communications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Communication change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['communications'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          
          // Also invalidate relationship scores as they depend on communications
          queryClient.invalidateQueries({ queryKey: ['relationship-scores'] });
        }
      )
      .subscribe();

    // Subscribe to events changes
    const eventsChannel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Event change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['events'] });
          queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });
        }
      )
      .subscribe();

    // Subscribe to relationship scores changes
    const scoresChannel = supabase
      .channel('scores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'relationship_scores',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Score change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['relationship-scores'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(communicationsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, [user, queryClient]);
}
