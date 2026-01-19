/**
 * Dossier Sections - Barrel Export
 * Central export for all dossier section types, definitions, and hooks
 * 
 * v3.7.1: Added section renderers export for modular PDF generation
 * v3.6.0: Added hooks exports for modular PDF generation
 */

export * from './types';
export * from './pdfHelpers';
export * from './sectionDefinitions';

// Modular section renderers (v3.7.1) - exclude types to avoid conflicts
export { 
  allSectionRenderers,
  coreSectionRenderers,
  intelligenceSectionRenderers,
  warfareSectionRenderers,
  fusionSectionRenderers,
} from './renderers';

// Re-export hooks for convenience
export { useDossierData, type DossierDataResult } from '../hooks/useDossierData';
export { useIntelligenceGeneration } from '../hooks/useIntelligenceGeneration';
export { 
  createPDFDocument, 
  renderCoverPage, 
  addPageFooters, 
  safePrint,
  type PDFContext,
  type PDFGenerationOptions,
} from '../hooks/usePDFGeneration';
