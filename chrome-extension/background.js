// Intel CRM Chrome Extension - Background Service Worker

const DEFAULT_CONFIG = {
  apiEndpoint: '',
  authToken: '',
  autoCapture: false,
  captureComments: true,
  captureLikes: false,
  deepScrape: false,
};

// Connection state tracking
let connectionState = {
  isConnected: false,
  connectedAt: null,
  lastHeartbeat: null,
  lastSync: null,
  lastSyncStatus: null,
  lastError: null,
};

// Activity log (in-memory, persisted to storage)
let activityLog = [];

// Heartbeat interval reference
let keepAliveInterval = null;
let heartbeatInterval = null;

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get('config');
  if (!stored.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG });
  }
  await chrome.storage.local.set({ connectionState, activityLog: [] });
  addLog('info', 'Intel CRM Extension installed');
  console.log('Intel CRM Extension installed');
});

// Start heartbeat on startup
chrome.runtime.onStartup.addListener(() => {
  loadStoredState();
  startHeartbeat();
  startKeepAlive();
});

// Load stored state on service worker activation
async function loadStoredState() {
  try {
    const { connectionState: storedState, activityLog: storedLog } = 
      await chrome.storage.local.get(['connectionState', 'activityLog']);
    
    if (storedState) connectionState = storedState;
    if (storedLog) activityLog = storedLog;
  } catch (error) {
    console.error('Failed to load stored state:', error);
  }
}

