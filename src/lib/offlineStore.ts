// IndexedDB-based offline storage for contacts, conversations, tasks, and data

const DB_NAME = 'pics-offline-db';
const DB_VERSION = 2; // Bumped version for new stores

interface OfflineContact {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
  company: string | null;
  job_title: string | null;
  relationship_type: string | null;
  is_favorite: boolean;
  updated_at: string;
}

interface OfflineConversation {
  id: string;
  profile_id: string;
  title: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  updated_at: string;
}

interface OfflineTask {
  id: string;
  profile_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  updated_at: string;
}

interface OfflineAlert {
  id: string;
  profile_id: string | null;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  created_at: string;
  retries?: number;
  last_error?: string;
}

interface SyncConflict {
  id: string;
  table: string;
  record_id: string;
  local_data: Record<string, unknown>;
  server_data: Record<string, unknown>;
  detected_at: string;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

let db: IDBDatabase | null = null;

async function openDatabase(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      // Contacts store (existing)
      if (!database.objectStoreNames.contains('contacts')) {
        const contactsStore = database.createObjectStore('contacts', { keyPath: 'id' });
        contactsStore.createIndex('updated_at', 'updated_at');
        contactsStore.createIndex('is_favorite', 'is_favorite');
      }

      // Pending mutations store (existing)
      if (!database.objectStoreNames.contains('pending_mutations')) {
        const mutationsStore = database.createObjectStore('pending_mutations', { keyPath: 'id' });
        mutationsStore.createIndex('created_at', 'created_at');
      }

      // Metadata store (existing)
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }

      // New stores for Phase 5
      if (oldVersion < 2) {
        // Conversations store
        if (!database.objectStoreNames.contains('conversations')) {
          const convStore = database.createObjectStore('conversations', { keyPath: 'id' });
          convStore.createIndex('profile_id', 'profile_id');
          convStore.createIndex('updated_at', 'updated_at');
        }

        // Tasks store
        if (!database.objectStoreNames.contains('tasks')) {
          const tasksStore = database.createObjectStore('tasks', { keyPath: 'id' });
          tasksStore.createIndex('profile_id', 'profile_id');
          tasksStore.createIndex('status', 'status');
          tasksStore.createIndex('due_date', 'due_date');
        }

        // Alerts store
        if (!database.objectStoreNames.contains('alerts')) {
          const alertsStore = database.createObjectStore('alerts', { keyPath: 'id' });
          alertsStore.createIndex('severity', 'severity');
          alertsStore.createIndex('is_read', 'is_read');
        }

        // Sync conflicts store
        if (!database.objectStoreNames.contains('sync_conflicts')) {
          const conflictsStore = database.createObjectStore('sync_conflicts', { keyPath: 'id' });
          conflictsStore.createIndex('resolved', 'resolved');
          conflictsStore.createIndex('detected_at', 'detected_at');
        }
      }
    };
  });
}

