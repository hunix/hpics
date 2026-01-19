/**
 * Warfare Domain Public API
 */

// Entities
export type {
  Campaign,
  CampaignStatus,
  CampaignType,
  CampaignPriority,
  CampaignObjective,
  CampaignTarget,
  CampaignPhase,
  CampaignAction,
  CampaignMetrics,
} from './entities/Campaign';

export {
  calculateCampaignProgress,
  getCampaignHealth,
} from './entities/Campaign';

export type {
  Threat,
  ThreatLevel,
  ThreatType,
  ThreatStatus,
  ThreatIndicator,
  ThreatActor,
  CounterMeasure,
} from './entities/Threat';

export {
  calculateRiskScore,
  getThreatPriorityOrder,
  shouldEscalate,
} from './entities/Threat';

export type {
  Strategy,
  StrategyType,
  StrategyStatus,
  Tactic,
  Playbook,
  StrategicGoal,
} from './entities/Strategy';

export {
  getStrategyEffectiveness,
  getActivePlaybooks,
} from './entities/Strategy';

// Events
export type { WarfareDomainEvent } from './events/WarfareEvents';
export {
  CampaignCreated,
  CampaignActivated,
  CampaignCompleted,
  ObjectiveAchieved,
  ThreatDetected,
  ThreatEscalated,
  ThreatMitigated,
  StrategyApproved,
  PlaybookExecuted,
} from './events/WarfareEvents';

// Services
export { WarfareService } from './services/WarfareService';
export type { CampaignCreateRequest, ThreatAssessmentRequest, WarfareSummary } from './services/WarfareService';

// Hooks
export {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useActivateCampaign,
  useThreats,
  useThreatAssessment,
  useReportThreat,
  useStrategies,
  useWarfareSummary,
  useWarfare,
} from './hooks/useWarfareService';
