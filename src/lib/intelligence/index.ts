/**
 * Intelligence Libraries Index (v3.7.4)
 * 
 * PERFORMANCE OPTIMIZED: Explicit exports to prevent TypeScript from
 * parsing all files on every import. Import directly from source modules
 * for better tree-shaking.
 * 
 * Core intelligence modules for the Absolute General Intelligence System (AGIS).
 */

// ============================================
// Personality Analysis
// ============================================
export {
  extractOceanFromText,
  extractFacetScores,
  generateExploitationAngles,
  identifyVulnerabilities,
  type OceanScore,
  type OceanProfile,
  type FacetScores,
  type ExploitationAngle,
  type InfluenceVulnerability,
} from '../personality/oceanExtractor';

// ============================================
// Influence Orchestration
// ============================================
export {
  generatePlaybook,
  type CialdiniPrinciple,
  type PlaybookStep,
  type InfluencePlaybook,
  type ContactContext,
} from '../influence/principlePlaybookGenerator';

export {
  calculateTimingWindows,
  findNextGoldenMoment,
  isGoodTimeNow,
  buildTimingProfile,
  addLifeEvent,
  predictOptimalAskTiming,
  type TimingWindow,
  type ContactTimingProfile,
  type DayOfWeek,
  type EngagementPattern,
  type EmotionalCycle,
  type LifeEvent,
  type InfluenceContext,
} from '../influence/optimalTimingEngine';

// ============================================
// Deception Detection
// ============================================
export { 
  analyzeLinguisticDeception,
  analyzeFacialDeception,
  analyzeVocalDeception,
  type DeceptionIndicator,
  type DeceptionAnalysisResult,
  type VoiceStressMarker,
  type LinguisticMarker,
  type CrossModalConflict,
  type DeceptionTimelineEvent,
  type MicroExpression,
} from '../deception/deceptionAnalyzer';

// ============================================
// Financial Intelligence
// ============================================
export {
  estimateIncomeFromJob,
  estimateWealthTier,
  WEALTH_TIERS,
  type WealthTier,
  type WealthTierInfo,
  type ContactFinancialData,
  type FinancialIntelligenceResult,
  type FinancialVulnerabilityWindow,
  type FinancialOpportunityWindow,
  type EvidenceSource,
} from '../finance/wealthEstimator';

// ============================================
// Power Network Analysis
// ============================================
export {
  calculateDegreeCentrality,
  calculateBetweennessCentrality,
  calculateClosenessCentrality,
  calculatePageRank,
  calculateKatzCentrality,
  detectCommunities,
  findStructuralHoles,
  findShortestPath,
  calculatePowerScore,
  type NetworkNode,
  type NetworkEdge,
  type NetworkGraph,
  type CentralityScores,
  type PowerAnalysisResult,
} from '../network/powerAnalyzer';

// ============================================
// AGIS Phase 4: Neural-Behavioral Integration
// ============================================
export {
  analyzePupillometry,
  calibrateBaseline,
  analyzeTemporalPatterns,
  type PupillometricData,
  type PupilAnalysisConfig,
} from '../biometrics/pupillometryAnalyzer';

export {
  extractPulseSignal,
  processRPPGSignal,
  inferEmotionalStateFromHRV,
  type HRVMetrics,
  type RPPGSignal,
} from '../biometrics/hrvInference';

export {
  analyzeActionUnits,
  detectMicroExpressions,
  analyzeReliableMuscles,
  analyzeAsymmetry,
  detectDeceptionSignals,
  performFullAnalysis,
  type ActionUnit,
  type MicroExpression as BiometricMicroExpression,
  type DeceptionSignal,
  type ExpressionAnalysisResult,
  type ReliableMuscleIndicators,
  type AsymmetryAnalysis,
} from '../biometrics/microExpressionAnalyzer';

export {
  establishBaseline,
  analyzeMicroTremor,
  analyzeFormants,
  analyzeLinguistics,
  calculateDeceptionProbability,
  estimateAutonomicArousal,
  performVoiceAnalysis,
  type VoiceMetrics,
  type StressIndicators,
  type FormantAnalysis,
  type LinguisticIndicators,
  type DeceptionProbability,
  type VoiceAnalysisResult,
  type VoiceBaseline,
} from '../biometrics/voiceStressAnalyzer';

// ============================================
// AGIS Phase 5: Game Theory & Strategic Modeling
// ============================================
export {
  analyzeStrategicInteraction,
  analyzeRepeatedGame,
  type Player,
  type StrategyProfile,
  type GameOutcome,
  type StrategicInteraction,
  type MixedStrategy,
} from './gameTheoryEngine';

// ============================================
// AGIS Phase 8: Mobile Intelligence
// ============================================
export {
  mobileIntelligence,
  type AmbientAudioIntelligence,
  type ProximityIntelligence,
  type DigitalExhaustData,
  type MobileIntelligenceState,
} from '../mobile/mobileIntelligenceService';
