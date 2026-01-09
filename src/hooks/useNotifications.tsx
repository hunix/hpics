import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'mention';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCounts {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

interface NotificationContextValue {
  notifications: Notification[];
  counts: NotificationCounts;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'created_at'>) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return default values if not in provider
    return {
      notifications: [],
      counts: { total: 0, unread: 0, byType: {} },
      isLoading: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      clearNotification: () => {},
      addNotification: () => {},
    };
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  
  // Fetch badge counts from database
  const { data: dbCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['notification-counts', user?.id],
    queryFn: async () => {
      if (!user?.id) return { communications: 0, events: 0, security: 0 };
      
      // Fetch unread counts from relevant tables
      const [commResult, eventResult] = await Promise.all([
        supabase
          .from('communications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('event_date', new Date().toISOString().split('T')[0])
          .lte('event_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);
      
      return {
        communications: commResult.count || 0,
        events: eventResult.count || 0,
        security: 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Calculate notification counts
  const counts: NotificationCounts = {
    total: localNotifications.length,
    unread: localNotifications.filter(n => !n.read).length,
    byType: {
      communications: dbCounts?.communications || 0,
      events: dbCounts?.events || 0,
      security: dbCounts?.security || 0,
    },
  };
  
  const markAsRead = useCallback((id: string) => {
    setLocalNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);
  
  const markAllAsRead = useCallback(() => {
    setLocalNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);
  
  const clearNotification = useCallback((id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'read' | 'created_at'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    
    setLocalNotifications(prev => [newNotification, ...prev]);
  }, []);
  
  // Set up realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'communications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
  
  return (
    <NotificationContext.Provider
      value={{
        notifications: localNotifications,
        counts,
        isLoading: isLoadingCounts,
        markAsRead,
        markAllAsRead,
        clearNotification,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
