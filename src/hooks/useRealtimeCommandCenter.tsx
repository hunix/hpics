/**
 * Realtime Command Center Hook
 * Subscribes to live updates across all command center data sources
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RealtimeOptions {
  showNotifications?: boolean;
}

export function useRealtimeCommandCenter(options: RealtimeOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showNotifications = true } = options;

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to power network analysis changes
    const powerChannel = supabase
      .channel('power-network-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'power_network_analyses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['power-matrix'] });
          queryClient.invalidateQueries({ queryKey: ['power-analysis'] });
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.info('Power Matrix updated', { 
              description: 'New network analysis available' 
            });
          }
        }
      )
      .subscribe();

    // Subscribe to prediction changes
    const predictionsChannel = supabase
      .channel('predictions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'behavioral_scenario_predictions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['prediction-feed'] });
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.info('New Prediction', { 
              description: 'AI has generated new behavioral predictions' 
            });
          }
        }
      )
      .subscribe();

    // Subscribe to anomalies/risks changes
    const risksChannel = supabase
      .channel('risks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'behavioral_anomalies',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['risk-radar'] });
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.warning('Risk Detected', { 
              description: 'New behavioral anomaly identified' 
            });
          }
        }
      )
      .subscribe();

    // Subscribe to action recommendations changes
    const actionsChannel = supabase
      .channel('actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_recommendations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['opportunity-queue'] });
          queryClient.invalidateQueries({ queryKey: ['action-tracker'] });
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.success('New Opportunity', { 
              description: 'Action recommendation ready' 
            });
          }
        }
      )
      .subscribe();

    // Subscribe to deception analysis changes
    const deceptionChannel = supabase
      .channel('deception-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deception_analyses',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['risk-radar'] });
          queryClient.invalidateQueries({ queryKey: ['deception-analysis'] });
          if (showNotifications && payload.eventType === 'INSERT') {
            toast.warning('Deception Analysis', { 
              description: 'New credibility insights available' 
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(powerChannel);
      supabase.removeChannel(predictionsChannel);
      supabase.removeChannel(risksChannel);
      supabase.removeChannel(actionsChannel);
      supabase.removeChannel(deceptionChannel);
    };
  }, [user?.id, queryClient, showNotifications]);
}
