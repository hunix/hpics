/**
 * Bulletproof Offline Capture Store
 * 
 * Handles chunked storage of large media files in IndexedDB with:
 * - 1MB chunk size for reliability
 * - SHA-256 checksums for integrity
 * - Resumable upload tracking
 * - Quota management
 * - Recovery from app crashes
 */

const DB_NAME = 'offline-captures';
const DB_VERSION = 1;
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export type CaptureType = 'photo' | 'video' | 'voice';
export type CaptureStatus = 'capturing' | 'ready' | 'uploading' | 'uploaded' | 'failed';

export interface OfflineCapture {
  id: string;
  type: CaptureType;
  profileId?: string;
  createdAt: string;
  totalSize: number;
  totalChunks: number;
  uploadedChunks: number;
  mimeType: string;
  metadata: {
    duration?: number;
    width?: number;
    height?: number;
    fileName?: string;
  };
  status: CaptureStatus;
  lastAttempt?: string;
  retryCount: number;
  checksum: string;
  storagePath?: string;
}

export interface CaptureChunk {
  id: string;
  captureId: string;
  chunkIndex: number;
  data: Blob;
  checksum: string;
  uploaded: boolean;
  size: number;
}

export interface StorageQuota {
  usage: number;
  quota: number;
  available: number;
  percentUsed: number;
  isPersisted: boolean;
}

let db: IDBDatabase | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initOfflineCaptureDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open offline capture database'));

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Captures store - metadata only
      if (!database.objectStoreNames.contains('captures')) {
        const capturesStore = database.createObjectStore('captures', { keyPath: 'id' });
        capturesStore.createIndex('status', 'status', { unique: false });
        capturesStore.createIndex('createdAt', 'createdAt', { unique: false });
        capturesStore.createIndex('profileId', 'profileId', { unique: false });
      }

      // Chunks store - actual binary data
      if (!database.objectStoreNames.contains('chunks')) {
        const chunksStore = database.createObjectStore('chunks', { keyPath: 'id' });
        chunksStore.createIndex('captureId', 'captureId', { unique: false });
        chunksStore.createIndex('captureId_chunkIndex', ['captureId', 'chunkIndex'], { unique: true });
      }
    };
  });
}

/**
 * Compute SHA-256 checksum of a blob
 */
export async function computeChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new offline capture record
 */
export async function createOfflineCapture(
  type: CaptureType,
  mimeType: string,
  profileId?: string
): Promise<OfflineCapture> {
  const database = await initOfflineCaptureDB();
  
  const capture: OfflineCapture = {
    id: crypto.randomUUID(),
    type,
    profileId,
    createdAt: new Date().toISOString(),
    totalSize: 0,
    totalChunks: 0,
    uploadedChunks: 0,
    mimeType,
    metadata: {},
    status: 'capturing',
    retryCount: 0,
    checksum: '',
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures'], 'readwrite');
    const store = transaction.objectStore('captures');
    const request = store.add(capture);

    request.onsuccess = () => resolve(capture);
    request.onerror = () => reject(new Error('Failed to create capture record'));
  });
}

/**
 * Save a chunk of capture data
 */
export async function saveCaptureChunk(
  captureId: string,
  chunkIndex: number,
  data: Blob
): Promise<CaptureChunk> {
  const database = await initOfflineCaptureDB();
  const checksum = await computeChecksum(data);
  
  const chunk: CaptureChunk = {
    id: `${captureId}_${chunkIndex}`,
    captureId,
    chunkIndex,
    data,
    checksum,
    uploaded: false,
    size: data.size,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['chunks', 'captures'], 'readwrite');
    const chunksStore = transaction.objectStore('chunks');
    const capturesStore = transaction.objectStore('captures');

    // Save the chunk
    const chunkRequest = chunksStore.put(chunk);
    
    chunkRequest.onsuccess = () => {
      // Update capture metadata
      const getCapture = capturesStore.get(captureId);
      getCapture.onsuccess = () => {
        const capture = getCapture.result as OfflineCapture;
        if (capture) {
          capture.totalChunks = Math.max(capture.totalChunks, chunkIndex + 1);
          capture.totalSize += data.size;
          capturesStore.put(capture);
        }
      };
    };

    transaction.oncomplete = () => resolve(chunk);
    transaction.onerror = () => reject(new Error('Failed to save chunk'));
  });
}

