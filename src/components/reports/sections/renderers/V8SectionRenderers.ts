/**
 * v8.0 Masterpiece Intelligence Section Renderers
 * 33 new renderers for v8.0 intelligence engines:
 * - Counter-Intelligence (8 sections)
 * - Psychological Warfare (10 sections)
 * - Biometric & Network (8 sections)
 * - Doctrine & Advanced (7 sections)
 */

import type { SectionRenderer } from './types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection } from '../../utils/sectionDataCheck';
import { getSectionColor, extractResultSafe } from '../../utils/pdfDesignSystem';

// ============== COUNTER-INTELLIGENCE SECTIONS ==============

export const renderDracoDeception: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).dracoDeceptionData
    ? ((data as Record<string, unknown>).dracoDeceptionData as unknown[])[0]
    : getAnalysisForSection(data, 'dracoDeception');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Draco Deception Orchestration', getSectionColor('dracoDeception') || PDF_DESIGN.colors.warfare);
  const dd = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const honeypots = dd?.deployedHoneypots ?? dd?.honeypots ?? [];
  if (Array.isArray(honeypots) && honeypots.length > 0) {
    ctx.renderSubsection(`Active Honeypots: ${honeypots.length}`);
    (honeypots as Array<Record<string, unknown>>).slice(0, 4).forEach(h => {
      const name = h.name ?? h.type ?? 'Honeypot';
      const status = h.status ?? 'active';
      const triggers = h.triggerCount ?? h.triggers ?? 0;
      ctx.renderBullet(`${name}: ${status} (${triggers} triggers)`, 5);
    });
  }
  
  const canaryTokens = dd?.canaryTokens ?? dd?.canary_tokens ?? [];
  if (Array.isArray(canaryTokens) && canaryTokens.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection(`Canary Tokens: ${canaryTokens.length}`);
    (canaryTokens as Array<Record<string, unknown>>).slice(0, 3).forEach(c => {
      const type = c.tokenType ?? c.type ?? 'Token';
      const triggered = c.triggered ? '⚠ TRIGGERED' : 'Active';
      ctx.renderBullet(`${type}: ${triggered}`, 5);
    });
  }
  
  ctx.yPos += 10;
};

export const renderSentientIntent: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).sentientIntentData
    ? ((data as Record<string, unknown>).sentientIntentData as unknown[])[0]
    : getAnalysisForSection(data, 'sentientIntent');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Sentient Intent Analysis', getSectionColor('sentientIntent') || PDF_DESIGN.colors.intelligence);
  const si = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const primaryIntent = si?.primaryIntent ?? si?.primary_intent;
  if (primaryIntent) {
    ctx.renderKeyValue('Primary Intent', String(primaryIntent));
  }
  
  const intentConfidence = si?.intentConfidence ?? si?.confidence;
  if (intentConfidence !== undefined) {
    ctx.renderScoreBar('Intent Confidence', (intentConfidence as number) * 100, 100, PDF_DESIGN.colors.info);
  }
  
  const provenanceGraph = si?.provenanceGraph ?? si?.provenance ?? [];
  if (Array.isArray(provenanceGraph) && provenanceGraph.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Provenance Chain');
    (provenanceGraph as string[]).slice(0, 4).forEach(p => ctx.renderBullet(p, 5));
  }
  
  ctx.yPos += 10;
};

export const renderInsiderThreat: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).insiderThreatData
    ? ((data as Record<string, unknown>).insiderThreatData as unknown[])[0]
    : getAnalysisForSection(data, 'insiderThreat');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Insider Threat Matrix', getSectionColor('insiderThreat') || PDF_DESIGN.colors.warfare);
  const it = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const riskScore = it?.overallRiskScore ?? it?.risk_score;
  if (riskScore !== undefined) {
    ctx.renderScoreBar('Insider Threat Risk', (riskScore as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  const indicators = it?.behavioralIndicators ?? it?.indicators ?? [];
  if (Array.isArray(indicators) && indicators.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Behavioral Indicators');
    (indicators as Array<Record<string, unknown>>).slice(0, 5).forEach(i => {
      const indicator = i.name ?? i.indicator ?? 'Unknown';
      const severity = i.severity ?? 'medium';
      ctx.renderBullet(`${indicator} [${severity}]`, 5);
    });
  }
  
  const attackPhase = it?.currentAttackPhase ?? it?.attack_phase;
  if (attackPhase) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Current Attack Phase', String(attackPhase));
  }
  
  ctx.yPos += 10;
};

export const renderBayesianIntention: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).bayesianIntentionData
    ? ((data as Record<string, unknown>).bayesianIntentionData as unknown[])[0]
    : getAnalysisForSection(data, 'bayesianIntention');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Bayesian Intention Prediction', getSectionColor('bayesianIntention') || PDF_DESIGN.colors.intelligence);
  const bi = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const posteriorBeliefs = bi?.posteriorBeliefs ?? bi?.posterior ?? [];
  if (Array.isArray(posteriorBeliefs) && posteriorBeliefs.length > 0) {
    ctx.renderSubsection('Posterior Belief Distribution');
    (posteriorBeliefs as Array<Record<string, unknown>>).slice(0, 4).forEach(b => {
      const intention = b.intention ?? b.hypothesis ?? 'Unknown';
      const probability = (b.probability ?? 0) as number;
      ctx.renderBullet(`${intention}: ${Math.round(probability * 100)}%`, 5);
    });
  }
  
  const dagConfidence = bi?.dagConfidence ?? bi?.dag_confidence;
  if (dagConfidence !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('DAG Model Confidence', (dagConfidence as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  ctx.yPos += 10;
};

export const renderRedTeamSimulation: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).redTeamSimulationData
    ? ((data as Record<string, unknown>).redTeamSimulationData as unknown[])[0]
    : getAnalysisForSection(data, 'redTeamSimulation');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Red Team Adversary Simulation', getSectionColor('redTeamSimulation') || PDF_DESIGN.colors.warfare);
  const rt = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const scenarios = rt?.simulatedScenarios ?? rt?.scenarios ?? [];
  if (Array.isArray(scenarios) && scenarios.length > 0) {
    ctx.renderSubsection('Monte Carlo Scenarios');
    (scenarios as Array<Record<string, unknown>>).slice(0, 4).forEach(s => {
      const name = s.name ?? s.scenario ?? 'Scenario';
      const successRate = (s.successRate ?? s.success_rate ?? 0) as number;
      ctx.renderBullet(`${name}: ${Math.round(successRate * 100)}% success`, 5);
    });
  }
  
  const optimalStrategy = rt?.optimalCounterStrategy ?? rt?.optimal_strategy;
  if (optimalStrategy) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Optimal Counter-Strategy', String(optimalStrategy));
  }
  
  ctx.yPos += 10;
};

