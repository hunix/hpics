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

// Warfare defense modules - import directly from individual files for full access
// These are listed here for discoverability but should be imported from their own files
export type { OPSECVulnerability, OPSECCategory, DigitalFootprintItem, MetadataLeakage, CorrelationVector } from './opsecVulnerabilityFramework';
export { calculateOPSECScore, OPSEC_FIVE_STEPS, DIGITAL_FOOTPRINT_CATEGORIES, METADATA_LEAKAGE_PATTERNS, COMMON_CORRELATION_ATTACKS, DATA_BROKER_OPTOUT_LIST } from './opsecVulnerabilityFramework';

export type { SEAttackPattern, SECategory } from './socialEngineeringPatterns';
export { detectSEPatterns, SE_ATTACK_PATTERNS, URGENCY_INDICATORS, AUTHORITY_INDICATORS, FEAR_INDICATORS, RECIPROCITY_INDICATORS } from './socialEngineeringPatterns';

export type { LegalThreatPattern, LegalThreatCategory, CostEstimate, EvidencePreservationProtocol, CounterDocumentationItem, JurisdictionFactors } from './lawfareDefensePlaybook';
export { generateCounterTimeline, SLAPP_INDICATORS, LEGAL_THREAT_PATTERNS, EVIDENCE_PRESERVATION_PROTOCOLS, US_JURISDICTION_ANALYSIS, EXPERT_WITNESS_NEEDS } from './lawfareDefensePlaybook';

export type { ReputationThreat, ReputationThreatType, SourcePattern, NarrativeDefense, MessagingTemplate } from './reputationDefenseProtocols';
export { BOT_NETWORK_INDICATORS, CIB_DETECTION_FRAMEWORK, REPUTATION_THREATS, NARRATIVE_DEFENSE_STRATEGIES, SENTIMENT_ALERT_THRESHOLDS, PLATFORM_ABUSE_REPORTING } from './reputationDefenseProtocols';

export type { ProtectedPerson, ProtectedRelationship, AgeCategory, Vulnerability, VulnerabilityType, ProtectionProtocol, ProtocolCategory, EmergencyContact, DigitalExposure, SocialMediaPresence } from './familyProtectionMatrix';
export { calculateFamilyRiskScore, RISK_ASSESSMENT_FACTORS, PROTECTION_PROTOCOLS, FAMILY_THREAT_SCENARIOS, AGE_APPROPRIATE_MEASURES, DIGITAL_EXPOSURE_CHECKLIST } from './familyProtectionMatrix';
export type { RiskLevel as FamilyRiskLevel } from './familyProtectionMatrix';

export type { CrisisPlaybook, CrisisCategory, PlaybookAction, StakeholderNotification, TimelinePhase } from './crisisResponsePlaybooks';
export { OODA_LOOP, CRISIS_SEVERITY_MATRIX, CRISIS_PLAYBOOKS, ESCALATION_LEVELS, COUNTERMEASURE_TYPES } from './crisisResponsePlaybooks';

export type { BehavioralBaseline, BaselineType, AnomalyDetection, SessionAnomaly, AnomalyScoreInput, BaselineBuilderConfig } from './behavioralAnomalyPatterns';
export { calculateZScore, isAnomaly, calculateAnomalyRiskScore, determineAnomalySeverity, buildBaseline, DEFAULT_BASELINE_CONFIG, KEYSTROKE_DYNAMICS, MOUSE_MOVEMENT_PATTERNS, SESSION_PATTERNS, DEVICE_USAGE_PATTERNS, COMMUNICATION_PATTERNS, FINANCIAL_PATTERNS } from './behavioralAnomalyPatterns';

export type { EconomicThreat, EconomicThreatType, AssetCategory, FinancialRedFlag, AssetProtectionStrategy, FinancialHealthIndicator } from './economicWarfareIndicators';
export { ECONOMIC_THREATS, FINANCIAL_RED_FLAGS, ASSET_PROTECTION_STRATEGIES, PARTNER_FINANCIAL_HEALTH, INVESTMENT_SCAM_PATTERNS } from './economicWarfareIndicators';

export type { TSCMSweepResult, TSCMSweepType, TSCMAnomaly, CompromiseIndicator, CompromiseCategory as TSCMCompromiseCategory, NetworkAnomaly } from './technicalCountermeasures';
export { calculateCompromiseRiskScore, MOBILE_COMPROMISE_INDICATORS, COMPUTER_COMPROMISE_INDICATORS, CLOUD_COMPROMISE_INDICATORS, NETWORK_ANOMALY_PATTERNS, KEYLOGGER_DETECTION, SPYWARE_CATEGORIES, DEVICE_SECURITY_AUDIT, SECURE_COMMS_RECOMMENDATIONS } from './technicalCountermeasures';
