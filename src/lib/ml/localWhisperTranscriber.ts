/**
 * Local Whisper Transcriber - WebGPU Accelerated
 * 
 * Uses @huggingface/transformers with Whisper Large V3 Turbo
 * for 216x real-time transcription speed on WebGPU.
 * 
 * Zero network latency, privacy-preserving, works offline after first load.
 */

import { pipeline, env } from "@huggingface/transformers";

// Configure for browser usage
env.allowLocalModels = false;
env.useBrowserCache = true;

export type WhisperModel = 'turbo' | 'distil' | 'tiny' | 'small';

export interface TranscriptionChunk {
  text: string;
  timestamp: [number, number]; // [start, end] in seconds
}

export interface TranscriptionResult {
  text: string;
  chunks: TranscriptionChunk[];
  language?: string;
  processingTimeMs: number;
  audioDurationMs?: number;
  realtimeSpeedup?: number;
}

export interface WhisperModelInfo {
  modelId: string;
  displayName: string;
  size: string;
  speed: string;
  isLoaded: boolean;
  isLoading: boolean;
  loadProgress: number;
  device: 'webgpu' | 'wasm';
}

export type ProgressCallback = (progress: {
  status: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}) => void;

export interface WhisperModelConfig {
  id: string;
  name: string;
  size: string;
  speed: string;
  supportedLanguages: 'english-only' | 'multilingual';
  languageCodes?: string[]; // Explicit codes for english-only models
}

const MODEL_MAP: Record<WhisperModel, WhisperModelConfig> = {
  turbo: {
    id: "onnx-community/whisper-large-v3-turbo",
    name: "Whisper Large V3 Turbo",
    size: "~800MB",
    speed: "216x real-time",
    supportedLanguages: 'multilingual'
  },
  distil: {
    id: "onnx-community/distil-whisper-large-v3",
    name: "Distil-Whisper Large V3",
    size: "~750MB", 
    speed: "~6x faster than base",
    supportedLanguages: 'multilingual'
  },
  small: {
    id: "onnx-community/whisper-small",
    name: "Whisper Small",
    size: "~250MB",
    speed: "~50x real-time",
    supportedLanguages: 'multilingual'
  },
  tiny: {
    id: "onnx-community/whisper-tiny.en",
    name: "Whisper Tiny (English)",
    size: "~75MB",
    speed: "~100x real-time",
    supportedLanguages: 'english-only',
    languageCodes: ['en']
  }
};

