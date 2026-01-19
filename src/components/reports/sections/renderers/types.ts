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
 * Extended dossier data with computed fields added by PDFDossierGenerator
 */
export interface ExtendedDossierData extends DossierDataResult {
  // Computed fields added before rendering
  contactName: string;
  totalAnomalies: number;
  totalMediaAnalyzed: number;
  totalVoiceSessions: number;
  intelligenceCompleteness: number;
  
  // AI analyses pre-filtered by type
  behavioralDnaAnalysis?: { result: unknown };
  relationshipAnalysis?: { result: unknown };
}

/**
 * Section renderer function signature
 * Takes the PDF context (with helpers) and the extended dossier data
 */
export type SectionRenderer = (
  ctx: PDFContext,
  data: ExtendedDossierData
) => void;

/**
 * Map of section IDs to their renderer functions
 */
export interface SectionRendererMap {
  [sectionId: string]: SectionRenderer;
}
