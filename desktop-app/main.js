const { app, BrowserWindow, Tray, Menu, globalShortcut, Notification, ipcMain, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
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
let waBridgeProcess = null;

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

// ── WhatsApp Personal Bridge ──────────────────────────────────────────────────
// The bridge service (services/whatsapp-bridge/) runs as a child process so the
// user gets continuous WhatsApp sync without opening a terminal.

function startWABridge() {
  if (waBridgeProcess) return; // already running

  // Resolve bridge path relative to desktop-app/../services/whatsapp-bridge
  const bridgePath = path.resolve(__dirname, '..', 'services', 'whatsapp-bridge');
  const bridgeEntry = path.join(bridgePath, 'dist', 'index.js');
  const bridgeEntryDev = path.join(bridgePath, 'src', 'index.ts');

  // Prefer compiled dist; fall back to tsx for dev
  const fs = require('fs');
  let cmd, args;
  if (fs.existsSync(bridgeEntry)) {
    cmd = 'node';
    args = [bridgeEntry];
  } else if (fs.existsSync(bridgeEntryDev)) {
    cmd = 'npx';
    args = ['tsx', bridgeEntryDev];
  } else {
    console.log('[WA Bridge] Service not found at', bridgePath, '— skipping auto-start');
    return;
  }

  const env = {
    ...process.env,
    SUPABASE_URL: store.get('wabridge.supabaseUrl', process.env.SUPABASE_URL || ''),
    SUPABASE_SERVICE_ROLE_KEY: store.get('wabridge.serviceRoleKey', process.env.SUPABASE_SERVICE_ROLE_KEY || ''),
    AUTH_SECRET: store.get('wabridge.authSecret', 'hpics-local-secret'),
    PORT: '3001',
  };

  waBridgeProcess = spawn(cmd, args, { cwd: bridgePath, env, stdio: 'pipe' });

  waBridgeProcess.stdout.on('data', (d) => console.log('[WA Bridge]', d.toString().trim()));
  waBridgeProcess.stderr.on('data', (d) => console.error('[WA Bridge ERR]', d.toString().trim()));

  waBridgeProcess.on('exit', (code) => {
    console.log('[WA Bridge] exited with code', code);
    waBridgeProcess = null;
    // Auto-restart after 5 s unless app is quitting
    if (!app.isQuitting) {
      setTimeout(startWABridge, 5000);
    }
  });

  console.log('[WA Bridge] started (pid', waBridgeProcess.pid, ')');
}

function stopWABridge() {
  if (waBridgeProcess) {
    waBridgeProcess.kill('SIGTERM');
    waBridgeProcess = null;
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

ipcMain.handle('wa-bridge-status', () => ({
  running: waBridgeProcess !== null,
  pid: waBridgeProcess?.pid ?? null,
}));

ipcMain.handle('wa-bridge-restart', () => {
  stopWABridge();
  setTimeout(startWABridge, 500);
  return { ok: true };
});

ipcMain.handle('wa-bridge-set-config', (event, config) => {
  if (config.supabaseUrl)    store.set('wabridge.supabaseUrl', config.supabaseUrl);
  if (config.serviceRoleKey) store.set('wabridge.serviceRoleKey', config.serviceRoleKey);
  if (config.authSecret)     store.set('wabridge.authSecret', config.authSecret);
  return { ok: true };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  registerGlobalShortcuts();
  startBackgroundSync();
  startWABridge();
  
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
  globalShortcut.unregisterAll();
  stopBackgroundSync();
  stopWABridge();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
