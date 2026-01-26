/**
 * Compute Extended Dossier Data (v8.0)
 * Transforms raw DossierDataResult into ExtendedDossierData for rendering
 * Includes email intelligence, v5.0 fusion, v6.0 advanced, v7.0 extreme, and v8.0 masterpiece intelligence in completeness score
 */

import type { DossierDataResult } from '@/components/reports/hooks/useDossierData';

export interface ExtendedDossierData extends DossierDataResult {
  contactName: string;
  intelligenceCompleteness: number;
  totalMediaAnalyzed: number;
  totalVoiceSessions: number;
  totalAnomalies: number;
  behavioralDnaAnalysis?: { result: unknown };
  relationshipAnalysis?: { result: unknown };
  emailInsightsAnalysis?: { result: unknown };
  avgTrustScore: number;
  communicationFrequency: number;
  hasEmailIntelligence: boolean;
  emailInsightsCount: number;
  // v5.0 Fusion Intelligence
  hasBiometricFusion: boolean;
  hasCalendarIntelligence: boolean;
  hasGeospatialFusion: boolean;
  hasFinancialSynthesis: boolean;
  // v6.0 Advanced Intelligence
  hasRelationshipHalfLife: boolean;
  hasRedTeamAssessment: boolean;
  hasMultiPartyDeception: boolean;
  hasZeroDayAnomalies: boolean;
  hasHypergameAnalysis: boolean;
  // v7.0 Extreme Intelligence
  hasSubvocalization: boolean;
  hasAudioBurstAnalysis: boolean;
  hasIioAttribution: boolean;
  hasReflexiveControl: boolean;
  hasCognitiveEffect: boolean;
  hasTheoryOfMind: boolean;
  hasCollectiveBehavior: boolean;
  hasStylometricAnalysis: boolean;
  hasDark2Clear: boolean;
  hasGatedBioFusion: boolean;
  hasTasComCommunity: boolean;
  hasBiometricRetention: boolean;
  // v8.0 Masterpiece Intelligence - Phase 1
  hasDracoDeception: boolean;
  hasSentientIntent: boolean;
  hasInsiderThreat: boolean;
  hasBayesianIntention: boolean;
  hasRedTeamAdversary: boolean;
  hasSemaforForgery: boolean;
  hasEpistemicVulnerability: boolean;
  hasCognitiveIw: boolean;
  // v8.0 Masterpiece Intelligence - Phase 2
  hasPsychoagentCascade: boolean;
  hasAffectiveManipulation: boolean;
  hasHyperpersonalization: boolean;
  hasComputationalPersuasion: boolean;
  hasSyntheticMemory: boolean;
  hasPreMemBelief: boolean;
  hasLinguisticStress: boolean;
  hasMemoryAnchor: boolean;
  hasEmotionalContagion: boolean;
  hasSacredValuePredictor: boolean;
  // v8.0 Masterpiece Intelligence - Phase 3
  hasPupillometry: boolean;
  hasThermalStress: boolean;
  hasAttentionFuser: boolean;
  hasKeystrokeDynamics: boolean;
  hasSheafNeural: boolean;
  hasCtdgLink: boolean;
  hasCascadeVirality: boolean;
  hasNetworkResilience: boolean;
  // v8.0 Masterpiece Intelligence - Phase 4
  hasGazePattern: boolean;
  hasMicroExpression: boolean;
  hasVoiceStressCorrelator: boolean;
  hasSocialGraphPredictor: boolean;
  hasInfluenceCampaign: boolean;
  hasCounterNarrative: boolean;
  hasPredictiveDoctrine: boolean;
  hasCognitiveDefense: boolean;
  hasBehavioralFingerprint: boolean;
  [key: string]: unknown;
}

