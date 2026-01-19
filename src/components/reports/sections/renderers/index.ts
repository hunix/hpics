/**
 * Section Renderers Barrel Export (v3.7.1)
 * Central export for all modular PDF section renderers
 */

export * from './types';

export { coreSectionRenderers, renderExecutiveBrief, renderSourceDashboard, renderContactOverview, renderTimeline } from './CoreSectionRenderers';
export { intelligenceSectionRenderers, renderMICE, renderCialdini, renderPsychologicalProfile, renderTrust, renderBehavioralDNA } from './IntelligenceSectionRenderers';
export { warfareSectionRenderers, renderCognitiveWarfare, renderDeceptionOps, renderTrauma, renderBetrayal, renderVulnerabilityWindows, renderActiveDefense } from './WarfareSectionRenderers';
export { fusionSectionRenderers, renderTemporalFusion, renderDigitalTwin, renderGraphRAG, renderShadowNetwork, renderDempsterShafer, renderCounterfactual, renderMosaicFusion } from './FusionSectionRenderers';

import { coreSectionRenderers } from './CoreSectionRenderers';
import { intelligenceSectionRenderers } from './IntelligenceSectionRenderers';
import { warfareSectionRenderers } from './WarfareSectionRenderers';
import { fusionSectionRenderers } from './FusionSectionRenderers';
import { SectionRendererMap } from './types';

/**
 * Complete map of all section renderers by section ID
 */
export const allSectionRenderers: SectionRendererMap = {
  ...coreSectionRenderers,
  ...intelligenceSectionRenderers,
  ...warfareSectionRenderers,
  ...fusionSectionRenderers,
};
