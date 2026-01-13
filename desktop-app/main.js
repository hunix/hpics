const { app, BrowserWindow, Tray, Menu, globalShortcut, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize persistent storage
const store = new Store({
  defaults: {
    autoStart: false,
    syncInterval: 300000, // 5 minutes
    lastSyncAt: null,
    windowBounds: { width: 1280, height: 800 },
  }
});

let mainWindow = null;
let tray = null;
let syncInterval = null;

// App URL - points to the deployed web app
const APP_URL = 'https://d84a1d41-b6a8-4c7d-a30a-5f4baa19a16d.lovableproject.com';

function createWindow() {
  const bounds = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    show: false, // Don't show until ready
  });

  // Load the web app
  mainWindow.loadURL(APP_URL);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window bounds on resize
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowBounds', { width, height });
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification that app is still running
      if (Notification.isSupported()) {
        new Notification({
          title: 'Running in Background',
          body: 'The app is still running. Click the tray icon to open.',
        }).show();
      }
    }
  });

  return mainWindow;
}

function createTray() {
  // Create tray icon (use a 16x16 or 22x22 icon for tray)
  const iconPath = path.join(__dirname, 'icons', 'tray-icon.png');
  
  // Fallback to creating a simple icon if file doesn't exist
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createEmpty();
    }
  } catch {
    trayIcon = nativeImage.createEmpty();
  }
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open', 
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { 
      label: 'Quick Capture', 
      accelerator: 'CmdOrCtrl+Shift+I',
      click: () => triggerQuickCapture()
    },
    { 
      label: 'Force Sync', 
      click: () => triggerSync()
    },
    { type: 'separator' },
    { 
      label: 'Auto-Start', 
      type: 'checkbox',
      checked: store.get('autoStart'),
      click: (menuItem) => {
        store.set('autoStart', menuItem.checked);
        app.setLoginItemSettings({ openAtLogin: menuItem.checked });
      }
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Social Intelligence');
  tray.setContextMenu(contextMenu);
  
  // Double-click to show window
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

function registerGlobalShortcuts() {
  // Quick capture hotkey
  globalShortcut.register('CmdOrCtrl+Shift+I', () => {
    triggerQuickCapture();
  });
  
  // Force sync hotkey
  globalShortcut.register('CmdOrCtrl+Shift+S', () => {
    triggerSync();
  });
}

function triggerQuickCapture() {
  mainWindow.show();
  mainWindow.focus();
  // Send message to renderer to open quick capture
  mainWindow.webContents.executeJavaScript(`
    window.dispatchEvent(new CustomEvent('desktop-quick-capture'));
  `);
  
  if (Notification.isSupported()) {
    new Notification({
      title: 'Quick Capture',
      body: 'Capture window opened',
    }).show();
  }
}

function triggerSync() {
  // Send message to renderer to trigger sync
  mainWindow.webContents.executeJavaScript(`
    window.dispatchEvent(new CustomEvent('desktop-force-sync'));
  `);
  
  store.set('lastSyncAt', new Date().toISOString());
  
  if (Notification.isSupported()) {
    new Notification({
      title: 'Syncing',
      body: 'Starting data synchronization...',
    }).show();
  }
}

function startBackgroundSync() {
  const interval = store.get('syncInterval');
  
  syncInterval = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.executeJavaScript(`
        window.dispatchEvent(new CustomEvent('desktop-background-sync'));
      `);
      store.set('lastSyncAt', new Date().toISOString());
    }
  }, interval);
}

function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// IPC handlers for communication with renderer
ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key);
});

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('show-notification', (event, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  startBackgroundSync();
  
  // Set auto-start based on saved preference
  app.setLoginItemSettings({ openAtLogin: store.get('autoStart') });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // On Windows/Linux, don't quit when all windows closed (tray app)
    // User must explicitly quit from tray
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  stopBackgroundSync();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