// Language display names mapping (ISO 639-1 codes)
export const LANGUAGE_DISPLAY_MAP: Record<string, { name: string; flag?: string }> = {
  ar: { name: 'Arabic', flag: '🇸🇦' },
  en: { name: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', flag: '🇪🇸' },
  fr: { name: 'French', flag: '🇫🇷' },
  de: { name: 'German', flag: '🇩🇪' },
  it: { name: 'Italian', flag: '🇮🇹' },
  pt: { name: 'Portuguese', flag: '🇧🇷' },
  ru: { name: 'Russian', flag: '🇷🇺' },
  zh: { name: 'Chinese', flag: '🇨🇳' },
  ja: { name: 'Japanese', flag: '🇯🇵' },
  ko: { name: 'Korean', flag: '🇰🇷' },
  hi: { name: 'Hindi', flag: '🇮🇳' },
  tr: { name: 'Turkish', flag: '🇹🇷' },
  nl: { name: 'Dutch', flag: '🇳🇱' },
  pl: { name: 'Polish', flag: '🇵🇱' },
  uk: { name: 'Ukrainian', flag: '🇺🇦' },
  he: { name: 'Hebrew', flag: '🇮🇱' },
  fa: { name: 'Persian', flag: '🇮🇷' },
  ur: { name: 'Urdu', flag: '🇵🇰' },
  id: { name: 'Indonesian', flag: '🇮🇩' },
  th: { name: 'Thai', flag: '🇹🇭' },
  vi: { name: 'Vietnamese', flag: '🇻🇳' },
  unknown: { name: 'Unknown' }
};

/**
 * Check if a language is supported by a given model
 */
export function isLanguageSupported(model: WhisperModel, langCode: string): boolean {
  const config = MODEL_MAP[model];
  if (config.supportedLanguages === 'multilingual') {
    return true;
  }
  // English-only model
  return config.languageCodes?.includes(langCode) ?? false;
}

/**
 * Get model configuration
 */
export function getModelConfig(model: WhisperModel): WhisperModelConfig {
  return MODEL_MAP[model];
}

/**
 * Get language display info
 */
export function getLanguageDisplay(langCode: string): { name: string; flag?: string } {
  return LANGUAGE_DISPLAY_MAP[langCode] || LANGUAGE_DISPLAY_MAP.unknown;
}

class LocalWhisperTranscriber {
  private transcriber: any = null;
  private isLoading = false;
  private loadProgress = 0;
  private currentModel: WhisperModel = 'turbo';
  private currentDevice: 'webgpu' | 'wasm' = 'webgpu';
  private progressCallback: ProgressCallback | null = null;

  /**
   * Check if WebGPU is available in the browser
   */
  async checkWebGPUSupport(): Promise<boolean> {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch {
      return false;
    }
  }

  /**
   * Preprocess audio from ArrayBuffer to Float32Array at 16kHz
   * Required for Opus/WebM formats that Whisper can't decode natively
   */
  private async preprocessArrayBuffer(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    // Yield to UI to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Create AudioContext for decoding (handles Opus, MP3, WAV, AAC, FLAC, etc.)
    const audioContext = new AudioContext();
    
    try {
      // Decode the audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
      
      // Yield to UI again
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const targetSampleRate = 16000; // Whisper requires 16kHz
      let processedBuffer = audioBuffer;
      
      // Resample if needed
      if (audioBuffer.sampleRate !== targetSampleRate) {
        const duration = audioBuffer.duration;
        const offlineCtx = new OfflineAudioContext(
          1, // mono
          Math.ceil(duration * targetSampleRate),
          targetSampleRate
        );
        
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineCtx.destination);
        source.start(0);
        
        processedBuffer = await offlineCtx.startRendering();
      }
      
      // Extract mono Float32Array (channel 0)
      const monoData = processedBuffer.getChannelData(0);
      
      // Return a copy to avoid issues with buffer detachment
      return new Float32Array(monoData);
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Preprocess audio URL to Float32Array at 16kHz
   * Fetches, decodes, and resamples audio for Whisper compatibility
   */
  private async preprocessAudioUrl(url: string): Promise<Float32Array> {
    console.log('[LocalWhisper] Fetching audio from URL...');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    console.log(`[LocalWhisper] Downloaded ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB`);
    
    return this.preprocessArrayBuffer(arrayBuffer);
  }

  /**
   * Initialize the Whisper model with WebGPU acceleration
   */
  async initialize(options?: {
    model?: WhisperModel;
    device?: 'webgpu' | 'wasm' | 'auto';
    onProgress?: ProgressCallback;
  }): Promise<void> {
    if (this.transcriber && this.currentModel === (options?.model || 'turbo')) {
      console.log('[LocalWhisper] Model already loaded');
      return;
    }

    if (this.isLoading) {
      console.log('[LocalWhisper] Model is already loading...');
      return;
    }

    this.isLoading = true;
    this.loadProgress = 0;
    this.progressCallback = options?.onProgress || null;
    this.currentModel = options?.model || 'turbo';

    try {
      // Determine device
      let device: 'webgpu' | 'wasm' = 'wasm';
      if (options?.device === 'auto' || !options?.device) {
        device = await this.checkWebGPUSupport() ? 'webgpu' : 'wasm';
      } else if (options?.device === 'webgpu') {
        const hasWebGPU = await this.checkWebGPUSupport();
        if (!hasWebGPU) {
          console.warn('[LocalWhisper] WebGPU not available, falling back to WASM');
          device = 'wasm';
        } else {
          device = 'webgpu';
        }
      }
      this.currentDevice = device;

      const modelInfo = MODEL_MAP[this.currentModel];
      console.log(`[LocalWhisper] Loading ${modelInfo.name} on ${device}...`);

      this.transcriber = await pipeline(
        "automatic-speech-recognition",
        modelInfo.id,
        {
          device,
          progress_callback: (progressInfo: any) => {
            if (progressInfo.status === 'progress') {
              this.loadProgress = progressInfo.progress || 0;
            }
            this.progressCallback?.(progressInfo);
          }
        }
      );

      this.loadProgress = 100;
      console.log(`[LocalWhisper] ${modelInfo.name} loaded successfully on ${device}`);
    } catch (error) {
      console.error('[LocalWhisper] Failed to load model:', error);
      this.transcriber = null;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Transcribe audio from URL, Blob, or ArrayBuffer
   */
  async transcribe(
    audioSource: string | Blob | ArrayBuffer,
    options?: {
      language?: string;
      task?: 'transcribe' | 'translate';
      chunkLengthS?: number;
      strideLengthS?: number;
    }
  ): Promise<TranscriptionResult> {
    if (!this.transcriber) {
      await this.initialize();
    }

    const startTime = performance.now();

    try {
      // Preprocess audio based on input type
      let audioInput: Float32Array;
      
      if (typeof audioSource === 'string') {
        if (audioSource.startsWith('http')) {
          // URL input - fetch and preprocess
          console.log('[LocalWhisper] Processing audio from URL...');
          audioInput = await this.preprocessAudioUrl(audioSource);
          console.log(`[LocalWhisper] Audio preprocessed: ${audioInput.length} samples at 16kHz`);
        } else {
          throw new Error('Unsupported string audio source - must be a URL starting with http');
        }
      } else if (audioSource instanceof Blob) {
        // Blob input - convert to ArrayBuffer and preprocess
        console.log('[LocalWhisper] Processing audio from Blob...');
        const arrayBuffer = await audioSource.arrayBuffer();
        audioInput = await this.preprocessArrayBuffer(arrayBuffer);
        console.log(`[LocalWhisper] Audio preprocessed: ${audioInput.length} samples at 16kHz`);
      } else if (audioSource instanceof ArrayBuffer) {
        // ArrayBuffer input - preprocess directly
        console.log('[LocalWhisper] Processing audio from ArrayBuffer...');
        audioInput = await this.preprocessArrayBuffer(audioSource);
        console.log(`[LocalWhisper] Audio preprocessed: ${audioInput.length} samples at 16kHz`);
      } else {
        throw new Error('Unsupported audio source type');
      }
      
      // Calculate audio duration from sample count (16kHz)
      const audioDurationMs = (audioInput.length / 16000) * 1000;

      const result = await this.transcriber(audioInput, {
        return_timestamps: true,
        chunk_length_s: options?.chunkLengthS || 30,
        stride_length_s: options?.strideLengthS || 5,
        language: options?.language,
        task: options?.task || 'transcribe'
      });

      const processingTimeMs = performance.now() - startTime;

      // Parse chunks with timestamps
      const chunks: TranscriptionChunk[] = (result.chunks || []).map((chunk: any) => ({
        text: chunk.text?.trim() || '',
        timestamp: chunk.timestamp || [0, 0]
      }));

      // Calculate realtime speedup
      const realtimeSpeedup = audioDurationMs > 0 ? audioDurationMs / processingTimeMs : undefined;

      console.log(`[LocalWhisper] Transcribed in ${processingTimeMs.toFixed(0)}ms (${realtimeSpeedup?.toFixed(1)}x realtime)`);

      return {
        text: result.text?.trim() || '',
        chunks,
        language: result.language,
        processingTimeMs,
        audioDurationMs,
        realtimeSpeedup
      };
    } catch (error) {
      console.error('[LocalWhisper] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Get current model info
   */
  getModelInfo(): WhisperModelInfo {
    const modelConfig = MODEL_MAP[this.currentModel];
    return {
      modelId: modelConfig.id,
      displayName: modelConfig.name,
      size: modelConfig.size,
      speed: modelConfig.speed,
      isLoaded: !!this.transcriber,
      isLoading: this.isLoading,
      loadProgress: this.loadProgress,
      device: this.currentDevice
    };
  }

  /**
   * Unload the model to free memory
   */
  unload(): void {
    this.transcriber = null;
    this.loadProgress = 0;
    console.log('[LocalWhisper] Model unloaded');
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return !!this.transcriber && !this.isLoading;
  }
}

// Singleton instance
export const localWhisperTranscriber = new LocalWhisperTranscriber();

// Named export for direct class usage
export { LocalWhisperTranscriber };
