/**
 * Dossier Sections - Barrel Export
 * Central export for all dossier section types, definitions, and hooks
 * 
 * v3.6.0: Added hooks exports for modular PDF generation
 */

export * from './types';
export * from './pdfHelpers';
export * from './sectionDefinitions';

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
