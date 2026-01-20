/**
 * Warfare Section Renderers (v3.7.1)
 */

import type { SectionRenderer } from './types';

export const renderCognitiveWarfare: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.cognitiveWarfareData?.length) return;
  
  ctx.renderSectionHeader('Cognitive Warfare Operations', [128, 0, 128]);
  (data.cognitiveWarfareData as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    ctx.checkPageBreak(30);
    ctx.renderSubsection((op.operation_name as string) || 'Unnamed Operation');
    doc.setFontSize(9);
    doc.text(`Type: ${op.operation_type || 'Standard'} | Status: ${(op.status as string)?.toUpperCase() || 'PLANNING'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderDeceptionOps: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.deceptionOpsData?.length) return;
  
  ctx.renderSectionHeader('Deception Operations', [139, 69, 19]);
  (data.deceptionOpsData as Array<Record<string, unknown>>).slice(0, 3).forEach((op) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection((op.operation_name as string) || 'Unnamed Deception');
    doc.setFontSize(9);
    doc.text(`Type: ${op.deception_type || 'Unknown'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

export const renderTrauma: SectionRenderer = (ctx, data) => {
  if (!data.traumaData?.length) return;
  ctx.renderSectionHeader('Trauma & Vulnerability Windows', [150, 50, 50]);
  const trauma = data.traumaData[0] as Record<string, unknown>;
  if (trauma.vulnerability_score !== undefined) {
    ctx.renderScoreBar('Vulnerability Score', (trauma.vulnerability_score as number) * 100, 100, [180, 0, 0]);
  }
  ctx.yPos += 8;
};

export const renderBetrayal: SectionRenderer = (ctx, data) => {
  if (!data.betrayalData?.length) return;
  ctx.renderSectionHeader('Betrayal & Crisis Prediction', [150, 0, 0]);
  const betrayal = data.betrayalData[0] as Record<string, unknown>;
  if (betrayal.betrayal_likelihood !== undefined) {
    ctx.renderScoreBar('Betrayal Likelihood', (betrayal.betrayal_likelihood as number) * 100, 100, [180, 0, 0]);
  }
  ctx.yPos += 8;
};

export const renderVulnerabilityWindows: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.vulnerabilityWindowsData?.length) return;
  
  ctx.renderSectionHeader('Vulnerability Windows', [220, 20, 60]);
  const activeWindows = (data.vulnerabilityWindowsData as Array<Record<string, unknown>>).filter(w => w.current_status === 'active');
  
  if (activeWindows.length > 0) {
    ctx.checkPageBreak(20);
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 15, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text(`${activeWindows.length} ACTIVE VULNERABILITY WINDOWS`, ctx.margin + 5, ctx.yPos + 5);
    doc.setTextColor(0);
    ctx.yPos += 20;
  }
  ctx.yPos += 8;
};

export const renderActiveDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!data.activeDefenseData?.length) return;
  
  ctx.renderSectionHeader('Active Defense Posture', [0, 128, 0]);
  const defense = (data.activeDefenseData as Array<Record<string, unknown>>)[0];
  ctx.checkPageBreak(20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Defense Type: ${(defense.defense_type as string)?.toUpperCase() || 'UNKNOWN'}`, ctx.margin, ctx.yPos);
  ctx.yPos += ctx.lineHeight + 8;
};

// Reality Testing renderer
export const renderRealityTesting: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.realityTestingData) || !data.realityTestingData.length) return;
  
  ctx.renderSectionHeader('Reality Testing Vulnerability', [128, 0, 128]);
  const reality = (data.realityTestingData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(40);
  doc.setFillColor(255, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 35, 3, 3, 'F');
  
  if (reality.reality_distortion_score !== undefined) {
    ctx.renderScoreBar('Reality Distortion', (reality.reality_distortion_score as number) * 100, 100, [128, 0, 128]);
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
  if (!Array.isArray(data.identityDestabData) || !data.identityDestabData.length) return;
  
  ctx.renderSectionHeader('Identity Destabilization Profile', [100, 0, 80]);
  const identity = (data.identityDestabData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(45);
  doc.setFillColor(255, 240, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 40, 3, 3, 'F');
  
  if (identity.identity_stability !== undefined) {
    ctx.renderScoreBar('Identity Stability', (identity.identity_stability as number) * 100, 100, [0, 150, 100]);
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
  if (!Array.isArray(data.semanticWarfareData) || !data.semanticWarfareData.length) return;
  
  ctx.renderSectionHeader('Semantic Warfare Profile', [0, 80, 100]);
  const semantic = (data.semanticWarfareData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.memeticData) || !data.memeticData.length) return;
  
  ctx.renderSectionHeader('Memetic Propagation Analysis', [150, 50, 100]);
  const memetic = (data.memeticData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.futureModelingData) || !data.futureModelingData.length) return;
  
  ctx.renderSectionHeader('Behavioral Future Modeling', [50, 80, 150]);
  const future = (data.futureModelingData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.precognitiveData) || !data.precognitiveData.length) return;
  
  ctx.renderSectionHeader('Precognitive Pattern Analysis', [100, 50, 150]);
  const precog = (data.precognitiveData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.choiceArchitectureData) || !data.choiceArchitectureData.length) return;
  
  ctx.renderSectionHeader('Choice Architecture Exploitation', [0, 128, 100]);
  const choice = (data.choiceArchitectureData as Array<Record<string, unknown>>)[0];
  
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
  if (!Array.isArray(data.influenceOpsData) || !data.influenceOpsData.length) return;
  
  ctx.renderSectionHeader('Influence Operation Planning', [64, 0, 128]);
  const ops = data.influenceOpsData as Array<Record<string, unknown>>;
  
  ops.slice(0, 3).forEach((op) => {
    ctx.checkPageBreak(30);
    ctx.renderSubsection((op.operation_name as string) || 'Unnamed Operation');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (op.target_outcome) {
      doc.text(`Objective: ${op.target_outcome}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    if (op.success_probability !== undefined) {
      doc.text(`Success Probability: ${Math.round((op.success_probability as number) * 100)}%`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    ctx.yPos += 5;
  });
  ctx.yPos += 8;
};

