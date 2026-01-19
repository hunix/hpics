/**
 * Strategy Entity
 * Represents strategic approaches and tactical playbooks
 */

export type StrategyType = 'offensive' | 'defensive' | 'hybrid' | 'monitoring';
export type StrategyStatus = 'draft' | 'approved' | 'active' | 'suspended' | 'retired';

export interface Tactic {
  id: string;
  name: string;
  description: string;
  category: string;
  effectiveness: number;
  risk: number;
  resources: string[];
  prerequisites: string[];
  contraindications: string[];
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  tactics: Tactic[];
  triggerConditions: string[];
  successCriteria: string[];
  fallbackPlan: string | null;
}

export interface StrategicGoal {
  id: string;
  name: string;
  description: string;
  priority: number;
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  metrics: { name: string; target: number; current: number }[];
  status: 'not_started' | 'in_progress' | 'achieved' | 'blocked';
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  type: StrategyType;
  status: StrategyStatus;
  
  goals: StrategicGoal[];
  playbooks: Playbook[];
  
  scope: string[];
  constraints: string[];
  assumptions: string[];
  risks: string[];
  
  approvedBy: string | null;
  approvedAt: Date | null;
  
  effectiveFrom: Date | null;
  effectiveUntil: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions
export function getStrategyEffectiveness(strategy: Strategy): number {
  const goals = strategy.goals;
  if (goals.length === 0) return 0;
  
  const achievedGoals = goals.filter(g => g.status === 'achieved').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
  
  return ((achievedGoals * 100) + (inProgressGoals * 50)) / goals.length;
}

export function getActivePlaybooks(strategy: Strategy): Playbook[] {
  return strategy.playbooks.filter(p => p.tactics.length > 0);
}
