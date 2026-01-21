/**
 * Section Data Check Utility (v3.9.32)
 * Pre-render check to determine if a section has data worth rendering
 * v3.9.32: Prioritize allAnalyses fallback, expanded aliases for all 74 sections
 */

import type { ExtendedDossierData } from '../sections/renderers/types';

/**
 * Analysis type aliases - maps section data field names to actual analysis_type values
 * stored in ai_analyses table by edge functions (v3.9.32 expanded for full coverage)
 */
const ANALYSIS_TYPE_ALIASES: Record<string, string[]> = {
  // Core sections
  behavioralDna: ['behavioral_dna', 'dna_fingerprint'],
  patternOfLife: ['behavioral_dna', 'pattern_of_life', 'temporal_fusion'],
  
  // Intelligence sections
  quantumCognition: ['quantum_cognition', 'cognitive_superposition'],
  playbook: ['playbook', 'aggregate_intelligence', 'intelligence_dossier'],
  relationship: ['relationship_score', 'relationship_trajectory', 'behavioral_dna'],
  hypnoticPatterns: ['narrative_control', 'hypnotic_patterns'],
  cognitiveLoad: ['cognitive_warfare', 'cognitive_load'],
  psychological: ['personality', 'psychological_profile'],
  mice: ['mice_assessment', 'mice_recruitment'],
  cialdini: ['influence_profile', 'cialdini_profile'],
  deceptionAnalysis: ['enhanced_deception_detection', 'deception_analysis'],
  
  // Warfare sections
  sacredValues: ['existential_leverage', 'sacred_values'],
  realityTesting: ['cognitive_warfare', 'reality_consensus'],
  identityDestab: ['manipulation_susceptibility', 'identity_destabilization'],
  semanticWarfare: ['narrative_control', 'semantic_warfare'],
  trauma: ['trauma_exploitation', 'attachment_vulnerability'],
  vulnerabilityWindows: ['trauma_exploitation', 'vulnerability_windows'],
  deceptionOps: ['enhanced_deception_detection', 'deception_operations'],
  influenceOps: ['influence_profile', 'influence_operations'],
  betrayal: ['trauma_exploitation', 'betrayal_prediction'],
  choiceArchitecture: ['manipulation_susceptibility', 'choice_architecture'],
  coerciveControl: ['coercion_resistance', 'coercive_control'],
  threatActor: ['counter_intelligence', 'threat_actor', 'shadow_network'],
  cognitiveWarfare: ['cognitive_warfare'],
  memeticPropagation: ['memetic_propagation', 'meme_analysis'],
  futureModeling: ['behavioral_prediction', 'future_modeling'],
  precognitive: ['precognitive_patterns', 'behavioral_prediction'],
  influence: ['influence_profile', 'cialdini_profile'],
  darkTetrad: ['manipulation_susceptibility', 'dark_tetrad', 'personality'],
  mosaicFusion: ['mosaic_intelligence_fusion'],
  shadowNetwork: ['network_exploitation', 'shadow_network'],
  trustTrajectory: ['trust_trajectory', 'relationship_score'],
  
  // Defense Operations (v5.0)
  opsecAssessment: ['opsec_assessment', 'security_assessment'],
  socialEngineering: ['social_engineering', 'manipulation_susceptibility'],
  crisisResponse: ['crisis_response', 'emergency_protocol'],
  lawfareDefense: ['lawfare_defense', 'legal_threat'],
  reputationDefense: ['reputation_defense', 'reputation_analysis'],
  familyProtection: ['family_protection', 'protected_persons'],
  economicWarfare: ['economic_warfare', 'financial_threat'],
  tscmSweep: ['tscm_sweep', 'surveillance_detection'],
  digitalFootprint: ['digital_footprint', 'online_presence'],
  behavioralBaseline: ['behavioral_baseline', 'baseline_analysis'],
  
  // Fusion sections
  temporalFusion: ['temporal_fusion', 'pattern_of_life'],
  digitalTwin: ['behavioral_baseline', 'digital_twin'],
  graphRag: ['deep_intelligence_comprehensive', 'graph_rag'],
  dempsterShafer: ['mosaic_intelligence_fusion', 'evidence_fusion'],
  counterfactual: ['behavioral_prediction', 'counterfactual'],
  patternOfLifeFusion: ['temporal_fusion', 'behavioral_dna'],
  entityResolution: ['intelligence_dossier', 'entity_resolution'],
  sentimentCascade: ['sentiment', 'sentiment_cascade'],
  crossDomainSynthesis: ['mosaic_intelligence_fusion', 'cross_domain'],
  predictiveConvergence: ['behavioral_prediction', 'convergence'],
  
  // Analysis sections
  influenceResistance: ['coercion_resistance', 'influence_resistance'],
  behavioralEconomics: ['economic_warfare', 'financial_psychology'],
  network: ['network_exploitation', 'power_network'],
  networkPosition: ['power_network', 'network_exploitation'],
  counterIntel: ['counter_intelligence'],
  predictionAccuracy: ['behavioral_prediction'],
  crossModal: ['mosaic_intelligence_fusion', 'enhanced_deception_detection', 'cross_modal'],
  actionPlans: ['aggregate_intelligence', 'action_plan'],
  financialPsychology: ['economic_warfare', 'financial_psychology'],
};

/**
 * Check if a section has enough data to render content
 * v3.9.32: Prioritize allAnalyses (always populated) over specific arrays (often empty)
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

  // v3.9.32: PRIORITIZE hasAnalysis() check first for most sections
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
 * Useful for renderers that need to fallback (v3.9.32)
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
 * Extract result from an analysis record (v3.9.32)
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
