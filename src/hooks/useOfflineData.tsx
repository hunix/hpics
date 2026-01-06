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
} from '@/lib/offlineStore';

interface UseOfflineDataReturn {
  isOnline: boolean;
  pendingCount: number;
  syncPendingChanges: () => Promise<void>;
  isSyncing: boolean;
  cacheContacts: () => Promise<void>;
  getOfflineCachedContacts: () => Promise<any[]>;
  queueMutation: (type: 'create' | 'update' | 'delete', table: string, data: Record<string, unknown>) => Promise<void>;
}

export function useOfflineData(): UseOfflineDataReturn {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Update pending count
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingMutationCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
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
        // Map organization to company for offline storage
        const mappedContacts = contacts.map(c => ({
          ...c,
          company: c.organization,
        }));
        await saveContactsOffline(mappedContacts as any);
      }
    } catch (error) {
      console.error('Failed to cache contacts:', error);
    }
  }, [user]);

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
      await cacheContacts();
      
      const count = await getPendingMutationCount();
      setPendingCount(count);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, cacheContacts]);

  return {
    isOnline,
    pendingCount,
    syncPendingChanges,
    isSyncing,
    cacheContacts,
    getOfflineCachedContacts,
    queueMutation,
  };
}