// Threat Actor renderer
export const renderThreatActor: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.threatActorData) || !data.threatActorData.length) return;
  
  ctx.renderSectionHeader('Threat Assessment Profile', [200, 0, 0]);
  const threat = (data.threatActorData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 240, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (threat.threat_level !== undefined) {
    const level = threat.threat_level as number;
    const color: [number, number, number] = level > 7 ? [200, 0, 0] : level > 4 ? [200, 150, 0] : [0, 150, 0];
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
  const trust = (data.trustData as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  if (trust.trust_trajectory) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const trajectory = trust.trust_trajectory as string;
    const color: [number, number, number] = trajectory === 'improving' ? [0, 150, 0] : 
      trajectory === 'declining' ? [200, 0, 0] : [100, 100, 100];
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
  if (!Array.isArray(data.coerciveControlData) || !data.coerciveControlData.length) return;
  
  ctx.renderSectionHeader('Coercive Control Assessment', [180, 0, 60]);
  const coercive = (data.coerciveControlData as Array<Record<string, unknown>>)[0];
  
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

// Influence renderer (v3.7.5 - missing renderer fix)
export const renderInfluence: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  // Try influenceVectorData first, then fall back to influenceData
  const vectors = Array.isArray(data.influenceVectorData) && data.influenceVectorData.length
    ? data.influenceVectorData
    : data.influenceData
      ? [data.influenceData]
      : [];
  
  if (!vectors.length) return;
  
  ctx.renderSectionHeader('Influence Profile Analysis', [0, 100, 180]);
  
  ctx.checkPageBreak(60);
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  // Render influence vectors from Cialdini profile or vector data
  const inf = (vectors[0] as Record<string, unknown>)?.data || vectors[0] as Record<string, unknown>;
  if (inf) {
    const principles = ['reciprocity', 'authority', 'scarcity', 'commitment', 'liking', 'social_proof', 'unity'];
    
    principles.forEach(p => {
      const score = (inf[`${p}_susceptibility`] as number) || (inf[p] as number) || 0;
      if (score > 0) {
        ctx.renderScoreBar(p.replace('_', ' ').toUpperCase(), score, 100, [0, 100, 180]);
      }
    });
  }
  ctx.yPos += 8;
};

// ============================================
// OPSEC Assessment Renderer (v5.0)
// ============================================
export const renderOpsecAssessment: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.opsecAssessments) || !data.opsecAssessments.length) return;
  
  ctx.renderSectionHeader('OPSEC Vulnerability Assessment', [220, 20, 60]);
  const assessment = (data.opsecAssessments as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(60);
  doc.setFillColor(255, 240, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 55, 3, 3, 'F');
  
  if (assessment.overall_score !== undefined) {
    ctx.renderScoreBar('Overall OPSEC Score', (assessment.overall_score as number), 100, [0, 128, 0]);
  }
  if (assessment.digital_exposure_score !== undefined) {
    ctx.renderScoreBar('Digital Exposure', (assessment.digital_exposure_score as number), 100, [200, 100, 0]);
  }
  if (assessment.communication_security_score !== undefined) {
    ctx.renderScoreBar('Communication Security', (assessment.communication_security_score as number), 100, [0, 100, 200]);
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
  if (!Array.isArray(data.socialEngineeringIncidents) || !data.socialEngineeringIncidents.length) return;
  
  ctx.renderSectionHeader('Social Engineering Detection', [200, 50, 50]);
  const incidents = data.socialEngineeringIncidents as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.text(`${incidents.length} Incident(s) Detected`, ctx.margin + 5, ctx.yPos + 8);
  doc.setTextColor(0);
  ctx.yPos += 15;
  
  incidents.slice(0, 3).forEach((inc) => {
    ctx.checkPageBreak(20);
    ctx.renderSubsection(`${inc.incident_type || 'Unknown Attack'}`);
    doc.setFontSize(9);
    doc.text(`Vector: ${inc.attack_vector || 'Unknown'} | Threat Level: ${inc.threat_level || 'N/A'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Crisis Response Renderer (v5.0)
// ============================================
export const renderCrisisResponse: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.crisisEvents) || !data.crisisEvents.length) return;
  
  ctx.renderSectionHeader('Crisis Response Status', [180, 0, 0]);
  const crises = data.crisisEvents as Array<Record<string, unknown>>;
  const activeCrises = crises.filter(c => c.status === 'active');
  
  ctx.checkPageBreak(45);
  if (activeCrises.length > 0) {
    doc.setFillColor(255, 230, 230);
    doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 20, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text(`${activeCrises.length} ACTIVE CRISIS EVENT(S)`, ctx.margin + 5, ctx.yPos + 10);
    doc.setTextColor(0);
    ctx.yPos += 25;
  }
  
  crises.slice(0, 3).forEach((crisis) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${crisis.crisis_type || 'Unknown Crisis'}`);
    doc.setFontSize(9);
    doc.text(`Severity: ${crisis.severity || 'N/A'} | Escalation: Level ${crisis.escalation_level || 0}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// Lawfare Defense Renderer (v5.0)
// ============================================
export const renderLawfareDefense: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.legalThreats) || !data.legalThreats.length) return;
  
  ctx.renderSectionHeader('Lawfare Defense Analysis', [100, 50, 150]);
  const threats = data.legalThreats as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  threats.slice(0, 3).forEach((threat) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${threat.threat_type || 'Legal Threat'}`);
    doc.setFontSize(9);
    doc.text(`Jurisdiction: ${threat.jurisdiction || 'Unknown'} | Severity: ${threat.severity || 'N/A'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    if (threat.likelihood !== undefined) {
      doc.text(`Likelihood: ${Math.round((threat.likelihood as number) * 100)}%`, ctx.margin, ctx.yPos);
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
  if (!Array.isArray(data.reputationIncidents) || !data.reputationIncidents.length) return;
  
  ctx.renderSectionHeader('Reputation Defense Status', [150, 100, 0]);
  const incidents = data.reputationIncidents as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${incidents.length} Reputation Incident(s) Tracked`, ctx.margin + 5, ctx.yPos + 8);
  ctx.yPos += 15;
  
  incidents.slice(0, 3).forEach((inc) => {
    ctx.checkPageBreak(20);
    doc.setFontSize(9);
    doc.text(`• ${inc.incident_type || 'Incident'} on ${inc.platform || 'Unknown Platform'} (Severity: ${inc.severity || 'N/A'})`, ctx.margin, ctx.yPos);
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
  if (!hasPersons && !hasProtocols) return;
  
  ctx.renderSectionHeader('Family & VIP Protection', [0, 100, 150]);
  
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
  if (!Array.isArray(data.economicThreats) || !data.economicThreats.length) return;
  
  ctx.renderSectionHeader('Economic Warfare Assessment', [150, 50, 50]);
  const threats = data.economicThreats as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(255, 245, 245);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  threats.slice(0, 3).forEach((threat) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${threat.threat_type || 'Economic Threat'}`);
    doc.setFontSize(9);
    if (threat.financial_exposure !== undefined) {
      doc.text(`Financial Exposure: $${(threat.financial_exposure as number).toLocaleString()}`, ctx.margin, ctx.yPos);
      ctx.yPos += ctx.lineHeight;
    }
    doc.text(`Status: ${threat.status || 'Active'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight + 5;
  });
  ctx.yPos += 8;
};

// ============================================
// TSCM Sweep Renderer (v5.0)
// ============================================
export const renderTscmSweep: SectionRenderer = (ctx, data) => {
  const { doc } = ctx;
  if (!Array.isArray(data.tscmSweeps) || !data.tscmSweeps.length) return;
  
  ctx.renderSectionHeader('TSCM Sweep Results', [50, 100, 150]);
  const sweeps = data.tscmSweeps as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(245, 250, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  sweeps.slice(0, 3).forEach((sweep) => {
    ctx.checkPageBreak(25);
    ctx.renderSubsection(`${sweep.sweep_type || 'TSCM Sweep'} - ${sweep.location || 'Unknown Location'}`);
    doc.setFontSize(9);
    doc.text(`Date: ${sweep.sweep_date || 'N/A'} | Status: ${sweep.status || 'Completed'}`, ctx.margin, ctx.yPos);
    ctx.yPos += ctx.lineHeight;
    
    if (sweep.devices_detected) {
      const devices = sweep.devices_detected as any[];
      if (devices.length > 0) {
        doc.setTextColor(200, 0, 0);
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
  if (!Array.isArray(data.digitalFootprints) || !data.digitalFootprints.length) return;
  
  ctx.renderSectionHeader('Digital Footprint Analysis', [100, 0, 150]);
  const items = data.digitalFootprints as Array<Record<string, unknown>>;
  
  ctx.checkPageBreak(50);
  doc.setFillColor(250, 245, 255);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${items.length} Digital Footprint Items Discovered`, ctx.margin + 5, ctx.yPos + 8);
  ctx.yPos += 15;
  
  // Group by platform
  const platforms = new Set(items.map(i => i.platform as string));
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  Array.from(platforms).slice(0, 5).forEach(platform => {
    const count = items.filter(i => i.platform === platform).length;
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
  if (!Array.isArray(data.behavioralBaselines) || !data.behavioralBaselines.length) return;
  
  ctx.renderSectionHeader('Behavioral Baseline', [0, 128, 100]);
  const baseline = (data.behavioralBaselines as Array<Record<string, unknown>>)[0];
  
  ctx.checkPageBreak(50);
  doc.setFillColor(240, 255, 250);
  doc.roundedRect(ctx.margin, ctx.yPos - 3, ctx.contentWidth, 45, 3, 3, 'F');
  
  doc.setFontSize(10);
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
};
