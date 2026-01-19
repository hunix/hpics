/**
 * Warfare Domain Service
 */

import { supabase } from '@/integrations/supabase/client';
import type { Campaign, CampaignStatus, CampaignType } from '../entities/Campaign';
import type { Threat, ThreatLevel, ThreatStatus } from '../entities/Threat';
import type { Strategy } from '../entities/Strategy';
import { calculateRiskScore, shouldEscalate } from '../entities/Threat';
import { CampaignCreated, CampaignActivated, ThreatDetected, ThreatEscalated } from '../events/WarfareEvents';

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
  private eventHandlers: ((event: unknown) => void)[] = [];

  onEvent(handler: (event: unknown) => void): () => void {
    this.eventHandlers.push(handler);
    return () => { this.eventHandlers = this.eventHandlers.filter(h => h !== handler); };
  }

  private emit(event: unknown): void {
    this.eventHandlers.forEach(handler => handler(event));
  }

  async getCampaigns(userId: string, status?: CampaignStatus): Promise<Campaign[]> {
    let query = supabase.from('autonomous_campaigns').select('*').eq('user_id', userId);
    if (status === 'active') query = query.eq('is_active', true);
    else if (status === 'completed') query = query.eq('is_active', false);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapCampaignFromDb);
  }

  async getCampaign(userId: string, campaignId: string): Promise<Campaign | null> {
    const { data, error } = await supabase.from('autonomous_campaigns').select('*').eq('user_id', userId).eq('id', campaignId).single();
    if (error) return null;
    return this.mapCampaignFromDb(data);
  }

  async createCampaign(request: CampaignCreateRequest): Promise<Campaign> {
    const { data, error } = await supabase.from('autonomous_campaigns').insert({
      user_id: request.userId, campaign_name: request.name, campaign_type: request.type,
      objective: request.description, is_active: false, auto_execute: false,
      trigger_conditions: {}, execution_rules: {}, success_criteria: {},
    }).select().single();
    if (error) throw error;
    const campaign = this.mapCampaignFromDb(data);
    this.emit(new CampaignCreated({ userId: request.userId, campaignId: campaign.id, name: campaign.name, type: campaign.type }));
    return campaign;
  }

  async activateCampaign(userId: string, campaignId: string): Promise<Campaign> {
    const { data, error } = await supabase.from('autonomous_campaigns').update({ is_active: true }).eq('user_id', userId).eq('id', campaignId).select().single();
    if (error) throw error;
    this.emit(new CampaignActivated({ userId, campaignId }));
    return this.mapCampaignFromDb(data);
  }

  async getThreats(userId: string, status?: ThreatStatus): Promise<Threat[]> {
    let query = supabase.from('active_defense_operations').select('*').eq('user_id', userId);
    if (status) query = query.eq('defense_posture', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapThreatFromDb.bind(this));
  }

  async assessThreats(request: ThreatAssessmentRequest): Promise<Threat[]> {
    const threats = await this.getThreats(request.userId);
    return threats.map(t => ({ ...t, riskScore: calculateRiskScore(t.probability, t.impact), lastAssessedAt: new Date() }));
  }

  async reportThreat(userId: string, name: string, description: string, level: ThreatLevel): Promise<Threat> {
    const { data, error } = await supabase.from('active_defense_operations').insert({
      user_id: userId, defense_type: name, threat_profile: { description, level }, defense_posture: 'active',
      escalation_level: this.getLevelNumber(level),
    }).select().single();
    if (error) throw error;
    const threat = this.mapThreatFromDb(data);
    this.emit(new ThreatDetected({ userId, threatId: threat.id, level, description }));
    return threat;
  }

  async getStrategies(userId: string): Promise<Strategy[]> { return []; }

  async getWarfareSummary(userId: string): Promise<WarfareSummary> {
    const [campaigns, threats] = await Promise.all([this.getCampaigns(userId), this.getThreats(userId)]);
    return {
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
      completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
      activeThreats: threats.filter(t => t.status === 'active').length,
      criticalThreats: threats.filter(t => t.level === 'critical').length,
      activeStrategies: 0,
      overallRiskScore: threats.length > 0 ? threats.reduce((s, t) => s + t.riskScore, 0) / threats.length : 0,
    };
  }

  private mapCampaignFromDb(row: any): Campaign {
    return {
      id: row.id, userId: row.user_id, name: row.campaign_name || 'Unnamed', description: row.objective || '',
      type: row.campaign_type || 'influence', status: row.is_active ? 'active' : 'draft', priority: 'medium',
      objectives: [], targets: [], phases: [], budget: 0, spentBudget: 0,
      startDate: null, endDate: null, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at || row.created_at),
      metrics: { successRate: row.success_rate || 0, reach: 0, engagement: 0, influence: 0, roi: 0 },
    };
  }

  private mapThreatFromDb(row: any): Threat {
    const profile = row.threat_profile || {};
    return {
      id: row.id, userId: row.user_id, name: row.defense_type || 'Unknown', description: profile.description || '',
      type: profile.type || 'operational', level: this.getLevel(row.escalation_level || 1), status: row.defense_posture || 'monitoring',
      actors: [], indicators: [], countermeasures: [], affectedProfiles: row.profile_id ? [row.profile_id] : [], affectedCampaigns: [],
      probability: profile.probability || 50, impact: profile.impact || 50, riskScore: calculateRiskScore(profile.probability || 50, profile.impact || 50),
      detectedAt: new Date(row.created_at), lastAssessedAt: new Date(row.updated_at || row.created_at), resolvedAt: null,
      createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at || row.created_at),
    };
  }

  private getLevelNumber(level: ThreatLevel): number {
    return { minimal: 1, low: 2, medium: 3, high: 4, critical: 5 }[level];
  }

  private getLevel(num: number): ThreatLevel {
    return (['minimal', 'low', 'medium', 'high', 'critical'] as ThreatLevel[])[Math.min(num - 1, 4)] || 'medium';
  }
}