// Initialize on load
loadStoredState();
startKeepAlive(); // Start keep-alive immediately

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(message, sender) {
  const { type, payload } = message;

  switch (type) {
    case 'GET_CONFIG':
      return getConfig();

    case 'SET_CONFIG':
      return setConfig(payload);

    case 'CAPTURE_PROFILE':
      return captureProfile(payload, sender.tab);

    case 'SYNC_DATA':
      return syncToServer(payload);

    case 'GET_CAPTURE_HISTORY':
      return getCaptureHistory();

    case 'CHECK_CONNECTION':
      return checkServerConnection();

    case 'GET_CONNECTION_STATE':
      return getConnectionState();

    case 'GET_ACTIVITY_LOG':
      return getActivityLog();

    case 'CLEAR_ACTIVITY_LOG':
      return clearActivityLog();

    case 'DISCONNECT':
      return disconnect();

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Add log entry
function addLog(type, message, details = null) {
  const entry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type, // 'info', 'success', 'error', 'warning'
    message,
    details,
  };
  
  activityLog.unshift(entry);
  if (activityLog.length > 100) activityLog.length = 100;
  
  // Persist to storage
  chrome.storage.local.set({ activityLog }).catch(console.error);
  
  console.log(`[Intel CRM] [${type.toUpperCase()}] ${message}`, details || '');
  
  return entry;
}

async function getConfig() {
  try {
    const { config } = await chrome.storage.local.get('config');
    return { success: true, data: config || DEFAULT_CONFIG };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setConfig(newConfig) {
  try {
    const { config } = await chrome.storage.local.get('config');
    const updated = { ...config, ...newConfig };
    await chrome.storage.local.set({ config: updated });
    addLog('info', 'Configuration updated');
    return { success: true, data: updated };
  } catch (error) {
    addLog('error', 'Failed to update configuration', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function captureProfile(profileData, tab) {
  try {
    const { config } = await chrome.storage.local.get('config');
    
    // Add to local history
    const { captureHistory = [] } = await chrome.storage.local.get('captureHistory');
    const capture = {
      id: crypto.randomUUID(),
      ...profileData,
      capturedAt: new Date().toISOString(),
      synced: false,
      tabUrl: tab?.url,
    };
    
    captureHistory.unshift(capture);
    // Keep only last 100 captures
    if (captureHistory.length > 100) {
      captureHistory.length = 100;
    }
    await chrome.storage.local.set({ captureHistory });
    
    addLog('success', `Captured profile: ${profileData.username || 'Unknown'}`, {
      platform: profileData.platform,
    });

    // Auto-sync if configured
    if (config.apiEndpoint && config.authToken) {
      const syncResult = await syncToServer({ captures: [capture] });
      if (syncResult.success) {
        capture.synced = true;
        await chrome.storage.local.set({ captureHistory });
      }
    }

    // Show notification
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);

    return { success: true, data: capture };
  } catch (error) {
    console.error('Capture failed:', error);
    addLog('error', 'Capture failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function syncToServer(payload) {
  try {
    const { config } = await chrome.storage.local.get('config');
    
    if (!config.apiEndpoint || !config.authToken) {
      addLog('warning', 'Sync skipped: API not configured');
      return { success: false, error: 'API not configured' };
    }

    const itemCount = payload.captures?.length || 1;
    addLog('info', `Starting sync: ${itemCount} item${itemCount !== 1 ? 's' : ''}`);

    // Prepare request body based on payload type
    const requestBody = {
      action: payload.action || 'scrape_profile',
      platform: payload.platform || payload.captures?.[0]?.platform || 'unknown',
      username: payload.username || payload.captures?.[0]?.username,
      profileUrl: payload.url || payload.captures?.[0]?.url,
      data: {
        profileHtml: payload.pageHtml || payload.captures?.[0]?.pageHtml,
        posts: payload.posts || payload.captures?.[0]?.posts,
      },
      metadata: {
        scrapedAt: new Date().toISOString(),
        extensionVersion: chrome.runtime.getManifest().version,
        browserInfo: navigator.userAgent,
      },
    };

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    // Update sync state
    connectionState.lastSync = new Date().toISOString();
    connectionState.lastSyncStatus = 'success';
    await chrome.storage.local.set({ connectionState });
    
    // Mark captures as synced
    if (payload.captures) {
      const { captureHistory = [] } = await chrome.storage.local.get('captureHistory');
      const syncedIds = new Set(payload.captures.map(c => c.id));
      captureHistory.forEach(c => {
        if (syncedIds.has(c.id)) c.synced = true;
      });
      await chrome.storage.local.set({ captureHistory });
    }

    addLog('success', `Sync completed: ${itemCount} item${itemCount !== 1 ? 's' : ''} synced`, {
      captureId: result.captureId,
      postsProcessed: result.postsProcessed,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Update sync state with failure
    connectionState.lastSync = new Date().toISOString();
    connectionState.lastSyncStatus = 'failed';
    connectionState.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    await chrome.storage.local.set({ connectionState });
    
    addLog('error', 'Sync failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

async function getCaptureHistory() {
  try {
    const { captureHistory = [] } = await chrome.storage.local.get('captureHistory');
    return { success: true, data: captureHistory };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkServerConnection() {
  try {
    const { config } = await chrome.storage.local.get('config');
    
    if (!config.apiEndpoint || !config.authToken) {
      connectionState.isConnected = false;
      await chrome.storage.local.set({ connectionState });
      return { success: false, error: 'Not configured' };
    }

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
      },
      body: JSON.stringify({ action: 'ping' }),
    });

    if (response.ok) {
      const data = await response.json();
      const wasConnected = connectionState.isConnected;
      
      connectionState.isConnected = true;
      connectionState.lastHeartbeat = new Date().toISOString();
      
      if (!wasConnected) {
        connectionState.connectedAt = new Date().toISOString();
        addLog('success', 'Connected to Intel CRM', { userId: data.userId });
        startHeartbeat();
      }
      
      await chrome.storage.local.set({ connectionState });
      
      return { 
        success: true, 
        connectedAt: connectionState.connectedAt,
        lastHeartbeat: connectionState.lastHeartbeat,
      };
    } else {
      const errorText = await response.text().catch(() => `HTTP ${response.status}`);
      throw new Error(errorText);
    }
  } catch (error) {
    connectionState.isConnected = false;
    connectionState.lastError = {
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    
    addLog('error', 'Connection failed', { error: error.message });
    await chrome.storage.local.set({ connectionState });
    
    stopHeartbeat();
    return { success: false, error: error.message };
  }
}

async function getConnectionState() {
  try {
    const { connectionState: stored } = await chrome.storage.local.get('connectionState');
    return { success: true, data: stored || connectionState };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getActivityLog() {
  try {
    const { activityLog: stored } = await chrome.storage.local.get('activityLog');
    return { success: true, data: stored || activityLog };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function clearActivityLog() {
  try {
    activityLog = [];
    await chrome.storage.local.set({ activityLog: [] });
    addLog('info', 'Activity log cleared');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function disconnect() {
  try {
    stopHeartbeat();
    
    connectionState = {
      isConnected: false,
      connectedAt: null,
      lastHeartbeat: null,
      lastSync: connectionState.lastSync,
      lastSyncStatus: connectionState.lastSyncStatus,
      lastError: null,
    };
    
    // Clear auth token but keep endpoint
    const { config } = await chrome.storage.local.get('config');
    await chrome.storage.local.set({ 
      config: { ...config, authToken: '' },
      connectionState,
    });
    
    addLog('info', 'Disconnected from Intel CRM');
    return { success: true };
  } catch (error) {
    addLog('error', 'Disconnect failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Heartbeat management
function startHeartbeat() {
  if (heartbeatInterval) return;
  
  heartbeatInterval = setInterval(async () => {
    const { connectionState: state } = await chrome.storage.local.get('connectionState');
    if (state?.isConnected) {
      const result = await checkServerConnection();
      if (result.success) {
        // Update heartbeat timestamp silently (don't log every heartbeat)
        connectionState.lastHeartbeat = new Date().toISOString();
        await chrome.storage.local.set({ connectionState });
      }
    } else {
      stopHeartbeat();
    }
  }, 30000); // Every 30 seconds
  
  console.log('[Intel CRM] Heartbeat started');
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Intel CRM] Heartbeat stopped');
  }
}

// Keep service worker alive with periodic self-ping
function startKeepAlive() {
  if (keepAliveInterval) return;
  
  // Ping every 25 seconds to keep service worker active (before 30s timeout)
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // This is just to keep the service worker alive
    });
  }, 25000);
  
  console.log('[Intel CRM] Keep-alive started');
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log('[Intel CRM] Keep-alive stopped');
  }
}
