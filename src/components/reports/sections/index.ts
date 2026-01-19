/**
 * Dossier Sections - Barrel Export (v3.7.4)
 * Central export for all dossier section types, definitions, and hooks
 * 
 * PERFORMANCE OPTIMIZED: Explicit exports instead of export *
 * 
 * v3.7.4: Refactored to explicit exports for IDE performance
 * v3.7.1: Added section renderers export for modular PDF generation
 * v3.6.0: Added hooks exports for modular PDF generation
 */

// Types (explicit exports for performance)
export type {
  DossierSection,
  DossierTemplate,
  PDFRenderContext,
  DataStats,
  TaskResult,
} from './types';

export {
  CIALDINI_PRINCIPLES,
  FBI_TECHNIQUES,
} from './types';

// PDF Helpers (explicit exports for performance)
export {
  createPDFContext,
  checkPageBreak,
  renderSectionHeader,
  renderSubsection,
  renderBullet,
  renderKeyValue,
  renderScoreBar,
  renderPriorityBadge,
  safePrint,
  type PDFContext,
} from './pdfHelpers';

// Section Definitions (explicit exports for performance)
export {
  DEFAULT_SECTIONS,
  TEMPLATE_SECTION_IDS,
  applySectionTemplate,
} from './sectionDefinitions';

// Modular section renderers (v3.7.1)
export { 
  allSectionRenderers,
  coreSectionRenderers,
  intelligenceSectionRenderers,
  warfareSectionRenderers,
  fusionSectionRenderers,
} from './renderers';

// Re-export hooks for convenience (avoid duplicates with pdfHelpers)
export { useDossierData, type DossierDataResult } from '../hooks/useDossierData';
export { useIntelligenceGeneration } from '../hooks/useIntelligenceGeneration';
export { 
  createPDFDocument, 
  renderCoverPage, 
  addPageFooters,
  type PDFGenerationOptions,
} from '../hooks/usePDFGeneration';
