/**
 * Warfare Section Renderers (v3.9.33)
 * v3.9.33: PRIORITIZE getAnalysisForSection() fallback (allAnalyses always populated)
 */

import type { SectionRenderer } from './types';
import { PDF_DESIGN } from '../../hooks/usePDFGeneration';
import { getAnalysisForSection, extractResult } from '../../utils/sectionDataCheck';

export const renderCognitiveWarfare: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.33: PRIORITIZE allAnalyses fallback first
  const rawData = getAnalysisForSection(data, 'cognitiveWarfare')
    || (data.cognitiveWarfareData?.length ? data.cognitiveWarfareData : null);
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Cognitive Warfare Operations', PDF_DESIGN.colors.fusion);
  
  // Handle both array (from table) and object (from ai_analyses)
  const operations = Array.isArray(rawData) ? rawData : [rawData];
  
  (operations as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    const opData = extractResult(op);
    ctx.checkPageBreak(30);
    ctx.renderSubsection((opData.operation_name as string) || 'Cognitive Warfare Analysis');
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Type: ${opData.operation_type || 'Strategic'} | Status: ${(opData.status as string)?.toUpperCase() || 'ACTIVE'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderDeceptionOps: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.deceptionOpsData?.length
    ? data.deceptionOpsData
    : getAnalysisForSection(data, 'deceptionOps');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Deception Operations', [139, 69, 19]);
  
  const operations = Array.isArray(rawData) ? rawData : [rawData];
  
  (operations as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    const opData = extractResult(op);
    ctx.checkPageBreak(25);
    ctx.renderSubsection((opData.operation_name as string) || 'Deception Analysis');
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Type: ${opData.deception_type || opData.type || 'Unknown'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderTrauma: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.traumaData?.length
    ? data.traumaData[0]
    : getAnalysisForSection(data, 'trauma');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Trauma & Vulnerability Windows', PDF_DESIGN.colors.danger);
  const trauma = extractResult(rawData as Record<string, unknown>);
  
  if (trauma.vulnerability_score !== undefined) {
    ctx.renderScoreBar('Vulnerability Score', (trauma.vulnerability_score as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  if (trauma.exploitation_vectors) {
    const vectors = trauma.exploitation_vectors as string[];
    ctx.renderSubsection('Exploitation Vectors');
    vectors.slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  
  ctx.yPos += 8;
};

export const renderBetrayal: SectionRenderer = (ctx, data) => {
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.betrayalData?.length
    ? data.betrayalData[0]
    : getAnalysisForSection(data, 'betrayal');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Betrayal & Crisis Prediction', PDF_DESIGN.colors.danger);
  const betrayal = extractResult(rawData as Record<string, unknown>);
  
  if (betrayal.betrayal_likelihood !== undefined) {
    ctx.renderScoreBar('Betrayal Likelihood', (betrayal.betrayal_likelihood as number) * 100, 100, PDF_DESIGN.colors.danger);
  }
  
  if (betrayal.warning_signs) {
    const signs = betrayal.warning_signs as string[];
    ctx.renderSubsection('Warning Signs');
    signs.slice(0, 4).forEach(s => ctx.renderBullet(s, 5));
  }
  
  ctx.yPos += 8;
};

export const renderVulnerabilityWindows: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = data.vulnerabilityWindowsData?.length
    ? data.vulnerabilityWindowsData
    : getAnalysisForSection(data, 'vulnerabilityWindows');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Vulnerability Windows', [220, 20, 60]);
  
  const windows = Array.isArray(rawData) ? rawData : [rawData];
  const activeWindows = (windows as Array<Record<string, unknown>>).filter(w => 
    extractResult(w).current_status === 'active' || extractResult(w).status === 'active'
  );
  
  if (activeWindows.length > 0) {
    ctx.checkPageBreak(20);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 15, 2, 2, 'F');
    doc.setFontSize(PDF_DESIGN.fonts.subheader);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_DESIGN.colors.danger);
    doc.text(`${activeWindows.length} ACTIVE VULNERABILITY WINDOWS`, ctx.margin + 5, ctx.yPos + 5);
    doc.setTextColor(0);
    ctx.yPos += 20;
  }
  ctx.yPos += 8;
};

export const renderActiveDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.activeDefenseData?.length) return;
  
  ctx.renderSectionHeader('Active Defense Posture', PDF_DESIGN.colors.success);
  const defense = extractResult((data.activeDefenseData as Array<Record<string, unknown>>)[0]);
  ctx.checkPageBreak(20);
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`Defense Type: ${(defense.defense_type as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 8;
};

// Reality Testing renderer
export const renderRealityTesting: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.realityTestingData) && data.realityTestingData.length)
    ? data.realityTestingData[0]
    : getAnalysisForSection(data, 'realityTesting');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Reality Testing Vulnerability', PDF_DESIGN.colors.fusion);
  const reality = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(255, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (reality.reality_distortion_score !== undefined) {
    ctx.renderScoreBar('Reality Distortion', (reality.reality_distortion_score as number) * 100, 100, PDF_DESIGN.colors.fusion);
  }
  
  if (reality.vulnerable_beliefs) {
    const beliefs = reality.vulnerable_beliefs as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Vulnerable Belief Systems');
    beliefs.slice(0, 3).forEach(b => ctx.renderBullet(b, 5));
  }
  ctx.yPos += 8;
};

// Identity Destabilization renderer
export const renderIdentityDestab: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.identityDestabData) && data.identityDestabData.length)
    ? data.identityDestabData[0]
    : getAnalysisForSection(data, 'identityDestab');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Identity Destabilization Profile', [100, 0, 80]);
  const identity = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 240, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (identity.identity_stability !== undefined) {
    ctx.renderScoreBar('Identity Stability', (identity.identity_stability as number) * 100, 100, PDF_DESIGN.colors.success);
  }
  
  if (identity.destabilization_vectors) {
    const vectors = identity.destabilization_vectors as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Destabilization Vectors');
    vectors.slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  ctx.yPos += 8;
};

// Semantic Warfare renderer
export const renderSemanticWarfare: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.semanticWarfareData) && data.semanticWarfareData.length)
    ? data.semanticWarfareData[0]
    : getAnalysisForSection(data, 'semanticWarfare');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Semantic Warfare Profile', PDF_DESIGN.colors.analysis);
  const semantic = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(240, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (semantic.linguistic_vulnerabilities) {
    const vulns = semantic.linguistic_vulnerabilities as string[];
    ctx.renderSubsection('Linguistic Vulnerabilities');
    vulns.slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  
  if (semantic.reframing_opportunities) {
    const reframes = semantic.reframing_opportunities as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Reframing Opportunities');
    reframes.slice(0, 3).forEach(r => ctx.renderBullet(r, 5));
  }
  ctx.yPos += 8;
};

// Memetic Propagation renderer
export const renderMemeticPropagation: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.memeticData) && data.memeticData.length)
    ? data.memeticData[0]
    : getAnalysisForSection(data, 'memeticPropagation');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Memetic Propagation Analysis', [150, 50, 100]);
  const memetic = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (memetic.virality_score !== undefined) {
    ctx.renderScoreBar('Virality Potential', (memetic.virality_score as number) * 100, 100, [150, 50, 100]);
  }
  
  if (memetic.resonant_memes) {
    const memes = memetic.resonant_memes as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Resonant Memes');
    memes.slice(0, 4).forEach(m => ctx.renderBullet(m, 5));
  }
  ctx.yPos += 8;
};

// Future Modeling renderer
export const renderFutureModeling: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.futureModelingData) && data.futureModelingData.length)
    ? data.futureModelingData[0]
    : getAnalysisForSection(data, 'futureModeling');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Behavioral Future Modeling', [50, 80, 150]);
  const future = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (future.predictions) {
    const predictions = future.predictions as Array<Record<string, unknown>>;
    ctx.renderSubsection('30-Day Predictions');
    predictions.slice(0, 4).forEach((p) => {
      const behavior = p.behavior as string || 'Unknown';
      const probability = (p.probability as number) || 0;
      ctx.renderBullet(`${behavior} (${Math.round(probability * 100)}% likelihood)`, 5);
    });
  }
  ctx.yPos += 8;
};

// Precognitive Patterns renderer
export const renderPrecognitive: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.precognitiveData) && data.precognitiveData.length)
    ? data.precognitiveData[0]
    : getAnalysisForSection(data, 'precognitive');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Precognitive Pattern Analysis', [100, 50, 150]);
  const precog = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(40);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (precog.pattern_matches) {
    const patterns = precog.pattern_matches as Array<Record<string, unknown>>;
    ctx.renderSubsection('Pattern Matches');
    patterns.slice(0, 4).forEach((p) => {
      ctx.renderBullet(`${p.pattern || 'Unknown'}: ${p.confidence || 0}% confidence`, 5);
    });
  }
  ctx.yPos += 8;
};

// Choice Architecture renderer
export const renderChoiceArchitecture: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.choiceArchitectureData) && data.choiceArchitectureData.length)
    ? data.choiceArchitectureData[0]
    : getAnalysisForSection(data, 'choiceArchitecture');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Choice Architecture Exploitation', [0, 128, 100]);
  const choice = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (choice.effective_nudges) {
    const nudges = choice.effective_nudges as string[];
    ctx.renderSubsection('Effective Nudge Techniques');
    nudges.slice(0, 5).forEach(n => ctx.renderBullet(n, 5));
  }
  
  if (choice.decision_defaults) {
    const defaults = choice.decision_defaults as string[];
    ctx.yPos += 3;
    ctx.renderSubsection('Decision Defaults');
    defaults.slice(0, 3).forEach(d => ctx.renderBullet(d, 5));
  }
  ctx.yPos += 8;
};

// Influence Operations renderer
export const renderInfluenceOps: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.influenceOpsData) && data.influenceOpsData.length)
    ? data.influenceOpsData
    : getAnalysisForSection(data, 'influenceOps');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Influence Operation Planning', [64, 0, 128]);
  
  const ops = Array.isArray(rawData) ? rawData : [rawData];
  
  (ops as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    const opData = extractResult(op);
    ctx.checkPageBreak(30);
    ctx.renderSubsection((opData.operation_name as string) || 'Influence Analysis');
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.setFont('helvetica', 'normal');
    
    if (opData.target_outcome) {
      doc.text(`Objective: ${opData.target_outcome}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    if (opData.success_probability !== undefined) {
      doc.text(`Success Probability: ${Math.round((opData.success_probability as number) * 100)}%`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

// Threat Actor renderer
export const renderThreatActor: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.threatActorData) && data.threatActorData.length)
    ? data.threatActorData[0]
    : getAnalysisForSection(data, 'threatActor');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Threat Assessment Profile', PDF_DESIGN.colors.danger);
  const threat = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (threat.threat_level !== undefined) {
    const level = threat.threat_level as number;
    const color: [number, number, number] = level > 7 ? PDF_DESIGN.colors.danger : level > 4 ? PDF_DESIGN.colors.warning : PDF_DESIGN.colors.success;
    ctx.renderScoreBar('Threat Level', level * 10, 100, color);
  }
  
  if (threat.capabilities) {
    const caps = threat.capabilities as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Known Capabilities');
    caps.slice(0, 4).forEach(c => ctx.renderBullet(c, 5));
  }
  ctx.yPos += 8;
};

// Trust Trajectory renderer
export const renderTrustTrajectory: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.trustData?.length) return;
  
  ctx.renderSectionHeader('180-Day Trust Trajectory', [0, 128, 128]);
  const trust = extractResult((data.trustData as Array<Record<string, unknown>>)[0]);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (trust.trust_trajectory) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const trajectory = trust.trust_trajectory as string;
    const color: [number, number, number] = trajectory === 'improving' ? PDF_DESIGN.colors.success : 
      trajectory === 'declining' ? PDF_DESIGN.colors.danger : PDF_DESIGN.colors.muted;
    doc.setTextColor(...color);
    doc.text(`Trajectory: ${trajectory.toUpperCase()}`, ctx.margin + 5, ctx.yPos + 10);
    doc.setTextColor(0);
    ctx.yPos += 20;
  }
  
  if (trust.trust_factors) {
    const factors = trust.trust_factors as Array<Record<string, unknown>>;
    ctx.renderSubsection('Trust Factors');
    factors.slice(0, 4).forEach((f) => {
      const factor = f.factor as string || 'Unknown';
      const impact = f.impact as string || 'neutral';
      ctx.renderBullet(`${factor}: ${impact}`, 5);
    });
  }
  ctx.yPos += 8;
};

