/**
 * Section Data Check Utility (v3.9.33)
 * Pre-render check to determine if a section has data worth rendering
 * v3.9.33: Fixed ANALYSIS_TYPE_ALIASES to match ACTUAL database values
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
  
  // Fusion sections
  temporalFusion: ['temporal_fusion', 'behavioral_baseline'],
  digitalTwin: ['behavioral_baseline', 'behavioral_dna'],
  graphRag: ['deep_intelligence_comprehensive', 'intelligence_dossier'],
  dempsterShafer: ['mosaic_intelligence_fusion'],
  counterfactual: ['behavioral_prediction'],
  patternOfLifeFusion: ['temporal_fusion', 'behavioral_dna'],
  entityResolution: ['intelligence_dossier', 'aggregate_intelligence'],
  sentimentCascade: ['sentiment'],
  crossDomainSynthesis: ['mosaic_intelligence_fusion', 'aggregate_intelligence'],
  predictiveConvergence: ['behavioral_prediction', 'precognitive_patterns'],
  
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
 * Extract result from an analysis record (v3.9.33)
 * Handles nested .result JSONB field from ai_analyses table
 */
export function extractResult(analysisRecord: Record<string, unknown> | null): Record<string, unknown> {
  if (!analysisRecord) return {};
  
  // If the record has a 'result' field, use it
  if (analysisRecord.result && typeof analysisRecord.result === 'object') {
    return analysisRecord.result as Record<string, unknown>;
  }
  
  // Otherwise return the record itself (for table-based data)
  return analysisRecord;
}

/**
 * Get the list of aliases for debugging/logging
 */
export function getAliasesForSection(sectionKey: string): string[] {
  return ANALYSIS_TYPE_ALIASES[sectionKey] || [sectionKey];
}
