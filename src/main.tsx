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
  isVersionMismatch 
} from "@/lib/appVersion";

// Initialize chunk error handler for deployment resilience
initChunkErrorHandler();

// Version-based cache busting for PWA/Native apps
const initVersionCheck = async () => {
  const storedVersion = getStoredVersion();
  const isNative = Capacitor.isNativePlatform();
  
  console.log(`[AppVersion] Current: ${APP_VERSION}, Stored: ${storedVersion}, Native: ${isNative}`);
  
  // If version mismatch detected, clear caches and reload
  if (storedVersion && storedVersion !== APP_VERSION) {
    console.log('[AppVersion] Version mismatch detected, clearing caches...');
    await clearAllCaches();
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
