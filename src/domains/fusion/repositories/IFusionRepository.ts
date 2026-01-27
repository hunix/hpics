/**
 * IFusionRepository - Repository Interface for Fusion Domain (v3.9.0)
 * 
 * Defines the contract for data access operations related to fusion results
 * and digital twin management. Follows DDD repository pattern.
 */

import type { FusionResult, FusionEngineType } from '../entities/FusionResult';
import type { DigitalTwin, BehaviorPattern, SimulationScenario } from '../entities/DigitalTwin';

// ============================================
// Query Options
// ============================================

export interface FusionQueryOptions {
  profileId?: string;
  engineType?: FusionEngineType;
  limit?: number;
  orderBy?: 'created_at' | 'confidence';
  orderDirection?: 'asc' | 'desc';
  minConfidence?: number;
  maxAgeDays?: number;
}

export interface DigitalTwinQueryOptions {
  includeSimulations?: boolean;
  includePatterns?: boolean;
  onlyActive?: boolean;
}

// ============================================
// Analysis Type Mapping
// ============================================

/**
 * Maps FusionEngineType to unique analysis_type values stored in ai_analyses table.
 * Each engine MUST have a unique analysis_type for proper data isolation.
 */
export const FUSION_ANALYSIS_TYPES: Record<FusionEngineType, string> = {
  'temporal-fusion-transformer': 'temporal_fusion',
  'behavioral-digital-twin': 'behavioral_digital_twin',
  'graph-rag': 'graph_rag_synthesis',
  'shadow-network': 'shadow_network_analysis',
  'dempster-shafer': 'dempster_shafer_fusion',
  'counterfactual': 'counterfactual_reasoning',
  'pattern-of-life': 'pattern_of_life',
  'entity-resolution': 'entity_resolution',
  'sentiment-cascade': 'sentiment_cascade',
  // New fusion engines v5.0
  'biometric-behavioral': 'biometric_behavioral_fusion',
  'geospatial-communication': 'geospatial_communication_fusion',
  'financial-document': 'financial_document_synthesis',
  'calendar-pattern': 'calendar_pattern_analysis',
  // New v6.0 Advanced Intelligence engines
  'relationship-half-life': 'relationship_half_life',
  'automated-red-team': 'automated_red_team',
  'multi-party-deception': 'multi_party_deception',
  'zero-day-anomaly': 'zero_day_anomaly',
  'hypergame-theory': 'hypergame_theory',
  // v7.0 Extreme Intelligence Engines
  'subvocalization-detection': 'subvocalization_detection',
  'audio-burst-mental-state': 'audio_burst_mental_state',
  'iio-attribution': 'iio_attribution',
  'reflexive-control': 'reflexive_control',
  'cognitive-effect': 'cognitive_effect',
  'kallisti-theory-of-mind': 'kallisti_theory_of_mind',
  'magics-collective-behavior': 'magics_collective_behavior',
  'stylometric-authorship': 'stylometric_authorship',
  'dark2clear-deanonymization': 'dark2clear_deanonymization',
  'gated-biological-fusion': 'gated_biological_fusion',
  'tas-com-community': 'tas_com_community',
  'migration5-biometric': 'migration5_biometric',
  // v8.0 Phase 1 - Counter-Intelligence
  'draco-deception-orchestrator': 'draco_deception',
  'sentient-intent-analyzer': 'sentient_intent',
  'insider-threat-matrix': 'insider_threat_matrix',
  'bayesian-intention-predictor': 'bayesian_intention',
  'red-team-adversary-simulator': 'red_team_adversary',
  'semafor-forgery-detector': 'semafor_forgery',
  'epistemic-vulnerability-scanner': 'epistemic_vulnerability',
  'cognitive-iw-detector': 'cognitive_iw_detection',
  // v8.0 Phase 2 - Psychological Warfare
  'psychoagent-cascade-predictor': 'psychoagent_cascade',
  'affective-manipulation-detector': 'affective_manipulation',
  'hyperpersonalization-engine': 'hyperpersonalization',
  'computational-persuasion-engine': 'computational_persuasion',
  'synthetic-memory-generator': 'synthetic_memory',
  'premem-belief-modifier': 'premem_belief',
  'linguistic-stress-detector': 'linguistic_stress',
  'memory-anchor-generator': 'memory_anchor',
  'emotional-contagion-modeler': 'emotional_contagion',
  'sacred-value-predictor': 'sacred_value',
  // v8.0 Phase 3 - Biometric & Network
  'pupillometry-analyzer': 'pupillometry',
  'thermal-stress-detector': 'thermal_stress',
  'attention-multimodal-fuser': 'attention_multimodal',
  'keystroke-dynamics-analyzer': 'keystroke_dynamics',
  'sheaf-neural-influence-mapper': 'sheaf_neural_influence',
  'ctdg-link-predictor': 'ctdg_link_prediction',
  'cascade-virality-predictor': 'cascade_virality',
  'network-resilience-analyzer': 'network_resilience',
  'gaze-pattern-analyzer': 'gaze_pattern',
  'micro-expression-timeline': 'micro_expression_timeline',
  'voice-stress-correlator': 'voice_stress_correlation',
  'social-graph-predictor': 'social_graph_prediction',
  'behavioral-fingerprint-engine': 'behavioral_fingerprint',
  // v8.0 Phase 4 - Doctrine & Prediction
  'influence-campaign-optimizer': 'influence_campaign',
  'counter-narrative-generator': 'counter_narrative',
  'predictive-doctrine-engine': 'predictive_doctrine',
  'cognitive-defense-simulator': 'cognitive_defense',
  // v9.0 Warfare Engines
  'mice-recruitment': 'mice_recruitment',
  'betrayal-likelihood': 'betrayal_likelihood',
  'semantic-warfare': 'semantic_warfare',
  'memetic-propagation': 'memetic_propagation',
  'sacred-values': 'sacred_values',
  'elicitation': 'elicitation_guide',
  'cognitive-warfare': 'cognitive_warfare',
  'gottman-relationship': 'gottman_relationship',
};

