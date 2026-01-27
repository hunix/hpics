/**
 * Warfare Library Index (v9.0)
 * Centralized exports for warfare engines and utilities
 * 
 * This barrel file provides clean imports for all warfare-related modules:
 * import { calculateMICEVulnerability, GOTTMAN_HORSEMEN } from '@/lib/warfare';
 */

// MICE Analyzer - CIA-style vulnerability assessment
export {
  calculateMICEVulnerability,
  determineOptimalApproach,
  MICE_WEIGHTS,
  APPROACH_EFFECTIVENESS,
  type MICEProfile,
  type MoneyVulnerability,
  type IdeologyAlignment,
  type CompromiseMaterial,
  type EgoNeeds,
  type RecruitmentApproach,
  type CompromiseCategory,
} from './miceAnalyzer';

// Betrayal Predictor - Trust network modeling
export {
  calculateDefectionProbability,
  identifyWarningSignals,
  generateMitigationStrategies,
  calculateTrustTrajectory,
  predictCrisisWindow,
  calculateTrustHalfLife,
  projectTrustDecay,
  calculateReinforcementImpact,
  GOTTMAN_HORSEMEN,
  TRUST_DECAY_FACTORS,
  LOYALTY_BINDING_FACTORS,
  RELATIONSHIP_HALF_LIVES,
  type BetrayalProfile,
  type TrustTrajectoryPoint,
  type CrisisWindow,
  type LoyaltyIndicator,
  type WarningSignal,
  type RiskMitigation,
  type HalfLifeProjection,
} from './betrayalPredictor';

// Semantic Warfare Engine - Term warfare and definition control
export {
  calculateSemanticShift,
  generateFramingAlternatives,
  evaluateOvertonPosition,
  planOvertonShift,
  OVERTON_POSITIONS,
  SEMANTIC_TECHNIQUES,
  type TermDefinition,
  type FramingStrategy,
  type SemanticOperation,
} from './semanticWarfareEngine';

// Memetic Propagation Engine - Viral idea engineering
export {
  calculateSIRDynamics,
  calculateR0,
  evaluateMemeticFitness,
  identifySeedNodes,
  predictCampaignTrajectory,
  MEMETIC_FITNESS_FACTORS,
  EMOTION_VIRALITY,
  type Meme,
  type EmotionalPayload,
  type MemeticCampaign,
  type PropagationModel,
  type CampaignMetrics,
} from './memeticPropagationEngine';

// Sacred Values Mapper - Non-negotiable beliefs for tribal activation
export {
  identifySacredValues,
  generateManipulationVectors,
  calculateMoralFoundations,
  MORAL_FOUNDATIONS,
  SACRED_VALUE_CHARACTERISTICS,
  type SacredValue,
  type ValueDomain,
  type ViolationResponse,
  type SacredValuesProfile,
  type MoralFoundationScores,
  type TribalIdentity,
  type ManipulationVector,
} from './sacredValuesMapper';

// Elicitation Techniques - FBI conversational extraction methods
export {
  selectOptimalTechnique,
  generateConversationStarter,
  FBI_ELICITATION_TECHNIQUES,
  type ElicitationTechnique,
  type ElicitationSession,
  type ExtractedInfo,
} from './elicitationTechniques';

// Re-export remaining warfare modules (types/constants only where applicable)
// These modules export their own types - import directly for full access
export * from './opsecVulnerabilityFramework';
export * from './socialEngineeringPatterns';
export * from './lawfareDefensePlaybook';
export * from './reputationDefenseProtocols';
export * from './familyProtectionMatrix';
export * from './crisisResponsePlaybooks';
export * from './behavioralAnomalyPatterns';
export * from './economicWarfareIndicators';
export * from './technicalCountermeasures';
