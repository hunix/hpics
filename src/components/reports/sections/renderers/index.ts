/**
 * Section Renderers Barrel Export (v3.9.32)
 * Central export for all modular PDF section renderers
 * 74 sections across 5 categories - aligned with DEFAULT_SECTIONS
 */

export * from './types';

export { coreSectionRenderers, renderExecutiveBrief, renderSourceDashboard, renderContactOverview, renderTimeline, renderPatternOfLife, renderRelationshipEcosystem, renderMediaIntel, renderVoiceIntel, renderAnomalyDetection } from './CoreSectionRenderers';
export { intelligenceSectionRenderers, renderMICE, renderCialdini, renderPsychologicalProfile, renderTrust, renderBehavioralDNA, renderQuantumCognition, renderRelationship, renderPlaybook, renderHypnoticPatterns, renderElicitation, renderCognitiveLoad, renderDarkTetrad, renderInfluenceVectors, renderFinancialPsychology, renderSacredValues, renderDeceptionAnalysis } from './IntelligenceSectionRenderers';
export { warfareSectionRenderers, renderCognitiveWarfare, renderDeceptionOps, renderTrauma, renderBetrayal, renderVulnerabilityWindows, renderActiveDefense, renderRealityTesting, renderIdentityDestab, renderSemanticWarfare, renderMemeticPropagation, renderFutureModeling, renderPrecognitive, renderChoiceArchitecture, renderInfluenceOps, renderThreatActor, renderTrustTrajectory, renderCoerciveControl, renderInfluence, renderOpsecAssessment, renderSocialEngineering, renderCrisisResponse, renderLawfareDefense, renderReputationDefense, renderFamilyProtection, renderEconomicWarfare, renderTscmSweep, renderDigitalFootprint, renderBehavioralBaseline } from './WarfareSectionRenderers';
export { fusionSectionRenderers, renderTemporalFusion, renderDigitalTwin, renderGraphRAG, renderShadowNetwork, renderDempsterShafer, renderCounterfactual, renderMosaicFusion, renderPatternOfLifeFusion, renderEntityResolution, renderSentimentCascade, renderCrossDomainSynthesis, renderPredictiveConvergence, renderBiometricFusion, renderCalendarIntelligence, renderGeospatialCommunication, renderFinancialDocumentSynthesis } from './FusionSectionRenderers';
export { analysisSectionRenderers, renderBehavioralAnalysis, renderInfluenceResistance, renderBehavioralEconomics, renderNetworkPosition, renderPredictionAccuracy, renderCounterIntel, renderProportionalResponse, renderCrossModalDeception, renderActionPlans } from './AnalysisSectionRenderers';

import { coreSectionRenderers } from './CoreSectionRenderers';
import { intelligenceSectionRenderers } from './IntelligenceSectionRenderers';
import { warfareSectionRenderers } from './WarfareSectionRenderers';
import { fusionSectionRenderers } from './FusionSectionRenderers';
import { analysisSectionRenderers } from './AnalysisSectionRenderers';
import { SectionRendererMap } from './types';

/**
 * Complete map of all 74 section renderers by section ID
 * v3.9.32: Aligned with DEFAULT_SECTIONS in sectionDefinitions.ts
 */
export const allSectionRenderers: SectionRendererMap = {
  ...coreSectionRenderers,
  ...intelligenceSectionRenderers,
  ...warfareSectionRenderers,
  ...fusionSectionRenderers,
  ...analysisSectionRenderers,
};
