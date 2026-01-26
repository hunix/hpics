/**
 * Local Whisper Transcriber - WebGPU Accelerated
 * 
 * Uses @huggingface/transformers with Whisper Large V3 Turbo
 * for 216x real-time transcription speed on WebGPU.
 * 
 * Zero network latency, privacy-preserving, works offline after first load.
 * Includes robust Opus/OGG decoding fallback for WhatsApp voice notes.
 */

import { pipeline, env } from "@huggingface/transformers";
import { OggOpusDecoder } from "ogg-opus-decoder";

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

// ============= Audio Format Detection =============

interface AudioDiagnostics {
  contentType: string | null;
  size: number;
  signature: string;
  isOggOpus: boolean;
  isHtml: boolean;
}

function detectAudioFormat(arrayBuffer: ArrayBuffer, contentType: string | null): AudioDiagnostics {
  const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
  
  // Build signature string from first 4 bytes
  const signatureBytes = Array.from(bytes.slice(0, 4));
  const signature = signatureBytes.map(b => String.fromCharCode(b)).join('');
  
  // Detect OGG container (signature "OggS")
  const isOggOpus = signature === 'OggS' || 
    contentType?.includes('audio/ogg') === true || 
    contentType?.includes('audio/opus') === true;
  
  // Detect HTML response (common with expired signed URLs)
  const isHtml = signature.startsWith('<!DO') || 
    signature.startsWith('<htm') || 
    signature.startsWith('<HTM') ||
    contentType?.includes('text/html') === true;
  
  return {
    contentType,
    size: arrayBuffer.byteLength,
    signature,
    isOggOpus,
    isHtml
  };
}

// ============= Pure JS Resampler =============

/**
 * Resample audio to 16kHz using linear interpolation
 * Fast enough for Whisper input quality requirements
 */
function resampleTo16kHz(samples: Float32Array, originalSampleRate: number): Float32Array {
  const targetSampleRate = 16000;
  
  if (originalSampleRate === targetSampleRate) {
    return samples;
  }
  
  const ratio = originalSampleRate / targetSampleRate;
  const outputLength = Math.ceil(samples.length / ratio);
  const output = new Float32Array(outputLength);
  
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
    const t = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    output[i] = samples[srcIndexFloor] * (1 - t) + samples[srcIndexCeil] * t;
  }
  
  return output;
}

/**
 * Mix stereo/multi-channel to mono
 */
function mixToMono(channelData: Float32Array[], numChannels: number): Float32Array {
  if (numChannels === 1) {
    return channelData[0];
  }
  
  const length = channelData[0].length;
  const mono = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) {
      sum += channelData[ch][i];
    }
    mono[i] = sum / numChannels;
  }
  
  return mono;
}

// ============= Timeout Utilities =============

