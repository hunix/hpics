/**
 * Section Data Sources Mapping (v3.9.33)
 * Maps section IDs to their data sources for availability checking
 * 
 * v3.9.33: Fixed analysisType values to match ACTUAL database values:
 *   mice_recruitment (NOT mice_assessment), playbook exists, relationship_score exists
 * v5.7: Re-mapped 30+ sections to existing analysis_types from the 40-task generation
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
 * v3.9.33: Fixed to match ACTUAL analysis_type values in database
 * IMPORTANT: analysisType values MUST match what edge functions store in ai_analyses table
 */
export const SECTION_DATA_SOURCES: Record<string, SectionDataSource> = {
  // ============== CORE SECTIONS (7) ==============
  executive: { type: 'profile', alwaysAvailable: true },
  sourceDashboard: { type: 'profile', alwaysAvailable: true },
  overview: { type: 'profile', alwaysAvailable: true },
  behavioralDna: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  patternOfLife: { type: 'ai_analyses', analysisType: 'behavioral_dna' },
  relationshipEcosystem: { type: 'table', table: 'contact_relationships', checkType: 'bidirectional', altKeyColumns: ['from_profile_id', 'to_profile_id'] },
  timeline: { type: 'table', table: 'contact_interaction_notes' },

  // ============== INTELLIGENCE SECTIONS (16) ==============
  psychological: { type: 'table', table: 'psychological_profiles' },
  quantumCognition: { type: 'ai_analyses', analysisType: 'quantum_cognition' },
  // v3.9.33: relationship_score exists in DB
  relationship: { type: 'ai_analyses', analysisType: 'relationship_score' },
  // v3.9.33: playbook exists in DB
  playbook: { type: 'ai_analyses', analysisType: 'playbook' },
  hypnoticPatterns: { type: 'ai_analyses', analysisType: 'narrative_control' },
  elicitation: { type: 'ai_analyses', analysisType: 'playbook' },
  cognitiveLoad: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  mediaIntel: { type: 'ai_analyses', analysisType: 'aggregate_intelligence' },
  voiceIntel: { type: 'table', table: 'voice_insights' },
  voiceIntelAggregate: { type: 'ai_analyses', analysisType: 'voice_intelligence_aggregate' },
  deceptionAnalysis: { type: 'ai_analyses', analysisType: 'enhanced_deception_detection' },
  actionPlans: { type: 'table', table: 'action_recommendations' },
  attachmentVulnerability: { type: 'ai_analyses', analysisType: 'attachment_vulnerability' },
  narrativeControl: { type: 'ai_analyses', analysisType: 'narrative_control' },
  // v3.9.33: mice_recruitment (NOT mice_assessment) - fixed
  miceRecruitment: { type: 'ai_analyses', analysisType: 'mice_recruitment' },
  influenceProfile: { type: 'ai_analyses', analysisType: 'influence_profile' },
  powerNetwork: { type: 'ai_analyses', analysisType: 'power_network' },

  // ============== WARFARE SECTIONS (33+) ==============
  mice: { type: 'table', table: 'mice_assessments' },
  cialdini: { type: 'table', table: 'contact_influence_profiles' },
  sacredValues: { type: 'ai_analyses', analysisType: 'existential_leverage' },
  realityTesting: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  identityDestab: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  influence: { type: 'table', table: 'contact_influence_profiles' },
  trauma: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  semanticWarfare: { type: 'ai_analyses', analysisType: 'narrative_control' },
  memeticPropagation: { type: 'ai_analyses', analysisType: 'memetic_propagation' },
  futureModeling: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  precognitive: { type: 'ai_analyses', analysisType: 'precognitive_patterns' },
  crossModal: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  choiceArchitecture: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  betrayal: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  influenceOps: { type: 'ai_analyses', analysisType: 'influence_profile' },
  threatActor: { type: 'table', table: 'threat_actor_profiles' },
  cognitiveWarfare: { type: 'ai_analyses', analysisType: 'cognitive_warfare' },
  deceptionOps: { type: 'ai_analyses', analysisType: 'enhanced_deception_detection' },
  vulnerabilityWindows: { type: 'ai_analyses', analysisType: 'trauma_exploitation' },
  activeDefense: { type: 'table', table: 'active_defense_operations' },
  trustTrajectory: { type: 'table', table: 'trust_trajectory_forecasts' },
  mosaicFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  darkTetrad: { type: 'ai_analyses', analysisType: 'manipulation_susceptibility' },
  shadowNetwork: { type: 'ai_analyses', analysisType: 'network_exploitation' },
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
  
  // Advanced convergence sections
  omegaPoint: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  massFormation: { type: 'ai_analyses', analysisType: 'social_engineering' },
  morphicResonance: { type: 'ai_analyses', analysisType: 'quantum_cognition' },
  networkGraph: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  omniscientOrchestration: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  unifiedFusion: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  fullDossier: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
  aggregateIntelligence: { type: 'ai_analyses', analysisType: 'aggregate_intelligence' },
  
  // Defense Operations
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
  // v3.9.33: Add coerciveControl
  coerciveControl: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  // v3.9.33: Add financialPsychology
  financialPsychology: { type: 'ai_analyses', analysisType: 'economic_warfare' },
  // v3.9.33: Add crossDomainSynthesis
  crossDomainSynthesis: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  // v3.9.33: Add predictiveConvergence
  predictiveConvergence: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  // v3.9.33: Add networkPosition
  networkPosition: { type: 'ai_analyses', analysisType: 'power_network' },
  // v3.9.33: Add anomalyDetection
  anomalyDetection: { type: 'table', table: 'behavioral_anomalies' },

  // ============== ANALYSIS SECTIONS (8) ==============
  analysis: { type: 'table', table: 'behavioral_analyses' },
  trust: { type: 'table', table: 'trust_assessments' },
  influenceResistance: { type: 'ai_analyses', analysisType: 'coercion_resistance' },
  behavioralEconomics: { type: 'ai_analyses', analysisType: 'economic_warfare' },
  network: { type: 'ai_analyses', analysisType: 'network_exploitation' },
  predictionAccuracy: { type: 'table', table: 'prediction_accuracy_logs', keyColumn: 'user_id', checkType: 'user_only' },
  counterIntel: { type: 'ai_analyses', analysisType: 'counter_intelligence' },
  proportionalResponse: { type: 'table', table: 'proportional_response_logs', keyColumn: 'user_id', checkType: 'user_only' },

  // ============== DATA FUSION SECTIONS (9) ==============
  temporalFusion: { type: 'ai_analyses', analysisType: 'temporal_fusion' },
  digitalTwin: { type: 'ai_analyses', analysisType: 'behavioral_baseline' },
  graphRag: { type: 'ai_analyses', analysisType: 'deep_intelligence_comprehensive' },
  dempsterShafer: { type: 'ai_analyses', analysisType: 'mosaic_intelligence_fusion' },
  counterfactual: { type: 'ai_analyses', analysisType: 'behavioral_prediction' },
  patternOfLifeFusion: { type: 'ai_analyses', analysisType: 'temporal_fusion' },
  entityResolution: { type: 'ai_analyses', analysisType: 'intelligence_dossier' },
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
