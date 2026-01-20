/**
 * Section Data Sources Mapping (v5.3)
 * Maps section IDs to their data sources for availability checking
 * 
 * v5.3: Aligned analysis_type values with actual edge function outputs
 *       - mosaic_intelligence → mosaic_intelligence_fusion
 *       - deception_analysis → enhanced_deception_detection
 *       - counter_intel → counter_intelligence
 *       - Added new sections: manipulationSusceptibility, coercionResistance, 
 *         existentialLeverage, networkExploitation
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
 * Complete mapping of all 74+ sections to their data sources
 * IMPORTANT: analysisType values MUST match what edge functions store in ai_analyses table
 */
export const SECTION_DATA_SOURCES: Record<string, SectionDataSource> = {
  // ============== CORE SECTIONS (7) ==============
  executive: { type: 'profile', alwaysAvailable: true },
  sourceDashboard: { type: 'profile', alwaysAvailable: true },
  overview: { type: 'profile', alwaysAvailable: true },
  behavioralDna: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  patternOfLife: { type: 'ai_analyses', analysisType: 'pattern_of_life' },
  relationshipEcosystem: { type: 'table', table: 'contact_relationships' },
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
  // FIXED: edge function stores 'enhanced_deception_detection' not 'deception_analysis'
  deceptionAnalysis: { type: 'ai_analyses', analysisType: 'enhanced_deception_detection' },
  actionPlans: { type: 'table', table: 'action_recommendations' },

  // ============== WARFARE SECTIONS (33+) ==============
  mice: { type: 'table', table: 'mice_assessments' },
  cialdini: { type: 'table', table: 'contact_influence_profiles' },
  sacredValues: { type: 'ai_analyses', analysisType: 'sacred_values' },
  realityTesting: { type: 'ai_analyses', analysisType: 'reality_consensus' },
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
  // FIXED: edge function stores 'mosaic_intelligence_fusion' not 'mosaic_intelligence'
  mosaicFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  darkTetrad: { type: 'ai_analyses', analysisType: 'dark_tetrad' },
  // FIXED: edge function stores 'shadow_network' (singular) not 'shadow_networks'
  shadowNetwork: { type: 'ai_analyses', analysisType: 'shadow_network' },
  sentimentCascade: { type: 'ai_analyses', analysisType: 'sentiment_cascade' },
  
  // NEW: Sections mapped to actual edge function outputs (v5.4)
  // FIXED: manipulation-vulnerability-assessment stores 'manipulation_susceptibility' not 'manipulation_vulnerability'
  manipulationSusceptibility: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  coercionResistance: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  existentialLeverage: { type: 'ai_analyses', analysisType: 'existential_leverage' },
  networkExploitation: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  deepIntelligence: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  personalityProfile: { type: 'ai_analyses', analysisType: 'personality' },
  sentimentAnalysis: { type: 'ai_analyses', analysisType: 'sentiment' },
  relationshipScore: { type: 'ai_analyses', analysisType: 'relationship_score' },
  intelligenceDossier: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  // NEW: Advanced convergence sections (v5.4)
  omegaPoint: { type: 'ai_analyses', analysisType: 'omega_point' },
  massFormation: { type: 'ai_analyses', analysisType: 'mass_formation' },
  morphicResonance: { type: 'ai_analyses', analysisType: 'morphic_resonance' },
  networkGraph: { type: 'ai_analyses', analysisType: 'network_graph' },
  
  // Defense Operations (10 sections - v5.0) - Now check ai_analyses instead of empty tables
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
  influenceResistance: { type: 'ai_analyses', analysisType: 'influence_resistance' },
  behavioralEconomics: { type: 'ai_analyses', analysisType: 'behavioral_economics' },
  network: { type: 'ai_analyses', analysisType: 'network_position' },
  predictionAccuracy: { type: 'table', table: 'prediction_accuracy_logs' },
  // FIXED: edge function stores 'counter_intelligence' not 'counter_intel'
  counterIntel: { type: 'ai_analyses', analysisType: 'counter_intelligence' },
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
