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

const MODEL_MAP: Record<WhisperModel, { id: string; name: string; size: string; speed: string }> = {
  turbo: {
    id: "onnx-community/whisper-large-v3-turbo",
    name: "Whisper Large V3 Turbo",
    size: "~800MB",
    speed: "216x real-time"
  },
  distil: {
    id: "distil-whisper/distil-large-v3",
    name: "Distil-Whisper Large V3",
    size: "~750MB", 
    speed: "~6x faster than base"
  },
  small: {
    id: "onnx-community/whisper-small",
    name: "Whisper Small",
    size: "~250MB",
    speed: "~50x real-time"
  },
  tiny: {
    id: "onnx-community/whisper-tiny.en",
    name: "Whisper Tiny (English)",
    size: "~75MB",
    speed: "~100x real-time"
  }
};

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
      // Handle different input types
      let audioInput = audioSource;
      
      if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
        // For URLs, fetch the audio first if needed
        console.log('[LocalWhisper] Processing audio from URL...');
      }

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

      // Calculate realtime speedup if we have duration info
      let realtimeSpeedup: number | undefined;
      if (chunks.length > 0) {
        const lastChunk = chunks[chunks.length - 1];
        const audioDurationMs = (lastChunk.timestamp[1] || 0) * 1000;
        if (audioDurationMs > 0) {
          realtimeSpeedup = audioDurationMs / processingTimeMs;
        }
      }

      console.log(`[LocalWhisper] Transcribed in ${processingTimeMs.toFixed(0)}ms (${realtimeSpeedup?.toFixed(1)}x realtime)`);

      return {
        text: result.text?.trim() || '',
        chunks,
        language: result.language,
        processingTimeMs,
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
