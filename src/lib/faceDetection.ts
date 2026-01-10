/**
 * Local Face Detection Service using face-api.js
 * Provides zero-cost face detection in the browser
 */

import * as faceapi from '@vladmandic/face-api';

export interface DetectedFace {
  box: { x: number; y: number; width: number; height: number };
  normalizedBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks?: faceapi.FaceLandmarks68;
  descriptor?: Float32Array;
}

export interface FaceMatchResult {
  profileId: string;
  distance: number;
  confidence: number;
}

class FaceDetectionService {
  private modelsLoaded = false;
  private loading = false;
  private modelPath = '/models/face-api';

  async loadModels(): Promise<boolean> {
    if (this.modelsLoaded) return true;
    if (this.loading) {
      // Wait for loading to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.modelsLoaded;
    }

    this.loading = true;
    try {
      console.log('[FaceDetection] Loading face-api.js models...');
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath),
      ]);
      
      this.modelsLoaded = true;
      console.log('[FaceDetection] Models loaded successfully');
      return true;
    } catch (error) {
      console.error('[FaceDetection] Failed to load models:', error);
      return false;
    } finally {
      this.loading = false;
    }
  }

  isReady(): boolean {
    return this.modelsLoaded;
  }

  async detectFaces(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    options?: { withDescriptors?: boolean }
  ): Promise<DetectedFace[]> {
    const loaded = await this.loadModels();
    if (!loaded) {
      throw new Error('Face detection models not available');
    }

    const withDescriptors = options?.withDescriptors ?? true;

    let detections;
    if (withDescriptors) {
      detections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();
    } else {
      const basicDetections = await faceapi
        .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks();
      
      detections = basicDetections.map(d => ({
        detection: d.detection,
        landmarks: d.landmarks,
        descriptor: undefined,
      }));
    }

    const imgWidth = imageElement instanceof HTMLImageElement ? imageElement.naturalWidth : imageElement.width;
    const imgHeight = imageElement instanceof HTMLImageElement ? imageElement.naturalHeight : imageElement.height;

    return detections.map(d => ({
      box: {
        x: d.detection.box.x,
        y: d.detection.box.y,
        width: d.detection.box.width,
        height: d.detection.box.height,
      },
      normalizedBox: {
        x: d.detection.box.x / imgWidth,
        y: d.detection.box.y / imgHeight,
        width: d.detection.box.width / imgWidth,
        height: d.detection.box.height / imgHeight,
      },
      confidence: d.detection.score,
      landmarks: d.landmarks,
      descriptor: d.descriptor,
    }));
  }

  async detectFacesFromUrl(imageUrl: string): Promise<DetectedFace[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const faces = await this.detectFaces(img);
          resolve(faces);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  // Compare two face descriptors (0 = identical, higher = more different)
  compareFaces(descriptor1: Float32Array, descriptor2: Float32Array): number {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
  }

  // Convert distance to confidence score (0-1, higher is better)
  distanceToConfidence(distance: number): number {
    // Typical threshold: 0.6 for same person
    // Map distance to confidence: 0 distance = 1.0 confidence, 0.6 distance = 0.6 confidence, 1.0 distance = 0 confidence
    return Math.max(0, 1 - distance);
  }

  // Find best matching face from enrolled profiles
  findBestMatch(
    descriptor: Float32Array,
    enrolledDescriptors: { profileId: string; descriptor: Float32Array }[],
    threshold: number = 0.6
  ): FaceMatchResult | null {
    let bestMatch: FaceMatchResult | null = null;
    let bestDistance = Infinity;

    for (const enrolled of enrolledDescriptors) {
      const distance = this.compareFaces(descriptor, enrolled.descriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          profileId: enrolled.profileId,
          distance,
          confidence: this.distanceToConfidence(distance),
        };
      }
    }

    return bestMatch && bestMatch.distance <= threshold ? bestMatch : null;
  }

  // Find all matches above a threshold
  findAllMatches(
    descriptor: Float32Array,
    enrolledDescriptors: { profileId: string; descriptor: Float32Array }[],
    threshold: number = 0.6
  ): FaceMatchResult[] {
    const matches: FaceMatchResult[] = [];

    for (const enrolled of enrolledDescriptors) {
      const distance = this.compareFaces(descriptor, enrolled.descriptor);
      if (distance <= threshold) {
        matches.push({
          profileId: enrolled.profileId,
          distance,
          confidence: this.distanceToConfidence(distance),
        });
      }
    }

    return matches.sort((a, b) => a.distance - b.distance);
  }

  // Serialize descriptor to string for database storage
  serializeDescriptor(descriptor: Float32Array): string {
    return JSON.stringify(Array.from(descriptor));
  }

  // Deserialize descriptor from database
  deserializeDescriptor(serialized: string): Float32Array {
    const array = JSON.parse(serialized);
    return new Float32Array(array);
  }
}

export const faceDetectionService = new FaceDetectionService();
