/**
 * Psychology Library Index
 * 
 * Centralized exports for psychological analysis utilities.
 */

// Dark Psychology Engine
export {
  type DarkTriadAssessment,
  type CognitiveBias,
  type ManipulationTechnique,
  type PsychologicalVulnerability,
  type InfluenceResistance,
  INFLUENCE_PRINCIPLES,
  COGNITIVE_BIASES,
  MANIPULATION_TECHNIQUES,
  assessDarkTriad,
  detectManipulation,
  assessBiasSusceptibility,
  generateExploitationPlaybook,
  calculateInfluenceResistance
} from './darkPsychologyEngine';

// Micro-Expression Analyzer
export {
  type ActionUnit,
  type MicroExpressionEvent,
  type EmotionType,
  type EmotionBaseline,
  type DeceptionIndicator,
  detectEmotionFromAUs,
  analyzeExpressionTiming,
  analyzeContemptPatterns,
  buildEmotionBaseline,
  detectBaselineDeviations,
  generateMicroExpressionReport
} from './microExpressionAnalyzer';

// Voice Stress Analyzer
export {
  type VoiceAnalysisInput,
  type VoiceStressMarker,
  type VoiceBaseline,
  type VoiceEmotionalState,
  type VoiceDeceptionAnalysis,
  analyzePitchStress,
  analyzeTremor,
  analyzePaceAndPauses,
  analyzeFillers,
  estimateEmotionalState,
  analyzeVoiceDeception,
  buildVoiceBaseline
} from './voiceStressAnalyzer';

// Reconsolidation Tracker (v9.0)
export {
  trackMemoryRetrieval,
  getReconsolidationWindow,
  generateInterventionStrategies,
  profileSuggestibility,
  findOptimalInterventionWindows,
  type MemoryEvent,
  type ReconsolidationWindow,
  type InterventionStrategy,
  type SuggestibilityProfile,
  type SuggestibilityFactor,
} from './reconsolidationTracker';
