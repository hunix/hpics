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

// ============== v7.0 EXTREME INTELLIGENCE RENDERERS ==============

// Subvocalization Detection (US12142281B2)
export const renderSubvocalizationDetection: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).subvocalizationData
    ? ((data as Record<string, unknown>).subvocalizationData as unknown[])[0]
    : getAnalysisForSection(data, 'subvocalizationDetection');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Subvocalization Detection', getSectionColor('subvocalizationDetection') || PDF_DESIGN.colors.analysis);
  const sv = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const detected = sv?.subvocalizationsDetected ?? sv?.detections ?? [];
  if (Array.isArray(detected) && detected.length > 0) {
    ctx.renderSubsection(`Pre-Speech Patterns Detected: ${detected.length}`);
    (detected as Array<Record<string, unknown>>).slice(0, 4).forEach(d => {
      const content = d.content ?? d.text ?? 'Pattern';
      const confidence = (d.confidence ?? 0) as number;
      ctx.renderBullet(`${content} (${Math.round(confidence * 100)}% confidence)`, 5);
    });
  }
  
  const suppressed = sv?.suppressedThoughts ?? sv?.suppressed_thoughts;
  if (Array.isArray(suppressed) && suppressed.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Suppressed Thought Indicators');
    (suppressed as string[]).slice(0, 3).forEach(s => ctx.renderBullet(s, 5));
  }
  
  ctx.yPos += 10;
};

// Audio Burst Mental State (US20240071412A1)
export const renderAudioBurstAnalysis: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).audioBurstData
    ? ((data as Record<string, unknown>).audioBurstData as unknown[])[0]
    : getAnalysisForSection(data, 'audioBurstAnalysis');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Audio Burst Mental State Analysis', getSectionColor('audioBurstAnalysis') || PDF_DESIGN.colors.analysis);
  const ab = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const mentalState = ab?.derivedMentalState ?? ab?.mental_state;
  if (mentalState) {
    ctx.renderKeyValue('Current Mental State', String(mentalState).toUpperCase());
  }
  
  const stressLevel = ab?.stressLevel ?? ab?.stress_level;
  if (stressLevel !== undefined) {
    ctx.renderScoreBar('Stress Level', (stressLevel as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  const cognitiveLoad = ab?.cognitiveLoadScore ?? ab?.cognitive_load;
  if (cognitiveLoad !== undefined) {
    ctx.renderScoreBar('Cognitive Load', (cognitiveLoad as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  ctx.yPos += 10;
};

// IIO Attribution Matrix (NATO/EU)
export const renderIioAttribution: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).iioAttributionData
    ? ((data as Record<string, unknown>).iioAttributionData as unknown[])[0]
    : getAnalysisForSection(data, 'iioAttribution');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('IIO Attribution Matrix', getSectionColor('iioAttribution') || PDF_DESIGN.colors.warfare);
  const iio = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const attributions = iio?.attributions ?? iio?.attribution_matrix ?? [];
  if (Array.isArray(attributions) && attributions.length > 0) {
    ctx.renderSubsection('Attribution Analysis');
    (attributions as Array<Record<string, unknown>>).slice(0, 4).forEach(a => {
      const actor = a.actor ?? a.threat_actor ?? 'Unknown';
      const confidence = (a.confidence ?? 0) as number;
      const indicators = a.indicators ?? [];
      ctx.renderBullet(`${actor}: ${Math.round(confidence * 100)}% confidence (${(indicators as string[]).length} indicators)`, 5);
    });
  }
  
  const primaryActor = iio?.primaryActor ?? iio?.primary_attribution;
  if (primaryActor) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Primary Attribution', String(primaryActor));
  }
  
  ctx.yPos += 10;
};

// Reflexive Control Detection (CIA)
export const renderReflexiveControl: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).reflexiveControlData
    ? ((data as Record<string, unknown>).reflexiveControlData as unknown[])[0]
    : getAnalysisForSection(data, 'reflexiveControl');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Reflexive Control Detection', getSectionColor('reflexiveControl') || PDF_DESIGN.colors.warfare);
  const rc = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const techniques = rc?.techniquesDetected ?? rc?.techniques ?? [];
  if (Array.isArray(techniques) && techniques.length > 0) {
    ctx.renderSubsection('Detected Techniques');
    (techniques as Array<Record<string, unknown>>).slice(0, 5).forEach(t => {
      const name = t.technique ?? t.name ?? 'Unknown';
      const severity = t.severity ?? 'medium';
      ctx.renderBullet(`${name} [${severity}]`, 5);
    });
  }
  
  const susceptibility = rc?.reflexiveControlSusceptibility ?? rc?.susceptibility;
  if (susceptibility !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Susceptibility', (susceptibility as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  ctx.yPos += 10;
};

// Cognitive Effect Operations (GCHQ)
export const renderCognitiveEffect: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).cognitiveEffectData
    ? ((data as Record<string, unknown>).cognitiveEffectData as unknown[])[0]
    : getAnalysisForSection(data, 'cognitiveEffect');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cognitive Effect Operations', getSectionColor('cognitiveEffect') || PDF_DESIGN.colors.warfare);
  const ce = extractResultSafe(rawData);
  
  ctx.checkPageBreak(80);
  
  // NATO House Model levels
  const biological = ce?.biologicalEffects ?? ce?.biological;
  const psychological = ce?.psychologicalEffects ?? ce?.psychological;
  const social = ce?.socialEffects ?? ce?.social;
  
  if (biological !== undefined || psychological !== undefined || social !== undefined) {
    ctx.renderSubsection('NATO House Model');
    if (biological !== undefined) ctx.renderScoreBar('Biological', (biological as number) * 100, 100, PDF_DESIGN.colors.danger);
    if (psychological !== undefined) ctx.renderScoreBar('Psychological', (psychological as number) * 100, 100, PDF_DESIGN.colors.warning);
    if (social !== undefined) ctx.renderScoreBar('Social', (social as number) * 100, 100, PDF_DESIGN.colors.info);
  }
  
  const narratives = ce?.effectiveNarratives ?? ce?.narratives ?? [];
  if (Array.isArray(narratives) && narratives.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Effective Narratives');
    (narratives as string[]).slice(0, 3).forEach(n => ctx.renderBullet(n, 5));
  }
  
  ctx.yPos += 10;
};

