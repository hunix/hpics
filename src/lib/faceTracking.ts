/**
 * Face Tracking Across Video Frames
 * 
 * Tracks the same face across multiple frames using:
 * - Descriptor similarity matching
 * - Bounding box overlap (IOU)
 * - Kalman filter for smooth tracking
 * - Re-identification after occlusion
 */

import { offlineMLService, EnhancedFaceDetection } from './offlineMLService';

export interface TrackedFace {
  trackId: string;
  currentBox: { x: number; y: number; width: number; height: number };
  descriptor: Float32Array;
  lastSeen: number;          // Frame number
  firstSeen: number;
  confidence: number;
  frameCount: number;
  velocity: { dx: number; dy: number }; // Pixels per frame
  age?: number;
  gender?: string;
  expression?: string;
}

export interface TrackingConfig {
  descriptorThreshold: number;   // Max descriptor distance for same person (default: 0.5)
  iouThreshold: number;          // Min IOU for box overlap matching (default: 0.3)
  maxMissedFrames: number;       // Frames before track is lost (default: 30)
  minTrackFrames: number;        // Min frames for valid track (default: 3)
  useVelocity: boolean;          // Use velocity prediction (default: true)
}

const DEFAULT_CONFIG: TrackingConfig = {
  descriptorThreshold: 0.5,
  iouThreshold: 0.3,
  maxMissedFrames: 30,
  minTrackFrames: 3,
  useVelocity: true,
};

/**
 * Calculate Intersection over Union (IOU) of two boxes
 */
export function calculateIOU(
  box1: { x: number; y: number; width: number; height: number },
  box2: { x: number; y: number; width: number; height: number }
): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 <= x1 || y2 <= y1) return 0;

  const intersection = (x2 - x1) * (y2 - y1);
  const area1 = box1.width * box1.height;
  const area2 = box2.width * box2.height;
  const union = area1 + area2 - intersection;

  return intersection / union;
}

/**
 * Predict box position based on velocity
 */
function predictBox(
  track: TrackedFace,
  frameDelta: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: track.currentBox.x + track.velocity.dx * frameDelta,
    y: track.currentBox.y + track.velocity.dy * frameDelta,
    width: track.currentBox.width,
    height: track.currentBox.height,
  };
}

/**
 * Update velocity with new observation
 */
function updateVelocity(
  oldVelocity: { dx: number; dy: number },
  oldBox: { x: number; y: number },
  newBox: { x: number; y: number },
  alpha: number = 0.3
): { dx: number; dy: number } {
  const instantVelocity = {
    dx: newBox.x - oldBox.x,
    dy: newBox.y - oldBox.y,
  };

  // Exponential smoothing
  return {
    dx: oldVelocity.dx * (1 - alpha) + instantVelocity.dx * alpha,
    dy: oldVelocity.dy * (1 - alpha) + instantVelocity.dy * alpha,
  };
}

/**
 * Multi-object face tracker
 */
export class FaceTracker {
  private tracks: Map<string, TrackedFace> = new Map();
  private config: TrackingConfig;
  private currentFrame = 0;
  private nextTrackId = 1;

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Process a new frame with detections
   */
  update(detections: EnhancedFaceDetection[], frameNumber?: number): TrackedFace[] {
    this.currentFrame = frameNumber ?? this.currentFrame + 1;

    // Get active tracks
    const activeTracks = Array.from(this.tracks.values()).filter(
      t => this.currentFrame - t.lastSeen <= this.config.maxMissedFrames
    );

    // Build cost matrix for Hungarian assignment
    const assignments = this.assignDetectionsToTracks(detections, activeTracks);

    // Update matched tracks
    for (const [trackId, detectionIdx] of assignments.matched) {
      const track = this.tracks.get(trackId)!;
      const detection = detections[detectionIdx];

      // Update velocity
      if (this.config.useVelocity) {
        track.velocity = updateVelocity(
          track.velocity,
          track.currentBox,
          detection.box
        );
      }

      // Update track
      track.currentBox = detection.box;
      if (detection.descriptor) {
        // Running average of descriptor
        for (let i = 0; i < track.descriptor.length; i++) {
          track.descriptor[i] = track.descriptor[i] * 0.9 + detection.descriptor[i] * 0.1;
        }
      }
      track.lastSeen = this.currentFrame;
      track.frameCount++;
      track.confidence = detection.confidence;
      track.age = detection.age;
      track.gender = detection.gender;
      track.expression = detection.expressions 
        ? offlineMLService.getDominantExpression(detection.expressions)
        : undefined;
    }

    // Create new tracks for unmatched detections
    for (const detectionIdx of assignments.unmatchedDetections) {
      const detection = detections[detectionIdx];
      if (!detection.descriptor) continue;

      const trackId = `track_${this.nextTrackId++}`;
      this.tracks.set(trackId, {
        trackId,
        currentBox: detection.box,
        descriptor: detection.descriptor,
        lastSeen: this.currentFrame,
        firstSeen: this.currentFrame,
        confidence: detection.confidence,
        frameCount: 1,
        velocity: { dx: 0, dy: 0 },
        age: detection.age,
        gender: detection.gender,
        expression: detection.expressions 
          ? offlineMLService.getDominantExpression(detection.expressions)
          : undefined,
      });
    }

    // Clean up old tracks
    for (const [trackId, track] of this.tracks) {
      if (this.currentFrame - track.lastSeen > this.config.maxMissedFrames) {
        this.tracks.delete(trackId);
      }
    }

    // Return active tracks
    return this.getActiveTracks();
  }

