/**
 * Fusion Facade - Simplified API for UI components
 * 
 * Provides a clean interface for UI components to interact with
 * the Fusion domain without knowing implementation details.
 */

import { 
  FusionService, 
  getFusionService, 
  FusionRequest, 
  FusionResponse,
  BatchFusionRequest 
} from '@/domains/fusion/services/FusionService';
import { FusionResult, FusionEngineType } from '@/domains/fusion/entities/FusionResult';
import { DigitalTwin, BehaviorPattern, SimulationScenario } from '@/domains/fusion/entities/DigitalTwin';
import { getContainer, ServiceKeys } from '@/infrastructure/di/Container';

/**
 * High-level summary of fusion status for a profile
 */
export interface FusionSummary {
  profileId: string;
  enginesRun: number;
  averageConfidence: number;
  lastFusionDate: Date | null;
  staleEngines: FusionEngineType[];
  recommendations: string[];
}

/**
 * Fusion Facade - Entry point for UI to access fusion functionality
 */
export class FusionFacade {
  private service: FusionService;

  constructor(service?: FusionService) {
    this.service = service || getFusionService();
  }

  /**
   * Execute a single fusion engine
   */
  async runFusion(profileId: string, engine: FusionEngineType): Promise<FusionResponse> {
    return this.service.executeFusion({
      profileId,
      engineType: engine,
    });
  }

  /**
   * Execute all fusion engines for a profile
   */
  async runAllFusions(profileId: string): Promise<Map<FusionEngineType, FusionResponse>> {
    const allEngines: FusionEngineType[] = [
      'temporal-fusion-transformer',
      'behavioral-digital-twin',
      'graph-rag',
      'shadow-network',
      'dempster-shafer',
      'counterfactual',
      'pattern-of-life',
      'entity-resolution',
      'sentiment-cascade',
      // v5.0 engines
      'biometric-behavioral',
      'geospatial-communication',
      'financial-document',
      'calendar-pattern',
      // v6.0 Advanced Intelligence engines
      'relationship-half-life',
      'automated-red-team',
      'multi-party-deception',
      'zero-day-anomaly',
      'hypergame-theory',
    ];

    return this.service.executeBatchFusion({
      profileId,
      engines: allEngines,
    });
  }

  /**
   * Get fusion summary for a profile
   */
  async getFusionSummary(profileId: string): Promise<FusionSummary> {
    const results = await this.service.getFusionResults(profileId);
    
    const staleEngines: FusionEngineType[] = [];
    let totalConfidence = 0;
    let latestDate: Date | null = null;

    for (const result of results) {
      totalConfidence += result.confidenceValue;
      
      if (!latestDate || result.createdAt > latestDate) {
        latestDate = result.createdAt;
      }

      if (result.isStale(24)) {
        staleEngines.push(result.engineType);
      }
    }

    const recommendations = this.generateRecommendations(results, staleEngines);

    return {
      profileId,
      enginesRun: results.length,
      averageConfidence: results.length > 0 ? totalConfidence / results.length : 0,
      lastFusionDate: latestDate,
      staleEngines,
      recommendations,
    };
  }

  /**
   * Run smart fusion - only engines that are stale or missing
   */
  async runSmartFusion(profileId: string): Promise<Map<FusionEngineType, FusionResponse>> {
    const summary = await this.getFusionSummary(profileId);
    
    const allEngines: FusionEngineType[] = [
      'temporal-fusion-transformer',
      'behavioral-digital-twin',
      'graph-rag',
      'shadow-network',
      'dempster-shafer',
      'counterfactual',
      'pattern-of-life',
      'entity-resolution',
      'sentiment-cascade',
      // v5.0 engines
      'biometric-behavioral',
      'geospatial-communication',
      'financial-document',
      'calendar-pattern',
      // v6.0 Advanced Intelligence engines
      'relationship-half-life',
      'automated-red-team',
      'multi-party-deception',
      'zero-day-anomaly',
      'hypergame-theory',
    ];

    const existingResults = await this.service.getFusionResults(profileId);
    const existingEngines = new Set(existingResults.map(r => r.engineType));
    
    // Run stale or missing engines
    const enginesToRun = allEngines.filter(engine => 
      summary.staleEngines.includes(engine) || !existingEngines.has(engine)
    );

    if (enginesToRun.length === 0) {
      return new Map();
    }

    return this.service.executeBatchFusion({
      profileId,
      engines: enginesToRun,
    });
  }

  /**
   * Update digital twin with new behavior patterns
   */
  async updateDigitalTwin(profileId: string, patterns: BehaviorPattern[]): Promise<DigitalTwin | null> {
    return this.service.updateDigitalTwin(profileId, patterns);
  }

  /**
   * Run a simulation on a digital twin
   */
  async runSimulation(
    profileId: string, 
    scenarioName: string, 
    conditions: Record<string, unknown>
  ): Promise<SimulationScenario | null> {
    return this.service.runTwinSimulation(profileId, scenarioName, conditions);
  }

  /**
   * Get quick fusion status for dashboard display
   */
  async getQuickStatus(profileId: string): Promise<{
    status: 'none' | 'partial' | 'complete' | 'stale';
    percentage: number;
    message: string;
  }> {
    const results = await this.service.getFusionResults(profileId);
    const totalEngines = 18; // Updated for v6.0 (9 original + 4 v5.0 + 5 v6.0)
    const freshResults = results.filter(r => !r.isStale(24));

    if (results.length === 0) {
      return { status: 'none', percentage: 0, message: 'No fusion data' };
    }

    if (freshResults.length === 0) {
      return { status: 'stale', percentage: 100, message: 'All fusion data is stale' };
    }

    const percentage = (freshResults.length / totalEngines) * 100;

    if (freshResults.length === totalEngines) {
      return { status: 'complete', percentage: 100, message: 'All engines current' };
    }

    return { 
      status: 'partial', 
      percentage, 
      message: `${freshResults.length}/${totalEngines} engines current` 
    };
  }

  // Private helpers

  private generateRecommendations(results: FusionResult[], staleEngines: FusionEngineType[]): string[] {
    const recommendations: string[] = [];

    if (staleEngines.length > 0) {
      recommendations.push(`Refresh ${staleEngines.length} stale fusion engine(s)`);
    }

    const lowConfidenceResults = results.filter(r => r.confidenceValue < 0.6);
    if (lowConfidenceResults.length > 0) {
      recommendations.push('Collect more data to improve fusion confidence');
    }

    if (results.length < 5) {
      recommendations.push('Run additional fusion engines for comprehensive analysis');
    }

    return recommendations;
  }
}

// Singleton instance
let facadeInstance: FusionFacade | null = null;

export function getFusionFacade(): FusionFacade {
  if (!facadeInstance) {
    facadeInstance = new FusionFacade();
  }
  return facadeInstance;
}
