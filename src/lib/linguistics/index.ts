/**
 * Linguistics Module Index (v9.0)
 * 
 * Centralized exports for linguistic analysis capabilities.
 */

// Stylometric Analysis
export {
  analyzeStylometry,
  compareAuthorship,
  calculateBurrowsDelta,
  analyzeProfileWritingStyle,
  type StylometricFeatures,
  type AIDetectionResult,
  type AuthorshipMatch,
  type StylometricAnalysis,
} from './stylometricAnalyzer';

// LLM Detection
export {
  detectLLMGenerated,
  compareToReferences,
  type LLMDetectionResult,
  type DetectionIndicator,
  type PerplexityAnalysis,
  type BurstinessAnalysis,
  type LLMModel,
} from './llmDetectionEngine';

// Cross-Language Deception
export {
  detectLanguage,
  analyzeCrossLanguageDeception,
  getSupportedLanguages,
  getLanguageProfile,
  type LanguageProfile,
  type CulturalContext,
  type DeceptionMarker,
  type CrossLanguageAnalysis,
  type CulturalFactor,
} from './crossLanguageDeception';
