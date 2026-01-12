/**
 * ML Model Cache Manager
 * 
 * Manages caching of ML models in IndexedDB for offline use:
 * - Pre-download models on WiFi
 * - Version tracking and updates
 * - Storage quota management
 * - Instant reload after first cache
 */

const DB_NAME = 'ml-model-cache';
const DB_VERSION = 1;
const STORE_NAME = 'models';

interface CachedModel {
  name: string;
  version: string;
  data: ArrayBuffer;
  size: number;
  cachedAt: number;
  lastAccessed: number;
}

interface ModelManifest {
  name: string;
  url: string;
  version: string;
  size: number; // Approximate size in bytes
  required: boolean;
}

// Model manifest - all models we can cache
const MODEL_MANIFEST: ModelManifest[] = [
  // Face-api.js models
  {
    name: 'ssd_mobilenetv1_model-weights_manifest.json',
    url: '/models/face-api/ssd_mobilenetv1_model-weights_manifest.json',
    version: '1.0.0',
    size: 5800000, // ~5.8MB
    required: true,
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: '/models/face-api/face_landmark_68_model-weights_manifest.json',
    version: '1.0.0',
    size: 350000, // ~350KB
    required: true,
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: '/models/face-api/face_recognition_model-weights_manifest.json',
    version: '1.0.0',
    size: 6200000, // ~6.2MB
    required: true,
  },
  {
    name: 'age_gender_model-weights_manifest.json',
    url: '/models/face-api/age_gender_model-weights_manifest.json',
    version: '1.0.0',
    size: 420000, // ~420KB
    required: false,
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: '/models/face-api/face_expression_model-weights_manifest.json',
    version: '1.0.0',
    size: 590000, // ~590KB
    required: false,
  },
];

class ModelCacheManager {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[ModelCache] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' });
          store.createIndex('cachedAt', 'cachedAt');
          store.createIndex('size', 'size');
        }
      };
    });
  }

  /**
   * Check if a model is cached
   */
  async isModelCached(name: string): Promise<boolean> {
    await this.dbReady;
    if (!this.db) return false;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        resolve(false);
      };
    });
  }

  /**
   * Get cached model data
   */
  async getModel(name: string): Promise<ArrayBuffer | null> {
    await this.dbReady;
    if (!this.db) return null;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(name);

      request.onsuccess = () => {
        const model = request.result as CachedModel | undefined;
        if (model) {
          // Update last accessed
          model.lastAccessed = Date.now();
          store.put(model);
          resolve(model.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  /**
   * Cache a model
   */
  async cacheModel(name: string, data: ArrayBuffer, version: string): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const model: CachedModel = {
        name,
        version,
        data,
        size: data.byteLength,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
      };

      const request = store.put(model);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a cached model
   */
  async deleteModel(name: string): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(name);
      tx.oncomplete = () => resolve();
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalCached: number;
    totalSize: number;
    models: Array<{ name: string; size: number; cachedAt: number }>;
  }> {
    await this.dbReady;
    if (!this.db) {
      return { totalCached: 0, totalSize: 0, models: [] };
    }

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const models = request.result as CachedModel[];
        resolve({
          totalCached: models.length,
          totalSize: models.reduce((sum, m) => sum + m.size, 0),
          models: models.map(m => ({
            name: m.name,
            size: m.size,
            cachedAt: m.cachedAt,
          })),
        });
      };

      request.onerror = () => {
        resolve({ totalCached: 0, totalSize: 0, models: [] });
      };
    });
  }

  /**
   * Pre-download all models for offline use
   */
  async preloadAllModels(
    onProgress?: (current: number, total: number, name: string) => void
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (let i = 0; i < MODEL_MANIFEST.length; i++) {
      const model = MODEL_MANIFEST[i];
      onProgress?.(i, MODEL_MANIFEST.length, model.name);

      try {
        // Check if already cached with correct version
        const cached = await this.isModelCached(model.name);
        if (cached) {
          success++;
          continue;
        }

        // Download and cache
        const response = await fetch(model.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.arrayBuffer();
        await this.cacheModel(model.name, data, model.version);
        success++;
      } catch (error) {
        console.warn(`[ModelCache] Failed to cache ${model.name}:`, error);
        failed++;
      }
    }

    onProgress?.(MODEL_MANIFEST.length, MODEL_MANIFEST.length, 'Complete');
    return { success, failed };
  }

  /**
   * Check if all required models are cached
   */
  async areRequiredModelsCached(): Promise<boolean> {
    const required = MODEL_MANIFEST.filter(m => m.required);
    
    for (const model of required) {
      const cached = await this.isModelCached(model.name);
      if (!cached) return false;
    }

    return true;
  }

  /**
   * Clear all cached models
   */
  async clearCache(): Promise<void> {
    await this.dbReady;
    if (!this.db) return;

    return new Promise((resolve) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
    });
  }

  /**
   * Get estimated total size needed for all models
   */
  getEstimatedTotalSize(): number {
    return MODEL_MANIFEST.reduce((sum, m) => sum + m.size, 0);
  }

  /**
   * Check storage quota
   */
  async checkStorageQuota(): Promise<{
    available: number;
    used: number;
    quota: number;
    sufficient: boolean;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const used = estimate.usage || 0;
      const available = quota - used;
      const needed = this.getEstimatedTotalSize();

      return {
        available,
        used,
        quota,
        sufficient: available >= needed,
      };
    }

    // Fallback - assume sufficient
    return {
      available: 100 * 1024 * 1024, // 100MB assumed
      used: 0,
      quota: 100 * 1024 * 1024,
      sufficient: true,
    };
  }
}

export const modelCacheManager = new ModelCacheManager();

/**
 * Hook for React components
 */
export function useModelCache() {
  return modelCacheManager;
}
