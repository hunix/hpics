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

export const fusionSectionRenderers = {
  temporalFusion: renderTemporalFusion,
  digitalTwin: renderDigitalTwin,
  graphRag: renderGraphRAG,
  shadowNetwork: renderShadowNetwork,
  dempsterShafer: renderDempsterShafer,
  counterfactual: renderCounterfactual,
  mosaicFusion: renderMosaicFusion,
};
