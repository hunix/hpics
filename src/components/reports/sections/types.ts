/**
 * PDFDossierGenerator Types
 * Shared types for dossier section components
 */

import jsPDF from 'jspdf';
import { LucideIcon } from 'lucide-react';

export interface DossierSection {
  id: string;
  label: string;
  icon: LucideIcon;
  enabled: boolean;
  category: 'core' | 'intelligence' | 'warfare' | 'analysis';
}

export type DossierTemplate = 'executive' | 'operational' | 'full' | 'surveillance' | 'warfare' | 'psychological' | 'fusion';

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

export interface DataStats {
  media: number;
  voice: number;
  analyses: number;
  sources: number;
}

export interface TaskResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  error?: string;
}

// RASCLS/Cialdini's 7 Principles of Influence
export const CIALDINI_PRINCIPLES = [
  { key: 'reciprocity', label: 'Reciprocity', description: 'Obligation to return favors' },
  { key: 'authority', label: 'Authority', description: 'Deference to expertise' },
  { key: 'scarcity', label: 'Scarcity', description: 'Value of rare opportunities' },
  { key: 'commitment', label: 'Commitment/Consistency', description: 'Honoring prior commitments' },
  { key: 'liking', label: 'Liking', description: 'Favor for those we like' },
  { key: 'social_proof', label: 'Social Proof', description: 'Following others\' actions' },
  { key: 'unity', label: 'Unity', description: 'Shared identity influence' },
];

// FBI Elicitation Techniques
export const FBI_TECHNIQUES = [
  'Assumed Knowledge', 'Deliberate False Statement', 'Bracketing', 'Flattery',
  'Criticism', 'Appeal to Ego', 'Quid Pro Quo', 'Mutual Interest',
  'Conformity Pressure', 'Word Repetition', 'Feigned Naivete', 'Disbelief'
];
