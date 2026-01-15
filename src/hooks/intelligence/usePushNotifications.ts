/**
 * Push Notifications Hook
 * Manages browser push notifications for critical intelligence alerts
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface NotificationPreference {
  id: string;
  userId: string;
  alertType: string;
  enabled: boolean;
  threshold: number;
  channels: string[];
}

export interface CriticalAlert {
  id: string;
  type: 'betrayal_risk' | 'mice_spike' | 'sacred_violation' | 'semantic_success' | 'counter_intel';
  profileId: string;
  profileName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const { data: preferences, isLoading, refetch } = useQuery({
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

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Push notifications are not supported');
      return false;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Push notifications enabled');
        return true;
      }
      toast.error('Permission denied');
      return false;
    } catch {
      toast.error('Failed to request permission');
      return false;
    }
  }, [isSupported]);

  const updatePreference = useCallback(async (params: { 
    alertType: string; 
    enabled: boolean; 
    threshold?: number; 
    channels?: string[] 
  }) => {
    if (!user?.id) {
      toast.error('Not authenticated');
      return;
    }
    
    setIsUpdating(true);
    try {
      const { alertType, enabled, threshold, channels } = params;

      const { data: existing } = await (supabase
        .from('notification_preferences') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('alert_type', alertType)
        .maybeSingle();

      if (existing) {
        const updateData: Record<string, unknown> = { 
          is_enabled: enabled, 
          updated_at: new Date().toISOString() 
        };
        if (threshold !== undefined) updateData.threshold_value = threshold;
        if (channels !== undefined) updateData.channels = channels;
        
        await (supabase
          .from('notification_preferences') as any)
          .update(updateData)
          .eq('id', existing.id);
      } else {
        const insertData: Record<string, unknown> = { 
          user_id: user.id, 
          alert_type: alertType, 
          is_enabled: enabled, 
          threshold_value: threshold || 70, 
          channels: channels || ['in_app'] 
        };
        
        await (supabase
          .from('notification_preferences') as any)
          .insert(insertData);
      }
      
      await refetch();
      toast.success('Preference updated');
    } catch {
      toast.error('Failed to update preference');
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, refetch]);

  const sendNotification = useCallback((alert: CriticalAlert) => {
    if (permission !== 'granted' || !isSupported) return;
    const icons: Record<string, string> = { low: 'ℹ️', medium: '⚠️', high: '🔴', critical: '🚨' };
    const notification = new Notification(`${icons[alert.severity]} AGIS Alert`, {
      body: `${alert.profileName}: ${alert.message}`,
      icon: '/favicon.ico',
      tag: alert.id,
      requireInteraction: alert.severity === 'critical',
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }, [permission, isSupported]);

  useEffect(() => {
    if (!user?.id || permission !== 'granted') return;
    const channel = supabase
      .channel('critical-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'betrayal_predictions', filter: `user_id=eq.${user.id}` }, (payload) => {
        const data = payload.new as Record<string, unknown>;
        if ((data.defection_probability as number) > 0.7) {
          sendNotification({
            id: data.id as string,
            type: 'betrayal_risk',
            profileId: data.profile_id as string,
            profileName: 'Contact',
            severity: (data.defection_probability as number) > 0.85 ? 'critical' : 'high',
            message: `Betrayal risk at ${((data.defection_probability as number) * 100).toFixed(0)}%`,
            data,
            timestamp: new Date(),
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, permission, sendNotification]);

  return {
    isSupported,
    permission,
    preferences,
    isLoading,
    requestPermission,
    updatePreference,
    sendNotification,
    isUpdating,
  };
}
