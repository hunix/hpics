/**
 * Biometrics Library Index (v10.0 - Enhanced)
 * 
 * Centralized exports for biometric processing utilities.
 * Includes ArcFace, SpotFormer, ECAPA-TDNN, SkeletonGait,
 * TypeFormer, and Cross-Modal Attention Fusion engines.
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

// Signature Biometrics
export {
  signatureAnalyzer,
  type SignaturePoint,
  type SignatureBiometrics,
  type SignatureComparison
} from './signatureAnalyzer';

// Gait Analysis
export {
  gaitAnalyzer,
  type MotionSample,
  type GaitProfile,
  type GaitComparison,
  type GaitAnomaly
} from './gaitAnalyzer';

// Keystroke Dynamics
export {
  keystrokeDynamicsAnalyzer,
  createKeystrokeAnalyzer,
  type KeyEvent,
  type KeystrokeProfile,
  type KeystrokeComparison
} from './keystrokeDynamics';

// Continuous Authentication Engine (v9.0)
export {
  analyzeKeystrokeDynamics,
  analyzeTouchPatterns,
  analyzeMouseMovements,
  analyzeGaitPatterns,
  estimateCognitiveState,
  authenticateUser,
  type KeystrokeProfile as ContinuousKeystrokeProfile,
  type TouchProfile,
  type MouseProfile,
  type GaitProfile as ContinuousGaitProfile,
  type CognitiveStateEstimate,
  type AuthenticationResult,
  type BiometricAnomaly,
} from './continuousAuthEngine';

// === v10.0 Enhanced Engines ===

// ArcFace Angular Margin Loss Embedding (IEEE TPAMI 2024)
export {
  arcFaceEngine,
  ArcFaceEmbeddingEngine,
  type ArcFaceConfig,
  type FaceEmbedding,
  type PoseAngles,
  type OcclusionMap,
  type VerificationResult,
  type ArcFaceModelMetrics,
} from './arcFaceEmbedding';

// SpotFormer Micro-Expression Detection (AAAI 2024)
export {
  spotFormerEngine,
  SpotFormerEngine,
  type SpotFormerConfig,
  type SpotFormerResult,
  type MicroExpressionSpot,
  type FacialRegionAttention,
  type DeceptionFromMicroExpressions,
  type SpottedEmotion,
  type OpticalFlowFrame,
} from './spotFormerAnalyzer';

// ECAPA-TDNN Voice Embedding (ISCA 2024)
export {
  ecapaTdnnEngine,
  EcapaTdnnEngine,
  type EcapaTdnnConfig,
  type VoiceEmbedding192,
  type SpeakerVerificationResult,
  type SpoofingDetection,
  type VoiceQualityMetrics,
} from './ecapaTdnnEmbedding';

// SkeletonGait Recognition (AAAI 2024)
export {
  skeletonGaitEngine,
  SkeletonGaitEngine,
  type SkeletonGaitConfig,
  type SkeletonKeypoint,
  type SkeletonFrame,
  type SkeletonMap,
  type GaitSignature,
  type GaitCycleFeatures,
  type GaitStyleDescriptor,
  type GaitVerificationResult,
} from './skeletonGaitAnalyzer';

// TypeFormer Keystroke Dynamics (Springer 2024)
export {
  typeFormerEngine,
  TypeFormerEngine,
  type TypeFormerConfig,
  type TypeFormerProfile,
  type TypeFormerAuthResult,
  type TypingBehaviorInsights,
  type KeystrokeEvent as TypeFormerKeystrokeEvent,
  type KeystrokeFeatureVector,
} from './typeFormerKeystroke';

// Cross-Modal Attention Fusion (Odyssey 2024)
export {
  crossModalFusionEngine,
  CrossModalAttentionFusionEngine,
  type FusionConfig,
  type ModalityInput,
  type BiometricModality,
  type FusedIdentity,
  type CrossModalAttentionMap,
  type FusionVerificationResult,
} from './crossModalAttentionFusion';
