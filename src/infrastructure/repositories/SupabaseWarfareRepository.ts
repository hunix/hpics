/**
 * Supabase Warfare Repository Implementation
 * 
 * Concrete implementation of warfare repositories using Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Campaign, CampaignStatus, CampaignType } from '@/domains/warfare/entities/Campaign';
import { Threat, ThreatLevel, ThreatStatus, calculateRiskScore } from '@/domains/warfare/entities/Threat';
import { 
  ICampaignRepository, 
  IThreatRepository,
  CampaignQueryOptions,
  ThreatQueryOptions,
} from '@/domains/warfare/repositories/IWarfareRepository';
import { 
  QuerySpec, 
  PaginatedResult, 
  FilterCondition 
} from '@/domains/shared/repositories/BaseRepository';

export class SupabaseCampaignRepository implements ICampaignRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Campaign | null> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToCampaign(data);
  }

  async findAll(): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToCampaign(row));
  }

  async findBySpec(spec: QuerySpec<Campaign>): Promise<PaginatedResult<Campaign>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;

    const { data, error, count } = await this.supabase
      .from('autonomous_campaigns')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const totalCount = count || 0;
    return {
      items: (data || []).map(row => this.mapToCampaign(row)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: (page + 1) * pageSize < totalCount,
      hasPreviousPage: page > 0,
    };
  }

  async save(entity: Campaign): Promise<Campaign> {
    const row = this.mapToRow(entity);
    
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCampaign(data);
  }

  async saveMany(entities: Campaign[]): Promise<Campaign[]> {
    const rows = entities.map(e => this.mapToRow(e));
    
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .upsert(rows)
      .select();

    if (error) throw error;
    return (data || []).map(row => this.mapToCampaign(row));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('autonomous_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('autonomous_campaigns')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('autonomous_campaigns')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    return !!data;
  }

  async count(filters?: FilterCondition<Campaign>[]): Promise<number> {
    const { count, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async findByUserId(userId: string): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToCampaign(row));
  }

  async findByUserIdAndSpec(
    userId: string, 
    spec: QuerySpec<Campaign>
  ): Promise<PaginatedResult<Campaign>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;

    const { data, error, count } = await this.supabase
      .from('autonomous_campaigns')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const totalCount = count || 0;
    return {
      items: (data || []).map(row => this.mapToCampaign(row)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: (page + 1) * pageSize < totalCount,
      hasPreviousPage: page > 0,
    };
  }

  async findByStatus(userId: string, status: CampaignStatus): Promise<Campaign[]> {
    const isActive = status === 'active';
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', isActive);

    if (error) throw error;
    return (data || []).map(row => this.mapToCampaign(row));
  }

  async findByType(userId: string, type: CampaignType): Promise<Campaign[]> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('campaign_type', type);

    if (error) throw error;
    return (data || []).map(row => this.mapToCampaign(row));
  }

  async findActive(userId: string): Promise<Campaign[]> {
    return this.findByStatus(userId, 'active');
  }

  async activate(userId: string, campaignId: string): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCampaign(data);
  }

  async deactivate(userId: string, campaignId: string): Promise<Campaign> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToCampaign(data);
  }

  async getCampaignMetrics(userId: string): Promise<{
    activeCampaigns: number;
    completedCampaigns: number;
    averageSuccessRate: number;
  }> {
    const { data, error } = await this.supabase
      .from('autonomous_campaigns')
      .select('is_active, success_rate')
      .eq('user_id', userId);

    if (error) throw error;

    const campaigns = data || [];
    const activeCampaigns = campaigns.filter(c => c.is_active).length;
    const completedCampaigns = campaigns.filter(c => !c.is_active).length;
    const totalSuccessRate = campaigns.reduce((sum, c) => sum + (c.success_rate || 0), 0);

    return {
      activeCampaigns,
      completedCampaigns,
      averageSuccessRate: campaigns.length > 0 ? totalSuccessRate / campaigns.length : 0,
    };
  }

  private mapToCampaign(row: Record<string, unknown>): Campaign {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: (row.campaign_name as string) || 'Unnamed',
      description: (row.objective as string) || '',
      type: (row.campaign_type as CampaignType) || 'influence',
      status: (row.is_active as boolean) ? 'active' : 'draft',
      priority: 'medium',
      objectives: [],
      targets: [],
      phases: [],
      budget: 0,
      spentBudget: 0,
      startDate: null,
      endDate: null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date((row.updated_at as string) || (row.created_at as string)),
      metrics: {
        successRate: (row.success_rate as number) || 0,
        reach: 0,
        engagement: 0,
        influence: 0,
        roi: 0,
      },
    };
  }

  private mapToRow(entity: Campaign): Record<string, unknown> {
    return {
      id: entity.id,
      user_id: entity.userId,
      campaign_name: entity.name,
      campaign_type: entity.type,
      objective: entity.description,
      is_active: entity.status === 'active',
      auto_execute: false,
      trigger_conditions: {},
      execution_rules: {},
      success_criteria: {},
      updated_at: new Date().toISOString(),
    };
  }
}

export class SupabaseThreatRepository implements IThreatRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Threat | null> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToThreat(data);
  }

  async findAll(): Promise<Threat[]> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async findBySpec(spec: QuerySpec<Threat>): Promise<PaginatedResult<Threat>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;

    const { data, error, count } = await this.supabase
      .from('active_defense_operations')
      .select('*', { count: 'exact' })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const totalCount = count || 0;
    return {
      items: (data || []).map(row => this.mapToThreat(row)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: (page + 1) * pageSize < totalCount,
      hasPreviousPage: page > 0,
    };
  }

  async save(entity: Threat): Promise<Threat> {
    const row = this.mapToRow(entity);
    
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .upsert(row)
      .select()
      .single();

    if (error) throw error;
    return this.mapToThreat(data);
  }

  async saveMany(entities: Threat[]): Promise<Threat[]> {
    const rows = entities.map(e => this.mapToRow(e));
    
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .upsert(rows)
      .select();

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('active_defense_operations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async deleteMany(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('active_defense_operations')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('active_defense_operations')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    return !!data;
  }

  async count(filters?: FilterCondition<Threat>[]): Promise<number> {
    const { count, error } = await this.supabase
      .from('active_defense_operations')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  async findByUserId(userId: string): Promise<Threat[]> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async findByUserIdAndSpec(
    userId: string, 
    spec: QuerySpec<Threat>
  ): Promise<PaginatedResult<Threat>> {
    const page = spec.pagination?.page || 0;
    const pageSize = spec.pagination?.pageSize || 50;

    const { data, error, count } = await this.supabase
      .from('active_defense_operations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const totalCount = count || 0;
    return {
      items: (data || []).map(row => this.mapToThreat(row)),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      hasNextPage: (page + 1) * pageSize < totalCount,
      hasPreviousPage: page > 0,
    };
  }

  async findByLevel(userId: string, level: ThreatLevel): Promise<Threat[]> {
    const levelNum = this.getLevelNumber(level);
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .eq('user_id', userId)
      .eq('escalation_level', levelNum);

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async findByStatus(userId: string, status: ThreatStatus): Promise<Threat[]> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .eq('user_id', userId)
      .eq('defense_posture', status);

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async findActive(userId: string): Promise<Threat[]> {
    return this.findByStatus(userId, 'active');
  }

  async findCritical(userId: string): Promise<Threat[]> {
    return this.findByLevel(userId, 'critical');
  }

  async findByProfile(userId: string, profileId: string): Promise<Threat[]> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (error) throw error;
    return (data || []).map(row => this.mapToThreat(row));
  }

  async updateStatus(userId: string, threatId: string, status: ThreatStatus): Promise<Threat> {
    const { data, error } = await this.supabase
      .from('active_defense_operations')
      .update({ defense_posture: status, updated_at: new Date().toISOString() })
      .eq('id', threatId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return this.mapToThreat(data);
  }

  async calculateOverallRisk(userId: string): Promise<number> {
    const threats = await this.findByUserId(userId);
    if (threats.length === 0) return 0;
    
    const totalRisk = threats.reduce((sum, t) => sum + t.riskScore, 0);
    return totalRisk / threats.length;
  }

  private mapToThreat(row: Record<string, unknown>): Threat {
    const profile = (row.threat_profile as Record<string, unknown>) || {};
    return {
      id: row.id as string,
      userId: row.user_id as string,
      name: (row.defense_type as string) || 'Unknown',
      description: (profile.description as string) || '',
      type: (profile.type as Threat['type']) || 'operational',
      level: this.getLevel((row.escalation_level as number) || 1),
      status: (row.defense_posture as ThreatStatus) || 'monitoring',
      actors: [],
      indicators: [],
      countermeasures: [],
      affectedProfiles: row.profile_id ? [row.profile_id as string] : [],
      affectedCampaigns: [],
      probability: (profile.probability as number) || 50,
      impact: (profile.impact as number) || 50,
      riskScore: calculateRiskScore((profile.probability as number) || 50, (profile.impact as number) || 50),
      detectedAt: new Date(row.created_at as string),
      lastAssessedAt: new Date((row.updated_at as string) || (row.created_at as string)),
      resolvedAt: null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date((row.updated_at as string) || (row.created_at as string)),
    };
  }

  private mapToRow(entity: Threat): Record<string, unknown> {
    return {
      id: entity.id,
      user_id: entity.userId,
      defense_type: entity.name,
      threat_profile: {
        description: entity.description,
        type: entity.type,
        probability: entity.probability,
        impact: entity.impact,
      },
      defense_posture: entity.status,
      escalation_level: this.getLevelNumber(entity.level),
      updated_at: new Date().toISOString(),
    };
  }

  private getLevelNumber(level: ThreatLevel): number {
    return { minimal: 1, low: 2, medium: 3, high: 4, critical: 5 }[level];
  }

  private getLevel(num: number): ThreatLevel {
    return (['minimal', 'low', 'medium', 'high', 'critical'] as ThreatLevel[])[Math.min(num - 1, 4)] || 'medium';
  }
}
