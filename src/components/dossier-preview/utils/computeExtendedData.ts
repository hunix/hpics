/**
 * Compute Extended Dossier Data (v3.9.50)
 * Transforms raw DossierDataResult into ExtendedDossierData for rendering
 * Includes email intelligence, v5.0 fusion, and v6.0 advanced intelligence in completeness score
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

  // Calculate intelligence completeness (expanded to 19 sources for v6.0)
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
  };
}
