/**
 * Section Data Check Utility (v4.0)
 * Pre-render check to determine if a section has data worth rendering
 * v4.0: Enhanced extractResult with better nested data handling
 */

import type { ExtendedDossierData } from '../sections/renderers/types';

/**
 * Analysis type aliases - maps section data field names to ACTUAL analysis_type values
 * stored in ai_analyses table by edge functions
 * 
 * v3.9.33: Aligned with database query results:
 * power_network, aggregate_intelligence, attachment_vulnerability, behavioral_baseline,
 * behavioral_dna, behavioral_prediction, coercion_resistance, cognitive_warfare,
 * crisis_response, digital_footprint, economic_warfare, enhanced_deception_detection,
 * existential_leverage, family_protection, influence_profile, intelligence_dossier,
 * lawfare_defense, manipulation_susceptibility, memetic_propagation, mice_recruitment,
 * mosaic_intelligence_fusion, narrative_control, network_exploitation, opsec_assessment,
 * personality, playbook, precognitive_patterns, quantum_cognition, relationship_score,
 * reputation_defense, sentiment, social_engineering, temporal_fusion, trauma_exploitation,
 * tscm_sweep, counter_intelligence, deep_intelligence_comprehensive, shadow_network,
 * reality_consensus, relationship_trajectory, omega_point, mass_formation, network_graph
 */
const ANALYSIS_TYPE_ALIASES: Record<string, string[]> = {
  // Core sections
  behavioralDna: ['behavioral_dna', 'behavioral_baseline'],
  patternOfLife: ['behavioral_dna', 'temporal_fusion', 'behavioral_baseline'],
  
  // Intelligence sections
  quantumCognition: ['quantum_cognition'],
  playbook: ['playbook', 'aggregate_intelligence', 'intelligence_dossier'],
  relationship: ['relationship_score', 'relationship_trajectory', 'behavioral_dna'],
  hypnoticPatterns: ['narrative_control'],
  cognitiveLoad: ['cognitive_warfare', 'manipulation_susceptibility'],
  psychological: ['personality', 'manipulation_susceptibility'],
  psychProfile: ['personality', 'manipulation_susceptibility'],
  mice: ['mice_recruitment'],
  cialdini: ['influence_profile'],
  deceptionAnalysis: ['enhanced_deception_detection'],
  
  // Warfare sections
  sacredValues: ['existential_leverage'],
  realityTesting: ['cognitive_warfare', 'reality_consensus'],
  identityDestab: ['manipulation_susceptibility'],
  semanticWarfare: ['narrative_control'],
  trauma: ['trauma_exploitation', 'attachment_vulnerability'],
  vulnerabilityWindows: ['trauma_exploitation', 'attachment_vulnerability'],
  deceptionOps: ['enhanced_deception_detection'],
  influenceOps: ['influence_profile'],
  betrayal: ['trauma_exploitation'],
  choiceArchitecture: ['manipulation_susceptibility'],
  coerciveControl: ['coercion_resistance'],
  threatActor: ['counter_intelligence', 'shadow_network'],
  cognitiveWarfare: ['cognitive_warfare'],
  memeticPropagation: ['memetic_propagation'],
  futureModeling: ['behavioral_prediction', 'precognitive_patterns'],
  precognitive: ['precognitive_patterns', 'behavioral_prediction'],
  influence: ['influence_profile'],
  darkTetrad: ['manipulation_susceptibility', 'personality'],
  mosaicFusion: ['mosaic_intelligence_fusion'],
  shadowNetwork: ['network_exploitation', 'shadow_network'],
  trustTrajectory: ['relationship_score', 'relationship_trajectory'],
  
  // Defense Operations
  opsecAssessment: ['opsec_assessment'],
  socialEngineering: ['social_engineering', 'manipulation_susceptibility'],
  crisisResponse: ['crisis_response'],
  lawfareDefense: ['lawfare_defense'],
  reputationDefense: ['reputation_defense'],
  familyProtection: ['family_protection'],
  economicWarfare: ['economic_warfare'],
  tscmSweep: ['tscm_sweep'],
  digitalFootprint: ['digital_footprint'],
  behavioralBaseline: ['behavioral_baseline'],
  
  // Fusion sections - v3.9.0: Updated with unique analysis types
  temporalFusion: ['temporal_fusion', 'behavioral_baseline'],
  digitalTwin: ['behavioral_digital_twin', 'behavioral_baseline', 'behavioral_dna'],
  graphRag: ['graph_rag_synthesis', 'deep_intelligence_comprehensive', 'intelligence_dossier'],
  dempsterShafer: ['dempster_shafer_fusion'],
  counterfactual: ['counterfactual_reasoning', 'behavioral_prediction'],
  patternOfLifeFusion: ['pattern_of_life', 'temporal_fusion', 'behavioral_dna'],
  entityResolution: ['entity_resolution', 'intelligence_dossier', 'aggregate_intelligence'],
  sentimentCascade: ['sentiment_cascade', 'sentiment'],
  shadowNetworkAnalysis: ['shadow_network_analysis', 'network_exploitation', 'shadow_network'],
  crossDomainSynthesis: ['mosaic_intelligence_fusion', 'aggregate_intelligence'],
  predictiveConvergence: ['behavioral_prediction', 'precognitive_patterns'],
  
  // v5.0 Data Fusion Sections
  biometricFusion: ['biometric_behavioral_fusion', 'behavioral_dna'],
  calendarIntelligence: ['calendar_pattern', 'calendar_pattern_analysis', 'vulnerability_window'],
  geospatialCommunication: ['geospatial_communication_fusion', 'network_exploitation'],
  financialDocumentSynthesis: ['financial_document_synthesis', 'economic_warfare'],
  
  // v6.0 Advanced Intelligence Sections
  relationshipHalfLife: ['relationship_half_life', 'relationship_trajectory'],
  redTeamAssessment: ['automated_red_team', 'opsec_assessment'],
  multiPartyDeception: ['multi_party_deception', 'enhanced_deception_detection'],
  zeroDayAnomalies: ['zero_day_anomaly', 'behavioral_baseline'],
  hypergameAnalysis: ['hypergame_theory', 'behavioral_prediction'],
  
  // Analysis sections
  influenceResistance: ['coercion_resistance'],
  behavioralEconomics: ['economic_warfare'],
  network: ['network_exploitation', 'power_network'],
  networkPosition: ['power_network', 'network_exploitation'],
  counterIntel: ['counter_intelligence'],
  predictionAccuracy: ['behavioral_prediction'],
  crossModal: ['mosaic_intelligence_fusion', 'enhanced_deception_detection'],
  actionPlans: ['aggregate_intelligence', 'intelligence_dossier'],
  financialPsychology: ['economic_warfare'],
};