export const renderSemaforForgery: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).semaforForgeryData
    ? ((data as Record<string, unknown>).semaforForgeryData as unknown[])[0]
    : getAnalysisForSection(data, 'semaforForgery');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('SEMAFOR Forgery Detection', getSectionColor('semaforForgery') || PDF_DESIGN.colors.analysis);
  const sf = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const authenticityScore = sf?.authenticityScore ?? sf?.authenticity;
  if (authenticityScore !== undefined) {
    ctx.renderScoreBar('Authenticity Score', (authenticityScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  const detectedManipulations = sf?.manipulationsDetected ?? sf?.manipulations ?? [];
  if (Array.isArray(detectedManipulations) && detectedManipulations.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Detected Manipulations');
    (detectedManipulations as Array<Record<string, unknown>>).slice(0, 4).forEach(m => {
      const type = m.type ?? m.manipulation ?? 'Unknown';
      const confidence = (m.confidence ?? 0) as number;
      ctx.renderBullet(`${type}: ${Math.round(confidence * 100)}% confidence`, 5);
    });
  } else {
    ctx.renderBullet('No media forgeries detected', 5);
  }
  
  ctx.yPos += 10;
};

export const renderEpistemicVulnerability: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).epistemicVulnerabilityData
    ? ((data as Record<string, unknown>).epistemicVulnerabilityData as unknown[])[0]
    : getAnalysisForSection(data, 'epistemicVulnerability');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Epistemic Vulnerability Scan', getSectionColor('epistemicVulnerability') || PDF_DESIGN.colors.analysis);
  const ev = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const vulnerabilities = ev?.vulnerabilities ?? ev?.epistemic_gaps ?? [];
  if (Array.isArray(vulnerabilities) && vulnerabilities.length > 0) {
    ctx.renderSubsection('Information Poisoning Vectors');
    (vulnerabilities as Array<Record<string, unknown>>).slice(0, 4).forEach(v => {
      const vector = v.vector ?? v.name ?? 'Unknown';
      const severity = v.severity ?? 'medium';
      ctx.renderBullet(`${vector} [${severity}]`, 5);
    });
  }
  
  const resilienceScore = ev?.epistemicResilience ?? ev?.resilience;
  if (resilienceScore !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Epistemic Resilience', (resilienceScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  ctx.yPos += 10;
};

export const renderCognitiveIW: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).cognitiveIWData
    ? ((data as Record<string, unknown>).cognitiveIWData as unknown[])[0]
    : getAnalysisForSection(data, 'cognitiveIW');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cognitive Info Warfare Detection', getSectionColor('cognitiveIW') || PDF_DESIGN.colors.warfare);
  const ciw = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  // NATO House Model
  const houseModel = ciw?.natoHouseModel ?? ciw?.house_model;
  if (houseModel && typeof houseModel === 'object') {
    ctx.renderSubsection('NATO House Model Assessment');
    const hm = houseModel as Record<string, unknown>;
    Object.entries(hm).slice(0, 4).forEach(([level, score]) => {
      if (typeof score === 'number') {
        ctx.renderScoreBar(level.replace(/_/g, ' '), score * 100, 100, PDF_DESIGN.colors.warning);
      }
    });
  }
  
  const attributedCampaigns = ciw?.attributedCampaigns ?? ciw?.campaigns ?? [];
  if (Array.isArray(attributedCampaigns) && attributedCampaigns.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Attributed Influence Campaigns');
    (attributedCampaigns as Array<Record<string, unknown>>).slice(0, 3).forEach(c => {
      const name = c.campaignName ?? c.name ?? 'Unknown';
      const actor = c.attributedActor ?? c.actor ?? 'Unknown';
      ctx.renderBullet(`${name} → ${actor}`, 5);
    });
  }
  
  ctx.yPos += 10;
};

// ============== PSYCHOLOGICAL WARFARE SECTIONS ==============

