/**
 * Core Section Renderers (v4.0)
 * Renders: Executive Brief, Source Dashboard, Contact Overview, Timeline
 * v4.0: Unified design system with category colors
 */

import type { SectionRenderer } from './types';
import { CIALDINI_PRINCIPLES } from '../types';
import { safeFormatDate, PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';
import { getSectionColor, getCategoryBackgroundColor, extractResultSafe, hasRenderableContent } from '../../utils/pdfDesignSystem';

export const renderExecutiveBrief: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const psych = data.psychData?.[0] as Record<string, unknown> | undefined;
  const attachmentStyle = psych?.attachment_style as Record<string, unknown> | undefined;
  const riskColor: [number, number, number] = data.totalAnomalies > 2 
    ? PDF_DESIGN.colors.highRisk 
    : data.totalAnomalies > 0 
      ? PDF_DESIGN.colors.mediumRisk 
      : PDF_DESIGN.colors.lowRisk;
  const riskLevel = data.totalAnomalies > 2 ? 'HIGH' : data.totalAnomalies > 0 ? 'MEDIUM' : 'LOW';
  
  ctx.renderSectionHeader('Executive Intelligence Brief', PDF_DESIGN.colors.intelligence);
  
  // Subject Classification Box
  ctx.checkPageBreak(20);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2], 0.15);
  doc.roundedRect(ctx.margin, ctx.yPos - 2, ctx.contentWidth, 14, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...riskColor);
  doc.text(`SUBJECT CLASSIFICATION: ${riskLevel} PRIORITY`, ctx.margin + 5, ctx.yPos + 6);
  doc.setTextColor(0);
  ctx.yPos += 20;
  
  ctx.renderSubsection('Strategic Assessment');
  
  if (attachmentStyle?.primary_style) {
    ctx.renderBullet(`Attachment Pattern: ${attachmentStyle.primary_style} (Anxiety: ${attachmentStyle.anxiety_score || 0}%, Avoidance: ${attachmentStyle.avoidance_score || 0}%)`);
  }
  
  // v3.9.33: Prioritize allAnalyses fallback
  const relData = getAnalysisForSection(data, 'relationship') || data.relationshipAnalysis;
  if (relData) {
    const rel = extractResult(relData as Record<string, unknown>);
    if (rel.score !== undefined || rel.grade) {
      ctx.renderBullet(`Relationship Status: Score ${rel.score || 0}/100, Grade ${rel.grade || 'N/A'}`);
    }
  }
  
  if (data.trustData?.[0]) {
    const trust = data.trustData[0] as Record<string, unknown>;
    ctx.renderBullet(`Trust Level: ${trust.overall_trust_score || 0}% (${trust.trust_trajectory || 'stable'})`);
  }
  
  // v3.9.33: Try allAnalyses for MICE
  const miceRaw = getAnalysisForSection(data, 'mice') || (data.miceData?.length ? data.miceData[0] : null);
  if (miceRaw) {
    const mice = extractResult(miceRaw as Record<string, unknown>);
    ctx.renderBullet(`Primary MICE Vulnerability: ${mice.primary_vulnerability || 'Not assessed'} (${((mice.recruitment_likelihood as number) * 100 || 0).toFixed(0)}% recruitability)`);
  }
  
  if (data.influenceData?.data) {
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
      ctx.renderBullet(`Primary Influence Vector: ${topLabel} (${topScore}% susceptibility)`);
    }
  }
  
  ctx.yPos += 8;
};

