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
    'content', 'sections_included', 'generated_at', 'updated_at',
  ],
  media: [
    'id', 'user_id', 'profile_id', 'file_path', 'file_type', 'file_size',
    'original_filename', 'ai_metadata', 'created_at', 'updated_at',
  ],
  voice_recording_sessions: [
    'id', 'user_id', 'profile_id', 'session_type', 'duration_seconds',
    'transcript', 'analysis_result', 'created_at', 'updated_at',
  ],
  autonomous_campaigns: [
    'id', 'user_id', 'name', 'description', 'campaign_type', 'status',
    'target_profile_ids', 'is_active', 'created_at', 'updated_at',
  ],
  cognitive_warfare_operations: [
    'id', 'user_id', 'profile_id', 'operation_type', 'attack_vector',
    'target_dimension', 'status', 'effectiveness_score', 'created_at', 'updated_at',
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
