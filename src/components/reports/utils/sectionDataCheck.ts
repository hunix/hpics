/**
 * Section Data Check Utility (v3.9.31)
 * Pre-render check to determine if a section has data worth rendering
 * v3.9.31: Updated aliases to match actual DB analysis_type values
 */

import type { ExtendedDossierData } from '../sections/renderers/types';

/**
 * Analysis type aliases - maps section data field names to actual analysis_type values
 * stored in ai_analyses table by edge functions (v3.9.31 aligned with DB)
 */
const ANALYSIS_TYPE_ALIASES: Record<string, string[]> = {
  // Intelligence sections
  quantumCognition: ['quantum_cognition'],
  playbook: ['playbook'],
  behavioralDna: ['behavioral_dna'],
  relationship: ['relationship_score', 'relationship_trajectory'],
  hypnoticPatterns: ['narrative_control'],
  cognitiveLoad: ['cognitive_warfare'],
  sacredValues: ['existential_leverage'],
  darkTetrad: ['manipulation_susceptibility', 'manipulation_vulnerability'],
  psychological: ['personality'],
  mice: ['mice_recruitment'],
  
  // Warfare sections
  trauma: ['trauma_exploitation', 'attachment_vulnerability'],
  realityTesting: ['reality_consensus', 'cognitive_warfare'],
  identityDestab: ['manipulation_susceptibility'],
  semanticWarfare: ['narrative_control'],
  vulnerabilityWindows: ['trauma_exploitation'],
  deceptionOps: ['enhanced_deception_detection'],
  influenceOps: ['influence_profile'],
  betrayal: ['trauma_exploitation'],
  choiceArchitecture: ['manipulation_susceptibility'],
  coerciveControl: ['coercion_resistance'],
  threatActor: ['counter_intelligence', 'shadow_network'],
  cognitiveWarfare: ['cognitive_warfare'],
  memeticPropagation: ['memetic_propagation'],
  futureModeling: ['behavioral_prediction'],
  precognitive: ['precognitive_patterns'],
  influence: ['influence_profile'],
  
  // New Warfare sections (v5.0)
  opsecAssessment: ['opsec_assessment'],
  socialEngineering: ['social_engineering'],
  crisisResponse: ['crisis_response'],
  lawfareDefense: ['lawfare_defense'],
  reputationDefense: ['reputation_defense'],
  familyProtection: ['family_protection'],
  economicWarfare: ['economic_warfare'],
  tscmSweep: ['tscm_sweep'],
  digitalFootprint: ['digital_footprint'],
  behavioralBaseline: ['behavioral_baseline'],
  
  // Fusion sections
  temporalFusion: ['temporal_fusion'],
  digitalTwin: ['behavioral_baseline'],
  graphRag: ['deep_intelligence_comprehensive'],
  shadowNetwork: ['network_exploitation', 'shadow_network'],
  dempsterShafer: ['mosaic_intelligence_fusion'],
  counterfactual: ['behavioral_prediction'],
  patternOfLife: ['behavioral_dna'],
  patternOfLifeFusion: ['temporal_fusion'],
  entityResolution: ['intelligence_dossier'],
  sentimentCascade: ['sentiment'],
  crossDomainSynthesis: ['mosaic_intelligence_fusion'],
  predictiveConvergence: ['behavioral_prediction'],
  mosaicFusion: ['mosaic_intelligence_fusion'],
  
  // Analysis sections
  influenceResistance: ['coercion_resistance'],
  behavioralEconomics: ['economic_warfare'],
  network: ['network_exploitation', 'power_network'],
  counterIntel: ['counter_intelligence'],
  predictionAccuracy: ['behavioral_prediction'],
  crossModal: ['mosaic_intelligence_fusion', 'enhanced_deception_detection'],
  deceptionAnalysis: ['enhanced_deception_detection'],
  actionPlans: ['aggregate_intelligence'],
  networkPosition: ['power_network', 'network_exploitation'],
  financialPsychology: ['economic_warfare'],
};