/**
 * Finalize a capture after recording is complete
 */
export async function finalizeCapture(
  captureId: string,
  metadata?: Partial<OfflineCapture['metadata']>
): Promise<OfflineCapture> {
  const database = await initOfflineCaptureDB();
  
  // Get all chunks to compute total checksum
  const chunks = await getCaptureChunks(captureId);
  const allChecksums = chunks.map(c => c.checksum).join('');
  const finalChecksum = await computeChecksum(new Blob([allChecksums]));

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures'], 'readwrite');
    const store = transaction.objectStore('captures');
    const request = store.get(captureId);

    request.onsuccess = () => {
      const capture = request.result as OfflineCapture;
      if (!capture) {
        reject(new Error('Capture not found'));
        return;
      }

      capture.status = 'ready';
      capture.checksum = finalChecksum;
      if (metadata) {
        capture.metadata = { ...capture.metadata, ...metadata };
      }

      const updateRequest = store.put(capture);
      updateRequest.onsuccess = () => resolve(capture);
      updateRequest.onerror = () => reject(new Error('Failed to finalize capture'));
    };
  });
}

/**
 * Get all chunks for a capture
 */
export async function getCaptureChunks(captureId: string): Promise<CaptureChunk[]> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['chunks'], 'readonly');
    const store = transaction.objectStore('chunks');
    const index = store.index('captureId');
    const request = index.getAll(captureId);

    request.onsuccess = () => {
      const chunks = request.result as CaptureChunk[];
      // Sort by chunk index
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
      resolve(chunks);
    };
    request.onerror = () => reject(new Error('Failed to get chunks'));
  });
}

/**
 * Reassemble chunks into a single blob
 */
export async function reassembleCapture(captureId: string): Promise<Blob> {
  const capture = await getCapture(captureId);
  if (!capture) throw new Error('Capture not found');

  const chunks = await getCaptureChunks(captureId);
  
  // Verify all chunks are present
  if (chunks.length !== capture.totalChunks) {
    throw new Error(`Missing chunks: expected ${capture.totalChunks}, got ${chunks.length}`);
  }

  // Verify checksums
  for (const chunk of chunks) {
    const computedChecksum = await computeChecksum(chunk.data);
    if (computedChecksum !== chunk.checksum) {
      throw new Error(`Chunk ${chunk.chunkIndex} checksum mismatch - data may be corrupted`);
    }
  }

  // Reassemble
  const blobs = chunks.map(c => c.data);
  return new Blob(blobs, { type: capture.mimeType });
}

/**
 * Get a single capture by ID
 */
export async function getCapture(captureId: string): Promise<OfflineCapture | null> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures'], 'readonly');
    const store = transaction.objectStore('captures');
    const request = store.get(captureId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get capture'));
  });
}

/**
 * Get all captures with optional status filter
 */
export async function getAllCaptures(status?: CaptureStatus): Promise<OfflineCapture[]> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures'], 'readonly');
    const store = transaction.objectStore('captures');
    
    let request: IDBRequest;
    if (status) {
      const index = store.index('status');
      request = index.getAll(status);
    } else {
      request = store.getAll();
    }

    request.onsuccess = () => {
      const captures = request.result as OfflineCapture[];
      // Sort by creation date, newest first
      captures.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(captures);
    };
    request.onerror = () => reject(new Error('Failed to get captures'));
  });
}

/**
 * Get captures pending upload
 */
export async function getPendingCaptures(): Promise<OfflineCapture[]> {
  const allCaptures = await getAllCaptures();
  return allCaptures.filter(c => c.status === 'ready' || c.status === 'failed');
}

/**
 * Update capture status
 */
