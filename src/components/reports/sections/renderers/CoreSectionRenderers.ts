/**
 * Core Section Renderers (v3.7.1)
 * Renders: Executive Brief, Source Dashboard, Contact Overview, Timeline
 */

import { format } from 'date-fns';
import { PDFRenderContext, RenderHelpers, DossierData, SectionRenderer } from './types';
import { CIALDINI_PRINCIPLES } from '../types';

export const renderExecutiveBrief: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  const psych = data.psychData.data?.[0] as Record<string, unknown> | undefined;
  const attachmentStyle = psych?.attachment_style as Record<string, unknown> | undefined;
  const riskColor: [number, number, number] = data.totalAnomalies > 2 ? [180, 0, 0] : data.totalAnomalies > 0 ? [180, 100, 0] : [0, 120, 0];
  const riskLevel = data.totalAnomalies > 2 ? 'HIGH' : data.totalAnomalies > 0 ? 'MEDIUM' : 'LOW';
  
  renderSectionHeader('Executive Intelligence Brief', [0, 51, 102]);
  
  // Subject Classification Box
  checkPageBreak(20);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.15);
  doc.roundedRect(ctx.margin, ctx.yPos - 2, ctx.contentWidth, 14, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskColor);
  doc.text(`SUBJECT CLASSIFICATION: ${riskLevel} PRIORITY`, ctx.margin + 5, ctx.yPos + 6);
  doc.setTextColor(0);
  ctx.yPos += 20;
  
  renderSubsection('Strategic Assessment');
  
  if (attachmentStyle?.primary_style) {
    renderBullet(`Attachment Pattern: ${attachmentStyle.primary_style} (Anxiety: ${attachmentStyle.anxiety_score || 0}%, Avoidance: ${attachmentStyle.avoidance_score || 0}%)`);
  }
  
  if (data.relationshipAnalysis?.result) {
    const rel = data.relationshipAnalysis.result as Record<string, unknown>;
    renderBullet(`Relationship Status: Score ${rel.score || 0}/100, Grade ${rel.grade || 'N/A'}`);
  }
  
  if (data.trustData.data?.[0]) {
    const trust = data.trustData.data[0] as Record<string, unknown>;
    renderBullet(`Trust Level: ${trust.overall_trust_score || 0}% (${trust.trust_trajectory || 'stable'})`);
  }
  
  if (data.miceData.data?.[0]) {
    const mice = data.miceData.data[0] as Record<string, unknown>;
    renderBullet(`Primary MICE Vulnerability: ${mice.primary_vulnerability || 'Not assessed'} (${((mice.recruitment_likelihood as number) * 100 || 0).toFixed(0)}% recruitability)`);
  }
  
  if (data.influenceData.data) {
    const inf = data.influenceData.data as Record<string, unknown>;
    let topScore = 0;
    let topLabel = '';
    CIALDINI_PRINCIPLES.forEach(p => {
      const score = (inf[`${p.key}_susceptibility`] as number) || (inf[p.key] as number) || 0;
      if (score > topScore) {
        topScore = score;
        topLabel = p.label;
      }
    });
    if (topLabel) {
      renderBullet(`Primary Influence Vector: ${topLabel} (${topScore}% susceptibility)`);
    }
  }
  
  ctx.yPos += 8;
};

