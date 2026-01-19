/**
 * Warfare Repository Interface - DDD Repository Contract
 * 
 * Defines the contract for warfare and campaign data persistence.
 */

import { Campaign, CampaignStatus, CampaignType } from '../entities/Campaign';
import { Threat, ThreatLevel, ThreatStatus } from '../entities/Threat';
import { Strategy } from '../entities/Strategy';

/**
 * Campaign Repository Interface
 */
export interface ICampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findByUserId(userId: string): Promise<Campaign[]>;
  save(entity: Campaign): Promise<Campaign>;
  delete(id: string): Promise<void>;
  findByStatus(userId: string, status: CampaignStatus): Promise<Campaign[]>;
  findByType(userId: string, type: CampaignType): Promise<Campaign[]>;
  findActive(userId: string): Promise<Campaign[]>;
  activate(userId: string, campaignId: string): Promise<Campaign>;
  deactivate(userId: string, campaignId: string): Promise<Campaign>;
}

/**
 * Threat Repository Interface
 */
export interface IThreatRepository {
  findById(id: string): Promise<Threat | null>;
  findByUserId(userId: string): Promise<Threat[]>;
  save(entity: Threat): Promise<Threat>;
  delete(id: string): Promise<void>;
  findByLevel(userId: string, level: ThreatLevel): Promise<Threat[]>;
  findByStatus(userId: string, status: ThreatStatus): Promise<Threat[]>;
  findActive(userId: string): Promise<Threat[]>;
  findCritical(userId: string): Promise<Threat[]>;
  findByProfile(userId: string, profileId: string): Promise<Threat[]>;
  updateStatus(userId: string, threatId: string, status: ThreatStatus): Promise<Threat>;
  calculateOverallRisk(userId: string): Promise<number>;
}

/**
 * Strategy Repository Interface
 */
export interface IStrategyRepository {
  findById(id: string): Promise<Strategy | null>;
  findByUserId(userId: string): Promise<Strategy[]>;
  save(entity: Strategy): Promise<Strategy>;
  delete(id: string): Promise<void>;
  findByCampaign(userId: string, campaignId: string): Promise<Strategy[]>;
  findActive(userId: string): Promise<Strategy[]>;
}

/**
 * Warfare Repository Aggregate
 */
export interface IWarfareRepository {
  campaigns: ICampaignRepository;
  threats: IThreatRepository;
  strategies: IStrategyRepository;
}