export const renderPsychoagentCascade: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).psychoagentCascadeData
    ? ((data as Record<string, unknown>).psychoagentCascadeData as unknown[])[0]
    : getAnalysisForSection(data, 'psychoagentCascade');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Psychoagent Cascade Prediction', getSectionColor('psychoagentCascade') || PDF_DESIGN.colors.warfare);
  const pc = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const ppdtsScore = pc?.ppdtsScore ?? pc?.ppdts_score;
  if (ppdtsScore !== undefined) {
    ctx.renderScoreBar('PPDTS Panic Score', (ppdtsScore as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  const cascadeProbability = pc?.cascadeProbability ?? pc?.cascade_probability;
  if (cascadeProbability !== undefined) {
    ctx.renderScoreBar('Cascade Probability', (cascadeProbability as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  const triggerEvents = pc?.predictedTriggers ?? pc?.triggers ?? [];
  if (Array.isArray(triggerEvents) && triggerEvents.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Predicted Trigger Events');
    (triggerEvents as string[]).slice(0, 4).forEach(t => ctx.renderBullet(t, 5));
  }
  
  ctx.yPos += 10;
};

export const renderAffectiveManipulation: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).affectiveManipulationData
    ? ((data as Record<string, unknown>).affectiveManipulationData as unknown[])[0]
    : getAnalysisForSection(data, 'affectiveManipulation');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Affective Manipulation Detection', getSectionColor('affectiveManipulation') || PDF_DESIGN.colors.intelligence);
  const am = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const darkPatterns = am?.detectedDarkPatterns ?? am?.dark_patterns ?? [];
  if (Array.isArray(darkPatterns) && darkPatterns.length > 0) {
    ctx.renderSubsection('Detected Dark Patterns');
    (darkPatterns as Array<Record<string, unknown>>).slice(0, 5).forEach(p => {
      const pattern = p.pattern ?? p.name ?? 'Unknown';
      const frequency = p.frequency ?? 'occasional';
      ctx.renderBullet(`${pattern} (${frequency})`, 5);
    });
  } else {
    ctx.renderBullet('No affective manipulation patterns detected', 5);
  }
  
  const susceptibilityScore = am?.manipulationSusceptibility ?? am?.susceptibility;
  if (susceptibilityScore !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Manipulation Susceptibility', (susceptibilityScore as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  ctx.yPos += 10;
};

export const renderHyperpersonalization: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).hyperpersonalizationData
    ? ((data as Record<string, unknown>).hyperpersonalizationData as unknown[])[0]
    : getAnalysisForSection(data, 'hyperpersonalization');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Hyperpersonalization Targeting', getSectionColor('hyperpersonalization') || PDF_DESIGN.colors.intelligence);
  const hp = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const segmentProfile = hp?.segmentOfOneProfile ?? hp?.segment_profile;
  if (segmentProfile && typeof segmentProfile === 'object') {
    ctx.renderSubsection('Segment-of-One Profile');
    Object.entries(segmentProfile as Record<string, unknown>).slice(0, 5).forEach(([key, val]) => {
      if (typeof val === 'string' || typeof val === 'number') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), String(val));
      }
    });
  }
  
  const vulnerabilityMap = hp?.vulnerabilityMap ?? hp?.vulnerability_vectors ?? [];
  if (Array.isArray(vulnerabilityMap) && vulnerabilityMap.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Targeting Vulnerability Vectors');
    (vulnerabilityMap as string[]).slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  
  ctx.yPos += 10;
};

export const renderComputationalPersuasion: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).computationalPersuasionData
    ? ((data as Record<string, unknown>).computationalPersuasionData as unknown[])[0]
    : getAnalysisForSection(data, 'computationalPersuasion');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Computational Persuasion Engine', getSectionColor('computationalPersuasion') || PDF_DESIGN.colors.intelligence);
  const cp = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const cialdiniProfile = cp?.cialdiniProfile ?? cp?.cialdini_scores;
  if (cialdiniProfile && typeof cialdiniProfile === 'object') {
    ctx.renderSubsection('Cialdini Principle Susceptibility');
    Object.entries(cialdiniProfile as Record<string, number>).slice(0, 7).forEach(([principle, score]) => {
      ctx.renderScoreBar(principle.replace(/_/g, ' '), score * 100, 100, PDF_DESIGN.colors.info);
    });
  }
  
  const optimalStrategies = cp?.optimalStrategies ?? cp?.strategies ?? [];
  if (Array.isArray(optimalStrategies) && optimalStrategies.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Optimal Persuasion Strategies');
    (optimalStrategies as string[]).slice(0, 3).forEach(s => ctx.renderBullet(s, 5));
  }
  
  ctx.yPos += 10;
};

export const renderSyntheticMemory: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).syntheticMemoryData
    ? ((data as Record<string, unknown>).syntheticMemoryData as unknown[])[0]
    : getAnalysisForSection(data, 'syntheticMemory');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Synthetic Memory Generation', getSectionColor('syntheticMemory') || PDF_DESIGN.colors.intelligence);
  const sm = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const implants = sm?.memoryImplants ?? sm?.generated_memories ?? [];
  if (Array.isArray(implants) && implants.length > 0) {
    ctx.renderSubsection('Therapeutic Memory Reframes');
    (implants as Array<Record<string, unknown>>).slice(0, 3).forEach(i => {
      const scenario = i.scenario ?? i.memory ?? 'Memory';
      const purpose = i.purpose ?? 'therapeutic';
      ctx.renderBullet(`${scenario} (${purpose})`, 5);
    });
  }
  
  const ethicalGuardrails = sm?.ethicalGuardrails ?? sm?.guardrails ?? [];
  if (Array.isArray(ethicalGuardrails) && ethicalGuardrails.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Active Ethical Guardrails');
    (ethicalGuardrails as string[]).slice(0, 3).forEach(g => ctx.renderBullet(g, 5));
  }
  
  ctx.yPos += 10;
};