export function computeExtendedDossierData(
  raw: DossierDataResult,
  contactName: string
): ExtendedDossierData {
  // Find email insights from allAnalyses
  const emailInsights = raw.allAnalyses?.filter(
    (a: any) => a.analysis_type === 'email_insight'
  ) || [];
  const hasEmailIntelligence = emailInsights.length > 0;
  const emailInsightsCount = emailInsights.length;
  const emailInsightsAnalysis = emailInsights[0] ? { result: emailInsights[0].result } : undefined;

  // v5.0 Fusion Intelligence checks
  const hasBiometricFusion = (raw.biometricBehavioralFusion?.length ?? 0) > 0;
  const hasCalendarIntelligence = (raw.calendarPatternAnalysis?.length ?? 0) > 0;
  const hasGeospatialFusion = (raw.geospatialCommunicationFusion?.length ?? 0) > 0;
  const hasFinancialSynthesis = (raw.financialDocumentSynthesis?.length ?? 0) > 0;

  // v6.0 Advanced Intelligence checks
  const hasRelationshipHalfLife = (raw.relationshipHalfLifeData?.length ?? 0) > 0;
  const hasRedTeamAssessment = (raw.automatedRedTeamData?.length ?? 0) > 0;
  const hasMultiPartyDeception = (raw.multiPartyDeceptionData?.length ?? 0) > 0;
  const hasZeroDayAnomalies = (raw.zeroDayAnomalyData?.length ?? 0) > 0;
  const hasHypergameAnalysis = (raw.hypergameTheoryData?.length ?? 0) > 0;

  // v7.0 Extreme Intelligence checks
  const hasSubvocalization = (raw.subvocalizationData?.length ?? 0) > 0;
  const hasAudioBurstAnalysis = (raw.audioBurstData?.length ?? 0) > 0;
  const hasIioAttribution = (raw.iioAttributionData?.length ?? 0) > 0;
  const hasReflexiveControl = (raw.reflexiveControlData?.length ?? 0) > 0;
  const hasCognitiveEffect = (raw.cognitiveEffectData?.length ?? 0) > 0;
  const hasTheoryOfMind = (raw.theoryOfMindData?.length ?? 0) > 0;
  const hasCollectiveBehavior = (raw.collectiveBehaviorData?.length ?? 0) > 0;
  const hasStylometricAnalysis = (raw.stylometricData?.length ?? 0) > 0;
  const hasDark2Clear = (raw.dark2ClearData?.length ?? 0) > 0;
  const hasGatedBioFusion = (raw.gatedBioFusionData?.length ?? 0) > 0;
  const hasTasComCommunity = (raw.tasComCommunityData?.length ?? 0) > 0;
  const hasBiometricRetention = (raw.biometricRetentionData?.length ?? 0) > 0;

  // v8.0 Masterpiece Intelligence checks - Phase 1 (Counter-Intelligence)
  const hasDracoDeception = (raw.dracoDeceptionData?.length ?? 0) > 0;
  const hasSentientIntent = (raw.sentientIntentData?.length ?? 0) > 0;
  const hasInsiderThreat = (raw.insiderThreatData?.length ?? 0) > 0;
  const hasBayesianIntention = (raw.bayesianIntentionData?.length ?? 0) > 0;
  const hasRedTeamAdversary = (raw.redTeamAdversaryData?.length ?? 0) > 0;
  const hasSemaforForgery = (raw.semaforForgeryData?.length ?? 0) > 0;
  const hasEpistemicVulnerability = (raw.epistemicVulnerabilityData?.length ?? 0) > 0;
  const hasCognitiveIw = (raw.cognitiveIwData?.length ?? 0) > 0;

  // v8.0 Masterpiece Intelligence checks - Phase 2 (Psychological Warfare)
  const hasPsychoagentCascade = (raw.psychoagentCascadeData?.length ?? 0) > 0;
  const hasAffectiveManipulation = (raw.affectiveManipulationData?.length ?? 0) > 0;
  const hasHyperpersonalization = (raw.hyperpersonalizationData?.length ?? 0) > 0;
  const hasComputationalPersuasion = (raw.computationalPersuasionData?.length ?? 0) > 0;
  const hasSyntheticMemory = (raw.syntheticMemoryData?.length ?? 0) > 0;
  const hasPreMemBelief = (raw.prememBeliefData?.length ?? 0) > 0;
  const hasLinguisticStress = (raw.linguisticStressData?.length ?? 0) > 0;
  const hasMemoryAnchor = (raw.memoryAnchorData?.length ?? 0) > 0;
  const hasEmotionalContagion = (raw.emotionalContagionData?.length ?? 0) > 0;
  const hasSacredValuePredictor = (raw.sacredValuePredictorData?.length ?? 0) > 0;

  // v8.0 Masterpiece Intelligence checks - Phase 3 (Biometric & Network)
  const hasPupillometry = (raw.pupillometryData?.length ?? 0) > 0;
  const hasThermalStress = (raw.thermalStressData?.length ?? 0) > 0;
  const hasAttentionFuser = (raw.attentionFuserData?.length ?? 0) > 0;
  const hasKeystrokeDynamics = (raw.keystrokeDynamicsData?.length ?? 0) > 0;
  const hasSheafNeural = (raw.sheafNeuralData?.length ?? 0) > 0;
  const hasCtdgLink = (raw.ctdgLinkData?.length ?? 0) > 0;
  const hasCascadeVirality = (raw.cascadeViralityData?.length ?? 0) > 0;
  const hasNetworkResilience = (raw.networkResilienceData?.length ?? 0) > 0;

  // v8.0 Masterpiece Intelligence checks - Phase 4 (Doctrine & Prediction)
  const hasGazePattern = (raw.gazePatternData?.length ?? 0) > 0;
  const hasMicroExpression = (raw.microExpressionData?.length ?? 0) > 0;
  const hasVoiceStressCorrelator = (raw.voiceStressCorrelatorData?.length ?? 0) > 0;
  const hasSocialGraphPredictor = (raw.socialGraphPredictorData?.length ?? 0) > 0;
  const hasInfluenceCampaign = (raw.influenceCampaignData?.length ?? 0) > 0;
  const hasCounterNarrative = (raw.counterNarrativeData?.length ?? 0) > 0;
  const hasPredictiveDoctrine = (raw.predictiveDoctrineData?.length ?? 0) > 0;
  const hasCognitiveDefense = (raw.cognitiveDefenseData?.length ?? 0) > 0;
  const hasBehavioralFingerprint = (raw.behavioralFingerprintData?.length ?? 0) > 0;

  // Calculate intelligence completeness (expanded to 66 sources for v8.0)
  const sourceChecks = [
    // Core sources (10)
    raw.psychData?.length > 0,
    raw.miceData?.length > 0,
    raw.influenceData !== null,
    raw.mediaData?.length > 0,
    raw.voiceData?.length > 0,
    raw.observationsData?.length > 0,
    raw.trustData?.length > 0,
    raw.relationshipsData?.length > 0,
    raw.allAnalyses?.length > 0,
    hasEmailIntelligence,
    // v5.0 Fusion (4)
    hasBiometricFusion,
    hasCalendarIntelligence,
    hasGeospatialFusion,
    hasFinancialSynthesis,
    // v6.0 Advanced (5)
    hasRelationshipHalfLife,
    hasRedTeamAssessment,
    hasMultiPartyDeception,
    hasZeroDayAnomalies,
    hasHypergameAnalysis,
    // v7.0 Extreme (12)
    hasSubvocalization,
    hasAudioBurstAnalysis,
    hasIioAttribution,
    hasReflexiveControl,
    hasCognitiveEffect,
    hasTheoryOfMind,
    hasCollectiveBehavior,
    hasStylometricAnalysis,
    hasDark2Clear,
    hasGatedBioFusion,
    hasTasComCommunity,
    hasBiometricRetention,
    // v8.0 Phase 1: Counter-Intelligence (8)
    hasDracoDeception,
    hasSentientIntent,
    hasInsiderThreat,
    hasBayesianIntention,
    hasRedTeamAdversary,
    hasSemaforForgery,
    hasEpistemicVulnerability,
    hasCognitiveIw,
    // v8.0 Phase 2: Psychological Warfare (10)
    hasPsychoagentCascade,
    hasAffectiveManipulation,
    hasHyperpersonalization,
    hasComputationalPersuasion,
    hasSyntheticMemory,
    hasPreMemBelief,
    hasLinguisticStress,
    hasMemoryAnchor,
    hasEmotionalContagion,
    hasSacredValuePredictor,
    // v8.0 Phase 3: Biometric & Network (8)
    hasPupillometry,
    hasThermalStress,
    hasAttentionFuser,
    hasKeystrokeDynamics,
    hasSheafNeural,
    hasCtdgLink,
    hasCascadeVirality,
    hasNetworkResilience,
    // v8.0 Phase 4: Doctrine & Prediction (9)
    hasGazePattern,
    hasMicroExpression,
    hasVoiceStressCorrelator,
    hasSocialGraphPredictor,
    hasInfluenceCampaign,
    hasCounterNarrative,
    hasPredictiveDoctrine,
    hasCognitiveDefense,
    hasBehavioralFingerprint,
  ];
  const intelligenceCompleteness = Math.round(
    (sourceChecks.filter(Boolean).length / sourceChecks.length) * 100
  );

  // Find behavioral DNA analysis
  const behavioralDnaRaw = raw.allAnalyses?.find(
    (a: any) => a.analysis_type === 'behavioral_dna'
  );
  const behavioralDnaAnalysis = behavioralDnaRaw ? { result: behavioralDnaRaw.result } : undefined;

  // Find relationship analysis
  const relationshipRaw = raw.allAnalyses?.find(
    (a: any) => a.analysis_type === 'behavioral_dna' || a.analysis_type === 'relationship_dynamics'
  );
  const relationshipAnalysis = relationshipRaw ? { result: relationshipRaw.result } : undefined;

  // Calculate averages
  const avgTrustScore = raw.trustData?.length
    ? (raw.trustData as any[]).reduce((acc, t) => acc + (t.overall_trust_score || 0), 0) / raw.trustData.length
    : 0;

  // Communication frequency (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentComms = raw.commData?.filter((c: any) => 
    new Date(c.communication_date) > thirtyDaysAgo
  ).length || 0;

  return {
    ...raw,
    contactName,
    intelligenceCompleteness,
    totalMediaAnalyzed: raw.mediaData?.length || 0,
    totalVoiceSessions: raw.voiceData?.length || 0,
    totalAnomalies: raw.anomaliesData?.length || 0,
    behavioralDnaAnalysis,
    relationshipAnalysis,
    emailInsightsAnalysis,
    avgTrustScore,
    communicationFrequency: recentComms,
    hasEmailIntelligence,
    emailInsightsCount,
    // v5.0 Fusion Intelligence
    hasBiometricFusion,
    hasCalendarIntelligence,
    hasGeospatialFusion,
    hasFinancialSynthesis,
    // v6.0 Advanced Intelligence
    hasRelationshipHalfLife,
    hasRedTeamAssessment,
    hasMultiPartyDeception,
    hasZeroDayAnomalies,
    hasHypergameAnalysis,
    // v7.0 Extreme Intelligence
    hasSubvocalization,
    hasAudioBurstAnalysis,
    hasIioAttribution,
    hasReflexiveControl,
    hasCognitiveEffect,
    hasTheoryOfMind,
    hasCollectiveBehavior,
    hasStylometricAnalysis,
    hasDark2Clear,
    hasGatedBioFusion,
    hasTasComCommunity,
    hasBiometricRetention,
    // v8.0 Phase 1: Counter-Intelligence
    hasDracoDeception,
    hasSentientIntent,
    hasInsiderThreat,
    hasBayesianIntention,
    hasRedTeamAdversary,
    hasSemaforForgery,
    hasEpistemicVulnerability,
    hasCognitiveIw,
    // v8.0 Phase 2: Psychological Warfare
    hasPsychoagentCascade,
    hasAffectiveManipulation,
    hasHyperpersonalization,
    hasComputationalPersuasion,
    hasSyntheticMemory,
    hasPreMemBelief,
    hasLinguisticStress,
    hasMemoryAnchor,
    hasEmotionalContagion,
    hasSacredValuePredictor,
    // v8.0 Phase 3: Biometric & Network
    hasPupillometry,
    hasThermalStress,
    hasAttentionFuser,
    hasKeystrokeDynamics,
    hasSheafNeural,
    hasCtdgLink,
    hasCascadeVirality,
    hasNetworkResilience,
    // v8.0 Phase 4: Doctrine & Prediction
    hasGazePattern,
    hasMicroExpression,
    hasVoiceStressCorrelator,
    hasSocialGraphPredictor,
    hasInfluenceCampaign,
    hasCounterNarrative,
    hasPredictiveDoctrine,
    hasCognitiveDefense,
    hasBehavioralFingerprint,
  };
}
