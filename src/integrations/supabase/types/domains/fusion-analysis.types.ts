/**
 * Fusion Analysis Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: analysis_aggregates, analysis_events, analysis_sessions, bulk_analysis_items, bulk_analysis_sessions, cognitive_superpositions, cross_contact_detections, cross_contact_insights, cross_contact_patterns, cross_device_correlations, cross_domain_correlations, cross_modal_correlations, cross_phase_operations, deep_correlations, emotional_cascades, empathic_vulnerabilities, family_system_analyses, financial_intelligence, financial_psychology_profiles, mosaic_intelligence_fusion, mosaic_metadata_sessions, phobia_mappings, semantic_operations
 */
export interface FusionAnalysisTables {
      analysis_aggregates: {
        Row: {
          active_events: number | null
          aggregate_type: string
          average_confidence: number | null
          confidence_trend: Json | null
          created_at: string
          current_state: Json
          first_analysis_at: string | null
          id: string
          last_analysis_at: string | null
          last_event_id: string | null
          last_event_sequence: number | null
          last_rebuild_at: string | null
          last_rebuild_duration_ms: number | null
          needs_rebuild: boolean | null
          profile_id: string
          rebuild_count: number | null
          total_events: number | null
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          active_events?: number | null
          aggregate_type: string
          average_confidence?: number | null
          confidence_trend?: Json | null
          created_at?: string
          current_state?: Json
          first_analysis_at?: string | null
          id?: string
          last_analysis_at?: string | null
          last_event_id?: string | null
          last_event_sequence?: number | null
          last_rebuild_at?: string | null
          last_rebuild_duration_ms?: number | null
          needs_rebuild?: boolean | null
          profile_id: string
          rebuild_count?: number | null
          total_events?: number | null
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          active_events?: number | null
          aggregate_type?: string
          average_confidence?: number | null
          confidence_trend?: Json | null
          created_at?: string
          current_state?: Json
          first_analysis_at?: string | null
          id?: string
          last_analysis_at?: string | null
          last_event_id?: string | null
          last_event_sequence?: number | null
          last_rebuild_at?: string | null
          last_rebuild_duration_ms?: number | null
          needs_rebuild?: boolean | null
          profile_id?: string
          rebuild_count?: number | null
          total_events?: number | null
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: []
      }
      analysis_events: {
        Row: {
          analysis_model: string | null
          analysis_subtype: string | null
          analysis_type: string
          analysis_version: string | null
          confidence_score: number | null
          cost_cents: number | null
          created_at: string
          deleted_at: string | null
          deletion_request_id: string | null
          entities_mentioned: Json | null
          event_hash: string
          event_type: string
          event_version: number | null
          id: string
          is_deleted: boolean | null
          key_insights: string[] | null
          previous_event_id: string | null
          previous_hash: string | null
          processing_duration_ms: number | null
          profile_id: string | null
          raw_result: Json
          sequence_number: number
          source_hash: string | null
          source_id: string | null
          source_metadata: Json | null
          source_registry_id: string | null
          source_type: string | null
          tags: string[] | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          analysis_model?: string | null
          analysis_subtype?: string | null
          analysis_type: string
          analysis_version?: string | null
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string
          deleted_at?: string | null
          deletion_request_id?: string | null
          entities_mentioned?: Json | null
          event_hash: string
          event_type: string
          event_version?: number | null
          id?: string
          is_deleted?: boolean | null
          key_insights?: string[] | null
          previous_event_id?: string | null
          previous_hash?: string | null
          processing_duration_ms?: number | null
          profile_id?: string | null
          raw_result: Json
          sequence_number?: number
          source_hash?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          source_registry_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          analysis_model?: string | null
          analysis_subtype?: string | null
          analysis_type?: string
          analysis_version?: string | null
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string
          deleted_at?: string | null
          deletion_request_id?: string | null
          entities_mentioned?: Json | null
          event_hash?: string
          event_type?: string
          event_version?: number | null
          id?: string
          is_deleted?: boolean | null
          key_insights?: string[] | null
          previous_event_id?: string | null
          previous_hash?: string | null
          processing_duration_ms?: number | null
          profile_id?: string | null
          raw_result?: Json
          sequence_number?: number
          source_hash?: string | null
          source_id?: string | null
          source_metadata?: Json | null
          source_registry_id?: string | null
          source_type?: string | null
          tags?: string[] | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_events_source_registry_id_fkey"
            columns: ["source_registry_id"]
            isOneToOne: false
            referencedRelation: "source_asset_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          analysis_mode: string
          completed_at: string | null
          context_type: string
          created_at: string
          id: string
          media_id: string
          media_url: string
          mosaic_url: string | null
          profile_id: string
          started_at: string | null
          status: string
          total_cost_cents: number | null
          total_duration_ms: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_mode?: string
          completed_at?: string | null
          context_type?: string
          created_at?: string
          id?: string
          media_id: string
          media_url: string
          mosaic_url?: string | null
          profile_id: string
          started_at?: string | null
          status?: string
          total_cost_cents?: number | null
          total_duration_ms?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_mode?: string
          completed_at?: string | null
          context_type?: string
          created_at?: string
          id?: string
          media_id?: string
          media_url?: string
          mosaic_url?: string | null
          profile_id?: string
          started_at?: string | null
          status?: string
          total_cost_cents?: number | null
          total_duration_ms?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "analysis_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "analysis_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_analysis_items: {
        Row: {
          actual_cost_cents: number | null
          analysis_id: string | null
          completed_at: string | null
          created_at: string | null
          document_id: string | null
          error_message: string | null
          estimated_cost_cents: number | null
          file_name: string | null
          file_size: number | null
          id: string
          max_retries: number | null
          media_id: string | null
          media_type: string
          media_url: string | null
          priority_boost: number | null
          priority_score: number | null
          processing_time_ms: number | null
          profile_id: string | null
          queue_position: number | null
          result: Json | null
          retry_count: number | null
          session_id: string
          started_at: string | null
          status: string
          storage_path: string | null
        }
        Insert: {
          actual_cost_cents?: number | null
          analysis_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          max_retries?: number | null
          media_id?: string | null
          media_type: string
          media_url?: string | null
          priority_boost?: number | null
          priority_score?: number | null
          processing_time_ms?: number | null
          profile_id?: string | null
          queue_position?: number | null
          result?: Json | null
          retry_count?: number | null
          session_id: string
          started_at?: string | null
          status?: string
          storage_path?: string | null
        }
        Update: {
          actual_cost_cents?: number | null
          analysis_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          max_retries?: number | null
          media_id?: string | null
          media_type?: string
          media_url?: string | null
          priority_boost?: number | null
          priority_score?: number | null
          processing_time_ms?: number | null
          profile_id?: string | null
          queue_position?: number | null
          result?: Json | null
          retry_count?: number | null
          session_id?: string
          started_at?: string | null
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_analysis_items_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "media_analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_analysis_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bulk_analysis_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_analysis_sessions: {
        Row: {
          aggregation_result: Json | null
          analysis_context: Json | null
          analysis_depth: string | null
          analysis_modes: string[] | null
          auto_aggregate: boolean | null
          completed_at: string | null
          completed_items: number | null
          created_at: string | null
          current_cost_cents: number | null
          current_item_index: number | null
          error_count: number | null
          estimated_completion: string | null
          failed_items: number | null
          id: string
          last_error: string | null
          max_cost_cents: number | null
          media_types: string[] | null
          name: string | null
          paused_at: string | null
          priority: number | null
          profile_ids: string[] | null
          scheduled_for: string | null
          scope_type: string
          skipped_items: number | null
          started_at: string | null
          status: string
          stop_on_budget_exceeded: boolean | null
          total_items: number | null
          trigger_deep_analysis: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aggregation_result?: Json | null
          analysis_context?: Json | null
          analysis_depth?: string | null
          analysis_modes?: string[] | null
          auto_aggregate?: boolean | null
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          current_cost_cents?: number | null
          current_item_index?: number | null
          error_count?: number | null
          estimated_completion?: string | null
          failed_items?: number | null
          id?: string
          last_error?: string | null
          max_cost_cents?: number | null
          media_types?: string[] | null
          name?: string | null
          paused_at?: string | null
          priority?: number | null
          profile_ids?: string[] | null
          scheduled_for?: string | null
          scope_type?: string
          skipped_items?: number | null
          started_at?: string | null
          status?: string
          stop_on_budget_exceeded?: boolean | null
          total_items?: number | null
          trigger_deep_analysis?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          aggregation_result?: Json | null
          analysis_context?: Json | null
          analysis_depth?: string | null
          analysis_modes?: string[] | null
          auto_aggregate?: boolean | null
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          current_cost_cents?: number | null
          current_item_index?: number | null
          error_count?: number | null
          estimated_completion?: string | null
          failed_items?: number | null
          id?: string
          last_error?: string | null
          max_cost_cents?: number | null
          media_types?: string[] | null
          name?: string | null
          paused_at?: string | null
          priority?: number | null
          profile_ids?: string[] | null
          scheduled_for?: string | null
          scope_type?: string
          skipped_items?: number | null
          started_at?: string | null
          status?: string
          stop_on_budget_exceeded?: boolean | null
          total_items?: number | null
          trigger_deep_analysis?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cognitive_superpositions: {
        Row: {
          coherence_duration_ms: number | null
          collapse_probability: number | null
          created_at: string | null
          entanglement_partners: string[] | null
          id: string
          interference_patterns: Json | null
          observation_sensitivity: number | null
          profile_id: string | null
          quantum_signature: string | null
          superposition_states: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coherence_duration_ms?: number | null
          collapse_probability?: number | null
          created_at?: string | null
          entanglement_partners?: string[] | null
          id?: string
          interference_patterns?: Json | null
          observation_sensitivity?: number | null
          profile_id?: string | null
          quantum_signature?: string | null
          superposition_states?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coherence_duration_ms?: number | null
          collapse_probability?: number | null
          created_at?: string | null
          entanglement_partners?: string[] | null
          id?: string
          interference_patterns?: Json | null
          observation_sensitivity?: number | null
          profile_id?: string | null
          quantum_signature?: string | null
          superposition_states?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cognitive_superpositions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cognitive_superpositions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cognitive_superpositions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_contact_detections: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          detected_features: Json | null
          detected_profile_id: string
          detection_type: string
          id: string
          media_id: string | null
          owner_profile_id: string
          timestamp_in_media: string | null
          user_id: string
          verified: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          detected_features?: Json | null
          detected_profile_id: string
          detection_type: string
          id?: string
          media_id?: string | null
          owner_profile_id: string
          timestamp_in_media?: string | null
          user_id: string
          verified?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          detected_features?: Json | null
          detected_profile_id?: string
          detection_type?: string
          id?: string
          media_id?: string | null
          owner_profile_id?: string
          timestamp_in_media?: string | null
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_contact_detections_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_contact_detections_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_contact_detections_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_contact_detections_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_contact_detections_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_contact_detections_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_contact_detections_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_contact_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string | null
          entity_or_pattern: string | null
          evidence: Json | null
          id: string
          insight_type: string
          is_dismissed: boolean | null
          profile_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          entity_or_pattern?: string | null
          evidence?: Json | null
          id?: string
          insight_type: string
          is_dismissed?: boolean | null
          profile_ids: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          entity_or_pattern?: string | null
          evidence?: Json | null
          id?: string
          insight_type?: string
          is_dismissed?: boolean | null
          profile_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cross_contact_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string
          description: string | null
          detected_at: string
          evidence: Json | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          pattern_type: string
          profiles_involved: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          evidence?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type: string
          profiles_involved?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          detected_at?: string
          evidence?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          pattern_type?: string
          profiles_involved?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cross_device_correlations: {
        Row: {
          correlation_strength: number | null
          correlation_type: string
          created_at: string | null
          findings: Json | null
          id: string
          is_verified: boolean | null
          location_overlap: Json | null
          mission_id: string | null
          source_events: Json
          threat_level: string | null
          time_overlap_seconds: number | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          correlation_strength?: number | null
          correlation_type: string
          created_at?: string | null
          findings?: Json | null
          id?: string
          is_verified?: boolean | null
          location_overlap?: Json | null
          mission_id?: string | null
          source_events?: Json
          threat_level?: string | null
          time_overlap_seconds?: number | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          correlation_strength?: number | null
          correlation_type?: string
          created_at?: string | null
          findings?: Json | null
          id?: string
          is_verified?: boolean | null
          location_overlap?: Json | null
          mission_id?: string | null
          source_events?: Json
          threat_level?: string | null
          time_overlap_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_device_correlations_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_domain_correlations: {
        Row: {
          auto_recommendations: Json | null
          confidence_score: number | null
          correlation_strength: number | null
          correlation_type: string
          created_at: string
          id: string
          last_computed_at: string | null
          pattern_description: string | null
          profile_id: string | null
          source_domains: string[]
          tactical_implications: Json | null
          temporal_alignment: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_recommendations?: Json | null
          confidence_score?: number | null
          correlation_strength?: number | null
          correlation_type: string
          created_at?: string
          id?: string
          last_computed_at?: string | null
          pattern_description?: string | null
          profile_id?: string | null
          source_domains: string[]
          tactical_implications?: Json | null
          temporal_alignment?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_recommendations?: Json | null
          confidence_score?: number | null
          correlation_strength?: number | null
          correlation_type?: string
          created_at?: string
          id?: string
          last_computed_at?: string | null
          pattern_description?: string | null
          profile_id?: string | null
          source_domains?: string[]
          tactical_implications?: Json | null
          temporal_alignment?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_domain_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_domain_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_domain_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_modal_correlations: {
        Row: {
          confidence_score: number | null
          correlation_data: Json
          correlation_strength: number | null
          correlation_type: string
          created_at: string
          id: string
          insights: string[] | null
          profile_id: string
          source_analysis_types: string[]
          source_event_ids: string[]
          user_id: string
          validated_by_user: boolean | null
          validation_feedback: string | null
        }
        Insert: {
          confidence_score?: number | null
          correlation_data: Json
          correlation_strength?: number | null
          correlation_type: string
          created_at?: string
          id?: string
          insights?: string[] | null
          profile_id: string
          source_analysis_types: string[]
          source_event_ids: string[]
          user_id: string
          validated_by_user?: boolean | null
          validation_feedback?: string | null
        }
        Update: {
          confidence_score?: number | null
          correlation_data?: Json
          correlation_strength?: number | null
          correlation_type?: string
          created_at?: string
          id?: string
          insights?: string[] | null
          profile_id?: string
          source_analysis_types?: string[]
          source_event_ids?: string[]
          user_id?: string
          validated_by_user?: boolean | null
          validation_feedback?: string | null
        }
        Relationships: []
      }
      cross_phase_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          execution_timeline: Json | null
          id: string
          operation_name: string
          operation_type: string
          outcome_analysis: Json | null
          phase_objectives: Json | null
          phases_involved: string[] | null
          profile_id: string | null
          resource_allocation: Json | null
          started_at: string | null
          status: string | null
          success_probability: number | null
          synchronization_rules: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          execution_timeline?: Json | null
          id?: string
          operation_name: string
          operation_type: string
          outcome_analysis?: Json | null
          phase_objectives?: Json | null
          phases_involved?: string[] | null
          profile_id?: string | null
          resource_allocation?: Json | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          synchronization_rules?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          execution_timeline?: Json | null
          id?: string
          operation_name?: string
          operation_type?: string
          outcome_analysis?: Json | null
          phase_objectives?: Json | null
          phases_involved?: string[] | null
          profile_id?: string | null
          resource_allocation?: Json | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          synchronization_rules?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_phase_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_phase_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_phase_operations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deep_correlations: {
        Row: {
          actionable_insights: string[] | null
          confidence: number
          correlation_type: string
          discovered_at: string
          evidence: Json
          evidence_count: number | null
          expires_at: string | null
          id: string
          implications: string[] | null
          involved_profiles: string[]
          last_validated_at: string | null
          primary_profile_id: string | null
          risk_assessment: Json | null
          strength: number
          user_id: string
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          actionable_insights?: string[] | null
          confidence: number
          correlation_type: string
          discovered_at?: string
          evidence?: Json
          evidence_count?: number | null
          expires_at?: string | null
          id?: string
          implications?: string[] | null
          involved_profiles: string[]
          last_validated_at?: string | null
          primary_profile_id?: string | null
          risk_assessment?: Json | null
          strength: number
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          actionable_insights?: string[] | null
          confidence?: number
          correlation_type?: string
          discovered_at?: string
          evidence?: Json
          evidence_count?: number | null
          expires_at?: string | null
          id?: string
          implications?: string[] | null
          involved_profiles?: string[]
          last_validated_at?: string | null
          primary_profile_id?: string | null
          risk_assessment?: Json | null
          strength?: number
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deep_correlations_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deep_correlations_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deep_correlations_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_cascades: {
        Row: {
          amplification_factor: number | null
          cascade_path: string[] | null
          completed_at: string | null
          decay_rate: number | null
          emotion_type: string
          id: string
          initiated_at: string | null
          origin_profile_id: string | null
          propagation_speed: number | null
          total_affected: number | null
          user_id: string
        }
        Insert: {
          amplification_factor?: number | null
          cascade_path?: string[] | null
          completed_at?: string | null
          decay_rate?: number | null
          emotion_type: string
          id?: string
          initiated_at?: string | null
          origin_profile_id?: string | null
          propagation_speed?: number | null
          total_affected?: number | null
          user_id: string
        }
        Update: {
          amplification_factor?: number | null
          cascade_path?: string[] | null
          completed_at?: string | null
          decay_rate?: number | null
          emotion_type?: string
          id?: string
          initiated_at?: string | null
          origin_profile_id?: string | null
          propagation_speed?: number | null
          total_affected?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "emotional_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "emotional_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      empathic_vulnerabilities: {
        Row: {
          absorption_rate: number | null
          created_at: string | null
          exploitation_protocol: Json | null
          id: string
          overwhelm_threshold: number | null
          profile_id: string | null
          protective_capacity: number | null
          source_sensitivity: Json | null
          updated_at: string | null
          user_id: string
          vulnerability_type: string
        }
        Insert: {
          absorption_rate?: number | null
          created_at?: string | null
          exploitation_protocol?: Json | null
          id?: string
          overwhelm_threshold?: number | null
          profile_id?: string | null
          protective_capacity?: number | null
          source_sensitivity?: Json | null
          updated_at?: string | null
          user_id: string
          vulnerability_type: string
        }
        Update: {
          absorption_rate?: number | null
          created_at?: string | null
          exploitation_protocol?: Json | null
          id?: string
          overwhelm_threshold?: number | null
          profile_id?: string | null
          protective_capacity?: number | null
          source_sensitivity?: Json | null
          updated_at?: string | null
          user_id?: string
          vulnerability_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "empathic_vulnerabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "empathic_vulnerabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "empathic_vulnerabilities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_system_analyses: {
        Row: {
          boundary_violations: Json | null
          created_at: string | null
          disengagement_score: number | null
          enmeshment_score: number | null
          exploitation_opportunities: Json | null
          family_structure: Json | null
          golden_child_indicators: Json | null
          id: string
          intergenerational_patterns: Json | null
          loyalty_conflicts: Json | null
          parentification_score: number | null
          profile_id: string | null
          scapegoat_indicators: Json | null
          triangulation_patterns: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          boundary_violations?: Json | null
          created_at?: string | null
          disengagement_score?: number | null
          enmeshment_score?: number | null
          exploitation_opportunities?: Json | null
          family_structure?: Json | null
          golden_child_indicators?: Json | null
          id?: string
          intergenerational_patterns?: Json | null
          loyalty_conflicts?: Json | null
          parentification_score?: number | null
          profile_id?: string | null
          scapegoat_indicators?: Json | null
          triangulation_patterns?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          boundary_violations?: Json | null
          created_at?: string | null
          disengagement_score?: number | null
          enmeshment_score?: number | null
          exploitation_opportunities?: Json | null
          family_structure?: Json | null
          golden_child_indicators?: Json | null
          id?: string
          intergenerational_patterns?: Json | null
          loyalty_conflicts?: Json | null
          parentification_score?: number | null
          profile_id?: string | null
          scapegoat_indicators?: Json | null
          triangulation_patterns?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_system_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "family_system_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "family_system_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_intelligence: {
        Row: {
          asset_indicators: Json | null
          career_earnings_potential: Json | null
          created_at: string
          debt_indicators: Json | null
          estimated_net_worth_max: number | null
          estimated_net_worth_min: number | null
          evidence_sources: Json | null
          financial_stress_score: number | null
          id: string
          income_trajectory: Json | null
          last_analyzed_at: string | null
          lifestyle_tier: string | null
          net_worth_currency: string | null
          opportunity_windows: Json | null
          optimal_ask_timing: Json | null
          overall_confidence: number | null
          profile_id: string
          updated_at: string
          user_id: string
          vulnerability_windows: Json | null
          wealth_tier: number | null
          wealth_tier_confidence: number | null
        }
        Insert: {
          asset_indicators?: Json | null
          career_earnings_potential?: Json | null
          created_at?: string
          debt_indicators?: Json | null
          estimated_net_worth_max?: number | null
          estimated_net_worth_min?: number | null
          evidence_sources?: Json | null
          financial_stress_score?: number | null
          id?: string
          income_trajectory?: Json | null
          last_analyzed_at?: string | null
          lifestyle_tier?: string | null
          net_worth_currency?: string | null
          opportunity_windows?: Json | null
          optimal_ask_timing?: Json | null
          overall_confidence?: number | null
          profile_id: string
          updated_at?: string
          user_id: string
          vulnerability_windows?: Json | null
          wealth_tier?: number | null
          wealth_tier_confidence?: number | null
        }
        Update: {
          asset_indicators?: Json | null
          career_earnings_potential?: Json | null
          created_at?: string
          debt_indicators?: Json | null
          estimated_net_worth_max?: number | null
          estimated_net_worth_min?: number | null
          evidence_sources?: Json | null
          financial_stress_score?: number | null
          id?: string
          income_trajectory?: Json | null
          last_analyzed_at?: string | null
          lifestyle_tier?: string | null
          net_worth_currency?: string | null
          opportunity_windows?: Json | null
          optimal_ask_timing?: Json | null
          overall_confidence?: number | null
          profile_id?: string
          updated_at?: string
          user_id?: string
          vulnerability_windows?: Json | null
          wealth_tier?: number | null
          wealth_tier_confidence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "financial_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "financial_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_psychology_profiles: {
        Row: {
          anchoring_susceptibility: number | null
          created_at: string | null
          endowment_effect_susceptibility: number | null
          hyperbolic_discounting_rate: number | null
          id: string
          loss_aversion_score: number | null
          mental_accounting_patterns: Json | null
          negotiation_patterns: Json | null
          optimal_anchor_range: Json | null
          payment_pain_sensitivity: number | null
          profile_id: string | null
          sunk_cost_fallacy_susceptibility: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anchoring_susceptibility?: number | null
          created_at?: string | null
          endowment_effect_susceptibility?: number | null
          hyperbolic_discounting_rate?: number | null
          id?: string
          loss_aversion_score?: number | null
          mental_accounting_patterns?: Json | null
          negotiation_patterns?: Json | null
          optimal_anchor_range?: Json | null
          payment_pain_sensitivity?: number | null
          profile_id?: string | null
          sunk_cost_fallacy_susceptibility?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anchoring_susceptibility?: number | null
          created_at?: string | null
          endowment_effect_susceptibility?: number | null
          hyperbolic_discounting_rate?: number | null
          id?: string
          loss_aversion_score?: number | null
          mental_accounting_patterns?: Json | null
          negotiation_patterns?: Json | null
          optimal_anchor_range?: Json | null
          payment_pain_sensitivity?: number | null
          profile_id?: string | null
          sunk_cost_fallacy_susceptibility?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_psychology_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "financial_psychology_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "financial_psychology_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mosaic_intelligence_fusion: {
        Row: {
          actionable_conclusions: Json | null
          confidence_matrix: Json | null
          contradictions_detected: Json | null
          correlated_patterns: Json | null
          created_at: string
          fusion_score: number | null
          fusion_type: string
          high_confidence_insights: Json | null
          id: string
          intelligence_grade: string | null
          low_confidence_gaps: Json | null
          profile_id: string | null
          recommended_collection_priorities: Json | null
          source_count: number | null
          sources_analyzed: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actionable_conclusions?: Json | null
          confidence_matrix?: Json | null
          contradictions_detected?: Json | null
          correlated_patterns?: Json | null
          created_at?: string
          fusion_score?: number | null
          fusion_type: string
          high_confidence_insights?: Json | null
          id?: string
          intelligence_grade?: string | null
          low_confidence_gaps?: Json | null
          profile_id?: string | null
          recommended_collection_priorities?: Json | null
          source_count?: number | null
          sources_analyzed?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actionable_conclusions?: Json | null
          confidence_matrix?: Json | null
          contradictions_detected?: Json | null
          correlated_patterns?: Json | null
          created_at?: string
          fusion_score?: number | null
          fusion_type?: string
          high_confidence_insights?: Json | null
          id?: string
          intelligence_grade?: string | null
          low_confidence_gaps?: Json | null
          profile_id?: string | null
          recommended_collection_priorities?: Json | null
          source_count?: number | null
          sources_analyzed?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosaic_intelligence_fusion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mosaic_intelligence_fusion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mosaic_intelligence_fusion_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mosaic_metadata_sessions: {
        Row: {
          actual_cost_cents: number | null
          auto_linked_count: number | null
          completed_at: string | null
          created_at: string
          documents_detected: number | null
          error_message: string | null
          estimated_cost_cents: number | null
          faces_detected: number | null
          failed_media_ids: string[] | null
          id: string
          items_detected: number | null
          pending_review_count: number | null
          processed_images: number
          processed_mosaics: number
          profile_id: string | null
          started_at: string | null
          status: string
          total_images: number
          total_mosaics: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          auto_linked_count?: number | null
          completed_at?: string | null
          created_at?: string
          documents_detected?: number | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          faces_detected?: number | null
          failed_media_ids?: string[] | null
          id?: string
          items_detected?: number | null
          pending_review_count?: number | null
          processed_images?: number
          processed_mosaics?: number
          profile_id?: string | null
          started_at?: string | null
          status?: string
          total_images?: number
          total_mosaics?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          auto_linked_count?: number | null
          completed_at?: string | null
          created_at?: string
          documents_detected?: number | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          faces_detected?: number | null
          failed_media_ids?: string[] | null
          id?: string
          items_detected?: number | null
          pending_review_count?: number | null
          processed_images?: number
          processed_mosaics?: number
          profile_id?: string | null
          started_at?: string | null
          status?: string
          total_images?: number
          total_mosaics?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosaic_metadata_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mosaic_metadata_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mosaic_metadata_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      phobia_mappings: {
        Row: {
          activation_success_rate: number | null
          avoidance_behaviors: string[] | null
          counter_phobia_indicators: Json | null
          created_at: string
          exploitation_scripts: Json | null
          fear_response_pattern: Json | null
          id: string
          intensity_level: number | null
          last_activation_at: string | null
          neuroticism_correlation: number | null
          optimal_activation_timing: Json | null
          phobia_type: string
          profile_id: string | null
          trigger_stimuli: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activation_success_rate?: number | null
          avoidance_behaviors?: string[] | null
          counter_phobia_indicators?: Json | null
          created_at?: string
          exploitation_scripts?: Json | null
          fear_response_pattern?: Json | null
          id?: string
          intensity_level?: number | null
          last_activation_at?: string | null
          neuroticism_correlation?: number | null
          optimal_activation_timing?: Json | null
          phobia_type: string
          profile_id?: string | null
          trigger_stimuli?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activation_success_rate?: number | null
          avoidance_behaviors?: string[] | null
          counter_phobia_indicators?: Json | null
          created_at?: string
          exploitation_scripts?: Json | null
          fear_response_pattern?: Json | null
          id?: string
          intensity_level?: number | null
          last_activation_at?: string | null
          neuroticism_correlation?: number | null
          optimal_activation_timing?: Json | null
          phobia_type?: string
          profile_id?: string | null
          trigger_stimuli?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phobia_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "phobia_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "phobia_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      semantic_operations: {
        Row: {
          anchor_phrases: string[] | null
          completed_at: string | null
          created_at: string | null
          current_definition: string | null
          deployment_contexts: string[] | null
          effectiveness_metrics: Json | null
          framing_strategy: string | null
          id: string
          linguistic_techniques: Json | null
          operation_name: string
          overton_position: number | null
          repetition_schedule: Json | null
          resistance_encountered: Json | null
          shift_progress: number | null
          started_at: string | null
          status: string | null
          target_definition: string | null
          target_term: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anchor_phrases?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          current_definition?: string | null
          deployment_contexts?: string[] | null
          effectiveness_metrics?: Json | null
          framing_strategy?: string | null
          id?: string
          linguistic_techniques?: Json | null
          operation_name: string
          overton_position?: number | null
          repetition_schedule?: Json | null
          resistance_encountered?: Json | null
          shift_progress?: number | null
          started_at?: string | null
          status?: string | null
          target_definition?: string | null
          target_term: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anchor_phrases?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          current_definition?: string | null
          deployment_contexts?: string[] | null
          effectiveness_metrics?: Json | null
          framing_strategy?: string | null
          id?: string
          linguistic_techniques?: Json | null
          operation_name?: string
          overton_position?: number | null
          repetition_schedule?: Json | null
          resistance_encountered?: Json | null
          shift_progress?: number | null
          started_at?: string | null
          status?: string | null
          target_definition?: string | null
          target_term?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
}