// Adversary Theory of Mind (DARPA Kallisti)
export const renderTheoryOfMind: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).theoryOfMindData
    ? ((data as Record<string, unknown>).theoryOfMindData as unknown[])[0]
    : getAnalysisForSection(data, 'theoryOfMind');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Adversary Theory of Mind', getSectionColor('theoryOfMind') || PDF_DESIGN.colors.intelligence);
  const tom = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const beliefState = tom?.beliefState ?? tom?.belief_state;
  if (beliefState && typeof beliefState === 'object') {
    ctx.renderSubsection('Modeled Belief State');
    const bs = beliefState as Record<string, unknown>;
    Object.entries(bs).slice(0, 4).forEach(([key, val]) => {
      if (typeof val === 'number') {
        ctx.renderScoreBar(key.replace(/_/g, ' '), val * 100, 100, PDF_DESIGN.colors.info);
      }
    });
  }
  
  const basisVectors = tom?.basisVectors ?? tom?.basis_vectors ?? [];
  if (Array.isArray(basisVectors) && basisVectors.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Basis Vectors');
    (basisVectors as Array<Record<string, unknown>>).slice(0, 3).forEach(v => {
      const name = v.dimension ?? v.name ?? 'Vector';
      const value = (v.value ?? 0) as number;
      ctx.renderBullet(`${name}: ${Math.round(value * 100)}%`, 5);
    });
  }
  
  ctx.yPos += 10;
};

