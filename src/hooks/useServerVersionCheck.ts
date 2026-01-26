/**
 * Server-side version check hook
 * Polls the database for the latest published version and notifies users of updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { APP_VERSION, forceAppUpdate } from '@/lib/appVersion';

interface UseServerVersionCheckOptions {
  /** Poll interval in milliseconds (default: 5 minutes) */
  pollInterval?: number;
  /** Whether version checking is enabled (default: true) */
  enabled?: boolean;
}

interface ServerVersionCheckResult {
  /** Whether a new version is available */
  hasNewVersion: boolean;
  /** The version available on the server */
  serverVersion: string | null;
  /** The current local version */
  currentVersion: string;
  /** Function to update to the new version (clears caches and reloads) */
  updateNow: () => Promise<void>;
  /** Function to dismiss the update notification temporarily */
  dismissUpdate: () => void;
  /** Whether the update notification was dismissed */
  isDismissed: boolean;
  /** Whether version check is currently loading */
  isChecking: boolean;
  /** Last time version was checked */
  lastChecked: Date | null;
  /** Error if version check failed */
  error: string | null;
}

const DEFAULT_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISS_KEY = 'version_update_dismissed';
const DISMISS_DURATION = 60 * 60 * 1000; // 1 hour

export function useServerVersionCheck(
  options: UseServerVersionCheckOptions = {}
): ServerVersionCheckResult {
  const { pollInterval = DEFAULT_POLL_INTERVAL, enabled = true } = options;

  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if update was previously dismissed
  useEffect(() => {
    try {
      const dismissedData = localStorage.getItem(DISMISS_KEY);
      if (dismissedData) {
        const { version, timestamp } = JSON.parse(dismissedData);
        const isExpired = Date.now() - timestamp > DISMISS_DURATION;
        if (!isExpired && version === serverVersion) {
          setIsDismissed(true);
        } else {
          localStorage.removeItem(DISMISS_KEY);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [serverVersion]);

  const checkVersion = useCallback(async () => {
    if (!enabled) return;

    setIsChecking(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('platform_config')
        .select('config_value')
        .eq('config_key', 'app_published_version')
        .maybeSingle();

      if (queryError) {
        throw new Error(queryError.message);
      }

      setLastChecked(new Date());

      if (data?.config_value) {
        // config_value is stored as JSON string, e.g., '"3.9.52"'
        let version: string;
        try {
          version = typeof data.config_value === 'string' 
            ? JSON.parse(data.config_value)
            : data.config_value;
        } catch {
          version = String(data.config_value);
        }

        setServerVersion(version);

        // Compare versions - simple string comparison works for semver
        if (version !== APP_VERSION) {
          console.log(`[VersionCheck] New version available: ${version} (current: ${APP_VERSION})`);
          setHasNewVersion(true);
          
          // Check if this version was dismissed
          try {
            const dismissedData = localStorage.getItem(DISMISS_KEY);
            if (dismissedData) {
              const { version: dismissedVersion, timestamp } = JSON.parse(dismissedData);
              const isExpired = Date.now() - timestamp > DISMISS_DURATION;
              if (!isExpired && dismissedVersion === version) {
                setIsDismissed(true);
              } else {
                setIsDismissed(false);
                localStorage.removeItem(DISMISS_KEY);
              }
            }
          } catch {
            // Ignore
          }
        } else {
          setHasNewVersion(false);
          setIsDismissed(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check version';
      console.error('[VersionCheck] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsChecking(false);
    }
  }, [enabled]);

  // Initial check and polling
  useEffect(() => {
    if (!enabled) return;

    // Check immediately
    checkVersion();

    // Set up polling interval
    intervalRef.current = setInterval(checkVersion, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollInterval, checkVersion]);

  const updateNow = useCallback(async () => {
    console.log('[VersionCheck] User initiated update');
    await forceAppUpdate();
  }, []);

  const dismissUpdate = useCallback(() => {
    if (serverVersion) {
      try {
        localStorage.setItem(
          DISMISS_KEY,
          JSON.stringify({ version: serverVersion, timestamp: Date.now() })
        );
      } catch {
        // Ignore localStorage errors
      }
    }
    setIsDismissed(true);
  }, [serverVersion]);

  return {
    hasNewVersion,
    serverVersion,
    currentVersion: APP_VERSION,
    updateNow,
    dismissUpdate,
    isDismissed,
    isChecking,
    lastChecked,
    error,
  };
}
