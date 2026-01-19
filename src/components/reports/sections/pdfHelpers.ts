/**
 * PDF Rendering Helper Functions
 * Centralized utilities for consistent PDF formatting
 */

import jsPDF from 'jspdf';

export interface PDFContext {
  doc: jsPDF;
  yPos: number;
  margin: number;
  contentWidth: number;
  lineHeight: number;
  maxContentY: number;
}

export function createPDFContext(doc: jsPDF): PDFContext {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 15;
  const maxContentY = pageHeight - footerHeight - margin;

  return {
    doc,
    yPos: 20,
    margin,
    contentWidth,
    lineHeight: 6,
    maxContentY
  };
}

export function checkPageBreak(ctx: PDFContext, neededSpace: number): boolean {
  if (ctx.yPos + neededSpace > ctx.maxContentY) {
    ctx.doc.addPage();
    ctx.yPos = ctx.margin;
    return true;
  }
  return false;
}

export function renderSectionHeader(
  ctx: PDFContext, 
  title: string, 
  color: [number, number, number] = [0, 0, 0]
): void {
  checkPageBreak(ctx, 25);
  
  ctx.doc.setDrawColor(200, 200, 200);
  ctx.doc.line(ctx.margin, ctx.yPos - 3, ctx.margin + ctx.contentWidth, ctx.yPos - 3);
  ctx.yPos += 2;
  
  ctx.doc.setFillColor(color[0], color[1], color[2], 0.1);
  ctx.doc.rect(ctx.margin - 2, ctx.yPos - 2, ctx.contentWidth + 4, 10, 'F');
  
  ctx.doc.setFillColor(...color);
  ctx.doc.rect(ctx.margin - 2, ctx.yPos - 2, 3, 10, 'F');
  
  ctx.doc.setFontSize(12);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setTextColor(...color);
  ctx.doc.text(title.toUpperCase(), ctx.margin + 5, ctx.yPos + 5);
  ctx.doc.setTextColor(0);
  ctx.yPos += 15;
}

export function renderSubsection(ctx: PDFContext, title: string): void {
  checkPageBreak(ctx, 12);
  ctx.doc.setFontSize(10);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setTextColor(60, 60, 60);
  ctx.doc.text(title, ctx.margin, ctx.yPos);
  ctx.doc.setTextColor(0);
  ctx.yPos += ctx.lineHeight + 2;
}

export function renderBullet(
  ctx: PDFContext, 
  text: string, 
  indent: number = 0, 
  bulletChar: string = '•'
): void {
  const availableWidth = ctx.contentWidth - indent - 5;
  const lines = ctx.doc.splitTextToSize(`${bulletChar} ${text}`, availableWidth);
  checkPageBreak(ctx, lines.length * ctx.lineHeight + 2);
  
  ctx.doc.setFontSize(9);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.text(lines, ctx.margin + indent, ctx.yPos);
  ctx.yPos += lines.length * ctx.lineHeight;
}

export function renderKeyValue(
  ctx: PDFContext, 
  key: string, 
  value: string, 
  keyWidth: number = 55
): void {
  checkPageBreak(ctx, 10);
  ctx.doc.setFontSize(9);
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.text(key + ':', ctx.margin, ctx.yPos);
  ctx.doc.setFont('helvetica', 'normal');
  
  const valueStr = String(value || 'N/A');
  const lines = ctx.doc.splitTextToSize(valueStr, ctx.contentWidth - keyWidth - 5);
  ctx.doc.text(lines, ctx.margin + keyWidth, ctx.yPos);
  ctx.yPos += Math.max(lines.length * ctx.lineHeight, ctx.lineHeight);
}

export function renderScoreBar(
  ctx: PDFContext, 
  label: string, 
  score: number, 
  maxScore: number = 100, 
  color: [number, number, number] = [0, 100, 200]
): void {
  checkPageBreak(ctx, 14);
  ctx.doc.setFontSize(8);
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.text(label, ctx.margin, ctx.yPos);
  
  const barX = ctx.margin + 50;
  const barWidth = 80;
  const barHeight = 6;
  const fillWidth = (score / maxScore) * barWidth;
  
  ctx.doc.setFillColor(230, 230, 230);
  ctx.doc.rect(barX, ctx.yPos - 5, barWidth, barHeight, 'F');
  
  ctx.doc.setFillColor(...color);
  ctx.doc.rect(barX, ctx.yPos - 5, fillWidth, barHeight, 'F');
  
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.text(`${Math.round(score)}%`, barX + barWidth + 5, ctx.yPos);
  
  ctx.yPos += 8;
}

export function renderPriorityBadge(
  ctx: PDFContext, 
  priority: string, 
  x: number, 
  y: number
): void {
  const colors: Record<string, [number, number, number]> = {
    critical: [180, 0, 0],
    high: [200, 100, 0],
    medium: [200, 180, 0],
    low: [0, 150, 0],
  };
  const color = colors[priority.toLowerCase()] || [100, 100, 100];
  
  ctx.doc.setFillColor(...color);
  ctx.doc.roundedRect(x, y - 3, 18, 5, 1, 1, 'F');
  ctx.doc.setFontSize(6);
  ctx.doc.setTextColor(255, 255, 255);
  ctx.doc.text(priority.toUpperCase(), x + 2, y);
  ctx.doc.setTextColor(0);
}

export function safePrint(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(safePrint).join(', ');
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).slice(0, 200);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}
