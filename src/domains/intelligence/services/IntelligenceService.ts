/**
 * Intelligence Service - Core domain service for intelligence operations
 * 
 * Coordinates analysis execution, dossier generation, and insight management.
 */

import { supabase } from '@/integrations/supabase/client';
import { Analysis, AnalysisType, AnalysisResult, AnalysisMetadata } from '../entities/Analysis';
import { Dossier, DossierTemplate, ExecutiveSummary, ThreatAssessment, DossierSection } from '../entities/Dossier';
import { Insight, InsightCategory, InsightPriority, InsightActionability, InsightEvidence } from '../entities/Insight';
import { getEventBus } from '@/domains/shared';
import { 
  AnalysisCompleted, 
  AnalysisFailed, 
  DossierGenerated, 
  InsightDiscovered,
  IntelligenceAggregated 
} from '../events/IntelligenceEvents';

export interface AnalysisRequest {
  profileId: string;
  analysisTypes: AnalysisType[];
  sourceIds?: string[];
  options?: {
    forceRefresh?: boolean;
    deepAnalysis?: boolean;
  };
}

export interface DossierRequest {
  profileId: string;
  template: DossierTemplate;
  options?: {
    includeWarfare?: boolean;
    includeFusion?: boolean;
    forceRefresh?: boolean;
  };
}

export interface IntelligenceSummary {
  profileId: string;
  analysisCount: number;
  latestAnalysisDate: Date | null;
  dossierStatus: 'none' | 'draft' | 'complete' | 'stale';
  activeInsights: number;
  riskLevel: string;
  recommendations: string[];
}

export class IntelligenceService {
  private edgeFunctionBaseUrl: string;

  constructor() {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yibszncvwmefwamayfty';
    this.edgeFunctionBaseUrl = `https://${projectId}.supabase.co/functions/v1`;
  }

  /**
   * Run analyses for a profile
   */
  async runAnalyses(request: AnalysisRequest): Promise<Analysis[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const results: Analysis[] = [];
    const eventBus = getEventBus();

    for (const analysisType of request.analysisTypes) {
      try {
        const edgeFunctionName = this.getEdgeFunctionForAnalysis(analysisType);
        const startTime = Date.now();

        const response = await fetch(`${this.edgeFunctionBaseUrl}/${edgeFunctionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            profileId: request.profileId,
            sourceIds: request.sourceIds,
            options: request.options,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          await eventBus.publish(new AnalysisFailed(request.profileId, analysisType, errorText));
          continue;
        }

        const data = await response.json();
        const processingTimeMs = Date.now() - startTime;

        const analysis = new Analysis(
          crypto.randomUUID(),
          request.profileId,
          session.user.id,
          analysisType,
          'completed',
          data.confidence || 0.7,
          {
            summary: data.summary || '',
            insights: data.insights || [],
            riskFactors: data.riskFactors || [],
            recommendations: data.recommendations || [],
            rawData: data,
          },
          {
            modelUsed: data.model || 'unknown',
            tokensConsumed: data.tokens || 0,
            costCents: data.costCents || 0,
            processingTimeMs,
            sourceCount: request.sourceIds?.length || 0,
          },
          request.sourceIds || [],
          null,
          new Date()
        );

        results.push(analysis);

        await eventBus.publish(new AnalysisCompleted(
          request.profileId,
          analysis.id,
          analysisType,
          analysis.confidenceValue,
          analysis.result?.insights.length || 0
        ));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await eventBus.publish(new AnalysisFailed(request.profileId, analysisType, errorMessage));
      }
    }

    return results;
  }

  /**
   * Generate a dossier for a profile
   */
  async generateDossier(request: DossierRequest): Promise<Dossier | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
      const response = await fetch(`${this.edgeFunctionBaseUrl}/generate-intelligence-dossier`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: request.profileId,
          template: request.template,
          options: request.options,
        }),
      });

      if (!response.ok) {
        console.error('[IntelligenceService] Dossier generation failed:', await response.text());
        return null;
      }

      const data = await response.json();

      const dossier = new Dossier(
        data.id || crypto.randomUUID(),
        request.profileId,
        session.user.id,
        request.template,
        'complete',
        data.overallConfidence || 0.7,
        data.executiveSummary,
        data.threatAssessment,
        data.sections || [],
        data.sourcesUsed || [],
        new Date(),
        data.version || 1
      );

      const eventBus = getEventBus();
      await eventBus.publish(new DossierGenerated(
        request.profileId,
        dossier.id,
        request.template,
        dossier.sectionCount,
        dossier.confidenceValue
      ));

      return dossier;
    } catch (error) {
      console.error('[IntelligenceService] Dossier generation error:', error);
      return null;
    }
  }

  /**
   * Get the latest dossier for a profile
   */
  async getLatestDossier(profileId: string): Promise<Dossier | null> {
    const { data } = await supabase
      .from('dossiers')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return this.mapRowToDossier(data);
  }

  /**
   * Get analyses for a profile
   */
  async getAnalyses(profileId: string, analysisType?: AnalysisType): Promise<Analysis[]> {
    let query = supabase
      .from('ai_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .order('generated_at', { ascending: false });

    if (analysisType) {
      query = query.eq('analysis_type', analysisType);
    }

    const { data } = await query;
    if (!data) return [];

    return data.map(row => this.mapRowToAnalysis(row));
  }

  /**
   * Get active insights for a profile
   */
  async getActiveInsights(profileId: string): Promise<Insight[]> {
    const { data } = await (supabase as any)
      .from('action_recommendations')
      .select('*')
      .eq('profile_id', profileId)
      .in('status', ['pending', 'viewed'])
      .order('priority_score', { ascending: false });

    if (!data) return [];

    return data.map((row: any) => this.mapRowToInsight(row));
  }

  /**
   * Get intelligence summary for a profile
   */
  async getIntelligenceSummary(profileId: string): Promise<IntelligenceSummary> {
    const [analyses, dossier, insights] = await Promise.all([
      this.getAnalyses(profileId),
      this.getLatestDossier(profileId),
      this.getActiveInsights(profileId),
    ]);

    const latestAnalysis = analyses[0];
    
    let dossierStatus: 'none' | 'draft' | 'complete' | 'stale' = 'none';
    if (dossier) {
      if (dossier.isStale(24)) {
        dossierStatus = 'stale';
      } else {
        dossierStatus = dossier.status === 'complete' ? 'complete' : 'draft';
      }
    }

    const recommendations: string[] = [];
    if (analyses.length === 0) {
      recommendations.push('Run initial analysis to generate insights');
    }
    if (dossierStatus === 'none' || dossierStatus === 'stale') {
      recommendations.push('Generate or refresh intelligence dossier');
    }
    if (insights.filter(i => i.requiresAction()).length > 0) {
      recommendations.push('Review and address actionable insights');
    }

    return {
      profileId,
      analysisCount: analyses.length,
      latestAnalysisDate: latestAnalysis?.completedAt || null,
      dossierStatus,
      activeInsights: insights.length,
      riskLevel: dossier?.getRiskLevel() || 'minimal',
      recommendations,
    };
  }

  /**
   * Aggregate intelligence from multiple sources
   */
  async aggregateIntelligence(profileId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const response = await fetch(`${this.edgeFunctionBaseUrl}/aggregate-media-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ profileId }),
      });