export async function updateCaptureStatus(
  captureId: string,
  status: CaptureStatus,
  updates?: Partial<OfflineCapture>
): Promise<OfflineCapture> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures'], 'readwrite');
    const store = transaction.objectStore('captures');
    const request = store.get(captureId);

    request.onsuccess = () => {
      const capture = request.result as OfflineCapture;
      if (!capture) {
        reject(new Error('Capture not found'));
        return;
      }

      capture.status = status;
      if (updates) {
        Object.assign(capture, updates);
      }

      const updateRequest = store.put(capture);
      updateRequest.onsuccess = () => resolve(capture);
      updateRequest.onerror = () => reject(new Error('Failed to update capture'));
    };
  });
}

/**
 * Mark a chunk as uploaded
 */
export async function markChunkUploaded(captureId: string, chunkIndex: number): Promise<void> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['chunks', 'captures'], 'readwrite');
    const chunksStore = transaction.objectStore('chunks');
    const capturesStore = transaction.objectStore('captures');
    
    const chunkId = `${captureId}_${chunkIndex}`;
    const getChunk = chunksStore.get(chunkId);

    getChunk.onsuccess = () => {
      const chunk = getChunk.result as CaptureChunk;
      if (chunk) {
        chunk.uploaded = true;
        chunksStore.put(chunk);
      }

      // Update uploaded chunks count
      const getCapture = capturesStore.get(captureId);
      getCapture.onsuccess = () => {
        const capture = getCapture.result as OfflineCapture;
        if (capture) {
          capture.uploadedChunks = (capture.uploadedChunks || 0) + 1;
          capturesStore.put(capture);
        }
      };
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to mark chunk uploaded'));
  });
}

/**
 * Delete a capture and all its chunks
 */
export async function deleteCapture(captureId: string): Promise<void> {
  const database = await initOfflineCaptureDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['captures', 'chunks'], 'readwrite');
    const capturesStore = transaction.objectStore('captures');
    const chunksStore = transaction.objectStore('chunks');

    // Delete capture
    capturesStore.delete(captureId);

    // Delete all chunks
    const index = chunksStore.index('captureId');
    const request = index.openCursor(captureId);
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to delete capture'));
  });
}

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<StorageQuota> {
  let isPersisted = false;
  
  // Check if storage is persisted
  if (navigator.storage?.persisted) {
    isPersisted = await navigator.storage.persisted();
  }

  // Get quota estimate
  if (navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const available = quota - usage;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, available, percentUsed, isPersisted };
  }

  // Fallback for browsers without StorageManager
  return {
    usage: 0,
    quota: 2 * 1024 * 1024 * 1024, // Assume 2GB
    available: 2 * 1024 * 1024 * 1024,
    percentUsed: 0,
    isPersisted,
  };
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

/**
 * Get incomplete captures (for recovery)
 */
export async function getIncompleteCaptures(): Promise<OfflineCapture[]> {
  const allCaptures = await getAllCaptures();
  return allCaptures.filter(c => c.status === 'capturing');
}

/**
 * Clean up old uploaded captures
 */
export async function cleanupUploadedCaptures(olderThanDays: number = 7): Promise<number> {
  const captures = await getAllCaptures('uploaded');
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  let deletedCount = 0;
  for (const capture of captures) {
    if (new Date(capture.createdAt) < cutoffDate) {
      await deleteCapture(capture.id);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Get capture statistics
 */
export async function getCaptureStats(): Promise<{
  total: number;
  pending: number;
  uploading: number;
  failed: number;
  totalSize: number;
}> {
  const captures = await getAllCaptures();
  
  return {
    total: captures.length,
    pending: captures.filter(c => c.status === 'ready').length,
    uploading: captures.filter(c => c.status === 'uploading').length,
    failed: captures.filter(c => c.status === 'failed').length,
    totalSize: captures.reduce((sum, c) => sum + c.totalSize, 0),
  };
}

// Export chunk size for use in recording
export { CHUNK_SIZE };
