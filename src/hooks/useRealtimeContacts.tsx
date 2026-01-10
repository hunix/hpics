import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function useRealtimeContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Track last processed time for throttling
  const lastProcessedRef = useRef<Record<string, number>>({});
  const THROTTLE_MS = 2000; // 2 second throttle

  // Throttled invalidation to prevent cascading updates
  const throttledInvalidate = useCallback((keys: string[], table: string) => {
    const now = Date.now();
    const lastProcessed = lastProcessedRef.current[table] || 0;
    
    if (now - lastProcessed < THROTTLE_MS) {
      return; // Skip if within throttle window
    }
    
    lastProcessedRef.current[table] = now;
    
    // Batch invalidations with a small delay to allow grouping
    setTimeout(() => {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    }, 100);
  }, [queryClient]);

  // Debounced toast to prevent toast spam
  const debouncedToast = useMemo(
    () => debounce((message: string) => {
      toast.info(message);
    }, 1000),
    []
  );

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
          console.log('Profile change detected:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            debouncedToast('New contact added');
          } else if (payload.eventType === 'UPDATE') {
            // Invalidate specific contact query only
            if (payload.new && 'id' in payload.new) {
              queryClient.invalidateQueries({ queryKey: ['contact', payload.new.id] });
            }
          } else if (payload.eventType === 'DELETE') {
            debouncedToast('Contact removed');
          }
          
          throttledInvalidate(['contacts', 'dashboard-stats', 'recent-contacts'], 'profiles');
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
          console.log('Communication change detected:', payload.eventType);
          throttledInvalidate(['communications', 'dashboard-stats', 'relationship-scores'], 'communications');
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
          console.log('Event change detected:', payload.eventType);
          throttledInvalidate(['events', 'upcoming-events'], 'events');
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
          console.log('Score change detected:', payload.eventType);
          throttledInvalidate(['relationship-scores'], 'scores');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(communicationsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(scoresChannel);
    };
  }, [user, queryClient, throttledInvalidate, debouncedToast]);
}
