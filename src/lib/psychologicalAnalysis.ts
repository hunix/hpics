// Deep Psychological Intelligence System - Type Definitions

// ============================================
// Big Five (OCEAN) Personality Model
// ============================================

export interface PersonalityFacet {
  score: number; // 0-100
  confidence: number; // 0-100
  evidence: string[];
}

export interface OceanTrait {
  score: number; // 0-100
  confidence: number; // 0-100
  evidence_count: number;
  sub_facets: Record<string, PersonalityFacet>;
}

export interface PersonalityOcean {
  openness: OceanTrait & {
    sub_facets: {
      fantasy: PersonalityFacet;
      aesthetics: PersonalityFacet;
      feelings: PersonalityFacet;
      actions: PersonalityFacet;
      ideas: PersonalityFacet;
      values: PersonalityFacet;
    };
  };
  conscientiousness: OceanTrait & {
    sub_facets: {
      competence: PersonalityFacet;
      order: PersonalityFacet;
      dutifulness: PersonalityFacet;
      achievement_striving: PersonalityFacet;
      self_discipline: PersonalityFacet;
      deliberation: PersonalityFacet;
    };
  };
  extraversion: OceanTrait & {
    sub_facets: {
      warmth: PersonalityFacet;
      gregariousness: PersonalityFacet;
      assertiveness: PersonalityFacet;
      activity: PersonalityFacet;
      excitement_seeking: PersonalityFacet;
      positive_emotions: PersonalityFacet;
    };
  };
  agreeableness: OceanTrait & {
    sub_facets: {
      trust: PersonalityFacet;
      straightforwardness: PersonalityFacet;
      altruism: PersonalityFacet;
      compliance: PersonalityFacet;
      modesty: PersonalityFacet;
      tender_mindedness: PersonalityFacet;
    };
  };
  neuroticism: OceanTrait & {
    sub_facets: {
      anxiety: PersonalityFacet;
      angry_hostility: PersonalityFacet;
      depression: PersonalityFacet;
      self_consciousness: PersonalityFacet;
      impulsiveness: PersonalityFacet;
      vulnerability: PersonalityFacet;
    };
  };
}

// ============================================
// Dark Triad
// ============================================

export interface DarkTriadTrait {
  score: number; // 0-100
  confidence: number; // 0-100
  indicators: string[];
  behavioral_manifestations: string[];
}

export interface DarkTriad {
  narcissism: DarkTriadTrait;
  machiavellianism: DarkTriadTrait;
  psychopathy: DarkTriadTrait;
  overall_risk_level: 'low' | 'moderate' | 'elevated' | 'high';
}

// ============================================
// Attachment Style
// ============================================

export type AttachmentStyleType = 'secure' | 'anxious' | 'avoidant' | 'disorganized';

export interface AttachmentStyle {
  primary_style: AttachmentStyleType;
  security_score: number; // 0-100
  anxiety_score: number; // 0-100
  avoidance_score: number; // 0-100
  evidence: string[];
  relationship_patterns: string[];
  recommended_approach: string;
}

// ============================================
// Emotional Intelligence
// ============================================

export interface EQDimension {
  score: number; // 0-100
  confidence: number; // 0-100
  strengths: string[];
  growth_areas: string[];
  evidence: string[];
}

export interface EmotionalIntelligence {
  overall_eq: number;
  self_awareness: EQDimension;
  self_regulation: EQDimension;
  motivation: EQDimension;
  empathy: EQDimension;
  social_skills: EQDimension;
}

// ============================================
// Cognitive Profile
// ============================================

export type ThinkingStyle = 'analytical' | 'intuitive' | 'pragmatic' | 'creative' | 'balanced';
export type DecisionMakingStyle = 'deliberate' | 'impulsive' | 'consultative' | 'autonomous';
export type RiskTolerance = 'risk_averse' | 'conservative' | 'moderate' | 'aggressive' | 'reckless';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing' | 'mixed';
export type TimeOrientation = 'past_focused' | 'present_focused' | 'future_focused' | 'balanced';

export interface CognitiveProfile {
  thinking_style: {
    primary: ThinkingStyle;
    confidence: number;
    evidence: string[];
  };
  decision_making: {
    style: DecisionMakingStyle;
    speed: 'slow' | 'moderate' | 'fast';
    confidence: number;
  };
  risk_tolerance: {
    level: RiskTolerance;
    financial: RiskTolerance;
    social: RiskTolerance;
    confidence: number;
  };
  learning_style: {
    primary: LearningStyle;
    adaptability: number; // 0-100
  };
  complexity_handling: {
    comfort_level: number; // 0-100
    ambiguity_tolerance: number; // 0-100
  };
  time_orientation: {
    primary: TimeOrientation;
    planning_horizon: 'short' | 'medium' | 'long';
  };
}

