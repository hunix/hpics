/**
 * Warfare Facade
 * Simplified interface for common warfare operations
 */

import { WarfareService, type WarfareSummary } from '@/domains/warfare';
import type { Campaign, CampaignType } from '@/domains/warfare';
import type { Threat, ThreatLevel } from '@/domains/warfare';

export interface WarfareStatus {
  overall: 'secure' | 'elevated' | 'critical';
  activeCampaigns: number;
  activeThreats: number;
  riskLevel: ThreatLevel;
  recommendations: string[];
}

export interface QuickCampaignSetup {
  name: string;
  type: CampaignType;
  targetIds: string[];
  autoActivate?: boolean;
}

export class WarfareFacade {
  constructor(private warfareService: WarfareService) {}

  // Get quick status for dashboard
  async getStatus(userId: string): Promise<WarfareStatus> {
    const summary = await this.warfareService.getWarfareSummary(userId);
    const recommendations: string[] = [];

    // Generate recommendations
    if (summary.criticalThreats > 0) {
      recommendations.push(`Address ${summary.criticalThreats} critical threat(s) immediately`);
    }

    if (summary.activeCampaigns === 0 && summary.activeStrategies > 0) {
      recommendations.push('Consider launching campaigns to execute your strategies');
    }

    if (summary.overallRiskScore > 70) {
      recommendations.push('Risk level is elevated - review defensive measures');
    }

    // Determine overall status
    let overall: 'secure' | 'elevated' | 'critical' = 'secure';
    let riskLevel: ThreatLevel = 'minimal';

    if (summary.criticalThreats > 0 || summary.overallRiskScore > 80) {
      overall = 'critical';
      riskLevel = 'critical';
    } else if (summary.activeThreats > 3 || summary.overallRiskScore > 50) {
      overall = 'elevated';
      riskLevel = 'high';
    } else if (summary.activeThreats > 0) {
      riskLevel = 'medium';
    }

    return {
      overall,
      activeCampaigns: summary.activeCampaigns,
      activeThreats: summary.activeThreats,
      riskLevel,
      recommendations,
    };
  }

  // Quick campaign setup
  async quickLaunchCampaign(
    userId: string,
    setup: QuickCampaignSetup
  ): Promise<Campaign> {
    const campaign = await this.warfareService.createCampaign({
      userId,
      name: setup.name,
      description: `Quick-launched ${setup.type} campaign`,
      type: setup.type,
      targetProfileIds: setup.targetIds,
    });

    if (setup.autoActivate) {
      return this.warfareService.activateCampaign(userId, campaign.id);
    }

    return campaign;
  }

  // Get top threats requiring attention
  async getTopThreats(userId: string, limit: number = 5): Promise<Threat[]> {
    const threats = await this.warfareService.getThreats(userId, 'active');
    
    return threats
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  }

  // Get active campaigns with progress
  async getCampaignsWithProgress(userId: string): Promise<Array<Campaign & { progress: number }>> {
    const campaigns = await this.warfareService.getCampaigns(userId, 'active');
    
    return campaigns.map(c => {
      const totalObjectives = c.objectives.length;
      const achieved = c.objectives.filter(o => o.status === 'achieved').length;
      const progress = totalObjectives > 0 ? (achieved / totalObjectives) * 100 : 0;
      
      return { ...c, progress };
    });
  }

  // Run quick threat scan
  async runQuickThreatScan(userId: string): Promise<{
    newThreats: number;
    escalated: number;
    mitigated: number;
  }> {
    const before = await this.warfareService.getThreats(userId);
    const beforeCritical = before.filter(t => t.level === 'critical' || t.level === 'high').length;
    
    const assessed = await this.warfareService.assessThreats({ userId, scope: 'quick' });
    const afterCritical = assessed.filter(t => t.level === 'critical' || t.level === 'high').length;
    
    return {
      newThreats: Math.max(0, assessed.length - before.length),
      escalated: Math.max(0, afterCritical - beforeCritical),
      mitigated: before.filter(t => t.status === 'active').length - assessed.filter(t => t.status === 'active').length,
    };
  }
}