  /**
   * Assign detections to existing tracks
   */
  private assignDetectionsToTracks(
    detections: EnhancedFaceDetection[],
    tracks: TrackedFace[]
  ): {
    matched: Array<[string, number]>;
    unmatchedTracks: string[];
    unmatchedDetections: number[];
  } {
    const matched: Array<[string, number]> = [];
    const usedTracks = new Set<string>();
    const usedDetections = new Set<number>();

    // Score all pairs
    const scores: Array<{ trackId: string; detIdx: number; score: number }> = [];

    for (const track of tracks) {
      const predictedBox = this.config.useVelocity
        ? predictBox(track, this.currentFrame - track.lastSeen)
        : track.currentBox;

      for (let i = 0; i < detections.length; i++) {
        const detection = detections[i];

        // Calculate combined score
        let score = 0;

        // IOU score
        const iou = calculateIOU(predictedBox, detection.box);
        if (iou >= this.config.iouThreshold) {
          score += iou * 0.4;
        }

        // Descriptor similarity score
        if (detection.descriptor) {
          const distance = offlineMLService.compareDescriptors(
            track.descriptor,
            detection.descriptor
          );
          if (distance <= this.config.descriptorThreshold) {
            score += (1 - distance) * 0.6;
          }
        }

        if (score > 0) {
          scores.push({ trackId: track.trackId, detIdx: i, score });
        }
      }
    }

    // Greedy assignment (sort by score, assign best first)
    scores.sort((a, b) => b.score - a.score);

    for (const { trackId, detIdx, score } of scores) {
      if (usedTracks.has(trackId) || usedDetections.has(detIdx)) continue;

      matched.push([trackId, detIdx]);
      usedTracks.add(trackId);
      usedDetections.add(detIdx);
    }

    return {
      matched,
      unmatchedTracks: tracks.filter(t => !usedTracks.has(t.trackId)).map(t => t.trackId),
      unmatchedDetections: detections.map((_, i) => i).filter(i => !usedDetections.has(i)),
    };
  }

  /**
   * Get all currently active tracks
   */
  getActiveTracks(): TrackedFace[] {
    return Array.from(this.tracks.values()).filter(
      t => this.currentFrame - t.lastSeen <= this.config.maxMissedFrames
    );
  }

  /**
   * Get tracks that have been seen for minimum required frames
   */
  getConfirmedTracks(): TrackedFace[] {
    return this.getActiveTracks().filter(
      t => t.frameCount >= this.config.minTrackFrames
    );
  }

  /**
   * Get a specific track by ID
   */
  getTrack(trackId: string): TrackedFace | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * Reset all tracks
   */
  reset(): void {
    this.tracks.clear();
    this.currentFrame = 0;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalTracks: number;
    activeTracks: number;
    confirmedTracks: number;
    currentFrame: number;
  } {
    return {
      totalTracks: this.tracks.size,
      activeTracks: this.getActiveTracks().length,
      confirmedTracks: this.getConfirmedTracks().length,
      currentFrame: this.currentFrame,
    };
  }
}

/**
 * Re-identification across separate video segments
 */
export class FaceReIdentifier {
  private knownFaces: Map<string, {
    profileId: string;
    descriptor: Float32Array;
    lastSeen: Date;
  }> = new Map();

  private threshold = 0.5;

  /**
   * Register a known face (from enrolled contact)
   */
  register(profileId: string, descriptor: Float32Array): void {
    this.knownFaces.set(profileId, {
      profileId,
      descriptor,
      lastSeen: new Date(),
    });
  }

  /**
   * Register multiple faces from biometrics
   */
  registerFromBiometrics(
    biometrics: Array<{ profile_id: string; facial_embedding: string | null }>
  ): void {
    for (const bio of biometrics) {
      if (bio.facial_embedding) {
        try {
          const descriptor = offlineMLService.deserializeDescriptor(bio.facial_embedding);
          this.register(bio.profile_id, descriptor);
        } catch (e) {
          console.warn('[ReID] Failed to parse descriptor:', e);
        }
      }
    }
  }

  /**
   * Try to identify a face
   */
  identify(descriptor: Float32Array): {
    profileId: string;
    confidence: number;
  } | null {
    let bestMatch: { profileId: string; distance: number } | null = null;

    for (const [profileId, known] of this.knownFaces) {
      const distance = offlineMLService.compareDescriptors(descriptor, known.descriptor);

      if (distance <= this.threshold) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { profileId, distance };
        }
      }
    }

    if (bestMatch) {
      return {
        profileId: bestMatch.profileId,
        confidence: offlineMLService.distanceToConfidence(bestMatch.distance),
      };
    }

    return null;
  }

  /**
   * Identify all matches above threshold
   */
  identifyAll(descriptor: Float32Array): Array<{
    profileId: string;
    confidence: number;
  }> {
    const matches: Array<{ profileId: string; confidence: number }> = [];

    for (const [profileId, known] of this.knownFaces) {
      const distance = offlineMLService.compareDescriptors(descriptor, known.descriptor);

      if (distance <= this.threshold) {
        matches.push({
          profileId,
          confidence: offlineMLService.distanceToConfidence(distance),
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Clear all known faces
   */
  clear(): void {
    this.knownFaces.clear();
  }

  /**
   * Get count of registered faces
   */
  getCount(): number {
    return this.knownFaces.size;
  }
}

export const globalReIdentifier = new FaceReIdentifier();
