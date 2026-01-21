/**
 * Compute Extended Dossier Data (v3.9.34)
 * Transforms raw DossierDataResult into ExtendedDossierData for rendering
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
  avgTrustScore: number;
  communicationFrequency: number;
  [key: string]: unknown;
}

export function computeExtendedDossierData(
  raw: DossierDataResult,
  contactName: string
): ExtendedDossierData {
  // Calculate intelligence completeness
  const sourceChecks = [
    raw.psychData?.length > 0,
    raw.miceData?.length > 0,
    raw.influenceData !== null,
    raw.mediaData?.length > 0,
    raw.voiceData?.length > 0,
    raw.observationsData?.length > 0,
    raw.trustData?.length > 0,
    raw.relationshipsData?.length > 0,
    raw.allAnalyses?.length > 0,
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
    avgTrustScore,
    communicationFrequency: recentComms,
  };
}