export const renderPreMemBelief: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).prememBeliefData
    ? ((data as Record<string, unknown>).prememBeliefData as unknown[])[0]
    : getAnalysisForSection(data, 'prememBelief');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('PreMem Belief Modification', getSectionColor('prememBelief') || PDF_DESIGN.colors.intelligence);
  const pb = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const strategies = pb?.modificationStrategies ?? pb?.strategies ?? [];
  if (Array.isArray(strategies) && strategies.length > 0) {
    ctx.renderSubsection('Belief Modification Strategies');
    (strategies as Array<Record<string, unknown>>).slice(0, 4).forEach(s => {
      const type = s.type ?? s.strategy ?? 'Unknown';
      const effectiveness = (s.effectiveness ?? 0) as number;
      ctx.renderBullet(`${type}: ${Math.round(effectiveness * 100)}% effective`, 5);
    });
  }
  
  const targetBeliefs = pb?.targetBeliefs ?? pb?.target_beliefs ?? [];
  if (Array.isArray(targetBeliefs) && targetBeliefs.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Modifiable Beliefs');
    (targetBeliefs as string[]).slice(0, 3).forEach(b => ctx.renderBullet(b, 5));
  }
  
  ctx.yPos += 10;
};

export const renderLinguisticStress: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).linguisticStressData
    ? ((data as Record<string, unknown>).linguisticStressData as unknown[])[0]
    : getAnalysisForSection(data, 'linguisticStress');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Linguistic Stress Detection', getSectionColor('linguisticStress') || PDF_DESIGN.colors.analysis);
  const ls = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const stressLevel = ls?.overallStressLevel ?? ls?.stress_level;
  if (stressLevel !== undefined) {
    ctx.renderScoreBar('Overall Linguistic Stress', (stressLevel as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  const pivotDetections = ls?.strategicPivots ?? ls?.pivots ?? [];
  if (Array.isArray(pivotDetections) && pivotDetections.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Strategic Pivot Detections');
    (pivotDetections as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const timestamp = p.timestamp ?? p.time ?? 'Unknown';
      const type = p.pivotType ?? p.type ?? 'Unknown';
      ctx.renderBullet(`${timestamp}: ${type}`, 5);
    });
  }
  
  ctx.yPos += 10;
};

export const renderMemoryAnchor: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).memoryAnchorData
    ? ((data as Record<string, unknown>).memoryAnchorData as unknown[])[0]
    : getAnalysisForSection(data, 'memoryAnchor');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Memory Anchor Generation', getSectionColor('memoryAnchor') || PDF_DESIGN.colors.intelligence);
  const ma = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const palaceScenes = ma?.memoryPalaceScenes ?? ma?.palace_scenes ?? [];
  if (Array.isArray(palaceScenes) && palaceScenes.length > 0) {
    ctx.renderSubsection('Von Restorff Memory Palace Scenes');
    (palaceScenes as Array<Record<string, unknown>>).slice(0, 4).forEach(s => {
      const location = s.location ?? s.room ?? 'Scene';
      const anchor = s.anchor ?? s.content ?? 'Anchor';
      ctx.renderBullet(`${location}: ${anchor}`, 5);
    });
  }
  
  const retentionScore = ma?.predictedRetention ?? ma?.retention;
  if (retentionScore !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Predicted Retention', (retentionScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  ctx.yPos += 10;
};

export const renderEmotionalContagion: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).emotionalContagionData
    ? ((data as Record<string, unknown>).emotionalContagionData as unknown[])[0]
    : getAnalysisForSection(data, 'emotionalContagion');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Emotional Contagion Modeling', getSectionColor('emotionalContagion') || PDF_DESIGN.colors.analysis);
  const ec = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const contagionScore = ec?.contagionPotential ?? ec?.contagion_score;
  if (contagionScore !== undefined) {
    ctx.renderScoreBar('Contagion Potential', (contagionScore as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  const emotionPropagation = ec?.propagationPatterns ?? ec?.propagation ?? [];
  if (Array.isArray(emotionPropagation) && emotionPropagation.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Emotion Propagation Patterns');
    (emotionPropagation as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const emotion = p.emotion ?? 'Unknown';
      const reach = (p.predictedReach ?? p.reach ?? 0) as number;
      ctx.renderBullet(`${emotion}: ${reach} network nodes`, 5);
    });
  }
  
  ctx.yPos += 10;
};

export const renderSacredValuePrediction: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).sacredValuePredictionData
    ? ((data as Record<string, unknown>).sacredValuePredictionData as unknown[])[0]
    : getAnalysisForSection(data, 'sacredValuePrediction');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Sacred Value Prediction', getSectionColor('sacredValuePrediction') || PDF_DESIGN.colors.intelligence);
  const sv = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const sacredValues = sv?.identifiedSacredValues ?? sv?.sacred_values ?? [];
  if (Array.isArray(sacredValues) && sacredValues.length > 0) {
    ctx.renderSubsection('Non-Negotiable Beliefs');
    (sacredValues as Array<Record<string, unknown>>).slice(0, 5).forEach(v => {
      const value = v.value ?? v.belief ?? 'Unknown';
      const intensity = (v.intensity ?? 0) as number;
      ctx.renderBullet(`${value} (${Math.round(intensity * 100)}% intensity)`, 5);
    });
  }
  
  const violationReactions = sv?.predictedViolationReactions ?? sv?.reactions ?? [];
  if (Array.isArray(violationReactions) && violationReactions.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Predicted Violation Reactions');
    (violationReactions as string[]).slice(0, 3).forEach(r => ctx.renderBullet(r, 5));
  }
  
  ctx.yPos += 10;
};

