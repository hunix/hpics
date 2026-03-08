/**
 * Schema Validation Utility
 * Development-time utility to validate repository column references against actual schema
 */

import { supabase } from '@/integrations/supabase/client';

export interface SchemaValidationResult {
  table: string;
  column: string;
  exists: boolean;
  suggestion?: string;
}

export interface SchemaReport {
  valid: SchemaValidationResult[];
  invalid: SchemaValidationResult[];
  timestamp: Date;
}

// Known table schemas based on database types
const KNOWN_SCHEMAS: Record<string, string[]> = {
  profiles: [
    'id', 'user_id', 'first_name', 'last_name', 'organization', 'job_title',
    'relationship_type', 'relationship_subtype', 'hierarchy_level', 'notes',
    'avatar_url', 'is_favorite', 'is_active', 'tags', 'country', 'city',
    'address', 'created_at', 'updated_at', 'last_contact_date',
    'engagement_score', 'data_richness_score', 'bio', 'linkedin_url',
  ],
  ai_analyses: [
    'id', 'user_id', 'profile_id', 'analysis_type', 'result', 'generated_at',
  ],
  psychological_profiles: [
    'id', 'user_id', 'profile_id', 'attachment_style', 'dark_triad_indicators',
    'emotional_intelligence', 'vulnerability_map', 'leverage_points', 'action_plans',
    'deception_analysis', 'influence_vectors', 'created_at', 'updated_at',
  ],
  mice_assessments: [
    'id', 'user_id', 'profile_id', 'money_score', 'ideology_score', 'compromise_score',
    'ego_score', 'primary_vulnerability', 'recruitment_pathways', 'exploitation_scripts',
    'created_at', 'updated_at',
  ],
  contact_influence_profiles: [
    'id', 'user_id', 'profile_id', 'reciprocity_susceptibility', 'authority_susceptibility',
    'scarcity_susceptibility', 'commitment_susceptibility', 'liking_susceptibility',
    'social_proof_susceptibility', 'unity_susceptibility', 'created_at', 'updated_at',
  ],
  dossiers: [
    'id', 'user_id', 'profile_id', 'title', 'classification', 'dossier_type',
    'content', 'sections', 'summary', 'key_findings', 'risk_assessment',
    'generated_at', 'created_at',
  ],
  media: [
    'id', 'user_id', 'profile_id', 'file_url', 'mime_type', 'file_size',
    'storage_path', 'caption', 'thumbnail_url', 'media_type', 'title',
    'file_name', 'ai_metadata', 'ai_generation_status', 'created_at', 'updated_at',
  ],
  voice_recording_sessions: [
    'id', 'user_id', 'profile_id', 'session_type', 'duration_seconds',
    'transcript', 'analysis_result', 'created_at', 'updated_at',
  ],
  autonomous_campaigns: [
    'id', 'user_id', 'campaign_name', 'campaign_type', 'objective',
    'is_active', 'auto_execute', 'trigger_conditions', 'execution_rules',
    'success_criteria', 'success_rate', 'created_at', 'updated_at',
  ],
  cognitive_warfare_operations: [
    'id', 'user_id', 'profile_id', 'operation_type', 'attack_vector',
    'target_dimension', 'status', 'effectiveness_score', 'created_at', 'updated_at',
  ],
  // Additional commonly used tables
  messages: [
    'id', 'conversation_id', 'content', 'is_from_contact', 
    'sent_at', 'created_at',
  ],
  bulk_analysis_sessions: [
    'id', 'user_id', 'session_name', 'analysis_type', 'status', 
    'total_items', 'completed_items', 'failed_items', 'created_at', 'updated_at',
  ],
  bulk_analysis_items: [
    'id', 'session_id', 'profile_id', 'status', 'result', 'error_message',
    'processing_started_at', 'processing_completed_at', 'created_at', 'updated_at',
  ],
  contact_interaction_notes: [
    'id', 'user_id', 'profile_id', 'interaction_type', 'interaction_date',
    'duration_minutes', 'location', 'note_text', 'audio_url', 'audio_transcription',
    'mood_observed', 'topics_discussed', 'action_items', 'promises_made',
    'relationship_temperature', 'notable_changes', 'follow_up_needed',
    'follow_up_date', 'follow_up_reason', 'ai_extracted_insights', 'ai_processed_at',
    'created_at', 'updated_at',
  ],
  contact_life_milestones: [
    'id', 'user_id', 'profile_id', 'milestone_type', 'event_date',
    'description', 'impact_score', 'created_at',
  ],
  contact_observations: [
    'id', 'user_id', 'profile_id', 'category', 'title', 'observation',
    'confidence_level', 'ai_validation_status', 'ai_validation_result',
    'ai_confidence_score', 'related_analysis_ids', 'tags', 'created_at', 'updated_at',
  ],
  behavioral_analyses: [
    'id', 'user_id', 'profile_id', 'analysis_type', 'result',
    'confidence_score', 'created_at',
  ],
  power_network_analyses: [
    'id', 'user_id', 'analysis_type', 'scope_description', 'total_nodes',
    'total_edges', 'network_density', 'power_scores', 'gatekeepers',
    'brokers', 'influencers', 'communities', 'computed_at', 'created_at',
  ],
  contact_relationships: [
    'id', 'user_id', 'from_profile_id', 'to_profile_id', 'relationship_type',
    'strength', 'bidirectional', 'created_at', 'updated_at',
  ],
  active_defense_operations: [
    'id', 'user_id', 'profile_id', 'defense_type', 'defense_posture',
    'threat_profile', 'threat_indicators', 'escalation_level', 'automated_responses',
    'active_measures', 'alert_thresholds', 'counter_narratives', 'deception_layers',
    'effectiveness_metrics', 'honeypot_deployments', 'incident_log', 'response_playbook',
    'threat_actor_id', 'created_at', 'updated_at',
  ],
  agis_global_state: [
    'id', 'user_id', 'phase_health_scores', 'cross_phase_correlations',
    'active_objectives', 'system_readiness_score', 'total_operations_count',
    'success_rate', 'last_synthesis_at', 'created_at', 'updated_at',
  ],
  agis_analytics: [
    'id', 'user_id', 'phase', 'metric_type', 'metric_value',
    'metric_metadata', 'recorded_at',
  ],
  agis_cascade_events: [
    'id', 'user_id', 'trigger_phase', 'trigger_event_type', 'trigger_source_id',
    'affected_phases', 'cascade_path', 'execution_log', 'outcome_status',
    'started_at', 'completed_at', 'created_at',
  ],
  agis_cascade_rules: [
    'id', 'user_id', 'rule_name', 'source_phase', 'source_table',
    'target_phase', 'target_action', 'trigger_condition', 'action_params',
    'is_active', 'priority', 'cooldown_minutes', 'last_triggered_at',
    'trigger_count', 'created_at', 'updated_at',
  ],
  agis_phase_synergies: [
    'id', 'user_id', 'phase_a', 'phase_b', 'synergy_type', 'synergy_score',
    'interaction_count', 'successful_cascades', 'last_interaction_at',
    'created_at', 'updated_at',
  ],
};

