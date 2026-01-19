/**
 * Supabase Dossier Repository Implementation
 * 
 * Implements IDossierRepository using Supabase as the data store.
 * Split from monolithic file for better maintainability (v3.7.0).
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IDossierRepository, 
  DossierQueryOptions,
} from '@/domains/intelligence/repositories/IAnalysisRepository';
import { Dossier, DossierTemplate, DossierStatus, ExecutiveSummary, ThreatAssessment } from '@/domains/intelligence/entities/Dossier';
import { PaginatedResult, QuerySpec } from '@/domains/shared/repositories/BaseRepository';

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
    const riskPayload = entity.threatAssessment 
      ? JSON.parse(JSON.stringify(entity.threatAssessment)) 
      : null;

    const { error } = await supabase
      .from('dossiers')
      .upsert([{
        user_id: entity.userId,
        profile_id: entity.profileId,
        dossier_type: entity.template,
        title: `Dossier for ${entity.profileId}`,
        sections: [],
        summary: entity.executiveSummary?.overview || '',
        key_findings: entity.executiveSummary?.keyFindings || [],
        risk_assessment: riskPayload
      }], { onConflict: 'id' });

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
