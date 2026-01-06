// Enhanced Service Worker for PICS - Personal Information Connection System
// With advanced offline capabilities and caching strategies

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `pics-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `pics-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `pics-images-${CACHE_VERSION}`;
const API_CACHE = `pics-api-${CACHE_VERSION}`;

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

// API patterns that benefit from caching
const API_CACHE_PATTERNS = [
  /\/rest\/v1\/profiles/,
  /\/rest\/v1\/contact_groups/,
  /\/rest\/v1\/events/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('pics-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== IMAGE_CACHE &&
                     name !== API_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Helper function to determine caching strategy
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Images - Cache First
  if (request.destination === 'image' || 
      url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    return { strategy: 'cache-first', cacheName: IMAGE_CACHE, maxAge: 7 * 24 * 60 * 60 * 1000 };
  }
  
  // Static assets (JS, CSS) - Stale While Revalidate
  if (url.pathname.match(/\.(js|css|woff|woff2)$/) || url.pathname.startsWith('/assets/')) {
    return { strategy: 'stale-while-revalidate', cacheName: DYNAMIC_CACHE, maxAge: 24 * 60 * 60 * 1000 };
  }
  
  // API requests - Network First with fallback
  if (url.hostname.includes('supabase') || API_CACHE_PATTERNS.some(p => p.test(url.pathname))) {
    return { strategy: 'network-first', cacheName: API_CACHE, maxAge: 5 * 60 * 1000 };
  }
  
  // HTML pages - Network First
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    return { strategy: 'network-first', cacheName: STATIC_CACHE, maxAge: 60 * 60 * 1000 };
  }
  
  // Default - Network First
  return { strategy: 'network-first', cacheName: DYNAMIC_CACHE, maxAge: 60 * 60 * 1000 };
}

// Cache First strategy
async function cacheFirst(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check if cached response is still valid
    const cacheDate = cachedResponse.headers.get('sw-cache-date');
    if (cacheDate) {
      const age = Date.now() - new Date(cacheDate).getTime();
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const clonedResponse = networkResponse.clone();
      
      // Add cache timestamp
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const responseWithDate = new Response(await clonedResponse.blob(), {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      });
      
      cache.put(request, responseWithDate);
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Network First strategy
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.match('/');
      if (offlineCache) return offlineCache;
    }
    
    return new Response(JSON.stringify({ error: 'Offline', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  const { strategy, cacheName, maxAge } = getCacheStrategy(event.request);
  
  switch (strategy) {
    case 'cache-first':
      event.respondWith(cacheFirst(event.request, cacheName, maxAge));
      break;
    case 'network-first':
      event.respondWith(networkFirst(event.request, cacheName, maxAge));
      break;
    case 'stale-while-revalidate':
      event.respondWith(staleWhileRevalidate(event.request, cacheName));
      break;
    default:
      event.respondWith(fetch(event.request));
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'PICS Notification',
    body: 'You have a new notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    vibrate: [100, 50, 100, 50, 100],
    tag: data.tag || 'pics-notification',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: data.id || crypto.randomUUID(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open', icon: '/pwa-192x192.png' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check for existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-communications') {
    event.waitUntil(syncCommunications());
  }
  
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

// Sync communications when back online
async function syncCommunications() {
  console.log('[SW] Syncing communications...');
  // Implementation would read from IndexedDB and POST to API
}

// Sync notes when back online
async function syncNotes() {
  console.log('[SW] Syncing notes...');
  // Implementation would read from IndexedDB and POST to API
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'update-contacts') {
    event.waitUntil(updateContactsCache());
  }
});

// Pre-cache important contact data
async function updateContactsCache() {
  console.log('[SW] Updating contacts cache...');
  // Would fetch fresh contact list and cache it
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => 
        Promise.all(names.map((name) => caches.delete(name)))
      )
    );
  }
});
