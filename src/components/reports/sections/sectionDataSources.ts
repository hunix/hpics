/**
 * Section Data Sources Mapping (v5.7)
 * Maps section IDs to their data sources for availability checking
 * 
 * v5.7: Re-mapped 30+ sections to existing analysis_types from the 40-task generation
 *       This ensures sections show as enabled when related analysis data exists
 * v5.6: Added bidirectional/user_only check types for special tables
 * v5.5: Complete analysis_type alignment with edge function outputs
 */

export interface SectionDataSource {
  /** Type of data source */
  type: 'profile' | 'ai_analyses' | 'table' | 'multiple';
  /** For ai_analyses: the analysis_type to check */
  analysisType?: string;
  /** For table: the table name to query */
  table?: string;
  /** Column to match (defaults to profile_id) */
  keyColumn?: 'profile_id' | 'user_id';
  /** If true, section is always available (based on profile data) */
  alwaysAvailable?: boolean;
  /** Multiple sources to check (for composite sections) */
  sources?: Array<{ type: 'ai_analyses' | 'table'; analysisType?: string; table?: string }>;
  /** Special check type for tables with non-standard key columns */
  checkType?: 'bidirectional' | 'user_only' | 'skip';
  /** For bidirectional: alternative key columns */
  altKeyColumns?: string[];
}

/**
 * Complete mapping of all sections to their data sources
 * v5.7: Remapped sections to use existing analysis_types from the 40-task generation
 * IMPORTANT: analysisType values MUST match what edge functions store in ai_analyses table
 */
