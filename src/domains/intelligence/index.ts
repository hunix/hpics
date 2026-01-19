/**
 * Intelligence Domain
 * 
 * Public API for the Intelligence bounded context.
 * All external access to intelligence functionality should go through this module.
 */

// Entities
export { 
  Analysis, 
  type AnalysisType, 
  type AnalysisStatus, 
  type AnalysisResult, 
  type AnalysisMetadata 
} from './entities/Analysis';

export { 
  Dossier, 
  type DossierTemplate, 
  type DossierStatus, 
  type RiskLevel,
  type DossierSection,
  type ExecutiveSummary,
  type ThreatAssessment,
} from './entities/Dossier';

export { 
  Insight, 
  type InsightCategory, 
  type InsightPriority, 
  type InsightActionability,
  type InsightEvidence,
} from './entities/Insight';

// Services
export {
  IntelligenceService,
  getIntelligenceService,
  type AnalysisRequest,
  type DossierRequest,
  type IntelligenceSummary,
} from './services/IntelligenceService';

// Events
export {
  AnalysisCompleted,
  AnalysisFailed,
  DossierGenerated,
  DossierRefreshed,
  InsightDiscovered,
  RiskLevelChanged,
  IntelligenceAggregated,
  AnomalyDetected,
} from './events/IntelligenceEvents';

// Hooks
export {
  useAnalysis,
  useDossier,
  useInsights,
  useIntelligenceSummary,
  useIntelligenceAggregation,
  useIntelligence,
} from './hooks/useIntelligenceService';