// ============== BIOMETRIC & NETWORK SECTIONS ==============

export const renderPupillometry: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).pupillometryData
    ? ((data as Record<string, unknown>).pupillometryData as unknown[])[0]
    : getAnalysisForSection(data, 'pupillometry');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Pupillometry Analysis', getSectionColor('pupillometry') || PDF_DESIGN.colors.analysis);
  const pm = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const cognitiveLoad = pm?.cognitiveLoadEstimate ?? pm?.cognitive_load;
  if (cognitiveLoad !== undefined) {
    ctx.renderScoreBar('Cognitive Load', (cognitiveLoad as number) * 100, 100, PDF_DESIGN.colors.info);
  }
  
  const emotionalArousal = pm?.emotionalArousal ?? pm?.arousal;
  if (emotionalArousal !== undefined) {
    ctx.renderScoreBar('Emotional Arousal', (emotionalArousal as number) * 100, 100, PDF_DESIGN.colors.warning);
  }
  
  const attentionMetrics = pm?.attentionMetrics ?? pm?.attention ?? [];
  if (Array.isArray(attentionMetrics) && attentionMetrics.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Attention Metrics');
    (attentionMetrics as Array<Record<string, unknown>>).slice(0, 3).forEach(m => {
      const metric = m.name ?? m.metric ?? 'Unknown';
      const value = (m.value ?? 0) as number;
      ctx.renderBullet(`${metric}: ${Math.round(value * 100)}%`, 5);
    });
  }
  
  ctx.yPos += 10;
};

export const renderThermalStress: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).thermalStressData
    ? ((data as Record<string, unknown>).thermalStressData as unknown[])[0]
    : getAnalysisForSection(data, 'thermalStress');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Thermal Stress Detection', getSectionColor('thermalStress') || PDF_DESIGN.colors.analysis);
  const ts = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const stressLevel = ts?.thermalStressLevel ?? ts?.stress_level;
  if (stressLevel !== undefined) {
    ctx.renderScoreBar('Thermal Stress Level', (stressLevel as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  const adrenalineIndicators = ts?.adrenalineIndicators ?? ts?.adrenaline ?? [];
  if (Array.isArray(adrenalineIndicators) && adrenalineIndicators.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Adrenaline Response Indicators');
    (adrenalineIndicators as string[]).slice(0, 4).forEach(i => ctx.renderBullet(i, 5));
  }
  
  ctx.yPos += 10;
};

export const renderAttentionMultimodal: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).attentionMultimodalData
    ? ((data as Record<string, unknown>).attentionMultimodalData as unknown[])[0]
    : getAnalysisForSection(data, 'attentionMultimodal');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Attention Multimodal Fusion', getSectionColor('attentionMultimodal') || PDF_DESIGN.colors.analysis);
  const amf = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const modalityWeights = amf?.dynamicModalityWeights ?? amf?.modality_weights;
  if (modalityWeights && typeof modalityWeights === 'object') {
    ctx.renderSubsection('Dynamic Modality Weights');
    Object.entries(modalityWeights as Record<string, number>).slice(0, 5).forEach(([mod, weight]) => {
      ctx.renderScoreBar(mod.replace(/_/g, ' '), weight * 100, 100, PDF_DESIGN.colors.info);
    });
  }
  
  const fusedAssessment = amf?.fusedAssessment ?? amf?.fused_result;
  if (fusedAssessment) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Fused Assessment', String(fusedAssessment));
  }
  
  ctx.yPos += 10;
};

export const renderKeystrokeDynamics: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).keystrokeDynamicsData
    ? ((data as Record<string, unknown>).keystrokeDynamicsData as unknown[])[0]
    : getAnalysisForSection(data, 'keystrokeDynamics');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Keystroke Dynamics Analysis', getSectionColor('keystrokeDynamics') || PDF_DESIGN.colors.analysis);
  const kd = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const typingProfile = kd?.typingProfile ?? kd?.profile;
  if (typingProfile && typeof typingProfile === 'object') {
    ctx.renderSubsection('Behavioral Typing Fingerprint');
    Object.entries(typingProfile as Record<string, unknown>).slice(0, 5).forEach(([key, val]) => {
      if (typeof val === 'number') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), `${Math.round(val)} ms`);
      } else if (typeof val === 'string') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), val);
      }
    });
  }
  
  const authenticationScore = kd?.authenticationScore ?? kd?.auth_score;
  if (authenticationScore !== undefined) {
    ctx.yPos += 5;
    ctx.renderScoreBar('Authentication Confidence', (authenticationScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  ctx.yPos += 10;
};

export const renderSheafInfluence: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).sheafInfluenceData
    ? ((data as Record<string, unknown>).sheafInfluenceData as unknown[])[0]
    : getAnalysisForSection(data, 'sheafInfluence');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Sheaf Neural Influence Map', getSectionColor('sheafInfluence') || PDF_DESIGN.colors.intelligence);
  const si = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const influenceStructure = si?.relationalStructure ?? si?.structure ?? [];
  if (Array.isArray(influenceStructure) && influenceStructure.length > 0) {
    ctx.renderSubsection('DeepSN Relational Structure');
    (influenceStructure as Array<Record<string, unknown>>).slice(0, 4).forEach(s => {
      const node = s.node ?? s.entity ?? 'Node';
      const influence = (s.influenceScore ?? s.influence ?? 0) as number;
      ctx.renderBullet(`${node}: ${Math.round(influence * 100)}% influence`, 5);
    });
  }
  
  const optimalPaths = si?.optimalInfluencePaths ?? si?.paths ?? [];
  if (Array.isArray(optimalPaths) && optimalPaths.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Optimal Influence Paths');
    (optimalPaths as string[]).slice(0, 3).forEach(p => ctx.renderBullet(p, 5));
  }
  
  ctx.yPos += 10;
};