/**
 * Validate a specific column reference against known schema
 */
export function validateColumnReference(table: string, column: string): SchemaValidationResult {
  const tableSchema = KNOWN_SCHEMAS[table];
  
  if (!tableSchema) {
    return {
      table,
      column,
      exists: false,
      suggestion: `Table '${table}' not found in known schemas`,
    };
  }
  
  const exists = tableSchema.includes(column);
  
  if (!exists) {
    // Try to find a similar column name
    const similar = tableSchema.find(c => 
      c.toLowerCase().includes(column.toLowerCase()) || 
      column.toLowerCase().includes(c.toLowerCase())
    );
    
    return {
      table,
      column,
      exists: false,
      suggestion: similar ? `Did you mean '${similar}'?` : `Column not found in '${table}'`,
    };
  }
  
  return { table, column, exists: true };
}

/**
 * Validate multiple column references at once
 */
export function validateReferences(references: Array<{ table: string; column: string }>): SchemaReport {
  const results = references.map(ref => validateColumnReference(ref.table, ref.column));
  
  return {
    valid: results.filter(r => r.exists),
    invalid: results.filter(r => !r.exists),
    timestamp: new Date(),
  };
}

/**
 * Get a full schema report for debugging
 */
export function getSchemaReport(): Record<string, string[]> {
  return { ...KNOWN_SCHEMAS };
}

/**
 * Log schema validation issues to console (development only)
 */
export function logSchemaIssues(repositoryName: string, references: Array<{ table: string; column: string }>) {
  if (import.meta.env.PROD) return;
  
  const report = validateReferences(references);
  
  if (report.invalid.length > 0) {
    console.warn(`[SchemaValidator] ${repositoryName} has ${report.invalid.length} invalid column references:`);
    report.invalid.forEach(r => {
      console.warn(`  - ${r.table}.${r.column}: ${r.suggestion}`);
    });
  }
}
