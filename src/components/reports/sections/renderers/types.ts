/**
 * Section Renderer Types (v3.9.50)
 * Shared types for modular PDF section renderers
 * v3.9.50: Added v5.0/v6.0 intelligence boolean flags
 */

import type { PDFContext } from '../../hooks/usePDFGeneration';
import type { DossierDataResult } from '../../hooks/useDossierData';

// Re-export for convenience
export type { PDFContext } from '../../hooks/usePDFGeneration';
export type { DossierDataResult } from '../../hooks/useDossierData';

/**
 * Extended dossier data with computed fields added by PDFDossierGenerator
 * Uses index signature to allow dynamic data field access
 * 
 * Note: v5.0/v6.0 data fields (biometricFusionData, relationshipHalfLifeData, etc.)
 * are already defined in DossierDataResult and inherited here.
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
  emailInsightsAnalysis?: { result: unknown };
  
  // Communication metrics
  avgTrustScore: number;
  communicationFrequency: number;
  hasEmailIntelligence: boolean;
  emailInsightsCount: number;
  
  // v5.0 Fusion Intelligence flags
  hasBiometricFusion?: boolean;
  hasCalendarIntelligence?: boolean;
  hasGeospatialFusion?: boolean;
  hasFinancialSynthesis?: boolean;
  
  // v6.0 Advanced Intelligence flags
  hasRelationshipHalfLife?: boolean;
  hasRedTeamAssessment?: boolean;
  hasMultiPartyDeception?: boolean;
  hasZeroDayAnomalies?: boolean;
  hasHypergameAnalysis?: boolean;
  
  // Dynamic data fields - allows accessing any *Data property
  [key: string]: unknown;
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
