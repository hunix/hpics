/**
 * Intelligence Section Renderers (v3.9.31)
 * Renders: MICE, Cialdini, Psychological Profile, Trust, Behavioral DNA
 * v3.9.31: Universal extractResult pattern, PDF_DESIGN tokens
 */

import type { SectionRenderer } from './types';
import { CIALDINI_PRINCIPLES } from '../types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';

export const renderMICE: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.miceData?.length
    ? data.miceData[0]
    : getAnalysisForSection(data, 'mice');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('MICE Vulnerability Matrix', PDF_DESIGN.colors.warfare);
  const mice = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 248, 248);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  const miceScores = [
    { label: 'MONEY', score: (mice.money_score as number) || 0, color: PDF_DESIGN.colors.success },
    { label: 'IDEOLOGY', score: (mice.ideology_score as number) || 0, color: PDF_DESIGN.colors.info },
    { label: 'COMPROMISE', score: (mice.compromise_score as number) || 0, color: PDF_DESIGN.colors.danger },
    { label: 'EGO', score: (mice.ego_score as number) || 0, color: [150, 100, 0] as [number, number, number] },
  ];
  
  const boxWidth = (ctx.contentWidth - 15) / 4;
  miceScores.forEach((m, i) => {
    const x = ctx.margin + 5 + (i * boxWidth);
    doc.setFontSize(PDF_DESIGN.fonts.small);
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
    doc.setFontSize(PDF_DESIGN.fonts.subheader);
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
  
  // v3.9.31: Try multiple sources
  const rawData = data.influenceData?.data 
    ? data.influenceData 
    : getAnalysisForSection(data, 'influence');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('RASCLS Influence Profile (Cialdini)', PDF_DESIGN.colors.intelligence);
  const influence = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(80);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 70, 2, 2, 'F');
  ctx.yPos += 5;
  
  CIALDINI_PRINCIPLES.forEach((principle) => {
    const score = (influence[`${principle.key}_susceptibility`] as number) || (influence[principle.key] as number) || 0;
    doc.setFontSize(PDF_DESIGN.fonts.small);
    doc.setFont('helvetica', 'bold');
    doc.text(principle.label, ctx.margin + 5, ctx.yPos);
    const barX = ctx.margin + 55;
    doc.setFillColor(220, 220, 220);
    doc.rect(barX, ctx.yPos - 4, 70, 5, 'F');
    const color: [number, number, number] = score > 70 ? PDF_DESIGN.colors.success : score > 40 ? PDF_DESIGN.colors.warning : PDF_DESIGN.colors.muted;
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
  
  // v3.9.31: Try multiple sources
  const rawData = data.psychData?.length
    ? data.psychData[0]
    : getAnalysisForSection(data, 'psychological');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Psychological Profile', [102, 51, 102]);
  const psych = extractResult(rawData as Record<string, unknown>);
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
  
  const dark = psych.dark_triad_indicators as Record<string, unknown>;
  if (dark) {
    ctx.renderSubsection('Dark Triad Analysis');
    if (dark.narcissism !== undefined) ctx.renderScoreBar('Narcissism', dark.narcissism as number, 100, PDF_DESIGN.colors.danger);
    if (dark.machiavellianism !== undefined) ctx.renderScoreBar('Machiavellianism', dark.machiavellianism as number, 100, [100, 0, 100]);
    if (dark.psychopathy !== undefined) ctx.renderScoreBar('Psychopathy', dark.psychopathy as number, 100, PDF_DESIGN.colors.core);
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
  // v3.9.31: Try multiple sources
  const rawData = data.behavioralDnaAnalysis 
    || getAnalysisForSection(data, 'behavioralDna');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Contact DNA Fingerprint', [102, 0, 102]);
  const dna = extractResult(rawData as Record<string, unknown>);
  
  if (dna.decision_architecture) {
    const arch = dna.decision_architecture as Record<string, unknown>;
    ctx.renderSubsection('Decision Architecture');
    ctx.renderKeyValue('Primary Archetype', String(arch.primary_archetype || 'Unknown'));
  }
  
  if (dna.behavioral_markers) {
    const markers = dna.behavioral_markers as string[];
    ctx.renderSubsection('Behavioral Markers');
    markers.slice(0, 4).forEach(m => ctx.renderBullet(m, 5));
  }
  
  ctx.yPos += 8;
};

// Quantum Cognition renderer
export const renderQuantumCognition: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.quantumCognitionData) && data.quantumCognitionData.length)
    ? data.quantumCognitionData[0]
    : getAnalysisForSection(data, 'quantumCognition');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Quantum Cognition Analysis', PDF_DESIGN.colors.fusion);
  const quantum = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (quantum.superposition_states) {
    const states = quantum.superposition_states as string[];
    ctx.renderSubsection('Decision Superposition States');
    states.slice(0, 3).forEach(s => ctx.renderBullet(s, 5));
  }
  
  if (quantum.collapse_probability !== undefined) {
    ctx.renderScoreBar('Collapse Probability', (quantum.collapse_probability as number) * 100, 100, PDF_DESIGN.colors.fusion);
  }
  ctx.yPos += 8;
};