/**
 * Check if a section has enough data to render content
 * v3.9.33: PRIORITIZE hasAnalysis() check first since allAnalyses is always populated
 */
export function checkSectionHasData(
  sectionId: string,
  data: ExtendedDossierData
): boolean {
  // Always render these sections (they have computed/derived data)
  const alwaysRender = ['executive', 'sourceDashboard', 'overview'];
  if (alwaysRender.includes(sectionId)) {
    return true;
  }

  // v3.9.33: PRIORITIZE hasAnalysis() check first for most sections
  // This catches data from allAnalyses even when specific arrays are empty
  if (hasAnalysis(data, sectionId)) {
    return true;
  }

  // Check specific data fields based on section ID as fallback
  const checks: Record<string, () => boolean> = {
    // Core sections
    timeline: () => !!(data.commData?.length),
    patternOfLife: () => !!(data.patternOfLifeData?.length),
    relationshipEcosystem: () => !!(data.relationshipData?.length || data.relationshipAnalysis),
    mediaIntel: () => !!(data.mediaData?.length),
    voiceIntel: () => !!(data.voiceData?.length),
    anomalyDetection: () => !!(data.anomaliesData?.length),
    
    // Intelligence sections
    mice: () => !!(data.miceData?.length),
    cialdini: () => !!(data.influenceData?.data),
    psychological: () => !!(data.psychData?.length),
    psychProfile: () => !!(data.psychData?.length),
    trust: () => !!(data.trustData?.length),
    behavioralDna: () => !!(data.behavioralDnaAnalysis),
    quantumCognition: () => !!(Array.isArray(data.quantumCognitionData) && data.quantumCognitionData.length),
    relationship: () => !!(data.relationshipAnalysis),
    playbook: () => !!(Array.isArray(data.playbookData) && data.playbookData.length),
    hypnoticPatterns: () => !!(Array.isArray(data.hypnoticPatternsData) && data.hypnoticPatternsData.length),
    elicitation: () => !!(data.elicitationData?.length || data.elicitationSessions?.length),
    cognitiveLoad: () => !!(Array.isArray(data.cognitiveLoadData) && data.cognitiveLoadData.length),
    darkTetrad: () => !!(Array.isArray(data.darkTetradData) && data.darkTetradData.length) || !!(data.psychData?.[0] as Record<string, unknown>)?.dark_triad_indicators,
    influenceVectors: () => !!(Array.isArray(data.influenceVectorData) && data.influenceVectorData.length) || !!(data.influenceData?.data),
    financialPsychology: () => !!(Array.isArray(data.financialPsychData) && data.financialPsychData.length),
    sacredValues: () => !!(Array.isArray(data.sacredValuesData) && data.sacredValuesData.length),
    deceptionAnalysis: () => !!(Array.isArray(data.deceptionAnalysisData) && data.deceptionAnalysisData.length),
    
    // Warfare sections
    cognitiveWarfare: () => !!(data.cognitiveWarfareData?.length),
    deceptionOps: () => !!(data.deceptionOpsData?.length),
    trauma: () => !!(data.traumaData?.length),
    betrayal: () => !!(data.betrayalData?.length),
    vulnerabilityWindows: () => !!(data.vulnerabilityWindowsData?.length),
    activeDefense: () => !!(data.activeDefenseData?.length),
    realityTesting: () => !!(Array.isArray(data.realityTestingData) && data.realityTestingData.length),
    identityDestab: () => !!(Array.isArray(data.identityDestabData) && data.identityDestabData.length),
    semanticWarfare: () => !!(Array.isArray(data.semanticWarfareData) && data.semanticWarfareData.length),
    memeticPropagation: () => !!(Array.isArray(data.memeticData) && data.memeticData.length),
    futureModeling: () => !!(Array.isArray(data.futureModelingData) && data.futureModelingData.length),
    precognitive: () => !!(Array.isArray(data.precognitiveData) && data.precognitiveData.length),
    choiceArchitecture: () => !!(Array.isArray(data.choiceArchitectureData) && data.choiceArchitectureData.length),
    influenceOps: () => !!(Array.isArray(data.influenceOpsData) && data.influenceOpsData.length),
    threatActor: () => !!(Array.isArray(data.threatActorData) && data.threatActorData.length),
    trustTrajectory: () => !!(data.trustTrajectoriesData?.length || data.trustData?.length),
    coerciveControl: () => !!(Array.isArray(data.coerciveControlData) && data.coerciveControlData.length),
    influence: () => !!(data.influenceData?.data || (Array.isArray(data.influenceVectorData) && data.influenceVectorData.length)),
    mosaicFusion: () => !!(data.mosaicFusionData?.length),
    shadowNetwork: () => !!(data.shadowNetworkData?.length),
    opsecAssessment: () => !!(data.opsecAssessments?.length),
    socialEngineering: () => !!(data.socialEngineeringIncidents?.length),
    crisisResponse: () => !!(data.crisisEvents?.length || data.emergencyProtocols?.length),
    lawfareDefense: () => !!(data.legalThreats?.length),
    reputationDefense: () => !!(data.reputationIncidents?.length),
    familyProtection: () => !!(data.protectedPersons?.length),
    economicWarfare: () => !!(data.economicThreats?.length),
    tscmSweep: () => !!(data.tscmSweeps?.length),
    digitalFootprint: () => !!(data.digitalFootprints?.length),
    behavioralBaseline: () => !!(data.behavioralBaselines?.length),
    
    // Fusion sections
    temporalFusion: () => !!(data.temporalFusionData?.length),
    digitalTwin: () => !!(data.digitalTwinData?.length),
    graphRag: () => !!(data.graphRagData?.length),
    dempsterShafer: () => !!(data.dempsterShaferData?.length),
    counterfactual: () => !!(data.counterfactualData?.length),
    patternOfLifeFusion: () => !!(data.patternOfLifeEngineData?.length),
    entityResolution: () => !!(data.entityResolutionData?.length),
    sentimentCascade: () => !!(data.sentimentCascadeData?.length),
    crossDomainSynthesis: () => false, // Check via hasAnalysis
    predictiveConvergence: () => false, // Check via hasAnalysis
    
    // v5.0 Data Fusion sections - uses DossierDataResult field names
    biometricFusion: () => !!(Array.isArray(data.biometricBehavioralFusion) && data.biometricBehavioralFusion.length),
    calendarIntelligence: () => !!(Array.isArray(data.calendarPatternAnalysis) && data.calendarPatternAnalysis.length),
    geospatialCommunication: () => !!(Array.isArray(data.geospatialCommunicationFusion) && data.geospatialCommunicationFusion.length),
    financialDocumentSynthesis: () => !!(Array.isArray(data.financialDocumentSynthesis) && data.financialDocumentSynthesis.length),
    
    // v6.0 Advanced Intelligence sections - uses DossierDataResult field names
    relationshipHalfLife: () => !!(Array.isArray(data.relationshipHalfLifeData) && data.relationshipHalfLifeData.length),
    redTeamAssessment: () => !!(Array.isArray(data.automatedRedTeamData) && data.automatedRedTeamData.length),
    multiPartyDeception: () => !!(Array.isArray(data.multiPartyDeceptionData) && data.multiPartyDeceptionData.length),
    zeroDayAnomalies: () => !!(Array.isArray(data.zeroDayAnomalyData) && data.zeroDayAnomalyData.length),
    hypergameAnalysis: () => !!(Array.isArray(data.hypergameTheoryData) && data.hypergameTheoryData.length),
    
    // Analysis sections
    analysis: () => !!(data.allAnalyses?.length),
    influenceResistance: () => !!(Array.isArray(data.influenceResistanceData) && data.influenceResistanceData.length),
    behavioralEconomics: () => !!(Array.isArray(data.financialPsychData) && data.financialPsychData.length),
    network: () => !!(Array.isArray(data.networkPositionData) && data.networkPositionData.length),
    networkPosition: () => !!(Array.isArray(data.networkPositionData) && data.networkPositionData.length),
    predictionAccuracy: () => !!(data.predictionHistoryData?.length),
    counterIntel: () => !!(Array.isArray(data.counterIntelData) && data.counterIntelData.length),
    proportionalResponse: () => !!(data.proportionalResponseData?.length),
    crossModal: () => !!(Array.isArray(data.deceptionAnalysisData) && data.deceptionAnalysisData.length),
    actionPlans: () => !!(data.actionPlansData?.length),
  };

  // Execute the check if defined
  const check = checks[sectionId];
  if (check) {
    return check();
  }

  // Already checked hasAnalysis at top, return false as final fallback
  return false;
}