// Coercive Control renderer
export const renderCoerciveControl: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.coerciveControlData) && data.coerciveControlData.length)
    ? data.coerciveControlData[0]
    : getAnalysisForSection(data, 'coerciveControl');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Coercive Control Assessment', [180, 0, 60]);
  const coercive = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 245, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (coercive.control_score !== undefined) {
    ctx.renderScoreBar('Control Susceptibility', (coercive.control_score as number) * 100, 100, [180, 0, 60]);
  }
  
  if (coercive.control_vectors) {
    const vectors = coercive.control_vectors as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Effective Control Vectors');
    vectors.slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  ctx.yPos += 8;
};

// Influence renderer
export const renderInfluence: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try influenceVectorData first, then influenceData, then allAnalyses
  const vectors = (Array.isArray(data.influenceVectorData) && data.influenceVectorData.length)
    ? data.influenceVectorData
    : data.influenceData
      ? [data.influenceData]
      : (() => {
          const analysis = getAnalysisForSection(data, 'influence');
          return analysis ? [analysis] : [];
        })();
  
  if (!vectors.length) return;
  
  ctx.renderSectionHeader('Influence Profile Analysis', PDF_DESIGN.colors.info);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  // Render influence vectors from Cialdini profile or vector data
  const rawInf = (vectors[0] as Record<string, unknown>);
  const inf = extractResult(rawInf);
  
  const principles = ['reciprocity', 'authority', 'scarcity', 'commitment', 'liking', 'social_proof', 'unity'];
  
  principles.forEach(p => {
    const score = (inf[`${p}_susceptibility`] as number) || (inf[p] as number) || 0;
    if (score > 0) {
      ctx.renderScoreBar(p.replace('_', ' ').toUpperCase(), score, 100, PDF_DESIGN.colors.info);
    }
  });
  ctx.yPos += 8;
};

