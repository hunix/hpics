/**
 * Local Audio Analyzer - Unified Service
 * 
 * Combines WebGPU Whisper transcription with existing local ML services
 * for complete on-device audio analysis with zero network latency.
 * 
 * Orchestrates:
 * - Whisper Turbo: Fast transcription
 * - Local Sentiment: Emotion detection on transcript
 * - Local Speaker ID: Voice fingerprinting (when audio samples available)
 */

import { localWhisperTranscriber, type TranscriptionResult, type WhisperModel, type ProgressCallback } from './localWhisperTranscriber';
import { localSentimentAnalyzer, type SentimentResult } from './localSentimentAnalyzer';
import { localSpeakerIdentifier, type SpeakerSegment, type DiarizationResult } from './localSpeakerIdentifier';

export interface LocalAudioAnalysisOptions {
  transcribe?: boolean;
  analyzeSentiment?: boolean;
  diarizeSpeakers?: boolean;
  whisperModel?: WhisperModel;
  language?: string;
  onProgress?: ProgressCallback;
}

export interface LocalAudioAnalysis {
  transcription: TranscriptionResult | null;
  sentiment: SentimentResult | null;
  speakers: DiarizationResult | null;
  totalProcessingMs: number;
  method: 'local';
  breakdown: {
    transcriptionMs: number;
    sentimentMs: number;
    diarizationMs: number;
  };
}

export interface BatchAnalysisProgress {
  currentFile: number;
  totalFiles: number;
  currentFileName: string;
  status: 'initializing' | 'transcribing' | 'analyzing' | 'complete' | 'error';
  modelStatus: 'loading' | 'ready';
  modelProgress?: number;
}

export type BatchProgressCallback = (progress: BatchAnalysisProgress) => void;

class LocalAudioAnalyzer {
  private isInitialized = false;

  /**
   * Initialize the analyzer with specified model
   */
  async initialize(options?: {
    whisperModel?: WhisperModel;
    onProgress?: ProgressCallback;
  }): Promise<void> {
    if (this.isInitialized && localWhisperTranscriber.isReady()) {
      return;
    }

    console.log('[LocalAudioAnalyzer] Initializing...');
    
    await localWhisperTranscriber.initialize({
      model: options?.whisperModel || 'turbo',
      device: 'auto',
      onProgress: options?.onProgress
    });

    this.isInitialized = true;
    console.log('[LocalAudioAnalyzer] Ready');
  }

  /**
   * Analyze a single audio file with all available local ML
   */
  async analyzeAudioFile(
    audioSource: string | Blob | ArrayBuffer,
    options: LocalAudioAnalysisOptions = {}
  ): Promise<LocalAudioAnalysis> {
    const startTime = performance.now();
    const breakdown = { transcriptionMs: 0, sentimentMs: 0, diarizationMs: 0 };

    // Initialize if needed
    if (!localWhisperTranscriber.isReady()) {
      await this.initialize({
        whisperModel: options.whisperModel,
        onProgress: options.onProgress
      });
    }

    let transcription: TranscriptionResult | null = null;
    let sentiment: SentimentResult | null = null;
    let speakers: DiarizationResult | null = null;

    // Step 1: Transcription (default on)
    if (options.transcribe !== false) {
      const transcriptionStart = performance.now();
      try {
        transcription = await localWhisperTranscriber.transcribe(audioSource, {
          language: options.language
        });
        breakdown.transcriptionMs = performance.now() - transcriptionStart;
      } catch (error) {
        console.error('[LocalAudioAnalyzer] Transcription failed:', error);
      }
    }

    // Step 2: Sentiment analysis on transcript (default on)
    if (options.analyzeSentiment !== false && transcription?.text) {
      const sentimentStart = performance.now();
      try {
        sentiment = localSentimentAnalyzer.analyzeSentiment(transcription.text);
        breakdown.sentimentMs = performance.now() - sentimentStart;
      } catch (error) {
        console.error('[LocalAudioAnalyzer] Sentiment analysis failed:', error);
      }
    }

    // Step 3: Speaker diarization (optional, requires audio features)
    if (options.diarizeSpeakers && audioSource instanceof ArrayBuffer) {
      const diarizationStart = performance.now();
      try {
        // Extract audio features for speaker identification
        // This is a placeholder - full diarization requires audio processing
        console.log('[LocalAudioAnalyzer] Speaker diarization requested but requires audio sample extraction');
        breakdown.diarizationMs = performance.now() - diarizationStart;
      } catch (error) {
        console.error('[LocalAudioAnalyzer] Diarization failed:', error);
      }
    }

    const totalProcessingMs = performance.now() - startTime;

    return {
      transcription,
      sentiment,
      speakers,
      totalProcessingMs,
      method: 'local',
      breakdown
    };
  }

  /**
   * Batch analyze multiple audio files with progress tracking
   */
  async analyzeBatch(
    audioSources: Array<{ url: string; id: string; name: string }>,
    options: LocalAudioAnalysisOptions & {
      onBatchProgress?: BatchProgressCallback;
      stopOnError?: boolean;
    } = {}
  ): Promise<Map<string, LocalAudioAnalysis | { error: string }>> {
    const results = new Map<string, LocalAudioAnalysis | { error: string }>();

    // Initialize model first
    options.onBatchProgress?.({
      currentFile: 0,
      totalFiles: audioSources.length,
      currentFileName: 'Initializing...',
      status: 'initializing',
      modelStatus: 'loading',
      modelProgress: 0
    });

    await this.initialize({
      whisperModel: options.whisperModel,
      onProgress: (progress) => {
        options.onProgress?.(progress);
        if (progress.status === 'progress') {
          options.onBatchProgress?.({
            currentFile: 0,
            totalFiles: audioSources.length,
            currentFileName: 'Loading model...',
            status: 'initializing',
            modelStatus: 'loading',
            modelProgress: progress.progress
          });
        }
      }
    });

    // Process each file
    for (let i = 0; i < audioSources.length; i++) {
      const source = audioSources[i];

      options.onBatchProgress?.({
        currentFile: i + 1,
        totalFiles: audioSources.length,
        currentFileName: source.name,
        status: 'transcribing',
        modelStatus: 'ready'
      });

      try {
        const result = await this.analyzeAudioFile(source.url, {
          transcribe: options.transcribe,
          analyzeSentiment: options.analyzeSentiment,
          diarizeSpeakers: options.diarizeSpeakers,
          language: options.language
        });

        results.set(source.id, result);

        options.onBatchProgress?.({
          currentFile: i + 1,
          totalFiles: audioSources.length,
          currentFileName: source.name,
          status: 'complete',
          modelStatus: 'ready'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.set(source.id, { error: errorMessage });

        options.onBatchProgress?.({
          currentFile: i + 1,
          totalFiles: audioSources.length,
          currentFileName: source.name,
          status: 'error',
          modelStatus: 'ready'
        });

        if (options.stopOnError) {
          break;
        }
      }
    }

    return results;
  }

  /**
   * Get model status information
   */
  getStatus() {
    return {
      whisper: localWhisperTranscriber.getModelInfo(),
      isReady: localWhisperTranscriber.isReady()
    };
  }

  /**
   * Unload all models to free memory
   */
  unload(): void {
    localWhisperTranscriber.unload();
    this.isInitialized = false;
    console.log('[LocalAudioAnalyzer] All models unloaded');
  }
}

// Singleton instance
export const localAudioAnalyzer = new LocalAudioAnalyzer();

// Named export for direct class usage
export { LocalAudioAnalyzer };
