/**
 * Application Version Management
 * Used for cache busting and version tracking
 * 
 * v3.8.4: Comprehensive DDD & Schema Alignment
 *         - Fixed deep-correlation-mapper to use contact_observations with correct columns
 *         - Fixed platform-config.ts all override_value → config_value references
 *         - Refactored IntelligenceService to use repository pattern (DDD compliant)
 *         - Implemented real pagination in Analysis/Dossier/Insight repositories
 * v3.8.3: Schema Alignment Phase 2 - Fixed 5 edge functions using deprecated 'observations' table
 * v3.8.2: Enterprise Schema Alignment - Fixed platform-config, trauma/opsec/lawfare analyzers
 * v3.8.1: Navigation visibility fix - Force cache clear for Dossier Intelligence menu
 * v3.8.0: Browser-Independent Intelligence Pipeline with Realtime updates
 */
export const APP_VERSION = '3.8.4';
export const BUILD_TIMESTAMP = new Date().toISOString();

// Versions that require forced cache clear when upgrading from
export const FORCE_CLEAR_VERSIONS = ['3.8.3', '3.8.2', '3.8.1', '3.8.0', '3.7.7', '3.7.6', '3.7.5', '3.7.4', '3.7.3', '3.7.2', '3.7.1', '3.7.0', '3.6.1', '3.6.0', '3.5.0'];

// Cache key for tracking chunk errors
const CHUNK_ERROR_KEY = 'chunk_error_count';
const CHUNK_ERROR_TIMESTAMP = 'chunk_error_timestamp';
const MAX_CHUNK_ERRORS = 2;
const CHUNK_ERROR_WINDOW_MS = 60000; // 1 minute

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

/**
 * Track chunk loading errors and trigger cache clear if threshold reached
 */
export function trackChunkError(): boolean {
  try {
    const now = Date.now();
    const lastTimestamp = parseInt(localStorage.getItem(CHUNK_ERROR_TIMESTAMP) || '0', 10);
    let errorCount = parseInt(localStorage.getItem(CHUNK_ERROR_KEY) || '0', 10);
    
    // Reset count if outside time window
    if (now - lastTimestamp > CHUNK_ERROR_WINDOW_MS) {
      errorCount = 0;
    }
    
    errorCount++;
    localStorage.setItem(CHUNK_ERROR_KEY, String(errorCount));
    localStorage.setItem(CHUNK_ERROR_TIMESTAMP, String(now));
    
    console.log(`[AppVersion] Chunk error tracked: ${errorCount}/${MAX_CHUNK_ERRORS}`);
    
    // Return true if we should trigger cache clear
    return errorCount >= MAX_CHUNK_ERRORS;
  } catch {
    return false;
  }
}

export function clearChunkErrorTracking(): void {
  try {
    localStorage.removeItem(CHUNK_ERROR_KEY);
    localStorage.removeItem(CHUNK_ERROR_TIMESTAMP);
  } catch {
    // Ignore
  }
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
  
  // Clear chunk error tracking
  clearChunkErrorTracking();
}

export async function forceAppUpdate(): Promise<void> {
  console.log('[AppVersion] Forcing app update...');
  await clearAllCaches();
  setStoredVersion(APP_VERSION);
  
  // Force reload from server with cache bust
  const url = new URL(window.location.href);
  url.searchParams.set('_v', APP_VERSION);
  window.location.href = url.toString();
}

/**
 * Automatic cache bust on chunk error detection
 * Call this when a chunk loading error is detected
 */
export async function handleChunkLoadingError(error: Error): Promise<boolean> {
  const errorMsg = error.message.toLowerCase();
  const isChunkError = 
    errorMsg.includes('failed to fetch dynamically imported module') ||
    errorMsg.includes('loading chunk') ||
    errorMsg.includes('loading css chunk') ||
    errorMsg.includes('syntax error') ||
    errorMsg.includes('unexpected token');
  
  if (!isChunkError) return false;
  
  console.log('[AppVersion] Chunk loading error detected:', error.message);
  
  // Track the error and check if we should clear caches
  const shouldClear = trackChunkError();
  
  if (shouldClear) {
    console.log('[AppVersion] Chunk error threshold reached, forcing cache clear...');
    await forceAppUpdate();
    return true;
  }
  
  return false;
}
