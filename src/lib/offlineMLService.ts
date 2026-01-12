/**
 * Unified Offline ML Service
 * 
 * Provides a single interface for all offline ML models:
 * - face-api.js (detection, landmarks, descriptors, age/gender/expressions)
 * - TensorFlow.js BlazeFace (ultra-fast backup detection)
 * - MediaPipe Face Mesh (468 landmarks for enhanced analysis)
 * 
 * Features:
 * - Lazy loading with caching
 * - WebGL acceleration
 * - Fallback chain for reliability
 * - Model warmup on app start
 */

import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';

// Types
export interface MLModelStatus {
  faceApi: {
    detection: boolean;
    landmarks: boolean;
    recognition: boolean;
    ageGender: boolean;
    expressions: boolean;
  };
  blazeFace: boolean;
  mediaPipe: boolean;
}

export interface EnhancedFaceDetection {
  box: { x: number; y: number; width: number; height: number };
  normalizedBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks?: faceapi.FaceLandmarks68;
  descriptor?: Float32Array;
  age?: number;
  gender?: string;
  genderProbability?: number;
  expressions?: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  headPose?: {
    yaw: number;   // Left/right rotation (-90 to +90)
    pitch: number; // Up/down tilt (-45 to +45)
    roll: number;  // Head tilt
  };
}

export interface HeadPose {
  yaw: number;
  pitch: number;
  roll: number;
  confidence: number;
}

export interface QualityScore {
  overall: number;
  lighting: number;
  blur: number;
  faceSize: number;
  centered: number;
  expression: number;
}

class OfflineMLService {
  private modelPath = '/models/face-api';
  private loadingPromise: Promise<void> | null = null;
  
  private modelStatus: MLModelStatus = {
    faceApi: {
      detection: false,
      landmarks: false,
      recognition: false,
      ageGender: false,
      expressions: false,
    },
    blazeFace: false,
    mediaPipe: false,
  };

  private blazeFaceModel: any = null;
  
  /**
   * Initialize TensorFlow.js backend
   */
  async initializeBackend(): Promise<void> {
    try {
      // Prefer WebGL for GPU acceleration
      await tf.setBackend('webgl');
      await tf.ready();
      console.log('[OfflineML] TensorFlow.js backend:', tf.getBackend());
    } catch (error) {
      console.warn('[OfflineML] WebGL failed, falling back to CPU:', error);
      await tf.setBackend('cpu');
      await tf.ready();
    }
  }

  /**
   * Load all face-api.js models with age/gender/expressions
   */
  async loadFaceApiModels(options?: { 
    includeAgeGender?: boolean;
    includeExpressions?: boolean;
  }): Promise<boolean> {
    if (this.loadingPromise) {
      await this.loadingPromise;
      return this.allFaceApiModelsLoaded();
    }

    this.loadingPromise = this._loadFaceApiModelsInternal(options);
    await this.loadingPromise;
    this.loadingPromise = null;
    
    return this.allFaceApiModelsLoaded();
  }

  private async _loadFaceApiModelsInternal(options?: {
    includeAgeGender?: boolean;
    includeExpressions?: boolean;
  }): Promise<void> {
    const includeAgeGender = options?.includeAgeGender ?? true;
    const includeExpressions = options?.includeExpressions ?? true;

    const loadPromises: Promise<void>[] = [];

    // Core models (always load)
    if (!this.modelStatus.faceApi.detection) {
      loadPromises.push(
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelPath)
          .then(() => { this.modelStatus.faceApi.detection = true; })
      );
    }

