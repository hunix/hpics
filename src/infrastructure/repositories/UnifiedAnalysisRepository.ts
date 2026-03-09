/**
 * Unified Analysis Repository (v4.0.0)
 * 
 * Repository for the consolidated unified_analysis_store table.
 * Replaces 85+ individual analysis table repositories.
 * 
 * NOTE: This repository is ready for use once the unified_analysis_store
 * table is created via migration (Phase 1 of consolidation plan).
 * 
 * @module infrastructure/repositories/UnifiedAnalysisRepository
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Analysis domains supported by the unified store.
 */
export type AnalysisDomain = 
  | 'intelligence' 
  | 'biometric' 
  | 'psychological' 
  | 'network' 
  | 'warfare' 
  | 'fusion';

/**
 * Risk levels for analyses.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Unified analysis record structure.
 */
export interface UnifiedAnalysis {
  id: string;
  user_id: string;
  profile_id: string | null;
  analysis_domain: AnalysisDomain;
  analysis_type: string;
  result: Record<string, unknown>;
  confidence_score: number | null;
  risk_level: RiskLevel | null;
  source_ids: string[];
  model_used: string | null;
  processing_time_ms: number | null;
  created_at: string;
  expires_at: string | null;
}

/**
 * Input for creating/updating an analysis.
 */
export interface AnalysisInput {
  userId: string;
  profileId?: string;
  domain: AnalysisDomain;
  type: string;
  result: Record<string, unknown>;
  confidence?: number;
  riskLevel?: RiskLevel;
  sourceIds?: string[];
  modelUsed?: string;
  processingTimeMs?: number;
  expiresAt?: string;
}

/**
 * Query filters for retrieving analyses.
 */
export interface AnalysisFilters {
  domain?: AnalysisDomain;
  type?: string;
  minConfidence?: number;
  riskLevel?: RiskLevel;
  since?: string;
  limit?: number;
}

// Table name constant - unified table is now created (Phase 1 complete)
const TABLE_NAME = 'unified_analysis_store' as const;

/**
 * Repository for unified analysis operations.
 * Provides a clean interface for storing and retrieving all analysis types.
 * 
 * Now uses the unified_analysis_store table created in Phase 1.
 * Falls back to ai_analyses for legacy compatibility if needed.
 */
export class UnifiedAnalysisRepository {
  // Phase 1 complete: unified table is now available
  private useUnifiedTable = true;

