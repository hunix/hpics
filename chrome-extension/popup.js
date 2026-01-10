// Intel CRM Chrome Extension - Popup Script

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadConfig();
  await loadCaptureHistory();
  setupEventListeners();
  await checkConnection();
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
        <div class="capture-name">${capture.name || capture.username || 'Unknown'}</div>
        <div class="capture-meta">@${capture.username} • ${formatTime(capture.capturedAt)}</div>
      </div>
      <span class="sync-status ${capture.synced ? 'synced' : 'pending'}">${capture.synced ? '✓' : '○'}</span>
    </div>
  `).join('');
}

function setupEventListeners() {
  // Save config
  document.getElementById('save-config').addEventListener('click', async () => {
    const config = {
      apiEndpoint: document.getElementById('api-endpoint').value.trim(),
      authToken: document.getElementById('auth-token').value.trim(),
    };
    
    const btn = document.getElementById('save-config');
    btn.textContent = 'Saving...';
    btn.disabled = true;

    await chrome.runtime.sendMessage({ type: 'SET_CONFIG', payload: config });
    await checkConnection();
    
    btn.textContent = 'Save & Connect';
    btn.disabled = false;
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
    }

    btn.textContent = 'Sync All';
    btn.disabled = false;
  });
}

async function checkConnection() {
  const statusEl = document.getElementById('connection-status');
  const response = await chrome.runtime.sendMessage({ type: 'CHECK_CONNECTION' });
  
  if (response.success) {
    statusEl.className = 'status connected';
    statusEl.querySelector('.status-text').textContent = 'Connected';
  } else {
    statusEl.className = 'status disconnected';
    statusEl.querySelector('.status-text').textContent = 'Disconnected';
  }
}

function formatTime(isoString) {
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
