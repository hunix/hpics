import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  saveContactsOffline,
  getOfflineContacts,
  getPendingMutations,
  clearPendingMutation,
  addPendingMutation,
  getPendingMutationCount,
  saveConversationsOffline,
  saveAlertsOffline,
  getSyncConflicts,
  resolveSyncConflict as resolveConflictInStore,
  registerBackgroundSync,
} from '@/lib/offlineStore';

interface SyncConflict {
  id: string;
  table: string;
  record_id: string;
  local_data: Record<string, unknown>;
  server_data: Record<string, unknown>;
  detected_at: string;
  resolved: boolean;
}

interface UseOfflineDataReturn {
  isOnline: boolean;
  pendingCount: number;
  syncPendingChanges: () => Promise<void>;
  isSyncing: boolean;
  cacheContacts: () => Promise<void>;
  cacheConversations: () => Promise<void>;
  cacheAlerts: () => Promise<void>;
  cacheAllData: () => Promise<void>;
  getOfflineCachedContacts: () => Promise<any[]>;
  queueMutation: (type: 'create' | 'update' | 'delete', table: string, data: Record<string, unknown>) => Promise<void>;
  syncConflicts: SyncConflict[];
  resolveConflict: (conflictId: string, resolution: 'local' | 'server') => Promise<void>;
}

export function useOfflineData(): UseOfflineDataReturn {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncConflicts, setSyncConflicts] = useState<SyncConflict[]>([]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count and conflicts
  useEffect(() => {
    const updateStatus = async () => {
      const count = await getPendingMutationCount();
      setPendingCount(count);
      
      const conflicts = await getSyncConflicts();
      setSyncConflicts(conflicts);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Register for background sync
  useEffect(() => {
    registerBackgroundSync().catch(console.error);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingChanges();
    }
  }, [isOnline]);

  const cacheContacts = useCallback(async () => {
    if (!user) return;

    try {
      const { data: contacts } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, organization, job_title, relationship_type, is_favorite, updated_at')
        .eq('user_id', user.id)
        .order('first_name');

      if (contacts) {
        const mappedContacts = contacts.map(c => ({
          id: c.id,
          first_name: c.first_name,
          last_name: c.last_name,
          avatar_url: c.avatar_url,
          company: c.organization,
          job_title: c.job_title,
          relationship_type: c.relationship_type,
          is_favorite: c.is_favorite || false,
          updated_at: c.updated_at,
        }));
        await saveContactsOffline(mappedContacts);
      }
    } catch (error) {
      console.error('Failed to cache contacts:', error);
    }
  }, [user]);

  const cacheConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: communications } = await supabase
        .from('communications')
        .select('id, profile_id, channel, subject, content, occurred_at')
        .eq('user_id', user.id)
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (communications) {
        // Map communications to offline conversation format
        const conversations = communications.map(c => ({
          id: c.id,
          profile_id: c.profile_id,
          title: c.subject || c.channel,
          last_message: c.content?.slice(0, 100) || null,
          last_message_at: c.occurred_at,
          unread_count: 0,
          updated_at: c.occurred_at,
        }));
        await saveConversationsOffline(conversations);
      }
    } catch (error) {
      console.error('Failed to cache conversations:', error);
    }
  }, [user]);

  const cacheAlerts = useCallback(async () => {
    if (!user) return;

    try {
      const { data: alerts } = await supabase
        .from('intelligence_alerts')
        .select('id, alert_type, title, severity, profile_id, is_acknowledged, created_at')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (alerts) {
        const mappedAlerts = alerts.map(a => ({
          id: a.id,
          profile_id: a.profile_id,
          alert_type: a.alert_type,
          severity: a.severity || 'medium',
          message: a.title,
          created_at: a.created_at,
          is_read: a.is_acknowledged || false,
        }));
        await saveAlertsOffline(mappedAlerts);
      }
    } catch (error) {
      console.error('Failed to cache alerts:', error);
    }
  }, [user]);

  const cacheAllData = useCallback(async () => {
    await Promise.all([
      cacheContacts(),
      cacheConversations(),
      cacheAlerts(),
    ]);
  }, [cacheContacts, cacheConversations, cacheAlerts]);

  const getOfflineCachedContacts = useCallback(async () => {
    return getOfflineContacts();
  }, []);

  const queueMutation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    table: string,
    data: Record<string, unknown>
  ) => {
    await addPendingMutation({ type, table, data });
    const count = await getPendingMutationCount();
    setPendingCount(count);
  }, []);

  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'server') => {
    await resolveConflictInStore(conflictId, resolution);
    const conflicts = await getSyncConflicts();
    setSyncConflicts(conflicts);
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      const mutations = await getPendingMutations();

      for (const mutation of mutations) {
        try {
          switch (mutation.type) {
            case 'create':
              await supabase.from(mutation.table as 'profiles').insert(mutation.data as any);
              break;
            case 'update':
              if (mutation.data.id) {
                const { id, ...updateData } = mutation.data;
                await supabase.from(mutation.table as 'profiles').update(updateData as any).eq('id', id as string);
              }
              break;
            case 'delete':
              if (mutation.data.id) {
                await supabase.from(mutation.table as 'profiles').delete().eq('id', mutation.data.id as string);
              }
              break;
          }
          await clearPendingMutation(mutation.id);
        } catch (error) {
          console.error('Failed to sync mutation:', mutation.id, error);
        }
      }

      // Refresh cache after sync
      await cacheAllData();
      
      const count = await getPendingMutationCount();
      setPendingCount(count);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, cacheAllData]);

  return {
    isOnline,
    pendingCount,
    syncPendingChanges,
    isSyncing,
    cacheContacts,
    cacheConversations,
    cacheAlerts,
    cacheAllData,
    getOfflineCachedContacts,
    queueMutation,
    syncConflicts,
    resolveConflict,
  };
}