      if (response.ok) {
        const data = await response.json();
        const eventBus = getEventBus();
        await eventBus.publish(new IntelligenceAggregated(
          profileId,
          data.sourcesAggregated || 0,
          data.newInsights || 0
        ));
      }
    } catch (error) {
      console.error('[IntelligenceService] Aggregation error:', error);
    }
  }

  // Private helpers

  private getEdgeFunctionForAnalysis(analysisType: AnalysisType): string {
    const mapping: Record<AnalysisType, string> = {
      'behavioral': 'analyze-behavioral-dna',
      'psychological': 'deep-psychological-intel',
      'communication': 'analyze-media-deep',
      'network': 'aggregate-media-intelligence',
      'biometric': 'analyze-media-deep',
      'voice': 'analyze-voice-comprehensive',
      'facial': 'analyze-media-deep',
      'document': 'analyze-media-deep',
      'comprehensive': 'generate-intelligence-dossier',
    };
    return mapping[analysisType] || 'analyze-media-deep';
  }

  private mapRowToAnalysis(row: any): Analysis {
    return new Analysis(
      row.id,
      row.profile_id,
      row.user_id,
      row.analysis_type as AnalysisType,
      'completed',
      row.result?.confidence || 0.5,
      row.result,
      null,
      [],
      null,
      new Date(row.generated_at),
      new Date(row.generated_at),
      new Date(row.generated_at)
    );
  }

  private mapRowToDossier(row: any): Dossier {
    return new Dossier(
      row.id,
      row.profile_id,
      row.user_id,
      row.template || 'full',
      row.status || 'complete',
      row.overall_confidence || 0.5,
      row.executive_summary,
      row.threat_assessment,
      row.sections || [],
      row.sources_used || [],
      row.generated_at ? new Date(row.generated_at) : null,
      row.version || 1,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private mapRowToInsight(row: any): Insight {
    return new Insight(
      row.id,
      row.profile_id,
      row.user_id,
      row.category || 'behavioral',
      this.mapPriorityScore(row.priority_score),
      row.urgency === 'urgent' ? 'urgent' : 'actionable',
      row.title,
      row.description,
      row.success_probability || 0.5,
      row.supporting_evidence || [],
      [],
      row.expires_at ? new Date(row.expires_at) : null,
      row.status === 'actioned',
      row.actioned_at ? new Date(row.actioned_at) : null,
      new Date(row.created_at),
      new Date(row.created_at)
    );
  }

  private mapPriorityScore(score: number): InsightPriority {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

// Singleton instance
let intelligenceServiceInstance: IntelligenceService | null = null;

export function getIntelligenceService(): IntelligenceService {
  if (!intelligenceServiceInstance) {
    intelligenceServiceInstance = new IntelligenceService();
  }
  return intelligenceServiceInstance;
}