/**
 * Check if a section has enough data to render content
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

  // Check specific data fields based on section ID
  const checks: Record<string, () => boolean> = {
    // Core sections
    timeline: () => !!(data.commData?.length),
    patternOfLife: () => !!(data.patternOfLifeData?.length || hasAnalysis(data, 'patternOfLife')),
    relationshipEcosystem: () => !!(data.relationshipData?.length || data.relationshipAnalysis),
    mediaIntel: () => !!(data.mediaData?.length),
    voiceIntel: () => !!(data.voiceData?.length),
    anomalyDetection: () => !!(data.anomaliesData?.length),
    
    // Intelligence sections
    mice: () => !!(data.miceData?.length || hasAnalysis(data, 'mice')),
    cialdini: () => !!(data.influenceData?.data || hasAnalysis(data, 'influence')),
    psychological: () => !!(data.psychData?.length || hasAnalysis(data, 'psychological')),
    psychProfile: () => !!(data.psychData?.length || hasAnalysis(data, 'psychological')),
    trust: () => !!(data.trustData?.length),
    behavioralDna: () => !!(data.behavioralDnaAnalysis || hasAnalysis(data, 'behavioralDna')),
    quantumCognition: () => !!(data.quantumCognitionData?.length || hasAnalysis(data, 'quantumCognition')),
    relationship: () => !!(data.relationshipAnalysis || hasAnalysis(data, 'relationship')),
    playbook: () => !!(data.playbookData?.length || hasAnalysis(data, 'playbook')),
    hypnoticPatterns: () => !!(data.hypnoticPatternsData?.length || hasAnalysis(data, 'hypnoticPatterns')),
    elicitation: () => !!(data.elicitationData?.length || data.elicitationSessions?.length),
    cognitiveLoad: () => !!(data.cognitiveLoadData?.length || hasAnalysis(data, 'cognitiveLoad')),
    darkTetrad: () => !!(data.darkTetradData?.length || data.psychData?.[0]?.dark_triad_indicators || hasAnalysis(data, 'darkTetrad')),
    influenceVectors: () => !!(data.influenceVectorData?.length || data.influenceData?.data || hasAnalysis(data, 'influence')),
    financialPsychology: () => !!(data.financialPsychData?.length || hasAnalysis(data, 'financialPsychology')),
    sacredValues: () => !!(data.sacredValuesData?.length || hasAnalysis(data, 'sacredValues')),
    deceptionAnalysis: () => !!(data.deceptionAnalysisData?.length || hasAnalysis(data, 'deceptionAnalysis')),
    
    // Warfare sections
    cognitiveWarfare: () => !!(data.cognitiveWarfareData?.length || hasAnalysis(data, 'cognitiveWarfare')),
    deceptionOps: () => !!(data.deceptionOpsData?.length || hasAnalysis(data, 'deceptionOps')),
    trauma: () => !!(data.traumaData?.length || hasAnalysis(data, 'trauma')),
    betrayal: () => !!(data.betrayalData?.length || hasAnalysis(data, 'betrayal')),
    vulnerabilityWindows: () => !!(data.vulnerabilityWindowsData?.length || hasAnalysis(data, 'vulnerabilityWindows')),
    activeDefense: () => !!(data.activeDefenseData?.length),
    realityTesting: () => !!(data.realityTestingData?.length || hasAnalysis(data, 'realityTesting')),
    identityDestab: () => !!(data.identityDestabData?.length || hasAnalysis(data, 'identityDestab')),
    semanticWarfare: () => !!(data.semanticWarfareData?.length || hasAnalysis(data, 'semanticWarfare')),
    memeticPropagation: () => !!(data.memeticData?.length || hasAnalysis(data, 'memeticPropagation')),
    futureModeling: () => !!(data.futureModelingData?.length || hasAnalysis(data, 'futureModeling')),
    precognitive: () => !!(data.precognitiveData?.length || hasAnalysis(data, 'precognitive')),
    choiceArchitecture: () => !!(data.choiceArchitectureData?.length || hasAnalysis(data, 'choiceArchitecture')),
    influenceOps: () => !!(data.influenceOpsData?.length || hasAnalysis(data, 'influenceOps')),
    threatActor: () => !!(data.threatActorData?.length || hasAnalysis(data, 'threatActor')),
    trustTrajectory: () => !!(data.trustTrajectoriesData?.length || data.trustData?.length),
    coerciveControl: () => !!(data.coerciveControlData?.length || hasAnalysis(data, 'coerciveControl')),
    influence: () => !!(data.influenceData?.data || data.influenceVectorData?.length || hasAnalysis(data, 'influence')),
    opsecAssessment: () => !!(data.opsecAssessments?.length || hasAnalysis(data, 'opsecAssessment')),
    socialEngineering: () => !!(data.socialEngineeringIncidents?.length || hasAnalysis(data, 'socialEngineering')),
    crisisResponse: () => !!(data.crisisEvents?.length || data.emergencyProtocols?.length || hasAnalysis(data, 'crisisResponse')),
    lawfareDefense: () => !!(data.legalThreats?.length || hasAnalysis(data, 'lawfareDefense')),
    reputationDefense: () => !!(data.reputationIncidents?.length || hasAnalysis(data, 'reputationDefense')),
    familyProtection: () => !!(data.protectedPersons?.length || hasAnalysis(data, 'familyProtection')),
    economicWarfare: () => !!(data.economicThreats?.length || hasAnalysis(data, 'economicWarfare')),
    tscmSweep: () => !!(data.tscmSweeps?.length || hasAnalysis(data, 'tscmSweep')),
    digitalFootprint: () => !!(data.digitalFootprints?.length || hasAnalysis(data, 'digitalFootprint')),
    behavioralBaseline: () => !!(data.behavioralBaselines?.length || hasAnalysis(data, 'behavioralBaseline')),
    
    // Fusion sections
    temporalFusion: () => !!(data.temporalFusionData?.length || hasAnalysis(data, 'temporalFusion')),
    digitalTwin: () => !!(data.digitalTwinData?.length || hasAnalysis(data, 'digitalTwin')),
    graphRag: () => !!(data.graphRagData?.length || hasAnalysis(data, 'graphRag')),
    shadowNetwork: () => !!(data.shadowNetworkData?.length || hasAnalysis(data, 'shadowNetwork')),
    dempsterShafer: () => !!(data.dempsterShaferData?.length || hasAnalysis(data, 'dempsterShafer')),
    counterfactual: () => !!(data.counterfactualData?.length || hasAnalysis(data, 'counterfactual')),
    mosaicFusion: () => !!(data.mosaicFusionData?.length || hasAnalysis(data, 'mosaicFusion')),
    patternOfLifeFusion: () => !!(data.patternOfLifeEngineData?.length || hasAnalysis(data, 'patternOfLifeFusion')),
    entityResolution: () => !!(data.entityResolutionData?.length || hasAnalysis(data, 'entityResolution')),
    sentimentCascade: () => !!(data.sentimentCascadeData?.length || hasAnalysis(data, 'sentimentCascade')),
    crossDomainSynthesis: () => hasAnalysis(data, 'crossDomainSynthesis'),
    predictiveConvergence: () => hasAnalysis(data, 'predictiveConvergence'),
    
    // Analysis sections
    analysis: () => !!(data.allAnalyses?.length),
    influenceResistance: () => !!(data.influenceResistanceData?.length || hasAnalysis(data, 'influenceResistance')),
    behavioralEconomics: () => !!(data.financialPsychData?.length || hasAnalysis(data, 'behavioralEconomics')),
    network: () => !!(data.networkPositionData?.length || hasAnalysis(data, 'network')),
    networkPosition: () => !!(data.networkPositionData?.length || hasAnalysis(data, 'networkPosition')),
    predictionAccuracy: () => !!(data.predictionHistoryData?.length || hasAnalysis(data, 'predictionAccuracy')),
    counterIntel: () => !!(data.counterIntelData?.length || hasAnalysis(data, 'counterIntel')),
    proportionalResponse: () => !!(data.proportionalResponseData?.length),
    crossModal: () => !!(data.deceptionAnalysisData?.length || hasAnalysis(data, 'crossModal')),
    actionPlans: () => !!(data.actionPlansData?.length),
  };

  // Execute the check if defined, otherwise check allAnalyses for any matching type
  const check = checks[sectionId];
  if (check) {
    return check();
  }

  // Fallback: check if any analysis exists that matches the section ID
  return hasAnalysis(data, sectionId);
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
 * Useful for renderers that need to fallback (v3.9.31)
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
 * Extract result from an analysis record (v3.9.31)
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
