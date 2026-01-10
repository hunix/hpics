// Intel CRM Chrome Extension - Background Service Worker

const DEFAULT_CONFIG = {
  apiEndpoint: '',
  authToken: '',
  autoCapture: false,
  captureComments: true,
  captureLikes: false,
  deepScrape: false,
};

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get('config');
  if (!stored.config) {
    await chrome.storage.local.set({ config: DEFAULT_CONFIG });
  }
  console.log('Intel CRM Extension installed');
});

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

    default:
      return { success: false, error: 'Unknown message type' };
  }
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
    return { success: true, data: updated };
  } catch (error) {
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
    return { success: false, error: error.message };
  }
}

async function syncToServer(payload) {
  try {
    const { config } = await chrome.storage.local.get('config');
    
    if (!config.apiEndpoint || !config.authToken) {
      return { success: false, error: 'API not configured' };
    }

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.authToken}`,
      },
      body: JSON.stringify({
        action: 'bulk_scrape',
        ...payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();
    
    // Mark captures as synced
    if (payload.captures) {
      const { captureHistory = [] } = await chrome.storage.local.get('captureHistory');
      const syncedIds = new Set(payload.captures.map(c => c.id));
      captureHistory.forEach(c => {
        if (syncedIds.has(c.id)) c.synced = true;
      });
      await chrome.storage.local.set({ captureHistory });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Sync failed:', error);
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

    return { success: response.ok };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