// ============================================
// OPSEC Assessment Renderer (v5.0)
// ============================================
export const renderOpsecAssessment: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.opsecAssessments) && data.opsecAssessments.length)
    ? data.opsecAssessments[0]
    : getAnalysisForSection(data, 'opsecAssessment');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('OPSEC Vulnerability Assessment', [220, 20, 60]);
  const assessment = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(255, 240, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  if (assessment.overall_score !== undefined) {
    ctx.renderScoreBar('Overall OPSEC Score', (assessment.overall_score as number), 100, PDF_DESIGN.colors.success);
  }
  if (assessment.digital_exposure_score !== undefined) {
    ctx.renderScoreBar('Digital Exposure', (assessment.digital_exposure_score as number), 100, PDF_DESIGN.colors.mediumRisk);
  }
  if (assessment.communication_security_score !== undefined) {
    ctx.renderScoreBar('Communication Security', (assessment.communication_security_score as number), 100, PDF_DESIGN.colors.info);
  }
  
  if (assessment.vulnerabilities) {
    const vulns = assessment.vulnerabilities as string[];
    ctx.yPos += 5;
    ctx.renderSubsection('Key Vulnerabilities');
    vulns.slice(0, 4).forEach(v => ctx.renderBullet(v, 5));
  }
  ctx.yPos += 8;
};

