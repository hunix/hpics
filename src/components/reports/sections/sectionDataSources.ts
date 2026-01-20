/**
 * Section Data Sources Mapping (v5.2)
 * Maps section IDs to their data sources for availability checking
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
}

/**
 * Complete mapping of all 74 sections to their data sources
 */
export const SECTION_DATA_SOURCES: Record<string, SectionDataSource> = {
  // ============== CORE SECTIONS (7) ==============
  executive: { type: 'profile', alwaysAvailable: true },
  sourceDashboard: { type: 'profile', alwaysAvailable: true },
  overview: { type: 'profile', alwaysAvailable: true },
  behavioralDna: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  patternOfLife: { type: 'ai_analyses', analysisType: 'pattern_of_life' },
  relationshipEcosystem: { type: 'table', table: 'relationships' },
  timeline: { type: 'table', table: 'contact_interaction_notes' },

  // ============== INTELLIGENCE SECTIONS (11) ==============
  psychological: { type: 'table', table: 'psychological_profiles' },
  quantumCognition: { type: 'ai_analyses', analysisType: 'quantum_cognition' },
  relationship: { type: 'ai_analyses', analysisType: 'relationship_dynamics' },
  playbook: { type: 'ai_analyses', analysisType: 'playbook' },
  hypnoticPatterns: { type: 'ai_analyses', analysisType: 'hypnotic_patterns' },
  elicitation: { type: 'ai_analyses', analysisType: 'elicitation_guide' },
  cognitiveLoad: { type: 'ai_analyses', analysisType: 'cognitive_load' },
  mediaIntel: { type: 'table', table: 'media' },
  voiceIntel: { type: 'table', table: 'voice_recording_sessions' },
  deceptionAnalysis: { type: 'ai_analyses', analysisType: 'deception_analysis' },
  actionPlans: { type: 'table', table: 'action_recommendations' },

  // ============== WARFARE SECTIONS (33) ==============
  mice: { type: 'table', table: 'mice_assessments' },
  cialdini: { type: 'table', table: 'contact_influence_profiles' },
  sacredValues: { type: 'ai_analyses', analysisType: 'sacred_values' },
  realityTesting: { type: 'ai_analyses', analysisType: 'reality_testing' },
  identityDestab: { type: 'ai_analyses', analysisType: 'identity_destabilization' },
  influence: { type: 'table', table: 'contact_influence_profiles' },
  trauma: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  semanticWarfare: { type: 'ai_analyses', analysisType: 'semantic_warfare' },
  memeticPropagation: { type: 'ai_analyses', analysisType: 'memetic_propagation' },
  futureModeling: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  precognitive: { type: 'ai_analyses', analysisType: 'precognitive_patterns' },
  crossModal: { type: 'ai_analyses', analysisType: 'cross_modal_synthesis' },
  choiceArchitecture: { type: 'ai_analyses', analysisType: 'choice_architecture' },
  betrayal: { type: 'ai_analyses', analysisType: 'betrayal_prediction' },
  influenceOps: { type: 'ai_analyses', analysisType: 'influence_operations' },
  threatActor: { type: 'table', table: 'threat_actor_profiles' },
  cognitiveWarfare: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  deceptionOps: { type: 'ai_analyses', analysisType: 'deception_operations' },
  vulnerabilityWindows: { type: 'ai_analyses', analysisType: 'vulnerability_windows' },
  activeDefense: { type: 'table', table: 'active_defense_operations' },
  trustTrajectory: { type: 'table', table: 'trust_trajectory_forecasts' },
  mosaicFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence' },
  darkTetrad: { type: 'ai_analyses', analysisType: 'dark_tetrad' },
  shadowNetwork: { type: 'ai_analyses', analysisType: 'shadow_networks' },
  sentimentCascade: { type: 'ai_analyses', analysisType: 'sentiment_cascade' },
  
  // New Defense Operations (10 sections - v5.0)
  opsecAssessment: { type: 'table', table: 'opsec_assessments' },
  socialEngineering: { type: 'table', table: 'social_engineering_incidents' },
  crisisResponse: { type: 'table', table: 'crisis_events' },
  lawfareDefense: { type: 'table', table: 'legal_threat_assessments' },
  reputationDefense: { type: 'table', table: 'reputation_incidents' },
  familyProtection: { type: 'table', table: 'protected_persons', keyColumn: 'user_id' },
  economicWarfare: { type: 'table', table: 'economic_threat_assessments' },
  tscmSweep: { type: 'table', table: 'tscm_sweep_results' },
  digitalFootprint: { type: 'table', table: 'digital_footprint_items' },
  behavioralBaseline: { type: 'table', table: 'behavioral_baselines' },

  // ============== ANALYSIS SECTIONS (8) ==============
  analysis: { type: 'table', table: 'behavioral_analyses' },
  trust: { type: 'table', table: 'trust_assessments' },
  influenceResistance: { type: 'ai_analyses', analysisType: 'influence_resistance' },
  behavioralEconomics: { type: 'ai_analyses', analysisType: 'behavioral_economics' },
  network: { type: 'ai_analyses', analysisType: 'network_position' },
  predictionAccuracy: { type: 'table', table: 'prediction_accuracy_logs' },
  counterIntel: { type: 'ai_analyses', analysisType: 'counter_intel' },
  proportionalResponse: { type: 'table', table: 'proportional_response_logs' },

  // ============== DATA FUSION SECTIONS (9) ==============
  temporalFusion: { type: 'ai_analyses', analysisType: 'temporal_fusion' },
  digitalTwin: { type: 'ai_analyses', analysisType: 'digital_twin' },
  graphRag: { type: 'ai_analyses', analysisType: 'graph_rag' },
  dempsterShafer: { type: 'ai_analyses', analysisType: 'dempster_shafer' },
  counterfactual: { type: 'ai_analyses', analysisType: 'counterfactual' },
  patternOfLifeFusion: { type: 'ai_analyses', analysisType: 'pattern_of_life_fusion' },
  entityResolution: { type: 'ai_analyses', analysisType: 'entity_resolution' },
  coerciveControl: { type: 'ai_analyses', analysisType: 'coercive_control' },
  financialPsychology: { type: 'ai_analyses', analysisType: 'financial_psychology' },
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