export const renderCtdgLink: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).ctdgLinkData
    ? ((data as Record<string, unknown>).ctdgLinkData as unknown[])[0]
    : getAnalysisForSection(data, 'ctdgLink');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('CTDG Link Prediction', getSectionColor('ctdgLink') || PDF_DESIGN.colors.analysis);
  const cl = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const predictions = cl?.linkPredictions ?? cl?.predictions ?? [];
  if (Array.isArray(predictions) && predictions.length > 0) {
    ctx.renderSubsection('Predicted Future Links');
    (predictions as Array<Record<string, unknown>>).slice(0, 5).forEach(p => {
      const source = p.source ?? 'Source';
      const target = p.target ?? 'Target';
      const probability = (p.probability ?? 0) as number;
      ctx.renderBullet(`${source} → ${target}: ${Math.round(probability * 100)}%`, 5);
    });
  }
  
  const temporalDynamics = cl?.temporalDynamics ?? cl?.dynamics;
  if (temporalDynamics) {
    ctx.yPos += 5;
    ctx.renderKeyValue('Temporal Dynamics', String(temporalDynamics));
  }
  
  ctx.yPos += 10;
};

export const renderCascadeVirality: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).cascadeViralityData
    ? ((data as Record<string, unknown>).cascadeViralityData as unknown[])[0]
    : getAnalysisForSection(data, 'cascadeVirality');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cascade Virality Prediction', getSectionColor('cascadeVirality') || PDF_DESIGN.colors.analysis);
  const cv = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const viralityScore = cv?.viralityPotential ?? cv?.virality_score;
  if (viralityScore !== undefined) {
    ctx.renderScoreBar('Virality Potential', (viralityScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  const cascadeMetrics = cv?.cascadeMetrics ?? cv?.metrics;
  if (cascadeMetrics && typeof cascadeMetrics === 'object') {
    ctx.yPos += 5;
    ctx.renderSubsection('Cascade Metrics');
    Object.entries(cascadeMetrics as Record<string, unknown>).slice(0, 4).forEach(([key, val]) => {
      if (typeof val === 'number') {
        ctx.renderKeyValue(key.replace(/_/g, ' '), String(Math.round(val)));
      }
    });
  }
  
  ctx.yPos += 10;
};

export const renderNetworkResilience: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).networkResilienceData
    ? ((data as Record<string, unknown>).networkResilienceData as unknown[])[0]
    : getAnalysisForSection(data, 'networkResilience');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Network Resilience Analysis', getSectionColor('networkResilience') || PDF_DESIGN.colors.analysis);
  const nr = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const resilienceScore = nr?.overallResilience ?? nr?.resilience_score;
  if (resilienceScore !== undefined) {
    ctx.renderScoreBar('Network Resilience', (resilienceScore as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  const criticalNodes = nr?.criticalNodes ?? nr?.critical_nodes ?? [];
  if (Array.isArray(criticalNodes) && criticalNodes.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Critical Fragmentation Nodes');
    (criticalNodes as Array<Record<string, unknown>>).slice(0, 4).forEach(n => {
      const node = n.name ?? n.node ?? 'Node';
      const impact = (n.fragmentationImpact ?? n.impact ?? 0) as number;
      ctx.renderBullet(`${node}: ${Math.round(impact * 100)}% fragmentation impact`, 5);
    });
  }
  
  ctx.yPos += 10;
};

// ============== DOCTRINE & ADVANCED SECTIONS ==============

export const renderGazePattern: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).gazePatternData
    ? ((data as Record<string, unknown>).gazePatternData as unknown[])[0]
    : getAnalysisForSection(data, 'gazePattern');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Gaze Pattern Analysis', getSectionColor('gazePattern') || PDF_DESIGN.colors.analysis);
  const gp = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const attentionPatterns = gp?.attentionPatterns ?? gp?.patterns ?? [];
  if (Array.isArray(attentionPatterns) && attentionPatterns.length > 0) {
    ctx.renderSubsection('Attention Focus Patterns');
    (attentionPatterns as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const aoi = p.areaOfInterest ?? p.aoi ?? 'Unknown';
      const duration = p.dwellTime ?? p.duration ?? 0;
      ctx.renderBullet(`${aoi}: ${duration}ms average dwell time`, 5);
    });
  }
  
  const interestMetrics = gp?.interestIndicators ?? gp?.interest ?? [];
  if (Array.isArray(interestMetrics) && interestMetrics.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Interest Indicators');
    (interestMetrics as string[]).slice(0, 3).forEach(i => ctx.renderBullet(i, 5));
  }
  
  ctx.yPos += 10;
};