  /**
   * Save or update an analysis result.
   * Uses ai_analyses table until unified table is created.
   */
  async saveAnalysis(input: AnalysisInput): Promise<{ data: UnifiedAnalysis | null; error: Error | null }> {
    try {
      if (this.useUnifiedTable) {
        // Use new unified table (after Phase 1 migration)
         const { data, error } = await supabase
          .from(TABLE_NAME)
          .upsert({
            user_id: input.userId,
            profile_id: input.profileId || null,
            analysis_domain: input.domain,
            analysis_type: input.type,
            result: input.result,
            confidence_score: input.confidence || null,
            risk_level: input.riskLevel || null,
            source_ids: input.sourceIds || [],
            model_used: input.modelUsed || null,
            processing_time_ms: input.processingTimeMs || null,
            expires_at: input.expiresAt || null,
          }, { 
            onConflict: 'user_id,profile_id,analysis_type',
            ignoreDuplicates: false 
          })
          .select()
          .single();

        if (error) throw error;
        return { data: data as UnifiedAnalysis, error: null };
      }

      // Fallback to ai_analyses table
      const { data, error } = await supabase
        .from('ai_analyses')
        .upsert({
          user_id: input.userId,
          profile_id: input.profileId || null,
          analysis_type: `${input.domain}:${input.type}`,
          result: {
            ...input.result,
            _meta: {
              domain: input.domain,
              confidence: input.confidence,
              riskLevel: input.riskLevel,
              sourceIds: input.sourceIds,
              modelUsed: input.modelUsed,
              processingTimeMs: input.processingTimeMs,
            },
          },
        }, { 
          onConflict: 'user_id,profile_id,analysis_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) throw error;
      
      // Map to UnifiedAnalysis format
      const mapped = this.mapFromAiAnalyses(data);
      return { data: mapped, error: null };
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] saveAnalysis error:', err);
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
    }
  }

  /**
   * Get the latest analysis of a specific type for a profile.
   */
  async getLatestAnalysis(
    userId: string,
    profileId: string,
    analysisType: string,
    domain?: AnalysisDomain
  ): Promise<UnifiedAnalysis | null> {
    try {
      if (this.useUnifiedTable) {
         const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId)
          .eq('analysis_type', analysisType)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return data as UnifiedAnalysis | null;
      }

      // Fallback: construct composite type
      const typeKey = domain ? `${domain}:${analysisType}` : analysisType;
      
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('profile_id', profileId)
        .like('analysis_type', `%${analysisType}%`)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? this.mapFromAiAnalyses(data) : null;
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] getLatestAnalysis error:', err);
      return null;
    }
  }

  /**
   * Get all analyses for a profile, optionally filtered.
   */
  async getAnalysesByProfile(
    userId: string,
    profileId: string,
    filters: AnalysisFilters = {}
  ): Promise<UnifiedAnalysis[]> {
    try {
      if (this.useUnifiedTable) {
        let query = supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('user_id', userId)
          .eq('profile_id', profileId);

        if (filters.domain) {
          query = query.eq('analysis_domain', filters.domain);
        }
        if (filters.type) {
          query = query.eq('analysis_type', filters.type);
        }
        if (filters.minConfidence) {
          query = query.gte('confidence_score', filters.minConfidence);
        }
        if (filters.riskLevel) {
          query = query.eq('risk_level', filters.riskLevel);
        }
        if (filters.since) {
          query = query.gte('created_at', filters.since);
        }

        query = query
          .order('created_at', { ascending: false })
          .limit(filters.limit || 100);

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as UnifiedAnalysis[];
      }

      // Fallback
      let query = supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('profile_id', profileId);

      if (filters.domain) {
        query = query.like('analysis_type', `${filters.domain}:%`);
      }
      if (filters.since) {
        query = query.gte('generated_at', filters.since);
      }

      query = query
        .order('generated_at', { ascending: false })
        .limit(filters.limit || 100);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.mapFromAiAnalyses);
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] getAnalysesByProfile error:', err);
      return [];
    }
  }

  /**
   * Get all analyses by domain across all profiles.
   */
  async getAnalysesByDomain(
    userId: string,
    domain: AnalysisDomain,
    limit = 100
  ): Promise<UnifiedAnalysis[]> {
    try {
      if (this.useUnifiedTable) {
         const { data, error } = await supabase
          .from(TABLE_NAME)
          .select('*')
          .eq('user_id', userId)
          .eq('analysis_domain', domain)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return (data || []) as UnifiedAnalysis[];
      }

      // Fallback
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .like('analysis_type', `${domain}:%`)
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(this.mapFromAiAnalyses);
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] getAnalysesByDomain error:', err);
      return [];
    }
  }

  /**
   * Delete an analysis by ID.
   */
  async deleteAnalysis(id: string, userId: string): Promise<boolean> {
    try {
      const tableName = this.useUnifiedTable ? TABLE_NAME : 'ai_analyses';
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] deleteAnalysis error:', err);
      return false;
    }
  }

  /**
   * Get analysis statistics for a user.
   */
  async getAnalysisStats(userId: string): Promise<{
    totalAnalyses: number;
    byDomain: Record<string, number>;
    byRiskLevel: Record<string, number>;
    recentCount: number;
  }> {
    try {
      const tableName = this.useUnifiedTable ? TABLE_NAME : 'ai_analyses';
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('analysis_type, result, generated_at, created_at')
        .eq('user_id', userId);

      if (error || !data) {
        return { totalAnalyses: 0, byDomain: {}, byRiskLevel: {}, recentCount: 0 };
      }

      const byDomain: Record<string, number> = {};
      const byRiskLevel: Record<string, number> = {};
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let recentCount = 0;

      for (const row of data as any[]) {
        // Extract domain from analysis_type or result meta
        let domain = 'unknown';
        if (this.useUnifiedTable) {
          domain = row.analysis_domain || 'unknown';
        } else if (row.analysis_type?.includes(':')) {
          domain = row.analysis_type.split(':')[0];
        } else if (row.result?._meta?.domain) {
          domain = row.result._meta.domain;
        }
        byDomain[domain] = (byDomain[domain] || 0) + 1;

        // Extract risk level
        const risk = this.useUnifiedTable 
          ? row.risk_level 
          : row.result?._meta?.riskLevel;
        if (risk) {
          byRiskLevel[risk] = (byRiskLevel[risk] || 0) + 1;
        }

        // Count recent
        const createdAt = row.created_at || row.generated_at;
        if (createdAt >= weekAgo) {
          recentCount++;
        }
      }

      return {
        totalAnalyses: data.length,
        byDomain,
        byRiskLevel,
        recentCount,
      };
    } catch (err) {
      console.error('[UnifiedAnalysisRepository] getAnalysisStats error:', err);
      return { totalAnalyses: 0, byDomain: {}, byRiskLevel: {}, recentCount: 0 };
    }
  }

  /**
   * Map ai_analyses row to UnifiedAnalysis format.
   */
  private mapFromAiAnalyses(row: any): UnifiedAnalysis {
    const meta = row.result?._meta || {};
    const [domain, type] = (row.analysis_type || '').includes(':')
      ? row.analysis_type.split(':')
      : ['intelligence', row.analysis_type];

    // Remove meta from result
    const result = { ...row.result };
    delete result._meta;

    return {
      id: row.id,
      user_id: row.user_id,
      profile_id: row.profile_id,
      analysis_domain: domain as AnalysisDomain,
      analysis_type: type,
      result,
      confidence_score: meta.confidence || null,
      risk_level: meta.riskLevel || null,
      source_ids: meta.sourceIds || [],
      model_used: meta.modelUsed || null,
      processing_time_ms: meta.processingTimeMs || null,
      created_at: row.generated_at || row.created_at,
      expires_at: null,
    };
  }
}

