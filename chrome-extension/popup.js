// Intel CRM Chrome Extension - Popup Script
// Version marker - update this when making changes to verify new code is loaded
const POPUP_UI_VERSION = '2026-01-10-v2';

// Prevent duplicate initialization
if (window.__intelPopupInitialized) {
  console.log('[Intel CRM] Popup already initialized, skipping');
} else {
  window.__intelPopupInitialized = true;

  // Sequence guard to prevent race conditions
  let renderSequence = 0;
  // Mutex to prevent concurrent refreshes
  let refreshInFlight = null;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    console.log('[Intel CRM] Popup init, version:', POPUP_UI_VERSION);
    
    // Display version in footer
    const footer = document.querySelector('.footer span');
    if (footer) {
      footer.textContent = `v${POPUP_UI_VERSION} • Instagram, LinkedIn, Threads, X`;
    }
    
    await loadConfig();
    // Single source of truth: fetch state and render once
    await refreshConnectionUI();
    await loadCaptureHistory();
    await loadActivityLog();
    setupEventListeners();
    
    // Listen for storage changes to react to background state updates
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.connectionState) {
        console.log('[Intel CRM] Connection state changed in storage');
        refreshConnectionUI();
      }
    });
  }

/**
 * Single unified renderer for connection state
 * This is the ONLY function that should update connection-related UI
 */
function renderConnectionState(state, errorMessage = null) {
  const statusEl = document.getElementById('connection-status');
  const btn = document.getElementById('save-config');
  const infoSection = document.getElementById('connection-info-section');
  
  if (state?.isConnected) {
    // Connected state
    statusEl.className = 'status connected';
    statusEl.querySelector('.status-text').textContent = 'Connected';
    
    btn.textContent = 'Disconnect';
    btn.className = 'btn btn-danger';
    btn.dataset.connected = 'true';
    
    infoSection.style.display = 'block';
    
    // Update timestamps
    document.getElementById('connected-since').textContent = 
      state.connectedAt ? formatTime(state.connectedAt) : '-';
    document.getElementById('last-heartbeat').textContent = 
      state.lastHeartbeat ? formatTime(state.lastHeartbeat) : '-';
    
    const lastSyncEl = document.getElementById('last-sync');
    lastSyncEl.textContent = state.lastSync ? formatTime(state.lastSync) : 'Never';
    
    const syncStatusEl = document.getElementById('sync-status-text');
    if (state.lastSyncStatus === 'success') {
      syncStatusEl.textContent = 'Success';
      syncStatusEl.className = 'info-value success';
    } else if (state.lastSyncStatus === 'failed') {
      syncStatusEl.textContent = 'Failed';
      syncStatusEl.className = 'info-value error';
    } else {
      syncStatusEl.textContent = '-';
      syncStatusEl.className = 'info-value';
    }
  } else {
    // Disconnected state
    statusEl.className = 'status disconnected';
    
    // Determine status text based on error
    let statusText = 'Disconnected';
    if (errorMessage) {
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        statusText = 'Token Expired';
      } else if (errorMessage.includes('Invalid token')) {
        statusText = 'Invalid Token';
      } else if (errorMessage.includes('Not configured')) {
        statusText = 'Not Configured';
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        statusText = 'Network Error';
      }
    }
    statusEl.querySelector('.status-text').textContent = statusText;
    
    btn.textContent = 'Save & Connect';
    btn.className = 'btn btn-primary';
    btn.dataset.connected = 'false';
    
    infoSection.style.display = 'none';
  }
}

/**
 * Refresh connection UI by checking connection and rendering from stored state
 * This is the main entry point for updating connection UI
 * Uses mutex to prevent concurrent refreshes
 */
async function refreshConnectionUI() {
  // If a refresh is already in flight, wait for it
  if (refreshInFlight) {
    console.log('[Intel CRM] Refresh already in flight, waiting...');
    return await refreshInFlight;
  }
  
  const currentSeq = ++renderSequence;
  
  console.log('[Intel CRM] Refreshing connection UI, seq:', currentSeq, 'version:', POPUP_UI_VERSION);
  
  // Create the promise and store it
  refreshInFlight = (async () => {
    try {
      // First, trigger a connection check which updates stored state
      const checkResponse = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
      console.log('[Intel CRM] Check response:', checkResponse);
      
      // Guard against stale renders
      if (currentSeq !== renderSequence) {
        console.log('[Intel CRM] Skipping stale render, seq:', currentSeq, 'current:', renderSequence);
        return;
      }
      
      // Now get the authoritative stored state
      const stateResponse = await chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATE' });
      console.log('[Intel CRM] State response:', stateResponse);
      
      // Guard again after async call
      if (currentSeq !== renderSequence) {
        console.log('[Intel CRM] Skipping stale render after state fetch');
        return;
      }
      
      if (stateResponse.success && stateResponse.data) {
        renderConnectionState(stateResponse.data, checkResponse?.error);
      } else {
        renderConnectionState(null, 'Failed to get state');
      }
    } catch (error) {
      console.error('[Intel CRM] Connection refresh error:', error);
      
      if (currentSeq !== renderSequence) return;
      
      renderConnectionState(null, error.message);
    } finally {
      refreshInFlight = null;
    }
  })();
  
  return await refreshInFlight;
}

