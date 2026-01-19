/**
 * Fusion Section Renderers (v3.7.1)
 */

import type { SectionRenderer } from './types';

export const renderTemporalFusion: SectionRenderer = (ctx, data) => {
  if (!data.temporalFusionData?.length) return;
  ctx.renderSectionHeader('Temporal Fusion Transformer', [50, 100, 150]);
  const tft = (data.temporalFusionData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (tft?.behavioral_forecasts) {
    ctx.renderSubsection('Behavioral Forecasts');
    ((tft.behavioral_forecasts as Array<Record<string, unknown>>) || []).slice(0, 3).forEach((f) => {
      ctx.renderBullet(`${f.behavior || f.prediction}: ${f.timeframe || '30d'}`, 5);
    });
  }
  ctx.yPos += 8;
};

export const renderDigitalTwin: SectionRenderer = (ctx, data) => {
  if (!data.digitalTwinData?.length) return;
  ctx.renderSectionHeader('Behavioral Digital Twin', [100, 50, 150]);
  const twin = (data.digitalTwinData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (twin?.fidelity_score) {
    ctx.renderScoreBar('Twin Fidelity', (twin.fidelity_score as number) * 100, 100, [100, 50, 150]);
  }
  ctx.yPos += 8;
};

export const renderGraphRAG: SectionRenderer = (ctx, data) => {
  if (!data.graphRagData?.length) return;
  ctx.renderSectionHeader('Graph RAG Intelligence', [0, 150, 100]);
  const graph = (data.graphRagData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (graph?.retrieval_quality) {
    ctx.renderScoreBar('Retrieval Quality', (graph.retrieval_quality as number) * 100, 100, [0, 150, 100]);
  }
  ctx.yPos += 8;
};

export const renderShadowNetwork: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.shadowNetworkData?.length) return;
  ctx.renderSectionHeader('Shadow Network Analysis', [50, 50, 80]);
  const shadow = (data.shadowNetworkData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (shadow) {
    ctx.checkPageBreak(25);
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hidden Connections: ${shadow.hidden_connection_count || 0}`, ctx.margin + 5, ctx.yPos + 5);
    ctx.yPos += 25;
  }
  ctx.yPos += 8;
};

export const renderDempsterShafer: SectionRenderer = (ctx, data) => {
  if (!data.dempsterShaferData?.length) return;
  ctx.renderSectionHeader('Dempster-Shafer Evidence Fusion', [150, 100, 0]);
  const ds = (data.dempsterShaferData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (ds?.uncertainty_score !== undefined) {
    ctx.renderScoreBar('Uncertainty', (ds.uncertainty_score as number) * 100, 100, [200, 50, 50]);
  }
  ctx.yPos += 8;
};

export const renderCounterfactual: SectionRenderer = (ctx, data) => {
  if (!data.counterfactualData?.length) return;
  ctx.renderSectionHeader('Counterfactual Analysis', [120, 80, 160]);
  ctx.yPos += 8;
};

export const renderMosaicFusion: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.mosaicFusionData?.length) return;
  ctx.renderSectionHeader('Mosaic Intelligence Fusion', [75, 0, 130]);
  const fusion = (data.mosaicFusionData as Array<Record<string, unknown>>)[0];
  ctx.checkPageBreak(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fusion Type: ${(fusion.fusion_type as string)?.toUpperCase() || 'COMPREHENSIVE'}`, ctx.margin, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 8;
};

// Pattern of Life Fusion renderer
export const renderPatternOfLifeFusion: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.patternOfLifeEngineData) || !data.patternOfLifeEngineData.length) return;
  
  ctx.renderSectionHeader('Pattern-of-Life Engine', [80, 100, 130]);
  const pol = (data.patternOfLifeEngineData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (pol?.circadian_profile) {
    const circadian = pol.circadian_profile as Record<string, unknown>;
    ctx.renderSubsection('Circadian Profile');
    ctx.renderBullet(`Chronotype: ${circadian.chronotype || 'Unknown'}`, 5);
    ctx.renderBullet(`Peak Cognitive: ${circadian.peak_cognitive_hours || 'Morning'}`, 5);
  }
  
  if (pol?.routine_deviations) {
    const deviations = pol.routine_deviations as Array<Record<string, unknown>>;
    ctx.yPos += 3;
    ctx.renderSubsection('Recent Routine Deviations');
    deviations.slice(0, 3).forEach((d) => {
      ctx.renderBullet(`${d.deviation_type || 'Unknown'}: ${d.significance || 'Low'}`, 5);
    });
  }
  ctx.yPos += 8;
};

// Entity Resolution renderer
export const renderEntityResolution: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.entityResolutionData?.length) return;
  
  ctx.renderSectionHeader('Entity Resolution & Alias Detection', [100, 80, 60]);
  const entity = (data.entityResolutionData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (entity?.detected_aliases) {
    const aliases = entity.detected_aliases as Array<Record<string, unknown>>;
    ctx.renderSubsection('Detected Aliases');
    aliases.slice(0, 5).forEach((a) => {
      const name = a.alias as string || 'Unknown';
      const confidence = (a.confidence as number) || 0;
      ctx.renderBullet(`${name} (${Math.round(confidence * 100)}% match)`, 5);
    });
  }
  
  if (entity?.merged_profiles) {
    const merged = entity.merged_profiles as number;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Merged Profiles: ${merged}`, ctx.margin + 5, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
  }
  ctx.yPos += 8;
};

// Sentiment Cascade renderer
export const renderSentimentCascade: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.sentimentCascadeData?.length) return;
  
  ctx.renderSectionHeader('Sentiment Cascade Prediction (SIR Model)', [150, 80, 80]);
  const sentiment = (data.sentimentCascadeData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 248, 248);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (sentiment?.infection_rate !== undefined) {
    ctx.renderScoreBar('Sentiment Infection Rate', (sentiment.infection_rate as number) * 100, 100, [150, 80, 80]);
  }
  
  if (sentiment?.cascade_predictions) {
    const predictions = sentiment.cascade_predictions as Array<Record<string, unknown>>;
    ctx.yPos += 5;
    ctx.renderSubsection('Cascade Predictions');
    predictions.slice(0, 3).forEach((p) => {
      const sentiment_type = p.sentiment as string || 'Unknown';
      const spread = (p.spread_probability as number) || 0;
      ctx.renderBullet(`${sentiment_type}: ${Math.round(spread * 100)}% spread probability`, 5);
    });
  }
  ctx.yPos += 8;
};

// Cross-Domain Synthesis renderer
export const renderCrossDomainSynthesis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.crossDomainData) || !data.crossDomainData.length) return;
  
  ctx.renderSectionHeader('Cross-Domain Intelligence Synthesis', [75, 100, 150]);
  const cross = (data.crossDomainData as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (cross?.domain_correlations) {
    const correlations = cross.domain_correlations as Array<Record<string, unknown>>;
    ctx.renderSubsection('Domain Correlations');
    correlations.slice(0, 4).forEach((c) => {
      const domains = `${c.domain_a} ↔ ${c.domain_b}`;
      const strength = (c.correlation_strength as number) || 0;
      ctx.renderBullet(`${domains}: ${Math.round(strength * 100)}%`, 5);
    });
  }
  
  if (cross?.synthesis_insights) {
    const insights = cross.synthesis_insights as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Synthesis Insights');
    insights.slice(0, 3).forEach(i => ctx.renderBullet(i, 5));
  }
  ctx.yPos += 8;
};

// Predictive Convergence renderer
export const renderPredictiveConvergence: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.convergenceData) || !data.convergenceData.length) return;
  
  ctx.renderSectionHeader('Predictive Convergence Analysis', [100, 50, 150]);
  const convergence = (data.convergenceData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(40);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (convergence.synergy_multiplier !== undefined) {
    ctx.renderScoreBar('Synergy Multiplier', (convergence.synergy_multiplier as number) * 25, 100, [100, 50, 150]);
  }
  
  if (convergence.converging_phases) {
    const phases = convergence.converging_phases as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Converging Phases');
    phases.slice(0, 4).forEach(p => ctx.renderBullet(p, 5));
  }
  ctx.yPos += 8;
};

export const fusionSectionRenderers = {
  temporalFusion: renderTemporalFusion,
  digitalTwin: renderDigitalTwin,
  graphRag: renderGraphRAG,
  shadowNetwork: renderShadowNetwork,
  dempsterShafer: renderDempsterShafer,
  counterfactual: renderCounterfactual,
  mosaicFusion: renderMosaicFusion,
  patternOfLifeFusion: renderPatternOfLifeFusion,
  entityResolution: renderEntityResolution,
  sentimentCascade: renderSentimentCascade,
  crossDomainSynthesis: renderCrossDomainSynthesis,
  predictiveConvergence: renderPredictiveConvergence,
};