// Relationship Dynamics renderer
export const renderRelationship: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try multiple sources
  const rawData = data.relationshipAnalysis 
    || getAnalysisForSection(data, 'relationship');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Relationship Dynamics', [150, 80, 50]);
  const rel = extractResult(rawData as Record<string, unknown>);
  
  if (rel.dynamics) {
    const dynamics = rel.dynamics as Record<string, unknown>;
    ctx.renderSubsection('Power Dynamics');
    ctx.renderKeyValue('Power Balance', String(dynamics.power_balance || 'Balanced'));
    ctx.renderKeyValue('Communication Style', String(dynamics.communication_style || 'Unknown'));
  }
  
  if (rel.trajectory) {
    ctx.renderSubsection('Trajectory');
    ctx.renderBullet(`Direction: ${rel.trajectory}`, 5);
  }
  ctx.yPos += 8;
};

// Engagement Playbook renderer
export const renderPlaybook: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.playbookData) && data.playbookData.length)
    ? data.playbookData[0]
    : getAnalysisForSection(data, 'playbook');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Engagement Playbook', [0, 100, 80]);
  const playbook = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(240, 255, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  if (playbook.recommended_tactics) {
    const tactics = playbook.recommended_tactics as string[];
    ctx.renderSubsection('Recommended Tactics');
    tactics.slice(0, 5).forEach(t => ctx.renderBullet(t, 5));
  }
  
  if (playbook.approach_timing) {
    const timing = playbook.approach_timing as Record<string, unknown>;
    ctx.yPos += 3;
    ctx.renderSubsection('Optimal Approach Timing');
    ctx.renderBullet(`Best Time: ${timing.optimal_time || 'Morning'}`, 5);
    ctx.renderBullet(`Best Day: ${timing.optimal_day || 'Midweek'}`, 5);
  }
  ctx.yPos += 8;
};

// Hypnotic Patterns renderer
export const renderHypnoticPatterns: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.hypnoticPatternsData) && data.hypnoticPatternsData.length)
    ? data.hypnoticPatternsData[0]
    : getAnalysisForSection(data, 'hypnoticPatterns');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Language Pattern Library', [100, 0, 100]);
  const patterns = extractResult(rawData as Record<string, unknown>);
  
  if (patterns.effective_patterns) {
    const effective = patterns.effective_patterns as string[];
    ctx.renderSubsection('Effective Patterns');
    effective.slice(0, 5).forEach(p => ctx.renderBullet(p, 5));
  }
  
  if (patterns.embedded_commands) {
    const commands = patterns.embedded_commands as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Embedded Commands');
    commands.slice(0, 3).forEach(c => ctx.renderBullet(`"${c}"`, 5));
  }
  ctx.yPos += 8;
};

