/**
 * Security Defense Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json, Database } from '../base';

/**
 * Tables in this domain: active_defense_operations, counter_intel_events, counter_operations, counter_surveillance_events, credential_exposures, dark_web_mentions, data_access_events, data_access_patterns, data_classification_tags, data_residency_controls, defensive_postures, encrypted_fields, encryption_key_rotations, encryption_keys, immutable_audit_logs, secure_deletion_records, security_alerts, security_audit_logs, security_events, security_findings, surveillance_alerts, tamper_detection_alerts, threat_actors, threat_assessments, threat_intelligence, tscm_sweeps, vulnerability_windows
 */
export interface SecurityDefenseTables {
      active_defense_operations: {
        Row: {
          active_measures: Json | null
          alert_thresholds: Json | null
          automated_responses: boolean | null
          counter_narratives: Json | null
          created_at: string
          deception_layers: Json | null
          defense_posture: string | null
          defense_type: string
          effectiveness_metrics: Json | null
          escalation_level: number | null
          honeypot_deployments: Json | null
          id: string
          incident_log: Json | null
          profile_id: string | null
          response_playbook: Json | null
          threat_actor_id: string | null
          threat_indicators: Json | null
          threat_profile: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_measures?: Json | null
          alert_thresholds?: Json | null
          automated_responses?: boolean | null
          counter_narratives?: Json | null
          created_at?: string
          deception_layers?: Json | null
          defense_posture?: string | null
          defense_type: string
          effectiveness_metrics?: Json | null
          escalation_level?: number | null
          honeypot_deployments?: Json | null
          id?: string
          incident_log?: Json | null
          profile_id?: string | null
          response_playbook?: Json | null
          threat_actor_id?: string | null
          threat_indicators?: Json | null
          threat_profile?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_measures?: Json | null
          alert_thresholds?: Json | null
          automated_responses?: boolean | null
          counter_narratives?: Json | null
          created_at?: string
          deception_layers?: Json | null
          defense_posture?: string | null
          defense_type?: string
          effectiveness_metrics?: Json | null
          escalation_level?: number | null
          honeypot_deployments?: Json | null
          id?: string
          incident_log?: Json | null
          profile_id?: string | null
          response_playbook?: Json | null
          threat_actor_id?: string | null
          threat_indicators?: Json | null
          threat_profile?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_defense_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "active_defense_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "active_defense_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_intel_events: {
        Row: {
          created_at: string
          detected_at: string
          detection_type: string
          id: string
          indicators: Json
          is_resolved: boolean | null
          profile_id: string | null
          recommended_response: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          threat_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_at?: string
          detection_type: string
          id?: string
          indicators?: Json
          is_resolved?: boolean | null
          profile_id?: string | null
          recommended_response?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          threat_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          detected_at?: string
          detection_type?: string
          id?: string
          indicators?: Json
          is_resolved?: boolean | null
          profile_id?: string | null
          recommended_response?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          threat_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_intel_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "counter_intel_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "counter_intel_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_phase: string | null
          id: string
          is_active: boolean | null
          objective: string
          operation_name: string
          operation_type: string
          outcome: string | null
          outcome_details: Json | null
          phase_progress: number | null
          resources_allocated: Json | null
          started_at: string | null
          success_metrics: Json | null
          tactics: Json | null
          target_threat_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          objective: string
          operation_name: string
          operation_type: string
          outcome?: string | null
          outcome_details?: Json | null
          phase_progress?: number | null
          resources_allocated?: Json | null
          started_at?: string | null
          success_metrics?: Json | null
          tactics?: Json | null
          target_threat_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          objective?: string
          operation_name?: string
          operation_type?: string
          outcome?: string | null
          outcome_details?: Json | null
          phase_progress?: number | null
          resources_allocated?: Json | null
          started_at?: string | null
          success_metrics?: Json | null
          tactics?: Json | null
          target_threat_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counter_operations_target_threat_id_fkey"
            columns: ["target_threat_id"]
            isOneToOne: false
            referencedRelation: "threat_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      counter_surveillance_events: {
        Row: {
          created_at: string | null
          description: string
          detected_at: string | null
          event_type: string
          evidence: Json | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          detected_at?: string | null
          event_type: string
          evidence?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          detected_at?: string | null
          event_type?: string
          evidence?: Json | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credential_exposures: {
        Row: {
          affected_service: string | null
          breach_date: string | null
          breach_source: string | null
          created_at: string
          credential_types: Json | null
          data_exposed: Json | null
          discovered_at: string | null
          exposure_severity: string | null
          exposure_type: string
          id: string
          profile_id: string | null
          remediation_actions: Json | null
          remediation_status: string | null
          user_id: string
        }
        Insert: {
          affected_service?: string | null
          breach_date?: string | null
          breach_source?: string | null
          created_at?: string
          credential_types?: Json | null
          data_exposed?: Json | null
          discovered_at?: string | null
          exposure_severity?: string | null
          exposure_type: string
          id?: string
          profile_id?: string | null
          remediation_actions?: Json | null
          remediation_status?: string | null
          user_id: string
        }
        Update: {
          affected_service?: string | null
          breach_date?: string | null
          breach_source?: string | null
          created_at?: string
          credential_types?: Json | null
          data_exposed?: Json | null
          discovered_at?: string | null
          exposure_severity?: string | null
          exposure_type?: string
          id?: string
          profile_id?: string | null
          remediation_actions?: Json | null
          remediation_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_exposures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "credential_exposures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "credential_exposures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dark_web_mentions: {
        Row: {
          content_snippet: string | null
          context_analysis: Json | null
          created_at: string
          entities_mentioned: Json | null
          first_seen_at: string | null
          full_content: string | null
          id: string
          last_seen_at: string | null
          mention_source: string
          profile_id: string | null
          relevance_score: number | null
          source_credibility: number | null
          source_type: string | null
          threat_score: number | null
          user_id: string
        }
        Insert: {
          content_snippet?: string | null
          context_analysis?: Json | null
          created_at?: string
          entities_mentioned?: Json | null
          first_seen_at?: string | null
          full_content?: string | null
          id?: string
          last_seen_at?: string | null
          mention_source: string
          profile_id?: string | null
          relevance_score?: number | null
          source_credibility?: number | null
          source_type?: string | null
          threat_score?: number | null
          user_id: string
        }
        Update: {
          content_snippet?: string | null
          context_analysis?: Json | null
          created_at?: string
          entities_mentioned?: Json | null
          first_seen_at?: string | null
          full_content?: string | null
          id?: string
          last_seen_at?: string | null
          mention_source?: string
          profile_id?: string | null
          relevance_score?: number | null
          source_credibility?: number | null
          source_type?: string | null
          threat_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dark_web_mentions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dark_web_mentions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dark_web_mentions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_access_events: {
        Row: {
          access_type: string
          accessed_at: string | null
          anomaly_score: number | null
          id: string
          ip_address: unknown
          is_flagged: boolean | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          anomaly_score?: number | null
          id?: string
          ip_address?: unknown
          is_flagged?: boolean | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          anomaly_score?: number | null
          id?: string
          ip_address?: unknown
          is_flagged?: boolean | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_access_patterns: {
        Row: {
          access_count: number | null
          created_at: string
          hourly_pattern: Json | null
          id: string
          last_accessed_at: string | null
          table_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          hourly_pattern?: Json | null
          id?: string
          last_accessed_at?: string | null
          table_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          hourly_pattern?: Json | null
          id?: string
          last_accessed_at?: string | null
          table_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_classification_tags: {
        Row: {
          classification: string
          column_name: string | null
          created_at: string | null
          id: string
          pii_type: string | null
          requires_audit: boolean | null
          requires_encryption: boolean | null
          retention_days: number | null
          table_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          classification?: string
          column_name?: string | null
          created_at?: string | null
          id?: string
          pii_type?: string | null
          requires_audit?: boolean | null
          requires_encryption?: boolean | null
          retention_days?: number | null
          table_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          classification?: string
          column_name?: string | null
          created_at?: string | null
          id?: string
          pii_type?: string | null
          requires_audit?: boolean | null
          requires_encryption?: boolean | null
          retention_days?: number | null
          table_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_residency_controls: {
        Row: {
          allowed_processing_regions: string[] | null
          consent_expires_at: string | null
          consent_obtained_at: string | null
          created_at: string | null
          data_region: string
          deletion_requested_at: string | null
          deletion_scheduled_for: string | null
          id: string
          profile_id: string | null
          requires_consent: boolean | null
          restricted_from_regions: string[] | null
          retention_policy: string | null
          sovereignty_requirements: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_processing_regions?: string[] | null
          consent_expires_at?: string | null
          consent_obtained_at?: string | null
          created_at?: string | null
          data_region?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          id?: string
          profile_id?: string | null
          requires_consent?: boolean | null
          restricted_from_regions?: string[] | null
          retention_policy?: string | null
          sovereignty_requirements?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_processing_regions?: string[] | null
          consent_expires_at?: string | null
          consent_obtained_at?: string | null
          created_at?: string | null
          data_region?: string
          deletion_requested_at?: string | null
          deletion_scheduled_for?: string | null
          id?: string
          profile_id?: string | null
          requires_consent?: boolean | null
          restricted_from_regions?: string[] | null
          retention_policy?: string | null
          sovereignty_requirements?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_residency_controls_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "data_residency_controls_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "data_residency_controls_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      defensive_postures: {
        Row: {
          active_defenses: Json | null
          alert_thresholds: Json | null
          created_at: string | null
          current_threat_level: string | null
          id: string
          is_active: boolean | null
          last_threat_assessment_at: string | null
          monitoring_config: Json | null
          posture_effectiveness: number | null
          posture_type: string
          profile_id: string | null
          threat_model: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_defenses?: Json | null
          alert_thresholds?: Json | null
          created_at?: string | null
          current_threat_level?: string | null
          id?: string
          is_active?: boolean | null
          last_threat_assessment_at?: string | null
          monitoring_config?: Json | null
          posture_effectiveness?: number | null
          posture_type: string
          profile_id?: string | null
          threat_model?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_defenses?: Json | null
          alert_thresholds?: Json | null
          created_at?: string | null
          current_threat_level?: string | null
          id?: string
          is_active?: boolean | null
          last_threat_assessment_at?: string | null
          monitoring_config?: Json | null
          posture_effectiveness?: number | null
          posture_type?: string
          profile_id?: string | null
          threat_model?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "defensive_postures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "defensive_postures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "defensive_postures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_fields: {
        Row: {
          column_name: string
          created_at: string | null
          data_classification: Database["public"]["Enums"]["clearance_level"]
          encryption_enabled: boolean | null
          encryption_key_id: string | null
          id: string
          table_name: string
          user_id: string
        }
        Insert: {
          column_name: string
          created_at?: string | null
          data_classification: Database["public"]["Enums"]["clearance_level"]
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          id?: string
          table_name: string
          user_id: string
        }
        Update: {
          column_name?: string
          created_at?: string | null
          data_classification?: Database["public"]["Enums"]["clearance_level"]
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_fields_encryption_key_id_fkey"
            columns: ["encryption_key_id"]
            isOneToOne: false
            referencedRelation: "encryption_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_key_rotations: {
        Row: {
          affected_tables: string[] | null
          algorithm: string
          created_at: string | null
          expires_at: string | null
          id: string
          key_version: number
          metadata: Json | null
          rotated_at: string | null
          rotation_completed_at: string | null
          rotation_started_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          affected_tables?: string[] | null
          algorithm?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_version?: number
          metadata?: Json | null
          rotated_at?: string | null
          rotation_completed_at?: string | null
          rotation_started_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          affected_tables?: string[] | null
          algorithm?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key_version?: number
          metadata?: Json | null
          rotated_at?: string | null
          rotation_completed_at?: string | null
          rotation_started_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string | null
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_version: number | null
          rotated_at: string | null
          user_id: string
        }
        Insert: {
          algorithm?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_version?: number | null
          rotated_at?: string | null
          user_id: string
        }
        Update: {
          algorithm?: string | null
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_version?: number | null
          rotated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      immutable_audit_logs: {
        Row: {
          action_type: string
          clearance_used: Database["public"]["Enums"]["clearance_level"] | null
          created_at: string
          current_hash: string
          data_classification:
            | Database["public"]["Enums"]["clearance_level"]
            | null
          id: string
          ip_address: unknown
          previous_hash: string
          request_metadata: Json | null
          resource_id: string | null
          resource_type: string
          response_status: string | null
          sequence_number: number
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          clearance_used?: Database["public"]["Enums"]["clearance_level"] | null
          created_at?: string
          current_hash: string
          data_classification?:
            | Database["public"]["Enums"]["clearance_level"]
            | null
          id?: string
          ip_address?: unknown
          previous_hash: string
          request_metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          response_status?: string | null
          sequence_number?: number
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          clearance_used?: Database["public"]["Enums"]["clearance_level"] | null
          created_at?: string
          current_hash?: string
          data_classification?:
            | Database["public"]["Enums"]["clearance_level"]
            | null
          id?: string
          ip_address?: unknown
          previous_hash?: string
          request_metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          response_status?: string | null
          sequence_number?: number
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      secure_deletion_records: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deletion_method: string | null
          destruction_certificate: Json | null
          id: string
          record_id: string
          record_summary: string | null
          record_type: string
          shredding_passes: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deletion_method?: string | null
          destruction_certificate?: Json | null
          id?: string
          record_id: string
          record_summary?: string | null
          record_type: string
          shredding_passes?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deletion_method?: string | null
          destruction_certificate?: Json | null
          id?: string
          record_id?: string
          record_summary?: string | null
          record_type?: string
          shredding_passes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          category: string
          created_at: string
          description: string
          id: string
          is_acknowledged: boolean | null
          metadata: Json | null
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          category: string
          created_at?: string
          description: string
          id?: string
          is_acknowledged?: boolean | null
          metadata?: Json | null
          severity?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_acknowledged?: boolean | null
          metadata?: Json | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string
          data_classification: string
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          data_classification?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          data_classification?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          action_successful: boolean | null
          action_taken: string | null
          created_at: string | null
          event_type: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          risk_score: number | null
          severity: string
          source_ip: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_successful?: boolean | null
          action_taken?: string | null
          created_at?: string | null
          event_type: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          severity?: string
          source_ip?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_successful?: boolean | null
          action_taken?: string | null
          created_at?: string | null
          event_type?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          risk_score?: number | null
          severity?: string
          source_ip?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_findings: {
        Row: {
          affected_resource: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          finding_status: string | null
          finding_type: string
          id: string
          remediation: string | null
          resolution_notes: string | null
          resolved_at: string | null
          scan_id: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          affected_resource?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          finding_status?: string | null
          finding_type: string
          id?: string
          remediation?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          severity: string
          title: string
          user_id: string
        }
        Update: {
          affected_resource?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          finding_status?: string | null
          finding_type?: string
          id?: string
          remediation?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          scan_id?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      surveillance_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          auto_generated: boolean | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_acknowledged: boolean | null
          is_read: boolean | null
          is_resolved: boolean | null
          profile_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          source: string | null
          source_data: Json | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          auto_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          is_resolved?: boolean | null
          profile_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
          source_data?: Json | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          auto_generated?: boolean | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_read?: boolean | null
          is_resolved?: boolean | null
          profile_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          source?: string | null
          source_data?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveillance_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "surveillance_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "surveillance_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tamper_detection_alerts: {
        Row: {
          actual_value: string | null
          affected_record_id: string | null
          affected_table: string
          detected_at: string | null
          detection_type: string
          expected_value: string | null
          id: string
          investigated_at: string | null
          investigated_by: string | null
          is_resolved: boolean | null
          metadata: Json | null
          resolution: string | null
          severity: string
          user_id: string
        }
        Insert: {
          actual_value?: string | null
          affected_record_id?: string | null
          affected_table: string
          detected_at?: string | null
          detection_type: string
          expected_value?: string | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolution?: string | null
          severity?: string
          user_id: string
        }
        Update: {
          actual_value?: string | null
          affected_record_id?: string | null
          affected_table?: string
          detected_at?: string | null
          detection_type?: string
          expected_value?: string | null
          id?: string
          investigated_at?: string | null
          investigated_by?: string | null
          is_resolved?: boolean | null
          metadata?: Json | null
          resolution?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      threat_actors: {
        Row: {
          activity_pattern: Json | null
          actor_name: string
          actor_type: string
          attributed_actions: Json | null
          capabilities: Json | null
          created_at: string | null
          id: string
          indicators_of_compromise: Json | null
          known_tactics: string[] | null
          last_activity_at: string | null
          network_affiliations: string[] | null
          profile_id: string | null
          status: string | null
          threat_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_pattern?: Json | null
          actor_name: string
          actor_type: string
          attributed_actions?: Json | null
          capabilities?: Json | null
          created_at?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          known_tactics?: string[] | null
          last_activity_at?: string | null
          network_affiliations?: string[] | null
          profile_id?: string | null
          status?: string | null
          threat_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_pattern?: Json | null
          actor_name?: string
          actor_type?: string
          attributed_actions?: Json | null
          capabilities?: Json | null
          created_at?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          known_tactics?: string[] | null
          last_activity_at?: string | null
          network_affiliations?: string[] | null
          profile_id?: string | null
          status?: string | null
          threat_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_actors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_actors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_actors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_assessments: {
        Row: {
          assessment_type: string
          contradictions: Json | null
          created_at: string
          evidence: Json | null
          id: string
          identity_confidence: number | null
          indicators: Json | null
          is_resolved: boolean | null
          profile_id: string
          recommendations: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          threat_level: string
          threat_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_type: string
          contradictions?: Json | null
          created_at?: string
          evidence?: Json | null
          id?: string
          identity_confidence?: number | null
          indicators?: Json | null
          is_resolved?: boolean | null
          profile_id: string
          recommendations?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          threat_level: string
          threat_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_type?: string
          contradictions?: Json | null
          created_at?: string
          evidence?: Json | null
          id?: string
          identity_confidence?: number | null
          indicators?: Json | null
          is_resolved?: boolean | null
          profile_id?: string
          recommendations?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          threat_level?: string
          threat_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      threat_intelligence: {
        Row: {
          attack_patterns: Json | null
          confidence_score: number | null
          created_at: string
          first_detected_at: string | null
          id: string
          indicators_of_compromise: Json | null
          intel_sources: Json | null
          is_active: boolean | null
          last_updated_at: string | null
          mitigation_strategies: Json | null
          profile_id: string | null
          threat_level: string | null
          threat_name: string | null
          threat_type: string
          threat_vector: Json | null
          user_id: string
        }
        Insert: {
          attack_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          first_detected_at?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          intel_sources?: Json | null
          is_active?: boolean | null
          last_updated_at?: string | null
          mitigation_strategies?: Json | null
          profile_id?: string | null
          threat_level?: string | null
          threat_name?: string | null
          threat_type: string
          threat_vector?: Json | null
          user_id: string
        }
        Update: {
          attack_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          first_detected_at?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          intel_sources?: Json | null
          is_active?: boolean | null
          last_updated_at?: string | null
          mitigation_strategies?: Json | null
          profile_id?: string | null
          threat_level?: string | null
          threat_name?: string | null
          threat_type?: string
          threat_vector?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "threat_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "threat_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tscm_sweeps: {
        Row: {
          acoustic_findings: Json | null
          completed_at: string | null
          created_at: string | null
          devices_used: string[] | null
          id: string
          location: Json | null
          location_bounds: Json | null
          location_name: string | null
          mission_id: string | null
          overall_findings: Json | null
          recommendations: Json | null
          rf_findings: Json | null
          started_at: string | null
          sweep_duration_minutes: number | null
          sweep_name: string | null
          sweep_type: string
          thermal_findings: Json | null
          threat_level: string | null
          user_id: string
          visual_findings: Json | null
        }
        Insert: {
          acoustic_findings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          devices_used?: string[] | null
          id?: string
          location?: Json | null
          location_bounds?: Json | null
          location_name?: string | null
          mission_id?: string | null
          overall_findings?: Json | null
          recommendations?: Json | null
          rf_findings?: Json | null
          started_at?: string | null
          sweep_duration_minutes?: number | null
          sweep_name?: string | null
          sweep_type: string
          thermal_findings?: Json | null
          threat_level?: string | null
          user_id: string
          visual_findings?: Json | null
        }
        Update: {
          acoustic_findings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          devices_used?: string[] | null
          id?: string
          location?: Json | null
          location_bounds?: Json | null
          location_name?: string | null
          mission_id?: string | null
          overall_findings?: Json | null
          recommendations?: Json | null
          rf_findings?: Json | null
          started_at?: string | null
          sweep_duration_minutes?: number | null
          sweep_name?: string | null
          sweep_type?: string
          thermal_findings?: Json | null
          threat_level?: string | null
          user_id?: string
          visual_findings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tscm_sweeps_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      vulnerability_windows: {
        Row: {
          confidence_score: number | null
          created_at: string
          current_status: string | null
          exploitation_vectors: Json | null
          historical_patterns: Json | null
          id: string
          optimal_approach_timing: Json | null
          outcome_data: Json | null
          predicted_end: string | null
          predicted_start: string | null
          profile_id: string | null
          protective_factors_weakened: Json | null
          risk_factors: Json | null
          trigger_event: string | null
          updated_at: string
          user_id: string
          vulnerability_score: number | null
          window_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          current_status?: string | null
          exploitation_vectors?: Json | null
          historical_patterns?: Json | null
          id?: string
          optimal_approach_timing?: Json | null
          outcome_data?: Json | null
          predicted_end?: string | null
          predicted_start?: string | null
          profile_id?: string | null
          protective_factors_weakened?: Json | null
          risk_factors?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id: string
          vulnerability_score?: number | null
          window_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          current_status?: string | null
          exploitation_vectors?: Json | null
          historical_patterns?: Json | null
          id?: string
          optimal_approach_timing?: Json | null
          outcome_data?: Json | null
          predicted_end?: string | null
          predicted_start?: string | null
          profile_id?: string | null
          protective_factors_weakened?: Json | null
          risk_factors?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
          vulnerability_score?: number | null
          window_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vulnerability_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vulnerability_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vulnerability_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }

  // ============================================
  // New Warfare Enhancement Tables (v5.0)
  // ============================================
  opsec_assessments: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      overall_score: number | null
      digital_exposure_score: number | null
      physical_security_score: number | null
      communication_security_score: number | null
      vulnerabilities: Json | null
      recommendations: Json | null
      threat_vectors: Json | null
      assessed_at: string
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      overall_score?: number | null
      digital_exposure_score?: number | null
      physical_security_score?: number | null
      communication_security_score?: number | null
      vulnerabilities?: Json | null
      recommendations?: Json | null
      threat_vectors?: Json | null
      assessed_at?: string
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      overall_score?: number | null
      digital_exposure_score?: number | null
      physical_security_score?: number | null
      communication_security_score?: number | null
      vulnerabilities?: Json | null
      recommendations?: Json | null
      threat_vectors?: Json | null
      assessed_at?: string
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  digital_footprint_items: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      platform: string
      data_type: string
      exposure_level: string | null
      content_summary: string | null
      url: string | null
      discovered_at: string
      remediation_status: string | null
      risk_score: number | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      platform: string
      data_type: string
      exposure_level?: string | null
      content_summary?: string | null
      url?: string | null
      discovered_at?: string
      remediation_status?: string | null
      risk_score?: number | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      platform?: string
      data_type?: string
      exposure_level?: string | null
      content_summary?: string | null
      url?: string | null
      discovered_at?: string
      remediation_status?: string | null
      risk_score?: number | null
      created_at?: string
    }
    Relationships: []
  }
  social_engineering_incidents: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      incident_type: string
      attack_vector: string | null
      threat_level: number | null
      detected_at: string
      details: Json | null
      recommendations: Json | null
      status: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      incident_type: string
      attack_vector?: string | null
      threat_level?: number | null
      detected_at?: string
      details?: Json | null
      recommendations?: Json | null
      status?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      incident_type?: string
      attack_vector?: string | null
      threat_level?: number | null
      detected_at?: string
      details?: Json | null
      recommendations?: Json | null
      status?: string | null
      created_at?: string
    }
    Relationships: []
  }
  honey_profiles: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      honey_type: string
      persona_data: Json | null
      deployment_status: string | null
      interactions_logged: number | null
      threat_detections: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      honey_type: string
      persona_data?: Json | null
      deployment_status?: string | null
      interactions_logged?: number | null
      threat_detections?: Json | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      honey_type?: string
      persona_data?: Json | null
      deployment_status?: string | null
      interactions_logged?: number | null
      threat_detections?: Json | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  legal_threat_assessments: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      threat_type: string
      jurisdiction: string | null
      severity: string | null
      likelihood: number | null
      defensive_options: Json | null
      assessed_at: string
      status: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      threat_type: string
      jurisdiction?: string | null
      severity?: string | null
      likelihood?: number | null
      defensive_options?: Json | null
      assessed_at?: string
      status?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      threat_type?: string
      jurisdiction?: string | null
      severity?: string | null
      likelihood?: number | null
      defensive_options?: Json | null
      assessed_at?: string
      status?: string | null
      created_at?: string
    }
    Relationships: []
  }
  reputation_incidents: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      incident_type: string
      platform: string | null
      severity: number | null
      detected_at: string
      content_summary: string | null
      response_strategy: Json | null
      status: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      incident_type: string
      platform?: string | null
      severity?: number | null
      detected_at?: string
      content_summary?: string | null
      response_strategy?: Json | null
      status?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      incident_type?: string
      platform?: string | null
      severity?: number | null
      detected_at?: string
      content_summary?: string | null
      response_strategy?: Json | null
      status?: string | null
      created_at?: string
    }
    Relationships: []
  }
  protected_persons: {
    Row: {
      id: string
      user_id: string
      name: string
      relationship: string | null
      protection_level: string | null
      security_protocols: Json | null
      emergency_contacts: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      name: string
      relationship?: string | null
      protection_level?: string | null
      security_protocols?: Json | null
      emergency_contacts?: Json | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      name?: string
      relationship?: string | null
      protection_level?: string | null
      security_protocols?: Json | null
      emergency_contacts?: Json | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  emergency_protocols: {
    Row: {
      id: string
      user_id: string
      protocol_name: string
      trigger_conditions: Json | null
      response_steps: Json | null
      contacts: Json | null
      is_active: boolean
      last_tested_at: string | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      protocol_name: string
      trigger_conditions?: Json | null
      response_steps?: Json | null
      contacts?: Json | null
      is_active?: boolean
      last_tested_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      protocol_name?: string
      trigger_conditions?: Json | null
      response_steps?: Json | null
      contacts?: Json | null
      is_active?: boolean
      last_tested_at?: string | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
  crisis_events: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      crisis_type: string
      severity: string | null
      detected_at: string
      status: string | null
      escalation_level: number | null
      response_actions: Json | null
      timeline: Json | null
      resolved_at: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      crisis_type: string
      severity?: string | null
      detected_at?: string
      status?: string | null
      escalation_level?: number | null
      response_actions?: Json | null
      timeline?: Json | null
      resolved_at?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      crisis_type?: string
      severity?: string | null
      detected_at?: string
      status?: string | null
      escalation_level?: number | null
      response_actions?: Json | null
      timeline?: Json | null
      resolved_at?: string | null
      created_at?: string
    }
    Relationships: []
  }
  economic_threat_assessments: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      threat_type: string
      financial_exposure: number | null
      threat_actors: Json | null
      countermeasures: Json | null
      assessed_at: string
      status: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      threat_type: string
      financial_exposure?: number | null
      threat_actors?: Json | null
      countermeasures?: Json | null
      assessed_at?: string
      status?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      threat_type?: string
      financial_exposure?: number | null
      threat_actors?: Json | null
      countermeasures?: Json | null
      assessed_at?: string
      status?: string | null
      created_at?: string
    }
    Relationships: []
  }
  tscm_sweep_results: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      sweep_type: string
      location: string | null
      sweep_date: string
      devices_detected: Json | null
      vulnerabilities_found: Json | null
      recommendations: Json | null
      status: string | null
      created_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      sweep_type: string
      location?: string | null
      sweep_date?: string
      devices_detected?: Json | null
      vulnerabilities_found?: Json | null
      recommendations?: Json | null
      status?: string | null
      created_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      sweep_type?: string
      location?: string | null
      sweep_date?: string
      devices_detected?: Json | null
      vulnerabilities_found?: Json | null
      recommendations?: Json | null
      status?: string | null
      created_at?: string
    }
    Relationships: []
  }
  behavioral_baselines: {
    Row: {
      id: string
      user_id: string
      profile_id: string | null
      baseline_date: string
      normal_patterns: Json | null
      deviation_thresholds: Json | null
      current_deviations: Json | null
      anomaly_alerts: Json | null
      created_at: string
      updated_at: string
    }
    Insert: {
      id?: string
      user_id: string
      profile_id?: string | null
      baseline_date?: string
      normal_patterns?: Json | null
      deviation_thresholds?: Json | null
      current_deviations?: Json | null
      anomaly_alerts?: Json | null
      created_at?: string
      updated_at?: string
    }
    Update: {
      id?: string
      user_id?: string
      profile_id?: string | null
      baseline_date?: string
      normal_patterns?: Json | null
      deviation_thresholds?: Json | null
      current_deviations?: Json | null
      anomaly_alerts?: Json | null
      created_at?: string
      updated_at?: string
    }
    Relationships: []
  }
}
