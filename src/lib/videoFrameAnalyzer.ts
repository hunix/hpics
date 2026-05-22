/**
 * Video Frame Analyzer
 * 
 * Analyzes recorded videos to extract faces and build profiles:
 * - Extract frames at configurable intervals
 * - Detect and track faces across frames
 * - Build identity clusters from appearances
 * - Support offline processing
 */

import { offlineMLService, EnhancedFaceDetection } from './offlineMLService';
import { estimateHeadPose, HeadPose } from './headPoseEstimation';

export interface VideoAnalysisOptions {
  targetFPS?: number;        // Target frames per second to analyze (default: 2)
  maxFrames?: number;        // Maximum frames to process (default: 300)
  minConfidence?: number;    // Minimum face detection confidence (default: 0.5)
  sceneChangeDetection?: boolean; // Extract on scene changes (default: true)
  trackFaces?: boolean;      // Track faces across frames (default: true)
}

export interface ExtractedFrame {
  timestamp: number;         // Time in video (seconds)
  frameNumber: number;
  imageData: ImageData;
  canvas: HTMLCanvasElement;
}

export interface DetectedFaceInFrame {
  frameTimestamp: number;
  detection: EnhancedFaceDetection;
  headPose?: HeadPose;
  quality: number;
  trackId?: string;          // Same face across frames
}

export interface FaceCluster {
  id: string;
  faces: DetectedFaceInFrame[];
  representativeDescriptor: Float32Array;
  bestFrame: DetectedFaceInFrame;
  averageAge?: number;
  gender?: string;
  frameCount: number;
  firstSeen: number;         // First timestamp
  lastSeen: number;          // Last timestamp
  matchedProfileId?: string; // If matched to existing profile
  matchConfidence?: number;
}

export interface VideoAnalysisResult {
  totalFrames: number;
  processedFrames: number;
  uniqueFaces: number;
  clusters: FaceCluster[];
  processingTimeMs: number;
  error?: string;
}

/**
 * Extract key frames from a video file
 */
export async function extractKeyFrames(
  videoFile: File | Blob | string,
  options: VideoAnalysisOptions = {},
  onProgress?: (progress: number) => void
): Promise<ExtractedFrame[]> {
  const {
    targetFPS = 2,
    maxFrames = 300,
  } = options;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;

    const frames: ExtractedFrame[] = [];
    const lastExtractedTime = -1;
    const frameInterval = 1 / targetFPS;

    const handleLoadedMetadata = () => {
      const duration = video.duration;
      const totalExpectedFrames = Math.min(
        Math.floor(duration * targetFPS),
        maxFrames
      );

      let currentTime = 0;
      let frameNumber = 0;

      const extractNextFrame = () => {
        if (currentTime >= duration || frameNumber >= maxFrames) {
          cleanup();
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      const handleSeeked = () => {
        // Create canvas for this frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          
          try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            frames.push({
              timestamp: currentTime,
              frameNumber,
              imageData,
              canvas,
            });
          } catch (e) {
            console.warn('[VideoAnalyzer] Failed to extract frame:', e);
          }
        }

        frameNumber++;
        currentTime += frameInterval;
        
        // Report progress
        onProgress?.(Math.min(1, frames.length / totalExpectedFrames));

        // Extract next frame
        requestAnimationFrame(extractNextFrame);
      };

      video.addEventListener('seeked', handleSeeked);
      extractNextFrame();
    };

    const handleError = (e: Event) => {
      cleanup();
      reject(new Error('Failed to load video'));
    };

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
      if (typeof videoFile === 'string') {
        // URL - nothing to revoke
      } else {
        URL.revokeObjectURL(video.src);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    // Set source
    if (typeof videoFile === 'string') {
      video.src = videoFile;
    } else {
      video.src = URL.createObjectURL(videoFile);
    }
  });
}

/**
 * Analyze a single frame for faces
 */
export async function analyzeFrame(
  frame: ExtractedFrame
): Promise<DetectedFaceInFrame[]> {
  const detections = await offlineMLService.detectFacesEnhanced(frame.canvas, {
    withDescriptors: true,
    withAgeGender: true,
    withExpressions: true,
    withHeadPose: true,
  });

  return detections.map(d => {
    const quality = offlineMLService.calculateQualityScore(
      d,
      frame.canvas.width,
      frame.canvas.height
    );

    return {
      frameTimestamp: frame.timestamp,
      detection: d,
      headPose: d.headPose ? {
        yaw: d.headPose.yaw,
        pitch: d.headPose.pitch,
        roll: d.headPose.roll,
        confidence: quality.overall,
      } : undefined,
      quality: quality.overall,
    };
  });
}

/**
 * Track faces across frames and cluster by identity
 */
