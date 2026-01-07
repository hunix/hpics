// Intelligence Methodology & Influence System Types

export interface IntelligenceMethodology {
  id: string;
  name: string;
  category: MethodologyCategory;
  subcategory?: string;
  description: string;
  psychological_basis?: string;
  technique_steps: string[];
  best_for: string[];
  contraindications: string[];
  success_indicators: string[];
  difficulty_level: DifficultyLevel;
  ethical_considerations?: string;
  ai_prompt_template?: string;
  example_scripts: ExampleScript[];
  effectiveness_stats: EffectivenessStats;
  created_at: string;
  updated_at: string;
}

export type MethodologyCategory = 
  | 'persuasion' 
  | 'rapport' 
  | 'influence' 
  | 'elicitation' 
  | 'profiling' 
  | 'conflict' 
  | 'trust'
  | 'information';

export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface ExampleScript {
  context: string;
  script: string;
  expected_response?: string;
}

export interface EffectivenessStats {
  success_rate?: number;
  avg_attempts?: number;
  best_contexts?: string[];
}

// Contact Influence Profile
export interface ContactInfluenceProfile {
  id: string;
  user_id: string;
  profile_id: string;
  
  // Cialdini's Principles Susceptibility (0-100)
  reciprocity_susceptibility: number;
  commitment_consistency_susceptibility: number;
  social_proof_susceptibility: number;
  authority_susceptibility: number;
  liking_susceptibility: number;
  scarcity_susceptibility: number;
  unity_susceptibility: number;
  
  // Decision-Making Style
  decision_style?: DecisionStyle;
  information_preference?: InformationPreference;
  risk_appetite?: RiskAppetite;
  time_pressure_response?: TimePressureResponse;
  
  // Communication Triggers
  positive_triggers: string[];
  negative_triggers: string[];
  power_words: string[];
  avoid_words: string[];
  
  // Emotional Patterns
  emotional_buying_triggers: Record<string, any>;
  fear_motivators: string[];
  desire_motivators: string[];
  ego_sensitivities: string[];
  validation_needs: Record<string, any>;
  
  // Cognitive Style
  thinking_style?: ThinkingStyle;
  attention_span?: AttentionSpan;
  memory_anchors: MemoryAnchor[];
  
  // Best Approaches
  recommended_methodologies: string[];
  approach_sequence: ApproachStep[];
  timing_preferences: TimingPreferences;
  channel_preferences: ChannelPreferences;
  
  // Meta
  overall_influence_score: number;
  confidence_score: number;
  evidence_sources: EvidenceSource[];
  ai_model_used?: string;
  last_analyzed_at?: string;
  created_at: string;
  updated_at: string;
}

export type DecisionStyle = 'analytical' | 'intuitive' | 'spontaneous' | 'dependent' | 'avoidant';
export type InformationPreference = 'detailed' | 'summary' | 'visual' | 'examples' | 'data';
export type RiskAppetite = 'conservative' | 'moderate' | 'aggressive';
export type TimePressureResponse = 'panics' | 'focuses' | 'stalls' | 'avoids';
export type ThinkingStyle = 'logical' | 'emotional' | 'pragmatic' | 'creative';
export type AttentionSpan = 'short' | 'medium' | 'long';

export interface MemoryAnchor {
  topic: string;
  significance: string;
  emotion?: string;
}

export interface ApproachStep {
  order: number;
  action: string;
  rationale: string;
  timing?: string;
}

export interface TimingPreferences {
  best_days?: string[];
  best_times?: string[];
  avoid_times?: string[];
  response_pattern?: string;
}

export interface ChannelPreferences {
  preferred: string[];
  avoid: string[];
  formality_level?: string;
}

export interface EvidenceSource {
  type: string;
  description: string;
  confidence: number;
  date?: string;
}

// Influence Strategy
export interface InfluenceStrategy {
  id: string;
  user_id: string;
  profile_id: string;
  
  goal_type: GoalType;
  goal_description?: string;
  context?: string;
  
  strategy_name: string;
  strategy_summary?: string;
  preparation_steps: StrategyStep[];
  execution_steps: StrategyStep[];
  follow_up_steps: StrategyStep[];
  
  opening_scripts: string[];
  transition_phrases: string[];
  closing_scripts: string[];
  objection_handlers: ObjectionHandler[];
  recovery_phrases: string[];
  
  things_to_mention: string[];
  things_to_avoid: string[];
  emotional_hooks: string[];
  
  optimal_timing: OptimalTiming;
  duration_estimate?: string;
  urgency_level: UrgencyLevel;
  
  success_probability?: number;
  risks: Risk[];
  fallback_strategy?: string;
  abort_signals: string[];
  
  methodologies_applied: string[];
  
  status: StrategyStatus;
  executed_at?: string;
  outcome?: string;
  outcome_rating?: number;
  lessons_learned: Lesson[];
  
  ai_model_used?: string;
  created_at: string;
  updated_at: string;
}

