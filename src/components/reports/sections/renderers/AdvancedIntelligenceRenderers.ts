/**
 * Advanced Intelligence Section Renderers (v6.0)
 * New renderers for v6.0 Advanced Intelligence engines:
 * - Relationship Half-Life Calculator
 * - Automated Red Team Assessment
 * - Multi-Party Deception Detection
 * - Zero-Day Anomaly Detector
 * - Hypergame Theory Engine
 */

import type { SectionRenderer } from './types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';
import { getSectionColor, extractResultSafe } from '../../utils/pdfDesignSystem';

// ============== RELATIONSHIP HALF-LIFE CALCULATOR ==============

export const renderRelationshipHalfLife: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const rawData = (data as Record<string, unknown>).relationshipHalfLifeData
    ? ((data as Record<string, unknown>).relationshipHalfLifeData as unknown[])[0]
    : getAnalysisForSection(data, 'relationshipHalfLife');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Relationship Half-Life Analysis', getSectionColor('relationshipHalfLife') || PDF_DESIGN.colors.analysis);
  const hl = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 65, 3, 3, 'F');
  
  // Core metrics
  const currentTrust = hl?.currentTrustLevel ?? hl?.current_trust_level;
  if (currentTrust !== undefined) {
    ctx.renderScoreBar('Current Trust Level', (currentTrust as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  const halfLife = hl?.halfLifeDays ?? hl?.half_life_days;
  if (halfLife !== undefined) {
    ctx.renderKeyValue('Trust Half-Life', `${halfLife} days`);
  }
  
  const decayRate = hl?.decayRate ?? hl?.decay_rate;
  if (decayRate !== undefined) {
    ctx.renderScoreBar('Decay Rate', (decayRate as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  // Projections
  const proj30 = hl?.projectedTrustAt30Days ?? hl?.projected_trust_30d;
  const proj90 = hl?.projectedTrustAt90Days ?? hl?.projected_trust_90d;
  if (proj30 !== undefined || proj90 !== undefined) {
    ctx.yPos += 5;
    ctx.renderSubsection('Trust Projections');
    if (proj30 !== undefined) {
      ctx.renderKeyValue('30-Day Projection', `${Math.round((proj30 as number) * 100)}%`);
    }
    if (proj90 !== undefined) {
      ctx.renderKeyValue('90-Day Projection', `${Math.round((proj90 as number) * 100)}%`);
    }
  }
  
  // Critical threshold warning
  const criticalDate = hl?.criticalThresholdDate ?? hl?.critical_threshold_date;
  if (criticalDate) {
    ctx.yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 50, 50);
    doc.text(`⚠ Critical Threshold: ${new Date(criticalDate as string).toLocaleDateString()}`, ctx.margin + 5, ctx.yPos);
    doc.setTextColor(0, 0, 0);
    ctx.yPos += ctx.lineHeight;
  }
  
  // Reinforcement recommendations
  const reinforcement = hl?.reinforcementNeeded ?? hl?.reinforcement_needed;
  if (reinforcement && typeof reinforcement === 'object') {
    const r = reinforcement as Record<string, unknown>;
    ctx.yPos += 3;
    ctx.renderSubsection('Reinforcement Actions');
    ctx.renderKeyValue('Urgency', String(r.urgency ?? 'Unknown'));
    const actions = r.suggestedActions ?? r.suggested_actions;
    if (Array.isArray(actions)) {
      (actions as string[]).slice(0, 3).forEach(a => ctx.renderBullet(a, 5));
    }
  }
  
  ctx.yPos += 10;
};

// ============== AUTOMATED RED TEAM ASSESSMENT ==============

export const renderRedTeamAssessment: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const rawData = (data as Record<string, unknown>).automatedRedTeamData
    ? ((data as Record<string, unknown>).automatedRedTeamData as unknown[])[0]
    : getAnalysisForSection(data, 'redTeamAssessment');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Automated Red Team Assessment', getSectionColor('redTeamAssessment') || PDF_DESIGN.colors.warfare);
  const rt = extractResultSafe(rawData);
  
  ctx.checkPageBreak(80);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 75, 3, 3, 'F');
  
  // Overall vulnerability score
  const vulnScore = rt?.overallVulnerabilityScore ?? rt?.overall_vulnerability_score;
  if (vulnScore !== undefined) {
    ctx.renderScoreBar('Overall Vulnerability', vulnScore as number, 100, PDF_DESIGN.colors.danger);
  }
  
  // Attack vectors
  const vectors = rt?.attackVectors ?? rt?.attack_vectors;
  if (Array.isArray(vectors) && vectors.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Attack Vectors Identified');
    (vectors as Array<Record<string, unknown>>).slice(0, 5).forEach(v => {
      const vector = v.vector ?? v.name ?? 'Unknown';
      const exploit = v.exploitability ?? 'moderate';
      ctx.renderBullet(`${vector}: ${exploit} exploitability`, 5);
    });
  }
  
  // Simulated attack narratives
  const narratives = rt?.simulatedAttackNarratives ?? rt?.simulated_attack_narratives;
  if (Array.isArray(narratives) && narratives.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Simulated Attack Scenarios');
    (narratives as Array<Record<string, unknown>>).slice(0, 2).forEach(n => {
      const scenario = n.scenario ?? 'Unnamed scenario';
      const prob = (n.successProbability ?? n.success_probability ?? 0) as number;
      ctx.renderBullet(`${scenario} (${Math.round(prob * 100)}% success)`, 5);
    });
  }
  
  // Prioritized recommendations
  const recs = rt?.prioritizedRecommendations ?? rt?.prioritized_recommendations;
  if (Array.isArray(recs) && recs.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Priority Mitigations');
    (recs as string[]).slice(0, 4).forEach(r => ctx.renderBullet(r, 5));
  }
  
  ctx.yPos += 10;
};

// ============== MULTI-PARTY DECEPTION DETECTION ==============

export const renderMultiPartyDeception: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const rawData = (data as Record<string, unknown>).multiPartyDeceptionData
    ? ((data as Record<string, unknown>).multiPartyDeceptionData as unknown[])[0]
    : getAnalysisForSection(data, 'multiPartyDeception');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Multi-Party Deception Network', getSectionColor('multiPartyDeception') || PDF_DESIGN.colors.warfare);
  const mpd = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 65, 3, 3, 'F');
  
  // Collusion networks
  const networks = mpd?.collusionNetworks ?? mpd?.collusion_networks;
  if (Array.isArray(networks) && networks.length > 0) {
    ctx.renderSubsection(`Collusion Networks Detected: ${networks.length}`);
    (networks as Array<Record<string, unknown>>).slice(0, 3).forEach(n => {
      const participants = n.participantNames ?? n.participant_names ?? [];
      const collusionType = n.collusionType ?? n.collusion_type ?? 'Unknown';
      const strength = (n.evidenceStrength ?? n.evidence_strength ?? 0) as number;
      ctx.renderBullet(`${collusionType}: ${(participants as string[]).join(', ')} (${Math.round(strength * 100)}% confidence)`, 5);
    });
  } else {
    ctx.renderBullet('No collusion networks detected', 5);
  }
  
  // Isolated deceivers
  const isolated = mpd?.isolatedDeceiversCount ?? mpd?.isolated_deceivers_count;
  if (isolated !== undefined) {
    ctx.yPos += 3;
    ctx.renderKeyValue('Isolated Deceivers', String(isolated));
  }
  
  // Recommended interrogation order
  const interrogation = mpd?.recommendedInterrogationOrder ?? mpd?.recommended_interrogation_order;
  if (Array.isArray(interrogation) && interrogation.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Recommended Interrogation Order');
    (interrogation as string[]).slice(0, 5).forEach((name, idx) => {
      ctx.renderBullet(`${idx + 1}. ${name}`, 5);
    });
  }
  
  ctx.yPos += 10;
};

