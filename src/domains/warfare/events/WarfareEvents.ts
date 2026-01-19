/**
 * Warfare Domain Events
 */

import type { Campaign, CampaignMetrics } from '../entities/Campaign';
import type { Threat, ThreatLevel } from '../entities/Threat';
import type { Strategy } from '../entities/Strategy';

export interface DomainEvent<T = unknown> {
  type: string;
  timestamp: Date;
  payload: T;
  getPayload(): T;
}

// Campaign Events
export class CampaignCreated implements DomainEvent<{
  userId: string;
  campaignId: string;
  name: string;
  type: string;
}> {
  readonly type = 'CAMPAIGN_CREATED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    campaignId: string;
    name: string;
    type: string;
  }) {}
  
  getPayload() { return this.payload; }
}

export class CampaignActivated implements DomainEvent<{
  userId: string;
  campaignId: string;
}> {
  readonly type = 'CAMPAIGN_ACTIVATED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    campaignId: string;
  }) {}
  
  getPayload() { return this.payload; }
}

export class CampaignCompleted implements DomainEvent<{
  userId: string;
  campaignId: string;
  metrics: CampaignMetrics;
}> {
  readonly type = 'CAMPAIGN_COMPLETED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    campaignId: string;
    metrics: CampaignMetrics;
  }) {}
  
  getPayload() { return this.payload; }
}

export class ObjectiveAchieved implements DomainEvent<{
  userId: string;
  campaignId: string;
  objectiveId: string;
  description: string;
}> {
  readonly type = 'OBJECTIVE_ACHIEVED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    campaignId: string;
    objectiveId: string;
    description: string;
  }) {}
  
  getPayload() { return this.payload; }
}

// Threat Events
export class ThreatDetected implements DomainEvent<{
  userId: string;
  threatId: string;
  level: ThreatLevel;
  description: string;
}> {
  readonly type = 'THREAT_DETECTED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    threatId: string;
    level: ThreatLevel;
    description: string;
  }) {}
  
  getPayload() { return this.payload; }
}

export class ThreatEscalated implements DomainEvent<{
  userId: string;
  threatId: string;
  previousLevel: ThreatLevel;
  newLevel: ThreatLevel;
}> {
  readonly type = 'THREAT_ESCALATED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    threatId: string;
    previousLevel: ThreatLevel;
    newLevel: ThreatLevel;
  }) {}
  
  getPayload() { return this.payload; }
}

export class ThreatMitigated implements DomainEvent<{
  userId: string;
  threatId: string;
  countermeasures: string[];
}> {
  readonly type = 'THREAT_MITIGATED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    threatId: string;
    countermeasures: string[];
  }) {}
  
  getPayload() { return this.payload; }
}

// Strategy Events
export class StrategyApproved implements DomainEvent<{
  userId: string;
  strategyId: string;
  approvedBy: string;
}> {
  readonly type = 'STRATEGY_APPROVED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    strategyId: string;
    approvedBy: string;
  }) {}
  
  getPayload() { return this.payload; }
}

export class PlaybookExecuted implements DomainEvent<{
  userId: string;
  strategyId: string;
  playbookId: string;
  outcome: 'success' | 'partial' | 'failure';
}> {
  readonly type = 'PLAYBOOK_EXECUTED';
  readonly timestamp = new Date();
  
  constructor(public readonly payload: {
    userId: string;
    strategyId: string;
    playbookId: string;
    outcome: 'success' | 'partial' | 'failure';
  }) {}
  
  getPayload() { return this.payload; }
}

export type WarfareDomainEvent =
  | CampaignCreated
  | CampaignActivated
  | CampaignCompleted
  | ObjectiveAchieved
  | ThreatDetected
  | ThreatEscalated
  | ThreatMitigated
  | StrategyApproved
  | PlaybookExecuted;
