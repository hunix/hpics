/**
 * Dark Psychology Library Index
 * 
 * Centralized exports for dark psychology detection and analysis.
 */

export {
  // Core Types
  type DarkTetradProfile,
  type TraitScore,
  type SubtraitScore,
  type BehavioralMarker,
  type MarkerType,
  type LinguisticIndicator,
  type DarkTrait,
  type RiskLevel,
  type ManipulationStyle,
  type ManipulationType,
  type ManipulationTactic,
  type TargetProfile,
  type TraitVulnerability,
  type ExploitationVector,
  
  // Machiavellianism
  type MachiavellianismMarkers,
  analyzeMachiavellianism,
  
  // Narcissism
  type NarcissismMarkers,
  analyzeNarcissism,
  
  // Psychopathy
  type PsychopathyMarkers,
  analyzePsychopathy,
  
  // Sadism
  type SadismMarkers,
  analyzeSadism,
  
  // Coercive Control
  type CoerciveControlAnalysis,
  type ControlTactic,
  type ControlType,
  type AbusePhase,
  detectCoerciveControl,
  
  // Full Profile
  generateDarkTetradProfile
} from './darkTetradProfiler';