    if (!this.modelStatus.faceApi.landmarks) {
      loadPromises.push(
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelPath)
          .then(() => { this.modelStatus.faceApi.landmarks = true; })
      );
    }

    if (!this.modelStatus.faceApi.recognition) {
      loadPromises.push(
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelPath)
          .then(() => { this.modelStatus.faceApi.recognition = true; })
      );
    }

    // Optional: Age and gender
    if (includeAgeGender && !this.modelStatus.faceApi.ageGender) {
      loadPromises.push(
        faceapi.nets.ageGenderNet.loadFromUri(this.modelPath)
          .then(() => { this.modelStatus.faceApi.ageGender = true; })
          .catch(err => {
            console.warn('[OfflineML] Age/gender model not available:', err);
          })
      );
    }

    // Optional: Expressions
    if (includeExpressions && !this.modelStatus.faceApi.expressions) {
      loadPromises.push(
        faceapi.nets.faceExpressionNet.loadFromUri(this.modelPath)
          .then(() => { this.modelStatus.faceApi.expressions = true; })
          .catch(err => {
            console.warn('[OfflineML] Expressions model not available:', err);
          })
      );
    }

    try {
      await Promise.all(loadPromises);
      console.log('[OfflineML] Face-api models loaded:', this.modelStatus.faceApi);
    } catch (error) {
      console.error('[OfflineML] Failed to load some models:', error);
    }
  }

  private allFaceApiModelsLoaded(): boolean {
    return this.modelStatus.faceApi.detection &&
           this.modelStatus.faceApi.landmarks &&
           this.modelStatus.faceApi.recognition;
  }

  /**
   * Load BlazeFace for ultra-fast detection
   */
  async loadBlazeFace(): Promise<boolean> {
    if (this.modelStatus.blazeFace) return true;

    try {
      await this.initializeBackend();
      
      // Dynamic import to avoid bundling if not used
      const blazeface = await import('@tensorflow-models/blazeface');
      this.blazeFaceModel = await blazeface.load();
      this.modelStatus.blazeFace = true;
      console.log('[OfflineML] BlazeFace loaded');
      return true;
    } catch (error) {
      console.error('[OfflineML] Failed to load BlazeFace:', error);
      return false;
    }
  }

  /**
   * Enhanced face detection with all available features
   */
  async detectFacesEnhanced(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    options?: {
      withDescriptors?: boolean;
      withAgeGender?: boolean;
      withExpressions?: boolean;
      withHeadPose?: boolean;
    }
  ): Promise<EnhancedFaceDetection[]> {
    const opts = {
      withDescriptors: true,
      withAgeGender: true,
      withExpressions: true,
      withHeadPose: true,
      ...options,
    };

    // Ensure models are loaded
    await this.loadFaceApiModels({
      includeAgeGender: opts.withAgeGender,
      includeExpressions: opts.withExpressions,
    });

    // Build detection chain
    let query = faceapi
      .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks();

    if (opts.withDescriptors) {
      query = query.withFaceDescriptors() as any;
    }

    if (opts.withAgeGender && this.modelStatus.faceApi.ageGender) {
      query = query.withAgeAndGender() as any;
    }

    if (opts.withExpressions && this.modelStatus.faceApi.expressions) {
      query = query.withFaceExpressions() as any;
    }

    const detections = await query;

    // Get image dimensions
    const imgWidth = input instanceof HTMLVideoElement 
      ? input.videoWidth 
      : input instanceof HTMLImageElement 
        ? input.naturalWidth 
        : input.width;
    const imgHeight = input instanceof HTMLVideoElement 
      ? input.videoHeight 
      : input instanceof HTMLImageElement 
        ? input.naturalHeight 
        : input.height;

    return detections.map((d: any) => {
      const result: EnhancedFaceDetection = {
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
      };

      // Age and gender
      if (d.age !== undefined) {
        result.age = Math.round(d.age);
      }
      if (d.gender !== undefined) {
        result.gender = d.gender;
        result.genderProbability = d.genderProbability;
      }

      // Expressions
      if (d.expressions) {
        result.expressions = {
          neutral: d.expressions.neutral || 0,
          happy: d.expressions.happy || 0,
          sad: d.expressions.sad || 0,
          angry: d.expressions.angry || 0,
          fearful: d.expressions.fearful || 0,
          disgusted: d.expressions.disgusted || 0,
          surprised: d.expressions.surprised || 0,
        };
      }

      // Calculate head pose from landmarks
      if (opts.withHeadPose && d.landmarks) {
        result.headPose = this.estimateHeadPoseFromLandmarks(d.landmarks, imgWidth, imgHeight);
      }

      return result;
    });
  }

  /**
   * Ultra-fast detection using BlazeFace (fallback)
   */
  async detectFacesFast(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<{ box: { x: number; y: number; width: number; height: number }; confidence: number }[]> {
    if (!this.blazeFaceModel) {
      await this.loadBlazeFace();
    }

    if (!this.blazeFaceModel) {
      throw new Error('BlazeFace model not available');
    }

    // Convert to tensor
    const predictions = await this.blazeFaceModel.estimateFaces(input, false);

    return predictions.map((pred: any) => ({
      box: {
        x: pred.topLeft[0],
        y: pred.topLeft[1],
        width: pred.bottomRight[0] - pred.topLeft[0],
        height: pred.bottomRight[1] - pred.topLeft[1],
      },
      confidence: pred.probability[0],
    }));
  }

  /**
   * Estimate head pose from facial landmarks
   */
  estimateHeadPoseFromLandmarks(
    landmarks: faceapi.FaceLandmarks68,
    imgWidth: number,
    imgHeight: number
  ): HeadPose {
    const positions = landmarks.positions;
    
    // Key landmarks for pose estimation
    const noseTip = positions[30];      // Nose tip
    const noseBridge = positions[27];   // Nose bridge
    const leftEye = positions[36];      // Left eye outer corner
    const rightEye = positions[45];     // Right eye outer corner
    const leftMouth = positions[48];    // Left mouth corner
    const rightMouth = positions[54];   // Right mouth corner
    const chin = positions[8];          // Chin bottom

    // Calculate face center
    const faceCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y + leftMouth.y + rightMouth.y) / 4,
    };

    // Yaw (left-right rotation)
    // Based on nose position relative to eye midpoint
    const eyeMidpoint = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const eyeWidth = Math.abs(rightEye.x - leftEye.x);
    const noseOffset = (noseTip.x - eyeMidpoint.x) / eyeWidth;
    const yaw = noseOffset * 90; // Approximate angle

    // Pitch (up-down tilt)
    // Based on nose tip position relative to eye-mouth vertical span
    const eyeY = (leftEye.y + rightEye.y) / 2;
    const mouthY = (leftMouth.y + rightMouth.y) / 2;
    const verticalSpan = mouthY - eyeY;
    const noseVerticalOffset = (noseTip.y - (eyeY + verticalSpan * 0.4)) / verticalSpan;
    const pitch = noseVerticalOffset * 45; // Approximate angle

    // Roll (head tilt)
    // Based on eye line angle
    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const roll = (eyeAngle * 180) / Math.PI;

    // Confidence based on face size
    const faceSize = eyeWidth / imgWidth;
    const confidence = Math.min(1, faceSize * 5);

    return {
      yaw: Math.max(-90, Math.min(90, yaw)),
      pitch: Math.max(-45, Math.min(45, pitch)),
      roll: Math.max(-30, Math.min(30, roll)),
      confidence,
    };
  }

  /**
   * Calculate comprehensive quality score for an image/face
   */
  calculateQualityScore(
    face: EnhancedFaceDetection,
    imgWidth: number,
    imgHeight: number
  ): QualityScore {
    // Face size score (ideal: 10-25% of frame)
    const faceArea = (face.box.width * face.box.height) / (imgWidth * imgHeight);
    const idealMinArea = 0.10;
    const idealMaxArea = 0.25;
    const faceSize = faceArea < idealMinArea 
      ? faceArea / idealMinArea 
      : faceArea > idealMaxArea 
        ? 1 - (faceArea - idealMaxArea) / (1 - idealMaxArea)
        : 1;

    // Centered score (ideal: center of frame)
    const faceCenterX = (face.box.x + face.box.width / 2) / imgWidth;
    const faceCenterY = (face.box.y + face.box.height / 2) / imgHeight;
    const distFromCenter = Math.sqrt(
      Math.pow(faceCenterX - 0.5, 2) + Math.pow(faceCenterY - 0.5, 2)
    );
    const centered = Math.max(0, 1 - distFromCenter * 2);

    // Expression score (prefer neutral for enrollment)
    let expression = 0.8; // Default
    if (face.expressions) {
      const neutralScore = face.expressions.neutral || 0;
      expression = Math.max(0.5, neutralScore);
    }

    // Lighting score (based on detection confidence)
    const lighting = face.confidence;

    // Blur score (placeholder - would need image analysis)
    const blur = 0.8;

    // Overall score (weighted average)
    const overall = 
      faceSize * 0.25 +
      centered * 0.15 +
      expression * 0.15 +
      lighting * 0.25 +
      blur * 0.20;

    return {
      overall: Math.max(0, Math.min(1, overall)),
      lighting,
      blur,
      faceSize,
      centered,
      expression,
    };
  }

  /**
   * Check if a specific angle is captured
   */
  categorizeHeadPose(pose: HeadPose): 'front' | 'left' | 'right' | 'up' | 'down' {
    const { yaw, pitch } = pose;

    if (Math.abs(pitch) > 20) {
      return pitch > 0 ? 'down' : 'up';
    }

    if (Math.abs(yaw) < 15) {
      return 'front';
    }

    return yaw < 0 ? 'left' : 'right';
  }

  /**
   * Calculate angle coverage from captured samples
   */
  calculateAngleCoverage(poses: HeadPose[]): {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    coverage: number;
  } {
    const angles = poses.map(p => this.categorizeHeadPose(p));
    
    const coverage = {
      front: angles.includes('front'),
      left: angles.includes('left'),
      right: angles.includes('right'),
      up: angles.includes('up'),
      down: angles.includes('down'),
      coverage: 0,
    };

    const captured = [coverage.front, coverage.left, coverage.right].filter(Boolean).length;
    coverage.coverage = captured / 3; // Only require front, left, right

    return coverage;
  }

  /**
   * Get model status
   */
  getModelStatus(): MLModelStatus {
    return { ...this.modelStatus };
  }

  /**
   * Check if all required models are loaded
   */
  isReady(): boolean {
    return this.allFaceApiModelsLoaded();
  }

  /**
   * Get dominant expression
   */
  getDominantExpression(expressions: EnhancedFaceDetection['expressions']): string {
    if (!expressions) return 'unknown';

    const entries = Object.entries(expressions);
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  /**
   * Serialize descriptor for storage
   */
  serializeDescriptor(descriptor: Float32Array): string {
    return JSON.stringify(Array.from(descriptor));
  }

  /**
   * Deserialize descriptor from storage
   */
  deserializeDescriptor(serialized: string): Float32Array {
    const array = JSON.parse(serialized);
    return new Float32Array(array);
  }

  /**
   * Compare two descriptors (Euclidean distance)
   */
  compareDescriptors(d1: Float32Array, d2: Float32Array): number {
    return faceapi.euclideanDistance(d1, d2);
  }

  /**
   * Distance to confidence conversion
   */
  distanceToConfidence(distance: number): number {
    return Math.max(0, 1 - distance);
  }
}

export const offlineMLService = new OfflineMLService();
