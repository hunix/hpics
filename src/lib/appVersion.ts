// App Version Management for Cache Busting
// This version should be incremented with each significant update

export const APP_VERSION = '2.6.0';
export const BUILD_TIMESTAMP = '2026-01-17T21:00:00Z';

// Version check utilities
export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem('app_version');
  } catch {
    return null;
  }
}

export function setStoredVersion(version: string): void {
  try {
    localStorage.setItem('app_version', version);
  } catch {
    console.warn('Failed to store app version');
  }
}

export function isVersionMismatch(): boolean {
  const stored = getStoredVersion();
  return stored !== null && stored !== APP_VERSION;
}

export async function clearAllCaches(): Promise<void> {
  console.log('[AppVersion] Clearing all caches...');
  
  // Clear Service Worker caches
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log(`[AppVersion] Cleared ${cacheNames.length} cache(s)`);
    } catch (err) {
      console.warn('[AppVersion] Failed to clear caches:', err);
    }
  }
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log(`[AppVersion] Unregistered ${registrations.length} service worker(s)`);
    } catch (err) {
      console.warn('[AppVersion] Failed to unregister service workers:', err);
    }
  }
}

export async function forceAppUpdate(): Promise<void> {
  console.log('[AppVersion] Forcing app update...');
  await clearAllCaches();
  setStoredVersion(APP_VERSION);
  
  // Force reload from server
  window.location.reload();
}
