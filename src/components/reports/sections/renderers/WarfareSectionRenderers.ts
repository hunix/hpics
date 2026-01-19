/**
 * Warfare Section Renderers (v3.7.1)
 * Renders: Cognitive Warfare, Deception Ops, Trauma, Betrayal, etc.
 */

import { PDFRenderContext, RenderHelpers, DossierData, SectionRenderer } from './types';

export const renderCognitiveWarfare: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.cognitiveWarfareData.data?.length) return;
  
  renderSectionHeader('Cognitive Warfare Operations', [128, 0, 128]);
  
  (data.cognitiveWarfareData.data as Array<Record<string, unknown>>).forEach((op) => {
    checkPageBreak(40);
    renderSubsection((op.operation_name as string) || 'Unnamed Operation');
    doc.setFontSize(9);
    doc.text(`Type: ${op.operation_type || 'Standard'} | Status: ${(op.status as string)?.toUpperCase() || 'PLANNING'} | Phase: ${op.current_phase || 'Recon'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    
    if (op.effectiveness_score) {
      renderScoreBar('Effectiveness', (op.effectiveness_score as number) * 100, 100, [128, 0, 128]);
    }
    
    const vulnerabilities = op.cognitive_vulnerabilities as Array<unknown> || [];
    if (vulnerabilities.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Cognitive Vulnerabilities:', ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
      vulnerabilities.slice(0, 3).forEach((v) => {
        const text = typeof v === 'string' ? v : (v as Record<string, unknown>).name as string || JSON.stringify(v);
        renderBullet(text, 5);
      });
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

export const renderDeceptionOps: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.deceptionOpsData.data?.length) return;
  
  renderSectionHeader('Deception Operations', [139, 69, 19]);
  
  (data.deceptionOpsData.data as Array<Record<string, unknown>>).forEach((op) => {
    checkPageBreak(35);
    renderSubsection((op.operation_name as string) || 'Unnamed Deception');
    doc.setFontSize(9);
    doc.text(`Type: ${op.deception_type || 'Unknown'} | Status: ${(op.status as string)?.toUpperCase() || 'PLANNING'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    
    if (op.plausibility_score) {
      renderScoreBar('Plausibility', (op.plausibility_score as number) * 100, 100, [0, 150, 0]);
    }
    if (op.discovery_risk) {
      renderScoreBar('Discovery Risk', (op.discovery_risk as number) * 100, 100, [200, 0, 0]);
    }
    
    const coverStories = op.cover_stories as Array<unknown> || [];
    if (coverStories.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Cover Stories:', ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
      coverStories.slice(0, 2).forEach((c) => {
        const text = typeof c === 'string' ? c : (c as Record<string, unknown>).story as string || JSON.stringify(c);
        renderBullet(text, 5);
      });
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

export const renderTrauma: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.traumaData.data?.length) return;
  
  renderSectionHeader('Trauma & Vulnerability Windows', [150, 50, 50]);
  
  const trauma = data.traumaData.data[0] as Record<string, unknown>;
  
  if (trauma.vulnerability_score !== undefined) {
    renderScoreBar('Vulnerability Score', (trauma.vulnerability_score as number) * 100, 100, [180, 0, 0]);
  }
  
  if ((trauma.detected_patterns as Array<Record<string, unknown>>)?.length > 0) {
    renderSubsection('Detected Trauma Patterns');
    (trauma.detected_patterns as Array<Record<string, unknown>>).slice(0, 4).forEach((pattern) => {
      checkPageBreak(18);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(150, 50, 50);
      doc.text(`${pattern.pattern_type || pattern.type || 'Trauma Pattern'}`, ctx.margin, ctx.yPos);
      doc.setTextColor(0);
      ctx.yPos += 5;
      
      if (pattern.trigger) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Trigger: ${pattern.trigger}`, ctx.margin + 5, ctx.yPos);
        ctx.yPos += 5;
      }
      ctx.yPos += 3;
    });
  }
  
  if ((trauma.optimal_timing_windows as Array<Record<string, unknown>>)?.length > 0) {
    renderSubsection('Optimal Timing Windows');
    (trauma.optimal_timing_windows as Array<Record<string, unknown>>).slice(0, 3).forEach((window) => {
      const text = typeof window === 'string' ? window : `${window.window || window}: ${window.description || 'Vulnerability window'}`;
      renderBullet(text, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const renderBetrayal: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar } = helpers;
  
  if (!data.betrayalData.data?.length) return;
  
  renderSectionHeader('Betrayal & Crisis Prediction', [150, 0, 0]);
  
  const betrayal = data.betrayalData.data[0] as Record<string, unknown>;
  
  if (betrayal.betrayal_likelihood !== undefined) {
    renderScoreBar('Betrayal Likelihood', (betrayal.betrayal_likelihood as number) * 100, 100, [180, 0, 0]);
  }
  
  // Gottman Four Horsemen
  if (betrayal.gottman_analysis) {
    renderSubsection('Gottman Four Horsemen Analysis');
    const horsemen = betrayal.gottman_analysis as Record<string, unknown>;
    
    const horsemanScores = [
      { name: 'Criticism', score: (horsemen.criticism_score as number) || 0 },
      { name: 'Contempt', score: (horsemen.contempt_score as number) || 0 },
      { name: 'Defensiveness', score: (horsemen.defensiveness_score as number) || 0 },
      { name: 'Stonewalling', score: (horsemen.stonewalling_score as number) || 0 },
    ];
    
    horsemanScores.forEach(h => {
      const color: [number, number, number] = h.score > 70 ? [180, 0, 0] : h.score > 40 ? [180, 100, 0] : [0, 100, 0];
      renderScoreBar(h.name, h.score, 100, color);
    });
  }
  
  if ((betrayal.warning_signs as string[])?.length > 0) {
    renderSubsection('⚠ Warning Signs Detected');
    doc.setTextColor(180, 0, 0);
    (betrayal.warning_signs as string[]).slice(0, 5).forEach((w: string) => renderBullet(w, 5, '⚠'));
    doc.setTextColor(0);
  }
  
  if ((betrayal.protective_factors as string[])?.length > 0) {
    renderSubsection('✓ Protective Factors');
    doc.setTextColor(0, 100, 0);
    (betrayal.protective_factors as string[]).slice(0, 4).forEach((p: string) => renderBullet(p, 5, '✓'));
    doc.setTextColor(0);
  }
  
  ctx.yPos += 8;
};

export const renderVulnerabilityWindows: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.vulnerabilityWindowsData.data?.length) return;
  
  renderSectionHeader('Vulnerability Windows', [220, 20, 60]);
  
  const activeWindows = (data.vulnerabilityWindowsData.data as Array<Record<string, unknown>>).filter(w => w.current_status === 'active' || w.current_status === 'predicted');
  
  if (activeWindows.length > 0) {
    checkPageBreak(20);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 15, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text(`${activeWindows.length} ACTIVE/PREDICTED VULNERABILITY WINDOWS`, ctx.margin + 5, ctx.yPos + 5);
    doc.setTextColor(0);
    ctx.yPos += 20;
  }
  
  activeWindows.slice(0, 5).forEach((w) => {
    checkPageBreak(25);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(w.window_type as string)?.toUpperCase() || 'UNKNOWN'} - ${(w.current_status as string)?.toUpperCase()}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    
    if (w.vulnerability_score) {
      renderScoreBar('Vulnerability', (w.vulnerability_score as number) * 100, 100, [220, 20, 60]);
    }
    
    if (w.trigger_event) {
      doc.setFont('helvetica', 'normal');
      doc.text(`Trigger: ${w.trigger_event}`, ctx.margin + 5, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 3;
  });
  ctx.yPos += 8;
};

export const renderActiveDefense: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  if (!data.activeDefenseData.data?.length) return;
  
  renderSectionHeader('Active Defense Posture', [0, 128, 0]);
  
  const defense = (data.activeDefenseData.data as Array<Record<string, unknown>>)[0];
  
  checkPageBreak(30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Defense Type: ${(defense.defense_type as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
  doc.text(`Posture: ${(defense.defense_posture as string)?.toUpperCase() || 'PASSIVE'}`, ctx.margin + 80, ctx.yPos);
  doc.text(`Escalation Level: ${defense.escalation_level || 1}`, ctx.margin + 140, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 3;
  
  const measures = defense.active_measures as Array<unknown> || [];
  if (measures.length > 0) {
    renderSubsection('Active Measures');
    measures.slice(0, 4).forEach((m) => {
      const text = typeof m === 'string' ? m : (m as Record<string, unknown>).name as string || JSON.stringify(m);
      renderBullet(text, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const warfareSectionRenderers = {
  cognitiveWarfare: renderCognitiveWarfare,
  deceptionOps: renderDeceptionOps,
  trauma: renderTrauma,
  betrayal: renderBetrayal,
  vulnerabilityWindows: renderVulnerabilityWindows,
  activeDefense: renderActiveDefense,
};
