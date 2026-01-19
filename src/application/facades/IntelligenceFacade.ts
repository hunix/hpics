/**
 * Intelligence Facade - Simplified API for UI components
 * 
 * Provides a clean interface for UI components to interact with
 * the Intelligence domain without knowing implementation details.
 */

import { 
  IntelligenceService, 
  getIntelligenceService,
  AnalysisRequest,
  DossierRequest,
  IntelligenceSummary,
} from '@/domains/intelligence/services/IntelligenceService';
import { Analysis, AnalysisType } from '@/domains/intelligence/entities/Analysis';
import { Dossier, DossierTemplate } from '@/domains/intelligence/entities/Dossier';
import { Insight } from '@/domains/intelligence/entities/Insight';
import { FusionFacade, getFusionFacade } from './FusionFacade';

/**
 * Comprehensive intelligence package for a profile
 */
export interface IntelligencePackage {
  analyses: Analysis[];
  dossier: Dossier | null;
  insights: Insight[];
  summary: IntelligenceSummary;
  fusionStatus: {
    status: 'none' | 'partial' | 'complete' | 'stale';
    percentage: number;
  };
}

/**
 * Quick scan options
 */
export interface QuickScanOptions {
  includeVoice?: boolean;
  includeBiometric?: boolean;
  includeNetwork?: boolean;
}

/**
 * Intelligence Facade - Entry point for UI to access intelligence functionality
 */
export class IntelligenceFacade {
  private service: IntelligenceService;
  private fusionFacade: FusionFacade;

  constructor(service?: IntelligenceService, fusionFacade?: FusionFacade) {
    this.service = service || getIntelligenceService();
    this.fusionFacade = fusionFacade || getFusionFacade();
  }

  /**
   * Run a quick scan with common analysis types
   */
  async runQuickScan(profileId: string, options: QuickScanOptions = {}): Promise<Analysis[]> {
    const analysisTypes: AnalysisType[] = ['behavioral', 'psychological'];
    
    if (options.includeVoice) analysisTypes.push('voice');
    if (options.includeBiometric) analysisTypes.push('biometric');
    if (options.includeNetwork) analysisTypes.push('network');

    return this.service.runAnalyses({
      profileId,
      analysisTypes,
    });
  }

  /**
   * Run comprehensive analysis
   */
  async runComprehensiveAnalysis(profileId: string): Promise<Analysis[]> {
    const allTypes: AnalysisType[] = [
      'behavioral',
      'psychological',
      'communication',
      'network',
      'biometric',
    ];

    return this.service.runAnalyses({
      profileId,
      analysisTypes: allTypes,
      options: { deepAnalysis: true },
    });
  }

  /**
   * Generate a dossier with specified template
   */
  async generateDossier(profileId: string, template: DossierTemplate = 'full'): Promise<Dossier | null> {
    return this.service.generateDossier({
      profileId,
      template,
      options: {
        includeWarfare: template === 'warfare' || template === 'full',
        includeFusion: template === 'data-fusion' || template === 'full',
      },
    });
  }

  /**
   * Get complete intelligence package for a profile
   */
  async getIntelligencePackage(profileId: string): Promise<IntelligencePackage> {
    const [analyses, dossier, insights, summary, fusionStatus] = await Promise.all([
      this.service.getAnalyses(profileId),
      this.service.getLatestDossier(profileId),
      this.service.getActiveInsights(profileId),
      this.service.getIntelligenceSummary(profileId),
      this.fusionFacade.getQuickStatus(profileId),
    ]);

    return {
      analyses,
      dossier,
      insights,
      summary,
      fusionStatus,
    };
  }

  /**
   * Get quick status for dashboard display
   */
  async getQuickStatus(profileId: string): Promise<{
    status: 'none' | 'minimal' | 'partial' | 'complete';
    message: string;
    actionRequired: boolean;
  }> {
    const summary = await this.service.getIntelligenceSummary(profileId);

    if (summary.analysisCount === 0) {
      return {
        status: 'none',
        message: 'No intelligence data',
        actionRequired: true,
      };
    }

    if (summary.dossierStatus === 'stale' || summary.dossierStatus === 'none') {
      return {
        status: 'partial',
        message: `${summary.analysisCount} analyses, dossier ${summary.dossierStatus}`,
        actionRequired: true,
      };
    }

    if (summary.analysisCount < 3) {
      return {
        status: 'minimal',
        message: 'Basic intelligence available',
        actionRequired: false,
      };
    }

    return {
      status: 'complete',
      message: `Full intelligence profile (${summary.analysisCount} analyses)`,
      actionRequired: summary.activeInsights > 0,
    };
  }

  /**
   * Run full intelligence workflow
   */
  async runFullWorkflow(profileId: string): Promise<{
    analyses: Analysis[];
    dossier: Dossier | null;
    fusionResults: number;
  }> {
    // Run analyses
    const analyses = await this.runComprehensiveAnalysis(profileId);

    // Run fusion engines
    const fusionResults = await this.fusionFacade.runSmartFusion(profileId);
    const fusionSuccessCount = Array.from(fusionResults.values()).filter(r => r.success).length;

    // Aggregate intelligence
    await this.service.aggregateIntelligence(profileId);

    // Generate dossier
    const dossier = await this.generateDossier(profileId, 'full');

    return {
      analyses,
      dossier,
      fusionResults: fusionSuccessCount,
    };
  }

  /**
   * Get profiles needing attention
   */
  async getProfilesNeedingAttention(profileIds: string[]): Promise<Array<{
    profileId: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>> {
    const results: Array<{ profileId: string; reason: string; priority: 'low' | 'medium' | 'high' }> = [];

    for (const profileId of profileIds) {
      const summary = await this.service.getIntelligenceSummary(profileId);

      if (summary.analysisCount === 0) {
        results.push({
          profileId,
          reason: 'No intelligence data',
          priority: 'medium',
        });
      } else if (summary.dossierStatus === 'stale') {
        results.push({
          profileId,
          reason: 'Stale dossier needs refresh',
          priority: 'low',
        });
      } else if (summary.activeInsights > 3) {
        results.push({
          profileId,
          reason: `${summary.activeInsights} unaddressed insights`,
          priority: 'high',
        });
      }
    }

    return results.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}

// Singleton instance
let facadeInstance: IntelligenceFacade | null = null;

export function getIntelligenceFacade(): IntelligenceFacade {
  if (!facadeInstance) {
    facadeInstance = new IntelligenceFacade();
  }
  return facadeInstance;
}