export const renderMicroExpressionTimeline: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).microExpressionTimelineData
    ? ((data as Record<string, unknown>).microExpressionTimelineData as unknown[])[0]
    : getAnalysisForSection(data, 'microExpressionTimeline');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Micro-Expression Timeline', getSectionColor('microExpressionTimeline') || PDF_DESIGN.colors.analysis);
  const me = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const expressions = me?.detectedExpressions ?? me?.expressions ?? [];
  if (Array.isArray(expressions) && expressions.length > 0) {
    ctx.renderSubsection('Temporal Expression Analysis');
    (expressions as Array<Record<string, unknown>>).slice(0, 5).forEach(e => {
      const emotion = e.emotion ?? e.type ?? 'Unknown';
      const timestamp = e.timestamp ?? e.time ?? 'Unknown';
      const duration = e.durationMs ?? e.duration ?? 0;
      ctx.renderBullet(`${timestamp}: ${emotion} (${duration}ms)`, 5);
    });
  }
  
  const deceptionIndicators = me?.deceptionIndicators ?? me?.deception ?? [];
  if (Array.isArray(deceptionIndicators) && deceptionIndicators.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Deception Indicators');
    (deceptionIndicators as string[]).slice(0, 3).forEach(d => ctx.renderBullet(d, 5));
  }
  
  ctx.yPos += 10;
};

export const renderVoiceStressCorrelation: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).voiceStressCorrelationData
    ? ((data as Record<string, unknown>).voiceStressCorrelationData as unknown[])[0]
    : getAnalysisForSection(data, 'voiceStressCorrelation');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Voice Stress Correlation', getSectionColor('voiceStressCorrelation') || PDF_DESIGN.colors.analysis);
  const vs = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const correlationScore = vs?.multiModalCorrelation ?? vs?.correlation;
  if (correlationScore !== undefined) {
    ctx.renderScoreBar('Multi-Modal Correlation', (correlationScore as number) * 100, 100, PDF_DESIGN.colors.info);
  }
  
  const stressPatterns = vs?.correlatedStressPatterns ?? vs?.patterns ?? [];
  if (Array.isArray(stressPatterns) && stressPatterns.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Correlated Stress Patterns');
    (stressPatterns as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const vocal = p.vocalIndicator ?? 'Vocal';
      const biometric = p.biometricIndicator ?? 'Biometric';
      const strength = (p.correlationStrength ?? 0) as number;
      ctx.renderBullet(`${vocal} ↔ ${biometric}: ${Math.round(strength * 100)}%`, 5);
    });
  }
  
  ctx.yPos += 10;
};

export const renderSocialGraphPrediction: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).socialGraphPredictionData
    ? ((data as Record<string, unknown>).socialGraphPredictionData as unknown[])[0]
    : getAnalysisForSection(data, 'socialGraphPrediction');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Social Graph Prediction', getSectionColor('socialGraphPrediction') || PDF_DESIGN.colors.intelligence);
  const sg = extractResultSafe(rawData);
  
  ctx.checkPageBreak(60);
  
  const evolutionPredictions = sg?.networkEvolutionPredictions ?? sg?.predictions ?? [];
  if (Array.isArray(evolutionPredictions) && evolutionPredictions.length > 0) {
    ctx.renderSubsection('Network Evolution Forecasts');
    (evolutionPredictions as Array<Record<string, unknown>>).slice(0, 4).forEach(p => {
      const change = p.predictedChange ?? p.change ?? 'Unknown';
      const probability = (p.probability ?? 0) as number;
      const timeframe = p.timeframe ?? '30d';
      ctx.renderBullet(`${change} (${Math.round(probability * 100)}% in ${timeframe})`, 5);
    });
  }
  
  const trajectoryScore = sg?.relationshipTrajectoryScore ?? sg?.trajectory;
  if (trajectoryScore !== undefined && typeof trajectoryScore === 'number') {
    ctx.yPos += 5;
    ctx.renderKeyValue('Overall Trajectory', trajectoryScore > 0 ? `+${Math.round(trajectoryScore * 100)}%` : `${Math.round(trajectoryScore * 100)}%`);
  }
  
  ctx.yPos += 10;
};

export const renderInfluenceCampaignOptimization: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).influenceCampaignOptimizationData
    ? ((data as Record<string, unknown>).influenceCampaignOptimizationData as unknown[])[0]
    : getAnalysisForSection(data, 'influenceCampaignOptimization');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Influence Campaign Optimization', getSectionColor('influenceCampaignOptimization') || PDF_DESIGN.colors.warfare);
  const ic = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const channelEffectiveness = ic?.channelEffectiveness ?? ic?.channels ?? [];
  if (Array.isArray(channelEffectiveness) && channelEffectiveness.length > 0) {
    ctx.renderSubsection('Channel Effectiveness');
    (channelEffectiveness as Array<Record<string, unknown>>).slice(0, 4).forEach(c => {
      const channel = String(c.channel ?? c.name ?? 'Unknown');
      const effectiveness = (c.effectiveness ?? 0) as number;
      ctx.renderScoreBar(channel, effectiveness * 100, 100, PDF_DESIGN.colors.success);
    });
  }
  
  const optimalSequence = ic?.optimalMessageSequence ?? ic?.sequence ?? [];
  if (Array.isArray(optimalSequence) && optimalSequence.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Optimal Message Sequence');
    (optimalSequence as string[]).slice(0, 4).forEach((s, i) => ctx.renderBullet(`${i + 1}. ${s}`, 5));
  }
  
  ctx.yPos += 10;
};