// ============================================
// Communication DNA
// ============================================

export type CommunicationStyle = 'assertive' | 'passive' | 'aggressive' | 'passive_aggressive' | 'manipulative';
export type ConflictStyle = 'competing' | 'avoiding' | 'accommodating' | 'collaborating' | 'compromising';

export interface CommunicationDNA {
  primary_style: CommunicationStyle;
  conflict_style: ConflictStyle;
  influence_tactics: string[];
  persuasion_susceptibility: {
    emotional_appeals: number; // 0-100
    logical_arguments: number;
    social_proof: number;
    authority: number;
    reciprocity: number;
    scarcity: number;
  };
  listening_quality: number; // 0-100
  assertiveness: number; // 0-100
  directness: number; // 0-100
  emotional_expressiveness: number; // 0-100
  preferred_channels: string[];
  response_time_pattern: string;
}

// ============================================
// Psychiatric Indicators (Screening Only)
// ============================================

export interface PsychiatricMarker {
  indicator_level: 'none' | 'minimal' | 'mild' | 'moderate' | 'significant';
  confidence: number;
  observed_patterns: string[];
  disclaimer: string;
}

export interface PsychiatricIndicators {
  anxiety_markers: PsychiatricMarker;
  depression_indicators: PsychiatricMarker;
  stress_vulnerability: PsychiatricMarker;
  emotional_dysregulation: PsychiatricMarker;
  trauma_indicators: PsychiatricMarker;
  overall_mental_wellness: number; // 0-100
  professional_referral_suggested: boolean;
  disclaimer: string;
}

// ============================================
// Deception & Authenticity Analysis
// ============================================

export interface DeceptionAnalysis {
  authenticity_score: number; // 0-100, higher = more authentic
  consistency_score: number; // 0-100
  deception_patterns: {
    frequency: 'rare' | 'occasional' | 'frequent';
    types: string[];
    trigger_topics: string[];
  };
  topic_sensitivities: Array<{
    topic: string;
    sensitivity_level: 'low' | 'moderate' | 'high';
    indicators: string[];
  }>;
  baseline_established: boolean;
  anomalies_detected: string[];
}

// ============================================
// Behavioral Predictions
// ============================================

export interface Prediction {
  score: number; // 0-100
  confidence: number; // 0-100
  factors: string[];
  timeframe: string;
}

export interface BehavioralPredictions {
  reliability_forecast: Prediction & {
    commitment_follow_through: number;
    punctuality: number;
    promise_keeping: number;
  };
  conflict_probability: Prediction & {
    likely_triggers: string[];
    escalation_risk: 'low' | 'moderate' | 'high';
    de_escalation_strategies: string[];
  };
  engagement_trend: Prediction & {
    trajectory: 'declining' | 'stable' | 'growing';
    investment_level: 'low' | 'moderate' | 'high';
    reciprocity_balance: number; // -100 to 100, 0 = balanced
  };
  crisis_response: {
    predicted_behavior: string;
    support_seeking: 'low' | 'moderate' | 'high';
    resilience_level: number;
    recommended_support_approach: string;
  };
}

// ============================================
// Flags System
// ============================================

export interface Flag {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number; // 0-100
  evidence: string[];
  first_detected: string;
  still_active: boolean;
  recommended_action: string;
  category: string;
}

export interface Certainty {
  id: string;
  statement: string;
  confidence: number; // Must be >90
  evidence_sources: string[];
  consistency_over_time: boolean;
  cross_validated: boolean;
}

export interface FlagsSystem {
  red_flags: Flag[];
  yellow_flags: Flag[];
  green_flags: Flag[];
  certainties: Certainty[];
  last_updated: string;
}

// ============================================
// Action Plans
// ============================================

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'communication' | 'relationship' | 'safety' | 'opportunity' | 'maintenance';
  specific_scripts?: string[];
  timing_recommendation: string;
  expected_outcome: string;
  risk_if_ignored: string;
}

export interface ActionPlans {
  immediate: ActionItem[]; // This week
  short_term: ActionItem[]; // This month
  long_term: ActionItem[]; // Quarter+
  do_not_do: Array<{
    action: string;
    reason: string;
    severity: 'caution' | 'warning' | 'critical';
  }>;
  conversation_scripts: Array<{
    scenario: string;
    opening: string;
    key_points: string[];
    phrases_to_avoid: string[];
    expected_response: string;
  }>;
}

// ============================================
// Relationship Dynamics
// ============================================

