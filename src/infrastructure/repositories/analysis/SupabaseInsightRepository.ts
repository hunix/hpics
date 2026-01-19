/**
 * Supabase Insight Repository Implementation
 * 
 * Implements IInsightRepository using Supabase as the data store.
 * Split from monolithic file for better maintainability (v3.7.0).
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  IInsightRepository,
  InsightQueryOptions 
} from '@/domains/intelligence/repositories/IAnalysisRepository';
import { Insight, InsightCategory, InsightPriority, InsightActionability } from '@/domains/intelligence/entities/Insight';
import { PaginatedResult, QuerySpec } from '@/domains/shared/repositories/BaseRepository';

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