// Elicitation Guide renderer
export const renderElicitation: SectionRenderer = (ctx, data) => {
  const sessions = data.elicitationData?.length 
    ? data.elicitationData 
    : data.elicitationSessions;
  
  if (!Array.isArray(sessions) || !sessions.length) return;
  
  ctx.renderSectionHeader('Elicitation Technique Guide', PDF_DESIGN.colors.analysis);
  
  // Effective techniques summary
  const techniqueSuccess: Record<string, number> = {};
  (sessions as Array<Record<string, unknown>>).forEach((s) => {
    const technique = s.technique_used as string;
    const success = s.success_rating as number || 0;
    if (technique) {
      if (!techniqueSuccess[technique]) techniqueSuccess[technique] = 0;
      techniqueSuccess[technique] += success;
    }
  });
  
  const topTechniques = Object.entries(techniqueSuccess)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  if (topTechniques.length > 0) {
    ctx.renderSubsection('Most Effective Techniques');
    topTechniques.forEach(([technique, _]) => {
      ctx.renderBullet(technique, 5);
    });
  }
  ctx.yPos += 8;
};

// Cognitive Load renderer
export const renderCognitiveLoad: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.cognitiveLoadData) && data.cognitiveLoadData.length)
    ? data.cognitiveLoadData[0]
    : getAnalysisForSection(data, 'cognitiveLoad');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cognitive Load Exploitation', PDF_DESIGN.colors.mediumRisk);
  const load = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (load.current_load !== undefined) {
    ctx.renderScoreBar('Current Load', (load.current_load as number) * 100, 100, PDF_DESIGN.colors.mediumRisk);
  }
  
  if (load.exploitation_windows) {
    const windows = load.exploitation_windows as Array<Record<string, unknown>>;
    ctx.yPos += 5;
    ctx.renderSubsection('Exploitation Windows');
    windows.slice(0, 3).forEach((w) => {
      ctx.renderBullet(`${w.time_window || 'Unknown'}: ${w.opportunity || ''}`, 5);
    });
  }
  ctx.yPos += 8;
};

// Dark Tetrad renderer
export const renderDarkTetrad: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try multiple sources
  const rawData = (Array.isArray(data.darkTetradData) && data.darkTetradData.length)
    ? data.darkTetradData[0]
    : getAnalysisForSection(data, 'darkTetrad') 
      || (data.psychData?.[0] as Record<string, unknown>)?.dark_triad_indicators;
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Dark Tetrad Analysis', [50, 0, 50]);
  const darkData = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(250, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  const traits = [
    { key: 'narcissism', label: 'Narcissism', color: PDF_DESIGN.colors.danger },
    { key: 'machiavellianism', label: 'Machiavellianism', color: [100, 0, 100] as [number, number, number] },
    { key: 'psychopathy', label: 'Psychopathy', color: PDF_DESIGN.colors.core },
    { key: 'sadism', label: 'Sadism', color: [128, 0, 64] as [number, number, number] },
  ];
  
  traits.forEach((trait) => {
    const score = darkData[trait.key] as number;
    if (score !== undefined) {
      ctx.renderScoreBar(trait.label, score, 100, trait.color);
    }
  });
  ctx.yPos += 8;
};

// Influence Vector renderer
export const renderInfluenceVectors: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try multiple sources
  const rawData = (Array.isArray(data.influenceVectorData) && data.influenceVectorData.length)
    ? data.influenceVectorData
    : data.influenceData?.data
      ? [data.influenceData]
      : null;
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Influence Vector Analysis', PDF_DESIGN.colors.info);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  (rawData as Array<Record<string, unknown>>).slice(0, 5).forEach((v) => {
    const vector = v.vector_type as string || 'Unknown';
    const strength = (v.strength as number) || 0;
    ctx.renderScoreBar(vector, strength * 100, 100, PDF_DESIGN.colors.info);
  });
  ctx.yPos += 8;
};