const DECODE_TIMEOUT_MS = 10000; // 10 seconds for decoding

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

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
  private opusDecoder: OggOpusDecoder | null = null;

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
   * Decode OGG/Opus using WASM decoder (fallback for Chrome's broken decodeAudioData)
   */
  private async decodeOpusWithWasm(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    console.log('[LocalWhisper] Using WASM Opus decoder...');
    
    // Lazy-initialize decoder
    if (!this.opusDecoder) {
      this.opusDecoder = new OggOpusDecoder();
      await this.opusDecoder.ready;
    }
    
    // Decode - returns { channelData: Float32Array[], samplesDecoded: number, sampleRate: number }
    const decoded = await this.opusDecoder.decode(new Uint8Array(arrayBuffer));
    
    console.log(`[LocalWhisper] Opus decoded: ${decoded.samplesDecoded} samples @ ${decoded.sampleRate}Hz, ${decoded.channelData.length} channels`);
    
    // Mix to mono
    const mono = mixToMono(decoded.channelData, decoded.channelData.length);
    
    // Resample to 16kHz using pure JS (no OfflineAudioContext)
    const resampled = resampleTo16kHz(mono, decoded.sampleRate);
    
    console.log(`[LocalWhisper] Resampled to ${resampled.length} samples @ 16kHz`);
    
    return resampled;
  }

  /**
   * Decode audio using native AudioContext (for MP3, WAV, M4A, etc.)
   */
  private async decodeWithAudioContext(arrayBuffer: ArrayBuffer): Promise<Float32Array> {
    console.log('[LocalWhisper] Using native AudioContext decoder...');
    
    const audioContext = new AudioContext();
    
    try {
      // Decode with timeout to prevent hanging
      const audioBuffer = await withTimeout(
        audioContext.decodeAudioData(arrayBuffer.slice(0)),
        DECODE_TIMEOUT_MS,
        'AudioContext.decodeAudioData'
      );
      
      console.log(`[LocalWhisper] Native decoded: ${audioBuffer.length} samples @ ${audioBuffer.sampleRate}Hz`);
      
      // Extract mono from first channel
      const mono = audioBuffer.getChannelData(0);
      
      // Resample to 16kHz
      const targetSampleRate = 16000;
      if (audioBuffer.sampleRate !== targetSampleRate) {
        const resampled = resampleTo16kHz(mono, audioBuffer.sampleRate);
        console.log(`[LocalWhisper] Resampled to ${resampled.length} samples @ 16kHz`);
        return resampled;
      }
      
      return new Float32Array(mono);
    } finally {
      await audioContext.close();
    }
  }

  /**
   * Preprocess audio from ArrayBuffer to Float32Array at 16kHz
   * Uses WASM decoder for OGG/Opus, native AudioContext for others
   */
  private async preprocessArrayBuffer(
    arrayBuffer: ArrayBuffer, 
    contentType: string | null = null
  ): Promise<Float32Array> {
    // Yield to UI to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Detect format
    const diagnostics = detectAudioFormat(arrayBuffer, contentType);
    console.log(`[LocalWhisper] Audio diagnostics: ${JSON.stringify({
      contentType: diagnostics.contentType,
      size: diagnostics.size,
      signature: diagnostics.signature,
      isOggOpus: diagnostics.isOggOpus,
      isHtml: diagnostics.isHtml
    })}`);
    
    // Early fail for HTML responses (expired signed URLs, auth failures)
    if (diagnostics.isHtml) {
      throw new Error('Audio not accessible - received HTML instead of audio data (URL may have expired)');
    }
    
    // Early fail for tiny responses
    if (diagnostics.size < 100) {
      throw new Error(`Audio file too small (${diagnostics.size} bytes) - likely empty or invalid`);
    }
    
    // Use WASM decoder for OGG/Opus (Chrome's decodeAudioData often fails on these)
    if (diagnostics.isOggOpus) {
      try {
        return await this.decodeOpusWithWasm(arrayBuffer);
      } catch (opusError) {
        console.warn('[LocalWhisper] WASM Opus decode failed, trying native fallback:', opusError);
        // Fall through to native decoder as last resort
      }
    }
    
    // Use native AudioContext for other formats (MP3, WAV, M4A, FLAC, etc.)
    try {
      return await this.decodeWithAudioContext(arrayBuffer);
    } catch (nativeError) {
      // If native decode fails AND it looked like Opus, try WASM as fallback
      if (!diagnostics.isOggOpus) {
        console.warn('[LocalWhisper] Native decode failed, trying WASM Opus decoder:', nativeError);
        try {
          return await this.decodeOpusWithWasm(arrayBuffer);
        } catch (wasmError) {
          // Both failed - throw original error
          throw nativeError;
        }
      }
      throw nativeError;
    }
  }

  /**
   * Preprocess audio URL to Float32Array at 16kHz
   * Fetches, detects format, decodes, and resamples audio for Whisper compatibility
   */
  private async preprocessAudioUrl(url: string): Promise<Float32Array> {
    console.log('[LocalWhisper] Fetching audio from URL...');
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    const arrayBuffer = await response.arrayBuffer();
    
    console.log(`[LocalWhisper] Downloaded ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB, content-type: ${contentType}`);
    
    return this.preprocessArrayBuffer(arrayBuffer, contentType);
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
        audioInput = await this.preprocessArrayBuffer(arrayBuffer, audioSource.type || null);
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
   * Test if we can decode a specific audio format (for capability probing)
   */
  async testDecode(audioSource: string | ArrayBuffer, contentType?: string): Promise<boolean> {
    try {
      let arrayBuffer: ArrayBuffer;
      let cType: string | null = contentType || null;
      
      if (typeof audioSource === 'string') {
        const response = await fetch(audioSource);
        if (!response.ok) return false;
        cType = response.headers.get('content-type');
        arrayBuffer = await response.arrayBuffer();
      } else {
        arrayBuffer = audioSource;
      }
      
      // Try preprocessing with a short timeout
      await withTimeout(
        this.preprocessArrayBuffer(arrayBuffer, cType),
        5000,
        'Test decode'
      );
      
      return true;
    } catch (error) {
      console.warn('[LocalWhisper] Test decode failed:', error);
      return false;
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
    
    // Clean up Opus decoder
    if (this.opusDecoder) {
      this.opusDecoder.free();
      this.opusDecoder = null;
    }
    
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
