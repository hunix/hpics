/**
 * GPU Whisper Client
 * 
 * Connects to local GPU-accelerated Whisper server for
 * ultra-fast transcription across multiple GPUs.
 * 
 * Supports:
 * - Faster-Whisper with CTranslate2
 * - WhisperX with speaker diarization
 * - Batch processing across 4x RTX 3090Ti (50-100 files/min)
 */

export interface WhisperBatchConfig {
  endpoint: string;
  model: 'tiny' | 'base' | 'small' | 'medium' | 'large-v3' | 'turbo';
  language?: string;
  diarize?: boolean;
  gpuCount?: number;
  batchSize?: number;
}

export interface WhisperJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  filesProcessed: number;
  totalFiles: number;
  currentFile?: string;
  gpuUtilization?: number[];
  estimatedTimeRemaining?: number;
  results?: WhisperResult[];
  error?: string;
}

export interface WhisperResult {
  fileId: string;
  fileName: string;
  transcription: string;
  language: string;
  languageConfidence: number;
  duration: number;
  processingTime: number;
  gpuIndex: number;
  segments?: WhisperSegment[];
  speakers?: SpeakerSegment[];
}

export interface WhisperSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

const DEFAULT_CONFIG: WhisperBatchConfig = {
  endpoint: 'http://localhost:8000',
  model: 'large-v3',
  language: undefined, // Auto-detect
  diarize: true,
  gpuCount: 4,
  batchSize: 10,
};

export class GPUWhisperClient {
  private config: WhisperBatchConfig;
  private activeJobs: Map<string, WhisperJobStatus> = new Map();

  constructor(config: Partial<WhisperBatchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if the GPU Whisper server is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get GPU cluster status
   */
  async getClusterStatus(): Promise<{
    available: boolean;
    gpus: Array<{
      index: number;
      name: string;
      vramTotal: number;
      vramUsed: number;
      utilization: number;
      temperature: number;
    }>;
    activeJobs: number;
    queuedFiles: number;
  }> {
    try {
      const response = await fetch(`${this.config.endpoint}/status`);
      if (!response.ok) throw new Error('Failed to get status');
      return await response.json();
    } catch {
      return {
        available: false,
        gpus: [],
        activeJobs: 0,
        queuedFiles: 0,
      };
    }
  }

  /**
   * Submit a batch of audio files for transcription
   */
  async submitBatch(
    files: Array<{ id: string; url: string; name: string }>,
    options?: Partial<WhisperBatchConfig>
  ): Promise<string> {
    const config = { ...this.config, ...options };
    
    const response = await fetch(`${config.endpoint}/transcribe/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files,
        model: config.model,
        language: config.language,
        diarize: config.diarize,
        gpuCount: config.gpuCount,
        batchSize: config.batchSize,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Batch submission failed: ${error}`);
    }

    const data = await response.json();
    const jobId = data.jobId as string;
    
    // Track the job
    this.activeJobs.set(jobId, {
      jobId,
      status: 'queued',
      progress: 0,
      filesProcessed: 0,
      totalFiles: files.length,
    });

    return jobId;
  }

  /**
   * Get status of a batch job
   */
  async getJobStatus(jobId: string): Promise<WhisperJobStatus> {
    const response = await fetch(`${this.config.endpoint}/jobs/${jobId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get job status');
    }

    const status = await response.json() as WhisperJobStatus;
    this.activeJobs.set(jobId, status);
    return status;
  }

  /**
   * Cancel a batch job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        this.activeJobs.delete(jobId);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Transcribe a single file (for quick testing)
   */
  async transcribeSingle(
    audioUrl: string,
    options?: Partial<WhisperBatchConfig>
  ): Promise<WhisperResult> {
    const config = { ...this.config, ...options };
    
    const response = await fetch(`${config.endpoint}/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioUrl,
        model: config.model,
        language: config.language,
        diarize: config.diarize,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Stream transcription progress via SSE
   */
  subscribeToJob(
    jobId: string,
    onProgress: (status: WhisperJobStatus) => void,
    onComplete: (results: WhisperResult[]) => void,
    onError: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(`${this.config.endpoint}/jobs/${jobId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WhisperJobStatus;
        this.activeJobs.set(jobId, data);
        
        if (data.status === 'completed' && data.results) {
          onComplete(data.results);
          eventSource.close();
        } else if (data.status === 'failed') {
          onError(new Error(data.error || 'Job failed'));
          eventSource.close();
        } else {
          onProgress(data);
        }
      } catch (e) {
        onError(e instanceof Error ? e : new Error('Parse error'));
      }
    };

    eventSource.onerror = () => {
      onError(new Error('Connection lost'));
      eventSource.close();
    };

    // Return cleanup function
    return () => eventSource.close();
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): WhisperJobStatus[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<WhisperBatchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): WhisperBatchConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const gpuWhisper = new GPUWhisperClient();
