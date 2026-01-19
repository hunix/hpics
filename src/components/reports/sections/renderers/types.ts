/**
 * Section Renderer Types (v3.7.1)
 * Shared types for modular PDF section renderers
 */

import type { PDFContext } from '../../hooks/usePDFGeneration';
import type { DossierDataResult } from '../../hooks/useDossierData';

// Re-export for convenience
export type { PDFContext } from '../../hooks/usePDFGeneration';
export type { DossierDataResult } from '../../hooks/useDossierData';

/**
 * Section renderer function signature
 * Takes the PDF context (with helpers) and the dossier data
 */
export type SectionRenderer = (
  ctx: PDFContext,
  data: DossierDataResult
) => void;

/**
 * Map of section IDs to their renderer functions
 */
export interface SectionRendererMap {
  [sectionId: string]: SectionRenderer;
}
