/**
 * Local ML Library Index
 * 
 * Exports all on-device ML analyzers for zero-latency,
 * privacy-preserving intelligence.
 */

// Sentiment Analysis
export {
  localSentimentAnalyzer,
  type SentimentResult,
  type TextAnalysis,
} from './localSentimentAnalyzer';

// Speaker Identification
export {
  localSpeakerIdentifier,
  type VoiceFeatures,
  type SpeakerEmbedding,
  type SpeakerProfile,
  type SpeakerSegment,
  type DiarizationResult,
} from './localSpeakerIdentifier';

// Behavior Pattern Analysis
export {
  localBehaviorAnalyzer,
  type SensorReading,
  type ActivityClassification,
  type LocationContext,
  type BehaviorPattern,
  type BehaviorProfile,
  type AnomalyDetection,
} from './localBehaviorAnalyzer';