async function loadConfig() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_CONFIG' });
  
  if (response.success && response.data) {
    const config = response.data;
    document.getElementById('api-endpoint').value = config.apiEndpoint || '';
    document.getElementById('auth-token').value = config.authToken || '';
    document.getElementById('auto-capture').checked = config.autoCapture || false;
    document.getElementById('capture-comments').checked = config.captureComments !== false;
    document.getElementById('capture-likes').checked = config.captureLikes || false;
    document.getElementById('deep-scrape').checked = config.deepScrape || false;
  }
}

async function loadActivityLog() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_ACTIVITY_LOG' });
  const logEl = document.getElementById('console-log');
  
  if (!response.success || !response.data?.length) {
    logEl.innerHTML = '<p class="empty-state">No activity yet</p>';
    return;
  }

  logEl.innerHTML = response.data.slice(0, 50).map(entry => `
    <div class="log-entry">
      <span class="log-time">${formatLogTime(entry.timestamp)}</span>
      <span class="log-type ${entry.type}">[${entry.type.toUpperCase()}]</span>
      <span class="log-message">${escapeHtml(entry.message)}</span>
    </div>
  `).join('');
}

async function loadCaptureHistory() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_HISTORY' });
  const listEl = document.getElementById('capture-list');
  
  if (!response.success || !response.data.length) {
    listEl.innerHTML = '<p class="empty-state">No captures yet</p>';
    return;
  }

  const platformIcons = {
    instagram: '📸',
    linkedin: '💼',
    threads: '🧵',
    twitter: '🐦',
  };

  listEl.innerHTML = response.data.slice(0, 10).map(capture => `
    <div class="capture-item">
      <div class="platform-icon ${capture.platform}">${platformIcons[capture.platform] || '🌐'}</div>
      <div class="capture-info">
        <div class="capture-name">${escapeHtml(capture.name || capture.username || 'Unknown')}</div>
        <div class="capture-meta">@${escapeHtml(capture.username || '')} • ${formatTime(capture.capturedAt)}</div>
      </div>
      <span class="sync-status ${capture.synced ? 'synced' : 'pending'}">${capture.synced ? '✓' : '○'}</span>
    </div>
  `).join('');
}

function setupEventListeners() {
  // Save/Disconnect button
  document.getElementById('save-config').addEventListener('click', async () => {
    const btn = document.getElementById('save-config');
    const isConnected = btn.dataset.connected === 'true';
    
    if (isConnected) {
      // Disconnect
      btn.textContent = 'Disconnecting...';
      btn.disabled = true;
      
      await chrome.runtime.sendMessage({ type: 'DISCONNECT' });
      document.getElementById('auth-token').value = '';
      
      // Single call to refresh UI
      await refreshConnectionUI();
      await loadActivityLog();
      
      btn.disabled = false;
    } else {
      // Connect
      const config = {
        apiEndpoint: document.getElementById('api-endpoint').value.trim(),
        authToken: document.getElementById('auth-token').value.trim(),
      };
      
      if (!config.apiEndpoint || !config.authToken) {
        alert('Please enter both API Endpoint and Auth Token');
        return;
      }
      
      btn.textContent = 'Connecting...';
      btn.disabled = true;

      await chrome.runtime.sendMessage({ type: 'SET_CONFIG', payload: config });
      
      // Single call to refresh UI
      await refreshConnectionUI();
      await loadActivityLog();
      
      btn.disabled = false;
    }
  });

  // Toggle settings
  const toggles = ['auto-capture', 'capture-comments', 'capture-likes', 'deep-scrape'];
  toggles.forEach(id => {
    document.getElementById(id).addEventListener('change', async (e) => {
      const key = id.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
      await chrome.runtime.sendMessage({
        type: 'SET_CONFIG',
        payload: { [key]: e.target.checked }
      });
    });
  });

  // Sync all
  document.getElementById('sync-all').addEventListener('click', async () => {
    const btn = document.getElementById('sync-all');
    btn.textContent = 'Syncing...';
    btn.disabled = true;

    const historyResponse = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_HISTORY' });
    const unsyncedCaptures = historyResponse.data?.filter(c => !c.synced) || [];
    
    if (unsyncedCaptures.length > 0) {
      await chrome.runtime.sendMessage({
        type: 'SYNC_DATA',
        payload: { captures: unsyncedCaptures }
      });
      await loadCaptureHistory();
      await refreshConnectionUI();
      await loadActivityLog();
    }

    btn.textContent = 'Sync All';
    btn.disabled = false;
  });

  // Clear logs
  document.getElementById('clear-logs').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_ACTIVITY_LOG' });
    await loadActivityLog();
  });
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatLogTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

} // End of initialization guard
