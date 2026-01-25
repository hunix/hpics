/**
 * Fusion Section Renderers (v4.0)
 * v4.0: Unified design system with category colors
 */

import type { SectionRenderer } from './types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';
import { getSectionColor, getCategoryBackgroundColor, extractResultSafe, hasRenderableContent } from '../../utils/pdfDesignSystem';

export const renderTemporalFusion: SectionRenderer = (ctx, data) => {
  // v3.9.33: PRIORITIZE allAnalyses fallback first
  const rawData = getAnalysisForSection(data, 'temporalFusion')
    || (data.temporalFusionData?.length ? data.temporalFusionData[0] : null);
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Temporal Fusion Transformer', getSectionColor('temporalFusion'));
  const tft = extractResult(rawData as Record<string, unknown>);
  
  if (tft?.behavioral_forecasts) {
    ctx.renderSubsection('Behavioral Forecasts');
    ((tft.behavioral_forecasts as Array<Record<string, unknown>>) || []).slice(0, 3).forEach((f) => {
      ctx.renderBullet(`${f.behavior || f.prediction}: ${f.timeframe || '30d'}`, 5);
    });
  }
  
  if (tft?.temporal_patterns) {
    const patterns = tft.temporal_patterns as string[];
    ctx.renderSubsection('Temporal Patterns');
    patterns.slice(0, 3).forEach(p => ctx.renderBullet(p, 5));
  }
  
  ctx.yPos += 8;
};