// Collective Behavior Prediction (DARPA MAGICS)
export const renderCollectiveBehavior: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).collectiveBehaviorData
    ? ((data as Record<string, unknown>).collectiveBehaviorData as unknown[])[0]
    : getAnalysisForSection(data, 'collectiveBehavior');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Collective Behavior Prediction', getSectionColor('collectiveBehavior') || PDF_DESIGN.colors.analysis);
  const cb = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const predictions = cb?.predictions ?? cb?.collective_predictions ?? [];
  if (Array.isArray(predictions) && predictions.length > 0) {
    ctx.renderSubsection('Predicted Group Behaviors');
    (predictions as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const behavior = p.behavior ?? p.prediction ?? 'Unknown';
      const probability = (p.probability ?? 0) as number;
      ctx.renderBullet(`${behavior} (${Math.round(probability * 100)}% probability)`, 5);
    });
  }
  
  const cascadeRisk = cb?.cascadeRisk ?? cb?.cascade_risk;
  if (cascadeRisk !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Cascade Risk', (cascadeRisk as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  ctx.yPos += 10;
};

// Stylometric Authorship Analysis
export const renderStylometricAnalysis: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).stylometricData
    ? ((data as Record<string, unknown>).stylometricData as unknown[])[0]
    : getAnalysisForSection(data, 'stylometricAnalysis');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Stylometric Authorship Analysis', getSectionColor('stylometricAnalysis') || PDF_DESIGN.colors.intelligence);
  const sa = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const fingerprint = sa?.stylometricFingerprint ?? sa?.fingerprint;
  if (fingerprint && typeof fingerprint === 'object') {
    ctx.renderSubsection('Writing Fingerprint');
    const fp = fingerprint as Record<string, unknown>;
    Object.entries(fp).slice(0, 5).forEach(([key, val]) => {
      if (typeof val === 'number') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), `${Math.round((val as number) * 100)}%`);
      } else if (typeof val === 'string') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), val);
      }
    });
  }
  
  const matchedAuthors = sa?.potentialAuthors ?? sa?.matched_authors ?? [];
  if (Array.isArray(matchedAuthors) && matchedAuthors.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Potential Author Matches');
    (matchedAuthors as Array<Record<string, unknown>>).slice(0, 3).forEach(m => {
      const name = m.name ?? m.author ?? 'Unknown';
      const similarity = (m.similarity ?? m.match ?? 0) as number;
      ctx.renderBullet(`${name}: ${Math.round(similarity * 100)}% match`, 5);
    });
  }
  
  ctx.yPos += 10;
};

// Dark2Clear Identity Bridge
export const renderDark2Clear: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).dark2ClearData
    ? ((data as Record<string, unknown>).dark2ClearData as unknown[])[0]
    : getAnalysisForSection(data, 'dark2Clear');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Dark2Clear Identity Bridge', getSectionColor('dark2Clear') || PDF_DESIGN.colors.analysis);
  const d2c = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const identityLinks = d2c?.identityLinks ?? d2c?.links ?? [];
  if (Array.isArray(identityLinks) && identityLinks.length > 0) {
    ctx.renderSubsection(`Identity Correlations: ${identityLinks.length}`);
    (identityLinks as Array<Record<string, unknown>>).slice(0, 4).forEach(l => {
      const surface = l.surfaceIdentity ?? l.surface ?? 'Unknown';
      const dark = l.darkIdentity ?? l.dark ?? 'Unknown';
      const confidence = (l.confidence ?? 0) as number;
      ctx.renderBullet(`${surface} ↔ ${dark} (${Math.round(confidence * 100)}% confidence)`, 5);
    });
  } else {
    ctx.renderBullet('No cross-domain identity correlations detected', 5);
  }
  
  ctx.yPos += 10;
};

// Gated Biological Fusion (GBV-Net)
export const renderGatedBioFusion: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).gatedBioFusionData
    ? ((data as Record<string, unknown>).gatedBioFusionData as unknown[])[0]
    : getAnalysisForSection(data, 'gatedBioFusion');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Gated Biological Fusion', getSectionColor('gatedBioFusion') || PDF_DESIGN.colors.analysis);
  const gbf = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const modalityWeights = gbf?.modalityWeights ?? gbf?.modality_weights;
  if (modalityWeights && typeof modalityWeights === 'object') {
    ctx.renderSubsection('Modality Fusion Weights');
    Object.entries(modalityWeights as Record<string, number>).slice(0, 5).forEach(([mod, weight]) => {
      ctx.renderScoreBar(mod.replace(/_/g, ' '), weight * 100, 100, PDF_DESIGN.colors.info);
    });
  }
  
  const fusedAssessment = gbf?.fusedAssessment ?? gbf?.fused_result;
  if (fusedAssessment) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Fused Assessment', String(fusedAssessment));
  }
  
  ctx.yPos += 10;
};

