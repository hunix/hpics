const { contextBridge, ipcRenderer } = require('electron');

// Expose desktop-specific APIs to the web app
contextBridge.exposeInMainWorld('desktopAPI', {
  // Check if running in Electron
  isDesktop: true,
  
  // Platform info
  platform: process.platform,
  
  // Store operations
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  
  // Show native notification
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Event listeners for desktop commands
  onQuickCapture: (callback) => {
    window.addEventListener('desktop-quick-capture', callback);
  },
  onForceSync: (callback) => {
    window.addEventListener('desktop-force-sync', callback);
  },
  onBackgroundSync: (callback) => {
    window.addEventListener('desktop-background-sync', callback);
  },
  
  // Remove event listeners
  offQuickCapture: (callback) => {
    window.removeEventListener('desktop-quick-capture', callback);
  },
  offForceSync: (callback) => {
    window.removeEventListener('desktop-force-sync', callback);
  },
  offBackgroundSync: (callback) => {
    window.removeEventListener('desktop-background-sync', callback);
  },
});

// Log when preload completes
console.log('Desktop preload script loaded');