export const renderSourceDashboard: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  ctx.renderSectionHeader('Intelligence Source Dashboard', PDF_DESIGN.colors.core);
  
  // Data Completeness Score
  ctx.checkPageBreak(35);
  doc.setFillColor(240, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 30, 3, 3, 'F');
  
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text('Intelligence Completeness', ctx.margin + 5, ctx.yPos + 5);
  
  // Progress bar
  const barX = ctx.margin + 5;
  const barWidth = ctx.contentWidth - 50;
  doc.setFillColor(220, 220, 220);
  doc.rect(barX, ctx.yPos + 10, barWidth, 8, 'F');
  const complColor: [number, number, number] = data.intelligenceCompleteness >= 80 
    ? PDF_DESIGN.colors.success 
    : data.intelligenceCompleteness >= 50 
      ? PDF_DESIGN.colors.warning 
      : PDF_DESIGN.colors.danger;
  doc.setFillColor(...complColor);
  doc.rect(barX, ctx.yPos + 10, (data.intelligenceCompleteness / 100) * barWidth, 8, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...complColor);
  doc.text(`${data.intelligenceCompleteness}%`, barX + barWidth + 5, ctx.yPos + 17);
  doc.setTextColor(0);
  
  ctx.yPos += 35;
  
  // Source breakdown
  ctx.renderSubsection('Source Breakdown');
  const sourceBreakdown = [
    { label: 'Visual Media Intelligence', count: data.totalMediaAnalyzed, status: data.totalMediaAnalyzed > 0 ? '✓' : '○' },
    { label: 'Voice Pattern Analysis', count: data.totalVoiceSessions, status: data.totalVoiceSessions > 0 ? '✓' : '○' },
    { label: 'Psychological Profile', count: data.psychData?.length || 0, status: data.psychData?.length ? '✓' : '○' },
    { label: 'MICE Assessment', count: data.miceData?.length || 0, status: data.miceData?.length ? '✓' : '○' },
    { label: 'Influence Profile', count: data.influenceData ? 1 : 0, status: data.influenceData ? '✓' : '○' },
    { label: 'Behavioral DNA', count: data.behavioralDnaAnalysis ? 1 : 0, status: data.behavioralDnaAnalysis ? '✓' : '○' },
    { label: 'AI Analyses', count: data.allAnalyses?.length || 0, status: data.allAnalyses?.length ? '✓' : '○' },
  ];
  
  sourceBreakdown.forEach(source => {
    doc.setFontSize(PDF_DESIGN.fonts.small);
    const statusColor: [number, number, number] = source.status === '✓' ? PDF_DESIGN.colors.success : [200, 200, 200];
    doc.setTextColor(...statusColor);
    doc.text(source.status, ctx.margin, ctx.yPos);
    doc.setTextColor(0);
    doc.text(`${source.label}: ${source.count}`, ctx.margin + 8, ctx.yPos);
    ctx.yPos += 5;
  });
  
  ctx.yPos += 8;
};

