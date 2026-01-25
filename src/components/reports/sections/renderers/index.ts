/**
 * Section Renderers Barrel Export (v6.0)
 * Central export for all modular PDF section renderers
 * 83 sections across 5 categories - aligned with DEFAULT_SECTIONS
 */

export * from './types';

export { coreSectionRenderers, renderExecutiveBrief, renderSourceDashboard, renderContactOverview, renderTimeline, renderPatternOfLife, renderRelationshipEcosystem, renderMediaIntel, renderVoiceIntel, renderAnomalyDetection } from './CoreSectionRenderers';
export { intelligenceSectionRenderers, renderMICE, renderCialdini, renderPsychologicalProfile, renderTrust, renderBehavioralDNA, renderQuantumCognition, renderRelationship, renderPlaybook, renderHypnoticPatterns, renderElicitation, renderCognitiveLoad, renderDarkTetrad, renderInfluenceVectors, renderFinancialPsychology, renderSacredValues, renderDeceptionAnalysis } from './IntelligenceSectionRenderers';
export { warfareSectionRenderers, renderCognitiveWarfare, renderDeceptionOps, renderTrauma, renderBetrayal, renderVulnerabilityWindows, renderActiveDefense, renderRealityTesting, renderIdentityDestab, renderSemanticWarfare, renderMemeticPropagation, renderFutureModeling, renderPrecognitive, renderChoiceArchitecture, renderInfluenceOps, renderThreatActor, renderTrustTrajectory, renderCoerciveControl, renderInfluence, renderOpsecAssessment, renderSocialEngineering, renderCrisisResponse, renderLawfareDefense, renderReputationDefense, renderFamilyProtection, renderEconomicWarfare, renderTscmSweep, renderDigitalFootprint, renderBehavioralBaseline } from './WarfareSectionRenderers';
export { fusionSectionRenderers, renderTemporalFusion, renderDigitalTwin, renderGraphRAG, renderShadowNetwork, renderDempsterShafer, renderCounterfactual, renderMosaicFusion, renderPatternOfLifeFusion, renderEntityResolution, renderSentimentCascade, renderCrossDomainSynthesis, renderPredictiveConvergence, renderBiometricFusion, renderCalendarIntelligence, renderGeospatialCommunication, renderFinancialDocumentSynthesis } from './FusionSectionRenderers';
export { analysisSectionRenderers, renderBehavioralAnalysis, renderInfluenceResistance, renderBehavioralEconomics, renderNetworkPosition, renderPredictionAccuracy, renderCounterIntel, renderProportionalResponse, renderCrossModalDeception, renderActionPlans } from './AnalysisSectionRenderers';
export { advancedIntelligenceSectionRenderers, renderRelationshipHalfLife, renderRedTeamAssessment, renderMultiPartyDeception, renderZeroDayAnomalies, renderHypergameAnalysis } from './AdvancedIntelligenceRenderers';

import { coreSectionRenderers } from './CoreSectionRenderers';
import { intelligenceSectionRenderers } from './IntelligenceSectionRenderers';
import { warfareSectionRenderers } from './WarfareSectionRenderers';
import { fusionSectionRenderers } from './FusionSectionRenderers';
import { analysisSectionRenderers } from './AnalysisSectionRenderers';
import { advancedIntelligenceSectionRenderers } from './AdvancedIntelligenceRenderers';
import { SectionRendererMap } from './types';

/**
 * Complete map of all 83 section renderers by section ID
 * v6.0: Includes 5 new Advanced Intelligence sections
 */
export const allSectionRenderers: SectionRendererMap = {
  ...coreSectionRenderers,
  ...intelligenceSectionRenderers,
  ...warfareSectionRenderers,
  ...fusionSectionRenderers,
  ...analysisSectionRenderers,
  ...advancedIntelligenceSectionRenderers,
};
