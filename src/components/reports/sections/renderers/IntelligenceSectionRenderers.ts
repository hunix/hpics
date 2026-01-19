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

// Quantum Cognition renderer
export const renderQuantumCognition: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.quantumCognitionData) || !data.quantumCognitionData.length) return;
  
  ctx.renderSectionHeader('Quantum Cognition Analysis', [75, 0, 130]);
  // v3.7.5: Extract from .result field if present (ai_analyses format)
  const rawData = (data.quantumCognitionData as Array<Record<string, unknown>>)[0];
  const quantum = ((rawData?.result || rawData) as Record<string, unknown>) || {};
  
  ctx.checkPageBreak(40);
  doc.setFillColor(248, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (quantum.superposition_states) {
    const states = quantum.superposition_states as string[];
    ctx.renderSubsection('Decision Superposition States');
    states.slice(0, 3).forEach(s => ctx.renderBullet(s, 5));
  }
  
  if (quantum.collapse_probability !== undefined) {
    ctx.renderScoreBar('Collapse Probability', (quantum.collapse_probability as number) * 100, 100, [75, 0, 130]);
  }
  ctx.yPos += 8;
};

// Relationship Dynamics renderer
export const renderRelationship: SectionRenderer = (ctx, data) => {
  if (!data.relationshipAnalysis?.result) return;
  
  ctx.renderSectionHeader('Relationship Dynamics', [150, 80, 50]);
  const rel = data.relationshipAnalysis.result as Record<string, unknown>;
  
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
  if (!Array.isArray(data.playbookData) || !data.playbookData.length) return;
  
  ctx.renderSectionHeader('Engagement Playbook', [0, 100, 80]);
  // v3.7.5: Extract from .result field if present (ai_analyses format)
  const rawData = (data.playbookData as Array<Record<string, unknown>>)[0];
  const playbook = ((rawData?.result || rawData) as Record<string, unknown>) || {};
  
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
  if (!Array.isArray(data.hypnoticPatternsData) || !data.hypnoticPatternsData.length) return;
  
  ctx.renderSectionHeader('Language Pattern Library', [100, 0, 100]);
  // v3.7.5: Extract from .result field if present (ai_analyses format)
  const rawData = (data.hypnoticPatternsData as Array<Record<string, unknown>>)[0];
  const patterns = ((rawData?.result || rawData) as Record<string, unknown>) || {};
  
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
  if (!Array.isArray(data.elicitationData) || !data.elicitationData.length) return;
  
  ctx.renderSectionHeader('Elicitation Technique Guide', [0, 80, 120]);
  const sessions = data.elicitationData as Array<Record<string, unknown>>;
  
  // Effective techniques summary
  const techniqueSuccess: Record<string, number> = {};
  sessions.forEach((s) => {
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
  if (!Array.isArray(data.cognitiveLoadData) || !data.cognitiveLoadData.length) return;
  
  ctx.renderSectionHeader('Cognitive Load Exploitation', [180, 100, 50]);
  // v3.7.5: Extract from .result field if present (ai_analyses format)
  const rawData = (data.cognitiveLoadData as Array<Record<string, unknown>>)[0];
  const load = ((rawData?.result || rawData) as Record<string, unknown>) || {};
  
  ctx.checkPageBreak(40);
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (load.current_load !== undefined) {
    ctx.renderScoreBar('Current Load', (load.current_load as number) * 100, 100, [180, 100, 50]);
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
  if ((!Array.isArray(data.darkTetradData) || !data.darkTetradData.length) && (!Array.isArray(data.psychData) || !data.psychData.length)) return;
  
  ctx.renderSectionHeader('Dark Tetrad Analysis', [50, 0, 50]);
  
  const darkData = data.darkTetradData?.[0] as Record<string, unknown> || 
    (data.psychData?.[0] as Record<string, unknown>)?.dark_triad_indicators;
  
  if (!darkData) return;
  
  ctx.checkPageBreak(60);
  doc.setFillColor(250, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  const traits = [
    { key: 'narcissism', label: 'Narcissism', color: [180, 0, 0] as [number, number, number] },
    { key: 'machiavellianism', label: 'Machiavellianism', color: [100, 0, 100] as [number, number, number] },
    { key: 'psychopathy', label: 'Psychopathy', color: [50, 50, 50] as [number, number, number] },
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
  if (!Array.isArray(data.influenceVectorData) || !data.influenceVectorData.length) return;
  
  ctx.renderSectionHeader('Influence Vector Analysis', [0, 100, 150]);
  const vectors = data.influenceVectorData as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  vectors.slice(0, 5).forEach((v) => {
    const vector = v.vector_type as string || 'Unknown';
    const strength = (v.strength as number) || 0;
    ctx.renderScoreBar(vector, strength * 100, 100, [0, 100, 150]);
  });
  ctx.yPos += 8;
};

// Financial Psychology renderer
export const renderFinancialPsychology: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.financialPsychData) || !data.financialPsychData.length) return;
  
  ctx.renderSectionHeader('Financial Psychology Profile', [0, 128, 64]);
  const finPsych = (data.financialPsychData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.sacredValuesData) || !data.sacredValuesData.length) return;
  
  ctx.renderSectionHeader('Sacred Values Profile', [128, 64, 0]);
  const sacred = (data.sacredValuesData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (sacred.core_values) {
    const values = sacred.core_values as string[];
    ctx.renderSubsection('Core Sacred Values');
    values.slice(0, 5).forEach(v => ctx.renderBullet(v, 5));
  }
  
  if (sacred.taboo_violations) {
    const taboos = sacred.taboo_violations as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Taboo Boundaries');
    taboos.slice(0, 3).forEach(t => ctx.renderBullet(`⚠ ${t}`, 5));
  }
  ctx.yPos += 8;
};

// Deception Analysis Deep Dive renderer
export const renderDeceptionAnalysis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  // Try multiple data sources for deception analysis
  const deceptionData = Array.isArray(data.deceptionAnalysisData) && data.deceptionAnalysisData.length
    ? data.deceptionAnalysisData
    : (data.allAnalyses as Array<Record<string, unknown>>)?.filter(a => a.analysis_type === 'deception_analysis');
  
  if (!deceptionData?.length) return;
  
  ctx.renderSectionHeader('Deception Analysis Deep Dive', [180, 0, 0]);
  const deception = deceptionData[0] as Record<string, unknown>;
  const result = (deception.result || deception) as Record<string, unknown>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (result.overall_deception_score !== undefined) {
    const score = (result.overall_deception_score as number) * 100;
    const color: [number, number, number] = score > 70 ? [180, 0, 0] : score > 40 ? [200, 150, 0] : [0, 150, 0];
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
  // Map section IDs from sectionDefinitions.ts to renderer functions
  mice: renderMICE,
  cialdini: renderCialdini,
  psychological: renderPsychologicalProfile,
  trust: renderTrust,
  behavioralDna: renderBehavioralDNA,
  quantumCognition: renderQuantumCognition,
  relationship: renderRelationship,
  playbook: renderPlaybook,
  hypnoticPatterns: renderHypnoticPatterns,
  elicitation: renderElicitation,
  cognitiveLoad: renderCognitiveLoad,
  darkTetrad: renderDarkTetrad,
  // NOTE: 'influence' section is handled by warfareSectionRenderers (v3.7.5 fix)
  financialPsychology: renderFinancialPsychology,
  sacredValues: renderSacredValues,
  deceptionAnalysis: renderDeceptionAnalysis,
};
