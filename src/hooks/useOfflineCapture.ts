/**
 * React Hook for Offline Capture
 * 
 * Provides a React-friendly interface for:
 * - Chunked recording to IndexedDB
 * - Progress tracking
 * - Storage quota management
 * - Auto-sync when online
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  initOfflineCaptureDB,
  createOfflineCapture,
  saveCaptureChunk,
  finalizeCapture,
  getCapture,
  getAllCaptures,
  getPendingCaptures,
  getStorageQuota,
  requestPersistentStorage,
  deleteCapture,
  type OfflineCapture,
  type CaptureType,
  type StorageQuota,
  CHUNK_SIZE,
} from '@/lib/offlineCaptureStore';
import { uploadManager, type UploadProgress } from '@/lib/resumableUploadManager';

export interface CaptureSession {
  captureId: string;
  type: CaptureType;
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  chunksRecorded: number;
  bytesRecorded: number;
}

export interface UseOfflineCaptureReturn {
  // State
  isInitialized: boolean;
  captures: OfflineCapture[];
  pendingCount: number;
  storageQuota: StorageQuota | null;
  currentSession: CaptureSession | null;
  uploadProgress: Map<string, UploadProgress>;
  isOnline: boolean;
  
  // Recording actions
  startCapture: (type: CaptureType, mimeType: string, profileId?: string) => Promise<string>;
  addChunk: (captureId: string, chunk: Blob) => Promise<void>;
  finishCapture: (captureId: string, metadata?: Record<string, unknown>) => Promise<OfflineCapture>;
  cancelCapture: (captureId: string) => Promise<void>;
  
  // Upload actions
  uploadCapture: (captureId: string) => Promise<boolean>;
  uploadAllPending: () => Promise<{ success: number; failed: number }>;
  cancelUpload: (captureId: string) => void;
  
  // Management actions
  deleteCapture: (captureId: string) => Promise<void>;
  refreshCaptures: () => Promise<void>;
  requestPersistence: () => Promise<boolean>;
}

export function useOfflineCapture(): UseOfflineCaptureReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [captures, setCaptures] = useState<OfflineCapture[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [currentSession, setCurrentSession] = useState<CaptureSession | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const progressUnsubscribers = useRef<Map<string, () => void>>(new Map());

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initOfflineCaptureDB();
        setIsInitialized(true);
        
        // Request persistent storage on first init
        const isPersisted = await requestPersistentStorage();
        if (!isPersisted) {
          console.warn('Persistent storage not granted - data may be evicted');
        }
        
        // Load initial data
        await refreshCaptures();
        await updateStorageQuota();
      } catch (error) {
        console.error('Failed to initialize offline capture:', error);
        toast.error('Failed to initialize offline storage');
      }
    };
    
    init();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing captures...');
      // Auto-sync pending captures
      uploadAllPending();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Offline - captures will sync when connection returns');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup progress subscriptions
  useEffect(() => {
    return () => {
      progressUnsubscribers.current.forEach(unsub => unsub());
    };
  }, []);

  const refreshCaptures = useCallback(async () => {
    try {
      const allCaptures = await getAllCaptures();
      setCaptures(allCaptures);
      
      const pending = await getPendingCaptures();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to refresh captures:', error);
    }
  }, []);

  const updateStorageQuota = useCallback(async () => {
    try {
      const quota = await getStorageQuota();
      setStorageQuota(quota);
    } catch (error) {
      console.error('Failed to get storage quota:', error);
    }
  }, []);

  const startCapture = useCallback(async (
    type: CaptureType,
    mimeType: string,
    profileId?: string
  ): Promise<string> => {
    // Check storage quota
    const quota = await getStorageQuota();
    if (quota.percentUsed > 90) {
      toast.warning('Storage almost full - consider uploading or deleting old captures');
    }

    const capture = await createOfflineCapture(type, mimeType, profileId);
    
    setCurrentSession({
      captureId: capture.id,
      type,
      isRecording: true,
      isPaused: false,
      duration: 0,
      chunksRecorded: 0,
      bytesRecorded: 0,
    });

    return capture.id;
  }, []);

  const addChunk = useCallback(async (captureId: string, chunk: Blob) => {
    const chunkIndex = currentSession?.chunksRecorded || 0;
    
    await saveCaptureChunk(captureId, chunkIndex, chunk);
    
    setCurrentSession(prev => {
      if (!prev || prev.captureId !== captureId) return prev;
      return {
        ...prev,
        chunksRecorded: prev.chunksRecorded + 1,
        bytesRecorded: prev.bytesRecorded + chunk.size,
      };
    });

    // Update storage quota periodically
    if (chunkIndex % 10 === 0) {
      updateStorageQuota();
    }
  }, [currentSession, updateStorageQuota]);

  const finishCapture = useCallback(async (
    captureId: string,
    metadata?: Record<string, unknown>
  ): Promise<OfflineCapture> => {
    const capture = await finalizeCapture(captureId, metadata);
    
    setCurrentSession(null);
    await refreshCaptures();
    await updateStorageQuota();

    // Auto-upload if online
    if (navigator.onLine) {
      // Start upload in background
      uploadCapture(captureId);
    } else {
      toast.info('Capture saved locally - will upload when online');
    }

    return capture;
  }, [refreshCaptures, updateStorageQuota]);

  const cancelCapture = useCallback(async (captureId: string) => {
    await deleteCapture(captureId);
    setCurrentSession(null);
    await refreshCaptures();
    await updateStorageQuota();
  }, [refreshCaptures, updateStorageQuota]);

  const uploadCapture = useCallback(async (captureId: string): Promise<boolean> => {
    // Subscribe to progress updates
    const unsub = uploadManager.onProgress(captureId, (progress) => {
      setUploadProgress(prev => {
        const next = new Map(prev);
        next.set(captureId, progress);
        return next;
      });
    });
    
    progressUnsubscribers.current.set(captureId, unsub);

    try {
      const result = await uploadManager.uploadCapture(captureId);
      
      if (result) {
        toast.success('Capture uploaded successfully');
        await refreshCaptures();
      }
      
      return result;
    } finally {
      // Cleanup subscription after upload completes
      setTimeout(() => {
        unsub();
        progressUnsubscribers.current.delete(captureId);
        setUploadProgress(prev => {
          const next = new Map(prev);
          next.delete(captureId);
          return next;
        });
      }, 5000);
    }
  }, [refreshCaptures]);

  const uploadAllPending = useCallback(async (): Promise<{ success: number; failed: number }> => {
    const result = await uploadManager.uploadAllPending();
    
    if (result.success > 0) {
      toast.success(`Uploaded ${result.success} capture(s)`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to upload ${result.failed} capture(s)`);
    }
    
    await refreshCaptures();
    return result;
  }, [refreshCaptures]);

  const cancelUpload = useCallback((captureId: string) => {
    uploadManager.cancelUpload(captureId);
    
    setUploadProgress(prev => {
      const next = new Map(prev);
      next.delete(captureId);
      return next;
    });
  }, []);

  const deleteCaptureHandler = useCallback(async (captureId: string) => {
    await uploadManager.deleteAndCleanup(captureId);
    await refreshCaptures();
    await updateStorageQuota();
    toast.success('Capture deleted');
  }, [refreshCaptures, updateStorageQuota]);

  const requestPersistence = useCallback(async (): Promise<boolean> => {
    const granted = await requestPersistentStorage();
    if (granted) {
      toast.success('Persistent storage granted');
    } else {
      toast.warning('Persistent storage not available');
    }
    await updateStorageQuota();
    return granted;
  }, [updateStorageQuota]);

  return {
    isInitialized,
    captures,
    pendingCount,
    storageQuota,
    currentSession,
    uploadProgress,
    isOnline,
    startCapture,
    addChunk,
    finishCapture,
    cancelCapture,
    uploadCapture,
    uploadAllPending,
    cancelUpload,
    deleteCapture: deleteCaptureHandler,
    refreshCaptures,
    requestPersistence,
  };
}

// Export chunk size for use in components
export { CHUNK_SIZE };
