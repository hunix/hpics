/**
 * PDF Generation Hook (v3.9.30)
 * Handles the actual PDF document generation logic
 * v3.9.30: Fixed yPos state sync, added safeFormatDate utility
 */

import jsPDF from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import type { DossierSection, DossierTemplate, PDFRenderContext } from '../sections/types';

export interface PDFGenerationOptions {
  profileId: string;
  contactName: string;
  template: DossierTemplate;
  sections: DossierSection[];
}

export interface PDFContext extends PDFRenderContext {
  checkPageBreak: (neededSpace: number) => boolean;
  renderSectionHeader: (title: string, color?: [number, number, number]) => void;
  renderSubsection: (title: string) => void;
  renderBullet: (text: string, indent?: number, bulletChar?: string) => void;
  renderKeyValue: (key: string, value: string, keyWidth?: number) => void;
  renderScoreBar: (label: string, score: number, maxScore?: number, color?: [number, number, number]) => void;
  renderPriorityBadge: (priority: string, x: number, y: number) => void;
}

/**
 * Safe date formatting utility (v3.9.30)
 * Handles null, undefined, invalid dates gracefully
 */
export function safeFormatDate(
  value: unknown,
  formatString: string = 'MMM d, yyyy',
  fallback: string = 'Unknown'
): string {
  if (!value) return fallback;
  
  try {
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      // Try ISO parse first, fall back to Date constructor
      date = parseISO(value);
      if (!isValid(date)) {
        date = new Date(value);
      }
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else {
      return fallback;
    }
    
    if (!isValid(date)) return fallback;
    
    return format(date, formatString);
  } catch {
    return fallback;
  }
}

export function createPDFDocument(): { doc: jsPDF; context: PDFContext } {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  const footerHeight = 15;
  const maxContentY = pageHeight - footerHeight - margin;
  
  // v3.9.30: Use mutable state object instead of closure variable
  // This ensures all helper functions share the same yPos state
  const state = { yPos: 20 };

  const checkPageBreak = (neededSpace: number): boolean => {
    if (state.yPos + neededSpace > maxContentY) {
      doc.addPage();
      state.yPos = margin;
      return true;
    }
    return false;
  };

  const renderSectionHeader = (title: string, color: [number, number, number] = [0, 0, 0]) => {
    checkPageBreak(25);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, state.yPos - 3, margin + contentWidth, state.yPos - 3);
    state.yPos += 2;
    
    doc.setFillColor(color[0], color[1], color[2], 0.1);
    doc.rect(margin - 2, state.yPos - 2, contentWidth + 4, 10, 'F');
    
    doc.setFillColor(...color);
    doc.rect(margin - 2, state.yPos - 2, 3, 10, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title.toUpperCase(), margin + 5, state.yPos + 5);
    doc.setTextColor(0);
    state.yPos += 15;
  };

  const renderSubsection = (title: string) => {
    checkPageBreak(12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(title, margin, state.yPos);
    doc.setTextColor(0);
    state.yPos += lineHeight + 2;
  };

  const renderBullet = (text: string, indent: number = 0, bulletChar: string = '•') => {
    const availableWidth = contentWidth - indent - 5;
    const lines = doc.splitTextToSize(`${bulletChar} ${text}`, availableWidth);
    checkPageBreak(lines.length * lineHeight + 2);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, margin + indent, state.yPos);
    state.yPos += lines.length * lineHeight;
  };

  const renderKeyValue = (key: string, value: string, keyWidth: number = 55) => {
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(key + ':', margin, state.yPos);
    doc.setFont('helvetica', 'normal');
    
    const valueStr = String(value || 'N/A');
    const lines = doc.splitTextToSize(valueStr, contentWidth - keyWidth - 5);
    doc.text(lines, margin + keyWidth, state.yPos);
    state.yPos += Math.max(lines.length * lineHeight, lineHeight);
  };

  const renderScoreBar = (label: string, score: number, maxScore: number = 100, color: [number, number, number] = [0, 100, 200]) => {
    checkPageBreak(14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin, state.yPos);
    
    const barX = margin + 50;
    const barWidth = 80;
    const barHeight = 6;
    const fillWidth = (score / maxScore) * barWidth;
    
    doc.setFillColor(230, 230, 230);
    doc.rect(barX, state.yPos - 5, barWidth, barHeight, 'F');
    
    doc.setFillColor(...color);
    doc.rect(barX, state.yPos - 5, fillWidth, barHeight, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text(`${Math.round(score)}%`, barX + barWidth + 5, state.yPos);
    
    state.yPos += 8;
  };

  const renderPriorityBadge = (priority: string, x: number, y: number) => {
    const colors: Record<string, [number, number, number]> = {
      critical: [180, 0, 0],
      high: [200, 100, 0],
      medium: [200, 180, 0],
      low: [0, 150, 0],
    };
    const color = colors[priority.toLowerCase()] || [100, 100, 100];
    
    doc.setFillColor(...color);
    doc.roundedRect(x, y - 3, 18, 5, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(255, 255, 255);
    doc.text(priority.toUpperCase(), x + 2, y);
    doc.setTextColor(0);
  };

  // v3.9.30: Use getters/setters to ensure state synchronization
  const context: PDFContext = {
    doc,
    get yPos() { return state.yPos; },
    set yPos(v: number) { state.yPos = v; },
    lineHeight,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    footerHeight,
    maxContentY,
    checkPageBreak,
    renderSectionHeader,
    renderSubsection,
    renderBullet,
    renderKeyValue,
    renderScoreBar,
    renderPriorityBadge,
  };

  return { doc, context };
}

export function renderCoverPage(
  doc: jsPDF,
  contactName: string,
  organization: string | null,
  template: DossierTemplate,
  enabledSectionCount: number,
  intelligenceCompleteness: number,
  totalAnomalies: number
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  const riskLevel = totalAnomalies > 2 ? 'HIGH RISK' : totalAnomalies > 0 ? 'MEDIUM RISK' : 'LOW RISK';
  
  // Header bar
  doc.setFillColor(20, 30, 50);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text('CLASSIFICATION: TOP SECRET // NOFORN', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('INTELLIGENCE DOSSIER', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(150, 200, 255);
  doc.text(template.toUpperCase() + ' PACKAGE', pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(`Intelligence Completeness: ${intelligenceCompleteness}%`, pageWidth / 2, 70, { align: 'center' });
  
  doc.setTextColor(0);
  
  // Subject name
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(contactName.toUpperCase(), pageWidth / 2, 105, { align: 'center' });
  
  if (organization) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(organization, pageWidth / 2, 118, { align: 'center' });
    doc.setTextColor(0);
  }
  
  // Generation info
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'MMMM d, yyyy at HH:mm')}`, pageWidth / 2, 210, { align: 'center' });
  doc.text('PICS Autonomous General Intelligence System v5.0', pageWidth / 2, 218, { align: 'center' });
  doc.text(`${enabledSectionCount} Intelligence Sections Active`, pageWidth / 2, 226, { align: 'center' });
  doc.setTextColor(0);
}

export function addPageFooters(doc: jsPDF, contactName: string) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text('TOP SECRET // NOFORN - PICS AGIS v5.0', margin, pageHeight - 8);
    doc.text(`${format(new Date(), 'yyyy-MM-dd HH:mm')} | ${contactName}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
}

/**
 * Safe print utility for unknown values
 */
export function safePrint(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(v => safePrint(v)).join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}
