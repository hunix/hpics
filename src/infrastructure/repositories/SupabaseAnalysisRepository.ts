/**
 * Supabase Analysis Repository Implementation
 * 
 * Implements IAnalysisRepository, IDossierRepository, and IInsightRepository
 * using Supabase as the data store.
 * 
 * Note: These repositories work with the domain entity classes and handle
 * the mapping between database rows and domain objects.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IAnalysisRepository, 
  IDossierRepository, 
  IInsightRepository,
  AnalysisQueryOptions,
  DossierQueryOptions,
  InsightQueryOptions 
} from '@/domains/intelligence/repositories/IAnalysisRepository';
import { Analysis, AnalysisType, AnalysisStatus, AnalysisResult, AnalysisMetadata } from '@/domains/intelligence/entities/Analysis';
import { Dossier, DossierTemplate, DossierStatus, DossierSection, ExecutiveSummary, ThreatAssessment } from '@/domains/intelligence/entities/Dossier';
import { Insight, InsightCategory, InsightPriority, InsightActionability } from '@/domains/intelligence/entities/Insight';
import { PaginatedResult, QuerySpec } from '@/domains/shared/repositories/BaseRepository';

export class SupabaseAnalysisRepository implements IAnalysisRepository {
  
  async findById(id: string): Promise<Analysis | null> {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToAnalysis(data) : null;
  }

  async findAll(): Promise<Analysis[]> {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToAnalysis(row));
  }

  async findByUserId(userId: string): Promise<Analysis[]> {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToAnalysis(row));
  }

  async findBySpec(spec: QuerySpec<Analysis>): Promise<PaginatedResult<Analysis>> {
    const items = await this.findAll();
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async findByUserIdAndSpec(userId: string, spec: QuerySpec<Analysis>): Promise<PaginatedResult<Analysis>> {
    const items = await this.findByUserId(userId);
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async save(entity: Analysis): Promise<Analysis> {
    const { error } = await supabase
      .from('analysis_events')
      .upsert({
        id: entity.id,
        user_id: entity.userId,
        profile_id: entity.profileId,
        analysis_type: entity.analysisType,
        event_type: entity.status,
        raw_result: entity.result || {},
        confidence_score: entity.confidenceValue,
        created_at: entity.createdAt.toISOString(),
        event_hash: entity.id
      });

    if (error) throw error;
    return entity;
  }

  async saveMany(entities: Analysis[]): Promise<Analysis[]> {
    for (const entity of entities) {
      await this.save(entity);
    }
    return entities;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('analysis_events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('analysis_events')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('analysis_events')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async findByProfile(
    userId: string,
    profileId: string,
    options?: AnalysisQueryOptions
  ): Promise<Analysis[]> {
    let query = supabase
      .from('analysis_events')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (options?.types?.length) {
      query = query.in('analysis_type', options.types);
    }

    if (options?.minConfidence) {
      query = query.gte('confidence_score', options.minConfidence);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map(row => this.mapToAnalysis(row));
  }

  async findLatestByType(
    userId: string,
    profileId: string,
    type: AnalysisType
  ): Promise<Analysis | null> {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('analysis_type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToAnalysis(data) : null;
  }

  async findStaleAnalyses(userId: string, maxAgeHours: number): Promise<Analysis[]> {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    const { data, error } = await supabase
      .from('analysis_events')
      .select('*')
      .eq('user_id', userId)
      .lt('created_at', cutoff.toISOString());

    if (error) throw error;
    return (data || []).map(row => this.mapToAnalysis(row));
  }

  async countByType(userId: string, profileId: string): Promise<Map<AnalysisType, number>> {
    const { data, error } = await supabase
      .from('analysis_events')
      .select('analysis_type')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (error) throw error;

    const counts = new Map<AnalysisType, number>();
    (data || []).forEach(row => {
      const type = row.analysis_type as AnalysisType;
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return counts;
  }

  private mapToAnalysis(row: Record<string, unknown>): Analysis {
    const rawResult = row.raw_result as Record<string, unknown> | null;
    const result: AnalysisResult | null = rawResult ? {
      summary: (rawResult.summary as string) || '',
      insights: (rawResult.insights as string[]) || [],
      riskFactors: (rawResult.riskFactors as string[]) || [],
      recommendations: (rawResult.recommendations as string[]) || [],
      rawData: rawResult
    } : null;

    return new Analysis(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      (row.analysis_type as AnalysisType) || 'comprehensive',
      (row.event_type as AnalysisStatus) || 'completed',
      (row.confidence_score as number) || 0,
      result,
      null, // metadata
      [], // sourceIds
      null, // errorMessage
      null, // completedAt
      new Date(row.created_at as string),
      new Date(row.created_at as string)
    );
  }
}

export class SupabaseDossierRepository implements IDossierRepository {
  
  async findById(id: string): Promise<Dossier | null> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToDossier(data) : null;
  }

  async findAll(): Promise<Dossier[]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToDossier(row));
  }

  async findByUserId(userId: string): Promise<Dossier[]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToDossier(row));
  }

  async findBySpec(spec: QuerySpec<Dossier>): Promise<PaginatedResult<Dossier>> {
    const items = await this.findAll();
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async findByUserIdAndSpec(userId: string, spec: QuerySpec<Dossier>): Promise<PaginatedResult<Dossier>> {
    const items = await this.findByUserId(userId);
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async save(entity: Dossier): Promise<Dossier> {
    const { error } = await supabase
      .from('dossiers')
      .upsert({
        id: entity.id,
        user_id: entity.userId,
        profile_id: entity.profileId,
        dossier_type: entity.template,
        summary: entity.executiveSummary?.overview || '',
        key_findings: entity.executiveSummary?.keyFindings || [],
        risk_assessment: entity.threatAssessment,
        created_at: entity.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return entity;
  }

  async saveMany(entities: Dossier[]): Promise<Dossier[]> {
    for (const entity of entities) {
      await this.save(entity);
    }
    return entities;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('dossiers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('dossiers')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('dossiers')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async findByProfile(
    userId: string,
    profileId: string,
    options?: DossierQueryOptions
  ): Promise<Dossier[]> {
    let query = supabase
      .from('dossiers')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (options?.templates?.length) {
      query = query.in('dossier_type', options.templates);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map(row => this.mapToDossier(row));
  }

  async findLatest(userId: string, profileId: string): Promise<Dossier | null> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToDossier(data) : null;
  }

  async findByTemplate(userId: string, template: DossierTemplate): Promise<Dossier[]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('user_id', userId)
      .eq('dossier_type', template);

    if (error) throw error;
    return (data || []).map(row => this.mapToDossier(row));
  }

  async archiveOldDossiers(
    userId: string,
    profileId: string,
    keepLatest: number = 5
  ): Promise<number> {
    const dossiers = await this.findByProfile(userId, profileId);
    const toArchive = dossiers.slice(keepLatest);

    // Dossiers table doesn't have a status column, so we just return count
    return toArchive.length;
  }

  private mapToDossier(row: Record<string, unknown>): Dossier {
    const keyFindings = row.key_findings as string[] | null;
    const riskAssessment = row.risk_assessment as ThreatAssessment | null;

    const executiveSummary: ExecutiveSummary | null = row.summary ? {
      overview: row.summary as string,
      keyFindings: keyFindings || [],
      riskAssessment: '',
      recommendations: []
    } : null;

    return new Dossier(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      (row.dossier_type as DossierTemplate) || 'full',
      'complete' as DossierStatus,
      (row.confidence_score as number) || 0.5,
      executiveSummary,
      riskAssessment,
      [], // sections
      [], // sourcesUsed
      row.generated_at ? new Date(row.generated_at as string) : null,
      1, // version
      new Date(row.created_at as string),
      new Date((row.updated_at as string) || (row.created_at as string))
    );
  }
}

export class SupabaseInsightRepository implements IInsightRepository {
  
  async findById(id: string): Promise<Insight | null> {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapToInsight(data) : null;
  }

  async findAll(): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToInsight(row));
  }

  async findByUserId(userId: string): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('priority_score', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToInsight(row));
  }

  async findBySpec(spec: QuerySpec<Insight>): Promise<PaginatedResult<Insight>> {
    const items = await this.findAll();
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async findByUserIdAndSpec(userId: string, spec: QuerySpec<Insight>): Promise<PaginatedResult<Insight>> {
    const items = await this.findByUserId(userId);
    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: items.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false
    };
  }

  async save(entity: Insight): Promise<Insight> {
    const { error } = await supabase
      .from('action_recommendations')
      .upsert({
        id: entity.id,
        user_id: entity.userId,
        profile_id: entity.profileId,
        title: entity.title,
        description: entity.description,
        category: entity.category,
        priority_score: this.priorityToScore(entity.priority),
        recommendation_type: entity.category,
        suggested_action: entity.requiresAction() ? 'Take action' : 'Review',
        status: entity.isAcknowledged ? 'acknowledged' : 'pending',
        created_at: entity.createdAt.toISOString()
      });

    if (error) throw error;
    return entity;
  }

  async saveMany(entities: Insight[]): Promise<Insight[]> {
    for (const entity of entities) {
      await this.save(entity);
    }
    return entities;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_recommendations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('action_recommendations')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result !== null;
  }

  async count(): Promise<number> {
    const { count, error } = await supabase
      .from('action_recommendations')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async findByProfile(
    userId: string,
    profileId: string,
    options?: InsightQueryOptions
  ): Promise<Insight[]> {
    let query = supabase
      .from('action_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (!options?.includeAcknowledged) {
      query = query.neq('status', 'acknowledged');
    }

    const { data, error } = await query.order('priority_score', { ascending: false });
    if (error) throw error;

    return (data || []).map(row => this.mapToInsight(row));
  }

  async findActive(userId: string, profileId: string): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .neq('status', 'acknowledged')
      .order('priority_score', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToInsight(row));
  }

  async findHighPriority(userId: string, limit: number = 10): Promise<Insight[]> {
    const { data, error } = await supabase
      .from('action_recommendations')
      .select('*')
      .eq('user_id', userId)
      .gte('priority_score', 70)
      .neq('status', 'acknowledged')
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(row => this.mapToInsight(row));
  }

  async acknowledge(insightId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('action_recommendations')
      .update({ status: 'acknowledged', actioned_at: new Date().toISOString() })
      .eq('id', insightId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async acknowledgeMany(insightIds: string[], userId: string): Promise<number> {
    const { error } = await supabase
      .from('action_recommendations')
      .update({ status: 'acknowledged', actioned_at: new Date().toISOString() })
      .in('id', insightIds)
      .eq('user_id', userId);

    if (error) throw error;
    return insightIds.length;
  }

  async countActive(userId: string, profileId: string): Promise<number> {
    const { count, error } = await supabase
      .from('action_recommendations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .neq('status', 'acknowledged');

    if (error) throw error;
    return count || 0;
  }

  private mapToInsight(row: Record<string, unknown>): Insight {
    const priority = this.scoreToPriority(row.priority_score as number);
    const actionability: InsightActionability = priority === 'critical' ? 'urgent' : 
                                                 priority === 'high' ? 'actionable' : 'informational';

    return new Insight(
      row.id as string,
      row.profile_id as string,
      row.user_id as string,
      (row.category as InsightCategory) || 'behavioral',
      priority,
      actionability,
      row.title as string,
      row.description as string,
      0.7, // default confidence
      [], // evidence
      [], // tags
      row.expires_at ? new Date(row.expires_at as string) : null,
      row.status === 'acknowledged',
      row.actioned_at ? new Date(row.actioned_at as string) : null,
      new Date(row.created_at as string),
      new Date(row.created_at as string)
    );
  }

  private priorityToScore(priority: InsightPriority): number {
    const scores: Record<InsightPriority, number> = {
      critical: 100,
      high: 80,
      medium: 50,
      low: 20
    };
    return scores[priority];
  }

  private scoreToPriority(score: number): InsightPriority {
    if (score >= 90) return 'critical';
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
