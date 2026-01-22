/**
 * IFusionRepository - Repository Interface for Fusion Domain (v3.9.0)
 * 
 * Defines the contract for data access operations related to fusion results
 * and digital twin management. Follows DDD repository pattern.
 */

import type { FusionResult, FusionEngineType } from '../entities/FusionResult';
import type { DigitalTwin, BehaviorPattern, SimulationScenario } from '../entities/DigitalTwin';

// ============================================
// Query Options
// ============================================

export interface FusionQueryOptions {
  profileId?: string;
  engineType?: FusionEngineType;
  limit?: number;
  orderBy?: 'created_at' | 'confidence';
  orderDirection?: 'asc' | 'desc';
  minConfidence?: number;
  maxAgeDays?: number;
}

export interface DigitalTwinQueryOptions {
  includeSimulations?: boolean;
  includePatterns?: boolean;
  onlyActive?: boolean;
}

// ============================================
// Analysis Type Mapping
// ============================================

/**
 * Maps FusionEngineType to unique analysis_type values stored in ai_analyses table.
 * Each engine MUST have a unique analysis_type for proper data isolation.
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
};

/**
 * Reverse mapping: analysis_type -> FusionEngineType
 */
export const ANALYSIS_TYPE_TO_ENGINE: Record<string, FusionEngineType> = Object.fromEntries(
  Object.entries(FUSION_ANALYSIS_TYPES).map(([engine, type]) => [type, engine as FusionEngineType])
);

// ============================================
// IFusionRepository Interface
// ============================================

export interface IFusionRepository {
  /**
   * Find all fusion results for a user
   */
  findAll(userId: string, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find fusion results for a specific profile
   */
  findByProfile(userId: string, profileId: string, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find fusion results by engine type
   */
  findByEngine(userId: string, engineType: FusionEngineType, options?: FusionQueryOptions): Promise<FusionResult[]>;

  /**
   * Find the latest result for a specific engine and profile
   */
  findLatestByEngine(userId: string, profileId: string, engineType: FusionEngineType): Promise<FusionResult | null>;

  /**
   * Find a single fusion result by ID
   */
  findById(userId: string, resultId: string): Promise<FusionResult | null>;

  /**
   * Save a fusion result
   */
  save(result: FusionResult): Promise<FusionResult>;

  /**
   * Delete a fusion result
   */
  delete(userId: string, resultId: string): Promise<boolean>;

  /**
   * Count fusion results by engine for a profile
   */
  countByEngine(userId: string, profileId: string): Promise<Map<FusionEngineType, number>>;

  /**
   * Check if any engine results are stale (older than maxAgeDays)
   */
  findStaleEngines(userId: string, profileId: string, maxAgeDays: number): Promise<FusionEngineType[]>;
}

// ============================================
// IDigitalTwinRepository Interface
// ============================================

export interface IDigitalTwinRepository {
  /**
   * Find a digital twin by profile ID
   */
  findByProfile(userId: string, profileId: string, options?: DigitalTwinQueryOptions): Promise<DigitalTwin | null>;

  /**
   * Find all digital twins for a user
   */
  findAll(userId: string, options?: DigitalTwinQueryOptions): Promise<DigitalTwin[]>;

  /**
   * Find a digital twin by ID
   */
  findById(userId: string, twinId: string): Promise<DigitalTwin | null>;

  /**
   * Save or update a digital twin
   */
  save(twin: DigitalTwin): Promise<DigitalTwin>;

  /**
   * Delete a digital twin
   */
  delete(userId: string, twinId: string): Promise<boolean>;

  /**
   * Add behavior patterns to a twin
   */
  addPatterns(userId: string, twinId: string, patterns: BehaviorPattern[]): Promise<DigitalTwin | null>;

  /**
   * Add a simulation scenario to a twin's history
   */
  addSimulation(userId: string, twinId: string, scenario: SimulationScenario): Promise<DigitalTwin | null>;

  /**
   * Deactivate a digital twin
   */
  deactivate(userId: string, twinId: string): Promise<boolean>;
}