export const renderCounterNarrative: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).counterNarrativeData
    ? ((data as Record<string, unknown>).counterNarrativeData as unknown[])[0]
    : getAnalysisForSection(data, 'counterNarrative');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Counter-Narrative Generation', getSectionColor('counterNarrative') || PDF_DESIGN.colors.warfare);
  const cn = extractResultSafe(rawData);
  
  ctx.checkPageBreak(70);
  
  const hostileNarratives = cn?.hostileNarratives ?? cn?.hostile ?? [];
  if (Array.isArray(hostileNarratives) && hostileNarratives.length > 0) {
    ctx.renderSubsection('Identified Hostile Narratives');
    (hostileNarratives as Array<Record<string, unknown>>).slice(0, 3).forEach(h => {
      const narrative = h.narrative ?? h.content ?? 'Unknown';
      const threat = h.threatLevel ?? 'medium';
      ctx.renderBullet(`[${threat}] ${narrative}`, 5);
    });
  }
  
  const counterStrategies = cn?.inoculationTemplates ?? cn?.counters ?? [];
  if (Array.isArray(counterStrategies) && counterStrategies.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Inoculation Templates');
    (counterStrategies as string[]).slice(0, 3).forEach(c => ctx.renderBullet(c, 5));
  }
  
  ctx.yPos += 10;
};

export const renderPredictiveDoctrine: SectionRenderer = (ctx, data) => {
  const rawData = (data as Record<string, unknown>).predictiveDoctrineData
    ? ((data as Record<string, unknown>).predictiveDoctrineData as unknown[])[0]
    : getAnalysisForSection(data, 'predictiveDoctrine');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Predictive Doctrine Engine', getSectionColor('predictiveDoctrine') || PDF_DESIGN.colors.warfare);
  const pd = extractResultSafe(rawData);
  
  ctx.checkPageBreak(80);
  
  // OODA Loop
  const oodaAnalysis = pd?.oodaLoopAnalysis ?? pd?.ooda;
  if (oodaAnalysis && typeof oodaAnalysis === 'object') {
    ctx.renderSubsection('OODA Loop Analysis');
    const ooda = oodaAnalysis as Record<string, unknown>;
    Object.entries(ooda).slice(0, 4).forEach(([phase, assessment]) => {
      if (typeof assessment === 'string') {
        ctx.renderBullet(`${phase}: ${assessment}`, 5);
      }
    });
  }
  
  // Warden's Five Rings
  const wardenRings = pd?.wardenFiveRings ?? pd?.warden;
  if (wardenRings && typeof wardenRings === 'object') {
    ctx.yPos += 5;
    ctx.renderSubsection("Warden's Five Rings");
    const wr = wardenRings as Record<string, unknown>;
    Object.entries(wr).slice(0, 5).forEach(([ring, vulnerability]) => {
      if (typeof vulnerability === 'number') {
        ctx.renderScoreBar(ring, vulnerability * 100, 100, PDF_DESIGN.colors.warning);
      }
    });
  }
  
  const strategicRecommendations = pd?.strategicRecommendations ?? pd?.recommendations ?? [];
  if (Array.isArray(strategicRecommendations) && strategicRecommendations.length > 0) {
    ctx.yPos += 5;
    ctx.renderSubsection('Strategic Recommendations');
    (strategicRecommendations as string[]).slice(0, 3).forEach(r => ctx.renderBullet(r, 5));
  }
  
  ctx.yPos += 10;
};

// ============== EXPORT REGISTRY ==============

export const v8SectionRenderers = {
  // Counter-Intelligence
  dracoDeception: renderDracoDeception,
  sentientIntent: renderSentientIntent,
  insiderThreat: renderInsiderThreat,
  bayesianIntention: renderBayesianIntention,
  redTeamSimulation: renderRedTeamSimulation,
  semaforForgery: renderSemaforForgery,
  epistemicVulnerability: renderEpistemicVulnerability,
  cognitiveIW: renderCognitiveIW,
  // Psychological Warfare
  psychoagentCascade: renderPsychoagentCascade,
  affectiveManipulation: renderAffectiveManipulation,
  hyperpersonalization: renderHyperpersonalization,
  computationalPersuasion: renderComputationalPersuasion,
  syntheticMemory: renderSyntheticMemory,
  prememBelief: renderPreMemBelief,
  linguisticStress: renderLinguisticStress,
  memoryAnchor: renderMemoryAnchor,
  emotionalContagion: renderEmotionalContagion,
  sacredValuePrediction: renderSacredValuePrediction,
  // Biometric & Network
  pupillometry: renderPupillometry,
  thermalStress: renderThermalStress,
  attentionMultimodal: renderAttentionMultimodal,
  keystrokeDynamics: renderKeystrokeDynamics,
  sheafInfluence: renderSheafInfluence,
  ctdgLink: renderCtdgLink,
  cascadeVirality: renderCascadeVirality,
  networkResilience: renderNetworkResilience,
  // Doctrine & Advanced
  gazePattern: renderGazePattern,
  microExpressionTimeline: renderMicroExpressionTimeline,
  voiceStressCorrelation: renderVoiceStressCorrelation,
  socialGraphPrediction: renderSocialGraphPrediction,
  influenceCampaignOptimization: renderInfluenceCampaignOptimization,
  counterNarrative: renderCounterNarrative,
  predictiveDoctrine: renderPredictiveDoctrine,
};
