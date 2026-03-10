/**
 * PICS Omni-Extractor Background Service Worker
 * Intercepts raw network requests using the chrome.debugger API
 */

const PICS_API_URL = "http://localhost:54321/functions/v1/stream-processor";
// In production, fetch this from extension storage (user config)
const PICS_API_KEY = "dummy-dev-key";

// Keep track of attached tabs to prevent double-attaching
const attachedTabs = new Set();

/** Send intercepted JSON payload to the PICS stream processor */
async function streamToPICS(type, profileId, payload) {
  try {
    const res = await fetch(PICS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PICS_API_KEY}`
      },
      body: JSON.stringify({
        action: "emit_event",
        profileId: profileId,
        eventType: `ambient_${type}_intercept`,
        description: `Ambient intercept of ${type} data`,
        metadata: payload,
      })
    });
    if (!res.ok) console.error("PICS Stream Error:", await res.text());
  } catch (err) {
    console.error("Failed to stream to PICS:", err);
  }
}

/** Attach debugger to intercept GraphQL/XHR */
async function attachDebugger(tabId, url) {
  if (attachedTabs.has(tabId) || url.startsWith("chrome://")) return;

  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    attachedTabs.add(tabId);
    
    // Enable network domain
    await chrome.debugger.sendCommand({ tabId }, "Network.enable");
    
    console.log(`[PICS Omni-Extractor] Debugger attached to tab ${tabId} (${url})`);
  } catch (err) {
    console.error(`Failed to attach debugger to tab ${tabId}:`, err);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Listen to Tab Updates (LinkedIn, Twitter)
// ────────────────────────────────────────────────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("linkedin.com") || tab.url.includes("x.com") || tab.url.includes("twitter.com")) {
      attachDebugger(tabId, tab.url);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  attachedTabs.delete(tabId);
});

// ────────────────────────────────────────────────────────────────────────────
// Network Interception via Debugger Protocol
// ────────────────────────────────────────────────────────────────────────────

chrome.debugger.onEvent.addListener(async (source, method, params) => {
  if (method !== "Network.responseReceived") return;

  const { response, requestId } = params;
  const url = response.url;

  // 1. Intercept LinkedIn GraphQL (e.g. Profile Views, Feed)
  if (url.includes("linkedin.com/voyager/api/graphql")) {
    try {
      const { body } = await chrome.debugger.sendCommand(source, "Network.getResponseBody", { requestId });
      if (!body) return;
      
      const json = JSON.parse(body);
      
      // Heuristic: Is this a profile load?
      if (JSON.stringify(json).includes("profileView")) {
        console.log("[PICS] Intercepted LinkedIn Profile JSON");
        // We'd parse out the exact profileId and data here
        streamToPICS("linkedin_profile", "unknown", json);
      }
    } catch (err) {
      // Ignore errors (often implies body not available yet or request cancelled)
    }
  }

  // 2. Intercept X (Twitter) GraphQL
  if (url.includes("api.x.com/graphql") || url.includes("twitter.com/i/api/graphql")) {
    try {
      const { body } = await chrome.debugger.sendCommand(source, "Network.getResponseBody", { requestId });
      if (!body) return;

      const json = JSON.parse(body);
      if (url.includes("UserBy")) {
         console.log("[PICS] Intercepted X User Profile JSON");
         streamToPICS("x_profile", "unknown", json);
      } else if (url.includes("HomeTimeline")) {
         console.log("[PICS] Intercepted X Timeline JSON");
         streamToPICS("x_timeline", "unknown", json);
      }
    } catch (err) {}
  }
});

// ────────────────────────────────────────────────────────────────────────────
// Message Listener for Content Scripts
// ────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PICS_WHATSAPP_DUMP") {
    console.log(`[PICS] Received WhatsApp IndexedDB Dump: ${msg.payload.chats.length} chats`);
    // Stream bulk data to PICS
    streamToPICS("whatsapp_bulk", "unknown", msg.payload);
    sendResponse({ status: "received" });
  }
});