// ===== CONTACTS =====
export async function saveContactsOffline(contacts: OfflineContact[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(['contacts', 'metadata'], 'readwrite');
  const store = transaction.objectStore('contacts');
  const metadataStore = transaction.objectStore('metadata');

  // Clear existing contacts and add new ones
  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const contact of contacts) {
    store.put(contact);
  }

  // Update last sync timestamp
  metadataStore.put({ key: 'lastContactsSync', value: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflineContacts(): Promise<OfflineContact[]> {
  const database = await openDatabase();
  const transaction = database.transaction('contacts', 'readonly');
  const store = transaction.objectStore('contacts');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineContact(id: string): Promise<OfflineContact | undefined> {
  const database = await openDatabase();
  const transaction = database.transaction('contacts', 'readonly');
  const store = transaction.objectStore('contacts');

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== CONVERSATIONS =====
export async function saveConversationsOffline(conversations: OfflineConversation[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(['conversations', 'metadata'], 'readwrite');
  const store = transaction.objectStore('conversations');
  const metadataStore = transaction.objectStore('metadata');

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const conv of conversations) {
    store.put(conv);
  }

  metadataStore.put({ key: 'lastConversationsSync', value: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflineConversations(): Promise<OfflineConversation[]> {
  const database = await openDatabase();
  const transaction = database.transaction('conversations', 'readonly');
  const store = transaction.objectStore('conversations');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== TASKS =====
export async function saveTasksOffline(tasks: OfflineTask[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(['tasks', 'metadata'], 'readwrite');
  const store = transaction.objectStore('tasks');
  const metadataStore = transaction.objectStore('metadata');

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const task of tasks) {
    store.put(task);
  }

  metadataStore.put({ key: 'lastTasksSync', value: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflineTasks(): Promise<OfflineTask[]> {
  const database = await openDatabase();
  const transaction = database.transaction('tasks', 'readonly');
  const store = transaction.objectStore('tasks');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== ALERTS =====
export async function saveAlertsOffline(alerts: OfflineAlert[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(['alerts', 'metadata'], 'readwrite');
  const store = transaction.objectStore('alerts');
  const metadataStore = transaction.objectStore('metadata');

  await new Promise<void>((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => resolve();
    clearRequest.onerror = () => reject(clearRequest.error);
  });

  for (const alert of alerts) {
    store.put(alert);
  }

  metadataStore.put({ key: 'lastAlertsSync', value: new Date().toISOString() });

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getOfflineAlerts(): Promise<OfflineAlert[]> {
  const database = await openDatabase();
  const transaction = database.transaction('alerts', 'readonly');
  const store = transaction.objectStore('alerts');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ===== PENDING MUTATIONS =====
export async function addPendingMutation(mutation: Omit<PendingMutation, 'id' | 'created_at'>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readwrite');
  const store = transaction.objectStore('pending_mutations');

  const fullMutation: PendingMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    retries: 0,
  };

  store.add(fullMutation);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readonly');
  const store = transaction.objectStore('pending_mutations');
  const index = store.index('created_at');

  return new Promise((resolve, reject) => {
    const request = index.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updatePendingMutation(id: string, updates: Partial<PendingMutation>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readwrite');
  const store = transaction.objectStore('pending_mutations');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        store.put({ ...getRequest.result, ...updates });
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearPendingMutation(id: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readwrite');
  const store = transaction.objectStore('pending_mutations');

  store.delete(id);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function clearAllPendingMutations(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readwrite');
  const store = transaction.objectStore('pending_mutations');

  store.clear();

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ===== SYNC CONFLICTS =====
export async function addSyncConflict(conflict: Omit<SyncConflict, 'id' | 'detected_at' | 'resolved'>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('sync_conflicts', 'readwrite');
  const store = transaction.objectStore('sync_conflicts');

  const fullConflict: SyncConflict = {
    ...conflict,
    id: crypto.randomUUID(),
    detected_at: new Date().toISOString(),
    resolved: false,
  };

  store.add(fullConflict);

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getSyncConflicts(includeResolved = false): Promise<SyncConflict[]> {
  const database = await openDatabase();
  const transaction = database.transaction('sync_conflicts', 'readonly');
  const store = transaction.objectStore('sync_conflicts');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const conflicts = request.result as SyncConflict[];
      resolve(includeResolved ? conflicts : conflicts.filter(c => !c.resolved));
    };
    request.onerror = () => reject(request.error);
  });
}

export async function resolveSyncConflict(id: string, resolution: 'local' | 'server' | 'merged'): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('sync_conflicts', 'readwrite');
  const store = transaction.objectStore('sync_conflicts');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        store.put({ ...getRequest.result, resolved: true, resolution });
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ===== METADATA =====
export async function getLastSyncTime(key = 'lastContactsSync'): Promise<string | null> {
  const database = await openDatabase();
  const transaction = database.transaction('metadata', 'readonly');
  const store = transaction.objectStore('metadata');

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingMutationCount(): Promise<number> {
  const mutations = await getPendingMutations();
  return mutations.length;
}

export async function getSyncStatus(): Promise<{
  pendingMutations: number;
  unresolvedConflicts: number;
  lastContactsSync: string | null;
  lastConversationsSync: string | null;
  lastTasksSync: string | null;
}> {
  const [mutations, conflicts, contactsSync, conversationsSync, tasksSync] = await Promise.all([
    getPendingMutations(),
    getSyncConflicts(),
    getLastSyncTime('lastContactsSync'),
    getLastSyncTime('lastConversationsSync'),
    getLastSyncTime('lastTasksSync'),
  ]);

  return {
    pendingMutations: mutations.length,
    unresolvedConflicts: conflicts.length,
    lastContactsSync: contactsSync,
    lastConversationsSync: conversationsSync,
    lastTasksSync: tasksSync,
  };
}

// ===== BACKGROUND SYNC REGISTRATION =====
export async function registerBackgroundSync(tag: string = 'sync-mutations'): Promise<boolean> {
  if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration?.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}
