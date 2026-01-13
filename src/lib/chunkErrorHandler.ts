// Chunk Error Handler - Handle stale JS after deployments
import { lazy, ComponentType } from 'react';

const RELOAD_STORAGE_KEY = 'chunk_error_reload_attempted';
const RELOAD_TIMESTAMP_KEY = 'chunk_error_reload_time';
const RELOAD_COOLDOWN_MS = 10000; // 10 seconds cooldown between reloads

// Check if we should attempt reload
function shouldAttemptReload(): boolean {
  const lastReloadTime = localStorage.getItem(RELOAD_TIMESTAMP_KEY);
  
  if (!lastReloadTime) {
    return true;
  }
  
  const timeSinceReload = Date.now() - parseInt(lastReloadTime, 10);
  return timeSinceReload > RELOAD_COOLDOWN_MS;
}

// Mark reload as attempted
function markReloadAttempted(): void {
  localStorage.setItem(RELOAD_STORAGE_KEY, 'true');
  localStorage.setItem(RELOAD_TIMESTAMP_KEY, Date.now().toString());
}

// Clear reload flags
function clearReloadFlags(): void {
  localStorage.removeItem(RELOAD_STORAGE_KEY);
  localStorage.removeItem(RELOAD_TIMESTAMP_KEY);
}

// Check if error is a chunk loading error
function isChunkLoadError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('loading chunk') ||
      message.includes('failed to fetch dynamically imported module') ||
      message.includes('failed to load module script') ||
      message.includes('loading css chunk') ||
      message.includes('dynamically imported module')
    );
  }
  return false;
}

// Handle chunk load error with retry
async function retryImport<T>(
  importFn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Add cache busting parameter on retry
      if (attempt > 1) {
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
      return await importFn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`Chunk load attempt ${attempt} failed, retrying...`);
    }
  }
  throw new Error('Failed to load module after all retries');
}

// Lazy load with retry for default exports
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    retries?: number;
    delay?: number;
    onError?: (error: Error) => void;
  } = {}
): React.LazyExoticComponent<T> {
  const { retries = 3, delay = 1000, onError } = options;
  
  return lazy(async () => {
    try {
      return await retryImport(importFn, retries, delay);
    } catch (error) {
      if (isChunkLoadError(error) && shouldAttemptReload()) {
        markReloadAttempted();
        console.log('Chunk loading failed, refreshing page...');
        window.location.reload();
        // Return empty component while reloading
        return { default: (() => null) as unknown as T };
      }
      
      // Clear flags on successful load (or non-chunk error)
      clearReloadFlags();
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      throw error;
    }
  });
}

// Lazy load with retry for named exports
export function lazyWithRetryNamed<
  T extends Record<string, ComponentType<unknown>>,
  K extends keyof T
>(
  importFn: () => Promise<T>,
  exportName: K,
  options: {
    retries?: number;
    delay?: number;
    onError?: (error: Error) => void;
  } = {}
): React.LazyExoticComponent<T[K]> {
  const { retries = 3, delay = 1000, onError } = options;
  
  return lazy(async () => {
    try {
      const module = await retryImport(importFn, retries, delay);
      return { default: module[exportName] };
    } catch (error) {
      if (isChunkLoadError(error) && shouldAttemptReload()) {
        markReloadAttempted();
        console.log('Chunk loading failed, refreshing page...');
        window.location.reload();
        return { default: (() => null) as unknown as T[K] };
      }
      
      clearReloadFlags();
      
      if (onError && error instanceof Error) {
        onError(error);
      }
      
      throw error;
    }
  });
}

// Manual chunk error handler
export function handleChunkError(error: Error): boolean {
  if (isChunkLoadError(error) && shouldAttemptReload()) {
    markReloadAttempted();
    window.location.reload();
    return true;
  }
  return false;
}

// New version available component fallback
export function createNewVersionFallback(onRefresh: () => void) {
  return function NewVersionAvailable() {
    return {
      type: 'div',
      props: {
        className: 'flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 text-center',
        children: [
          {
            type: 'h2',
            props: {
              className: 'text-lg font-semibold',
              children: 'New Version Available',
            },
          },
          {
            type: 'p',
            props: {
              className: 'text-muted-foreground',
              children: 'A new version of the application is available. Please refresh to get the latest updates.',
            },
          },
          {
            type: 'button',
            props: {
              className: 'px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90',
              onClick: onRefresh,
              children: 'Refresh Now',
            },
          },
        ],
      },
    };
  };
}

// Initialize chunk error handling
export function initChunkErrorHandler(): void {
  // Clear reload flags on successful page load
  window.addEventListener('load', () => {
    // Small delay to ensure the page fully loaded
    setTimeout(clearReloadFlags, 2000);
  });
  
  // Global error handler for uncaught chunk errors
  window.addEventListener('error', (event) => {
    if (isChunkLoadError(event.error)) {
      event.preventDefault();
      handleChunkError(event.error);
    }
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault();
      handleChunkError(event.reason);
    }
  });
}
