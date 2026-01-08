// Agency-Grade Intelligence Types
// Comprehensive type definitions for all AI intelligence operations

// Relationship Analysis Types
export interface RelationshipAnalysis {
  relationship_type: 'professional' | 'personal' | 'family' | 'romantic' | 'acquaintance';
  strength_score: number;
  trust_level: 'low' | 'medium' | 'high' | 'very_high';
  communication_quality: 'poor' | 'fair' | 'good' | 'excellent';
  risk_factors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  opportunities: Array<{
    opportunity: string;
    priority: 'low' | 'medium' | 'high';
    action: string;
  }>;
  recommendations: string[];
}

// Behavioral Analysis Types
export interface BehavioralAnalysis {
  personality_traits: Array<{
    trait: string;
    strength: number;
    evidence: string;
  }>;
  communication_style: {
    primary_style: 'analytical' | 'driver' | 'expressive' | 'amiable';
    formality_level: 'very_formal' | 'formal' | 'neutral' | 'informal' | 'very_informal';
    preferred_channels?: string[];
  };
  emotional_indicators: {
    baseline_sentiment: number;
    emotional_stability: 'low' | 'medium' | 'high';
    stress_indicators?: string[];
  };
  influence_susceptibility?: {
    overall_score: number;
    effective_approaches: string[];
    ineffective_approaches?: string[];
  };
  confidence_score: number;
}

// Churn Prediction Types
export interface ChurnPrediction {
  churn_probability: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  predicted_days_to_churn?: number | null;
  contributing_factors: Array<{
    factor: string;
    impact: number;
    trend: 'improving' | 'stable' | 'declining';
  }>;
  recommended_interventions: Array<{
    action: string;
    urgency: 'immediate' | 'this_week' | 'this_month';
    expected_impact: 'low' | 'medium' | 'high';
  }>;
  confidence_score: number;
}

// Network Analysis Types
export interface NetworkAnalysis {
  network_health_score: number;
  key_metrics: {
    total_connections: number;
    active_connections: number;
    dormant_connections: number;
    at_risk_connections?: number;
    average_connection_strength?: number;
  };
  structural_insights: {
    clusters_identified: number;
    bridge_connectors?: string[];
    isolated_nodes?: string[];
    network_density: number;
  };
  growth_opportunities: Array<{
    opportunity: string;
    potential_value: 'low' | 'medium' | 'high';
    suggested_action: string;
  }>;
  risk_areas?: Array<{
    risk: string;
    severity: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
}

// Proactive Insight Types
export interface ProactiveInsight {
  type: 'opportunity' | 'risk' | 'action' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  affected_contacts: Array<{ id: string; name: string }>;
  suggested_action: string;
  deadline?: string;
  context: string;
}

// Communication Anomaly Types
export interface CommunicationAnomaly {
  type: 'frequency_drop' | 'sentiment_shift' | 'channel_change' | 'communication_gap' | 'timing_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affected_contacts: string[];
  detected_pattern: string;
  recommended_action: string;
}

// Cross-Contact Pattern Types
export interface CrossContactPattern {
  id: string;
  pattern_type: 'shared_employer' | 'shared_event' | 'shared_location' | 'communication_cluster' | 'social_overlap';
  confidence_score: number;
  profile_ids: string[];
  description: string;
  evidence: Record<string, unknown>;
  detected_at: string;
}

// Intelligence Report Types
export interface IntelligenceReport {
  summary: string;
  key_insights: Array<{
    category: string;
    insight: string;
    confidence: number;
    source: string;
  }>;
  contradictions: Array<{
    topic: string;
    sources: string[];
    description: string;
    resolution_suggestion: string;
  }>;
  blind_spots: Array<{
    area: string;
    importance: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    expected_outcome: string;
    effort_level: 'low' | 'medium' | 'high';
  }>;
  relationship_health: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    key_factors: string[];
  };
  risk_score: number;
  opportunity_score: number;
  confidence_score: number;
}

// Lifecycle Stage Types
export interface LifecycleStage {
  stage: 'new' | 'growing' | 'stable' | 'declining' | 'dormant' | 'churned';
  stage_duration_days: number;
  predicted_next_stage: string;
  days_until_transition: number | null;
  stage_specific_recommendations: string[];
}

// Influence Strategy Types
export interface InfluenceStrategy {
  goal: string;
  overall_approach: string;
  psychological_principles: string[];
  tactics: Array<{
    name: string;
    description: string;
    timing: string;
    expected_effectiveness: number;
  }>;
  communication_templates: Array<{
    scenario: string;
    template: string;
    tone: string;
  }>;
  risks_and_mitigations: Array<{
    risk: string;
    mitigation: string;
  }>;
  success_metrics: string[];
  confidence_score: number;
}

// AI Usage Summary Types
export interface AIUsageSummary {
  total_requests: number;
  total_tokens: number;
  total_cost_cents: number;
  by_function: Record<string, {
    requests: number;
    tokens: number;
    cost_cents: number;
    success_rate: number;
  }>;
  by_model: Record<string, {
    requests: number;
    tokens: number;
    cost_cents: number;
  }>;
  trend: 'increasing' | 'stable' | 'decreasing';
}
