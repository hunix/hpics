/**
 * Biometrics Library Index
 * 
 * Centralized exports for biometric processing utilities.
 */

// Offline ML Service
export { 
  offlineMLService, 
  type MLModelStatus, 
  type EnhancedFaceDetection,
  type HeadPose,
  type QualityScore 
} from '../offlineMLService';

// Head Pose Estimation
export {
  estimateHeadPose,
  getAngleGuidance,
  getGuidance,
  categorizePose,
  isPoseMatch,
  PoseSmoother,
  MotionDetector,
  type GuidanceResult,
  type PoseGuidance
} from '../headPoseEstimation';

// Video Frame Analysis
export {
  extractKeyFrames,
  analyzeFrame,
  analyzeVideo,
  clusterFaces,
  getBestEnrollmentFrames,
  offlineAnalysisQueue,
  type VideoAnalysisOptions,
  type ExtractedFrame,
  type DetectedFaceInFrame,
  type FaceCluster,
  type VideoAnalysisResult
} from '../videoFrameAnalyzer';

// Face Tracking
export {
  FaceTracker,
  type TrackedFace,
  type TrackingConfig
} from '../faceTracking';

// Face Detection Service
export { faceDetectionService } from '../faceDetection';

// Model Cache
export { modelCacheManager, useModelCache } from '../modelCacheManager';

// Emotion Recording
export { 
  emotionRecorder, 
  analyzeEngagement,
  type EmotionSample,
  type EmotionShift,
  type EmotionTimeline
} from '../emotionRecorder';
