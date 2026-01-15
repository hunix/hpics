/**
 * Push Notifications Hook
 * Manages browser push notifications for critical intelligence alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationPreference {
  id: string;
  userId: string;
  alertType: string;
  enabled: boolean;
  threshold: number;
  channels: ('push' | 'email' | 'in_app')[];
}

export interface CriticalAlert {
  id: string;
  type: 'betrayal_risk' | 'mice_spike' | 'sacred_violation' | 'semantic_success' | 'counter_intel';
  profileId: string;
  profileName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, any>;
  timestamp: Date;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported in this browser');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Push notifications enabled');
        return true;
      } else {
        toast.error('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, [isSupported]);

  // Update preference
  const updatePreference = useMutation({
    mutationFn: async ({ 
      alertType, 
      enabled, 
      threshold,
      channels 
    }: { 
      alertType: string; 
      enabled: boolean; 
      threshold?: number;
      channels?: ('push' | 'email' | 'in_app')[];
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('alert_type', alertType)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('notification_preferences')
          .update({
            is_enabled: enabled,
            threshold_value: threshold,
            channels: channels,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            alert_type: alertType,
            is_enabled: enabled,
            threshold_value: threshold || 70,
            channels: channels || ['in_app'],
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Notification preference updated');
    },
    onError: (error) => {
      toast.error(`Failed to update preference: ${error.message}`);
    },
  });

  // Send local notification
  const sendNotification = useCallback((alert: CriticalAlert) => {
    if (permission !== 'granted' || !isSupported) return;

    const severityIcons: Record<string, string> = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🔴',
      critical: '🚨',
    };

    const notification = new Notification(`${severityIcons[alert.severity]} AGIS Alert`, {
      body: `${alert.profileName}: ${alert.message}`,
      icon: '/favicon.ico',
      tag: alert.id,
      requireInteraction: alert.severity === 'critical',
      data: alert,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to profile or alert details
      if (alert.profileId) {
        window.location.href = `/contacts/${alert.profileId}`;
      }
    };
  }, [permission, isSupported]);

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!user?.id || permission !== 'granted') return;

    const channel = supabase
      .channel('critical-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'betrayal_predictions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as any;
          if (data.defection_probability > 0.7) {
            sendNotification({
              id: data.id,
              type: 'betrayal_risk',
              profileId: data.profile_id,
              profileName: 'Contact',
              severity: data.defection_probability > 0.85 ? 'critical' : 'high',
              message: `Betrayal risk at ${(data.defection_probability * 100).toFixed(0)}%`,
              data,
              timestamp: new Date(),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mice_assessments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as any;
          const maxScore = Math.max(
            data.money_score || 0,
            data.ideology_score || 0,
            data.compromise_score || 0,
            data.ego_score || 0
          );
          if (maxScore > 0.8) {
            sendNotification({
              id: data.id,
              type: 'mice_spike',
              profileId: data.profile_id,
              profileName: 'Contact',
              severity: 'high',
              message: `MICE vulnerability spike detected`,
              data,
              timestamp: new Date(),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'counter_intel_events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const data = payload.new as any;
          sendNotification({
            id: data.id,
            type: 'counter_intel',
            profileId: data.profile_id,
            profileName: 'Contact',
            severity: data.threat_level === 'high' ? 'critical' : 'high',
            message: `Counter-intelligence activity detected: ${data.detection_type}`,
            data,
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, sendNotification]);

  return {
    isSupported,
    permission,
    preferences,
    isLoading,
    requestPermission,
    updatePreference: updatePreference.mutate,
    sendNotification,
    isUpdating: updatePreference.isPending,
  };
}