export function clusterFaces(
  allFaces: DetectedFaceInFrame[],
  threshold: number = 0.5
): FaceCluster[] {
  const clusters: FaceCluster[] = [];
  
  for (const face of allFaces) {
    if (!face.detection.descriptor) continue;

    // Find best matching cluster
    let bestCluster: FaceCluster | null = null;
    let bestDistance = Infinity;

    for (const cluster of clusters) {
      const distance = offlineMLService.compareDescriptors(
        face.detection.descriptor,
        cluster.representativeDescriptor
      );

      if (distance < bestDistance && distance < threshold) {
        bestDistance = distance;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      bestCluster.faces.push(face);
      bestCluster.lastSeen = face.frameTimestamp;
      bestCluster.frameCount++;

      // Update best frame if this one is higher quality
      if (face.quality > bestCluster.bestFrame.quality) {
        bestCluster.bestFrame = face;
      }

      // Update representative descriptor (running average)
      const n = bestCluster.faces.length;
      const newDescriptor = new Float32Array(bestCluster.representativeDescriptor.length);
      for (let i = 0; i < newDescriptor.length; i++) {
        newDescriptor[i] = (bestCluster.representativeDescriptor[i] * (n - 1) + face.detection.descriptor[i]) / n;
      }
      bestCluster.representativeDescriptor = newDescriptor;
    } else {
      // Create new cluster
      clusters.push({
        id: crypto.randomUUID(),
        faces: [face],
        representativeDescriptor: face.detection.descriptor,
        bestFrame: face,
        averageAge: face.detection.age,
        gender: face.detection.gender,
        frameCount: 1,
        firstSeen: face.frameTimestamp,
        lastSeen: face.frameTimestamp,
      });
    }
  }

  // Calculate average age/gender for each cluster
  for (const cluster of clusters) {
    const ages = cluster.faces
      .filter(f => f.detection.age !== undefined)
      .map(f => f.detection.age!);
    
    if (ages.length > 0) {
      cluster.averageAge = Math.round(ages.reduce((a, b) => a + b, 0) / ages.length);
    }

    const genders = cluster.faces
      .filter(f => f.detection.gender !== undefined)
      .map(f => f.detection.gender!);
    
    if (genders.length > 0) {
      const maleCount = genders.filter(g => g === 'male').length;
      cluster.gender = maleCount > genders.length / 2 ? 'male' : 'female';
    }
  }

  return clusters;
}

/**
 * Full video analysis pipeline
 */
export async function analyzeVideo(
  videoFile: File | Blob | string,
  options: VideoAnalysisOptions = {},
  onProgress?: (stage: string, progress: number) => void
): Promise<VideoAnalysisResult> {
  const startTime = performance.now();
  
  try {
    // Ensure models are loaded
    onProgress?.('Loading models', 0);
    await offlineMLService.loadFaceApiModels();

    // Extract frames
    onProgress?.('Extracting frames', 0);
    const frames = await extractKeyFrames(
      videoFile,
      options,
      (p) => onProgress?.('Extracting frames', p)
    );

    if (frames.length === 0) {
      return {
        totalFrames: 0,
        processedFrames: 0,
        uniqueFaces: 0,
        clusters: [],
        processingTimeMs: performance.now() - startTime,
        error: 'No frames extracted from video',
      };
    }

    // Analyze each frame
    onProgress?.('Detecting faces', 0);
    const allFaces: DetectedFaceInFrame[] = [];
    
    for (let i = 0; i < frames.length; i++) {
      const facesInFrame = await analyzeFrame(frames[i]);
      allFaces.push(...facesInFrame);
      onProgress?.('Detecting faces', (i + 1) / frames.length);
    }

    // Cluster faces
    onProgress?.('Clustering identities', 0);
    const clusters = clusterFaces(allFaces);

    // Sort by appearance frequency
    clusters.sort((a, b) => b.frameCount - a.frameCount);

    onProgress?.('Complete', 1);

    return {
      totalFrames: frames.length,
      processedFrames: frames.length,
      uniqueFaces: clusters.length,
      clusters,
      processingTimeMs: performance.now() - startTime,
    };
  } catch (error) {
    console.error('[VideoAnalyzer] Analysis failed:', error);
    return {
      totalFrames: 0,
      processedFrames: 0,
      uniqueFaces: 0,
      clusters: [],
      processingTimeMs: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get best frames for enrollment from clusters
 */
export function getBestEnrollmentFrames(
  cluster: FaceCluster,
  targetCount: number = 5
): DetectedFaceInFrame[] {
  // Sort by quality
  const sorted = [...cluster.faces].sort((a, b) => b.quality - a.quality);

  // Select diverse angles
  const selected: DetectedFaceInFrame[] = [];
  const angles = new Set<string>();

  for (const face of sorted) {
    if (selected.length >= targetCount) break;

    const angleKey = face.headPose 
      ? `${Math.round(face.headPose.yaw / 15) * 15}_${Math.round(face.headPose.pitch / 15) * 15}`
      : 'unknown';

    if (!angles.has(angleKey) || selected.length < 3) {
      selected.push(face);
      angles.add(angleKey);
    }
  }

  return selected;
}

/**
 * Create thumbnail from best frame
 */
export function createThumbnail(
  frame: DetectedFaceInFrame,
  size: number = 100
): string {
  // This would need the original canvas/image data
  // Placeholder - in real implementation, crop face from stored canvas
  return '';
}

/**
 * Offline analysis queue for background processing
 */
export class OfflineAnalysisQueue {
  private queue: Array<{
    id: string;
    videoFile: File;
    options: VideoAnalysisOptions;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: VideoAnalysisResult;
    error?: string;
  }> = [];

  private processing = false;

  add(videoFile: File, options: VideoAnalysisOptions = {}): string {
    const id = crypto.randomUUID();
    this.queue.push({
      id,
      videoFile,
      options,
      status: 'pending',
    });
    this.processNext();
    return id;
  }

  private async processNext() {
    if (this.processing) return;

    const pending = this.queue.find(q => q.status === 'pending');
    if (!pending) return;

    this.processing = true;
    pending.status = 'processing';

    try {
      pending.result = await analyzeVideo(pending.videoFile, pending.options);
      pending.status = 'completed';
    } catch (error) {
      pending.status = 'failed';
      pending.error = error instanceof Error ? error.message : 'Unknown error';
    }

    this.processing = false;
    this.processNext();
  }

  getStatus(id: string) {
    return this.queue.find(q => q.id === id);
  }

  getAll() {
    return [...this.queue];
  }

  remove(id: string) {
    const index = this.queue.findIndex(q => q.id === id);
    if (index >= 0) {
      this.queue.splice(index, 1);
    }
  }
}

export const offlineAnalysisQueue = new OfflineAnalysisQueue();