export type GoalType = 
  | 'deepen_relationship' 
  | 'ask_favor' 
  | 'resolve_conflict' 
  | 'close_deal' 
  | 'gain_trust' 
  | 'gather_info' 
  | 'change_opinion'
  | 'reconnect'
  | 'apologize'
  | 'negotiate'
  | 'impress'
  | 'comfort';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'urgent';
export type StrategyStatus = 'draft' | 'active' | 'executed' | 'successful' | 'failed' | 'archived';

export interface StrategyStep {
  order: number;
  action: string;
  details?: string;
  timing?: string;
  success_indicator?: string;
}

export interface ObjectionHandler {
  objection: string;
  response: string;
  followup?: string;
}

export interface OptimalTiming {
  best_day?: string;
  best_time?: string;
  context?: string;
  avoid?: string[];
}

export interface Risk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface Lesson {
  observation: string;
  insight: string;
  apply_next_time?: string;
}

// Influence Action
export interface InfluenceAction {
  id: string;
  user_id: string;
  profile_id: string;
  strategy_id?: string;
  
  action_type: ActionType;
  action_title: string;
  action_description?: string;
  
  suggested_message?: string;
  suggested_channel?: string;
  talking_points: string[];
  things_to_mention: string[];
  things_to_avoid: string[];
  
  trigger_event?: string;
  trigger_context: Record<string, any>;
  
  scheduled_for?: string;
  optimal_window_start?: string;
  optimal_window_end?: string;
  priority: Priority;
  reminder_before_minutes: number;
  
  status: ActionStatus;
  completed_at?: string;
  actual_channel?: string;
  outcome?: string;
  response_received?: string;
  effectiveness_rating?: number;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export type ActionType = 
  | 'message' 
  | 'call' 
  | 'email' 
  | 'gift' 
  | 'introduction' 
  | 'check_in' 
  | 'appreciation' 
  | 'congratulation' 
  | 'reminder' 
  | 'follow_up';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionStatus = 'pending' | 'reminded' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled' | 'failed';

// Methodology Outcome
export interface MethodologyOutcome {
  id: string;
  user_id: string;
  profile_id: string;
  methodology_id?: string;
  strategy_id?: string;
  action_id?: string;
  
  methodology_name: string;
  context?: string;
  approach_used?: string;
  
  outcome: OutcomeLevel;
  outcome_score?: number;
  response_observed?: string;
  lessons?: string;
  
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  relationship_delta?: number;
  
  tags: string[];
  
  applied_at: string;
  created_at: string;
}

export type OutcomeLevel = 'very_effective' | 'effective' | 'neutral' | 'ineffective' | 'backfired';

// UI Helper Types
export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  deepen_relationship: 'Deepen Relationship',
  ask_favor: 'Ask a Favor',
  resolve_conflict: 'Resolve Conflict',
  close_deal: 'Close a Deal',
  gain_trust: 'Build Trust',
  gather_info: 'Gather Information',
  change_opinion: 'Change Their Opinion',
  reconnect: 'Reconnect After Time',
  apologize: 'Apologize Effectively',
  negotiate: 'Negotiate Terms',
  impress: 'Make an Impression',
  comfort: 'Provide Comfort/Support'
};

export const METHODOLOGY_CATEGORY_LABELS: Record<MethodologyCategory, string> = {
  persuasion: 'Persuasion',
  rapport: 'Rapport Building',
  influence: 'Influence',
  elicitation: 'Information Gathering',
  profiling: 'Profiling',
  conflict: 'Conflict Resolution',
  trust: 'Trust Building',
  information: 'Information Flow'
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  basic: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-orange-500/20 text-orange-400',
  expert: 'bg-red-500/20 text-red-400'
};

export const CIALDINI_PRINCIPLES = [
  { key: 'reciprocity', label: 'Reciprocity', description: 'Give before asking' },
  { key: 'commitment_consistency', label: 'Commitment', description: 'Small yeses lead to big yes' },
  { key: 'social_proof', label: 'Social Proof', description: 'Follow the crowd' },
  { key: 'authority', label: 'Authority', description: 'Defer to experts' },
  { key: 'liking', label: 'Liking', description: 'Say yes to those we like' },
  { key: 'scarcity', label: 'Scarcity', description: 'Want what\'s rare' },
  { key: 'unity', label: 'Unity', description: 'Shared identity creates cooperation' }
] as const;

export function getSusceptibilityLevel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Very High', color: 'text-red-400' };
  if (score >= 60) return { label: 'High', color: 'text-orange-400' };
  if (score >= 40) return { label: 'Moderate', color: 'text-yellow-400' };
  if (score >= 20) return { label: 'Low', color: 'text-blue-400' };
  return { label: 'Very Low', color: 'text-gray-400' };
}

export function getSuccessProbabilityColor(probability: number): string {
  if (probability >= 75) return 'text-green-400';
  if (probability >= 50) return 'text-yellow-400';
  if (probability >= 25) return 'text-orange-400';
  return 'text-red-400';
}
