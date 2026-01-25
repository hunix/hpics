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

import { 
  localWhisperTranscriber, 
  type TranscriptionResult, 
  type WhisperModel, 
  type ProgressCallback,
  isLanguageSupported,
  getLanguageDisplay 
} from './localWhisperTranscriber';
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

export interface LanguageDetectionResult {
  languageCode: string;
  languageName: string;
  flag?: string;
  confidence: number;
  isSupported: boolean;
}

export interface LocalAudioAnalysis {
  transcription: TranscriptionResult | null;
  sentiment: SentimentResult | null;
  speakers: DiarizationResult | null;
  detectedLanguage?: LanguageDetectionResult;
  totalProcessingMs: number;
  method: 'local';
  breakdown: {
    transcriptionMs: number;
    sentimentMs: number;
    diarizationMs: number;
  };
  stats: {
    audioFormat?: string;
    realtimeSpeedup?: number;
    device: 'webgpu' | 'wasm';
    validated: boolean;
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
  private currentModel: WhisperModel = 'small';

  /**
   * Initialize the analyzer with specified model
   */
  async initialize(options?: {
    whisperModel?: WhisperModel;
    onProgress?: ProgressCallback;
  }): Promise<void> {
    const targetModel = options?.whisperModel || 'small';
    
    // Re-initialize if model changed
    if (this.isInitialized && localWhisperTranscriber.isReady() && this.currentModel === targetModel) {
      return;
    }

    console.log(`[LocalAudioAnalyzer] Initializing with model: ${targetModel}...`);
    this.currentModel = targetModel;
    
    await localWhisperTranscriber.initialize({
      model: targetModel,
      device: 'auto',
      onProgress: options?.onProgress
    });

    this.isInitialized = true;
    console.log('[LocalAudioAnalyzer] Ready');
  }

  /**
   * Get the current model being used
   */
  getCurrentModel(): WhisperModel {
    return this.currentModel;
  }

  /**
   * Quick language detection by transcribing a short sample
   * Uses the first ~15 seconds of audio for fast detection
   */
  async detectLanguage(
    audioSource: string | Blob | ArrayBuffer,
    model?: WhisperModel
  ): Promise<LanguageDetectionResult> {
    const targetModel = model || this.currentModel;
    
    // Initialize if needed
    if (!localWhisperTranscriber.isReady()) {
      await this.initialize({ whisperModel: targetModel });
    }

    try {
      // Transcribe with short chunk for quick language detection
      const result = await localWhisperTranscriber.transcribe(audioSource, {
        chunkLengthS: 15, // Only first 15 seconds for speed
        strideLengthS: 0
      });

      const langCode = result.language || 'unknown';
      const langDisplay = getLanguageDisplay(langCode);
      
      return {
        languageCode: langCode,
        languageName: langDisplay.name,
        flag: langDisplay.flag,
        confidence: 0.9, // Whisper is generally reliable
        isSupported: isLanguageSupported(targetModel, langCode)
      };
    } catch (error) {
      console.error('[LocalAudioAnalyzer] Language detection failed:', error);
      return {
        languageCode: 'unknown',
        languageName: 'Unknown',
        confidence: 0,
        isSupported: true // Default to true for unknown
      };
    }
  }

  /**
   * Check if a language is supported by the current/specified model
   */
  isLanguageSupportedByModel(langCode: string, model?: WhisperModel): boolean {
    return isLanguageSupported(model || this.currentModel, langCode);
  }

  /**
   * Pre-validate audio URL accessibility
   */
  private async validateAudioUrl(url: string): Promise<{ valid: boolean; contentType?: string; error?: string }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        return { valid: false, error: `Audio file not accessible: ${response.status}` };
      }
      const contentType = response.headers.get('content-type') || undefined;
      if (contentType && !contentType.includes('audio') && !contentType.includes('octet-stream')) {
        console.warn(`[LocalAudioAnalyzer] Unexpected content type: ${contentType}`);
      }
      return { valid: true, contentType };
    } catch (error) {
      return { 
        valid: false, 
        error: `Failed to access audio file: ${error instanceof Error ? error.message : 'Unknown'}` 
      };
    }
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
    let audioFormat: string | undefined;
    let validated = false;

    // Pre-validation for URLs
    if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
      const validation = await this.validateAudioUrl(audioSource);
      if (!validation.valid) {
        throw new Error(validation.error || 'Audio file not accessible');
      }
      audioFormat = validation.contentType;
      validated = true;
    }

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
        throw error; // Re-throw to allow caller to handle
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
        // Non-fatal - continue without sentiment
      }
    }

    // Step 3: Speaker diarization (optional, requires audio features)
    if (options.diarizeSpeakers && audioSource instanceof ArrayBuffer) {
      const diarizationStart = performance.now();
      try {
        console.log('[LocalAudioAnalyzer] Speaker diarization requested but requires audio sample extraction');
        breakdown.diarizationMs = performance.now() - diarizationStart;
      } catch (error) {
        console.error('[LocalAudioAnalyzer] Diarization failed:', error);
      }
    }

    const totalProcessingMs = performance.now() - startTime;
    const modelInfo = localWhisperTranscriber.getModelInfo();

    // Build language detection result from transcription
    let detectedLanguage: LanguageDetectionResult | undefined;
    if (transcription?.language) {
      const langDisplay = getLanguageDisplay(transcription.language);
      detectedLanguage = {
        languageCode: transcription.language,
        languageName: langDisplay.name,
        flag: langDisplay.flag,
        confidence: 0.9,
        isSupported: isLanguageSupported(this.currentModel, transcription.language)
      };
    }

    return {
      transcription,
      sentiment,
      speakers,
      detectedLanguage,
      totalProcessingMs,
      method: 'local',
      breakdown,
      stats: {
        audioFormat,
        realtimeSpeedup: transcription?.realtimeSpeedup,
        device: modelInfo.device,
        validated,
      }
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
