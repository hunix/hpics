/**
 * Local ML Library Index (v10.0 - Enhanced)
 * 
 * Exports all on-device ML analyzers including new research-backed engines.
 */

// Sentiment Analysis
export { localSentimentAnalyzer, type SentimentResult, type TextAnalysis } from './localSentimentAnalyzer';

// Speaker Identification
export { localSpeakerIdentifier, type VoiceFeatures, type SpeakerEmbedding, type SpeakerProfile, type SpeakerSegment, type DiarizationResult } from './localSpeakerIdentifier';

// Behavior Pattern Analysis
export { localBehaviorAnalyzer, type SensorReading, type ActivityClassification, type LocationContext, type BehaviorPattern, type BehaviorProfile, type AnomalyDetection } from './localBehaviorAnalyzer';

// WebGPU Whisper Transcription
export { localWhisperTranscriber, LocalWhisperTranscriber, type WhisperModel, type TranscriptionResult, type TranscriptionChunk, type WhisperModelInfo, type ProgressCallback, type WhisperModelConfig, isLanguageSupported, getModelConfig, getLanguageDisplay, LANGUAGE_DISPLAY_MAP } from './localWhisperTranscriber';

// Unified Local Audio Analysis
export { localAudioAnalyzer, LocalAudioAnalyzer, type LocalAudioAnalysis, type LocalAudioAnalysisOptions, type BatchAnalysisProgress, type BatchProgressCallback, type LanguageDetectionResult } from './localAudioAnalyzer';

// === v10.0 Enhanced Engines ===

// OCEAN-AI Multimodal Personality (Interspeech 2024)
export { oceanAiEngine, OceanAiEngine, type OceanScores, type PersonalityTrajectoryPoint, type OceanAiConfig } from './oceanAiPersonality';

// Dark Triad Detector (IJRIAS 2024)
export { darkTriadDetector, DarkTriadDetector, type DarkTriadScores, type DarkTriadIndicators, type DarkTriadAnalysis } from './darkTriadDetector';

// Transformer Emotion Recognition (26+ emotions)
export { transformerEmotionEngine, TransformerEmotionEngine, type GranularEmotion, type EmotionPrediction, type EmotionAnalysisResult } from './transformerEmotionRecognition';

// CCP-Net Churn Prediction (Nature 2024)
export { ccpNetEngine, CcpNetEngine, type ChurnFeatureVector, type CcpNetPrediction, type ChurnRiskFactor } from './ccpNetChurn';

// VTT Anomaly Detection (KBS 2024)
export { vttAnomalyDetector, VttAnomalyDetector, type TimeSeriesPoint, type AnomalyDetectionResult, type DetectedAnomaly } from './vttAnomalyDetector';
