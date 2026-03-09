/**
 * Fusion Service - Core domain service for data fusion operations
 * 
 * Coordinates fusion engine execution and result management.
 * Uses repository pattern for DDD compliance.
 * 
 * @version 3.9.0 - DDD Migration
 */

import { supabase } from '@/integrations/supabase/client';
import { FusionResult, FusionEngineType, FusionPayload, FusionMetrics } from '../entities/FusionResult';
import { DigitalTwin, BehaviorPattern, SimulationScenario } from '../entities/DigitalTwin';
import { getEventBus } from '@/domains/shared';
import { FusionCompleted, DigitalTwinUpdated } from '../events/FusionEvents';
import { IFusionRepository, IDigitalTwinRepository, FusionQueryOptions } from '../repositories';

/**
 * Standard analysis types for each fusion engine
 * Used for ai_analyses table persistence and lookup
 */
export const FUSION_ANALYSIS_TYPES: Record<FusionEngineType, string> = {
  'temporal-fusion-transformer': 'temporal_fusion',
  'behavioral-digital-twin': 'behavioral_digital_twin',
  'graph-rag': 'graph_rag_synthesis',
  'shadow-network': 'shadow_network_analysis',
  'dempster-shafer': 'dempster_shafer_fusion',
  'counterfactual': 'counterfactual_reasoning',
  'pattern-of-life': 'pattern_of_life',
  'entity-resolution': 'entity_resolution',
  'sentiment-cascade': 'sentiment_cascade',
  // New fusion engines v5.0
  'biometric-behavioral': 'biometric_behavioral_fusion',
  'geospatial-communication': 'geospatial_communication_fusion',
  'financial-document': 'financial_document_synthesis',
  'calendar-pattern': 'calendar_pattern_analysis',
  // New v6.0 Advanced Intelligence engines
  'relationship-half-life': 'relationship_half_life',
  'automated-red-team': 'automated_red_team',
  'multi-party-deception': 'multi_party_deception',
  'zero-day-anomaly': 'zero_day_anomaly',
  'hypergame-theory': 'hypergame_theory',
  // v7.0 Extreme Intelligence Engines
  'subvocalization-detection': 'subvocalization_detection',
  'audio-burst-mental-state': 'audio_burst_mental_state',
  'iio-attribution': 'iio_attribution',
  'reflexive-control': 'reflexive_control',
  'cognitive-effect': 'cognitive_effect',
  'kallisti-theory-of-mind': 'kallisti_theory_of_mind',
  'magics-collective-behavior': 'magics_collective_behavior',
  'stylometric-authorship': 'stylometric_authorship',
  'dark2clear-deanonymization': 'dark2clear_deanonymization',
  'gated-biological-fusion': 'gated_biological_fusion',
  'tas-com-community': 'tas_com_community',
  'migration5-biometric': 'migration5_biometric',
  // v8.0 Phase 1 - Counter-Intelligence
  'draco-deception-orchestrator': 'draco_deception',
  'sentient-intent-analyzer': 'sentient_intent',
  'insider-threat-matrix': 'insider_threat_matrix',
  'bayesian-intention-predictor': 'bayesian_intention',
  'red-team-adversary-simulator': 'red_team_adversary',
  'semafor-forgery-detector': 'semafor_forgery',
  'epistemic-vulnerability-scanner': 'epistemic_vulnerability',
  'cognitive-iw-detector': 'cognitive_iw_detection',
  // v8.0 Phase 2 - Psychological Warfare
  'psychoagent-cascade-predictor': 'psychoagent_cascade',
  'affective-manipulation-detector': 'affective_manipulation',
  'hyperpersonalization-engine': 'hyperpersonalization',
  'computational-persuasion-engine': 'computational_persuasion',
  'synthetic-memory-generator': 'synthetic_memory',
  'premem-belief-modifier': 'premem_belief',
  'linguistic-stress-detector': 'linguistic_stress',
  'memory-anchor-generator': 'memory_anchor',
  'emotional-contagion-modeler': 'emotional_contagion',
  'sacred-value-predictor': 'sacred_value',
  // v8.0 Phase 3 - Biometric & Network
  'pupillometry-analyzer': 'pupillometry',
  'thermal-stress-detector': 'thermal_stress',
  'attention-multimodal-fuser': 'attention_multimodal',
  'keystroke-dynamics-analyzer': 'keystroke_dynamics',
  'sheaf-neural-influence-mapper': 'sheaf_neural_influence',
  'ctdg-link-predictor': 'ctdg_link_prediction',
  'cascade-virality-predictor': 'cascade_virality',
  'network-resilience-analyzer': 'network_resilience',
  'gaze-pattern-analyzer': 'gaze_pattern',
  'micro-expression-timeline': 'micro_expression_timeline',
  'voice-stress-correlator': 'voice_stress_correlation',
  'social-graph-predictor': 'social_graph_prediction',
  'behavioral-fingerprint-engine': 'behavioral_fingerprint',
  // v8.0 Phase 4 - Doctrine & Prediction
  'influence-campaign-optimizer': 'influence_campaign',
  'counter-narrative-generator': 'counter_narrative',
  'predictive-doctrine-engine': 'predictive_doctrine',
  'cognitive-defense-simulator': 'cognitive_defense',
  // v9.0 Warfare Engines
  'mice-recruitment': 'mice_recruitment',
  'betrayal-likelihood': 'betrayal_likelihood',
  'semantic-warfare': 'semantic_warfare',
  'memetic-propagation': 'memetic_propagation',
  'sacred-values': 'sacred_values',
  'elicitation': 'elicitation_guide',
  'cognitive-warfare': 'cognitive_warfare',
  'gottman-relationship': 'gottman_relationship',
};

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
  private fusionRepository: IFusionRepository | null = null;
  private twinRepository: IDigitalTwinRepository | null = null;

  constructor(
    fusionRepository?: IFusionRepository,
    twinRepository?: IDigitalTwinRepository
  ) {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'yibszncvwmefwamayfty';
    this.edgeFunctionBaseUrl = `https://${projectId}.supabase.co/functions/v1`;
    this.fusionRepository = fusionRepository || null;
    this.twinRepository = twinRepository || null;
  }

  /**
   * Get analysis type for a fusion engine
   */
  getAnalysisType(engineType: FusionEngineType): string {
    return FUSION_ANALYSIS_TYPES[engineType];
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
   * Get fusion results for a profile (DDD-compliant via repository)
   */
  async getFusionResults(profileId: string, engineType?: FusionEngineType): Promise<FusionResult[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use repository if available (DDD pattern)
    if (this.fusionRepository) {
      const options: FusionQueryOptions = {
        profileId,
        engineType,
        limit: 10,
        orderBy: 'created_at'
      };
      return this.fusionRepository.findByProfile(user.id, profileId, options);
    }

    // Fallback: Query ai_analyses table directly
    const results: FusionResult[] = [];
    const analysisTypes = engineType 
      ? [this.getAnalysisType(engineType)]
      : Object.values(FUSION_ANALYSIS_TYPES);

    const { data, error } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('profile_id', profileId)
      .in('analysis_type', analysisTypes)
      .order('generated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[FusionService] Error fetching results:', error);
      return [];
    }

    if (data) {
      results.push(...data.map((row: any) => {
        const engine = this.getEngineFromAnalysisType(row.analysis_type);
        return this.mapRowToFusionResult(row, engine);
      }));
    }

    return results;
  }

  /**
   * Update or create a digital twin (DDD-compliant via repository)
   */
  async updateDigitalTwin(
    profileId: string,
    patterns: BehaviorPattern[]
  ): Promise<DigitalTwin | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Use repository if available (DDD pattern)
    if (this.twinRepository) {
      let twin = await this.twinRepository.findByProfile(user.id, profileId);
      
      if (!twin) {
        twin = new DigitalTwin(
          crypto.randomUUID(),
          profileId,
          user.id
        );
      }

      // Add new patterns
      patterns.forEach(pattern => twin!.addBehaviorPattern(pattern));

      // Save via repository
      const savedTwin = await this.twinRepository.save(twin);

      // Publish event
      const eventBus = getEventBus();
      await eventBus.publish(new DigitalTwinUpdated(profileId, patterns.length));

      return savedTwin;
    }

    // Fallback: Direct Supabase query
    const { data: existing } = await supabase
      .from('digital_twins')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    const twin = existing
      ? new DigitalTwin(
          existing.id,
          profileId,
          user.id,
          (existing.twin_state as any)?.version || 1,
          (existing.behavioral_parameters as unknown as any[]) || [],
          (existing.simulation_history as unknown as any[]) || [],
          existing.calibration_accuracy ? { calibrationScore: existing.calibration_accuracy, predictionCount: 0, correctPredictions: 0, lastCalibrated: existing.last_calibration_at || new Date().toISOString() } : undefined,
          (existing.twin_state as any) || {},
          existing.is_active ?? true
        )
      : new DigitalTwin(
          crypto.randomUUID(),
          profileId,
          user.id
        );

    // Add new patterns
    patterns.forEach(pattern => twin.addBehaviorPattern(pattern));

    // Save to database
    const { error } = await supabase
      .from('digital_twins')
      .upsert([{
        id: twin.id,
        profile_id: twin.profileId,
        user_id: twin.userId,
        behavioral_parameters: twin.behaviorPatterns as unknown as import('@/integrations/supabase/types').Json,
        simulation_history: twin.simulationHistory as unknown as import('@/integrations/supabase/types').Json,
        twin_state: { ...twin.modelState, version: twin.twinVersion } as unknown as import('@/integrations/supabase/types').Json,
        calibration_accuracy: twin.metrics?.calibrationScore || null,
        is_active: twin.isActive,
        updated_at: new Date().toISOString(),
      }]);

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
      
      // Store simulation in repository if available
      if (this.twinRepository && data.scenarioId && session.user) {
        const scenario: SimulationScenario = {
          scenarioId: data.scenarioId,
          name: scenarioName,
          conditions,
          predictedOutcome: data.predictedOutcome,
          probability: data.probability,
          timestamp: new Date(),
        };
        await this.twinRepository.addSimulation(session.user.id, data.twinId, scenario);
      }

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
      // New v5.0 fusion engines
      'biometric-behavioral': 'biometric-behavioral-fusion',
      'geospatial-communication': 'geospatial-communication-fusion',
      'financial-document': 'financial-document-synthesis',
      'calendar-pattern': 'calendar-pattern-analyzer',
      // New v6.0 Advanced Intelligence engines
      'relationship-half-life': 'relationship-half-life-calculator',
      'automated-red-team': 'automated-red-team-engine',
      'multi-party-deception': 'multi-party-deception-detector',
      'zero-day-anomaly': 'zero-day-anomaly-detector',
      'hypergame-theory': 'hypergame-theory-engine',
      // v7.0 Extreme Intelligence Engines
      'subvocalization-detection': 'subvocalization-detector',
      'audio-burst-mental-state': 'audio-burst-analyzer',
      'iio-attribution': 'iio-attribution-engine',
      'reflexive-control': 'reflexive-control-detector',
      'cognitive-effect': 'cognitive-effect-orchestrator',
      'kallisti-theory-of-mind': 'kallisti-theory-of-mind',
      'magics-collective-behavior': 'collective-behavior-predictor',
      'stylometric-authorship': 'stylometric-analyzer',
      'dark2clear-deanonymization': 'dark2clear-deanonymization',
      'gated-biological-fusion': 'gated-biological-fusion',
      'tas-com-community': 'tas-com-community-detector',
      'migration5-biometric': 'migration5-biometric-tracker',
      // v8.0 Phase 1 - Counter-Intelligence
      'draco-deception-orchestrator': 'draco-deception-orchestrator',
      'sentient-intent-analyzer': 'sentient-intent-analyzer',
      'insider-threat-matrix': 'insider-threat-matrix',
      'bayesian-intention-predictor': 'bayesian-intention-predictor',
      'red-team-adversary-simulator': 'red-team-adversary-simulator',
      'semafor-forgery-detector': 'semafor-forgery-detector',
      'epistemic-vulnerability-scanner': 'epistemic-vulnerability-scanner',
      'cognitive-iw-detector': 'cognitive-iw-detector',
      // v8.0 Phase 2 - Psychological Warfare
      'psychoagent-cascade-predictor': 'psychoagent-cascade-predictor',
      'affective-manipulation-detector': 'affective-manipulation-detector',
      'hyperpersonalization-engine': 'hyperpersonalization-engine',
      'computational-persuasion-engine': 'computational-persuasion-engine',
      'synthetic-memory-generator': 'synthetic-memory-generator',
      'premem-belief-modifier': 'premem-belief-modifier',
      'linguistic-stress-detector': 'linguistic-stress-detector',
      'memory-anchor-generator': 'memory-anchor-generator',
      'emotional-contagion-modeler': 'emotional-contagion-modeler',
      'sacred-value-predictor': 'sacred-value-predictor',
      // v8.0 Phase 3 - Biometric & Network
      'pupillometry-analyzer': 'pupillometry-analyzer',
      'thermal-stress-detector': 'thermal-stress-detector',
      'attention-multimodal-fuser': 'attention-multimodal-fuser',
      'keystroke-dynamics-analyzer': 'keystroke-dynamics-analyzer',
      'sheaf-neural-influence-mapper': 'sheaf-neural-influence-mapper',
      'ctdg-link-predictor': 'ctdg-link-predictor',
      'cascade-virality-predictor': 'cascade-virality-predictor',
      'network-resilience-analyzer': 'network-resilience-analyzer',
      'gaze-pattern-analyzer': 'gaze-pattern-analyzer',
      'micro-expression-timeline': 'micro-expression-timeline',
      'voice-stress-correlator': 'voice-stress-correlator',
      'social-graph-predictor': 'social-graph-predictor',
      'behavioral-fingerprint-engine': 'behavioral-fingerprint-engine',
      // v8.0 Phase 4 - Doctrine & Prediction
      'influence-campaign-optimizer': 'influence-campaign-optimizer',
      'counter-narrative-generator': 'counter-narrative-generator',
      'predictive-doctrine-engine': 'predictive-doctrine-engine',
      'cognitive-defense-simulator': 'cognitive-defense-simulator',
      // v9.0 Warfare Engines
      'mice-recruitment': 'mice-recruitment-analyzer',
      'betrayal-likelihood': 'betrayal-likelihood-scorer',
      'semantic-warfare': 'semantic-warfare-engine',
      'memetic-propagation': 'memetic-propagation-engine',
      'sacred-values': 'sacred-values-mapper',
      'elicitation': 'elicitation-engine',
      'cognitive-warfare': 'cognitive-warfare-engine',
      'gottman-relationship': 'gottman-relationship-analyzer',
    };
    return mapping[engineType];
  }

  private getEngineFromAnalysisType(analysisType: string): FusionEngineType {
    const reverseMapping: Record<string, FusionEngineType> = {};
    for (const [engine, type] of Object.entries(FUSION_ANALYSIS_TYPES)) {
      reverseMapping[type] = engine as FusionEngineType;
    }
    return reverseMapping[analysisType] || 'temporal-fusion-transformer';
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
      row.created_at ? new Date(row.created_at) : row.generated_at ? new Date(row.generated_at) : undefined,
      row.updated_at ? new Date(row.updated_at) : row.generated_at ? new Date(row.generated_at) : undefined
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

/**
 * Factory function to create FusionService with DI repositories
 */
export function createFusionService(
  fusionRepository: IFusionRepository,
  twinRepository: IDigitalTwinRepository
): FusionService {
  return new FusionService(fusionRepository, twinRepository);
}
