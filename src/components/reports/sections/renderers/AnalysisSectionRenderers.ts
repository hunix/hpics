/**
 * Analysis Section Renderers (v3.7.2)
 * Renders: Behavioral Analysis, Influence Resistance, Behavioral Economics,
 *          Network Position, Prediction Accuracy, Counter-Intel, Proportional Response
 */

import { format } from 'date-fns';
import type { SectionRenderer } from './types';

export const renderBehavioralAnalysis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.allAnalyses?.length) return;
  
  ctx.renderSectionHeader('Behavioral Analysis Summary', [50, 100, 100]);
  
  const analyses = (data.allAnalyses as Array<Record<string, unknown>>).filter(
    a => a.analysis_type !== 'behavioral_dna' && a.analysis_type !== 'relationship_dynamics'
  );
  
  if (analyses.length === 0) return;
  
  analyses.slice(0, 5).forEach((analysis) => {
    ctx.checkPageBreak(25);
    const analysisType = (analysis.analysis_type as string)?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN';
    ctx.renderSubsection(analysisType);
    const result = analysis.result as Record<string, unknown>;
    if (result?.summary) {
      const lines = doc.splitTextToSize(String(result.summary), ctx.contentWidth - 10);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(lines.slice(0, 3), ctx.margin, ctx.yPos);
      ctx.yPos += Math.min(lines.length, 3) * ctx.lineHeight + 5;
    }
  });
  ctx.yPos += 8;
};

export const renderInfluenceResistance: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.influenceResistanceData) || !data.influenceResistanceData.length) return;
  
  ctx.renderSectionHeader('Influence Resistance Profile', [0, 100, 150]);
  const resistance = (data.influenceResistanceData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(45);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (resistance.overall_resistance !== undefined) {
    ctx.renderScoreBar('Overall Resistance', (resistance.overall_resistance as number) * 100, 100, [0, 100, 180]);
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
  if (!Array.isArray(data.financialPsychData) || !data.financialPsychData.length) return;
  
  ctx.renderSectionHeader('Behavioral Economics Profile', [0, 128, 64]);
  const finPsych = (data.financialPsychData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (finPsych.loss_aversion_score !== undefined) {
    ctx.renderScoreBar('Loss Aversion', (finPsych.loss_aversion_score as number) * 100, 100, [200, 100, 0]);
  }
  if (finPsych.risk_tolerance !== undefined) {
    ctx.renderScoreBar('Risk Tolerance', (finPsych.risk_tolerance as number) * 100, 100, [0, 150, 100]);
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
  if (!Array.isArray(data.networkPositionData) || !data.networkPositionData.length) return;
  
  ctx.renderSectionHeader('Network Position Analysis', [100, 50, 150]);
  const position = (data.networkPositionData as Array<Record<string, unknown>>)[0];
  
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
    doc.setFontSize(8);
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
  if (!Array.isArray(data.predictionHistoryData) || !data.predictionHistoryData.length) return;
  
  ctx.renderSectionHeader('Prediction Accuracy Tracking', [80, 80, 80]);
  const predictions = data.predictionHistoryData as Array<Record<string, unknown>>;
  
  const totalPredictions = predictions.length;
  const accuratePredictions = predictions.filter(p => p.was_accurate === true).length;
  const accuracy = totalPredictions > 0 ? (accuratePredictions / totalPredictions) * 100 : 0;
  
  ctx.checkPageBreak(30);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 25, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Historical Accuracy: ${accuracy.toFixed(1)}%`, ctx.margin + 5, ctx.yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`(${accuratePredictions}/${totalPredictions} predictions verified)`, ctx.margin + 5, ctx.yPos + 16);
  ctx.yPos += 30;
  ctx.yPos += 8;
};

export const renderCounterIntel: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.counterIntelData) || !data.counterIntelData.length) return;
  
  ctx.renderSectionHeader('Counter-Intelligence Assessment', [128, 0, 64]);
  const counterIntel = (data.counterIntelData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(40);
  doc.setFillColor(255, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (counterIntel.detection_risk !== undefined) {
    ctx.renderScoreBar('Detection Risk', (counterIntel.detection_risk as number) * 100, 100, [180, 0, 80]);
  }
  
  if (counterIntel.operational_security_score !== undefined) {
    ctx.renderScoreBar('OpSec Score', (counterIntel.operational_security_score as number) * 100, 100, [0, 128, 64]);
  }
  ctx.yPos += 8;
};

export const renderProportionalResponse: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.proportionalResponseData) || !data.proportionalResponseData.length) return;
  
  ctx.renderSectionHeader('Proportional Response Log', [150, 75, 0]);
  const responses = data.proportionalResponseData as Array<Record<string, unknown>>;
  
  responses.slice(0, 5).forEach((response) => {
    ctx.checkPageBreak(25);
    const incidentType = (response.incident_type as string)?.toUpperCase() || 'INCIDENT';
    ctx.renderSubsection(incidentType);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (response.recommended_response) {
      doc.text(`Response: ${response.recommended_response}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    if (response.severity_level !== undefined) {
      doc.text(`Severity: ${response.severity_level}/10`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 3;
  });
  ctx.yPos += 8;
};

export const renderCrossModalDeception: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.deceptionAnalysisData) || !data.deceptionAnalysisData.length) return;
  
  ctx.renderSectionHeader('Cross-Modal Deception Analysis', [180, 0, 0]);
  const deception = (data.deceptionAnalysisData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (deception.overall_deception_score !== undefined) {
    const score = (deception.overall_deception_score as number) * 100;
    const color: [number, number, number] = score > 70 ? [180, 0, 0] : score > 40 ? [200, 150, 0] : [0, 150, 0];
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
  
  ctx.renderSectionHeader('Strategic Action Plans', [0, 80, 160]);
  const plans = data.actionPlansData as Array<Record<string, unknown>>;
  
  plans.slice(0, 5).forEach((plan) => {
    ctx.checkPageBreak(30);
    const title = (plan.title as string) || 'Untitled Plan';
    ctx.renderSubsection(title);
    
    if (plan.priority_score !== undefined) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const priority = plan.priority_score as number;
      const color: [number, number, number] = priority > 80 ? [180, 0, 0] : priority > 50 ? [200, 150, 0] : [100, 100, 100];
      doc.setTextColor(...color);
      doc.text(`PRIORITY: ${priority}`, ctx.margin, ctx.yPos);
      doc.setTextColor(0);
      ctx.yPos += ctx.lineHeight;
    }
    
    if (plan.suggested_action) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(plan.suggested_action), ctx.contentWidth - 10);
      doc.text(lines.slice(0, 2), ctx.margin, ctx.yPos);
      ctx.yPos += Math.min(lines.length, 2) * ctx.lineHeight + 3;
    }
  });
  ctx.yPos += 8;
};

export const analysisSectionRenderers = {
  behavioralAnalysis: renderBehavioralAnalysis,
  influenceResistance: renderInfluenceResistance,
  behavioralEconomics: renderBehavioralEconomics,
  networkPosition: renderNetworkPosition,
  predictionAccuracy: renderPredictionAccuracy,
  counterIntel: renderCounterIntel,
  proportionalResponse: renderProportionalResponse,
  crossModalDeception: renderCrossModalDeception,
  actionPlans: renderActionPlans,
};