/**
 * Reverse mapping: analysis_type -> FusionEngineType
 */
export const ANALYSIS_TYPE_TO_ENGINE: Record<string, FusionEngineType> = Object.fromEntries(
  Object.entries(FUSION_ANALYSIS_TYPES).map(([engine, type]) => [type, engine as FusionEngineType])
);

// ============================================
// IFusionRepository Interface
// ============================================

export interface IFusionRepository {
  /**
   * Find all fusion results for a user
   */
  findAll(userId: string, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find fusion results for a specific profile
   */
  findByProfile(userId: string, profileId: string, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find fusion results by engine type
   */
  findByEngine(userId: string, engineType: FusionEngineType, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find the latest result for a specific engine and profile
   */
  findLatestByEngine(userId: string, profileId: string, engineType: FusionEngineType): Promise<FusionResult | null>;

  /**
   * Find a single fusion result by ID
   */
  findById(userId: string, resultId: string): Promise<FusionResult | null>;

  /**
   * Save a fusion result
   */
  save(result: FusionResult): Promise<FusionResult>;

  /**
   * Delete a fusion result
   */
  delete(userId: string, resultId: string): Promise<boolean>;

  /**
   * Count fusion results by engine for a profile
   */
  countByEngine(userId: string, profileId: string): Promise<Map<FusionEngineType, number>>;

  /**
   * Check if any engine results are stale (older than maxAgeDays)
   */
  findStaleEngines(userId: string, profileId: string, maxAgeDays: number): Promise<FusionEngineType[]>;
}

// ============================================
// IDigitalTwinRepository Interface
// ============================================

export interface IDigitalTwinRepository {
  /**
   * Find a digital twin by profile ID
   */
  findByProfile(userId: string, profileId: string, options?: DigitalTwinQueryOptions): Promise<DigitalTwin | null>;

  /**
   * Find all digital twins for a user
   */
  findAll(userId: string, options?: DigitalTwinQueryOptions): Promise<DigitalTwin[]>;

  /**
   * Find a digital twin by ID
   */
  findById(userId: string, twinId: string): Promise<DigitalTwin | null>;

  /**
   * Save or update a digital twin
   */
  save(twin: DigitalTwin): Promise<DigitalTwin>;

  /**
   * Delete a digital twin
   */
  delete(userId: string, twinId: string): Promise<boolean>;

  /**
   * Add behavior patterns to a twin
   */
  addPatterns(userId: string, twinId: string, patterns: BehaviorPattern[]): Promise<DigitalTwin | null>;

  /**
   * Add a simulation scenario to a twin's history
   */
  addSimulation(userId: string, twinId: string, scenario: SimulationScenario): Promise<DigitalTwin | null>;

  /**
   * Deactivate a digital twin
   */
  deactivate(userId: string, twinId: string): Promise<boolean>;
}