export interface RelationshipDynamics {
  power_balance: {
    score: number; // -100 to 100, 0 = balanced
    dominant_party: 'self' | 'them' | 'balanced';
    areas_of_dominance: string[];
  };
  trust_level: {
    score: number; // 0-100
    trajectory: 'declining' | 'stable' | 'growing';
    trust_builders: string[];
    trust_breakers: string[];
  };
  investment_asymmetry: {
    score: number; // -100 to 100, 0 = balanced
    your_investment: number;
    their_investment: number;
    recommendation: string;
  };
  growth_potential: {
    score: number; // 0-100
    limiting_factors: string[];
    growth_opportunities: string[];
    optimal_trajectory: string;
  };
  compatibility_analysis: {
    overall_score: number;
    personality_fit: number;
    values_alignment: number;
    communication_compatibility: number;
    lifestyle_compatibility: number;
  };
}

// ============================================
// Values Profile (Schwartz)
// ============================================

export interface ValueDimension {
  score: number; // 0-100
  priority_rank: number; // 1-10
  evidence: string[];
}

export interface ValuesProfile {
  self_direction: ValueDimension;
  stimulation: ValueDimension;
  hedonism: ValueDimension;
  achievement: ValueDimension;
  power: ValueDimension;
  security: ValueDimension;
  conformity: ValueDimension;
  tradition: ValueDimension;
  benevolence: ValueDimension;
  universalism: ValueDimension;
  core_values_summary: string[];
  value_conflicts: string[];
}

// ============================================
// Data Sources Tracking
// ============================================

export interface DataSourcesUsed {
  messages: { count: number; date_range: { start: string; end: string } };
  media: { count: number; types: string[] };
  voice_recordings: { count: number; total_duration_minutes: number };
  documents: { count: number; types: string[] };
  behavioral_analyses: { count: number };
  facial_analyses: { count: number };
  vocal_analyses: { count: number };
  body_language_analyses: { count: number };
  observations: { count: number };
  communications: { count: number };
  relationships: { count: number };
}

// ============================================
// Complete Psychological Profile
// ============================================

export interface PsychologicalProfile {
  id: string;
  profile_id: string;
  user_id: string;
  
  // Core personality
  personality_ocean: PersonalityOcean | null;
  dark_triad: DarkTriad | null;
  hexaco_honesty_humility: OceanTrait | null;
  attachment_style: AttachmentStyle | null;
  emotional_intelligence: EmotionalIntelligence | null;
  cognitive_profile: CognitiveProfile | null;
  communication_dna: CommunicationDNA | null;
  
  // Risk & authenticity
  psychiatric_indicators: PsychiatricIndicators | null;
  deception_analysis: DeceptionAnalysis | null;
  
  // Predictions & strategy
  behavioral_predictions: BehavioralPredictions | null;
  flags: FlagsSystem | null;
  action_plans: ActionPlans | null;
  
  // Relationship specific
  relationship_dynamics: RelationshipDynamics | null;
  values_profile: ValuesProfile | null;
  
  // Meta
  confidence_score: number;
  data_completeness: number;
  data_sources_used: DataSourcesUsed | null;
  last_analysis_at: string;
  analysis_version: string;
  analysis_model: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// Analysis Request/Response Types
// ============================================

export interface DeepAnalysisRequest {
  profile_id: string;
  analysis_depth: 'quick' | 'standard' | 'comprehensive';
  focus_areas?: string[];
  include_predictions?: boolean;
  include_action_plans?: boolean;
  model_preference?: string;
}

export interface DeepAnalysisResponse {
  success: boolean;
  profile: PsychologicalProfile | null;
  is_new: boolean;
  changes_from_previous?: string[];
  error?: string;
}

// ============================================
// UI Display Helpers
// ============================================

export const TRAIT_COLORS = {
  openness: 'hsl(var(--chart-1))',
  conscientiousness: 'hsl(var(--chart-2))',
  extraversion: 'hsl(var(--chart-3))',
  agreeableness: 'hsl(var(--chart-4))',
  neuroticism: 'hsl(var(--chart-5))',
} as const;

export const FLAG_COLORS = {
  red: 'hsl(var(--destructive))',
  yellow: 'hsl(45 93% 47%)',
  green: 'hsl(142 76% 36%)',
} as const;

export const CONFIDENCE_THRESHOLDS = {
  low: 50,
  moderate: 70,
  high: 85,
  very_high: 95,
} as const;

export function getConfidenceLabel(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.very_high) return 'Very High';
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'High';
  if (confidence >= CONFIDENCE_THRESHOLDS.moderate) return 'Moderate';
  if (confidence >= CONFIDENCE_THRESHOLDS.low) return 'Low';
  return 'Insufficient Data';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= CONFIDENCE_THRESHOLDS.high) return 'text-green-500';
  if (confidence >= CONFIDENCE_THRESHOLDS.moderate) return 'text-yellow-500';
  return 'text-red-500';
}

export function formatTraitScore(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low';
  return 'Very Low';
}

export function getRiskLevel(score: number): 'low' | 'moderate' | 'elevated' | 'high' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'elevated';
  if (score >= 25) return 'moderate';
  return 'low';
}
