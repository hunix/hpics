/**
 * Intelligence Section Renderers (v3.7.1)
 * Renders: MICE, Cialdini, Psychological Profile, Trust, Behavioral DNA
 */

import type { SectionRenderer } from './types';
import { CIALDINI_PRINCIPLES } from '../types';

export const renderMICE: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  if (!data.miceData?.length) return;
  
  ctx.renderSectionHeader('MICE Vulnerability Matrix', [102, 0, 0]);
  
  const mice = data.miceData[0] as Record<string, unknown>;
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 248, 248);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  const miceScores = [
    { label: 'MONEY', score: (mice.money_score as number) || 0, color: [0, 150, 0] as [number, number, number] },
    { label: 'IDEOLOGY', score: (mice.ideology_score as number) || 0, color: [0, 100, 200] as [number, number, number] },
    { label: 'COMPROMISE', score: (mice.compromise_score as number) || 0, color: [200, 0, 0] as [number, number, number] },
    { label: 'EGO', score: (mice.ego_score as number) || 0, color: [150, 100, 0] as [number, number, number] },
  ];
  
  const boxWidth = (ctx.contentWidth - 15) / 4;
  miceScores.forEach((m, i) => {
    const x = ctx.margin + 5 + (i * boxWidth);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...m.color);
    doc.text(m.label, x, ctx.yPos + 5);
    doc.setFillColor(...m.color);
    doc.circle(x + 15, ctx.yPos + 18, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`${m.score}`, x + 15, ctx.yPos + 21, { align: 'center' });
    doc.setTextColor(0);
  });
  ctx.yPos += 45;
  
  if (mice.primary_vulnerability) {
    doc.setFillColor(255, 200, 200);
    doc.roundedRect(ctx.margin, ctx.yPos - 2, ctx.contentWidth, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Primary Vulnerability: ${(mice.primary_vulnerability as string).toUpperCase()}`, ctx.margin + 5, ctx.yPos + 5);
    ctx.yPos += 18;
  }
  
  if ((mice.approach_recommendations as string[])?.length > 0) {
    ctx.renderSubsection('Recommended Approaches');
    (mice.approach_recommendations as string[]).slice(0, 5).forEach((r: string) => ctx.renderBullet(r, 5));
  }
  ctx.yPos += 8;
};

export const renderCialdini: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.influenceData) return;
  
  ctx.renderSectionHeader('RASCLS Influence Profile (Cialdini)', [0, 102, 153]);
  const influence = data.influenceData as Record<string, unknown>;
  
  ctx.checkPageBreak(80);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 70, 2, 2, 'F');
  ctx.yPos += 5;
  
  CIALDINI_PRINCIPLES.forEach((principle) => {
    const score = (influence[`${principle.key}_susceptibility`] as number) || (influence[principle.key] as number) || 0;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(principle.label, ctx.margin + 5, ctx.yPos);
    const barX = ctx.margin + 55;
    doc.setFillColor(220, 220, 220);
    doc.rect(barX, ctx.yPos - 4, 70, 5, 'F');
    const color: [number, number, number] = score > 70 ? [0, 150, 0] : score > 40 ? [200, 150, 0] : [150, 150, 150];
    doc.setFillColor(...color);
    doc.rect(barX, ctx.yPos - 4, (score / 100) * 70, 5, 'F');
    doc.setFont('helvetica', 'normal');
    doc.text(`${score}%`, barX + 75, ctx.yPos);
    ctx.yPos += 9;
  });
  ctx.yPos += 13;
};

export const renderPsychologicalProfile: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.psychData?.length) return;
  
  ctx.renderSectionHeader('Psychological Profile', [102, 51, 102]);
  const psych = data.psychData[0] as Record<string, unknown>;
  const style = psych.attachment_style as Record<string, unknown> | undefined;
  
  if (style?.primary_style) {
    ctx.renderSubsection('Attachment Style Analysis');
    ctx.checkPageBreak(35);
    doc.setFillColor(250, 245, 255);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 30, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 51, 102);
    doc.text(String(style.primary_style), ctx.margin + 5, ctx.yPos + 10);
    doc.setTextColor(0);
    ctx.yPos += 35;
  }
  
  if (psych.dark_triad_indicators) {
    const dark = psych.dark_triad_indicators as Record<string, unknown>;
    ctx.renderSubsection('Dark Triad Analysis');
    if (dark.narcissism !== undefined) ctx.renderScoreBar('Narcissism', dark.narcissism as number, 100, [180, 0, 0]);
    if (dark.machiavellianism !== undefined) ctx.renderScoreBar('Machiavellianism', dark.machiavellianism as number, 100, [100, 0, 100]);
    if (dark.psychopathy !== undefined) ctx.renderScoreBar('Psychopathy', dark.psychopathy as number, 100, [50, 50, 50]);
    ctx.yPos += 5;
  }
  ctx.yPos += 8;
};

export const renderTrust: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.trustData?.length) return;
  
  ctx.renderSectionHeader('Trust Assessment', [0, 100, 100]);
  const trust = data.trustData[0] as Record<string, unknown>;
  
  if (trust.overall_trust_score !== undefined) {
    ctx.checkPageBreak(25);
    doc.setFillColor(240, 250, 250);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, 80, 20, 3, 3, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 100);
    doc.text(`${trust.overall_trust_score}%`, ctx.margin + 10, ctx.yPos + 11);
    doc.setTextColor(0);
    ctx.yPos += 25;
  }
  ctx.yPos += 8;
};

export const renderBehavioralDNA: SectionRenderer = (ctx, data) => {
  if (!data.behavioralDnaAnalysis) return;
  ctx.renderSectionHeader('Contact DNA Fingerprint', [102, 0, 102]);
  const dna = data.behavioralDnaAnalysis.result as Record<string, unknown>;
  
  if (dna.decision_architecture) {
    const arch = dna.decision_architecture as Record<string, unknown>;
    ctx.renderSubsection('Decision Architecture');
    ctx.renderKeyValue('Primary Archetype', String(arch.primary_archetype || 'Unknown'));
  }
  ctx.yPos += 8;
};

export const intelligenceSectionRenderers = {
  mice: renderMICE,
  cialdini: renderCialdini,
  psychological: renderPsychologicalProfile,
  trust: renderTrust,
  behavioralDna: renderBehavioralDNA,
};
