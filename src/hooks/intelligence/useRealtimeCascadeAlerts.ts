// Realtime Cascade Alerts Hook
// Subscribes to agis_cascade_events for live notifications

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getPhaseName } from '@/lib/agis/phaseConfig';
import { toast } from 'sonner';

export interface CascadeAlert {
  id: string;
  triggerPhase: number;
  phaseName: string;
  eventType: string;
  affectedPhases: number[];
  outcomeStatus: string;
  startedAt: string;
  isNew: boolean;
}

export function useRealtimeCascadeAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<CascadeAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, []);

  const dismissAll = useCallback(() => {
    setAlerts([]);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('cascade-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agis_cascade_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEvent = payload.new as {
            id: string;
            trigger_phase: number;
            trigger_event_type: string;
            affected_phases: number[] | null;
            outcome_status: string | null;
            started_at: string | null;
          };

          const alert: CascadeAlert = {
            id: newEvent.id,
            triggerPhase: newEvent.trigger_phase,
            phaseName: getPhaseName(newEvent.trigger_phase),
            eventType: newEvent.trigger_event_type,
            affectedPhases: newEvent.affected_phases || [],
            outcomeStatus: newEvent.outcome_status || 'in_progress',
            startedAt: newEvent.started_at || new Date().toISOString(),
            isNew: true,
          };

          setAlerts(prev => [alert, ...prev].slice(0, 10));

          // Show toast notification
          toast.info(`Cascade triggered from ${alert.phaseName}`, {
            description: alert.eventType.replace(/_/g, ' '),
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agis_cascade_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedEvent = payload.new as {
            id: string;
            outcome_status: string | null;
          };

          setAlerts(prev =>
            prev.map(a =>
              a.id === updatedEvent.id
                ? { ...a, outcomeStatus: updatedEvent.outcome_status || a.outcomeStatus, isNew: false }
                : a
            )
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Load recent alerts on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadRecentAlerts = async () => {
      const { data } = await supabase
        .from('agis_cascade_events')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(5);

      if (data) {
        const recentAlerts: CascadeAlert[] = data.map(e => ({
          id: e.id,
          triggerPhase: e.trigger_phase,
          phaseName: getPhaseName(e.trigger_phase),
          eventType: e.trigger_event_type,
          affectedPhases: e.affected_phases || [],
          outcomeStatus: e.outcome_status || 'unknown',
          startedAt: e.started_at || e.created_at || new Date().toISOString(),
          isNew: false,
        }));
        setAlerts(recentAlerts);
      }
    };

    loadRecentAlerts();
  }, [user?.id]);

  const unreadCount = alerts.filter(a => a.isNew).length;
  const criticalAlerts = alerts.filter(a => a.outcomeStatus === 'failed' || a.affectedPhases.length > 3);

  return {
    alerts,
    unreadCount,
    criticalAlerts,
    isConnected,
    dismissAlert,
    dismissAll,
  };
}
