/**
 * Auto Social Sync Hook
 * Automated background synchronization of social media profiles
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getOrCreateSyncCursor, 
  updateSyncCursor, 
  setSyncStatus,
  type SyncCursor,
  type SyncSourceType 
} from '@/lib/sync/differentialSync';

export interface SyncSchedule {
  platform: SyncSourceType;
  profileId: string;
  identifier: string;
  intervalHours: number;
  isEnabled: boolean;
  lastSyncAt: Date | null;
  nextSyncAt: Date | null;
}

export interface AutoSyncConfig {
  instagram: { enabled: boolean; intervalHours: number };
  linkedin: { enabled: boolean; intervalHours: number };
  threads: { enabled: boolean; intervalHours: number };
  twitter: { enabled: boolean; intervalHours: number };
}

const DEFAULT_CONFIG: AutoSyncConfig = {
  instagram: { enabled: true, intervalHours: 6 },
  linkedin: { enabled: true, intervalHours: 12 },
  threads: { enabled: true, intervalHours: 6 },
  twitter: { enabled: true, intervalHours: 6 },
};

export function useAutoSocialSync(config: Partial<AutoSyncConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [schedules, setSchedules] = useState<SyncSchedule[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSync, setCurrentSync] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const syncTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isMountedRef = useRef(true);

  // Load existing sync schedules from cursors
  const loadSchedules = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const socialPlatforms: SyncSourceType[] = ['instagram', 'linkedin', 'threads', 'twitter'];
    
    const { data: cursors } = await supabase
      .from('sync_cursors')
      .select('*')
      .eq('user_id', user.id)
      .in('source_type', socialPlatforms);

    if (cursors) {
      const scheduleList: SyncSchedule[] = cursors.map(cursor => {
        const platformConfig = fullConfig[cursor.source_type as keyof AutoSyncConfig];
        const lastSync = cursor.last_sync_at ? new Date(cursor.last_sync_at) : null;
        const nextSync = lastSync 
          ? new Date(lastSync.getTime() + platformConfig.intervalHours * 60 * 60 * 1000)
          : null;

        return {
          platform: cursor.source_type as SyncSourceType,
          profileId: cursor.profile_id || '',
          identifier: cursor.source_identifier || '',
          intervalHours: platformConfig.intervalHours,
          isEnabled: platformConfig.enabled,
          lastSyncAt: lastSync,
          nextSyncAt: nextSync,
        };
      });

      setSchedules(scheduleList);
    }
  }, [fullConfig]);

  // Execute sync for a specific platform/profile
  const executeSync = useCallback(async (
    platform: SyncSourceType,
    identifier: string,
    profileId?: string
  ): Promise<{ success: boolean; itemsSynced: number; error?: string }> => {
    setCurrentSync(`${platform}:${identifier}`);
    
    try {
      // Get or create cursor
      const cursor = await getOrCreateSyncCursor(platform, identifier, profileId);
      if (!cursor) {
        throw new Error('Failed to get sync cursor');
      }

      await setSyncStatus(cursor.id, 'syncing');

      // Call the differential sync edge function
      const { data, error } = await supabase.functions.invoke('differential-sync-engine', {
        body: {
          platform,
          identifier,
          profileId,
          cursor: {
            lastItemTimestamp: cursor.last_item_timestamp,
            lastItemId: cursor.last_item_id,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Update cursor with new state
      await updateSyncCursor(cursor.id, {
        last_sync_at: new Date().toISOString(),
        last_item_timestamp: data.newCursor?.lastItemTimestamp,
        last_item_id: data.newCursor?.lastItemId,
        items_synced_total: (cursor.items_synced_total || 0) + (data.itemsSynced || 0),
        sync_status: 'completed',
        error_message: null,
      });

      setLastError(null);
      return { success: true, itemsSynced: data.itemsSynced || 0 };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setLastError(errorMessage);
      
      // Update cursor with error
      const cursor = await getOrCreateSyncCursor(platform, identifier, profileId);
      if (cursor) {
        await setSyncStatus(cursor.id, 'error', errorMessage);
      }

      return { success: false, itemsSynced: 0, error: errorMessage };
    } finally {
      setCurrentSync(null);
    }
  }, []);

  // Schedule next sync for a profile
  const scheduleNextSync = useCallback((schedule: SyncSchedule) => {
    const key = `${schedule.platform}:${schedule.identifier}`;
    
    // Clear existing timer
    const existingTimer = syncTimersRef.current.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    if (!schedule.isEnabled) return;

    // Calculate delay
    let delay: number;
    if (schedule.nextSyncAt) {
      delay = Math.max(0, schedule.nextSyncAt.getTime() - Date.now());
    } else {
      delay = 0; // Sync immediately if never synced
    }

    // Cap delay at 1 hour for initial check
    delay = Math.min(delay, 60 * 60 * 1000);

    const timer = setTimeout(async () => {
      if (!isMountedRef.current) return;

      await executeSync(schedule.platform, schedule.identifier, schedule.profileId);
      
      // Reload schedules to get updated times
      await loadSchedules();
      
      // Reschedule
      const updatedSchedule = {
        ...schedule,
        lastSyncAt: new Date(),
        nextSyncAt: new Date(Date.now() + schedule.intervalHours * 60 * 60 * 1000),
      };
      scheduleNextSync(updatedSchedule);
    }, delay);

    syncTimersRef.current.set(key, timer);
  }, [executeSync, loadSchedules]);

  // Start all scheduled syncs
  const startAutoSync = useCallback(() => {
    setIsRunning(true);
    schedules.forEach(schedule => {
      if (schedule.isEnabled) {
        scheduleNextSync(schedule);
      }
    });
  }, [schedules, scheduleNextSync]);

  // Stop all scheduled syncs
  const stopAutoSync = useCallback(() => {
    setIsRunning(false);
    syncTimersRef.current.forEach(timer => clearTimeout(timer));
    syncTimersRef.current.clear();
  }, []);

  // Manually trigger sync for a profile
  const syncNow = useCallback(async (
    platform: SyncSourceType,
    identifier: string,
    profileId?: string
  ) => {
    return executeSync(platform, identifier, profileId);
  }, [executeSync]);

  // Add a new sync schedule
  const addSchedule = useCallback(async (
    platform: SyncSourceType,
    identifier: string,
    profileId: string,
    intervalHours: number = 6
  ) => {
    const cursor = await getOrCreateSyncCursor(platform, identifier, profileId);
    if (!cursor) return false;

    const newSchedule: SyncSchedule = {
      platform,
      profileId,
      identifier,
      intervalHours,
      isEnabled: true,
      lastSyncAt: null,
      nextSyncAt: new Date(), // Sync immediately
    };

    setSchedules(prev => [...prev, newSchedule]);

    if (isRunning) {
      scheduleNextSync(newSchedule);
    }

    return true;
  }, [isRunning, scheduleNextSync]);

  // Update schedule settings
  const updateSchedule = useCallback((
    platform: SyncSourceType,
    identifier: string,
    updates: Partial<Pick<SyncSchedule, 'intervalHours' | 'isEnabled'>>
  ) => {
    setSchedules(prev => prev.map(s => {
      if (s.platform === platform && s.identifier === identifier) {
        const updated = { ...s, ...updates };
        
        // Recalculate next sync
        if (updated.lastSyncAt && updated.intervalHours) {
          updated.nextSyncAt = new Date(
            updated.lastSyncAt.getTime() + updated.intervalHours * 60 * 60 * 1000
          );
        }

        // Reschedule if running
        if (isRunning) {
          scheduleNextSync(updated);
        }

        return updated;
      }
      return s;
    }));
  }, [isRunning, scheduleNextSync]);

  // Initialize
  useEffect(() => {
    isMountedRef.current = true;
    loadSchedules();

    return () => {
      isMountedRef.current = false;
      stopAutoSync();
    };
  }, [loadSchedules, stopAutoSync]);

  return {
    schedules,
    isRunning,
    currentSync,
    lastError,
    startAutoSync,
    stopAutoSync,
    syncNow,
    addSchedule,
    updateSchedule,
    loadSchedules,
  };
}
