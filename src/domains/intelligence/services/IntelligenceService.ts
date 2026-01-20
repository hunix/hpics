/**
 * Intelligence Service - Core domain service for intelligence operations
 * 
 * Coordinates analysis execution, dossier generation, and insight management.
 * Follows DDD principles - uses repositories instead of direct Supabase access.
 */

import { supabase } from '@/integrations/supabase/client';
import { Analysis, AnalysisType, AnalysisResult, AnalysisMetadata } from '../entities/Analysis';
import { Dossier, DossierTemplate, ExecutiveSummary, ThreatAssessment, DossierSection } from '../entities/Dossier';
import { Insight, InsightCategory, InsightPriority, InsightActionability, InsightEvidence } from '../entities/Insight';
import { IAnalysisRepository, IDossierRepository, IInsightRepository } from '../repositories/IAnalysisRepository';
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
  private analysisRepository: IAnalysisRepository | null = null;
  private dossierRepository: IDossierRepository | null = null;
  private insightRepository: IInsightRepository | null = null;

  constructor(
    analysisRepo?: IAnalysisRepository,
    dossierRepo?: IDossierRepository,
    insightRepo?: IInsightRepository
  ) {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yibszncvwmefwamayfty';
    this.edgeFunctionBaseUrl = `https://${projectId}.supabase.co/functions/v1`;
    
    // Accept optional repository injection for DDD compliance
    if (analysisRepo) this.analysisRepository = analysisRepo;
    if (dossierRepo) this.dossierRepository = dossierRepo;
    if (insightRepo) this.insightRepository = insightRepo;
  }

  /**
   * Set repositories (for DI container injection)
   */
  setRepositories(
    analysisRepo: IAnalysisRepository,
    dossierRepo: IDossierRepository,
    insightRepo: IInsightRepository
  ): void {
    this.analysisRepository = analysisRepo;
    this.dossierRepository = dossierRepo;
    this.insightRepository = insightRepo;
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

        const response = await supabase.functions.invoke(edgeFunctionName, {
          body: {
            profileId: request.profileId,
            sourceIds: request.sourceIds,
            options: request.options,
          },
        });

        if (response.error) {
          await eventBus.publish(new AnalysisFailed(request.profileId, analysisType, response.error.message));
          continue;
        }

        const data = response.data;
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
      const response = await supabase.functions.invoke('generate-intelligence-dossier', {
        body: {
          profileId: request.profileId,
          template: request.template,
          options: request.options,
        },
      });

      if (response.error) {
        console.error('[IntelligenceService] Dossier generation failed:', response.error.message);
        return null;
      }

      const data = response.data;

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
   * Get the latest dossier for a profile - uses repository if available
   */
  async getLatestDossier(profileId: string): Promise<Dossier | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Use repository if available (DDD compliant)
    if (this.dossierRepository) {
      return this.dossierRepository.findLatest(session.user.id, profileId);
    }

    // Fallback to direct query (deprecated pattern)
    console.warn('[IntelligenceService] Using direct Supabase query - inject repository for DDD compliance');
    const { data } = await supabase
      .from('dossiers')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return this.mapRowToDossier(data);
  }

  /**
   * Get analyses for a profile - uses repository if available
   */
  async getAnalyses(profileId: string, analysisType?: AnalysisType): Promise<Analysis[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Use repository if available (DDD compliant)
    if (this.analysisRepository) {
      return this.analysisRepository.findByProfile(session.user.id, profileId, {
        types: analysisType ? [analysisType] : undefined
      });
    }

    // Fallback to direct query (deprecated pattern)
    console.warn('[IntelligenceService] Using direct Supabase query - inject repository for DDD compliance');
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
   * Get active insights for a profile - uses repository if available
   */
  async getActiveInsights(profileId: string): Promise<Insight[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];

    // Use repository if available (DDD compliant)
    if (this.insightRepository) {
      return this.insightRepository.findActive(session.user.id, profileId);
    }

    // Fallback to direct query (deprecated pattern)
    console.warn('[IntelligenceService] Using direct Supabase query - inject repository for DDD compliance');
    const { data } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('profile_id', profileId)
      .in('status', ['pending', 'viewed'])
      .order('priority_score', { ascending: false });

    if (!data) return [];
    return (data as unknown as Record<string, unknown>[]).map((row) => this.mapRowToInsight(row));
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
      const response = await supabase.functions.invoke('aggregate-media-intelligence', {
        body: { profileId },
      });

      if (!response.error && response.data) {
        const data = response.data;
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

  private mapRowToAnalysis(row: Record<string, unknown>): Analysis {
    return new Analysis(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      row.analysis_type as AnalysisType,
      'completed',
      (row.result as Record<string, unknown>)?.confidence as number || 0.5,
      row.result as AnalysisResult | null,
      null,
      [],
      null,
      new Date(row.generated_at as string),
      new Date(row.generated_at as string),
      new Date(row.generated_at as string)
    );
  }

  private mapRowToDossier(row: Record<string, unknown>): Dossier {
    const rawStatus = (row.status as string) || 'complete';
    // Map to valid DossierStatus values
    const validStatuses: Record<string, 'draft' | 'generating' | 'complete' | 'archived'> = {
      'draft': 'draft',
      'generating': 'generating',
      'complete': 'complete',
      'archived': 'archived',
      'failed': 'draft', // Map failed to draft
    };
    const status = validStatuses[rawStatus] || 'complete';
    
    return new Dossier(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      (row.template as DossierTemplate) || 'full',
      status,
      (row.overall_confidence as number) || 0.5,
      row.executive_summary as ExecutiveSummary,
      row.threat_assessment as ThreatAssessment,
      (row.sections as DossierSection[]) || [],
      (row.sources_used as string[]) || [],
      row.generated_at ? new Date(row.generated_at as string) : null,
      (row.version as number) || 1,
      new Date(row.created_at as string),
      new Date((row.updated_at as string) || (row.created_at as string))
    );
  }

  private mapRowToInsight(row: Record<string, unknown>): Insight {
    return new Insight(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      (row.category as InsightCategory) || 'behavioral',
      this.mapPriorityScore(row.priority_score as number),
      row.urgency === 'urgent' ? 'urgent' : 'actionable',
      row.title as string,
      row.description as string,
      (row.success_probability as number) || 0.5,
      (row.supporting_evidence as InsightEvidence[]) || [],
      [],
      row.expires_at ? new Date(row.expires_at as string) : null,
      row.status === 'actioned',
      row.actioned_at ? new Date(row.actioned_at as string) : null,
      new Date(row.created_at as string),
      new Date(row.created_at as string)
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

/**
 * Reset singleton (for testing or DI reinitialization)
 */
export function resetIntelligenceService(): void {
  intelligenceServiceInstance = null;
}
