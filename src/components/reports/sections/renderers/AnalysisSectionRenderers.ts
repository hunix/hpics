/**
 * Analysis Section Renderers (v4.0)
 * Renders: Behavioral Analysis, Influence Resistance, Behavioral Economics,
 *          Network Position, Prediction Accuracy, Counter-Intel, Proportional Response
 * v4.0: Unified design system with category colors
 */

import type { SectionRenderer } from './types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';
import { getSectionColor, getCategoryBackgroundColor, extractResultSafe, hasRenderableContent } from '../../utils/pdfDesignSystem';

export const renderBehavioralAnalysis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.allAnalyses?.length) return;
  
  ctx.renderSectionHeader('Behavioral Analysis Summary', getSectionColor('analysis'));
  
  const analyses = (data.allAnalyses as Array<Record<string, unknown>>).filter(
    a => a.analysis_type !== 'behavioral_dna' && a.analysis_type !== 'relationship_dynamics'
  );
  
  if (analyses.length === 0) return;
  
  analyses.slice(0, 5).forEach((analysis) => {
    ctx.checkPageBreak(25);
    const analysisType = (analysis.analysis_type as string)?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
    ctx.renderSubsection(analysisType);
    const result = extractResult(analysis);
    if (result?.summary) {
      const lines = doc.splitTextToSize(String(result.summary), ctx.contentWidth - 10);
      doc.setFontSize(PDF_DESIGN.fonts.body);
      doc.setFont('helvetica', 'normal');
      doc.text(lines.slice(0, 3), ctx.margin, ctx.yPos);
      ctx.yPos += Math.min(lines.length, 3) * ctx.lineHeight + 5;
    }
  });
  ctx.yPos += 8;
};

export const renderInfluenceResistance: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.influenceResistanceData) && data.influenceResistanceData.length)
    ? data.influenceResistanceData[0]
    : getAnalysisForSection(data, 'influenceResistance');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Influence Resistance Profile', PDF_DESIGN.colors.info);
  const resistance = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (resistance.overall_resistance !== undefined) {
    ctx.renderScoreBar('Overall Resistance', (resistance.overall_resistance as number) * 100, 100, getSectionColor('influenceResistance'));
  }
  
  if (resistance.cognitive_barriers) {
    const barriers = resistance.cognitive_barriers as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Cognitive Barriers');
    barriers.slice(0, 4).forEach(b => ctx.renderBullet(b, 5));
  }
  ctx.yPos += 8;
};

export const renderBehavioralEconomics: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.financialPsychData) && data.financialPsychData.length)
    ? data.financialPsychData[0]
    : getAnalysisForSection(data, 'behavioralEconomics');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Behavioral Economics Profile', [0, 128, 64]);
  const finPsych = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (finPsych.loss_aversion_score !== undefined) {
    ctx.renderScoreBar('Loss Aversion', (finPsych.loss_aversion_score as number) * 100, 100, PDF_DESIGN.colors.mediumRisk);
  }
  if (finPsych.risk_tolerance !== undefined) {
    ctx.renderScoreBar('Risk Tolerance', (finPsych.risk_tolerance as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  if (finPsych.cognitive_biases) {
    const biases = finPsych.cognitive_biases as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Detected Cognitive Biases');
    biases.slice(0, 4).forEach(b => ctx.renderBullet(b, 5));
  }
  ctx.yPos += 8;
};

export const renderNetworkPosition: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.networkPositionData) && data.networkPositionData.length)
    ? data.networkPositionData[0]
    : getAnalysisForSection(data, 'networkPosition');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Network Position Analysis', getSectionColor('networkPosition'));
  const position = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  const metrics = [
    { label: 'Centrality', value: position.centrality_score as number },
    { label: 'Betweenness', value: position.betweenness_score as number },
    { label: 'Brokerage', value: position.brokerage_potential as number },
  ];
  
  const boxWidth = (ctx.contentWidth - 15) / 3;
  metrics.forEach((m, i) => {
    if (m.value === undefined) return;
    const x = ctx.margin + 5 + (i * boxWidth);
    doc.setFontSize(PDF_DESIGN.fonts.small);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 50, 150);
    doc.text(m.label, x, ctx.yPos + 8);
    doc.setFontSize(16);
    doc.text(`${Math.round((m.value || 0) * 100)}%`, x, ctx.yPos + 22);
    doc.setTextColor(0);
  });
  ctx.yPos += 40;
  ctx.yPos += 8;
};

export const renderPredictionAccuracy: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.predictionHistoryData) && data.predictionHistoryData.length)
    ? data.predictionHistoryData
    : getAnalysisForSection(data, 'predictionAccuracy');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Prediction Accuracy Tracking', PDF_DESIGN.colors.core);
  
  const predictions = Array.isArray(rawData) ? rawData : [rawData];
  const predArray = predictions as Array<Record<string, unknown>>;
  
  const totalPredictions = predArray.length;
  const accuratePredictions = predArray.filter(p => {
    const pData = extractResult(p);
    return pData.was_accurate === true;
  }).length;
  const accuracy = totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0;
  
  ctx.checkPageBreak(30);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 25, 3, 3, 'F');
  
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`Historical Accuracy: ${accuracy.toFixed(1)}%`, ctx.margin + 5, ctx.yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDF_DESIGN.fonts.small);
  doc.text(`(${accuratePredictions}/${totalPredictions} predictions verified)`, ctx.margin + 5, ctx.yPos + 16);
  ctx.yPos += 30;
  ctx.yPos += 8;
};

