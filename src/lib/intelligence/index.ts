/**
 * Intelligence Libraries Index
 * 
 * Core intelligence modules for the Absolute General Intelligence System (AGIS).
 */

// Personality Analysis
export * from '../personality/oceanExtractor';

// Influence Orchestration
export * from '../influence/principlePlaybookGenerator';
export * from '../influence/optimalTimingEngine';

// Deception Detection (exclude MicroExpression to avoid conflict with biometrics)
export { 
  analyzeLinguisticDeception,
  analyzeFacialDeception,
  analyzeVocalDeception,
  type DeceptionIndicator,
  type DeceptionAnalysisResult,
  type VoiceStressMarker,
  type LinguisticMarker,
  type CrossModalConflict,
  type DeceptionTimelineEvent
} from '../deception/deceptionAnalyzer';

// Financial Intelligence
export * from '../finance/wealthEstimator';

// Power Network Analysis
export * from '../network/powerAnalyzer';

// AGIS Phase 4: Neural-Behavioral Integration
export * from '../biometrics/pupillometryAnalyzer';
export * from '../biometrics/hrvInference';
export * from '../biometrics/microExpressionAnalyzer';
export * from '../biometrics/voiceStressAnalyzer';

// AGIS Phase 5: Game Theory & Strategic Modeling
export * from './gameTheoryEngine';

// AGIS Phase 8: Mobile Intelligence
export * from '../mobile/mobileIntelligenceService';
