/**
 * Local AI Manager
 * 
 * Central orchestrator for all local GPU-powered AI services.
 * Manages connections, health checks, and routing between:
 * - Local LLM (Ollama/vLLM)
 * - GPU Whisper (Faster-Whisper/WhisperX)
 * - GPU Vector Store (Faiss)
 * - Video Analytics (YOLO/DeepFace)
 */

import { LocalLLMClient, LocalLLMConfig } from './localLLMClient';
import { GPUWhisperClient, WhisperBatchConfig } from './gpuWhisperClient';
import { GPUVectorStore } from './gpuVectorStore';
import { VideoAnalyticsClient, VideoAnalyticsConfig } from './videoAnalytics';

export interface GPUInfo {
  index: number;
  name: string;
  vramTotal: number;
  vramUsed: number;
  utilization: number;
  temperature: number;
  powerDraw?: number;
}

export interface LocalAIStatus {
  llm: {
    available: boolean;
    endpoint: string;
    models: string[];
    currentModel?: string;
  };
  whisper: {
    available: boolean;
    endpoint: string;
    activeJobs: number;
    queuedFiles: number;
  };
  vectorStore: {
    available: boolean;
    endpoint: string;
    indexes: string[];
    totalVectors: number;
  };
  videoAnalytics: {
    available: boolean;
    endpoint: string;
    activeStreams: number;
    modelsLoaded: string[];
  };
}

export interface GPUClusterStatus {
  available: boolean;
  totalVramGb: number;
  usedVramGb: number;
  gpus: GPUInfo[];
  overallUtilization: number;
}

export interface LocalAIConfig {
  llm: Partial<LocalLLMConfig>;
  whisper: Partial<WhisperBatchConfig>;
  vectorStoreEndpoint: string;
  videoAnalytics: Partial<VideoAnalyticsConfig>;
  healthCheckInterval: number;
  autoReconnect: boolean;
}

const DEFAULT_CONFIG: LocalAIConfig = {
  llm: { endpoint: 'http://localhost:11434' },
  whisper: { endpoint: 'http://localhost:8000' },
  vectorStoreEndpoint: 'http://localhost:8001',
  videoAnalytics: { endpoint: 'http://localhost:8002' },
  healthCheckInterval: 30000, // 30 seconds
  autoReconnect: true,
};

// Storage key for persisting config
const CONFIG_STORAGE_KEY = 'hpics_local_ai_config';

export class LocalAIManager {
  private config: LocalAIConfig;
  private llmClient: LocalLLMClient;
  private whisperClient: GPUWhisperClient;
  private vectorStore: GPUVectorStore;
  private videoClient: VideoAnalyticsClient;
  private healthCheckTimer: ReturnType<typeof setInterval> | null = null;
  private statusListeners: Set<(status: LocalAIStatus) => void> = new Set();
  private lastStatus: LocalAIStatus | null = null;

  constructor(config: Partial<LocalAIConfig> = {}) {
    // Load saved config from localStorage if available
    const savedConfig = this.loadSavedConfig();
    this.config = { ...DEFAULT_CONFIG, ...savedConfig, ...config };

    // Initialize clients
    this.llmClient = new LocalLLMClient(this.config.llm);
    this.whisperClient = new GPUWhisperClient(this.config.whisper);
    this.vectorStore = new GPUVectorStore(this.config.vectorStoreEndpoint);
    this.videoClient = new VideoAnalyticsClient(this.config.videoAnalytics);
  }

  /**
   * Load config from localStorage
   */
  private loadSavedConfig(): Partial<LocalAIConfig> {
    try {
      const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      console.warn('[LocalAI] Failed to load saved config');
    }
    return {};
  }

