import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import App from "./App.tsx";
import "./index.css";
import { initChunkErrorHandler } from "@/lib/chunkErrorHandler";
import { bootstrapContainer } from "@/infrastructure/di/bootstrap";
import { 
  APP_VERSION,
  BUILD_TIMESTAMP,
  getStoredVersion, 
  setStoredVersion, 
  clearAllCaches,
  FORCE_CLEAR_VERSIONS,
  handleChunkLoadingError,
  clearChunkErrorTracking,
} from "@/lib/appVersion";

// Initialize chunk error handler for deployment resilience
initChunkErrorHandler();

// Global error handler for chunk loading failures
window.addEventListener('error', async (event) => {
  if (event.error) {
    await handleChunkLoadingError(event.error);
  }
});

window.addEventListener('unhandledrejection', async (event) => {
  if (event.reason instanceof Error) {
    await handleChunkLoadingError(event.reason);
  }
});

// Version-based cache busting for PWA/Native apps
const initVersionCheck = async () => {
  const storedVersion = getStoredVersion();
  const isNative = Capacitor.isNativePlatform();
  
  console.log(`[AppVersion] Current: ${APP_VERSION}, Stored: ${storedVersion}, Native: ${isNative}`);
  
  // Force clear if coming from a problematic version
  const shouldForceClear = storedVersion && FORCE_CLEAR_VERSIONS.includes(storedVersion);
  
  // If version mismatch or force clear needed
  if (storedVersion && (storedVersion !== APP_VERSION || shouldForceClear)) {
    console.log('[AppVersion] Version mismatch or force clear detected, clearing all caches...');
    await clearAllCaches();
    
    // Aggressively clear storage for all platforms
    try {
      // Clear session storage
      sessionStorage.clear();
      // Clear specific app caches from localStorage (keep auth)
      const keysToRemove = Object.keys(localStorage).filter(
        key => !key.startsWith('sb-') && key !== 'app_version'
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[AppVersion] Cleared ${keysToRemove.length} localStorage keys`);
    } catch (e) {
      console.warn('[AppVersion] Failed to clear storage:', e);
    }
    
    setStoredVersion(APP_VERSION);
    window.location.reload();
    return false; // Don't render yet, reloading
  }
  
  // First time visit - just store the version
  if (!storedVersion) {
    setStoredVersion(APP_VERSION);
  }
  
  return true; // Safe to render
};

// Detect if running in Preview (editor) environment
const isPreviewEnvironment = (): boolean => {
  const hostname = window.location.hostname;
  return hostname.includes('id-preview') || 
         (hostname.includes('lovable.app') && hostname.includes('preview'));
};

// Force clear all caches for Preview environment
const clearPreviewCaches = async () => {
  console.log('[Preview] Clearing all caches for fresh load...');
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
    console.log(`[Preview] Unregistered ${registrations.length} service worker(s)`);
  }
  
  // Delete all Cache Storage entries
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log(`[Preview] Deleted ${cacheNames.length} cache(s)`);
  }
  
  // Clear session storage
  sessionStorage.clear();
  
  // Clear localStorage except auth keys
  const keysToRemove = Object.keys(localStorage).filter(
    key => !key.startsWith('sb-') && key !== 'app_version'
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  setStoredVersion(APP_VERSION);
};

// PWA Service Worker registration with auto-update (only for production)
const registerPWA = async () => {
  // Skip PWA registration in preview environment
  if (isPreviewEnvironment()) {
    console.log('[PWA] Skipping service worker in preview environment');
    return;
  }
  
  if ('serviceWorker' in navigator) {
    try {
      // Check for updates on every load
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        registration.update();
        
        // Listen for new service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available, reloading...');
                window.location.reload();
              }
            });
          }
        });
      }
    } catch (err) {
      console.warn('[PWA] Service worker registration check failed:', err);
    }
  }
};

// Initialize app
const initApp = async () => {
  // In preview environment, always clear caches first
  if (isPreviewEnvironment()) {
    await clearPreviewCaches();
    console.log(`[Preview] Running build: ${APP_VERSION} @ ${BUILD_TIMESTAMP}`);
  }
  
  const shouldRender = await initVersionCheck();
  
  if (shouldRender) {
    // Bootstrap DI container before rendering
    bootstrapContainer();
    
    await registerPWA();
    createRoot(document.getElementById("root")!).render(<App />);
  }
};

initApp();
