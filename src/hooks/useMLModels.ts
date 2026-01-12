/**
 * React Hook for ML Model Management
 * 
 * Provides convenient access to offline ML models with:
 * - Lazy loading
 * - Status tracking
 * - Automatic cleanup
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineMLService, MLModelStatus } from '@/lib/offlineMLService';
import { modelCacheManager } from '@/lib/modelCacheManager';

interface ModelInfo {
  name: string;
  size: number;
  cachedAt: number;
}

interface UseMLModelsOptions {
  autoLoad?: boolean;
  includeAgeGender?: boolean;
  includeExpressions?: boolean;
  includeBlazeFace?: boolean;
}

interface UseMLModelsResult {
  isLoading: boolean;
  isReady: boolean;
  error: Error | null;
  modelStatus: MLModelStatus;
  loadModels: () => Promise<void>;
  
  // Model cache info
  cacheInfo: {
    totalSize: number;
    modelCount: number;
    models: ModelInfo[];
  } | null;
  clearCache: () => Promise<void>;
}

export function useMLModels(options: UseMLModelsOptions = {}): UseMLModelsResult {
  const {
    autoLoad = false,
    includeAgeGender = true,
    includeExpressions = true,
    includeBlazeFace = false,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [modelStatus, setModelStatus] = useState<MLModelStatus>(
    offlineMLService.getModelStatus()
  );
  const [cacheInfo, setCacheInfo] = useState<UseMLModelsResult['cacheInfo']>(null);

  // Load cache info
  const loadCacheInfo = useCallback(async () => {
    try {
      const stats = await modelCacheManager.getStats();
      setCacheInfo({
        totalSize: stats.totalSize,
        modelCount: stats.totalCached,
        models: stats.models,
      });
    } catch (err) {
      console.error('[useMLModels] Failed to get cache info:', err);
    }
  }, []);

  // Load models
  const loadModels = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load face-api models
      await offlineMLService.loadFaceApiModels({
        includeAgeGender,
        includeExpressions,
      });

      // Optionally load BlazeFace
      if (includeBlazeFace) {
        await offlineMLService.loadBlazeFace();
      }

      setModelStatus(offlineMLService.getModelStatus());
      setIsReady(offlineMLService.isReady());
      await loadCacheInfo();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load models'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, includeAgeGender, includeExpressions, includeBlazeFace, loadCacheInfo]);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await modelCacheManager.clearCache();
      await loadCacheInfo();
    } catch (err) {
      console.error('[useMLModels] Failed to clear cache:', err);
    }
  }, [loadCacheInfo]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadModels();
    }
    loadCacheInfo();
  }, [autoLoad]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLoading,
    isReady,
    error,
    modelStatus,
    loadModels,
    cacheInfo,
    clearCache,
  };
}

/**
 * Hook for face detection with automatic model loading
 */
export function useFaceDetection() {
  const { isReady, loadModels, isLoading, error } = useMLModels({ autoLoad: true });

  const detectFaces = useCallback(async (
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    options?: {
      withDescriptors?: boolean;
      withAgeGender?: boolean;
      withExpressions?: boolean;
      withHeadPose?: boolean;
    }
  ) => {
    if (!isReady) {
      await loadModels();
    }
    return offlineMLService.detectFacesEnhanced(input, options);
  }, [isReady, loadModels]);

  return {
    detectFaces,
    isReady,
    isLoading,
    error,
  };
}

/**
 * Hook for quality assessment
 */
export function useQualityAssessment() {
  const { isReady, loadModels } = useMLModels({ autoLoad: true });

  const assessQuality = useCallback(async (
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ) => {
    if (!isReady) {
      await loadModels();
    }

    const detections = await offlineMLService.detectFacesEnhanced(input);
    
    if (detections.length === 0) {
      return null;
    }

    const face = detections[0];
    const imgWidth = input instanceof HTMLVideoElement 
      ? input.videoWidth 
      : input instanceof HTMLImageElement 
        ? input.naturalWidth 
        : input.width;
    const imgHeight = input instanceof HTMLVideoElement 
      ? input.videoHeight 
      : input instanceof HTMLImageElement 
        ? input.naturalHeight 
        : input.height;

    return offlineMLService.calculateQualityScore(face, imgWidth, imgHeight);
  }, [isReady, loadModels]);

  return { assessQuality, isReady };
}

export default useMLModels;