export const renderSourceDashboard: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, checkPageBreak } = helpers;
  
  renderSectionHeader('Intelligence Source Dashboard', [80, 80, 80]);
  
  // Data Completeness Score
  checkPageBreak(35);
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 30, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Intelligence Completeness', ctx.margin + 5, ctx.yPos + 5);
  
  // Progress bar
  const barX = ctx.margin + 5;
  const barWidth = ctx.contentWidth - 50;
  doc.setFillColor(220, 220, 220);
  doc.rect(barX, ctx.yPos + 10, barWidth, 8, 'F');
  const complColor: [number, number, number] = data.intelligenceCompleteness >= 80 ? [0, 150, 0] : data.intelligenceCompleteness >= 50 ? [200, 150, 0] : [200, 50, 0];
  doc.setFillColor(...complColor);
  doc.rect(barX, ctx.yPos + 10, (data.intelligenceCompleteness / 100) * barWidth, 8, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...complColor);
  doc.text(`${data.intelligenceCompleteness}%`, barX + barWidth + 5, ctx.yPos + 17);
  doc.setTextColor(0);
  
  ctx.yPos += 35;
  
  // Source breakdown
  renderSubsection('Source Breakdown');
  const sourceBreakdown = [
    { label: 'Visual Media Intelligence', count: data.totalMediaAnalyzed, status: data.totalMediaAnalyzed > 0 ? '✓' : '○' },
    { label: 'Voice Pattern Analysis', count: data.totalVoiceSessions, status: data.totalVoiceSessions > 0 ? '✓' : '○' },
    { label: 'Psychological Profile', count: data.psychData.data?.length || 0, status: data.psychData.data?.length ? '✓' : '○' },
    { label: 'MICE Assessment', count: data.miceData.data?.length || 0, status: data.miceData.data?.length ? '✓' : '○' },
    { label: 'Influence Profile', count: data.influenceData.data ? 1 : 0, status: data.influenceData.data ? '✓' : '○' },
    { label: 'Behavioral DNA', count: data.behavioralDnaAnalysis ? 1 : 0, status: data.behavioralDnaAnalysis ? '✓' : '○' },
  ];
  
  sourceBreakdown.forEach(source => {
    doc.setFontSize(8);
    const statusColor: [number, number, number] = source.status === '✓' ? [0, 150, 0] : [200, 200, 200];
    doc.setTextColor(...statusColor);
    doc.text(source.status, ctx.margin, ctx.yPos);
    doc.setTextColor(0);
    doc.text(`${source.label}: ${source.count}`, ctx.margin + 8, ctx.yPos);
    ctx.yPos += 5;
  });
  
  ctx.yPos += 8;
};

export const renderContactOverview: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderKeyValue, renderBullet, checkPageBreak } = helpers;
  
  renderSectionHeader('Contact Overview', [50, 50, 50]);
  
  const profile = data.profile;
  renderKeyValue('Full Name', data.contactName);
  renderKeyValue('Organization', String(profile.organization || 'Unknown'));
  renderKeyValue('Position', String(profile.job_title || 'Unknown'));
  renderKeyValue('Relationship Type', String(profile.relationship_type || 'Unclassified'));
  renderKeyValue('Last Contact', profile.last_contact_date ? format(new Date(profile.last_contact_date as string), 'MMM d, yyyy') : 'Unknown');
  
  if (profile.notes) {
    ctx.yPos += 3;
    renderSubsection('Notes');
    const noteLines = doc.splitTextToSize(String(profile.notes), ctx.contentWidth);
    checkPageBreak(noteLines.length * ctx.lineHeight + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(noteLines, ctx.margin, ctx.yPos);
    ctx.yPos += noteLines.length * ctx.lineHeight;
  }
  
  // Life milestones
  if (data.milestonesData.data?.length) {
    ctx.yPos += 3;
    renderSubsection('Key Life Milestones');
    (data.milestonesData.data as Record<string, unknown>[]).slice(0, 5).forEach((m) => {
      renderBullet(`${format(new Date(m.milestone_date as string), 'MMM yyyy')}: ${m.milestone_type} - ${m.description || ''}`, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const renderTimeline: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, checkPageBreak } = helpers;
  
  if (!data.commData.data?.length) return;
  
  renderSectionHeader('Interaction Timeline', [80, 80, 80]);
  
  (data.commData.data as Record<string, unknown>[]).slice(0, 15).forEach((comm) => {
    checkPageBreak(20);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const date = format(new Date(comm.occurred_at as string), 'MMM d, yyyy HH:mm');
    doc.text(`${date} | ${(comm.channel as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
    
    if (comm.sentiment_score !== undefined) {
      const score = comm.sentiment_score as number;
      const sentColor: [number, number, number] = score > 0 ? [0, 150, 0] : score < 0 ? [180, 0, 0] : [100, 100, 100];
      doc.setTextColor(...sentColor);
      doc.text(`[${score > 0 ? '+' : ''}${score}]`, ctx.margin + 100, ctx.yPos);
      doc.setTextColor(0);
    }
    ctx.yPos += ctx.lineHeight;
    
    if (comm.subject || comm.content) {
      doc.setFont('helvetica', 'normal');
      const text = (comm.subject as string) || (comm.content as string)?.substring(0, 120);
      const lines = doc.splitTextToSize(text, ctx.contentWidth - 10);
      doc.text(lines.slice(0, 2), ctx.margin + 5, ctx.yPos);
      ctx.yPos += Math.min(lines.length, 2) * ctx.lineHeight;
    }
    
    ctx.yPos += 3;
  });
  
  ctx.yPos += 8;
};

export const coreSectionRenderers = {
  executive: renderExecutiveBrief,
  sourceDashboard: renderSourceDashboard,
  overview: renderContactOverview,
  timeline: renderTimeline,
};
