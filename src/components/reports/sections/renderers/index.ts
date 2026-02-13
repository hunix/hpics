/**
 * Section Renderers Barrel Export (v8.0)
 * Central export for all modular PDF section renderers
 * 124 sections across 6 categories - aligned with DEFAULT_SECTIONS
 */

export type { PDFContext, DossierDataResult, ExtendedDossierData, SectionRenderer, SectionRendererMap } from './types';

export { coreSectionRenderers, renderExecutiveBrief, renderSourceDashboard, renderContactOverview, renderTimeline, renderPatternOfLife, renderRelationshipEcosystem, renderMediaIntel, renderVoiceIntel, renderAnomalyDetection } from './CoreSectionRenderers';
export { intelligenceSectionRenderers, renderMICE, renderCialdini, renderPsychologicalProfile, renderTrust, renderBehavioralDNA, renderQuantumCognition, renderRelationship, renderPlaybook, renderHypnoticPatterns, renderElicitation, renderCognitiveLoad, renderDarkTetrad, renderInfluenceVectors, renderFinancialPsychology, renderSacredValues, renderDeceptionAnalysis } from './IntelligenceSectionRenderers';
export { warfareSectionRenderers, renderCognitiveWarfare, renderDeceptionOps, renderTrauma, renderBetrayal, renderVulnerabilityWindows, renderActiveDefense, renderRealityTesting, renderIdentityDestab, renderSemanticWarfare, renderMemeticPropagation, renderFutureModeling, renderPrecognitive, renderChoiceArchitecture, renderInfluenceOps, renderThreatActor, renderTrustTrajectory, renderCoerciveControl, renderInfluence, renderOpsecAssessment, renderSocialEngineering, renderCrisisResponse, renderLawfareDefense, renderReputationDefense, renderFamilyProtection, renderEconomicWarfare, renderTscmSweep, renderDigitalFootprint, renderBehavioralBaseline } from './WarfareSectionRenderers';
export { fusionSectionRenderers, renderTemporalFusion, renderDigitalTwin, renderGraphRAG, renderShadowNetwork, renderDempsterShafer, renderCounterfactual, renderMosaicFusion, renderPatternOfLifeFusion, renderEntityResolution, renderSentimentCascade, renderCrossDomainSynthesis, renderPredictiveConvergence, renderBiometricFusion, renderCalendarIntelligence, renderGeospatialCommunication, renderFinancialDocumentSynthesis } from './FusionSectionRenderers';
export { analysisSectionRenderers, renderBehavioralAnalysis, renderInfluenceResistance, renderBehavioralEconomics, renderNetworkPosition, renderPredictionAccuracy, renderCounterIntel, renderProportionalResponse, renderCrossModalDeception, renderActionPlans } from './AnalysisSectionRenderers';
export { advancedIntelligenceSectionRenderers, renderRelationshipHalfLife, renderRedTeamAssessment, renderMultiPartyDeception, renderZeroDayAnomalies, renderHypergameAnalysis, renderSubvocalizationDetection, renderAudioBurstAnalysis, renderIioAttribution, renderReflexiveControl, renderCognitiveEffect, renderTheoryOfMind, renderCollectiveBehavior, renderStylometricAnalysis, renderDark2Clear, renderGatedBioFusion, renderTasComCommunity, renderBiometricRetention } from './AdvancedIntelligenceRenderers';
export { v8SectionRenderers, renderDracoDeception, renderSentientIntent, renderInsiderThreat, renderBayesianIntention, renderRedTeamSimulation, renderSemaforForgery, renderEpistemicVulnerability, renderCognitiveIW, renderPsychoagentCascade, renderAffectiveManipulation, renderHyperpersonalization, renderComputationalPersuasion, renderSyntheticMemory, renderPreMemBelief, renderLinguisticStress, renderMemoryAnchor, renderEmotionalContagion, renderSacredValuePrediction, renderPupillometry, renderThermalStress, renderAttentionMultimodal, renderKeystrokeDynamics, renderSheafInfluence, renderCtdgLink, renderCascadeVirality, renderNetworkResilience, renderGazePattern, renderMicroExpressionTimeline, renderVoiceStressCorrelation, renderSocialGraphPrediction, renderInfluenceCampaignOptimization, renderCounterNarrative, renderPredictiveDoctrine } from './V8SectionRenderers';

import { coreSectionRenderers } from './CoreSectionRenderers';
import { intelligenceSectionRenderers } from './IntelligenceSectionRenderers';
import { warfareSectionRenderers } from './WarfareSectionRenderers';
import { fusionSectionRenderers } from './FusionSectionRenderers';
import { analysisSectionRenderers } from './AnalysisSectionRenderers';
import { advancedIntelligenceSectionRenderers } from './AdvancedIntelligenceRenderers';
import { v8SectionRenderers } from './V8SectionRenderers';
import { SectionRendererMap } from './types';

/**
 * Complete map of all 124 section renderers by section ID
 * v8.0: Includes 33 Masterpiece Intelligence sections
 */
export const allSectionRenderers: SectionRendererMap = {
  ...coreSectionRenderers,
  ...intelligenceSectionRenderers,
  ...warfareSectionRenderers,
  ...fusionSectionRenderers,
  ...analysisSectionRenderers,
  ...advancedIntelligenceSectionRenderers,
  ...v8SectionRenderers,
};
