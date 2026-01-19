/**
 * Fusion Section Renderers (v3.7.1)
 * Renders: TFT, Digital Twin, GraphRAG, Shadow Network, Dempster-Shafer, etc.
 */

import { PDFRenderContext, RenderHelpers, DossierData, SectionRenderer } from './types';

export const renderTemporalFusion: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.temporalFusionData.data?.length) return;
  
  renderSectionHeader('Temporal Fusion Transformer', [50, 100, 150]);
  
  const tft = (data.temporalFusionData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (tft) {
    checkPageBreak(45);
    
    if ((tft.behavioral_forecasts as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Behavioral Forecasts');
      (tft.behavioral_forecasts as Array<Record<string, unknown>>).slice(0, 4).forEach((f) => {
        const text = typeof f === 'string' ? f : `${f.behavior || f.prediction}: ${f.timeframe || '30d'} (${((f.confidence as number) * 100 || 50).toFixed(0)}%)`;
        renderBullet(text, 5);
      });
    }
    
    if ((tft.attention_weights as Record<string, unknown>)) {
      renderSubsection('Attention Weights');
      Object.entries(tft.attention_weights as Record<string, number>).slice(0, 5).forEach(([key, value]) => {
        renderScoreBar(key.replace(/_/g, ' '), (value as number) * 100, 100, [50, 100, 150]);
      });
    }
  }
  ctx.yPos += 8;
};

export const renderDigitalTwin: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderKeyValue, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.digitalTwinData.data?.length) return;
  
  renderSectionHeader('Behavioral Digital Twin', [100, 50, 150]);
  
  const twin = (data.digitalTwinData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (twin) {
    checkPageBreak(45);
    
    if (twin.fidelity_score) {
      renderScoreBar('Twin Fidelity', (twin.fidelity_score as number) * 100, 100, [100, 50, 150]);
    }
    
    if (twin.personality_parameters) {
      renderSubsection('Personality Parameters');
      Object.entries(twin.personality_parameters as Record<string, unknown>).slice(0, 5).forEach(([key, value]) => {
        renderKeyValue(key.replace(/_/g, ' '), String(value));
      });
    }
    
    if ((twin.simulation_scenarios as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Simulation Scenarios');
      (twin.simulation_scenarios as Array<Record<string, unknown>>).slice(0, 3).forEach((s) => {
        renderBullet(`${s.scenario || s.name}: ${s.predicted_response || s.outcome || 'Pending'}`, 5);
      });
    }
  }
  ctx.yPos += 8;
};

export const renderGraphRAG: SectionRenderer = (ctx, helpers, data) => {
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.graphRagData.data?.length) return;
  
  renderSectionHeader('Graph RAG Intelligence', [0, 150, 100]);
  
  const graph = (data.graphRagData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (graph) {
    checkPageBreak(40);
    
    if ((graph.knowledge_clusters as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Knowledge Clusters');
      (graph.knowledge_clusters as Array<Record<string, unknown>>).slice(0, 4).forEach((c) => {
        const text = typeof c === 'string' ? c : `${c.topic || c.name}: ${c.documents || 0} docs, ${c.entities || 0} entities`;
        renderBullet(text, 5);
      });
    }
    
    if ((graph.relationship_insights as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Relationship Insights');
      (graph.relationship_insights as Array<Record<string, unknown>>).slice(0, 4).forEach((r) => {
        const text = typeof r === 'string' ? r : r.insight as string || r.description as string;
        renderBullet(text, 5);
      });
    }
    
    if (graph.retrieval_quality) {
      renderScoreBar('Retrieval Quality', (graph.retrieval_quality as number) * 100, 100, [0, 150, 100]);
    }
  }
  ctx.yPos += 8;
};

export const renderShadowNetwork: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  if (!data.shadowNetworkData.data?.length) return;
  
  renderSectionHeader('Shadow Network Analysis', [50, 50, 80]);
  
  const shadow = (data.shadowNetworkData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (shadow) {
    checkPageBreak(45);
    
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 25, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(`Hidden Connections: ${shadow.hidden_connection_count || 0}`, ctx.margin + 5, ctx.yPos + 5);
    doc.text(`Covert Influence: ${(((shadow.covert_influence_score as number) || 0) * 100).toFixed(0)}%`, ctx.margin + 70, ctx.yPos + 5);
    doc.text(`Network Opacity: ${(((shadow.opacity_score as number) || 0) * 100).toFixed(0)}%`, ctx.margin + 135, ctx.yPos + 5);
    ctx.yPos += 25;
    
    if ((shadow.hidden_actors as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Hidden Actors');
      (shadow.hidden_actors as Array<Record<string, unknown>>).slice(0, 4).forEach((a) => {
        const text = typeof a === 'string' ? a : `${a.name || a.entity}: ${a.role || 'Unknown role'}`;
        renderBullet(text, 5);
      });
    }
    
    if ((shadow.covert_channels as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Covert Communication Channels');
      (shadow.covert_channels as Array<Record<string, unknown>>).slice(0, 3).forEach((c) => {
        const text = typeof c === 'string' ? c : `${c.channel || c.type}: ${c.frequency || 'Intermittent'}`;
        renderBullet(text, 5);
      });
    }
  }
  ctx.yPos += 8;
};

export const renderDempsterShafer: SectionRenderer = (ctx, helpers, data) => {
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.dempsterShaferData.data?.length) return;
  
  renderSectionHeader('Dempster-Shafer Evidence Fusion', [150, 100, 0]);
  
  const ds = (data.dempsterShaferData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (ds) {
    checkPageBreak(40);
    
    if (ds.belief_masses) {
      renderSubsection('Belief Mass Assignments');
      Object.entries(ds.belief_masses as Record<string, number>).slice(0, 5).forEach(([hypothesis, mass]) => {
        renderScoreBar(hypothesis.replace(/_/g, ' '), mass * 100, 100, [150, 100, 0]);
      });
    }
    
    if ((ds.conflicting_evidence as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Conflicting Evidence');
      (ds.conflicting_evidence as Array<Record<string, unknown>>).slice(0, 3).forEach((e) => {
        const text = typeof e === 'string' ? e : `${e.source1} vs ${e.source2}: ${e.conflict_type || 'Contradiction'}`;
        renderBullet(text, 5);
      });
    }
    
    if (ds.uncertainty_score !== undefined) {
      renderScoreBar('Overall Uncertainty', (ds.uncertainty_score as number) * 100, 100, [200, 50, 50]);
    }
  }
  ctx.yPos += 8;
};

export const renderCounterfactual: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, checkPageBreak } = helpers;
  
  if (!data.counterfactualData.data?.length) return;
  
  renderSectionHeader('Counterfactual Analysis', [120, 80, 160]);
  
  const cf = (data.counterfactualData.data as Array<Record<string, unknown>>)[0]?.result as Record<string, unknown>;
  if (cf) {
    checkPageBreak(45);
    
    if ((cf.scenarios as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('What-If Scenarios');
      (cf.scenarios as Array<Record<string, unknown>>).slice(0, 4).forEach((s) => {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`If: ${s.condition || s.if}`, ctx.margin, ctx.yPos);
        ctx.yPos += ctx.lineHeight;
        doc.setFont('helvetica', 'normal');
        doc.text(`Then: ${s.outcome || s.then} (${((s.probability as number) * 100 || 50).toFixed(0)}%)`, ctx.margin + 5, ctx.yPos);
        ctx.yPos += ctx.lineHeight + 2;
      });
    }
    
    if ((cf.causal_factors as Array<Record<string, unknown>>)?.length > 0) {
      renderSubsection('Key Causal Factors');
      (cf.causal_factors as Array<Record<string, unknown>>).slice(0, 4).forEach((f) => {
        const text = typeof f === 'string' ? f : `${f.factor}: ${f.impact || 'Significant'}`;
        renderBullet(text, 5);
      });
    }
  }
  ctx.yPos += 8;
};

export const renderMosaicFusion: SectionRenderer = (ctx, helpers, data) => {
  const { doc } = ctx;
  const { renderSectionHeader, renderSubsection, renderBullet, renderScoreBar, checkPageBreak } = helpers;
  
  if (!data.mosaicFusionData.data?.length) return;
  
  renderSectionHeader('Mosaic Intelligence Fusion', [75, 0, 130]);
  
  const fusion = (data.mosaicFusionData.data as Array<Record<string, unknown>>)[0];
  
  checkPageBreak(35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fusion Type: ${(fusion.fusion_type as string)?.toUpperCase() || 'COMPREHENSIVE'}`, ctx.margin, ctx.yPos);
  doc.text(`Sources: ${fusion.source_count || 0}`, ctx.margin + 80, ctx.yPos);
  doc.text(`Grade: ${fusion.intelligence_grade || 'N/A'}`, ctx.margin + 130, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 3;
  
  if (fusion.fusion_score) {
    renderScoreBar('Fusion Score', (fusion.fusion_score as number) * 100, 100, [75, 0, 130]);
  }
  
  const insights = fusion.high_confidence_insights as Array<unknown> || [];
  if (insights.length > 0) {
    renderSubsection('High Confidence Insights');
    insights.slice(0, 4).forEach((i) => {
      const text = typeof i === 'string' ? i : (i as Record<string, unknown>).insight as string || JSON.stringify(i);
      renderBullet(text, 5);
    });
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
};
