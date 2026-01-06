// IndexedDB-based offline storage for contacts and data

const DB_NAME = 'pics-offline-db';
const DB_VERSION = 1;

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

interface PendingMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: Record<string, unknown>;
  created_at: string;
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

      // Contacts store
      if (!database.objectStoreNames.contains('contacts')) {
        const contactsStore = database.createObjectStore('contacts', { keyPath: 'id' });
        contactsStore.createIndex('updated_at', 'updated_at');
        contactsStore.createIndex('is_favorite', 'is_favorite');
      }

      // Pending mutations store
      if (!database.objectStoreNames.contains('pending_mutations')) {
        const mutationsStore = database.createObjectStore('pending_mutations', { keyPath: 'id' });
        mutationsStore.createIndex('created_at', 'created_at');
      }

      // Metadata store for sync timestamps
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

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

export async function addPendingMutation(mutation: Omit<PendingMutation, 'id' | 'created_at'>): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction('pending_mutations', 'readwrite');
  const store = transaction.objectStore('pending_mutations');

  const fullMutation: PendingMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
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

export async function getLastSyncTime(): Promise<string | null> {
  const database = await openDatabase();
  const transaction = database.transaction('metadata', 'readonly');
  const store = transaction.objectStore('metadata');

  return new Promise((resolve, reject) => {
    const request = store.get('lastContactsSync');
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingMutationCount(): Promise<number> {
  const mutations = await getPendingMutations();
  return mutations.length;
}
