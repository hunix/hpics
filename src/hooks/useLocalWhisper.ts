/**
 * useLocalWhisper Hook
 * 
 * React hook for managing WebGPU-accelerated Whisper transcription.
 * Handles model loading, status tracking, and transcription with progress.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  localWhisperTranscriber, 
  type WhisperModel, 
  type TranscriptionResult,
  type WhisperModelInfo 
} from '@/lib/ml/localWhisperTranscriber';

export interface UseLocalWhisperOptions {
  autoLoad?: boolean;
  model?: WhisperModel;
}

export interface UseLocalWhisperResult {
  // State
  isLoading: boolean;
  isReady: boolean;
  loadProgress: number;
  error: Error | null;
  modelInfo: WhisperModelInfo | null;
  
  // Actions
  loadModel: (model?: WhisperModel) => Promise<void>;
  transcribe: (audioSource: string | Blob | ArrayBuffer, options?: {
    language?: string;
    task?: 'transcribe' | 'translate';
  }) => Promise<TranscriptionResult>;
  unloadModel: () => void;
  
  // Transcription state
  isTranscribing: boolean;
  lastResult: TranscriptionResult | null;
}

export function useLocalWhisper(options: UseLocalWhisperOptions = {}): UseLocalWhisperResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [modelInfo, setModelInfo] = useState<WhisperModelInfo | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastResult, setLastResult] = useState<TranscriptionResult | null>(null);
  
  const mountedRef = useRef(true);

  // Update model info
  const updateModelInfo = useCallback(() => {
    const info = localWhisperTranscriber.getModelInfo();
    if (mountedRef.current) {
      setModelInfo(info);
      setIsReady(info.isLoaded);
      setIsLoading(info.isLoading);
      setLoadProgress(info.loadProgress);
    }
  }, []);

  // Load model
  const loadModel = useCallback(async (model?: WhisperModel) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);

    try {
      await localWhisperTranscriber.initialize({
        model: model || options.model || 'turbo',
        device: 'auto',
        onProgress: (progress) => {
          if (mountedRef.current && progress.status === 'progress') {
            setLoadProgress(progress.progress || 0);
          }
        }
      });

      if (mountedRef.current) {
        setIsReady(true);
        setLoadProgress(100);
        updateModelInfo();
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to load model'));
        setIsReady(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isLoading, options.model, updateModelInfo]);

  // Transcribe audio
  const transcribe = useCallback(async (
    audioSource: string | Blob | ArrayBuffer,
    transcribeOptions?: { language?: string; task?: 'transcribe' | 'translate' }
  ): Promise<TranscriptionResult> => {
    if (!isReady) {
      await loadModel();
    }

    setIsTranscribing(true);
    setError(null);

    try {
      const result = await localWhisperTranscriber.transcribe(audioSource, transcribeOptions);
      if (mountedRef.current) {
        setLastResult(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transcription failed');
      if (mountedRef.current) {
        setError(error);
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setIsTranscribing(false);
      }
    }
  }, [isReady, loadModel]);

  // Unload model
  const unloadModel = useCallback(() => {
    localWhisperTranscriber.unload();
    if (mountedRef.current) {
      setIsReady(false);
      setModelInfo(null);
      setLoadProgress(0);
    }
  }, []);

  // Auto-load if specified
  useEffect(() => {
    if (options.autoLoad) {
      loadModel();
    }
    
    // Check initial state
    updateModelInfo();

    return () => {
      mountedRef.current = false;
    };
  }, [options.autoLoad, loadModel, updateModelInfo]);

  return {
    isLoading,
    isReady,
    loadProgress,
    error,
    modelInfo,
    loadModel,
    transcribe,
    unloadModel,
    isTranscribing,
    lastResult
  };
}

export default useLocalWhisper;
