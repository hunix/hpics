/**
 * SupabaseDigitalTwinRepository - Concrete Supabase Implementation (v3.9.0)
 * 
 * Implements IDigitalTwinRepository for querying behavioral_twins table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { 
  IDigitalTwinRepository, 
  DigitalTwinQueryOptions 
} from '@/domains/fusion/repositories/IFusionRepository';
import { 
  DigitalTwin, 
  type BehaviorPattern, 
  type SimulationScenario 
} from '@/domains/fusion/entities/DigitalTwin';

export class SupabaseDigitalTwinRepository implements IDigitalTwinRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByProfile(
    userId: string, 
    profileId: string, 
    options?: DigitalTwinQueryOptions
  ): Promise<DigitalTwin | null> {
    let query = (this.supabase as any)
      .from('behavioral_twins')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (options?.onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return null;
    }

    return this.mapRowToDigitalTwin(data, options);
  }

  async findAll(userId: string, options?: DigitalTwinQueryOptions): Promise<DigitalTwin[]> {
    let query = (this.supabase as any)
      .from('behavioral_twins')
      .select('*')
      .eq('user_id', userId);

    if (options?.onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data
      .map((row: any) => this.mapRowToDigitalTwin(row, options))
      .filter((twin: DigitalTwin | null): twin is DigitalTwin => twin !== null);
  }

  async findById(userId: string, twinId: string): Promise<DigitalTwin | null> {
    const { data, error } = await (this.supabase as any)
      .from('behavioral_twins')
      .select('*')
      .eq('user_id', userId)
      .eq('id', twinId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapRowToDigitalTwin(data);
  }

  async save(twin: DigitalTwin): Promise<DigitalTwin> {
    const { data, error } = await (this.supabase as any)
      .from('behavioral_twins')
      .upsert({
        id: twin.id,
        profile_id: twin.profileId,
        user_id: twin.userId,
        twin_version: twin.twinVersion,
        behavior_patterns: twin.behaviorPatterns,
        simulation_history: twin.simulationHistory,
        metrics: twin.metrics,
        model_state: twin.modelState,
        is_active: twin.isActive,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[SupabaseDigitalTwinRepository] save error:', error);
      throw error;
    }

    return this.mapRowToDigitalTwin(data) || twin;
  }

  async delete(userId: string, twinId: string): Promise<boolean> {
    const { error } = await (this.supabase as any)
      .from('behavioral_twins')
      .delete()
      .eq('user_id', userId)
      .eq('id', twinId);

    return !error;
  }

  async addPatterns(
    userId: string, 
    twinId: string, 
    patterns: BehaviorPattern[]
  ): Promise<DigitalTwin | null> {
    const twin = await this.findById(userId, twinId);
    if (!twin) return null;

    patterns.forEach(pattern => twin.addBehaviorPattern(pattern));
    return this.save(twin);
  }

  async addSimulation(
    userId: string, 
    twinId: string, 
    scenario: SimulationScenario
  ): Promise<DigitalTwin | null> {
    const twin = await this.findById(userId, twinId);
    if (!twin) return null;

    // Use runSimulation method which adds to history
    twin.runSimulation(
      scenario.name,
      scenario.conditions,
      scenario.predictedOutcome,
      scenario.probability
    );
    return this.save(twin);
  }

  async deactivate(userId: string, twinId: string): Promise<boolean> {
    const { error } = await (this.supabase as any)
      .from('behavioral_twins')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', twinId);

    return !error;
  }

  // Private helper to map database row to DigitalTwin entity
  private mapRowToDigitalTwin(row: any, options?: DigitalTwinQueryOptions): DigitalTwin | null {
    if (!row) return null;

    const behaviorPatterns = options?.includePatterns !== false 
      ? (row.behavior_patterns || []) 
      : [];

    const simulationHistory = options?.includeSimulations !== false 
      ? (row.simulation_history || []) 
      : [];

    return new DigitalTwin(
      row.id,
      row.profile_id,
      row.user_id,
      row.twin_version || 1,
      behaviorPatterns,
      simulationHistory.map((sim: any) => ({
        ...sim,
        timestamp: new Date(sim.timestamp),
      })),
      row.metrics || {},
      row.model_state || {},
      row.is_active ?? true
    );
  }
}