  /**
   * Save config to localStorage
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      console.warn('[LocalAI] Failed to save config');
    }
  }

  /**
   * Start health check polling
   */
  startHealthChecks(): void {
    if (this.healthCheckTimer) return;

    // Initial check
    this.checkAllServices();

    // Periodic checks
    this.healthCheckTimer = setInterval(() => {
      this.checkAllServices();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health check polling
   */
  stopHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Check all service availability
   */
  async checkAllServices(): Promise<LocalAIStatus> {
    const [llmAvailable, whisperStatus, vectorIndexes, videoStatus] = await Promise.all([
      this.llmClient.isAvailable(),
      this.whisperClient.getClusterStatus().catch(() => ({ available: false, activeJobs: 0, queuedFiles: 0 })),
      this.vectorStore.listIndexes().catch(() => []),
      this.videoClient.getGPUStatus().catch(() => ({ available: false, activeStreams: 0, modelsLoaded: [] })),
    ]);

    const models = llmAvailable ? await this.llmClient.listModels() : [];

    const status: LocalAIStatus = {
      llm: {
        available: llmAvailable,
        endpoint: this.config.llm.endpoint || 'http://localhost:11434',
        models,
        currentModel: this.config.llm.model,
      },
      whisper: {
        available: whisperStatus.available,
        endpoint: this.config.whisper.endpoint || 'http://localhost:8000',
        activeJobs: whisperStatus.activeJobs,
        queuedFiles: whisperStatus.queuedFiles,
      },
      vectorStore: {
        available: vectorIndexes.length > 0 || await this.vectorStore.isAvailable(),
        endpoint: this.config.vectorStoreEndpoint,
        indexes: vectorIndexes.map(i => i.name),
        totalVectors: vectorIndexes.map(i => i.vectorCount).reduce((a, b) => a + b, 0),
      },
      videoAnalytics: {
        available: videoStatus.available,
        endpoint: this.config.videoAnalytics.endpoint || 'http://localhost:8002',
        activeStreams: videoStatus.activeStreams,
        modelsLoaded: videoStatus.modelsLoaded,
      },
    };

    this.lastStatus = status;
    this.notifyListeners(status);
    return status;
  }

  /**
   * Get GPU cluster status (aggregated from all services)
   */
  async getGPUClusterStatus(): Promise<GPUClusterStatus> {
    const [whisperGPUs, videoGPUs] = await Promise.all([
      this.whisperClient.getClusterStatus().catch(() => ({ gpus: [] })),
      this.videoClient.getGPUStatus().catch(() => ({ gpus: [] })),
    ]);

    // Merge GPU info from different services (they may report the same GPUs)
    const gpuMap = new Map<number, GPUInfo>();
    
    for (const gpu of [...whisperGPUs.gpus, ...videoGPUs.gpus]) {
      if (!gpuMap.has(gpu.index)) {
        gpuMap.set(gpu.index, {
          index: gpu.index,
          name: gpu.name,
          vramTotal: gpu.vramTotal,
          vramUsed: gpu.vramUsed,
          utilization: gpu.utilization,
          temperature: gpu.temperature,
        });
      }
    }

    const gpus = Array.from(gpuMap.values()).sort((a, b) => a.index - b.index);
    const totalVram = gpus.reduce((sum, g) => sum + g.vramTotal, 0);
    const usedVram = gpus.reduce((sum, g) => sum + g.vramUsed, 0);
    const avgUtilization = gpus.length > 0 
      ? gpus.reduce((sum, g) => sum + g.utilization, 0) / gpus.length 
      : 0;

    return {
      available: gpus.length > 0,
      totalVramGb: totalVram / 1024, // Assuming MB input
      usedVramGb: usedVram / 1024,
      gpus,
      overallUtilization: avgUtilization,
    };
  }

  /**
   * Update service endpoints
   */
  updateConfig(config: Partial<LocalAIConfig>): void {
    this.config = { ...this.config, ...config };

    // Update clients
    if (config.llm) {
      this.llmClient.setConfig(config.llm);
    }
    if (config.whisper) {
      this.whisperClient.setConfig(config.whisper);
    }
    if (config.vectorStoreEndpoint) {
      this.vectorStore.setEndpoint(config.vectorStoreEndpoint);
    }
    if (config.videoAnalytics) {
      this.videoClient.setConfig(config.videoAnalytics);
    }

    // Save to localStorage
    this.saveConfig();

    // Trigger health check
    this.checkAllServices();
  }

  /**
   * Get current config
   */
  getConfig(): LocalAIConfig {
    return { ...this.config };
  }

  /**
   * Subscribe to status updates
   */
  onStatusChange(listener: (status: LocalAIStatus) => void): () => void {
    this.statusListeners.add(listener);

    // Send last known status immediately
    if (this.lastStatus) {
      listener(this.lastStatus);
    }

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners(status: LocalAIStatus): void {
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (e) {
        console.error('[LocalAI] Status listener error:', e);
      }
    }
  }

  /**
   * Get individual clients for direct access
   */
  get llm(): LocalLLMClient {
    return this.llmClient;
  }

  get whisper(): GPUWhisperClient {
    return this.whisperClient;
  }

  get vectors(): GPUVectorStore {
    return this.vectorStore;
  }

  get video(): VideoAnalyticsClient {
    return this.videoClient;
  }

  /**
   * Get last known status without making network calls
   */
  getLastStatus(): LocalAIStatus | null {
    return this.lastStatus;
  }

  /**
   * Check if any local AI service is available
   */
  isAnyServiceAvailable(): boolean {
    if (!this.lastStatus) return false;
    return (
      this.lastStatus.llm.available ||
      this.lastStatus.whisper.available ||
      this.lastStatus.vectorStore.available ||
      this.lastStatus.videoAnalytics.available
    );
  }
}

// Singleton instance
export const localAI = new LocalAIManager();

// Auto-start health checks when imported
if (typeof window !== 'undefined') {
  // Only in browser environment
  localAI.startHealthChecks();
}
