/**
 * Intelligence Section Renderers (v3.7.1)
 * Renders: MICE, Cialdini, Psychological Profile, Trust, Behavioral DNA, etc.
 */

import { PDFRenderContext, RenderHelpers, DossierData, SectionRenderer } from './types';
import { CIALDINI_PRINCIPLES } from '../types';

export const renderMICE: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  if (!data.miceData.data?.length) return;
  
  renderSectionHeader('MICE Vulnerability Matrix', [102, 0, 0]);
  
  const mice = data.miceData.data[0] as Record<string, unknown>;
  
  checkPageBreak(45);
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
    doc.setFont('helvetica', 'bold');
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
    if (mice.recruitment_likelihood) {
      doc.text(`Recruitment Likelihood: ${((mice.recruitment_likelihood as number) * 100).toFixed(0)}%`, ctx.margin + 110, ctx.yPos + 5);
    }
    ctx.yPos += 18;
  }
  
  if ((mice.approach_recommendations as string[])?.length > 0) {
    renderSubsection('Recommended Approaches');
    (mice.approach_recommendations as string[]).slice(0, 5).forEach((r: string) => renderBullet(r, 5));
  }
  
  ctx.yPos += 8;
};

export const renderCialdini: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  if (!data.influenceData.data) return;
  
  renderSectionHeader('RASCLS Influence Profile (Cialdini)', [0, 102, 153]);
  
  const influence = data.influenceData.data as Record<string, unknown>;
  
  checkPageBreak(80);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 70, 2, 2, 'F');
  ctx.yPos += 5;
  
  CIALDINI_PRINCIPLES.forEach((principle) => {
    const score = (influence[`${principle.key}_susceptibility`] as number) || (influence[principle.key] as number) || 0;
    const displayScore = typeof score === 'number' ? score : 50;
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(principle.label, ctx.margin + 5, ctx.yPos);
    
    const barX = ctx.margin + 55;
    const barWidth = 70;
    doc.setFillColor(220, 220, 220);
    doc.rect(barX, ctx.yPos - 4, barWidth, 5, 'F');
    
    const color: [number, number, number] = displayScore > 70 ? [0, 150, 0] : displayScore > 40 ? [200, 150, 0] : [150, 150, 150];
    doc.setFillColor(...color);
    doc.rect(barX, ctx.yPos - 4, (displayScore / 100) * barWidth, 5, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${displayScore}%`, barX + barWidth + 5, ctx.yPos);
    
    ctx.yPos += 9;
  });
  
  ctx.yPos += 5;
  
  if (influence.optimal_approach) {
    renderSubsection('Optimal Influence Strategy');
    renderBullet(String(influence.optimal_approach), 5);
  }
  
  if ((influence.positive_triggers as string[])?.length > 0) {
    renderSubsection('✓ Positive Triggers');
    doc.setTextColor(0, 100, 0);
    const triggerText = (influence.positive_triggers as string[]).slice(0, 8).join(' • ');
    const lines = doc.splitTextToSize(triggerText, ctx.contentWidth - 10);
    checkPageBreak(lines.length * ctx.lineHeight + 5);
    doc.setFontSize(9);
    doc.text(lines, ctx.margin + 5, ctx.yPos);
    doc.setTextColor(0);
    ctx.yPos += lines.length * ctx.lineHeight + 3;
  }
  
  ctx.yPos += 8;
};

export const renderPsychologicalProfile: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.psychData.data?.length) return;
  
  renderSectionHeader('Psychological Profile', [102, 51, 102]);
  
  const psych = data.psychData.data[0] as Record<string, unknown>;
  
  // Attachment Style
  const style = psych.attachment_style as Record<string, unknown> | undefined;
  if (style?.primary_style) {
    renderSubsection('Attachment Style Analysis');
    
    checkPageBreak(35);
    doc.setFillColor(250, 245, 255);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 30, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 51, 102);
    doc.text(String(style.primary_style), ctx.margin + 5, ctx.yPos + 10);
    doc.setTextColor(0);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Anxiety:', ctx.margin + 70, ctx.yPos + 5);
    doc.setFillColor(200, 200, 200);
    doc.rect(ctx.margin + 95, ctx.yPos + 1, 50, 5, 'F');
    doc.setFillColor(200, 50, 50);
    doc.rect(ctx.margin + 95, ctx.yPos + 1, ((style.anxiety_score as number) || 0) / 2, 5, 'F');
    doc.text(`${style.anxiety_score || 0}%`, ctx.margin + 148, ctx.yPos + 5);
    
    doc.text('Avoidance:', ctx.margin + 70, ctx.yPos + 15);
    doc.setFillColor(200, 200, 200);
    doc.rect(ctx.margin + 95, ctx.yPos + 11, 50, 5, 'F');
    doc.setFillColor(50, 50, 200);
    doc.rect(ctx.margin + 95, ctx.yPos + 11, ((style.avoidance_score as number) || 0) / 2, 5, 'F');
    doc.text(`${style.avoidance_score || 0}%`, ctx.margin + 148, ctx.yPos + 15);
    
    ctx.yPos += 35;
  }
  
  // Dark Triad Indicators
  if (psych.dark_triad_indicators) {
    const dark = psych.dark_triad_indicators as Record<string, unknown>;
    renderSubsection('Dark Triad Analysis');
    
    if (dark.narcissism !== undefined) renderScoreBar('Narcissism', dark.narcissism as number, 100, [180, 0, 0]);
    if (dark.machiavellianism !== undefined) renderScoreBar('Machiavellianism', dark.machiavellianism as number, 100, [100, 0, 100]);
    if (dark.psychopathy !== undefined) renderScoreBar('Psychopathy', dark.psychopathy as number, 100, [50, 50, 50]);
    
    ctx.yPos += 5;
  }
  
  // Emotional Intelligence
  if (psych.emotional_intelligence) {
    const ei = psych.emotional_intelligence as Record<string, unknown>;
    renderSubsection('Emotional Intelligence Map');
    
    if (ei.self_awareness !== undefined) renderScoreBar('Self-Awareness', ei.self_awareness as number, 100, [0, 100, 150]);
    if (ei.self_regulation !== undefined) renderScoreBar('Self-Regulation', ei.self_regulation as number, 100, [0, 100, 150]);
    if (ei.empathy !== undefined) renderScoreBar('Empathy', ei.empathy as number, 100, [0, 150, 100]);
    if (ei.social_skills !== undefined) renderScoreBar('Social Skills', ei.social_skills as number, 100, [0, 150, 100]);
    ctx.yPos += 3;
  }
  
  // Vulnerabilities
  const vulnerabilities = psych.vulnerabilities || psych.vulnerability_map;
  if (vulnerabilities && Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
    renderSubsection('🎯 Identified Vulnerabilities');
    doc.setTextColor(180, 0, 0);
    (vulnerabilities as string[]).slice(0, 6).forEach((vuln: string) => renderBullet(vuln, 5));
    doc.setTextColor(0);
    ctx.yPos += 3;
  }
  
  ctx.yPos += 8;
};

export const renderTrust: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderKeyValue, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.trustData.data?.length) return;
  
  renderSectionHeader('Trust Assessment', [0, 100, 100]);
  
  const trust = data.trustData.data[0] as Record<string, unknown>;
  
  if (trust.overall_trust_score !== undefined) {
    checkPageBreak(25);
    doc.setFillColor(240, 250, 250);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, 80, 20, 3, 3, 'F');
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 100);
    doc.text(`${trust.overall_trust_score}%`, ctx.margin + 10, ctx.yPos + 11);
    doc.setFontSize(10);
    doc.text('TRUST', ctx.margin + 50, ctx.yPos + 11);
    doc.setTextColor(0);
    ctx.yPos += 25;
  }
  
  if (trust.trust_factors) {
    const factors = trust.trust_factors as Record<string, number>;
    Object.entries(factors).slice(0, 5).forEach(([key, value]) => {
      renderScoreBar(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), Number(value) || 0, 100, [0, 100, 100]);
    });
  }
  
  if (trust.trust_trajectory) {
    renderKeyValue('Trajectory', String(trust.trust_trajectory));
  }
  
  ctx.yPos += 8;
};

export const renderBehavioralDNA: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderKeyValue, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.behavioralDnaAnalysis) return;
  
  renderSectionHeader('Contact DNA Fingerprint', [102, 0, 102]);
  
  const dna = data.behavioralDnaAnalysis.result as Record<string, unknown>;
  
  if ((dna.behavioral_genome as Record<string, unknown>)?.core_traits) {
    const genome = dna.behavioral_genome as Record<string, unknown>;
    const traits = genome.core_traits as Array<Record<string, unknown>>;
    
    if (traits?.length > 0) {
      renderSubsection('Core Behavioral Traits');
      
      // Group traits by category
      const traitsByCategory: Record<string, Array<Record<string, unknown>>> = {};
      traits.forEach((trait) => {
        const cat = (trait.category as string) || 'general';
        if (!traitsByCategory[cat]) traitsByCategory[cat] = [];
        traitsByCategory[cat].push(trait);
      });
      
      Object.entries(traitsByCategory).slice(0, 4).forEach(([category, categoryTraits]) => {
        checkPageBreak(20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 0, 102);
        doc.text(category.toUpperCase(), ctx.margin, ctx.yPos);
        doc.setTextColor(0);
        ctx.yPos += 5;
        
        categoryTraits.slice(0, 3).forEach((trait) => {
          renderScoreBar(trait.trait as string, (trait.strength as number) || 50, 100, [102, 50, 102]);
        });
        ctx.yPos += 3;
      });
    }
  }
  
  if (dna.decision_architecture) {
    const arch = dna.decision_architecture as Record<string, unknown>;
    renderSubsection('Decision Architecture');
    renderKeyValue('Primary Archetype', String(arch.primary_archetype));
    renderKeyValue('Decision Speed', String(arch.decision_speed));
    renderKeyValue('Information Needs', String(arch.information_needs));
    if (arch.sunk_cost_vulnerability) {
      renderScoreBar('Sunk Cost Vulnerability', arch.sunk_cost_vulnerability as number, 100, [200, 100, 0]);
    }
  }
  
  if (dna.manipulation_vulnerability) {
    renderSubsection('🎯 Manipulation Vulnerability');
    const vuln = dna.manipulation_vulnerability as Record<string, unknown>;
    renderScoreBar('Overall Vulnerability', (vuln.overall_vulnerability as number) || 50, 100, [180, 0, 0]);
    
    if ((vuln.effective_vectors as Array<Record<string, unknown>>)?.length > 0) {
      doc.setTextColor(180, 0, 0);
      (vuln.effective_vectors as Array<Record<string, unknown>>).slice(0, 4).forEach((v) => {
        renderBullet(`${v.vector} (${v.effectiveness}% effective)`, 5);
      });
      doc.setTextColor(0);
    }
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