// ============== ZERO-DAY ANOMALY DETECTOR ==============

export const renderZeroDayAnomalies: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const rawData = (data as Record<string, unknown>).zeroDayAnomalyData
    ? ((data as Record<string, unknown>).zeroDayAnomalyData as unknown[])[0]
    : getAnalysisForSection(data, 'zeroDayAnomalies');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Zero-Day Anomaly Detection', getSectionColor('zeroDayAnomalies') || PDF_DESIGN.colors.analysis);
  const zda = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  doc.setFillColor(255, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 65, 3, 3, 'F');
  
  // Overall novelty level
  const noveltyLevel = zda?.overallNoveltyLevel ?? zda?.overall_novelty_level;
  if (noveltyLevel) {
    ctx.renderKeyValue('Overall Novelty Level', String(noveltyLevel).toUpperCase());
  }
  
  // False positive probability
  const fpProb = zda?.falsePositiveProbability ?? zda?.false_positive_probability;
  if (fpProb !== undefined) {
    ctx.renderScoreBar('False Positive Probability', (fpProb as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  // Zero-day anomalies list
  const anomalies = zda?.zeroDayAnomalies ?? zda?.zero_day_anomalies;
  if (Array.isArray(anomalies) && anomalies.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection(`Novel Anomalies Detected: ${anomalies.length}`);
    (anomalies as Array<Record<string, unknown>>).slice(0, 4).forEach(a => {
      const desc = a.description ?? 'Unknown anomaly';
      const novelty = (a.noveltyScore ?? a.novelty_score ?? 0) as number;
      const urgency = a.urgency ?? 'medium';
      ctx.renderBullet(`[${urgency}] ${desc} (${Math.round(novelty * 100)}% novel)`, 5);
    });
  } else {
    ctx.renderBullet('No zero-day anomalies detected - all patterns match known baselines', 5);
  }
  
  // Escalation required
  const escalation = zda?.escalationRequired ?? zda?.escalation_required;
  if (escalation === true) {
    ctx.yPos += 3;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 50, 50);
    doc.text('⚠ ESCALATION REQUIRED - Novel threat pattern detected', ctx.margin + 5, ctx.yPos);
    doc.setTextColor(0, 0, 0);
    ctx.yPos += ctx.lineHeight;
  }
  
  ctx.yPos += 10;
};

// ============== HYPERGAME THEORY ENGINE ==============

export const renderHypergameAnalysis: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const rawData = (data as Record<string, unknown>).hypergameTheoryData
    ? ((data as Record<string, unknown>).hypergameTheoryData as unknown[])[0]
    : getAnalysisForSection(data, 'hypergameAnalysis');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Hypergame Strategic Analysis', getSectionColor('hypergameAnalysis') || PDF_DESIGN.colors.intelligence);
  const hg = extractResultSafe(rawData);
  
  ctx.checkPageBreak(85);
  doc.setFillColor(245, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 80, 3, 3, 'F');
  
  // Hypergame analysis structure
  const analysis = hg?.hypergameAnalysis ?? hg?.hypergame_analysis;
  if (analysis && typeof analysis === 'object') {
    const a = analysis as Record<string, unknown>;
    
    // Our perception
    const ourPerception = a.ourPerception ?? a.our_perception;
    if (ourPerception && typeof ourPerception === 'object') {
      const op = ourPerception as Record<string, unknown>;
      ctx.renderSubsection('Our Perceived Game');
      ctx.renderKeyValue('Game Type', String(op.gameType ?? op.game_type ?? 'Unknown'));
      const strategies = op.ourStrategies ?? op.our_strategies;
      if (Array.isArray(strategies)) {
        ctx.renderBullet(`Strategies: ${(strategies as string[]).slice(0, 3).join(', ')}`, 5);
      }
    }
    
    // Their perception
    const theirPerception = a.theirLikelyPerception ?? a.their_likely_perception;
    if (theirPerception && typeof theirPerception === 'object') {
      const tp = theirPerception as Record<string, unknown>;
      ctx.yPos += 3;
      ctx.renderSubsection('Their Perceived Game');
      ctx.renderKeyValue('Game Type', String(tp.gameType ?? tp.game_type ?? 'Unknown'));
    }
    
    // Perception gap
    const gap = a.perceptionGap ?? a.perception_gap;
    if (gap && typeof gap === 'object') {
      const g = gap as Record<string, unknown>;
      ctx.yPos += 3;
      ctx.renderSubsection('Perception Gap Analysis');
      const exploitability = (g.exploitabilityScore ?? g.exploitability_score ?? 0) as number;
      ctx.renderScoreBar('Exploitability', exploitability * 100, 100, PDF_DESIGN.colors.success);
      
      const typeMismatch = g.gameTypeMismatch ?? g.game_type_mismatch;
      if (typeMismatch) {
        ctx.renderBullet('Game type mismatch detected - strategic advantage available', 5);
      }
    }
  }
  
  // Strategic recommendations
  const recs = hg?.strategicRecommendations ?? hg?.strategic_recommendations;
  if (Array.isArray(recs) && recs.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Strategic Recommendations');
    (recs as Array<Record<string, unknown>>).slice(0, 3).forEach(r => {
      const strategy = r.strategy ?? 'Unknown';
      const exploits = r.exploitsGap ?? r.exploits_gap ? '✓' : '';
      const risk = r.riskLevel ?? r.risk_level ?? 'medium';
      ctx.renderBullet(`${strategy} [${risk} risk] ${exploits}`, 5);
    });
  }
  
  // Information advantages/vulnerabilities
  const advantages = hg?.informationAdvantages ?? hg?.information_advantages;
  if (Array.isArray(advantages) && advantages.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Information Advantages');
    (advantages as string[]).slice(0, 3).forEach(a => ctx.renderBullet(a, 5));
  }
  
  const vulnerabilities = hg?.informationVulnerabilities ?? hg?.information_vulnerabilities;
  if (Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Information Vulnerabilities');
    (vulnerabilities as string[]).slice(0, 3).forEach(v => ctx.renderBullet(v, 5));
  }
  
  ctx.yPos += 10;
};

// ============== EXPORT REGISTRY ==============

export const advancedIntelligenceSectionRenderers = {
  relationshipHalfLife: renderRelationshipHalfLife,
  redTeamAssessment: renderRedTeamAssessment,
  multiPartyDeception: renderMultiPartyDeception,
  zeroDayAnomalies: renderZeroDayAnomalies,
  hypergameAnalysis: renderHypergameAnalysis,
};
