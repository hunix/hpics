/**
 * Campaign Entity
 * Core domain entity for strategic influence campaigns
 */

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignType = 'influence' | 'counter_influence' | 'monitoring' | 'defense' | 'reconnaissance';
export type CampaignPriority = 'critical' | 'high' | 'medium' | 'low';

export interface CampaignObjective {
  id: string;
  description: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  deadline: Date | null;
  status: 'pending' | 'in_progress' | 'achieved' | 'failed';
}

export interface CampaignTarget {
  profileId: string;
  name: string;
  role: 'primary' | 'secondary' | 'observer';
  influence: number;
  vulnerability: number;
}

export interface CampaignPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  startDate: Date | null;
  endDate: Date | null;
  actions: CampaignAction[];
}

export interface CampaignAction {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo: string | null;
  dueDate: Date | null;
  completedDate: Date | null;
  outcome: string | null;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  priority: CampaignPriority;
  
  objectives: CampaignObjective[];
  targets: CampaignTarget[];
  phases: CampaignPhase[];
  
  budget: number;
  spentBudget: number;
  
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  successRate: number;
  reach: number;
  engagement: number;
  influence: number;
  roi: number;
}

// Helper functions
export function calculateCampaignProgress(campaign: Campaign): number {
  const totalObjectives = campaign.objectives.length;
  if (totalObjectives === 0) return 0;
  
  const achievedObjectives = campaign.objectives.filter(o => o.status === 'achieved').length;
  return (achievedObjectives / totalObjectives) * 100;
}

export function getCampaignHealth(campaign: Campaign): 'healthy' | 'at_risk' | 'critical' {
  const progress = calculateCampaignProgress(campaign);
  const budgetUsage = campaign.spentBudget / Math.max(campaign.budget, 1);
  
  if (progress < 25 && budgetUsage > 0.5) return 'critical';
  if (progress < 50 && budgetUsage > 0.75) return 'at_risk';
  return 'healthy';
}
