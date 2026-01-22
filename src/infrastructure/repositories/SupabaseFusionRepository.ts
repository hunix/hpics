/**
 * SupabaseFusionRepository - Concrete Supabase Implementation (v3.9.0)
 * 
 * Implements IFusionRepository for querying ai_analyses table with
 * standardized fusion analysis types.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  IFusionRepository, 
  FusionQueryOptions 
} from '@/domains/fusion/repositories/IFusionRepository';
import { 
  FUSION_ANALYSIS_TYPES,
  ANALYSIS_TYPE_TO_ENGINE 
} from '@/domains/fusion/repositories/IFusionRepository';
import { FusionResult, type FusionEngineType } from '@/domains/fusion/entities/FusionResult';

export class SupabaseFusionRepository implements IFusionRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(userId: string, options?: FusionQueryOptions): Promise<FusionResult[]> {
    const analysisTypes = Object.values(FUSION_ANALYSIS_TYPES);
    
    let query = (this.supabase as any)
      .from('ai_analyses')
      .select('*')
      .eq('user_id', userId)
      .in('analysis_type', analysisTypes);

    if (options?.profileId) {
      query = query.eq('profile_id', options.profileId);
    }
    if (options?.engineType) {
      query = query.eq('analysis_type', FUSION_ANALYSIS_TYPES[options.engineType]);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    const orderBy = options?.orderBy === 'confidence' ? 'result->confidence' : 'generated_at';
    const ascending = options?.orderDirection === 'asc';
    query = query.order(orderBy === 'generated_at' ? 'generated_at' : 'generated_at', { ascending });

    const { data, error } = await query;
    
    if (error) {
      console.error('[SupabaseFusionRepository] findAll error:', error);
      return [];
    }

    return (data || [])
      .map((row: any) => this.mapRowToFusionResult(row))
      .filter((result: FusionResult | null): result is FusionResult => result !== null);
  }

  async findByProfile(userId: string, profileId: string, options?: FusionQueryOptions): Promise<FusionResult[]> {
    return this.findAll(userId, { ...options, profileId });
  }

  async findByEngine(userId: string, engineType: FusionEngineType, options?: FusionQueryOptions): Promise<FusionResult[]> {
    return this.findAll(userId, { ...options, engineType });
  }

  async findLatestByEngine(userId: string, profileId: string, engineType: FusionEngineType): Promise<FusionResult | null> {
    const analysisType = FUSION_ANALYSIS_TYPES[engineType];
    
    const { data, error } = await (this.supabase as any)
      .from('ai_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .eq('analysis_type', analysisType)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRowToFusionResult(data);
  }

  async findById(userId: string, resultId: string): Promise<FusionResult | null> {
    const { data, error } = await (this.supabase as any)
      .from('ai_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('id', resultId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRowToFusionResult(data);
  }

  async save(result: FusionResult): Promise<FusionResult> {
    const analysisType = FUSION_ANALYSIS_TYPES[result.engineType];
    
    const { data, error } = await (this.supabase as any)
      .from('ai_analyses')
      .upsert({
        id: result.id,
        user_id: result.userId,
        profile_id: result.profileId,
        analysis_type: analysisType,
        result: {
          confidence: result.confidenceValue,
          payload: result.payload,
          metrics: result.metrics,
          inputSources: result.inputSources,
          processingVersion: result.processingVersion,
        },
        generated_at: result.createdAt.toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseFusionRepository] save error:', error);
      throw error;
    }

    return this.mapRowToFusionResult(data) || result;
  }

  async delete(userId: string, resultId: string): Promise<boolean> {
    const { error } = await (this.supabase as any)
      .from('ai_analyses')
      .delete()
      .eq('user_id', userId)
      .eq('id', resultId);

    return !error;
  }

  async countByEngine(userId: string, profileId: string): Promise<Map<FusionEngineType, number>> {
    const analysisTypes = Object.values(FUSION_ANALYSIS_TYPES);
    
    const { data, error } = await (this.supabase as any)
      .from('ai_analyses')
      .select('analysis_type')
      .eq('user_id', userId)
      .eq('profile_id', profileId)
      .in('analysis_type', analysisTypes);

    const counts = new Map<FusionEngineType, number>();
    
    if (error || !data) {
      return counts;
    }

    for (const row of data) {
      const engineType = ANALYSIS_TYPE_TO_ENGINE[row.analysis_type];
      if (engineType) {
        counts.set(engineType, (counts.get(engineType) || 0) + 1);
      }
    }

    return counts;
  }

  async findStaleEngines(userId: string, profileId: string, maxAgeDays: number): Promise<FusionEngineType[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const results = await this.findByProfile(userId, profileId);
    const latestByEngine = new Map<FusionEngineType, Date>();

    for (const result of results) {
      const existing = latestByEngine.get(result.engineType);
      if (!existing || result.createdAt > existing) {
        latestByEngine.set(result.engineType, result.createdAt);
      }
    }

    const allEngines: FusionEngineType[] = Object.keys(FUSION_ANALYSIS_TYPES) as FusionEngineType[];
    const staleEngines: FusionEngineType[] = [];

    for (const engine of allEngines) {
      const latestDate = latestByEngine.get(engine);
      if (!latestDate || latestDate < cutoffDate) {
        staleEngines.push(engine);
      }
    }

    return staleEngines;
  }

  // Private helper to map database row to FusionResult entity
  private mapRowToFusionResult(row: any): FusionResult | null {
    const engineType = ANALYSIS_TYPE_TO_ENGINE[row.analysis_type];
    if (!engineType) {
      return null; // Not a fusion analysis type
    }

    const result = row.result || {};
    
    return new FusionResult(
      row.id,
      row.profile_id,
      row.user_id,
      engineType,
      result.confidence || result.confidenceValue || 0.5,
      result.payload || result,
      result.metrics || {
        processingTimeMs: 0,
        dataSourcesUsed: 1,
        conflictsResolved: 0,
        uncertaintyReduction: 0,
      },
      result.inputSources || [],
      result.processingVersion || '1.0.0',
      new Date(row.generated_at),
      new Date(row.generated_at)
    );
  }
}
