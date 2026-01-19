/**
 * Section Renderer Types (v3.7.1)
 * Shared types for modular PDF section renderers
 */

import jsPDF from 'jspdf';

export interface PDFRenderContext {
  doc: jsPDF;
  yPos: number;
  lineHeight: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  footerHeight: number;
  maxContentY: number;
}

export interface RenderHelpers {
  checkPageBreak: (neededSpace: number) => boolean;
  renderSectionHeader: (title: string, color?: [number, number, number]) => void;
  renderSubsection: (title: string) => void;
  renderBullet: (text: string, indent?: number, bulletChar?: string) => void;
  renderKeyValue: (key: string, value: string, keyWidth?: number) => void;
  renderScoreBar: (label: string, score: number, maxScore?: number, color?: [number, number, number]) => void;
  renderPriorityBadge: (priority: string, x: number, y: number) => void;
}

export interface DossierData {
  profile: Record<string, unknown>;
  contactName: string;
  commData: { data: unknown[] | null };
  psychData: { data: unknown[] | null };
  allAnalyses: { data: unknown[] | null };
  mediaAnalyses: { data: unknown[] | null };
  mediaData: { data: unknown[] | null };
  voiceData: { data: unknown[] | null };
  behavioralData: { data: unknown[] | null };
  trustData: { data: unknown[] | null };
  miceData: { data: unknown[] | null };
  influenceData: { data: unknown | null };
  threatData: { data: unknown[] | null };
  observationsData: { data: unknown[] | null };
  predictionsData: { data: unknown[] | null };
  anomaliesData: { data: unknown[] | null };
  milestonesData: { data: unknown[] | null };
  relationshipsData: { data: unknown[] | null };
  betrayalData: { data: unknown[] | null };
  traumaData: { data: unknown[] | null };
  scenarioPredictions: { data: unknown[] | null };
  crossModalData: { data: unknown[] | null };
  cognitiveSuperpositions: { data: unknown[] | null };
  precursorSignatures: { data: unknown[] | null };
  timelineProbabilities: { data: unknown[] | null };
  elicitationSessions: { data: unknown[] | null };
  financialPsychology: { data: unknown[] | null };
  sacredValuesData: { data: unknown[] | null };
  memeticCampaignsData: { data: unknown[] | null };
  semanticOpsData: { data: unknown[] | null };
  identityDestabData: { data: unknown[] | null };
  realityFrameworksData: { data: unknown[] | null };
  cognitiveWarfareData: { data: unknown[] | null };
  activeDefenseData: { data: unknown[] | null };
  deceptionOpsData: { data: unknown[] | null };
  vulnerabilityWindowsData: { data: unknown[] | null };
  trustTrajectoriesData: { data: unknown[] | null };
  proportionalResponseData: { data: unknown[] | null };
  mosaicFusionData: { data: unknown[] | null };
  temporalFusionData: { data: unknown[] | null };
  digitalTwinData: { data: unknown[] | null };
  graphRagData: { data: unknown[] | null };
  shadowNetworkData: { data: unknown[] | null };
  dempsterShaferData: { data: unknown[] | null };
  counterfactualData: { data: unknown[] | null };
  patternOfLifeData: { data: unknown[] | null };
  entityResolutionData: { data: unknown[] | null };
  sentimentCascadeData: { data: unknown[] | null };
  // Computed analyses
  behavioralDnaAnalysis?: { result: unknown } | null;
  sacredValuesAnalysis?: { result: unknown } | null;
  playbookAnalysis?: { result: unknown } | null;
  deepIntelAnalysis?: { result: unknown } | null;
  relationshipAnalysis?: { result: unknown } | null;
  mediaAggregation?: { result: unknown } | null;
  // Computed stats
  totalMediaAnalyzed: number;
  totalVoiceSessions: number;
  totalObservations: number;
  totalRelationships: number;
  totalCommunications: number;
  totalAnalyses: number;
  totalAnomalies: number;
  intelligenceCompleteness: number;
}

export type SectionRenderer = (
  ctx: PDFRenderContext,
  helpers: RenderHelpers,
  data: DossierData
) => void;

export interface SectionRendererMap {
  [sectionId: string]: SectionRenderer;
}