// Singleton instance
let instance: UnifiedAnalysisRepository | null = null;

/**
 * Get the singleton repository instance.
 */
export function getUnifiedAnalysisRepository(): UnifiedAnalysisRepository {
  if (!instance) {
    instance = new UnifiedAnalysisRepository();
  }
  return instance;
}

// ============================================================================
// Type Mapping Helpers
// ============================================================================

/**
 * Map legacy analysis type names to unified types.
 * Helps with backward compatibility during migration.
 */
export const LEGACY_TYPE_MAP: Record<string, { domain: AnalysisDomain; type: string }> = {
  'mice_assessments': { domain: 'intelligence', type: 'mice_assessment' },
  'betrayal_predictions': { domain: 'intelligence', type: 'betrayal_prediction' },
  'behavioral_analyses': { domain: 'intelligence', type: 'behavioral_analysis' },
  'dark_triad_scores': { domain: 'psychological', type: 'dark_triad' },
  'sacred_values': { domain: 'psychological', type: 'sacred_values' },
  'attachment_styles': { domain: 'psychological', type: 'attachment_style' },
  'cognitive_biases': { domain: 'psychological', type: 'cognitive_bias' },
  'face_embeddings': { domain: 'biometric', type: 'face_embedding' },
  'voice_signatures': { domain: 'biometric', type: 'voice_signature' },
  'gait_patterns': { domain: 'biometric', type: 'gait_pattern' },
  'network_analyses': { domain: 'network', type: 'network_analysis' },
  'influence_mappings': { domain: 'network', type: 'influence_mapping' },
  'warfare_assessments': { domain: 'warfare', type: 'warfare_assessment' },
  'vulnerability_profiles': { domain: 'warfare', type: 'vulnerability_profile' },
};

/**
 * Convert legacy table name to unified domain/type.
 */
export function mapLegacyType(legacyTable: string): { domain: AnalysisDomain; type: string } | null {
  return LEGACY_TYPE_MAP[legacyTable] || null;
}