export const renderContactOverview: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  ctx.renderSectionHeader('Contact Overview', PDF_DESIGN.colors.core);
  
  const profile = data.profile;
  ctx.renderKeyValue('Full Name', data.contactName);
  ctx.renderKeyValue('Organization', String(profile.organization || 'Unknown'));
  ctx.renderKeyValue('Position', String(profile.job_title || 'Unknown'));
  ctx.renderKeyValue('Relationship Type', String(profile.relationship_type || 'Unclassified'));
  ctx.renderKeyValue('Last Contact', safeFormatDate(profile.last_contact_date));
  
  if (profile.notes) {
    ctx.yPos += 3;
    ctx.renderSubsection('Notes');
    const noteLines = doc.splitTextToSize(String(profile.notes), ctx.contentWidth);
    ctx.checkPageBreak(noteLines.length * ctx.lineHeight + 5);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.text(noteLines, ctx.margin, ctx.yPos);
    ctx.yPos += noteLines.length * ctx.lineHeight;
  }
  
  // Life milestones
  if (data.milestonesData?.length) {
    ctx.yPos += 3;
    ctx.renderSubsection('Key Life Milestones');
    (data.milestonesData as Record<string, unknown>[]).slice(0, 5).forEach((m) => {
      ctx.renderBullet(`${safeFormatDate(m.event_date, 'MMM yyyy')}: ${m.milestone_type} - ${m.description || ''}`, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const renderTimeline: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  if (!data.commData?.length) return;
  
  ctx.renderSectionHeader('Interaction Timeline', PDF_DESIGN.colors.core);
  
  (data.commData as Record<string, unknown>[]).slice(0, 15).forEach((comm) => {
    ctx.checkPageBreak(20);
    
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'bold');
    const date = safeFormatDate(comm.occurred_at || comm.communication_date, 'MMM d, yyyy HH:mm', 'Date unknown');
    doc.text(`${date} | ${(comm.channel as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
    
    if (comm.sentiment_score !== undefined) {
      const score = comm.sentiment_score as number;
      const sentColor: [number, number, number] = score > 0 ? PDF_DESIGN.colors.success : score < 0 ? PDF_DESIGN.colors.danger : PDF_DESIGN.colors.muted;
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

// Pattern of Life renderer
export const renderPatternOfLife: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.33: PRIORITIZE allAnalyses fallback first
  const rawData = getAnalysisForSection(data, 'patternOfLife')
    || (data.patternOfLifeData?.length ? data.patternOfLifeData[0] : null);
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Pattern of Life Analysis', PDF_DESIGN.colors.analysis);
  const pol = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 248, 252);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  // Circadian rhythm
  if (pol.peak_activity_hours) {
    const hours = pol.peak_activity_hours as number[];
    ctx.renderSubsection('Peak Activity Windows');
    ctx.renderBullet(`Primary: ${hours[0] || 9}:00 - ${hours[1] || 17}:00`, 5);
  }
  
  // Routine score
  if (pol.routine_predictability !== undefined) {
    ctx.renderScoreBar('Routine Predictability', (pol.routine_predictability as number) * 100, 100, PDF_DESIGN.colors.analysis);
  }
  
  // Deviation alerts
  if (pol.recent_deviations) {
    const deviations = pol.recent_deviations as Array<Record<string, unknown>>;
    if (deviations.length > 0) {
      ctx.yPos += 5;
      ctx.renderSubsection('Recent Deviations');
      deviations.slice(0, 3).forEach((d) => {
        ctx.renderBullet(`${d.deviation_type || 'Unknown'}: ${d.description || ''}`, 5);
      });
    }
  }
  ctx.yPos += 8;
};

// Relationship Ecosystem renderer
export const renderRelationshipEcosystem: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.33: Check for any relationship data (prioritize allAnalyses)
  const relAnalysis = getAnalysisForSection(data, 'relationship') 
    || data.relationshipAnalysis;
  const hasRelData = relAnalysis 
    || (Array.isArray(data.relationshipData) && data.relationshipData.length);
  
  if (!hasRelData) return;
  
  ctx.renderSectionHeader('Relationship Ecosystem', getSectionColor('relationshipEcosystem'));
  
  // Relationship analysis from AI
  if (relAnalysis) {
    const rel = extractResult(relAnalysis as Record<string, unknown>);
    ctx.checkPageBreak(40);
    doc.setFillColor(255, 250, 245);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
    
    if (rel.score !== undefined) {
      ctx.renderScoreBar('Relationship Health', rel.score as number, 100, getSectionColor('relationshipEcosystem'));
    }
    if (rel.grade) {
      doc.setFontSize(PDF_DESIGN.fonts.subheader);
      doc.setFont('helvetica', 'bold');
      doc.text(`Grade: ${rel.grade}`, ctx.margin + 5, ctx.yPos + 8);
      ctx.yPos += 15;
    }
  }
  
  // Network relationships
  if (Array.isArray(data.relationshipData) && data.relationshipData.length) {
    ctx.yPos += 5;
    ctx.renderSubsection('Key Relationships');
    (data.relationshipData as Array<Record<string, unknown>>).slice(0, 5).forEach((r) => {
      const relatedProfile = r.related_profile as Record<string, unknown> | undefined;
      const name = relatedProfile 
        ? `${relatedProfile.first_name || ''} ${relatedProfile.last_name || ''}`.trim() || 'Unknown'
        : (r.related_profile_name as string) || 'Unknown';
      const type = r.relationship_type as string || 'connection';
      const strength = r.relationship_strength as number || 0;
      ctx.renderBullet(`${name} (${type}) - Strength: ${Math.round(strength * 100)}%`, 5);
    });
  }
  ctx.yPos += 8;
};

// Media Intelligence renderer
export const renderMediaIntel: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.mediaData?.length) return;
  
  ctx.renderSectionHeader('Visual Media Intelligence', PDF_DESIGN.colors.intelligence);
  const media = data.mediaData as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(60);
  doc.setFillColor(245, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  // Summary stats
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Media Analyzed: ${media.length}`, ctx.margin + 5, ctx.yPos + 8);
  
  // Aggregate intelligence
  const withLocation = media.filter(m => m.location_data).length;
  const withFaces = media.filter(m => m.faces_detected && (m.faces_detected as number) > 0).length;
  const withObjects = media.filter(m => m.detected_objects).length;
  
  doc.setFontSize(PDF_DESIGN.fonts.small);
  doc.setFont('helvetica', 'normal');
  doc.text(`Location data: ${withLocation} items`, ctx.margin + 5, ctx.yPos + 20);
  doc.text(`Face detections: ${withFaces} items`, ctx.margin + 5, ctx.yPos + 28);
  doc.text(`Object recognition: ${withObjects} items`, ctx.margin + 5, ctx.yPos + 36);
  
  ctx.yPos += 60;
  
  // Intelligence indicators from AI metadata
  const withMetadata = media.filter(m => m.ai_metadata);
  if (withMetadata.length > 0) {
    ctx.renderSubsection('Key Intelligence Indicators');
    withMetadata.slice(0, 5).forEach((m) => {
      const metadata = m.ai_metadata as Record<string, unknown>;
      const indicators = metadata?.intelligence_indicators || metadata?.wealth_indicators;
      if (indicators) {
        ctx.renderBullet(String(indicators).substring(0, 80), 5);
      }
    });
  }
  ctx.yPos += 8;
};

// Voice Intelligence renderer
export const renderVoiceIntel: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.voiceData?.length) return;
  
  ctx.renderSectionHeader('Voice Pattern Intelligence', getSectionColor('voiceIntel'));
  const voice = data.voiceData as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  // Summary
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`Voice Sessions Analyzed: ${voice.length}`, ctx.margin + 5, ctx.yPos + 8);
  
  // Aggregate emotional profile
  const emotionalStates: Record<string, number> = {};
  voice.forEach((v) => {
    const emotions = v.detected_emotions as Record<string, number>;
    if (emotions) {
      Object.entries(emotions).forEach(([emotion, score]) => {
        emotionalStates[emotion] = (emotionalStates[emotion] || 0) + (score as number);
      });
    }
  });
  
  const topEmotions = Object.entries(emotionalStates)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  if (topEmotions.length > 0) {
    ctx.yPos += 15;
    ctx.renderSubsection('Dominant Emotional Patterns');
    topEmotions.forEach(([emotion, _]) => {
      ctx.renderBullet(emotion.charAt(0).toUpperCase() + emotion.slice(1), 5);
    });
  }
  
  // Stress indicators
  const avgStress = voice.reduce((sum, v) => sum + ((v.stress_level as number) || 0), 0) / voice.length;
  if (avgStress > 0) {
    ctx.renderScoreBar('Average Stress Level', avgStress * 100, 100, PDF_DESIGN.colors.danger);
  }
  ctx.yPos += 8;
};

// Anomaly Detection renderer
export const renderAnomalyDetection: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.anomaliesData?.length) return;
  
  ctx.renderSectionHeader('Anomaly Detection Report', PDF_DESIGN.colors.danger);
  const anomalies = data.anomaliesData as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(30);
  
  // Alert banner
  doc.setFillColor(255, 230, 230);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 20, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_DESIGN.colors.danger);
  doc.text(`${anomalies.length} ANOMALIES DETECTED`, ctx.margin + 5, ctx.yPos + 8);
  doc.setTextColor(0);
  ctx.yPos += 25;
  
  // List anomalies
  anomalies.slice(0, 8).forEach((a) => {
    ctx.checkPageBreak(20);
    const type = (a.anomaly_type as string)?.toUpperCase() || 'UNKNOWN';
    const severity = a.severity as string || 'medium';
    const color: [number, number, number] = severity === 'high' 
      ? PDF_DESIGN.colors.danger 
      : severity === 'medium' 
        ? PDF_DESIGN.colors.warning 
        : PDF_DESIGN.colors.muted;
    
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(`[${severity.toUpperCase()}]`, ctx.margin, ctx.yPos);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    doc.text(type, ctx.margin + 25, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 2;
  });
  ctx.yPos += 8;
};

export const coreSectionRenderers = {
  executive: renderExecutiveBrief,
  sourceDashboard: renderSourceDashboard,
  overview: renderContactOverview,
  timeline: renderTimeline,
  patternOfLife: renderPatternOfLife,
  relationshipEcosystem: renderRelationshipEcosystem,
  mediaIntel: renderMediaIntel,
  voiceIntel: renderVoiceIntel,
  anomalyDetection: renderAnomalyDetection,
};
