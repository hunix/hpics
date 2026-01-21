/**
 * Section Data Check Utility (v3.9.24)
 * Pre-render check to determine if a section has data worth rendering
 * Prevents empty pages in PDF output
 */

import type { ExtendedDossierData } from '../sections/renderers/types';

/**
 * Analysis type aliases - maps section data field names to actual analysis_type values
 * stored in ai_analyses table by edge functions
 */
const ANALYSIS_TYPE_ALIASES: Record<string, string[]> = {
  // Intelligence sections
  quantumCognition: ['quantum_cognition'],
  playbook: ['playbook', 'engagement_playbook'],
  behavioralDna: ['behavioral_dna'],
  relationship: ['relationship_score', 'relationship_dynamics'],
  hypnoticPatterns: ['narrative_control', 'hypnotic_patterns'],
  cognitiveLoad: ['cognitive_warfare', 'cognitive_load'],
  sacredValues: ['existential_leverage', 'sacred_values'],
  darkTetrad: ['manipulation_susceptibility', 'dark_tetrad'],
  
  // Warfare sections
  realityTesting: ['cognitive_warfare', 'reality_testing'],
  identityDestab: ['manipulation_susceptibility', 'identity_destabilization'],
  semanticWarfare: ['narrative_control', 'semantic_warfare'],
  vulnerabilityWindows: ['trauma_exploitation', 'vulnerability_windows'],
  deceptionOps: ['enhanced_deception_detection', 'deception_operations'],
  influenceOps: ['influence_profile', 'influence_operations'],
  betrayal: ['trauma_exploitation', 'betrayal_prediction'],
  choiceArchitecture: ['manipulation_susceptibility', 'choice_architecture'],
  coerciveControl: ['coercion_resistance', 'coercive_control'],
  threatActor: ['counter_intelligence', 'threat_actor'],
  
  // Fusion sections
  temporalFusion: ['temporal_fusion'],
  digitalTwin: ['behavioral_baseline', 'digital_twin'],
  graphRag: ['deep_intelligence_comprehensive', 'graph_rag'],
  shadowNetwork: ['network_exploitation', 'shadow_network'],
  dempsterShafer: ['mosaic_intelligence_fusion', 'dempster_shafer'],
  counterfactual: ['behavioral_prediction', 'counterfactual'],
  patternOfLife: ['behavioral_dna', 'pattern_of_life'],
  patternOfLifeFusion: ['temporal_fusion', 'pattern_of_life_fusion'],
  entityResolution: ['intelligence_dossier', 'entity_resolution'],
  sentimentCascade: ['sentiment', 'sentiment_cascade'],
  crossDomainSynthesis: ['mosaic_intelligence_fusion', 'cross_domain'],
  predictiveConvergence: ['behavioral_prediction', 'predictive_convergence'],
  
  // Analysis sections
  influenceResistance: ['coercion_resistance', 'influence_resistance'],
  behavioralEconomics: ['economic_warfare', 'behavioral_economics'],
  network: ['network_exploitation', 'network_position', 'power_network'],
  counterIntel: ['counter_intelligence', 'counter_intel'],
  predictionAccuracy: ['prediction_accuracy', 'behavioral_prediction'],
  futureModeling: ['behavioral_prediction', 'future_modeling'],
  precognitive: ['precognitive_patterns', 'precognitive'],
  crossModal: ['mosaic_intelligence_fusion', 'cross_modal_synthesis'],
  memeticPropagation: ['memetic_propagation', 'narrative_control'],
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
    mice: () => !!(data.miceData?.length),
    cialdini: () => !!(data.influenceData?.data),
    psychProfile: () => !!(data.psychData?.length),
    trust: () => !!(data.trustData?.length),
    behavioralDna: () => !!(data.behavioralDnaAnalysis || hasAnalysis(data, 'behavioralDna')),
    quantumCognition: () => !!(data.quantumCognitionData?.length || hasAnalysis(data, 'quantumCognition')),
    relationship: () => !!(data.relationshipAnalysis || hasAnalysis(data, 'relationship')),
    playbook: () => !!(data.playbookData?.length || hasAnalysis(data, 'playbook')),
    hypnoticPatterns: () => !!(data.hypnoticPatternsData?.length || hasAnalysis(data, 'hypnoticPatterns')),
    elicitation: () => !!(data.elicitationData?.length || data.elicitationSessions?.length),
    cognitiveLoad: () => !!(data.cognitiveLoadData?.length || hasAnalysis(data, 'cognitiveLoad')),
    darkTetrad: () => !!(data.darkTetradData?.length || data.psychData?.[0]?.dark_triad_indicators || hasAnalysis(data, 'darkTetrad')),
    influenceVectors: () => !!(data.influenceVectorData?.length || data.influenceData?.data),
    financialPsychology: () => !!(data.financialPsychData?.length || hasAnalysis(data, 'financialPsychology')),
    sacredValues: () => !!(data.sacredValuesData?.length || hasAnalysis(data, 'sacredValues')),
    deceptionAnalysis: () => !!(data.deceptionAnalysisData?.length || hasAnalysis(data, 'deceptionOps')),
    
    // Warfare sections
    cognitiveWarfare: () => !!(data.cognitiveWarfareData?.length),
    deceptionOps: () => !!(data.deceptionOpsData?.length || hasAnalysis(data, 'deceptionOps')),
    trauma: () => !!(data.traumaData?.length),
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
    trustTrajectory: () => !!(data.trustTrajectoriesData?.length),
    coerciveControl: () => !!(data.coerciveControlData?.length || hasAnalysis(data, 'coerciveControl')),
    influence: () => !!(data.influenceData?.data || data.influenceVectorData?.length),
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
    temporalFusion: () => !!(data.temporalFusionData?.length || hasAnalysis(data, 'temporalFusion')),
    digitalTwin: () => !!(data.digitalTwinData?.length || hasAnalysis(data, 'digitalTwin')),
    graphRag: () => !!(data.graphRagData?.length || hasAnalysis(data, 'graphRag')),
    shadowNetwork: () => !!(data.shadowNetworkData?.length || hasAnalysis(data, 'shadowNetwork')),
    dempsterShafer: () => !!(data.dempsterShaferData?.length || hasAnalysis(data, 'dempsterShafer')),
    counterfactual: () => !!(data.counterfactualData?.length || hasAnalysis(data, 'counterfactual')),
    mosaicFusion: () => !!(data.mosaicFusionData?.length),
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
 * Useful for renderers that need to fallback
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
 * Extract result from an analysis record (handles both direct and nested formats)
 */
export function extractResult(analysisRecord: Record<string, unknown> | null): Record<string, unknown> {
  if (!analysisRecord) return {};
  return (analysisRecord.result || analysisRecord) as Record<string, unknown>;
}
