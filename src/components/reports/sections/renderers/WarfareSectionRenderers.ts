/**
 * Warfare Section Renderers (v3.7.1)
 */

import type { SectionRenderer } from './types';

export const renderCognitiveWarfare: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.cognitiveWarfareData?.length) return;
  
  ctx.renderSectionHeader('Cognitive Warfare Operations', [128, 0, 128]);
  (data.cognitiveWarfareData as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    ctx.checkPageBreak(30);
    ctx.renderSubsection((op.operation_name as string) || 'Unnamed Operation');
    doc.setFontSize(9);
    doc.text(`Type: ${op.operation_type || 'Standard'} | Status: ${(op.status as string)?.toUpperCase() || 'PLANNING'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderDeceptionOps: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.deceptionOpsData?.length) return;
  
  ctx.renderSectionHeader('Deception Operations', [139, 69, 19]);
  (data.deceptionOpsData as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection((op.operation_name as string) || 'Unnamed Deception');
    doc.setFontSize(9);
    doc.text(`Type: ${op.deception_type || 'Unknown'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderTrauma: SectionRenderer = (ctx, data) => {
  if (!data.traumaData?.length) return;
  ctx.renderSectionHeader('Trauma & Vulnerability Windows', [150, 50, 50]);
  const trauma = data.traumaData[0] as Record<string, unknown>;
  if (trauma.vulnerability_score !== undefined) {
    ctx.renderScoreBar('Vulnerability Score', (trauma.vulnerability_score as number) * 100, 100, [180, 0, 0]);
  }
  ctx.yPos += 8;
};

export const renderBetrayal: SectionRenderer = (ctx, data) => {
  if (!data.betrayalData?.length) return;
  ctx.renderSectionHeader('Betrayal & Crisis Prediction', [150, 0, 0]);
  const betrayal = data.betrayalData[0] as Record<string, unknown>;
  if (betrayal.betrayal_likelihood !== undefined) {
    ctx.renderScoreBar('Betrayal Likelihood', (betrayal.betrayal_likelihood as number) * 100, 100, [180, 0, 0]);
  }
  ctx.yPos += 8;
};

export const renderVulnerabilityWindows: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.vulnerabilityWindowsData?.length) return;
  
  ctx.renderSectionHeader('Vulnerability Windows', [220, 20, 60]);
  const activeWindows = (data.vulnerabilityWindowsData as Array<Record<string, unknown>>).filter(w => w.current_status === 'active');
  
  if (activeWindows.length > 0) {
    ctx.checkPageBreak(20);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 15, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text(`${activeWindows.length} ACTIVE VULNERABILITY WINDOWS`, ctx.margin + 5, ctx.yPos + 5);
    doc.setTextColor(0);
    ctx.yPos += 20;
  }
  ctx.yPos += 8;
};

export const renderActiveDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.activeDefenseData?.length) return;
  
  ctx.renderSectionHeader('Active Defense Posture', [0, 128, 0]);
  const defense = (data.activeDefenseData as Array<Record<string, unknown>>)[0];
  ctx.checkPageBreak(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Defense Type: ${(defense.defense_type as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 8;
};

export const warfareSectionRenderers = {
  cognitiveWarfare: renderCognitiveWarfare,
  deceptionOps: renderDeceptionOps,
  trauma: renderTrauma,
  betrayal: renderBetrayal,
  vulnerabilityWindows: renderVulnerabilityWindows,
  activeDefense: renderActiveDefense,
};
