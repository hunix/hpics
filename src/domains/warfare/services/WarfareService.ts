/**
 * Warfare Domain Service
 * 
 * Refactored to use IWarfareRepository for persistence (DDD pattern).
 */

import type { Campaign, CampaignStatus, CampaignType } from '../entities/Campaign';
import type { Threat, ThreatLevel, ThreatStatus } from '../entities/Threat';
import type { Strategy } from '../entities/Strategy';
import { calculateRiskScore } from '../entities/Threat';
import { IWarfareRepository, ICampaignRepository, IThreatRepository, IStrategyRepository } from '../repositories/IWarfareRepository';
import { CampaignCreated, CampaignActivated, ThreatDetected } from '../events/WarfareEvents';
import { getEventBus, IEventBus } from '@/domains/shared/events/EventBus';

export interface CampaignCreateRequest {
  userId: string;
  name: string;
  description: string;
  type: CampaignType;
  targetProfileIds?: string[];
}

export interface ThreatAssessmentRequest {
  userId: string;
  profileId?: string;
  scope?: 'full' | 'quick';
}

export interface WarfareSummary {
  activeCampaigns: number;
  completedCampaigns: number;
  activeThreats: number;
  criticalThreats: number;
  activeStrategies: number;
  overallRiskScore: number;
}

export class WarfareService {
  private eventBus: IEventBus;
  private campaignRepo: ICampaignRepository;
  private threatRepo: IThreatRepository;
  private strategyRepo: IStrategyRepository;

  constructor(warfareRepository: IWarfareRepository) {
    this.eventBus = getEventBus();
    this.campaignRepo = warfareRepository.campaigns;
    this.threatRepo = warfareRepository.threats;
    this.strategyRepo = warfareRepository.strategies;
  }

  private async emit(event: unknown): Promise<void> {
    await this.eventBus.publish(event as import('@/domains/shared/events/DomainEvent').DomainEvent);
  }

  async getCampaigns(userId: string, status?: CampaignStatus): Promise<Campaign[]> {
    if (status) {
      return this.campaignRepo.findByStatus(userId, status);
    }
    return this.campaignRepo.findByUserId(userId);
  }

  async getCampaign(userId: string, campaignId: string): Promise<Campaign | null> {
    const campaign = await this.campaignRepo.findById(campaignId);
    if (campaign && campaign.userId === userId) return campaign;
    return null;
  }

  async createCampaign(request: CampaignCreateRequest): Promise<Campaign> {
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      userId: request.userId,
      name: request.name,
      description: request.description,
      type: request.type,
      status: 'draft',
      priority: 'medium',
      objectives: [],
      targets: (request.targetProfileIds || []).map(id => ({
        profileId: id,
        name: '',
        role: 'primary' as const,
        influence: 0,
        vulnerability: 0,
      })),
      phases: [],
      budget: 0,
      spentBudget: 0,
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      metrics: { successRate: 0, reach: 0, engagement: 0, influence: 0, roi: 0 },
    };

    const saved = await this.campaignRepo.save(campaign);
    await this.emit(new CampaignCreated({ userId: request.userId, campaignId: saved.id, name: saved.name, type: saved.type }));
    return saved;
  }

  async activateCampaign(userId: string, campaignId: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.activate(userId, campaignId);
    await this.emit(new CampaignActivated({ userId, campaignId }));
    return campaign;
  }

  async getThreats(userId: string, status?: ThreatStatus): Promise<Threat[]> {
    if (status) {
      return this.threatRepo.findByStatus(userId, status);
    }
    return this.threatRepo.findByUserId(userId);
  }

  async assessThreats(request: ThreatAssessmentRequest): Promise<Threat[]> {
    const threats = await this.getThreats(request.userId);
    return threats.map(t => ({
      ...t,
      riskScore: calculateRiskScore(t.probability, t.impact),
      lastAssessedAt: new Date(),
    }));
  }

  async reportThreat(userId: string, name: string, description: string, level: ThreatLevel): Promise<Threat> {
    const threat: Threat = {
      id: crypto.randomUUID(),
      userId,
      name,
      description,
      type: 'operational',
      level,
      status: 'active',
      actors: [],
      indicators: [],
      countermeasures: [],
      affectedProfiles: [],
      affectedCampaigns: [],
      probability: 50,
      impact: 50,
      riskScore: calculateRiskScore(50, 50),
      detectedAt: new Date(),
      lastAssessedAt: new Date(),
      resolvedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const saved = await this.threatRepo.save(threat);
    this.emit(new ThreatDetected({ userId, threatId: saved.id, level, description }));
    return saved;
  }

  async getStrategies(userId: string): Promise<Strategy[]> {
    return this.strategyRepo.findByUserId(userId);
  }

  async getWarfareSummary(userId: string): Promise<WarfareSummary> {
    const [campaigns, threats, strategies] = await Promise.all([
      this.getCampaigns(userId),
      this.getThreats(userId),
      this.getStrategies(userId),
    ]);

    const overallRisk = await this.threatRepo.calculateOverallRisk(userId);

    return {
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      activeThreats: threats.filter(t => t.status === 'active').length,
      criticalThreats: threats.filter(t => t.level === 'critical').length,
      activeStrategies: strategies.filter(s => s.status === 'active').length,
      overallRiskScore: overallRisk,
    };
  }
}