export const renderCounterIntel: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.counterIntelData) && data.counterIntelData.length)
    ? data.counterIntelData[0]
    : getAnalysisForSection(data, 'counterIntel');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Counter-Intelligence Assessment', getSectionColor('counterIntel'));
  const counterIntel = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(...getCategoryBackgroundColor('analysis'));
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (counterIntel.detection_risk !== undefined) {
    ctx.renderScoreBar('Detection Risk', (counterIntel.detection_risk as number) * 100, 100, getSectionColor('counterIntel'));
  }
  
  if (counterIntel.operational_security_score !== undefined) {
    ctx.renderScoreBar('OpSec Score', (counterIntel.operational_security_score as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  if (counterIntel.counter_measures) {
    const measures = counterIntel.counter_measures as string[];
    ctx.renderSubsection('Recommended Counter-Measures');
    measures.slice(0, 3).forEach(m => ctx.renderBullet(m, 5));
  }
  
  ctx.yPos += 8;
};

export const renderProportionalResponse: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.proportionalResponseData) || !data.proportionalResponseData.length) return;
  
  ctx.renderSectionHeader('Proportional Response Log', getSectionColor('proportionalResponse'));
  const responses = data.proportionalResponseData as Array<Record<string, unknown>>;
  
  responses.slice(0, 5).forEach((response) => {
    const respData = extractResult(response);
    ctx.checkPageBreak(25);
    const incidentType = (respData.incident_type as string)?.toUpperCase() || 'INCIDENT';
    ctx.renderSubsection(incidentType);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'normal');
    if (respData.recommended_response) {
      doc.text(`Response: ${respData.recommended_response}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    if (respData.severity_level !== undefined) {
      doc.text(`Severity: ${respData.severity_level}/10`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 3;
  });
  ctx.yPos += 8;
};

export const renderCrossModalDeception: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.deceptionAnalysisData) && data.deceptionAnalysisData.length)
    ? data.deceptionAnalysisData[0]
    : getAnalysisForSection(data, 'crossModal');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cross-Modal Deception Analysis', PDF_DESIGN.colors.danger);
  const deception = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (deception.overall_deception_score !== undefined) {
    const score = (deception.overall_deception_score as number) * 100;
    const color: [number, number, number] = score > 70 ? PDF_DESIGN.colors.danger : score > 40 ? PDF_DESIGN.colors.warning : PDF_DESIGN.colors.success;
    ctx.renderScoreBar('Deception Likelihood', score, 100, color);
  }
  
  if (deception.inconsistencies) {
    const issues = deception.inconsistencies as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Detected Inconsistencies');
    issues.slice(0, 3).forEach(i => ctx.renderBullet(i, 5));
  }
  ctx.yPos += 8;
};

export const renderActionPlans: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.actionPlansData) || !data.actionPlansData.length) return;
  
  ctx.renderSectionHeader('Strategic Action Plans', getSectionColor('actionPlans'));
  const plans = data.actionPlansData as Array<Record<string, unknown>>;
  
  plans.slice(0, 5).forEach((plan) => {
    const planData = extractResult(plan);
    ctx.checkPageBreak(30);
    const title = (planData.title as string) || 'Untitled Plan';
    ctx.renderSubsection(title);
    
    if (planData.priority_score !== undefined) {
      doc.setFontSize(PDF_DESIGN.fonts.small);
      doc.setFont('helvetica', 'bold');
      const priority = planData.priority_score as number;
      const color: [number, number, number] = priority > 80 ? PDF_DESIGN.colors.danger : priority > 50 ? PDF_DESIGN.colors.warning : PDF_DESIGN.colors.muted;
      doc.setTextColor(...color);
      doc.text(`PRIORITY: ${priority}`, ctx.margin, ctx.yPos);
      doc.setTextColor(0);
      ctx.yPos += ctx.lineHeight;
    }
    
    if (planData.suggested_action) {
      doc.setFontSize(PDF_DESIGN.fonts.body);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(planData.suggested_action), ctx.contentWidth - 10);
      doc.text(lines.slice(0, 2), ctx.margin, ctx.yPos);
      ctx.yPos += Math.min(lines.length, 2) * ctx.lineHeight + 3;
    }
  });
  ctx.yPos += 8;
};

export const analysisSectionRenderers = {
  // Map section IDs from sectionDefinitions.ts to renderer functions
  analysis: renderBehavioralAnalysis,
  influenceResistance: renderInfluenceResistance,
  behavioralEconomics: renderBehavioralEconomics,
  network: renderNetworkPosition,
  networkPosition: renderNetworkPosition,
  predictionAccuracy: renderPredictionAccuracy,
  counterIntel: renderCounterIntel,
  proportionalResponse: renderProportionalResponse,
  crossModal: renderCrossModalDeception,
  actionPlans: renderActionPlans,
};
