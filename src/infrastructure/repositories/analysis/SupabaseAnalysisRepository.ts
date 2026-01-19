/**
 * Supabase Analysis Repository Implementation
 * 
 * Implements IAnalysisRepository using Supabase as the data store.
 * Split from monolithic file for better maintainability (v3.7.0).
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IAnalysisRepository, 
  AnalysisQueryOptions,
} from '@/domains/intelligence/repositories/IAnalysisRepository';
import { Analysis, AnalysisType, AnalysisStatus, AnalysisResult } from '@/domains/intelligence/entities/Analysis';
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