// ============================================
// Social Engineering Detection Renderer (v5.0)
// ============================================
export const renderSocialEngineering: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.socialEngineeringIncidents) && data.socialEngineeringIncidents.length)
    ? data.socialEngineeringIncidents
    : getAnalysisForSection(data, 'socialEngineering');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Social Engineering Detection', PDF_DESIGN.colors.danger);
  
  const incidents = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_DESIGN.colors.danger);
  doc.text(`${incidents.length} Incident(s) Detected`, ctx.margin + 5, ctx.yPos + 8);
  doc.setTextColor(0);
  ctx.yPos += 15;
  
  (incidents as Array<Record<string, unknown>>).slice(0, 3).forEach((inc) => {
    const incData = extractResult(inc);
    ctx.checkPageBreak(20);
    ctx.renderSubsection(`${incData.incident_type || 'Unknown Attack'}`);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Vector: ${incData.attack_vector || 'Unknown'} | Threat Level: ${incData.threat_level || 'N/A'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Crisis Response Renderer (v5.0)
// ============================================
export const renderCrisisResponse: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try multiple sources
  const crises = (Array.isArray(data.crisisEvents) && data.crisisEvents.length)
    ? data.crisisEvents
    : getAnalysisForSection(data, 'crisisResponse');
  
  if (!crises) return;
  
  ctx.renderSectionHeader('Crisis Response Status', PDF_DESIGN.colors.danger);
  
  const crisisArray = Array.isArray(crises) ? crises : [crises];
  const activeCrises = (crisisArray as Array<Record<string, unknown>>).filter(c => {
    const cData = extractResult(c);
    return cData.status === 'active';
  });
  
  ctx.checkPageBreak(45);
  if (activeCrises.length > 0) {
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 20, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF_DESIGN.colors.danger);
    doc.text(`${activeCrises.length} ACTIVE CRISIS EVENT(S)`, ctx.margin + 5, ctx.yPos + 10);
    doc.setTextColor(0);
    ctx.yPos += 25;
  }
  
  (crisisArray as Array<Record<string, unknown>>).slice(0, 3).forEach((crisis) => {
    const crisisData = extractResult(crisis);
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${crisisData.crisis_type || 'Unknown Crisis'}`);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Severity: ${crisisData.severity || 'N/A'} | Escalation: Level ${crisisData.escalation_level || 0}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Lawfare Defense Renderer (v5.0)
// ============================================
export const renderLawfareDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.legalThreats) && data.legalThreats.length)
    ? data.legalThreats
    : getAnalysisForSection(data, 'lawfareDefense');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Lawfare Defense Analysis', [100, 50, 150]);
  
  const threats = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  (threats as Array<Record<string, unknown>>).slice(0, 3).forEach((threat) => {
    const threatData = extractResult(threat);
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${threatData.threat_type || 'Legal Threat'}`);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Jurisdiction: ${threatData.jurisdiction || 'Unknown'} | Severity: ${threatData.severity || 'N/A'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    if (threatData.likelihood !== undefined) {
      doc.text(`Likelihood: ${Math.round((threatData.likelihood as number) * 100)}%`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Reputation Defense Renderer (v5.0)
// ============================================
export const renderReputationDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.reputationIncidents) && data.reputationIncidents.length)
    ? data.reputationIncidents
    : getAnalysisForSection(data, 'reputationDefense');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Reputation Defense Status', [150, 100, 0]);
  
  const incidents = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`${incidents.length} Reputation Incident(s) Tracked`, ctx.margin + 5, ctx.yPos + 8);
  ctx.yPos += 15;
  
  (incidents as Array<Record<string, unknown>>).slice(0, 3).forEach((inc) => {
    const incData = extractResult(inc);
    ctx.checkPageBreak(20);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`• ${incData.incident_type || 'Incident'} on ${incData.platform || 'Unknown Platform'} (Severity: ${incData.severity || 'N/A'})`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 3;
  });
  ctx.yPos += 8;
};

// ============================================
// Family Protection Renderer (v5.0)
// ============================================
export const renderFamilyProtection: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  const hasPersons = Array.isArray(data.protectedPersons) && data.protectedPersons.length > 0;
  const hasProtocols = Array.isArray(data.emergencyProtocols) && data.emergencyProtocols.length > 0;
  const analysisData = getAnalysisForSection(data, 'familyProtection');
  
  if (!hasPersons && !hasProtocols && !analysisData) return;
  
  ctx.renderSectionHeader('Family & VIP Protection', PDF_DESIGN.colors.info);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(240, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  if (hasPersons) {
    const persons = data.protectedPersons as Array<Record<string, unknown>>;
    ctx.renderSubsection(`Protected Persons (${persons.length})`);
    persons.slice(0, 4).forEach(p => {
      ctx.renderBullet(`${p.name || 'Unknown'} - ${p.relationship || 'N/A'} (${p.protection_level || 'Standard'})`, 5);
    });
    ctx.yPos += 5;
  }
  
  if (hasProtocols) {
    const protocols = data.emergencyProtocols as Array<Record<string, unknown>>;
    ctx.renderSubsection(`Active Emergency Protocols (${protocols.length})`);
    protocols.slice(0, 3).forEach(p => {
      ctx.renderBullet(`${p.protocol_name || 'Protocol'}`, 5);
    });
  }
  ctx.yPos += 8;
};

// ============================================
// Economic Warfare Renderer (v5.0)
// ============================================
export const renderEconomicWarfare: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.economicThreats) && data.economicThreats.length)
    ? data.economicThreats
    : getAnalysisForSection(data, 'economicWarfare');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Economic Warfare Assessment', [150, 50, 50]);
  
  const threats = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  (threats as Array<Record<string, unknown>>).slice(0, 3).forEach((threat) => {
    const threatData = extractResult(threat);
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${threatData.threat_type || 'Economic Threat'}`);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    if (threatData.financial_exposure !== undefined) {
      doc.text(`Financial Exposure: $${(threatData.financial_exposure as number).toLocaleString()}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    doc.text(`Status: ${threatData.status || 'Active'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// TSCM Sweep Renderer (v5.0)
// ============================================
export const renderTscmSweep: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.tscmSweeps) && data.tscmSweeps.length)
    ? data.tscmSweeps
    : getAnalysisForSection(data, 'tscmSweep');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('TSCM Sweep Results', [50, 100, 150]);
  
  const sweeps = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  (sweeps as Array<Record<string, unknown>>).slice(0, 3).forEach((sweep) => {
    const sweepData = extractResult(sweep);
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${sweepData.sweep_type || 'TSCM Sweep'} - ${sweepData.location || 'Unknown Location'}`);
    doc.setFontSize(PDF_DESIGN.fonts.body);
    doc.text(`Date: ${sweepData.sweep_date || 'N/A'} | Status: ${sweepData.status || 'Completed'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    
    if (sweepData.devices_detected) {
      const devices = sweepData.devices_detected as any[];
      if (devices.length > 0) {
        doc.setTextColor(...PDF_DESIGN.colors.danger);
        doc.text(`⚠ ${devices.length} Device(s) Detected`, ctx.margin, ctx.yPos);
        doc.setTextColor(0);
        ctx.yPos += ctx.lineHeight;
      }
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Digital Footprint Renderer (v5.0)
// ============================================
export const renderDigitalFootprint: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.digitalFootprints) && data.digitalFootprints.length)
    ? data.digitalFootprints
    : getAnalysisForSection(data, 'digitalFootprint');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Digital Footprint Analysis', [100, 0, 150]);
  
  const items = Array.isArray(rawData) ? rawData : [rawData];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.setFont('helvetica', 'bold');
  doc.text(`${items.length} Digital Footprint Items Discovered`, ctx.margin + 5, ctx.yPos + 8);
  ctx.yPos += 15;
  
  // Group by platform
  const platforms = new Set((items as Array<Record<string, unknown>>).map(i => extractResult(i).platform as string).filter(Boolean));
  doc.setFontSize(PDF_DESIGN.fonts.body);
  doc.setFont('helvetica', 'normal');
  Array.from(platforms).slice(0, 5).forEach(platform => {
    const count = (items as Array<Record<string, unknown>>).filter(i => extractResult(i).platform === platform).length;
    doc.text(`• ${platform}: ${count} item(s)`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
  });
  ctx.yPos += 8;
};

// ============================================
// Behavioral Baseline Renderer (v5.0)
// ============================================
export const renderBehavioralBaseline: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  
  // v3.9.31: Try specific data field first, then fallback to allAnalyses
  const rawData = (Array.isArray(data.behavioralBaselines) && data.behavioralBaselines.length)
    ? data.behavioralBaselines[0]
    : getAnalysisForSection(data, 'behavioralBaseline');
  
  if (!rawData) return;
  
  ctx.renderSectionHeader('Behavioral Baseline', [0, 128, 100]);
  const baseline = extractResult(rawData as Record<string, unknown>);
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(PDF_DESIGN.fonts.subheader);
  doc.text(`Baseline Date: ${baseline.baseline_date || 'N/A'}`, ctx.margin + 5, ctx.yPos + 8);
  ctx.yPos += 15;
  
  if (baseline.current_deviations) {
    const deviations = baseline.current_deviations as string[];
    if (deviations.length > 0) {
      ctx.renderSubsection('Current Deviations');
      deviations.slice(0, 4).forEach(d => ctx.renderBullet(d, 5));
    }
  }
  
  if (baseline.anomaly_alerts) {
    const alerts = baseline.anomaly_alerts as string[];
    if (alerts.length > 0) {
      ctx.yPos += 3;
      ctx.renderSubsection('Anomaly Alerts');
      alerts.slice(0, 3).forEach(a => ctx.renderBullet(a, 5));
    }
  }
  ctx.yPos += 8;
};

export const warfareSectionRenderers = {
  cognitiveWarfare: renderCognitiveWarfare,
  deceptionOps: renderDeceptionOps,
  trauma: renderTrauma,
  betrayal: renderBetrayal,
  vulnerabilityWindows: renderVulnerabilityWindows,
  activeDefense: renderActiveDefense,
  realityTesting: renderRealityTesting,
  identityDestab: renderIdentityDestab,
  semanticWarfare: renderSemanticWarfare,
  memeticPropagation: renderMemeticPropagation,
  futureModeling: renderFutureModeling,
  precognitive: renderPrecognitive,
  choiceArchitecture: renderChoiceArchitecture,
  influenceOps: renderInfluenceOps,
  threatActor: renderThreatActor,
  trustTrajectory: renderTrustTrajectory,
  coerciveControl: renderCoerciveControl,
  influence: renderInfluence,
  // New Warfare Enhancement renderers (v5.0)
  opsecAssessment: renderOpsecAssessment,
  socialEngineering: renderSocialEngineering,
  crisisResponse: renderCrisisResponse,
  lawfareDefense: renderLawfareDefense,
  reputationDefense: renderReputationDefense,
  familyProtection: renderFamilyProtection,
  economicWarfare: renderEconomicWarfare,
  tscmSweep: renderTscmSweep,
  digitalFootprint: renderDigitalFootprint,
  behavioralBaseline: renderBehavioralBaseline,
  // Cross-references for complete 74-section coverage
  crossModal: renderDeceptionOps, // Cross-modal uses deception analysis
};