// TAS-Com Community Detection (Leiden Algorithm)
export const renderTasComCommunity: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).tasComCommunityData
    ? ((data as Record<string, unknown>).tasComCommunityData as unknown[])[0]
    : getAnalysisForSection(data, 'tasComCommunity');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('TAS-Com Community Detection', getSectionColor('tasComCommunity') || PDF_DESIGN.colors.analysis);
  const tc = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const communities = tc?.communities ?? tc?.detected_communities ?? [];
  if (Array.isArray(communities) && communities.length > 0) {
    ctx.renderSubsection(`Communities Detected: ${communities.length}`);
    (communities as Array<Record<string, unknown>>).slice(0, 4).forEach(c => {
      const name = c.name ?? c.community_id ?? 'Community';
      const members = c.memberCount ?? c.members ?? 0;
      const cohesion = (c.cohesion ?? 0) as number;
      ctx.renderBullet(`${name}: ${members} members (${Math.round(cohesion * 100)}% cohesion)`, 5);
    });
  }
  
  const targetRole = tc?.targetRole ?? tc?.target_position;
  if (targetRole) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Target Network Role', String(targetRole));
  }
  
  ctx.yPos += 10;
};

// Biometric Retention Score (Five Eyes Migration5)
export const renderBiometricRetention: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).biometricRetentionData
    ? ((data as Record<string, unknown>).biometricRetentionData as unknown[])[0]
    : getAnalysisForSection(data, 'biometricRetention');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Biometric Retention Score', getSectionColor('biometricRetention') || PDF_DESIGN.colors.analysis);
  const br = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const retentionScore = br?.overallRetentionScore ?? br?.retention_score;
  if (retentionScore !== undefined) {
    ctx.renderScoreBar('Overall Retention', (retentionScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  const modalities = br?.modalityScores ?? br?.modality_retention;
  if (modalities && typeof modalities === 'object') {
    ctx.yPos += 5;
    ctx.renderSubsection('Modality Retention');
    Object.entries(modalities as Record<string, number>).slice(0, 5).forEach(([mod, score]) => {
      ctx.renderScoreBar(mod.replace(/_/g, ' '), score * 100, 100, PDF_DESIGN.colors.info);
    });
  }
  
  const crossCorrelations = br?.crossCorrelations ?? br?.cross_correlations ?? [];
  if (Array.isArray(crossCorrelations) && crossCorrelations.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Cross-Correlations');
    (crossCorrelations as string[]).slice(0, 3).forEach(c => ctx.renderBullet(c, 5));
  }
  
  ctx.yPos += 10;
};

// ============== EXPORT REGISTRY ==============

export const advancedIntelligenceSectionRenderers = {
  // v6.0
  relationshipHalfLife: renderRelationshipHalfLife,
  redTeamAssessment: renderRedTeamAssessment,
  multiPartyDeception: renderMultiPartyDeception,
  zeroDayAnomalies: renderZeroDayAnomalies,
  hypergameAnalysis: renderHypergameAnalysis,
  // v7.0
  subvocalizationDetection: renderSubvocalizationDetection,
  audioBurstAnalysis: renderAudioBurstAnalysis,
  iioAttribution: renderIioAttribution,
  reflexiveControl: renderReflexiveControl,
  cognitiveEffect: renderCognitiveEffect,
  theoryOfMind: renderTheoryOfMind,
  collectiveBehavior: renderCollectiveBehavior,
  stylometricAnalysis: renderStylometricAnalysis,
  dark2Clear: renderDark2Clear,
  gatedBioFusion: renderGatedBioFusion,
  tasComCommunity: renderTasComCommunity,
  biometricRetention: renderBiometricRetention,
};