/**
 * Helper to check if allAnalyses contains any matching analysis_type
 */
function hasAnalysis(data: ExtendedDossierData, sectionKey: string): boolean {
  if (!data.allAnalyses?.length) return false;
  
  const aliases = ANALYSIS_TYPE_ALIASES[sectionKey] || [sectionKey];
  return data.allAnalyses.some((a: Record<string, unknown>) => 
    aliases.includes(a.analysis_type as string)
  );
}

/**
 * Get analysis data from allAnalyses for a section
 * v3.9.33: Returns the first matching analysis based on alias priority
 */
export function getAnalysisForSection(
  data: ExtendedDossierData,
  sectionKey: string
): Record<string, unknown> | null {
  if (!data.allAnalyses?.length) return null;
  
  const aliases = ANALYSIS_TYPE_ALIASES[sectionKey] || [sectionKey];
  
  for (const alias of aliases) {
    const found = data.allAnalyses.find((a: Record<string, unknown>) => 
      a.analysis_type === alias
    );
    if (found) return found as Record<string, unknown>;
  }
  
  return null;
}

/**
 * Extract result from an analysis record (v4.0)
 * Handles nested .result JSONB field from ai_analyses table
 * Enhanced with .data fallback and flat structure support
 */
export function extractResult(analysisRecord: Record<string, unknown> | null): Record<string, unknown> {
  if (!analysisRecord) return {};
  
  // Priority 1: If the record has a 'result' field, use it
  if (analysisRecord.result && typeof analysisRecord.result === 'object' && !Array.isArray(analysisRecord.result)) {
    return analysisRecord.result as Record<string, unknown>;
  }
  
  // Priority 2: If the record has a 'data' field, use it
  if (analysisRecord.data && typeof analysisRecord.data === 'object' && !Array.isArray(analysisRecord.data)) {
    return analysisRecord.data as Record<string, unknown>;
  }
  
  // Priority 3: Otherwise return the record itself (for table-based data)
  return analysisRecord;
}

/**
 * Extract a deeply nested field from a record using dot-notation path
 * e.g., extractNestedField(record, 'miceProfile.money.vulnerabilityScore', 0)
 */
export function extractNestedField<T>(
  record: Record<string, unknown> | null,
  path: string,
  defaultValue: T
): T {
  if (!record || typeof record !== 'object') return defaultValue;
  
  const parts = path.split('.');
  let current: unknown = record;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return (current as T) ?? defaultValue;
}

/**
 * Get the list of aliases for debugging/logging
 */
export function getAliasesForSection(sectionKey: string): string[] {
  return ANALYSIS_TYPE_ALIASES[sectionKey] || [sectionKey];
}