// Financial Psychology renderer
export const renderFinancialPsychology: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.financialPsychData) && data.financialPsychData.length)
    ? data.financialPsychData[0]
    : getAnalysisForSection(data, 'financialPsychology');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Financial Psychology Profile', [0, 128, 64]);
  const finPsych = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (finPsych.money_scripts) {
    const scripts = finPsych.money_scripts as string[];
    ctx.renderSubsection('Money Scripts');
    scripts.slice(0, 4).forEach(s => ctx.renderBullet(s, 5));
  }
  
  if (finPsych.financial_triggers) {
    const triggers = finPsych.financial_triggers as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Financial Triggers');
    triggers.slice(0, 3).forEach(t => ctx.renderBullet(t, 5));
  }
  ctx.yPos += 8;
};

// Sacred Values renderer
export const renderSacredValues: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.sacredValuesData) && data.sacredValuesData.length)
    ? data.sacredValuesData[0]
    : getAnalysisForSection(data, 'sacredValues');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Sacred Values Profile', [128, 64, 0]);
  const sacred = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  // Handle different data shapes from existential_leverage vs sacred_values
  const coreValues = (sacred.core_values || sacred.existential_leverage_points || sacred.sacred_values || sacred.leverage_points) as string[];
  if (coreValues && Array.isArray(coreValues)) {
    ctx.renderSubsection('Core Sacred Values');
    coreValues.slice(0, 5).forEach(v => ctx.renderBullet(v, 5));
  }
  
  const taboos = (sacred.taboo_violations || sacred.exploitation_risks || sacred.taboo_boundaries) as string[];
  if (taboos && Array.isArray(taboos)) {
    ctx.yPos += 3;
    ctx.renderSubsection('Taboo Boundaries');
    taboos.slice(0, 3).forEach(t => ctx.renderBullet(`⚠ ${t}`, 5));
  }
  ctx.yPos += 8;
};

// Deception Analysis Deep Dive renderer
export const renderDeceptionAnalysis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try multiple sources
  const rawData = (Array.isArray(data.deceptionAnalysisData) && data.deceptionAnalysisData.length)
    ? data.deceptionAnalysisData[0]
    : getAnalysisForSection(data, 'deceptionAnalysis');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Deception Analysis Deep Dive', PDF_DESIGN.colors.danger);
  const result = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (result.overall_deception_score !== undefined) {
    const score = (result.overall_deception_score as number) * 100;
    const color: [number, number, number] = score > 70 ? PDF_DESIGN.colors.danger : score > 40 ? PDF_DESIGN.colors.warning : PDF_DESIGN.colors.success;
    ctx.renderScoreBar('Deception Likelihood', score, 100, color);
  }
  
  if (result.deception_indicators) {
    const indicators = result.deception_indicators as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Deception Indicators');
    indicators.slice(0, 4).forEach(i => ctx.renderBullet(i, 5));
  }
  
  if (result.verbal_cues) {
    const cues = result.verbal_cues as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Verbal Deception Cues');
    cues.slice(0, 3).forEach(c => ctx.renderBullet(c, 5));
  }
  ctx.yPos += 8;
};

export const intelligenceSectionRenderers = {
  mice: renderMICE,
  cialdini: renderCialdini,
  psychological: renderPsychologicalProfile,
  psychProfile: renderPsychologicalProfile,
  trust: renderTrust,
  behavioralDna: renderBehavioralDNA,
  quantumCognition: renderQuantumCognition,
  relationship: renderRelationship,
  playbook: renderPlaybook,
  hypnoticPatterns: renderHypnoticPatterns,
  elicitation: renderElicitation,
  cognitiveLoad: renderCognitiveLoad,
  darkTetrad: renderDarkTetrad,
  influenceVectors: renderInfluenceVectors,
  financialPsychology: renderFinancialPsychology,
  sacredValues: renderSacredValues,
  deceptionAnalysis: renderDeceptionAnalysis,
};
