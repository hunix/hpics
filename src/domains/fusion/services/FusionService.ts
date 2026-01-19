/**
 * Fusion Service - Core domain service for data fusion operations
 * 
 * Coordinates fusion engine execution and result management.
 */

import { supabase } from '@/integrations/supabase/client';
import { FusionResult, FusionEngineType, FusionPayload, FusionMetrics } from '../entities/FusionResult';
import { DigitalTwin, BehaviorPattern, SimulationScenario } from '../entities/DigitalTwin';
import { getEventBus } from '@/domains/shared';
import { FusionCompleted, DigitalTwinUpdated } from '../events/FusionEvents';

export interface FusionRequest {
  profileId: string;
  engineType: FusionEngineType;
  inputData?: Record<string, unknown>;
  options?: {
    forceRefresh?: boolean;
    includeHistory?: boolean;
    confidenceThreshold?: number;
  };
}

export interface FusionResponse {
  success: boolean;
  result?: FusionResult;
  error?: string;
  processingTimeMs: number;
}

export interface BatchFusionRequest {
  profileId: string;
  engines: FusionEngineType[];
  options?: FusionRequest['options'];
}

export class FusionService {
  private edgeFunctionBaseUrl: string;

  constructor() {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yibszncvwmefwamayfty';
    this.edgeFunctionBaseUrl = `https://${projectId}.supabase.co/functions/v1`;
  }

  /**
   * Execute a single fusion engine
   */
  async executeFusion(request: FusionRequest): Promise<FusionResponse> {
    const startTime = Date.now();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'Not authenticated', processingTimeMs: 0 };
      }

      const edgeFunctionName = this.getEdgeFunctionName(request.engineType);
      
      const response = await fetch(`${this.edgeFunctionBaseUrl}/${edgeFunctionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: request.profileId,
          inputData: request.inputData,
          options: request.options,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: `Fusion failed: ${errorText}`, 
          processingTimeMs: Date.now() - startTime 
        };
      }

      const data = await response.json();
      const processingTimeMs = Date.now() - startTime;

      const result = this.mapToFusionResult(
        request.profileId,
        session.user.id,
        request.engineType,
        data,
        processingTimeMs
      );

      // Publish domain event
      const eventBus = getEventBus();
      await eventBus.publish(new FusionCompleted(
        request.profileId,
        request.engineType,
        result.confidenceValue
      ));

      return { success: true, result, processingTimeMs };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs: Date.now() - startTime 
      };
    }
  }

  /**
   * Execute multiple fusion engines in parallel
   */
  async executeBatchFusion(request: BatchFusionRequest): Promise<Map<FusionEngineType, FusionResponse>> {
    const results = new Map<FusionEngineType, FusionResponse>();

    const promises = request.engines.map(async (engineType) => {
      const response = await this.executeFusion({
        profileId: request.profileId,
        engineType,
        options: request.options,
      });
      results.set(engineType, response);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get fusion results for a profile
   */
  async getFusionResults(profileId: string, engineType?: FusionEngineType): Promise<FusionResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Query appropriate table based on engine type
    // This is a simplified version - in production, each engine would have its own repository
    const results: FusionResult[] = [];

    // Example: Query temporal fusion results
    if (!engineType || engineType === 'temporal-fusion-transformer') {
      const { data } = await (supabase as any)
        .from('temporal_fusion_results')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        results.push(...data.map((row: any) => this.mapRowToFusionResult(row, 'temporal-fusion-transformer')));
      }
    }

    return results;
  }

  /**
   * Update or create a digital twin
   */
  async updateDigitalTwin(
    profileId: string,
    patterns: BehaviorPattern[]
  ): Promise<DigitalTwin | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check if twin exists
    const { data: existing } = await (supabase as any)
      .from('behavioral_twins')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    const twin = existing
      ? new DigitalTwin(
          existing.id,
          profileId,
          user.id,
          existing.twin_version,
          existing.behavior_patterns || [],
          existing.simulation_history || [],
          existing.metrics,
          existing.model_state || {},
          existing.is_active
        )
      : new DigitalTwin(
          crypto.randomUUID(),
          profileId,
          user.id
        );

    // Add new patterns
    patterns.forEach(pattern => twin.addBehaviorPattern(pattern));

    // Save to database
    const { error } = await (supabase as any)
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
      });

    if (error) {
      console.error('[FusionService] Failed to update digital twin:', error);
      return null;
    }

    // Publish event
    const eventBus = getEventBus();
    await eventBus.publish(new DigitalTwinUpdated(profileId, patterns.length));

    return twin;
  }

  /**
   * Run a simulation on a digital twin
   */
  async runTwinSimulation(
    profileId: string,
    scenarioName: string,
    conditions: Record<string, unknown>
  ): Promise<SimulationScenario | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    try {
      const response = await fetch(`${this.edgeFunctionBaseUrl}/behavioral-digital-twin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId,
          action: 'simulate',
          scenarioName,
          conditions,
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        scenarioId: data.scenarioId || crypto.randomUUID(),
        name: scenarioName,
        conditions,
        predictedOutcome: data.predictedOutcome,
        probability: data.probability,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('[FusionService] Simulation failed:', error);
      return null;
    }
  }

  // Private helpers

  private getEdgeFunctionName(engineType: FusionEngineType): string {
    const mapping: Record<FusionEngineType, string> = {
      'temporal-fusion-transformer': 'temporal-fusion-transformer',
      'behavioral-digital-twin': 'behavioral-digital-twin',
      'graph-rag': 'graph-rag-engine',
      'shadow-network': 'shadow-network-analyzer',
      'dempster-shafer': 'dempster-shafer-fusion',
      'counterfactual': 'counterfactual-engine',
      'pattern-of-life': 'pattern-of-life-engine',
      'entity-resolution': 'entity-resolution-engine',
      'sentiment-cascade': 'sentiment-cascade-predictor',
    };
    return mapping[engineType];
  }

  private mapToFusionResult(
    profileId: string,
    userId: string,
    engineType: FusionEngineType,
    data: any,
    processingTimeMs: number
  ): FusionResult {
    return new FusionResult(
      crypto.randomUUID(),
      profileId,
      userId,
      engineType,
      data.confidence || 0.5,
      data.payload || data,
      {
        processingTimeMs,
        dataSourcesUsed: data.sourcesUsed || 1,
        conflictsResolved: data.conflictsResolved || 0,
        uncertaintyReduction: data.uncertaintyReduction || 0,
      },
      data.inputSources || [],
      '1.0.0'
    );
  }

  private mapRowToFusionResult(row: any, engineType: FusionEngineType): FusionResult {
    return new FusionResult(
      row.id,
      row.profile_id,
      row.user_id,
      engineType,
      row.confidence || row.confidence_score || 0.5,
      row.payload || row.result || {},
      {
        processingTimeMs: row.processing_time_ms || 0,
        dataSourcesUsed: row.sources_used || 1,
        conflictsResolved: row.conflicts_resolved || 0,
        uncertaintyReduction: row.uncertainty_reduction || 0,
      },
      row.input_sources || [],
      row.processing_version || '1.0.0',
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }
}

// Singleton instance
let fusionServiceInstance: FusionService | null = null;

export function getFusionService(): FusionService {
  if (!fusionServiceInstance) {
    fusionServiceInstance = new FusionService();
  }
  return fusionServiceInstance;
}