export const renderDigitalTwin: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.digitalTwinData?.length
    ? data.digitalTwinData[0]
    : getAnalysisForSection(data, 'digitalTwin');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Behavioral Digital Twin', getSectionColor('digitalTwin'));
  const twin = extractResult(rawData as Record<string, unknown>);
  
  if (twin?.fidelity_score !== undefined) {
    ctx.renderScoreBar('Twin Fidelity', (twin.fidelity_score as number) * 100, 100, getSectionColor('digitalTwin'));
  }
  
  if (twin?.simulation_accuracy !== undefined) {
    ctx.renderScoreBar('Simulation Accuracy', (twin.simulation_accuracy as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  ctx.yPos += 8;
};

export const renderGraphRAG: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.graphRagData?.length
    ? data.graphRagData[0]
    : getAnalysisForSection(data, 'graphRag');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Graph RAG Intelligence', getSectionColor('graphRag'));
  const graph = extractResult(rawData as Record<string, unknown>);
  
  if (graph?.retrieval_quality !== undefined) {
    ctx.renderScoreBar('Retrieval Quality', (graph.retrieval_quality as number) * 100, 100, getSectionColor('graphRag'));
  }
  
  if (graph?.key_entities) {
    const entities = graph.key_entities as string[];
    ctx.renderSubsection('Key Entities');
    entities.slice(0, 5).forEach(e => ctx.renderBullet(e, 5));
  }
  
  ctx.yPos += 8;
};

export const renderShadowNetwork: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.shadowNetworkData?.length
    ? data.shadowNetworkData[0]
    : getAnalysisForSection(data, 'shadowNetwork');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Shadow Network Analysis', getSectionColor('shadowNetwork'));
  const shadow = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(25);
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 20, 3, 3, 'F');
  doc.setFontSize(PDF_DESIGN.fonts.body);
  doc.setFont('helvetica', 'bold');
  doc.text(`Hidden Connections: ${shadow.hidden_connection_count || shadow.connection_count || 0}`, ctx.margin + 5, ctx.yPos + 5);
  ctx.yPos += 25;
  
  if (shadow.hidden_relationships) {
    const relationships = shadow.hidden_relationships as Array<Record<string, unknown>>;
    ctx.renderSubsection('Hidden Relationships');
    relationships.slice(0, 3).forEach(r => {
      ctx.renderBullet(`${r.entity_a || 'Unknown'} ↔ ${r.entity_b || 'Unknown'}`, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const renderDempsterShafer: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.dempsterShaferData?.length
    ? data.dempsterShaferData[0]
    : getAnalysisForSection(data, 'dempsterShafer');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Dempster-Shafer Evidence Fusion', getSectionColor('dempsterShafer'));
  const ds = extractResult(rawData as Record<string, unknown>);
  
  if (ds?.uncertainty_score !== undefined) {
    ctx.renderScoreBar('Uncertainty', (ds.uncertainty_score as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  if (ds?.belief_mass !== undefined) {
    ctx.renderScoreBar('Belief Mass', (ds.belief_mass as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  if (ds?.evidence_sources) {
    const sources = ds.evidence_sources as string[];
    ctx.renderSubsection('Evidence Sources');
    sources.slice(0, 4).forEach(s => ctx.renderBullet(s, 5));
  }
  
  ctx.yPos += 8;
};

export const renderCounterfactual: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.counterfactualData?.length
    ? data.counterfactualData[0]
    : getAnalysisForSection(data, 'counterfactual');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Counterfactual Analysis', getSectionColor('counterfactual'));
  const cf = extractResult(rawData as Record<string, unknown>);
  
  if (cf?.scenarios) {
    const scenarios = cf.scenarios as Array<Record<string, unknown>>;
    ctx.renderSubsection('Alternative Scenarios');
    scenarios.slice(0, 4).forEach(s => {
      const label = s.scenario as string || s.label as string || 'Unknown';
      const probability = (s.probability as number) || 0;
      ctx.renderBullet(`${label} (${Math.round(probability * 100)}%)`, 5);
    });
  }
  
  ctx.yPos += 8;
};

export const renderMosaicFusion: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.mosaicFusionData?.length
    ? data.mosaicFusionData[0]
    : getAnalysisForSection(data, 'mosaicFusion');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Mosaic Intelligence Fusion', PDF_DESIGN.colors.fusion);
  const fusion = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(20);
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fusion Type: ${(fusion.fusion_type as string)?.toUpperCase() || 'COMPREHENSIVE'}`, ctx.margin, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 8;
  
  if (fusion.synthesis_insights) {
    const insights = fusion.synthesis_insights as string[];
    ctx.renderSubsection('Synthesis Insights');
    insights.slice(0, 4).forEach(i => ctx.renderBullet(i, 5));
  }
};

// Pattern of Life Fusion renderer
export const renderPatternOfLifeFusion: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.patternOfLifeEngineData) && data.patternOfLifeEngineData.length)
    ? data.patternOfLifeEngineData[0]
    : getAnalysisForSection(data, 'patternOfLifeFusion');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Pattern-of-Life Engine', getSectionColor('patternOfLifeFusion'));
  const pol = extractResult(rawData as Record<string, unknown>);
  
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
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.entityResolutionData?.length
    ? data.entityResolutionData[0]
    : getAnalysisForSection(data, 'entityResolution');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Entity Resolution & Alias Detection', getSectionColor('entityResolution'));
  const entity = extractResult(rawData as Record<string, unknown>);
  
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
  
  if (entity?.merged_profiles !== undefined) {
    const merged = entity.merged_profiles as number;
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'normal');
    doc.text(`Merged Profiles: ${merged}`, ctx.margin + 5, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
  }
  ctx.yPos += 8;
};

// Sentiment Cascade renderer
export const renderSentimentCascade: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.sentimentCascadeData?.length
    ? data.sentimentCascadeData[0]
    : getAnalysisForSection(data, 'sentimentCascade');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Sentiment Cascade Prediction (SIR Model)', getSectionColor('sentimentCascade'));
  const sentiment = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(...getCategoryBackgroundColor('fusion'));
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (sentiment?.infection_rate !== undefined) {
    ctx.renderScoreBar('Sentiment Infection Rate', (sentiment.infection_rate as number) * 100, 100, getSectionColor('sentimentCascade'));
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
  
  // v3.9.31: Try multiple sources
  const rawData = (Array.isArray((data as Record<string, unknown>).crossDomainData) && ((data as Record<string, unknown>).crossDomainData as unknown[]).length)
    ? ((data as Record<string, unknown>).crossDomainData as unknown[])[0]
    : getAnalysisForSection(data, 'crossDomainSynthesis');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cross-Domain Intelligence Synthesis', getSectionColor('crossDomainSynthesis'));
  const cross = extractResult(rawData as Record<string, unknown>);
  
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
  
  // v3.9.31: Try multiple sources
  const rawData = (Array.isArray((data as Record<string, unknown>).convergenceData) && ((data as Record<string, unknown>).convergenceData as unknown[]).length)
    ? ((data as Record<string, unknown>).convergenceData as unknown[])[0]
    : getAnalysisForSection(data, 'predictiveConvergence');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Predictive Convergence Analysis', getSectionColor('predictiveConvergence'));
  const convergence = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(...getCategoryBackgroundColor('fusion'));
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (convergence.synergy_multiplier !== undefined) {
    ctx.renderScoreBar('Synergy Multiplier', (convergence.synergy_multiplier as number) * 25, 100, getSectionColor('predictiveConvergence'));
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
