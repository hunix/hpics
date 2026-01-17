import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import App from "./App.tsx";
import "./index.css";
import { initChunkErrorHandler } from "@/lib/chunkErrorHandler";
import { 
  APP_VERSION, 
  getStoredVersion, 
  setStoredVersion, 
  clearAllCaches,
} from "@/lib/appVersion";

// Initialize chunk error handler for deployment resilience
initChunkErrorHandler();

// Versions that had known issues and need forced cache clear
const FORCE_CLEAR_VERSIONS = ['2.5.0', '2.4.0', '2.3.0', '2.2.0', '2.1.0', '2.0.0'];

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
    
    // For native apps, also aggressively clear storage
    if (isNative) {
      try {
        // Clear session storage
        sessionStorage.clear();
        // Clear specific app caches from localStorage (keep auth)
        const keysToRemove = Object.keys(localStorage).filter(
          key => !key.startsWith('sb-') && key !== 'app_version'
        );
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[AppVersion] Native: Cleared ${keysToRemove.length} localStorage keys`);
      } catch (e) {
        console.warn('[AppVersion] Failed to clear storage:', e);
      }
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

// PWA Service Worker registration with auto-update
const registerPWA = async () => {
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
  const shouldRender = await initVersionCheck();
  
  if (shouldRender) {
    await registerPWA();
    createRoot(document.getElementById("root")!).render(<App />);
  }
};

initApp();
