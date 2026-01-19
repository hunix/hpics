/**
 * Intelligence Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: action_recommendations, ai_analyses, ai_usage_logs, behavioral_analyses, elicitation_sessions, intelligence_alert_rules, intelligence_alerts, intelligence_fusion_events, intelligence_methodologies, intelligence_missions, intelligence_queue, intelligence_session_tasks, intelligence_sessions, intelligence_snapshots, mice_assessments, proactive_actions, proactive_insights, psychological_profile_access_logs, psychological_profile_history, psychological_profiles, psychology_assessments, sacred_values, trust_assessments, trust_trajectories
 */
export interface IntelligenceTables {
      action_recommendations: {
        Row: {
          action_script: string | null
          actioned_at: string | null
          category: string | null
          created_at: string
          description: string
          expected_outcome: string | null
          expires_at: string | null
          generated_at: string
          id: string
          opportunity_window: Json | null
          outcome_recorded: Json | null
          priority_score: number
          profile_id: string | null
          recommendation_type: string
          risk_assessment: Json | null
          status: string | null
          success_probability: number | null
          suggested_action: string
          supporting_evidence: Json | null
          talking_points: string[] | null
          title: string
          trigger_reason: string | null
          urgency: string | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          action_script?: string | null
          actioned_at?: string | null
          category?: string | null
          created_at?: string
          description: string
          expected_outcome?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          opportunity_window?: Json | null
          outcome_recorded?: Json | null
          priority_score: number
          profile_id?: string | null
          recommendation_type: string
          risk_assessment?: Json | null
          status?: string | null
          success_probability?: number | null
          suggested_action: string
          supporting_evidence?: Json | null
          talking_points?: string[] | null
          title: string
          trigger_reason?: string | null
          urgency?: string | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          action_script?: string | null
          actioned_at?: string | null
          category?: string | null
          created_at?: string
          description?: string
          expected_outcome?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          opportunity_window?: Json | null
          outcome_recorded?: Json | null
          priority_score?: number
          profile_id?: string | null
          recommendation_type?: string
          risk_assessment?: Json | null
          status?: string | null
          success_probability?: number | null
          suggested_action?: string
          supporting_evidence?: Json | null
          talking_points?: string[] | null
          title?: string
          trigger_reason?: string | null
          urgency?: string | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "action_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "action_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analyses: {
        Row: {
          analysis_type: string
          generated_at: string
          id: string
          profile_id: string
          result: Json
          user_id: string
        }
        Insert: {
          analysis_type: string
          generated_at?: string
          id?: string
          profile_id: string
          result: Json
          user_id: string
        }
        Update: {
          analysis_type?: string
          generated_at?: string
          id?: string
          profile_id?: string
          result?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          actual_cost_cents: number | null
          created_at: string
          error_message: string | null
          estimated_cost_cents: number
          function_name: string
          id: string
          input_tokens: number | null
          model_name: string
          outcome_success: boolean | null
          output_tokens: number | null
          profile_id: string | null
          prompt_key: string | null
          prompt_summary: string | null
          prompt_version: number | null
          provider: string
          recording_id: string | null
          request_metadata: Json | null
          response_metadata: Json | null
          response_time_ms: number | null
          status: string
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          estimated_cost_cents?: number
          function_name: string
          id?: string
          input_tokens?: number | null
          model_name: string
          outcome_success?: boolean | null
          output_tokens?: number | null
          profile_id?: string | null
          prompt_key?: string | null
          prompt_summary?: string | null
          prompt_version?: number | null
          provider: string
          recording_id?: string | null
          request_metadata?: Json | null
          response_metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          created_at?: string
          error_message?: string | null
          estimated_cost_cents?: number
          function_name?: string
          id?: string
          input_tokens?: number | null
          model_name?: string
          outcome_success?: boolean | null
          output_tokens?: number | null
          profile_id?: string | null
          prompt_key?: string | null
          prompt_summary?: string | null
          prompt_version?: number | null
          provider?: string
          recording_id?: string | null
          request_metadata?: Json | null
          response_metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_usage_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_analyses: {
        Row: {
          ai_model_used: string | null
          analysis_type: string
          behavioral_patterns: Json | null
          confidence_score: number | null
          created_at: string
          id: string
          personality_indicators: Json | null
          profile_id: string
          raw_analysis: Json | null
          source_recording_id: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_model_used?: string | null
          analysis_type: string
          behavioral_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          personality_indicators?: Json | null
          profile_id: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_model_used?: string | null
          analysis_type?: string
          behavioral_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          personality_indicators?: Json | null
          profile_id?: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_analyses_source_recording_id_fkey"
            columns: ["source_recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      elicitation_sessions: {
        Row: {
          conversation_notes: string | null
          conversation_transcript: Json | null
          created_at: string | null
          extracted_intelligence: Json | null
          follow_up_questions: string[] | null
          id: string
          profile_id: string | null
          rapport_level: number | null
          session_recording_url: string | null
          session_type: string
          success_metrics: Json | null
          suspicion_level: number | null
          target_information: string[] | null
          technique_effectiveness: Json | null
          techniques_used: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_notes?: string | null
          conversation_transcript?: Json | null
          created_at?: string | null
          extracted_intelligence?: Json | null
          follow_up_questions?: string[] | null
          id?: string
          profile_id?: string | null
          rapport_level?: number | null
          session_recording_url?: string | null
          session_type: string
          success_metrics?: Json | null
          suspicion_level?: number | null
          target_information?: string[] | null
          technique_effectiveness?: Json | null
          techniques_used?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_notes?: string | null
          conversation_transcript?: Json | null
          created_at?: string | null
          extracted_intelligence?: Json | null
          follow_up_questions?: string[] | null
          id?: string
          profile_id?: string | null
          rapport_level?: number | null
          session_recording_url?: string | null
          session_type?: string
          success_metrics?: Json | null
          suspicion_level?: number | null
          target_information?: string[] | null
          technique_effectiveness?: Json | null
          techniques_used?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elicitation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "elicitation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "elicitation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_alert_rules: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          notification_channels: string[] | null
          rule_type: string
          severity: string | null
          target_groups: string[] | null
          target_profiles: string[] | null
          trigger_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          notification_channels?: string[] | null
          rule_type: string
          severity?: string | null
          target_groups?: string[] | null
          target_profiles?: string[] | null
          trigger_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          notification_channels?: string[] | null
          rule_type?: string
          severity?: string | null
          target_groups?: string[] | null
          target_profiles?: string[] | null
          trigger_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intelligence_alerts: {
        Row: {
          acknowledged_at: string | null
          action_suggestions: Json | null
          action_taken: string | null
          alert_type: string
          created_at: string
          description: string | null
          evidence: Json | null
          expires_at: string | null
          id: string
          is_acknowledged: boolean | null
          is_actioned: boolean | null
          is_dismissed: boolean | null
          is_read: boolean | null
          priority: string | null
          profile_id: string | null
          related_entity_ids: string[] | null
          rule_id: string | null
          severity: string
          source_analysis_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_suggestions?: Json | null
          action_taken?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          profile_id?: string | null
          related_entity_ids?: string[] | null
          rule_id?: string | null
          severity: string
          source_analysis_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          action_suggestions?: Json | null
          action_taken?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          expires_at?: string | null
          id?: string
          is_acknowledged?: boolean | null
          is_actioned?: boolean | null
          is_dismissed?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          profile_id?: string | null
          related_entity_ids?: string[] | null
          rule_id?: string | null
          severity?: string
          source_analysis_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_alerts_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "intelligence_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_fusion_events: {
        Row: {
          confidence_score: number | null
          correlation_id: string | null
          created_at: string
          event_type: string
          fusion_result: Json | null
          id: string
          is_processed: boolean | null
          location_data: Json | null
          priority: string | null
          processed_at: string | null
          recommendations: Json | null
          sources: Json
          temporal_data: Json | null
          threat_level: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          correlation_id?: string | null
          created_at?: string
          event_type: string
          fusion_result?: Json | null
          id?: string
          is_processed?: boolean | null
          location_data?: Json | null
          priority?: string | null
          processed_at?: string | null
          recommendations?: Json | null
          sources?: Json
          temporal_data?: Json | null
          threat_level?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          fusion_result?: Json | null
          id?: string
          is_processed?: boolean | null
          location_data?: Json | null
          priority?: string | null
          processed_at?: string | null
          recommendations?: Json | null
          sources?: Json
          temporal_data?: Json | null
          threat_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intelligence_methodologies: {
        Row: {
          ai_prompt_template: string | null
          best_for: string[] | null
          category: string
          contraindications: string[] | null
          created_at: string
          description: string
          difficulty_level: string | null
          effectiveness_stats: Json | null
          ethical_considerations: string | null
          example_scripts: Json | null
          id: string
          name: string
          psychological_basis: string | null
          subcategory: string | null
          success_indicators: string[] | null
          technique_steps: Json
          updated_at: string
        }
        Insert: {
          ai_prompt_template?: string | null
          best_for?: string[] | null
          category: string
          contraindications?: string[] | null
          created_at?: string
          description: string
          difficulty_level?: string | null
          effectiveness_stats?: Json | null
          ethical_considerations?: string | null
          example_scripts?: Json | null
          id?: string
          name: string
          psychological_basis?: string | null
          subcategory?: string | null
          success_indicators?: string[] | null
          technique_steps?: Json
          updated_at?: string
        }
        Update: {
          ai_prompt_template?: string | null
          best_for?: string[] | null
          category?: string
          contraindications?: string[] | null
          created_at?: string
          description?: string
          difficulty_level?: string | null
          effectiveness_stats?: Json | null
          ethical_considerations?: string | null
          example_scripts?: Json | null
          id?: string
          name?: string
          psychological_basis?: string | null
          subcategory?: string | null
          success_indicators?: string[] | null
          technique_steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      intelligence_missions: {
        Row: {
          automation_rules: Json | null
          completed_at: string | null
          created_at: string | null
          devices_assigned: string[] | null
          findings: Json | null
          id: string
          mission_name: string
          mission_type: string
          parameters: Json | null
          priority: string | null
          scheduled_start: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          target_location: Json | null
          target_location_name: string | null
          target_profile_id: string | null
          target_radius_meters: number | null
          threat_level: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_rules?: Json | null
          completed_at?: string | null
          created_at?: string | null
          devices_assigned?: string[] | null
          findings?: Json | null
          id?: string
          mission_name: string
          mission_type: string
          parameters?: Json | null
          priority?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          target_location?: Json | null
          target_location_name?: string | null
          target_profile_id?: string | null
          target_radius_meters?: number | null
          threat_level?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_rules?: Json | null
          completed_at?: string | null
          created_at?: string | null
          devices_assigned?: string[] | null
          findings?: Json | null
          id?: string
          mission_name?: string
          mission_type?: string
          parameters?: Json | null
          priority?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          target_location?: Json | null
          target_location_name?: string | null
          target_profile_id?: string | null
          target_radius_meters?: number | null
          threat_level?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_missions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_missions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_missions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string
          error_details: Json | null
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number | null
          payload: Json
          priority: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number | null
          payload?: Json
          priority?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number | null
          payload?: Json
          priority?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intelligence_session_tasks: {
        Row: {
          analysis_type: string | null
          attempts: number | null
          category: string
          completed_at: string | null
          created_at: string | null
          edge_function: string
          error_details: Json | null
          error_message: string | null
          id: string
          max_attempts: number | null
          priority: number | null
          processing_time_ms: number | null
          result: Json | null
          session_id: string
          started_at: string | null
          status: string
          task_name: string
        }
        Insert: {
          analysis_type?: string | null
          attempts?: number | null
          category: string
          completed_at?: string | null
          created_at?: string | null
          edge_function: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          processing_time_ms?: number | null
          result?: Json | null
          session_id: string
          started_at?: string | null
          status?: string
          task_name: string
        }
        Update: {
          analysis_type?: string | null
          attempts?: number | null
          category?: string
          completed_at?: string | null
          created_at?: string | null
          edge_function?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          priority?: number | null
          processing_time_ms?: number | null
          result?: Json | null
          session_id?: string
          started_at?: string | null
          status?: string
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_session_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_sessions: {
        Row: {
          completed_at: string | null
          completed_tasks: number | null
          created_at: string | null
          current_category: string | null
          error_message: string | null
          failed_tasks: number | null
          force_refresh: boolean | null
          id: string
          metadata: Json | null
          paused_at: string | null
          profile_id: string
          resumed_at: string | null
          skipped_tasks: number | null
          started_at: string | null
          status: string
          total_tasks: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          current_category?: string | null
          error_message?: string | null
          failed_tasks?: number | null
          force_refresh?: boolean | null
          id?: string
          metadata?: Json | null
          paused_at?: string | null
          profile_id: string
          resumed_at?: string | null
          skipped_tasks?: number | null
          started_at?: string | null
          status?: string
          total_tasks?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_tasks?: number | null
          created_at?: string | null
          current_category?: string | null
          error_message?: string | null
          failed_tasks?: number | null
          force_refresh?: boolean | null
          id?: string
          metadata?: Json | null
          paused_at?: string | null
          profile_id?: string
          resumed_at?: string | null
          skipped_tasks?: number | null
          started_at?: string | null
          status?: string
          total_tasks?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      intelligence_snapshots: {
        Row: {
          betrayal_scores: Json | null
          created_at: string
          gottman_scores: Json | null
          id: string
          metadata: Json | null
          mice_scores: Json | null
          overall_vulnerability: number | null
          profile_id: string | null
          sacred_values: Json | null
          snapshot_date: string
          trust_score: number | null
          user_id: string
        }
        Insert: {
          betrayal_scores?: Json | null
          created_at?: string
          gottman_scores?: Json | null
          id?: string
          metadata?: Json | null
          mice_scores?: Json | null
          overall_vulnerability?: number | null
          profile_id?: string | null
          sacred_values?: Json | null
          snapshot_date?: string
          trust_score?: number | null
          user_id: string
        }
        Update: {
          betrayal_scores?: Json | null
          created_at?: string
          gottman_scores?: Json | null
          id?: string
          metadata?: Json | null
          mice_scores?: Json | null
          overall_vulnerability?: number | null
          profile_id?: string | null
          sacred_values?: Json | null
          snapshot_date?: string
          trust_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intelligence_snapshots_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mice_assessments: {
        Row: {
          approach_scripts: Json | null
          compromise_leverage_score: number | null
          compromise_material: Json | null
          created_at: string | null
          ego_needs: string[] | null
          ego_vulnerabilities: Json | null
          id: string
          ideology_alignment: Json | null
          ideology_conflicts: string[] | null
          money_indicators: Json | null
          money_vulnerability: number | null
          optimal_approach: string | null
          profile_id: string | null
          recruitment_likelihood: number | null
          risk_assessment: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approach_scripts?: Json | null
          compromise_leverage_score?: number | null
          compromise_material?: Json | null
          created_at?: string | null
          ego_needs?: string[] | null
          ego_vulnerabilities?: Json | null
          id?: string
          ideology_alignment?: Json | null
          ideology_conflicts?: string[] | null
          money_indicators?: Json | null
          money_vulnerability?: number | null
          optimal_approach?: string | null
          profile_id?: string | null
          recruitment_likelihood?: number | null
          risk_assessment?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approach_scripts?: Json | null
          compromise_leverage_score?: number | null
          compromise_material?: Json | null
          created_at?: string | null
          ego_needs?: string[] | null
          ego_vulnerabilities?: Json | null
          id?: string
          ideology_alignment?: Json | null
          ideology_conflicts?: string[] | null
          money_indicators?: Json | null
          money_vulnerability?: number | null
          optimal_approach?: string | null
          profile_id?: string | null
          recruitment_likelihood?: number | null
          risk_assessment?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mice_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mice_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mice_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_actions: {
        Row: {
          action_params: Json | null
          action_taken: string
          action_type: string
          actual_outcome: Json | null
          created_at: string | null
          executed_at: string | null
          expected_outcome: Json | null
          id: string
          outcome_match_score: number | null
          outcome_recorded_at: string | null
          prediction_confidence: number | null
          preemption_success: boolean | null
          profile_id: string | null
          timing_rationale: string | null
          trigger_prediction: string
          user_id: string
        }
        Insert: {
          action_params?: Json | null
          action_taken: string
          action_type: string
          actual_outcome?: Json | null
          created_at?: string | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          outcome_match_score?: number | null
          outcome_recorded_at?: string | null
          prediction_confidence?: number | null
          preemption_success?: boolean | null
          profile_id?: string | null
          timing_rationale?: string | null
          trigger_prediction: string
          user_id: string
        }
        Update: {
          action_params?: Json | null
          action_taken?: string
          action_type?: string
          actual_outcome?: Json | null
          created_at?: string | null
          executed_at?: string | null
          expected_outcome?: Json | null
          id?: string
          outcome_match_score?: number | null
          outcome_recorded_at?: string | null
          prediction_confidence?: number | null
          preemption_success?: boolean | null
          profile_id?: string | null
          timing_rationale?: string | null
          trigger_prediction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proactive_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proactive_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proactive_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proactive_insights: {
        Row: {
          action_data: Json | null
          action_type: string | null
          category: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          generated_at: string
          id: string
          insight_type: string
          priority: string | null
          profile_id: string | null
          snoozed_until: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type: string
          priority?: string | null
          profile_id?: string | null
          snoozed_until?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type?: string
          priority?: string | null
          profile_id?: string | null
          snoozed_until?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proactive_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proactive_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proactive_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_profile_access_logs: {
        Row: {
          accessed_at: string
          accessed_fields: string[] | null
          action: string
          id: string
          ip_address: string | null
          profile_id: string
          target_profile_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          accessed_fields?: string[] | null
          action: string
          id?: string
          ip_address?: string | null
          profile_id: string
          target_profile_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          accessed_fields?: string[] | null
          action?: string
          id?: string
          ip_address?: string | null
          profile_id?: string
          target_profile_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_profile_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_profile_history: {
        Row: {
          changes_detected: Json | null
          changes_summary: string | null
          created_at: string
          id: string
          psychological_profile_id: string
          snapshot: Json
          trigger_event: string | null
          user_id: string
        }
        Insert: {
          changes_detected?: Json | null
          changes_summary?: string | null
          created_at?: string
          id?: string
          psychological_profile_id: string
          snapshot: Json
          trigger_event?: string | null
          user_id: string
        }
        Update: {
          changes_detected?: Json | null
          changes_summary?: string | null
          created_at?: string
          id?: string
          psychological_profile_id?: string
          snapshot?: Json
          trigger_event?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_profile_history_psychological_profile_id_fkey"
            columns: ["psychological_profile_id"]
            isOneToOne: false
            referencedRelation: "psychological_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_profiles: {
        Row: {
          action_plans: Json | null
          analysis_model: string | null
          analysis_version: string | null
          attachment_style: Json | null
          behavioral_predictions: Json | null
          behavioral_predictions_encrypted: string | null
          cognitive_profile: Json | null
          communication_dna: Json | null
          confidence_score: number | null
          created_at: string
          dark_triad: Json | null
          dark_triad_encrypted: string | null
          data_classification: string | null
          data_completeness: number | null
          data_sources_used: Json | null
          deception_analysis: Json | null
          deception_analysis_encrypted: string | null
          emotional_intelligence: Json | null
          encryption_key_id: string | null
          flags: Json | null
          hexaco_honesty_humility: Json | null
          id: string
          last_analysis_at: string | null
          personality_ocean: Json | null
          profile_id: string
          psychiatric_indicators: Json | null
          psychiatric_indicators_encrypted: string | null
          relationship_dynamics: Json | null
          updated_at: string
          user_id: string
          values_profile: Json | null
        }
        Insert: {
          action_plans?: Json | null
          analysis_model?: string | null
          analysis_version?: string | null
          attachment_style?: Json | null
          behavioral_predictions?: Json | null
          behavioral_predictions_encrypted?: string | null
          cognitive_profile?: Json | null
          communication_dna?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad?: Json | null
          dark_triad_encrypted?: string | null
          data_classification?: string | null
          data_completeness?: number | null
          data_sources_used?: Json | null
          deception_analysis?: Json | null
          deception_analysis_encrypted?: string | null
          emotional_intelligence?: Json | null
          encryption_key_id?: string | null
          flags?: Json | null
          hexaco_honesty_humility?: Json | null
          id?: string
          last_analysis_at?: string | null
          personality_ocean?: Json | null
          profile_id: string
          psychiatric_indicators?: Json | null
          psychiatric_indicators_encrypted?: string | null
          relationship_dynamics?: Json | null
          updated_at?: string
          user_id: string
          values_profile?: Json | null
        }
        Update: {
          action_plans?: Json | null
          analysis_model?: string | null
          analysis_version?: string | null
          attachment_style?: Json | null
          behavioral_predictions?: Json | null
          behavioral_predictions_encrypted?: string | null
          cognitive_profile?: Json | null
          communication_dna?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad?: Json | null
          dark_triad_encrypted?: string | null
          data_classification?: string | null
          data_completeness?: number | null
          data_sources_used?: Json | null
          deception_analysis?: Json | null
          deception_analysis_encrypted?: string | null
          emotional_intelligence?: Json | null
          encryption_key_id?: string | null
          flags?: Json | null
          hexaco_honesty_humility?: Json | null
          id?: string
          last_analysis_at?: string | null
          personality_ocean?: Json | null
          profile_id?: string
          psychiatric_indicators?: Json | null
          psychiatric_indicators_encrypted?: string | null
          relationship_dynamics?: Json | null
          updated_at?: string
          user_id?: string
          values_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "psychological_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "psychological_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "psychological_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_assessments: {
        Row: {
          assessment_type: string
          cognitive_biases: Json | null
          confidence_score: number | null
          created_at: string
          dark_triad_scores: Json | null
          exploitation_playbook: Json | null
          id: string
          influence_resistance: Json | null
          influence_susceptibility: Json | null
          profile_id: string
          risk_level: string | null
          source_data: Json | null
          updated_at: string
          user_id: string
          vulnerability_profile: Json | null
        }
        Insert: {
          assessment_type?: string
          cognitive_biases?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad_scores?: Json | null
          exploitation_playbook?: Json | null
          id?: string
          influence_resistance?: Json | null
          influence_susceptibility?: Json | null
          profile_id: string
          risk_level?: string | null
          source_data?: Json | null
          updated_at?: string
          user_id: string
          vulnerability_profile?: Json | null
        }
        Update: {
          assessment_type?: string
          cognitive_biases?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad_scores?: Json | null
          exploitation_playbook?: Json | null
          id?: string
          influence_resistance?: Json | null
          influence_susceptibility?: Json | null
          profile_id?: string
          risk_level?: string | null
          source_data?: Json | null
          updated_at?: string
          user_id?: string
          vulnerability_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "psychology_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "psychology_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "psychology_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sacred_values: {
        Row: {
          created_at: string | null
          defensive_reactions: Json | null
          emotional_intensity: number | null
          exploitation_vectors: Json | null
          id: string
          identity_centrality: number | null
          profile_id: string | null
          protection_level: number | null
          tribal_associations: string[] | null
          updated_at: string | null
          user_id: string
          value_domain: string
          value_name: string
          violation_triggers: string[] | null
        }
        Insert: {
          created_at?: string | null
          defensive_reactions?: Json | null
          emotional_intensity?: number | null
          exploitation_vectors?: Json | null
          id?: string
          identity_centrality?: number | null
          profile_id?: string | null
          protection_level?: number | null
          tribal_associations?: string[] | null
          updated_at?: string | null
          user_id: string
          value_domain: string
          value_name: string
          violation_triggers?: string[] | null
        }
        Update: {
          created_at?: string | null
          defensive_reactions?: Json | null
          emotional_intensity?: number | null
          exploitation_vectors?: Json | null
          id?: string
          identity_centrality?: number | null
          profile_id?: string | null
          protection_level?: number | null
          tribal_associations?: string[] | null
          updated_at?: string | null
          user_id?: string
          value_domain?: string
          value_name?: string
          violation_triggers?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sacred_values_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sacred_values_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sacred_values_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_assessments: {
        Row: {
          ai_assessment: string | null
          authenticity_score: number | null
          confidence_level: number | null
          consistency_score: number | null
          created_at: string
          data_sources_analyzed: Json | null
          deception_indicators: Json | null
          evidence_summary: string | null
          id: string
          inconsistencies: Json | null
          last_assessment_at: string
          overall_trust_score: number | null
          profile_id: string
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          ai_assessment?: string | null
          authenticity_score?: number | null
          confidence_level?: number | null
          consistency_score?: number | null
          created_at?: string
          data_sources_analyzed?: Json | null
          deception_indicators?: Json | null
          evidence_summary?: string | null
          id?: string
          inconsistencies?: Json | null
          last_assessment_at?: string
          overall_trust_score?: number | null
          profile_id: string
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          ai_assessment?: string | null
          authenticity_score?: number | null
          confidence_level?: number | null
          consistency_score?: number | null
          created_at?: string
          data_sources_analyzed?: Json | null
          deception_indicators?: Json | null
          evidence_summary?: string | null
          id?: string
          inconsistencies?: Json | null
          last_assessment_at?: string
          overall_trust_score?: number | null
          profile_id?: string
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_assessments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_trajectories: {
        Row: {
          created_at: string
          defection_probability: number | null
          gottman_horsemen_scores: Json | null
          id: string
          loyalty_binding_events: Json | null
          loyalty_binding_strength: number | null
          negative_interactions: number | null
          positive_interactions: number | null
          profile_id: string | null
          relationship_stress_score: number | null
          trajectory_date: string
          trust_decay_events: Json | null
          trust_score: number | null
          user_id: string
          warning_signals_active: number | null
        }
        Insert: {
          created_at?: string
          defection_probability?: number | null
          gottman_horsemen_scores?: Json | null
          id?: string
          loyalty_binding_events?: Json | null
          loyalty_binding_strength?: number | null
          negative_interactions?: number | null
          positive_interactions?: number | null
          profile_id?: string | null
          relationship_stress_score?: number | null
          trajectory_date: string
          trust_decay_events?: Json | null
          trust_score?: number | null
          user_id: string
          warning_signals_active?: number | null
        }
        Update: {
          created_at?: string
          defection_probability?: number | null
          gottman_horsemen_scores?: Json | null
          id?: string
          loyalty_binding_events?: Json | null
          loyalty_binding_strength?: number | null
          negative_interactions?: number | null
          positive_interactions?: number | null
          profile_id?: string | null
          relationship_stress_score?: number | null
          trajectory_date?: string
          trust_decay_events?: Json | null
          trust_score?: number | null
          user_id?: string
          warning_signals_active?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trust_trajectories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_trajectories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trust_trajectories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
}