export const SECTION_DATA_SOURCES: Record<string, SectionDataSource> = {
  // ============== CORE SECTIONS (7) ==============
  executive: { type: 'profile', alwaysAvailable: true },
  sourceDashboard: { type: 'profile', alwaysAvailable: true },
  overview: { type: 'profile', alwaysAvailable: true },
  behavioralDna: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  // REMAPPED: pattern_of_life → behavioral_dna (contains pattern data)
  patternOfLife: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  relationshipEcosystem: { type: 'table', table: 'contact_relationships', checkType: 'bidirectional', altKeyColumns: ['from_profile_id', 'to_profile_id'] },
  timeline: { type: 'table', table: 'contact_interaction_notes' },

  // ============== INTELLIGENCE SECTIONS (16) ==============
  psychological: { type: 'table', table: 'psychological_profiles' },
  quantumCognition: { type: 'ai_analyses', analysisType: 'quantum_cognition' },
  // REMAPPED: relationship_dynamics → relationship_score
  relationship: { type: 'ai_analyses', analysisType: 'relationship_score' },
  playbook: { type: 'ai_analyses', analysisType: 'playbook' },
  // REMAPPED: hypnotic_patterns → narrative_control
  hypnoticPatterns: { type: 'ai_analyses', analysisType: 'narrative_control' },
  // REMAPPED: elicitation_guide → playbook
  elicitation: { type: 'ai_analyses', analysisType: 'playbook' },
  // REMAPPED: cognitive_load → cognitive_warfare
  cognitiveLoad: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  mediaIntel: { type: 'ai_analyses', analysisType: 'aggregate_intelligence' },
  voiceIntel: { type: 'table', table: 'voice_recording_sessions' },
  deceptionAnalysis: { type: 'ai_analyses', analysisType: 'enhanced_deception_detection' },
  actionPlans: { type: 'table', table: 'action_recommendations' },
  attachmentVulnerability: { type: 'ai_analyses', analysisType: 'attachment_vulnerability' },
  narrativeControl: { type: 'ai_analyses', analysisType: 'narrative_control' },
  // REMAPPED: mice_recruitment → mice_assessment (what edge function stores)
  miceRecruitment: { type: 'ai_analyses', analysisType: 'mice_assessment' },
  influenceProfile: { type: 'ai_analyses', analysisType: 'influence_profile' },
  powerNetwork: { type: 'ai_analyses', analysisType: 'power_network' },

  // ============== WARFARE SECTIONS (33+) ==============
  mice: { type: 'table', table: 'mice_assessments' },
  cialdini: { type: 'table', table: 'contact_influence_profiles' },
  // REMAPPED: sacred_values → existential_leverage
  sacredValues: { type: 'ai_analyses', analysisType: 'existential_leverage' },
  // REMAPPED: reality_consensus → cognitive_warfare
  realityTesting: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  // REMAPPED: identity_destabilization → manipulation_susceptibility
  identityDestab: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  influence: { type: 'table', table: 'contact_influence_profiles' },
  trauma: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  // REMAPPED: semantic_warfare → narrative_control
  semanticWarfare: { type: 'ai_analyses', analysisType: 'narrative_control' },
  memeticPropagation: { type: 'ai_analyses', analysisType: 'memetic_propagation' },
  futureModeling: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  precognitive: { type: 'ai_analyses', analysisType: 'precognitive_patterns' },
  // REMAPPED: cross_modal_synthesis → mosaic_intelligence_fusion
  crossModal: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  // REMAPPED: choice_architecture → manipulation_susceptibility
  choiceArchitecture: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  // REMAPPED: betrayal_prediction → trauma_exploitation
  betrayal: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  // REMAPPED: influence_operations → influence_profile
  influenceOps: { type: 'ai_analyses', analysisType: 'influence_profile' },
  threatActor: { type: 'table', table: 'threat_actor_profiles' },
  cognitiveWarfare: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  // REMAPPED: deception_operations → enhanced_deception_detection
  deceptionOps: { type: 'ai_analyses', analysisType: 'enhanced_deception_detection' },
  // REMAPPED: vulnerability_windows → trauma_exploitation
  vulnerabilityWindows: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  activeDefense: { type: 'table', table: 'active_defense_operations' },
  trustTrajectory: { type: 'table', table: 'trust_trajectory_forecasts' },
  mosaicFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  // REMAPPED: dark_tetrad → manipulation_susceptibility
  darkTetrad: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  // REMAPPED: shadow_network → network_exploitation
  shadowNetwork: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  // REMAPPED: sentiment_cascade → sentiment
  sentimentCascade: { type: 'ai_analyses', analysisType: 'sentiment' },
  
  // Sections mapped to actual edge function outputs
  manipulationSusceptibility: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  coercionResistance: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  existentialLeverage: { type: 'ai_analyses', analysisType: 'existential_leverage' },
  networkExploitation: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  deepIntelligence: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  personalityProfile: { type: 'ai_analyses', analysisType: 'personality' },
  sentimentAnalysis: { type: 'ai_analyses', analysisType: 'sentiment' },
  relationshipScore: { type: 'ai_analyses', analysisType: 'relationship_score' },
  intelligenceDossier: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  
  // Advanced convergence sections - REMAPPED to existing analysis types
  // REMAPPED: omega_point → deep_intelligence_comprehensive
  omegaPoint: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  // REMAPPED: mass_formation → social_engineering
  massFormation: { type: 'ai_analyses', analysisType: 'social_engineering' },
  // REMAPPED: morphic_resonance → quantum_cognition
  morphicResonance: { type: 'ai_analyses', analysisType: 'quantum_cognition' },
  // REMAPPED: network_graph → network_exploitation
  networkGraph: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  // REMAPPED: omniscient_orchestration → intelligence_dossier
  omniscientOrchestration: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  // REMAPPED: unified_fusion → mosaic_intelligence_fusion
  unifiedFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  // REMAPPED: full_dossier → intelligence_dossier
  fullDossier: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  aggregateIntelligence: { type: 'ai_analyses', analysisType: 'aggregate_intelligence' },
  
  // Defense Operations - mapped to existing analysis types
  opsecAssessment: { type: 'ai_analyses', analysisType: 'opsec_assessment' },
  socialEngineering: { type: 'ai_analyses', analysisType: 'social_engineering' },
  crisisResponse: { type: 'ai_analyses', analysisType: 'crisis_response' },
  lawfareDefense: { type: 'ai_analyses', analysisType: 'lawfare_defense' },
  reputationDefense: { type: 'ai_analyses', analysisType: 'reputation_defense' },
  familyProtection: { type: 'ai_analyses', analysisType: 'family_protection' },
  economicWarfare: { type: 'ai_analyses', analysisType: 'economic_warfare' },
  tscmSweep: { type: 'ai_analyses', analysisType: 'tscm_sweep' },
  digitalFootprint: { type: 'ai_analyses', analysisType: 'digital_footprint' },
  behavioralBaseline: { type: 'ai_analyses', analysisType: 'behavioral_baseline' },

  // ============== ANALYSIS SECTIONS (8) ==============
  analysis: { type: 'table', table: 'behavioral_analyses' },
  trust: { type: 'table', table: 'trust_assessments' },
  // REMAPPED: influence_resistance → coercion_resistance
  influenceResistance: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  // REMAPPED: behavioral_economics → economic_warfare
  behavioralEconomics: { type: 'ai_analyses', analysisType: 'economic_warfare' },
  // REMAPPED: network_position → network_exploitation
  network: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  predictionAccuracy: { type: 'table', table: 'prediction_accuracy_logs', keyColumn: 'user_id', checkType: 'user_only' },
  counterIntel: { type: 'ai_analyses', analysisType: 'counter_intelligence' },
  proportionalResponse: { type: 'table', table: 'proportional_response_logs', keyColumn: 'user_id', checkType: 'user_only' },

  // ============== DATA FUSION SECTIONS (9) ==============
  temporalFusion: { type: 'ai_analyses', analysisType: 'temporal_fusion' },
  // REMAPPED: digital_twin → behavioral_baseline
  digitalTwin: { type: 'ai_analyses', analysisType: 'behavioral_baseline' },
  // REMAPPED: graph_rag → deep_intelligence_comprehensive
  graphRag: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  // REMAPPED: dempster_shafer → mosaic_intelligence_fusion
  dempsterShafer: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  // REMAPPED: counterfactual → behavioral_prediction
  counterfactual: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  // REMAPPED: pattern_of_life_fusion → temporal_fusion
  patternOfLifeFusion: { type: 'ai_analyses', analysisType: 'temporal_fusion' },
  // REMAPPED: entity_resolution → intelligence_dossier
  entityResolution: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  // REMAPPED: coercive_control → coercion_resistance
  coerciveControl: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  // REMAPPED: financial_psychology → economic_warfare
  financialPsychology: { type: 'ai_analyses', analysisType: 'economic_warfare' },
};

/**
 * Get the data source for a section
 */
export function getSectionDataSource(sectionId: string): SectionDataSource | null {
  return SECTION_DATA_SOURCES[sectionId] || null;
}

/**
 * Check if a section is always available (based on profile data)
 */
export function isSectionAlwaysAvailable(sectionId: string): boolean {
  const source = SECTION_DATA_SOURCES[sectionId];
  return source?.alwaysAvailable === true;
}
