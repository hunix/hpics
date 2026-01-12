/**
 * React Hook for Video Analysis
 * 
 * Provides convenient video analysis functionality with:
 * - Progress tracking
 * - Queue management
 * - Result caching
 */

import { useState, useCallback, useRef } from 'react';
import { 
  analyzeVideo, 
  VideoAnalysisOptions, 
  VideoAnalysisResult,
  FaceCluster,
  offlineAnalysisQueue
} from '@/lib/videoFrameAnalyzer';

interface UseVideoAnalysisOptions {
  onProgress?: (stage: string, progress: number) => void;
  onComplete?: (result: VideoAnalysisResult) => void;
  onError?: (error: Error) => void;
}

interface UseVideoAnalysisResult {
  // Analysis state
  isAnalyzing: boolean;
  progress: { stage: string; progress: number } | null;
  result: VideoAnalysisResult | null;
  error: Error | null;
  
  // Actions
  analyze: (video: File | Blob | string, options?: VideoAnalysisOptions) => Promise<VideoAnalysisResult | null>;
  reset: () => void;
  
  // Queue management
  queueAnalysis: (video: File, options?: VideoAnalysisOptions) => string;
  getQueueStatus: (id: string) => ReturnType<typeof offlineAnalysisQueue.getStatus>;
  getQueueAll: () => ReturnType<typeof offlineAnalysisQueue.getAll>;
  removeFromQueue: (id: string) => void;
}

export function useVideoAnalysis(options: UseVideoAnalysisOptions = {}): UseVideoAnalysisResult {
  const { onProgress, onComplete, onError } = options;
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<{ stage: string; progress: number } | null>(null);
  const [result, setResult] = useState<VideoAnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async (
    video: File | Blob | string,
    analysisOptions?: VideoAnalysisOptions
  ): Promise<VideoAnalysisResult | null> => {
    if (isAnalyzing) {
      console.warn('[useVideoAnalysis] Analysis already in progress');
      return null;
    }

    setIsAnalyzing(true);
    setProgress({ stage: 'Initializing', progress: 0 });
    setError(null);
    setResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const analysisResult = await analyzeVideo(
        video,
        analysisOptions,
        (stage, prog) => {
          setProgress({ stage, progress: prog });
          onProgress?.(stage, prog);
        }
      );

      setResult(analysisResult);
      onComplete?.(analysisResult);
      return analysisResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Analysis failed');
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }, [isAnalyzing, onProgress, onComplete, onError]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsAnalyzing(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const queueAnalysis = useCallback((
    video: File,
    analysisOptions?: VideoAnalysisOptions
  ): string => {
    return offlineAnalysisQueue.add(video, analysisOptions);
  }, []);

  const getQueueStatus = useCallback((id: string) => {
    return offlineAnalysisQueue.getStatus(id);
  }, []);

  const getQueueAll = useCallback(() => {
    return offlineAnalysisQueue.getAll();
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    offlineAnalysisQueue.remove(id);
  }, []);

  return {
    isAnalyzing,
    progress,
    result,
    error,
    analyze,
    reset,
    queueAnalysis,
    getQueueStatus,
    getQueueAll,
    removeFromQueue,
  };
}

/**
 * Hook for cluster selection and management
 */
export function useClusterSelection(clusters: FaceCluster[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCluster = clusters.find(c => c.id === selectedId) || null;

  const select = useCallback((clusterId: string | null) => {
    setSelectedId(clusterId);
  }, []);

  const selectNext = useCallback(() => {
    if (clusters.length === 0) return;
    
    const currentIndex = clusters.findIndex(c => c.id === selectedId);
    const nextIndex = (currentIndex + 1) % clusters.length;
    setSelectedId(clusters[nextIndex].id);
  }, [clusters, selectedId]);

  const selectPrevious = useCallback(() => {
    if (clusters.length === 0) return;
    
    const currentIndex = clusters.findIndex(c => c.id === selectedId);
    const prevIndex = currentIndex <= 0 ? clusters.length - 1 : currentIndex - 1;
    setSelectedId(clusters[prevIndex].id);
  }, [clusters, selectedId]);

  return {
    selectedCluster,
    selectedId,
    select,
    selectNext,
    selectPrevious,
  };
}

export default useVideoAnalysis;
