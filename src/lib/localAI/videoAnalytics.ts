/**
 * Video Analytics Client
 * 
 * GPU-accelerated real-time video analysis using:
 * - YOLO for object detection
 * - DeepFace for face recognition
 * - ByteTrack for multi-object tracking
 * 
 * Optimized for RTX Titan + 3090Ti cluster (30+ FPS)
 */

export interface DetectedFace {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks?: { x: number; y: number; name: string }[];
  embedding?: number[];
  matchedProfileId?: string;
  matchConfidence?: number;
  age?: number;
  gender?: string;
  emotion?: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  trackId?: string;
}

export interface MovementTrack {
  trackId: string;
  objectType: 'person' | 'vehicle' | 'unknown';
  positions: Array<{
    timestamp: number;
    x: number;
    y: number;
    confidence: number;
  }>;
  velocity?: { x: number; y: number };
  direction?: number;
  isActive: boolean;
}

export interface VideoIntelligence {
  frameNumber: number;
  timestamp: number;
  faces: DetectedFace[];
  objects: DetectedObject[];
  movements: MovementTrack[];
  anomalies: Anomaly[];
  sceneDescription?: string;
  ocrText?: string[];
}

export interface Anomaly {
  type: 'intrusion' | 'loitering' | 'crowd' | 'fight' | 'fall' | 'abandoned_object' | 'unknown';
  confidence: number;
  location: { x: number; y: number };
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface VideoAnalyticsConfig {
  endpoint: string;
  detectFaces: boolean;
  detectObjects: boolean;
  trackMovement: boolean;
  detectAnomalies: boolean;
  extractAudio: boolean;
  performOCR: boolean;
  faceMatchThreshold: number;
  objectConfidenceThreshold: number;
  gpuIndex?: number;
}

const DEFAULT_CONFIG: VideoAnalyticsConfig = {
  endpoint: 'http://localhost:8002',
  detectFaces: true,
  detectObjects: true,
  trackMovement: true,
  detectAnomalies: true,
  extractAudio: false,
  performOCR: false,
  faceMatchThreshold: 0.6,
  objectConfidenceThreshold: 0.5,
  gpuIndex: 0,
};

export class VideoAnalyticsClient {
  private config: VideoAnalyticsConfig;
  private activeStreams: Map<string, EventSource> = new Map();

  constructor(config: Partial<VideoAnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if the video analytics server is available
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
   * Get GPU status for video processing
   */
  async getGPUStatus(): Promise<{
    available: boolean;
    gpus: Array<{
      index: number;
      name: string;
      utilization: number;
      vramUsed: number;
      vramTotal: number;
      temperature: number;
    }>;
    activeStreams: number;
    modelsLoaded: string[];
  }> {
    try {
      const response = await fetch(`${this.config.endpoint}/status`);
      if (!response.ok) throw new Error('Failed to get status');
      return await response.json();
    } catch {
      return {
        available: false,
        gpus: [],
        activeStreams: 0,
        modelsLoaded: [],
      };
    }
  }

  /**
   * Analyze a single video file
   */
  async analyzeVideo(
    videoUrl: string,
    options?: Partial<VideoAnalyticsConfig>
  ): Promise<{
    duration: number;
    frameCount: number;
    fps: number;
    intelligence: VideoIntelligence[];
    summary: {
      uniqueFaces: number;
      objectCounts: Record<string, number>;
      anomalyCount: number;
      movementPatterns: string[];
    };
  }> {
    const config = { ...this.config, ...options };

    const response = await fetch(`${config.endpoint}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        ...config,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Video analysis failed: ${error}`);
    }

    return await response.json();
  }

  /**
   * Start real-time stream analysis
   */
  startStreamAnalysis(
    streamUrl: string,
    onFrame: (intelligence: VideoIntelligence) => void,
    onError: (error: Error) => void,
    options?: Partial<VideoAnalyticsConfig>
  ): string {
    const streamId = crypto.randomUUID();
    const config = { ...this.config, ...options };

    // Start the stream on the server
    fetch(`${config.endpoint}/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        streamId,
        streamUrl,
        ...config,
      }),
    }).catch(onError);

    // Connect to SSE for real-time updates
    const eventSource = new EventSource(
      `${config.endpoint}/streams/${streamId}/events`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as VideoIntelligence;
        onFrame(data);
      } catch (e) {
        onError(e instanceof Error ? e : new Error('Parse error'));
      }
    };

    eventSource.onerror = () => {
      onError(new Error('Stream connection lost'));
    };

    this.activeStreams.set(streamId, eventSource);
    return streamId;
  }

  /**
   * Stop a stream analysis
   */
  async stopStreamAnalysis(streamId: string): Promise<void> {
    const eventSource = this.activeStreams.get(streamId);
    if (eventSource) {
      eventSource.close();
      this.activeStreams.delete(streamId);
    }

    await fetch(`${this.config.endpoint}/streams/${streamId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Register a face for recognition
   */
  async registerFace(
    profileId: string,
    faceImages: string[] // Base64 or URLs
  ): Promise<{ success: boolean; embeddingsAdded: number }> {
    const response = await fetch(`${this.config.endpoint}/faces/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        images: faceImages,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to register face');
    }

    return await response.json();
  }

  /**
   * Search for a face in the database
   */
  async searchFace(
    faceImage: string,
    threshold?: number
  ): Promise<Array<{ profileId: string; similarity: number }>> {
    const response = await fetch(`${this.config.endpoint}/faces/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: faceImage,
        threshold: threshold || this.config.faceMatchThreshold,
      }),
    });

    if (!response.ok) {
      throw new Error('Face search failed');
    }

    return await response.json();
  }

  /**
   * Extract frames from video at specific timestamps
   */
  async extractFrames(
    videoUrl: string,
    timestamps: number[] // In seconds
  ): Promise<string[]> {
    const response = await fetch(`${this.config.endpoint}/frames/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoUrl,
        timestamps,
      }),
    });

    if (!response.ok) {
      throw new Error('Frame extraction failed');
    }

    const data = await response.json();
    return data.frames; // Base64 encoded images
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    for (const [streamId, eventSource] of this.activeStreams) {
      eventSource.close();
      fetch(`${this.config.endpoint}/streams/${streamId}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
    this.activeStreams.clear();
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<VideoAnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): VideoAnalyticsConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const videoAnalytics = new VideoAnalyticsClient();
