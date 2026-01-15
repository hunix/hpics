export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_assignments: {
        Row: {
          assigned_at: string
          assigned_variant: string
          converted: boolean | null
          converted_at: string | null
          id: string
          profile_id: string | null
          test_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_variant: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          profile_id?: string | null
          test_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_variant?: string
          converted?: boolean | null
          converted_at?: string | null
          id?: string
          profile_id?: string | null
          test_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_tests: {
        Row: {
          control_version_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          prompt_key: string
          start_date: string | null
          statistical_significance: number | null
          test_status: string
          traffic_split: Json
          updated_at: string
          user_id: string
          variant_version_id: string | null
          winner_version_id: string | null
        }
        Insert: {
          control_version_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          prompt_key: string
          start_date?: string | null
          statistical_significance?: number | null
          test_status?: string
          traffic_split?: Json
          updated_at?: string
          user_id: string
          variant_version_id?: string | null
          winner_version_id?: string | null
        }
        Update: {
          control_version_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          prompt_key?: string
          start_date?: string | null
          statistical_significance?: number | null
          test_status?: string
          traffic_split?: Json
          updated_at?: string
          user_id?: string
          variant_version_id?: string | null
          winner_version_id?: string | null
        }
        Relationships: []
      }
      absolute_mastery: {
        Row: {
          challenges_overcome: Json | null
          competency_level: number | null
          control_percentage: number | null
          created_at: string
          id: string
          knowledge_graph: Json | null
          leverage_points: Json | null
          mastery_domain: string
          next_milestones: Json | null
          skill_matrix: Json | null
          updated_at: string
          user_id: string
          vulnerability_map: Json | null
        }
        Insert: {
          challenges_overcome?: Json | null
          competency_level?: number | null
          control_percentage?: number | null
          created_at?: string
          id?: string
          knowledge_graph?: Json | null
          leverage_points?: Json | null
          mastery_domain: string
          next_milestones?: Json | null
          skill_matrix?: Json | null
          updated_at?: string
          user_id: string
          vulnerability_map?: Json | null
        }
        Update: {
          challenges_overcome?: Json | null
          competency_level?: number | null
          control_percentage?: number | null
          created_at?: string
          id?: string
          knowledge_graph?: Json | null
          leverage_points?: Json | null
          mastery_domain?: string
          next_milestones?: Json | null
          skill_matrix?: Json | null
          updated_at?: string
          user_id?: string
          vulnerability_map?: Json | null
        }
        Relationships: []
      }
      absolute_objectives: {
        Row: {
          blockers: Json | null
          created_at: string
          current_progress: number | null
          dependencies: Json | null
          estimated_completion: string | null
          id: string
          objective_name: string
          objective_type: string
          priority_score: number | null
          resources_required: Json | null
          status: string | null
          sub_objectives: Json | null
          target_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          blockers?: Json | null
          created_at?: string
          current_progress?: number | null
          dependencies?: Json | null
          estimated_completion?: string | null
          id?: string
          objective_name: string
          objective_type: string
          priority_score?: number | null
          resources_required?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          target_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          blockers?: Json | null
          created_at?: string
          current_progress?: number | null
          dependencies?: Json | null
          estimated_completion?: string | null
          id?: string
          objective_name?: string
          objective_type?: string
          priority_score?: number | null
          resources_required?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          target_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      absolute_supremacy: {
        Row: {
          control_vectors: Json | null
          created_at: string
          dominance_score: number | null
          evolution_trajectory: Json | null
          id: string
          influence_matrix: Json | null
          power_topology: Json | null
          resistance_mapping: Json | null
          supremacy_domain: string
          sustainability_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          control_vectors?: Json | null
          created_at?: string
          dominance_score?: number | null
          evolution_trajectory?: Json | null
          id?: string
          influence_matrix?: Json | null
          power_topology?: Json | null
          resistance_mapping?: Json | null
          supremacy_domain: string
          sustainability_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          control_vectors?: Json | null
          created_at?: string
          dominance_score?: number | null
          evolution_trajectory?: Json | null
          id?: string
          influence_matrix?: Json | null
          power_topology?: Json | null
          resistance_mapping?: Json | null
          supremacy_domain?: string
          sustainability_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      addiction_protocols: {
        Row: {
          addiction_type: string
          compliance_metrics: Json | null
          created_at: string
          current_phase: string | null
          dependency_progression: Json | null
          dopamine_cycle_mapping: Json | null
          effectiveness_score: number | null
          id: string
          intermittent_reinforcement_score: number | null
          last_reinforcement_at: string | null
          next_scheduled_at: string | null
          profile_id: string | null
          protocol_name: string
          reinforcement_schedule: Json
          updated_at: string
          user_id: string
          variable_ratio_config: Json | null
          withdrawal_timing: Json | null
        }
        Insert: {
          addiction_type: string
          compliance_metrics?: Json | null
          created_at?: string
          current_phase?: string | null
          dependency_progression?: Json | null
          dopamine_cycle_mapping?: Json | null
          effectiveness_score?: number | null
          id?: string
          intermittent_reinforcement_score?: number | null
          last_reinforcement_at?: string | null
          next_scheduled_at?: string | null
          profile_id?: string | null
          protocol_name: string
          reinforcement_schedule?: Json
          updated_at?: string
          user_id: string
          variable_ratio_config?: Json | null
          withdrawal_timing?: Json | null
        }
        Update: {
          addiction_type?: string
          compliance_metrics?: Json | null
          created_at?: string
          current_phase?: string | null
          dependency_progression?: Json | null
          dopamine_cycle_mapping?: Json | null
          effectiveness_score?: number | null
          id?: string
          intermittent_reinforcement_score?: number | null
          last_reinforcement_at?: string | null
          next_scheduled_at?: string | null
          profile_id?: string | null
          protocol_name?: string
          reinforcement_schedule?: Json
          updated_at?: string
          user_id?: string
          variable_ratio_config?: Json | null
          withdrawal_timing?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "addiction_protocols_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      aerial_captures: {
        Row: {
          aerial_mission_id: string
          altitude_meters: number | null
          analysis: Json | null
          capture_type: string
          captured_at: string | null
          detected_objects: Json | null
          gimbal_pitch_degrees: number | null
          heading_degrees: number | null
          id: string
          location: Json | null
          media_url: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          aerial_mission_id: string
          altitude_meters?: number | null
          analysis?: Json | null
          capture_type: string
          captured_at?: string | null
          detected_objects?: Json | null
          gimbal_pitch_degrees?: number | null
          heading_degrees?: number | null
          id?: string
          location?: Json | null
          media_url?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          aerial_mission_id?: string
          altitude_meters?: number | null
          analysis?: Json | null
          capture_type?: string
          captured_at?: string | null
          detected_objects?: Json | null
          gimbal_pitch_degrees?: number | null
          heading_degrees?: number | null
          id?: string
          location?: Json | null
          media_url?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aerial_captures_aerial_mission_id_fkey"
            columns: ["aerial_mission_id"]
            isOneToOne: false
            referencedRelation: "aerial_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      aerial_missions: {
        Row: {
          altitude_meters: number | null
          camera_settings: Json | null
          completed_at: string | null
          created_at: string | null
          drone_device_id: string | null
          flight_duration_seconds: number | null
          flight_mode: string | null
          flight_path: Json | null
          id: string
          mission_id: string | null
          speed_mps: number | null
          started_at: string | null
          status: string | null
          telemetry_log: Json | null
          total_distance_meters: number | null
          user_id: string
          waypoints: Json
          weather_conditions: Json | null
        }
        Insert: {
          altitude_meters?: number | null
          camera_settings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          drone_device_id?: string | null
          flight_duration_seconds?: number | null
          flight_mode?: string | null
          flight_path?: Json | null
          id?: string
          mission_id?: string | null
          speed_mps?: number | null
          started_at?: string | null
          status?: string | null
          telemetry_log?: Json | null
          total_distance_meters?: number | null
          user_id: string
          waypoints?: Json
          weather_conditions?: Json | null
        }
        Update: {
          altitude_meters?: number | null
          camera_settings?: Json | null
          completed_at?: string | null
          created_at?: string | null
          drone_device_id?: string | null
          flight_duration_seconds?: number | null
          flight_mode?: string | null
          flight_path?: Json | null
          id?: string
          mission_id?: string | null
          speed_mps?: number | null
          started_at?: string | null
          status?: string | null
          telemetry_log?: Json | null
          total_distance_meters?: number | null
          user_id?: string
          waypoints?: Json
          weather_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "aerial_missions_drone_device_id_fkey"
            columns: ["drone_device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aerial_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          action_params: Json | null
          action_taken: string
          agent_type: string
          campaign_id: string | null
          context_snapshot: Json | null
          cost_cents: number | null
          effectiveness_score: number | null
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          outcome: string | null
          outcome_details: Json | null
          trigger_reason: string | null
          user_id: string
        }
        Insert: {
          action_params?: Json | null
          action_taken: string
          agent_type: string
          campaign_id?: string | null
          context_snapshot?: Json | null
          cost_cents?: number | null
          effectiveness_score?: number | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          trigger_reason?: string | null
          user_id: string
        }
        Update: {
          action_params?: Json | null
          action_taken?: string
          agent_type?: string
          campaign_id?: string | null
          context_snapshot?: Json | null
          cost_cents?: number | null
          effectiveness_score?: number | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          trigger_reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "autonomous_campaigns"
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
      ai_budget_history: {
        Row: {
          budget_type: string
          change_reason: string | null
          changed_at: string
          id: string
          new_value_cents: number | null
          old_value_cents: number | null
          user_id: string
        }
        Insert: {
          budget_type: string
          change_reason?: string | null
          changed_at?: string
          id?: string
          new_value_cents?: number | null
          old_value_cents?: number | null
          user_id: string
        }
        Update: {
          budget_type?: string
          change_reason?: string | null
          changed_at?: string
          id?: string
          new_value_cents?: number | null
          old_value_cents?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ai_cost_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          notification_channels: string[] | null
          threshold_percent: number
          trigger_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          notification_channels?: string[] | null
          threshold_percent?: number
          trigger_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          notification_channels?: string[] | null
          threshold_percent?: number
          trigger_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_group_suggestions: {
        Row: {
          confidence_score: number | null
          created_at: string
          description: string | null
          group_name: string
          id: string
          reasoning: string | null
          status: string | null
          suggested_members: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          group_name: string
          id?: string
          reasoning?: string | null
          status?: string | null
          suggested_members?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          reasoning?: string | null
          status?: string | null
          suggested_members?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_guided_interviews: {
        Row: {
          completed_at: string | null
          completeness_score: number | null
          confidence_score: number | null
          conversation_history: Json
          created_at: string | null
          current_question: string | null
          data_applied: boolean | null
          extracted_data: Json | null
          id: string
          interview_type: string
          profile_id: string
          questions_asked: number | null
          questions_remaining: number | null
          started_at: string | null
          status: string | null
          topic_focus: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completeness_score?: number | null
          confidence_score?: number | null
          conversation_history?: Json
          created_at?: string | null
          current_question?: string | null
          data_applied?: boolean | null
          extracted_data?: Json | null
          id?: string
          interview_type: string
          profile_id: string
          questions_asked?: number | null
          questions_remaining?: number | null
          started_at?: string | null
          status?: string | null
          topic_focus?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completeness_score?: number | null
          confidence_score?: number | null
          conversation_history?: Json
          created_at?: string | null
          current_question?: string | null
          data_applied?: boolean | null
          extracted_data?: Json | null
          id?: string
          interview_type?: string
          profile_id?: string
          questions_asked?: number | null
          questions_remaining?: number | null
          started_at?: string | null
          status?: string | null
          topic_focus?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_guided_interviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_guided_interviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "ai_guided_interviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_preferences: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          model_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          model_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          model_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_request_cache: {
        Row: {
          cache_key: string
          cost_saved_cents: number | null
          created_at: string | null
          expires_at: string
          hit_count: number | null
          id: string
          last_hit_at: string | null
          model_name: string
          prompt_hash: string
          response_content: string
          response_metadata: Json | null
          tokens_saved: number | null
          user_id: string
        }
        Insert: {
          cache_key: string
          cost_saved_cents?: number | null
          created_at?: string | null
          expires_at: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          model_name: string
          prompt_hash: string
          response_content: string
          response_metadata?: Json | null
          tokens_saved?: number | null
          user_id: string
        }
        Update: {
          cache_key?: string
          cost_saved_cents?: number | null
          created_at?: string | null
          expires_at?: string
          hit_count?: number | null
          id?: string
          last_hit_at?: string | null
          model_name?: string
          prompt_hash?: string
          response_content?: string
          response_metadata?: Json | null
          tokens_saved?: number | null
          user_id?: string
        }
        Relationships: []
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
      alert_notifications: {
        Row: {
          alert_id: string | null
          channel: string
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          channel?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "hardware_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          actions: Json
          conditions: Json
          cooldown_minutes: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          priority: number | null
          rule_name: string
          rule_type: string
          trigger_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          rule_name: string
          rule_type?: string
          trigger_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          cooldown_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          rule_name?: string
          rule_type?: string
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      analysis_jobs: {
        Row: {
          actual_cost_cents: number | null
          analysis_type: string
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          estimated_cost_cents: number | null
          id: string
          input_tokens: number | null
          model_key: string
          output_tokens: number | null
          progress: number | null
          result_id: string | null
          session_id: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          analysis_type: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_key: string
          output_tokens?: number | null
          progress?: number | null
          result_id?: string | null
          session_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          analysis_type?: string
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          id?: string
          input_tokens?: number | null
          model_key?: string
          output_tokens?: number | null
          progress?: number | null
          result_id?: string | null
          session_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
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
      analysis_snapshots: {
        Row: {
          aggregate_id: string | null
          aggregate_type: string
          created_at: string
          event_count_at_snapshot: number | null
          events_since_last_snapshot: number | null
          id: string
          profile_id: string
          rebuild_duration_ms: number | null
          snapshot_data: Json
          snapshot_sequence: number
          snapshot_type: string | null
          user_id: string
        }
        Insert: {
          aggregate_id?: string | null
          aggregate_type: string
          created_at?: string
          event_count_at_snapshot?: number | null
          events_since_last_snapshot?: number | null
          id?: string
          profile_id: string
          rebuild_duration_ms?: number | null
          snapshot_data: Json
          snapshot_sequence: number
          snapshot_type?: string | null
          user_id: string
        }
        Update: {
          aggregate_id?: string | null
          aggregate_type?: string
          created_at?: string
          event_count_at_snapshot?: number | null
          events_since_last_snapshot?: number | null
          id?: string
          profile_id?: string
          rebuild_duration_ms?: number | null
          snapshot_data?: Json
          snapshot_sequence?: number
          snapshot_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_snapshots_aggregate_id_fkey"
            columns: ["aggregate_id"]
            isOneToOne: false
            referencedRelation: "analysis_aggregates"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_type_config: {
        Row: {
          analysis_type: string
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_forecast: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          forecast_type: string
          id: string
          model_version: string | null
          period: string
          predictions: Json
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_type: string
          id?: string
          model_version?: string | null
          period?: string
          predictions?: Json
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_type?: string
          id?: string
          model_version?: string | null
          period?: string
          predictions?: Json
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          setting_key: string
          setting_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      attachment_profiles: {
        Row: {
          abandonment_sensitivity: number | null
          attachment_style: string | null
          created_at: string | null
          ego_threat_sensitivity: number | null
          exploitation_playbook: Json | null
          id: string
          intermittent_reinforcement_susceptibility: number | null
          narcissistic_supply_need: number | null
          profile_id: string | null
          rejection_sensitivity: number | null
          trigger_phrases: string[] | null
          updated_at: string | null
          user_id: string
          vulnerability_windows: Json | null
        }
        Insert: {
          abandonment_sensitivity?: number | null
          attachment_style?: string | null
          created_at?: string | null
          ego_threat_sensitivity?: number | null
          exploitation_playbook?: Json | null
          id?: string
          intermittent_reinforcement_susceptibility?: number | null
          narcissistic_supply_need?: number | null
          profile_id?: string | null
          rejection_sensitivity?: number | null
          trigger_phrases?: string[] | null
          updated_at?: string | null
          user_id: string
          vulnerability_windows?: Json | null
        }
        Update: {
          abandonment_sensitivity?: number | null
          attachment_style?: string | null
          created_at?: string | null
          ego_threat_sensitivity?: number | null
          exploitation_playbook?: Json | null
          id?: string
          intermittent_reinforcement_susceptibility?: number | null
          narcissistic_supply_need?: number | null
          profile_id?: string | null
          rejection_sensitivity?: number | null
          trigger_phrases?: string[] | null
          updated_at?: string | null
          user_id?: string
          vulnerability_windows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "attachment_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "attachment_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "attachment_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_chain_verifications: {
        Row: {
          broken_entry_id: string | null
          completed_at: string | null
          created_at: string | null
          end_date: string | null
          first_broken_at: string | null
          id: string
          invalid_entries: number | null
          metadata: Json | null
          start_date: string | null
          status: string
          total_entries_checked: number | null
          user_id: string
          valid_entries: number | null
          verification_hash: string | null
          verification_type: string
        }
        Insert: {
          broken_entry_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_date?: string | null
          first_broken_at?: string | null
          id?: string
          invalid_entries?: number | null
          metadata?: Json | null
          start_date?: string | null
          status: string
          total_entries_checked?: number | null
          user_id: string
          valid_entries?: number | null
          verification_hash?: string | null
          verification_type: string
        }
        Update: {
          broken_entry_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          end_date?: string | null
          first_broken_at?: string | null
          id?: string
          invalid_entries?: number | null
          metadata?: Json | null
          start_date?: string | null
          status?: string
          total_entries_checked?: number | null
          user_id?: string
          valid_entries?: number | null
          verification_hash?: string | null
          verification_type?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          action_config: Json
          action_type: string
          conditions: Json | null
          cooldown_minutes: number | null
          created_at: string | null
          description: string | null
          execution_count: number | null
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_error: string | null
          last_success_at: string | null
          last_triggered_at: string | null
          max_daily_executions: number | null
          name: string
          priority: number | null
          success_count: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_config: Json
          action_type: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_daily_executions?: number | null
          name: string
          priority?: number | null
          success_count?: number | null
          trigger_config: Json
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          conditions?: Json | null
          cooldown_minutes?: number | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_error?: string | null
          last_success_at?: string | null
          last_triggered_at?: string | null
          max_daily_executions?: number | null
          name?: string
          priority?: number | null
          success_count?: number | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      autonomous_campaigns: {
        Row: {
          actions_today: number | null
          auto_execute: boolean | null
          campaign_name: string
          campaign_type: string
          created_at: string | null
          current_phase: string | null
          escalation_config: Json | null
          execution_rules: Json | null
          id: string
          is_active: boolean | null
          last_action_at: string | null
          max_daily_actions: number | null
          next_action_at: string | null
          objective: string
          phase_progress: number | null
          profile_id: string | null
          success_criteria: Json | null
          success_rate: number | null
          total_actions: number | null
          trigger_conditions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actions_today?: number | null
          auto_execute?: boolean | null
          campaign_name: string
          campaign_type: string
          created_at?: string | null
          current_phase?: string | null
          escalation_config?: Json | null
          execution_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_action_at?: string | null
          max_daily_actions?: number | null
          next_action_at?: string | null
          objective: string
          phase_progress?: number | null
          profile_id?: string | null
          success_criteria?: Json | null
          success_rate?: number | null
          total_actions?: number | null
          trigger_conditions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actions_today?: number | null
          auto_execute?: boolean | null
          campaign_name?: string
          campaign_type?: string
          created_at?: string | null
          current_phase?: string | null
          escalation_config?: Json | null
          execution_rules?: Json | null
          id?: string
          is_active?: boolean | null
          last_action_at?: string | null
          max_daily_actions?: number | null
          next_action_at?: string | null
          objective?: string
          phase_progress?: number | null
          profile_id?: string | null
          success_criteria?: Json | null
          success_rate?: number | null
          total_actions?: number | null
          trigger_conditions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "autonomous_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          actual_cost_cents: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_cost_cents: number | null
          failed_items: number | null
          id: string
          job_type: string
          processed_items: number | null
          started_at: string | null
          status: string | null
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          job_type: string
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          job_type?: string
          processed_items?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      behavioral_anomalies: {
        Row: {
          actual_value: Json | null
          anomaly_type: string
          baseline_id: string | null
          created_at: string
          description: string | null
          detected_at: string
          deviation_score: number | null
          expected_value: Json | null
          id: string
          is_resolved: boolean | null
          profile_id: string
          resolution_notes: string | null
          severity: string
          user_id: string
        }
        Insert: {
          actual_value?: Json | null
          anomaly_type: string
          baseline_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          deviation_score?: number | null
          expected_value?: Json | null
          id?: string
          is_resolved?: boolean | null
          profile_id: string
          resolution_notes?: string | null
          severity: string
          user_id: string
        }
        Update: {
          actual_value?: Json | null
          anomaly_type?: string
          baseline_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          deviation_score?: number | null
          expected_value?: Json | null
          id?: string
          is_resolved?: boolean | null
          profile_id?: string
          resolution_notes?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_anomalies_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "behavioral_baselines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_anomalies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_baselines: {
        Row: {
          baseline_data: Json
          baseline_type: string
          calculation_period_days: number | null
          confidence_score: number | null
          created_at: string
          id: string
          last_calculated_at: string
          profile_id: string
          sample_size: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_data: Json
          baseline_type: string
          calculation_period_days?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_calculated_at?: string
          profile_id: string
          sample_size?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_data?: Json
          baseline_type?: string
          calculation_period_days?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_calculated_at?: string
          profile_id?: string
          sample_size?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_baselines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_baselines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_baselines_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_biometrics: {
        Row: {
          cognitive_load_indicators: Json | null
          created_at: string | null
          emotional_state_markers: Json | null
          exploitation_windows: Json | null
          fatigue_patterns: Json | null
          gait_signature: Json | null
          id: string
          keystroke_profile: Json | null
          mouse_dynamics: Json | null
          profile_id: string | null
          stress_indicators: Json | null
          touch_pressure_patterns: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cognitive_load_indicators?: Json | null
          created_at?: string | null
          emotional_state_markers?: Json | null
          exploitation_windows?: Json | null
          fatigue_patterns?: Json | null
          gait_signature?: Json | null
          id?: string
          keystroke_profile?: Json | null
          mouse_dynamics?: Json | null
          profile_id?: string | null
          stress_indicators?: Json | null
          touch_pressure_patterns?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cognitive_load_indicators?: Json | null
          created_at?: string | null
          emotional_state_markers?: Json | null
          exploitation_windows?: Json | null
          fatigue_patterns?: Json | null
          gait_signature?: Json | null
          id?: string
          keystroke_profile?: Json | null
          mouse_dynamics?: Json | null
          profile_id?: string | null
          stress_indicators?: Json | null
          touch_pressure_patterns?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: Json | null
          confidence_score: number | null
          created_at: string
          features_used: Json | null
          id: string
          model_version: string | null
          outcome_recorded_at: string | null
          prediction_type: string
          prediction_value: Json
          profile_id: string
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string
          features_used?: Json | null
          id?: string
          model_version?: string | null
          outcome_recorded_at?: string | null
          prediction_type: string
          prediction_value: Json
          profile_id: string
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number | null
          created_at?: string
          features_used?: Json | null
          id?: string
          model_version?: string | null
          outcome_recorded_at?: string | null
          prediction_type?: string
          prediction_value?: Json
          profile_id?: string
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      behavioral_scenario_predictions: {
        Row: {
          actual_response: Json | null
          alternative_responses: Json | null
          confidence_score: number
          context: Json | null
          created_at: string
          evidence_basis: Json | null
          id: string
          model_version: string | null
          predicted_response: Json
          prediction_accuracy: number | null
          profile_id: string
          response_probability: number | null
          scenario_category: string | null
          scenario_type: string
          stimulus: string
          user_id: string
          valid_until: string | null
          validated_at: string | null
        }
        Insert: {
          actual_response?: Json | null
          alternative_responses?: Json | null
          confidence_score: number
          context?: Json | null
          created_at?: string
          evidence_basis?: Json | null
          id?: string
          model_version?: string | null
          predicted_response: Json
          prediction_accuracy?: number | null
          profile_id: string
          response_probability?: number | null
          scenario_category?: string | null
          scenario_type: string
          stimulus: string
          user_id: string
          valid_until?: string | null
          validated_at?: string | null
        }
        Update: {
          actual_response?: Json | null
          alternative_responses?: Json | null
          confidence_score?: number
          context?: Json | null
          created_at?: string
          evidence_basis?: Json | null
          id?: string
          model_version?: string | null
          predicted_response?: Json
          prediction_accuracy?: number | null
          profile_id?: string
          response_probability?: number | null
          scenario_category?: string | null
          scenario_type?: string
          stimulus?: string
          user_id?: string
          valid_until?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "behavioral_scenario_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      belief_architectures: {
        Row: {
          belief_dependencies: Json | null
          core_beliefs: Json | null
          created_at: string
          id: string
          last_major_shift: string | null
          peripheral_beliefs: Json | null
          profile_id: string | null
          protection_mechanisms: Json | null
          stability_score: number | null
          supporting_beliefs: Json | null
          update_triggers: Json | null
          updated_at: string
          user_id: string
          vulnerability_map: Json | null
        }
        Insert: {
          belief_dependencies?: Json | null
          core_beliefs?: Json | null
          created_at?: string
          id?: string
          last_major_shift?: string | null
          peripheral_beliefs?: Json | null
          profile_id?: string | null
          protection_mechanisms?: Json | null
          stability_score?: number | null
          supporting_beliefs?: Json | null
          update_triggers?: Json | null
          updated_at?: string
          user_id: string
          vulnerability_map?: Json | null
        }
        Update: {
          belief_dependencies?: Json | null
          core_beliefs?: Json | null
          created_at?: string
          id?: string
          last_major_shift?: string | null
          peripheral_beliefs?: Json | null
          profile_id?: string | null
          protection_mechanisms?: Json | null
          stability_score?: number | null
          supporting_beliefs?: Json | null
          update_triggers?: Json | null
          updated_at?: string
          user_id?: string
          vulnerability_map?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "belief_architectures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "belief_architectures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "belief_architectures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      betrayal_predictions: {
        Row: {
          created_at: string | null
          defection_probability: number | null
          defection_timeline: string | null
          gottman_horsemen: Json | null
          id: string
          loyalty_indicators: Json | null
          predicted_triggers: string[] | null
          profile_id: string | null
          protective_factors: Json | null
          relationship_stress_score: number | null
          risk_mitigation: Json | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
          validated_at: string | null
          validation_outcome: string | null
          warning_signs: string[] | null
        }
        Insert: {
          created_at?: string | null
          defection_probability?: number | null
          defection_timeline?: string | null
          gottman_horsemen?: Json | null
          id?: string
          loyalty_indicators?: Json | null
          predicted_triggers?: string[] | null
          profile_id?: string | null
          protective_factors?: Json | null
          relationship_stress_score?: number | null
          risk_mitigation?: Json | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
          validated_at?: string | null
          validation_outcome?: string | null
          warning_signs?: string[] | null
        }
        Update: {
          created_at?: string | null
          defection_probability?: number | null
          defection_timeline?: string | null
          gottman_horsemen?: Json | null
          id?: string
          loyalty_indicators?: Json | null
          predicted_triggers?: string[] | null
          profile_id?: string | null
          protective_factors?: Json | null
          relationship_stress_score?: number | null
          risk_mitigation?: Json | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
          validated_at?: string | null
          validation_outcome?: string | null
          warning_signs?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "betrayal_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "betrayal_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "betrayal_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_enrollment_sessions: {
        Row: {
          aggregate_signature: Json | null
          ai_model: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          profile_id: string
          quality_scores: Json | null
          samples_required: number | null
          samples_uploaded: number | null
          session_type: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aggregate_signature?: Json | null
          ai_model?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          quality_scores?: Json | null
          samples_required?: number | null
          samples_uploaded?: number | null
          session_type: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aggregate_signature?: Json | null
          ai_model?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          quality_scores?: Json | null
          samples_required?: number | null
          samples_uploaded?: number | null
          session_type?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometric_enrollment_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_enrollment_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_enrollment_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_matches: {
        Row: {
          alternative_matches: Json | null
          auto_tagged: boolean | null
          confidence_score: number | null
          created_at: string | null
          id: string
          match_type: string
          matched_profile_id: string | null
          source_id: string | null
          source_type: string
          user_confirmed: boolean | null
          user_corrected_profile_id: string | null
          user_id: string
        }
        Insert: {
          alternative_matches?: Json | null
          auto_tagged?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          match_type: string
          matched_profile_id?: string | null
          source_id?: string | null
          source_type: string
          user_confirmed?: boolean | null
          user_corrected_profile_id?: string | null
          user_id: string
        }
        Update: {
          alternative_matches?: Json | null
          auto_tagged?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          match_type?: string
          matched_profile_id?: string | null
          source_id?: string | null
          source_type?: string
          user_confirmed?: boolean | null
          user_corrected_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometric_matches_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_matches_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_matches_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biometric_matches_user_corrected_profile_id_fkey"
            columns: ["user_corrected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_matches_user_corrected_profile_id_fkey"
            columns: ["user_corrected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_matches_user_corrected_profile_id_fkey"
            columns: ["user_corrected_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_samples: {
        Row: {
          biometric_type: string
          created_at: string | null
          embedding: string | null
          error_message: string | null
          features: Json | null
          id: string
          processed_at: string | null
          profile_id: string
          quality_score: number | null
          source_id: string | null
          source_type: string
          source_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          biometric_type: string
          created_at?: string | null
          embedding?: string | null
          error_message?: string | null
          features?: Json | null
          id?: string
          processed_at?: string | null
          profile_id: string
          quality_score?: number | null
          source_id?: string | null
          source_type: string
          source_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          biometric_type?: string
          created_at?: string | null
          embedding?: string | null
          error_message?: string | null
          features?: Json | null
          id?: string
          processed_at?: string | null
          profile_id?: string
          quality_score?: number | null
          source_id?: string | null
          source_type?: string
          source_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometric_samples_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_samples_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "biometric_samples_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_settings: {
        Row: {
          auto_tag_enabled: boolean
          auto_tag_face_threshold: number
          auto_tag_voice_threshold: number
          created_at: string
          face_match_threshold: number
          id: string
          notify_on_match: boolean
          notify_threshold: number
          updated_at: string
          user_id: string
          voice_match_threshold: number
        }
        Insert: {
          auto_tag_enabled?: boolean
          auto_tag_face_threshold?: number
          auto_tag_voice_threshold?: number
          created_at?: string
          face_match_threshold?: number
          id?: string
          notify_on_match?: boolean
          notify_threshold?: number
          updated_at?: string
          user_id: string
          voice_match_threshold?: number
        }
        Update: {
          auto_tag_enabled?: boolean
          auto_tag_face_threshold?: number
          auto_tag_voice_threshold?: number
          created_at?: string
          face_match_threshold?: number
          id?: string
          notify_on_match?: boolean
          notify_threshold?: number
          updated_at?: string
          user_id?: string
          voice_match_threshold?: number
        }
        Relationships: []
      }
      bluetooth_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_seen_at: string | null
          profile_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_seen_at?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_seen_at?: string | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bluetooth_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bluetooth_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bluetooth_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_language_analyses: {
        Row: {
          ai_model_used: string | null
          comfort_indicators: Json | null
          confidence_score: number | null
          created_at: string
          gesture_patterns: Json | null
          id: string
          movement_indicators: Json | null
          posture_analysis: Json | null
          profile_id: string
          rapport_signals: Json | null
          raw_analysis: Json | null
          source_recording_id: string | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_model_used?: string | null
          comfort_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          gesture_patterns?: Json | null
          id?: string
          movement_indicators?: Json | null
          posture_analysis?: Json | null
          profile_id: string
          rapport_signals?: Json | null
          raw_analysis?: Json | null
          source_recording_id?: string | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_model_used?: string | null
          comfort_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          gesture_patterns?: Json | null
          id?: string
          movement_indicators?: Json | null
          posture_analysis?: Json | null
          profile_id?: string
          rapport_signals?: Json | null
          raw_analysis?: Json | null
          source_recording_id?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_language_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "body_language_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "body_language_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "body_language_analyses_source_recording_id_fkey"
            columns: ["source_recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_intelligence: {
        Row: {
          color_palette: Json | null
          communication_style: string | null
          company_name: string | null
          created_at: string | null
          extracted_branding: Json | null
          id: string
          key_messages: string[] | null
          last_scraped_at: string | null
          logos: Json | null
          profile_id: string | null
          tone_of_voice: string | null
          typography: Json | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          color_palette?: Json | null
          communication_style?: string | null
          company_name?: string | null
          created_at?: string | null
          extracted_branding?: Json | null
          id?: string
          key_messages?: string[] | null
          last_scraped_at?: string | null
          logos?: Json | null
          profile_id?: string | null
          tone_of_voice?: string | null
          typography?: Json | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          color_palette?: Json | null
          communication_style?: string | null
          company_name?: string | null
          created_at?: string | null
          extracted_branding?: Json | null
          id?: string
          key_messages?: string[] | null
          last_scraped_at?: string | null
          logos?: Json | null
          profile_id?: string | null
          tone_of_voice?: string | null
          typography?: Json | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "brand_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "brand_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      breaking_point_predictions: {
        Row: {
          confidence_level: number | null
          contributing_factors: Json | null
          created_at: string
          current_resilience_score: number | null
          id: string
          optimal_pressure_timing: Json | null
          post_break_vulnerability_window: Json | null
          predicted_breaking_point: string | null
          pressure_vectors: Json | null
          profile_id: string | null
          resistance_degradation_trend: Json | null
          stress_accumulation_rate: number | null
          updated_at: string
          user_id: string
          vulnerability_aggregation: Json | null
          warning_indicators: string[] | null
        }
        Insert: {
          confidence_level?: number | null
          contributing_factors?: Json | null
          created_at?: string
          current_resilience_score?: number | null
          id?: string
          optimal_pressure_timing?: Json | null
          post_break_vulnerability_window?: Json | null
          predicted_breaking_point?: string | null
          pressure_vectors?: Json | null
          profile_id?: string | null
          resistance_degradation_trend?: Json | null
          stress_accumulation_rate?: number | null
          updated_at?: string
          user_id: string
          vulnerability_aggregation?: Json | null
          warning_indicators?: string[] | null
        }
        Update: {
          confidence_level?: number | null
          contributing_factors?: Json | null
          created_at?: string
          current_resilience_score?: number | null
          id?: string
          optimal_pressure_timing?: Json | null
          post_break_vulnerability_window?: Json | null
          predicted_breaking_point?: string | null
          pressure_vectors?: Json | null
          profile_id?: string | null
          resistance_degradation_trend?: Json | null
          stress_accumulation_rate?: number | null
          updated_at?: string
          user_id?: string
          vulnerability_aggregation?: Json | null
          warning_indicators?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "breaking_point_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "breaking_point_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "breaking_point_predictions_profile_id_fkey"
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
          user_id: string
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
      bulk_operation_queue: {
        Row: {
          completed_at: string | null
          completed_items: number | null
          created_at: string | null
          error_message: string | null
          failed_items: number | null
          id: string
          metadata: Json | null
          operation_type: string
          progress: number | null
          started_at: string | null
          status: string | null
          target_ids: string[]
          total_items: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error_message?: string | null
          failed_items?: number | null
          id?: string
          metadata?: Json | null
          operation_type: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          target_ids: string[]
          total_items: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_items?: number | null
          created_at?: string | null
          error_message?: string | null
          failed_items?: number | null
          id?: string
          metadata?: Json | null
          operation_type?: string
          progress?: number | null
          started_at?: string | null
          status?: string | null
          target_ids?: string[]
          total_items?: number
          user_id?: string
        }
        Relationships: []
      }
      bulk_upload_items: {
        Row: {
          analysis_job_id: string | null
          completed_at: string | null
          content_hash: string | null
          created_at: string
          document_id: string | null
          error_message: string | null
          file_size: number
          file_type: string | null
          filename: string
          id: string
          is_duplicate_of: string | null
          max_retries: number
          media_id: string | null
          mime_type: string | null
          original_path: string | null
          progress: number
          queued_for_analysis: boolean
          recording_id: string | null
          retry_count: number
          session_id: string
          sort_order: number
          started_at: string | null
          status: string
          storage_bucket: string | null
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_job_id?: string | null
          completed_at?: string | null
          content_hash?: string | null
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          file_size?: number
          file_type?: string | null
          filename: string
          id?: string
          is_duplicate_of?: string | null
          max_retries?: number
          media_id?: string | null
          mime_type?: string | null
          original_path?: string | null
          progress?: number
          queued_for_analysis?: boolean
          recording_id?: string | null
          retry_count?: number
          session_id: string
          sort_order?: number
          started_at?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_job_id?: string | null
          completed_at?: string | null
          content_hash?: string | null
          created_at?: string
          document_id?: string | null
          error_message?: string | null
          file_size?: number
          file_type?: string | null
          filename?: string
          id?: string
          is_duplicate_of?: string | null
          max_retries?: number
          media_id?: string | null
          mime_type?: string | null
          original_path?: string | null
          progress?: number
          queued_for_analysis?: boolean
          recording_id?: string | null
          retry_count?: number
          session_id?: string
          sort_order?: number
          started_at?: string | null
          status?: string
          storage_bucket?: string | null
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_upload_items_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_upload_items_is_duplicate_of_fkey"
            columns: ["is_duplicate_of"]
            isOneToOne: false
            referencedRelation: "bulk_upload_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_upload_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_upload_items_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_upload_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bulk_upload_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_upload_sessions: {
        Row: {
          analysis_priority: number | null
          auto_analyze: boolean
          completed_at: string | null
          completed_files: number
          created_at: string
          failed_files: number
          id: string
          last_activity_at: string | null
          name: string | null
          paused_at: string | null
          profile_id: string | null
          resumable_until: string | null
          skipped_files: number
          source_type: string
          started_at: string | null
          status: string
          total_bytes: number
          total_files: number
          updated_at: string
          uploaded_bytes: number
          user_id: string
        }
        Insert: {
          analysis_priority?: number | null
          auto_analyze?: boolean
          completed_at?: string | null
          completed_files?: number
          created_at?: string
          failed_files?: number
          id?: string
          last_activity_at?: string | null
          name?: string | null
          paused_at?: string | null
          profile_id?: string | null
          resumable_until?: string | null
          skipped_files?: number
          source_type?: string
          started_at?: string | null
          status?: string
          total_bytes?: number
          total_files?: number
          updated_at?: string
          uploaded_bytes?: number
          user_id: string
        }
        Update: {
          analysis_priority?: number | null
          auto_analyze?: boolean
          completed_at?: string | null
          completed_files?: number
          created_at?: string
          failed_files?: number
          id?: string
          last_activity_at?: string | null
          name?: string | null
          paused_at?: string | null
          profile_id?: string | null
          resumable_until?: string | null
          skipped_files?: number
          source_type?: string
          started_at?: string | null
          status?: string
          total_bytes?: number
          total_files?: number
          updated_at?: string
          uploaded_bytes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_upload_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bulk_upload_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bulk_upload_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_chains: {
        Row: {
          action_campaign_type: string
          action_config: Json
          chain_name: string
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          requires_approval: boolean | null
          trigger_campaign_id: string | null
          trigger_campaign_type: string
          trigger_condition: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          action_campaign_type: string
          action_config: Json
          chain_name: string
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          requires_approval?: boolean | null
          trigger_campaign_id?: string | null
          trigger_campaign_type: string
          trigger_condition: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          action_campaign_type?: string
          action_config?: Json
          chain_name?: string
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          requires_approval?: boolean | null
          trigger_campaign_id?: string | null
          trigger_campaign_type?: string
          trigger_condition?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      capture_upload_progress: {
        Row: {
          capture_type: string | null
          checksum: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          local_capture_id: string
          metadata: Json | null
          mime_type: string | null
          profile_id: string | null
          retry_count: number | null
          status: string | null
          storage_bucket: string | null
          storage_path: string | null
          total_chunks: number
          total_size: number | null
          updated_at: string | null
          uploaded_chunks: number | null
          user_id: string
        }
        Insert: {
          capture_type?: string | null
          checksum: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_capture_id: string
          metadata?: Json | null
          mime_type?: string | null
          profile_id?: string | null
          retry_count?: number | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          total_chunks: number
          total_size?: number | null
          updated_at?: string | null
          uploaded_chunks?: number | null
          user_id: string
        }
        Update: {
          capture_type?: string | null
          checksum?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          local_capture_id?: string
          metadata?: Json | null
          mime_type?: string | null
          profile_id?: string | null
          retry_count?: number | null
          status?: string | null
          storage_bucket?: string | null
          storage_path?: string | null
          total_chunks?: number
          total_size?: number | null
          updated_at?: string | null
          uploaded_chunks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capture_upload_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "capture_upload_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "capture_upload_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cascade_predictions: {
        Row: {
          accuracy_score: number | null
          actual_value: Json | null
          cascade_id: string | null
          confidence_score: number | null
          created_at: string | null
          features_used: Json | null
          id: string
          model_version: string | null
          predicted_value: Json
          prediction_type: string
          user_id: string
          validated_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: Json | null
          cascade_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          features_used?: Json | null
          id?: string
          model_version?: string | null
          predicted_value: Json
          prediction_type: string
          user_id: string
          validated_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: Json | null
          cascade_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          features_used?: Json | null
          id?: string
          model_version?: string | null
          predicted_value?: Json
          prediction_type?: string
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cascade_predictions_cascade_id_fkey"
            columns: ["cascade_id"]
            isOneToOne: false
            referencedRelation: "influence_cascades"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications: {
        Row: {
          created_at: string
          credential_id: string | null
          credential_url: string | null
          expiration_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          linkedin_id: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          expiration_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          linkedin_id?: string | null
          name?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "certifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chronotype_profiles: {
        Row: {
          chronotype: string | null
          cognitive_low_hours: number[] | null
          cognitive_peak_hours: number[] | null
          compliance_windows: Json | null
          created_at: string | null
          decision_fatigue_patterns: Json | null
          id: string
          morningness_eveningness_score: number | null
          optimal_persuasion_times: Json | null
          profile_id: string | null
          updated_at: string | null
          user_id: string
          weekly_routine: Json | null
        }
        Insert: {
          chronotype?: string | null
          cognitive_low_hours?: number[] | null
          cognitive_peak_hours?: number[] | null
          compliance_windows?: Json | null
          created_at?: string | null
          decision_fatigue_patterns?: Json | null
          id?: string
          morningness_eveningness_score?: number | null
          optimal_persuasion_times?: Json | null
          profile_id?: string | null
          updated_at?: string | null
          user_id: string
          weekly_routine?: Json | null
        }
        Update: {
          chronotype?: string | null
          cognitive_low_hours?: number[] | null
          cognitive_peak_hours?: number[] | null
          compliance_windows?: Json | null
          created_at?: string | null
          decision_fatigue_patterns?: Json | null
          id?: string
          morningness_eveningness_score?: number | null
          optimal_persuasion_times?: Json | null
          profile_id?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_routine?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chronotype_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "chronotype_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "chronotype_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      churn_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: string | null
          contributing_factors: Json | null
          created_at: string | null
          id: string
          intervention_recommended: string | null
          model_used: string | null
          outcome_date: string | null
          outcome_verified: boolean | null
          predicted_churn_probability: number | null
          predicted_days_to_churn: number | null
          prediction_date: string | null
          profile_id: string
          risk_level: string | null
          risk_score: number | null
          user_id: string
          verification_notes: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          contributing_factors?: Json | null
          created_at?: string | null
          id?: string
          intervention_recommended?: string | null
          model_used?: string | null
          outcome_date?: string | null
          outcome_verified?: boolean | null
          predicted_churn_probability?: number | null
          predicted_days_to_churn?: number | null
          prediction_date?: string | null
          profile_id: string
          risk_level?: string | null
          risk_score?: number | null
          user_id: string
          verification_notes?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          contributing_factors?: Json | null
          created_at?: string | null
          id?: string
          intervention_recommended?: string | null
          model_used?: string | null
          outcome_date?: string | null
          outcome_verified?: boolean | null
          predicted_churn_probability?: number | null
          predicted_days_to_churn?: number | null
          prediction_date?: string | null
          profile_id?: string
          risk_level?: string | null
          risk_score?: number | null
          user_id?: string
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churn_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "churn_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "churn_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coercive_control_metrics: {
        Row: {
          compliance_trend: Json | null
          created_at: string
          current_control_phase: string | null
          emotional_control_score: number | null
          escalation_pathway: Json | null
          financial_control_score: number | null
          id: string
          information_control_score: number | null
          isolation_score: number | null
          physical_control_indicators: Json | null
          profile_id: string | null
          punishment_reward_ratio: Json | null
          resistance_level: number | null
          surveillance_intensity: number | null
          time_monopolization_score: number | null
          total_control_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compliance_trend?: Json | null
          created_at?: string
          current_control_phase?: string | null
          emotional_control_score?: number | null
          escalation_pathway?: Json | null
          financial_control_score?: number | null
          id?: string
          information_control_score?: number | null
          isolation_score?: number | null
          physical_control_indicators?: Json | null
          profile_id?: string | null
          punishment_reward_ratio?: Json | null
          resistance_level?: number | null
          surveillance_intensity?: number | null
          time_monopolization_score?: number | null
          total_control_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compliance_trend?: Json | null
          created_at?: string
          current_control_phase?: string | null
          emotional_control_score?: number | null
          escalation_pathway?: Json | null
          financial_control_score?: number | null
          id?: string
          information_control_score?: number | null
          isolation_score?: number | null
          physical_control_indicators?: Json | null
          profile_id?: string | null
          punishment_reward_ratio?: Json | null
          resistance_level?: number | null
          surveillance_intensity?: number | null
          time_monopolization_score?: number | null
          total_control_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coercive_control_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "coercive_control_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "coercive_control_metrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collective_fields: {
        Row: {
          coherence_level: number | null
          collective_beliefs: Json | null
          created_at: string
          field_dynamics: Json | null
          field_evolution_trajectory: Json | null
          field_name: string
          field_strength: number | null
          field_type: string
          group_shadow: Json | null
          id: string
          intervention_points: Json | null
          member_profiles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coherence_level?: number | null
          collective_beliefs?: Json | null
          created_at?: string
          field_dynamics?: Json | null
          field_evolution_trajectory?: Json | null
          field_name: string
          field_strength?: number | null
          field_type: string
          group_shadow?: Json | null
          id?: string
          intervention_points?: Json | null
          member_profiles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coherence_level?: number | null
          collective_beliefs?: Json | null
          created_at?: string
          field_dynamics?: Json | null
          field_evolution_trajectory?: Json | null
          field_name?: string
          field_strength?: number | null
          field_type?: string
          group_shadow?: Json | null
          id?: string
          intervention_points?: Json | null
          member_profiles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      communications: {
        Row: {
          channel: Database["public"]["Enums"]["communication_channel"]
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_minutes: number | null
          id: string
          occurred_at: string
          profile_id: string
          sentiment_score: number | null
          subject: string | null
          user_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["communication_channel"]
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["communication_direction"]
          duration_minutes?: number | null
          id?: string
          occurred_at?: string
          profile_id: string
          sentiment_score?: number | null
          subject?: string | null
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["communication_channel"]
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["communication_direction"]
          duration_minutes?: number | null
          id?: string
          occurred_at?: string
          profile_id?: string
          sentiment_score?: number | null
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "communications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "communications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_evolution: {
        Row: {
          cohesion_score: number | null
          community_id: number
          community_label: string | null
          detected_at: string | null
          external_connections: number | null
          growth_rate: number | null
          health_score: number | null
          id: string
          leader_profile_ids: string[] | null
          member_count: number
          member_profile_ids: string[] | null
          snapshot_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          cohesion_score?: number | null
          community_id: number
          community_label?: string | null
          detected_at?: string | null
          external_connections?: number | null
          growth_rate?: number | null
          health_score?: number | null
          id?: string
          leader_profile_ids?: string[] | null
          member_count: number
          member_profile_ids?: string[] | null
          snapshot_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          cohesion_score?: number | null
          community_id?: number
          community_label?: string | null
          detected_at?: string | null
          external_connections?: number | null
          growth_rate?: number | null
          health_score?: number | null
          id?: string
          leader_profile_ids?: string[] | null
          member_count?: number
          member_profile_ids?: string[] | null
          snapshot_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_evolution_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "network_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_violations: {
        Row: {
          actual_value: string | null
          category: string | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_type: string
          escalated_to: string | null
          escalation_reason: string | null
          expected_value: string | null
          field_path: string | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_id: string
          rule_name: string | null
          severity: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_value?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type: string
          escalated_to?: string | null
          escalation_reason?: string | null
          expected_value?: string | null
          field_path?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id: string
          rule_name?: string | null
          severity: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_value?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string
          escalated_to?: string | null
          escalation_reason?: string | null
          expected_value?: string | null
          field_path?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_id?: string
          rule_name?: string | null
          severity?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comprehensive_scan_sessions: {
        Row: {
          completed_at: string | null
          cost_cents: number | null
          created_at: string | null
          device_type: string | null
          error_message: string | null
          id: string
          profile_id: string
          results_summary: Json | null
          stages_completed: Json | null
          started_at: string | null
          status: string | null
          total_stages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          profile_id: string
          results_summary?: Json | null
          stages_completed?: Json | null
          started_at?: string | null
          status?: string | null
          total_stages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          device_type?: string | null
          error_message?: string | null
          id?: string
          profile_id?: string
          results_summary?: Json | null
          stages_completed?: Json | null
          started_at?: string | null
          status?: string | null
          total_stages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprehensive_scan_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comprehensive_scan_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "comprehensive_scan_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_intelligence: {
        Row: {
          communication_overlap: Json | null
          confidence_score: number | null
          connection_strength: number | null
          connection_type: string
          created_at: string
          evidence: Json | null
          id: string
          inferred_relationship: string | null
          last_analyzed_at: string
          mutual_contacts: string[] | null
          profile_a_id: string
          profile_b_id: string
          shared_events: string[] | null
          shared_organizations: string[] | null
          user_id: string
        }
        Insert: {
          communication_overlap?: Json | null
          confidence_score?: number | null
          connection_strength?: number | null
          connection_type: string
          created_at?: string
          evidence?: Json | null
          id?: string
          inferred_relationship?: string | null
          last_analyzed_at?: string
          mutual_contacts?: string[] | null
          profile_a_id: string
          profile_b_id: string
          shared_events?: string[] | null
          shared_organizations?: string[] | null
          user_id: string
        }
        Update: {
          communication_overlap?: Json | null
          confidence_score?: number | null
          connection_strength?: number | null
          connection_type?: string
          created_at?: string
          evidence?: Json | null
          id?: string
          inferred_relationship?: string | null
          last_analyzed_at?: string
          mutual_contacts?: string[] | null
          profile_a_id?: string
          profile_b_id?: string
          shared_events?: string[] | null
          shared_organizations?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_intelligence_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "connection_intelligence_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "connection_intelligence_profile_a_id_fkey"
            columns: ["profile_a_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_intelligence_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "connection_intelligence_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "connection_intelligence_profile_b_id_fkey"
            columns: ["profile_b_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consciousness_integration: {
        Row: {
          coherence_score: number | null
          created_at: string
          enhancement_metrics: Json | null
          human_input_stream: Json | null
          id: string
          integration_type: string
          latency_ms: number | null
          machine_analysis: Json | null
          session_duration_seconds: number | null
          synthesis_output: Json | null
          user_id: string
        }
        Insert: {
          coherence_score?: number | null
          created_at?: string
          enhancement_metrics?: Json | null
          human_input_stream?: Json | null
          id?: string
          integration_type: string
          latency_ms?: number | null
          machine_analysis?: Json | null
          session_duration_seconds?: number | null
          synthesis_output?: Json | null
          user_id: string
        }
        Update: {
          coherence_score?: number | null
          created_at?: string
          enhancement_metrics?: Json | null
          human_input_stream?: Json | null
          id?: string
          integration_type?: string
          latency_ms?: number | null
          machine_analysis?: Json | null
          session_duration_seconds?: number | null
          synthesis_output?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      contact_activity_feed: {
        Row: {
          activity_subtype: string | null
          activity_type: string
          anomaly_reason: string | null
          created_at: string
          description: string | null
          id: string
          importance_score: number | null
          is_anomaly: boolean | null
          metadata: Json | null
          occurred_at: string
          profile_id: string | null
          source: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_subtype?: string | null
          activity_type: string
          anomaly_reason?: string | null
          created_at?: string
          description?: string | null
          id?: string
          importance_score?: number | null
          is_anomaly?: boolean | null
          metadata?: Json | null
          occurred_at?: string
          profile_id?: string | null
          source?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_subtype?: string | null
          activity_type?: string
          anomaly_reason?: string | null
          created_at?: string
          description?: string | null
          id?: string
          importance_score?: number | null
          is_anomaly?: boolean | null
          metadata?: Json | null
          occurred_at?: string
          profile_id?: string | null
          source?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_activity_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_activity_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_activity_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_ai_spend: {
        Row: {
          breakdown_by_function: Json | null
          breakdown_by_model: Json | null
          created_at: string
          id: string
          period_end: string
          period_start: string
          profile_id: string
          total_calls: number
          total_cost_cents: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          breakdown_by_function?: Json | null
          breakdown_by_model?: Json | null
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          profile_id: string
          total_calls?: number
          total_cost_cents?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          breakdown_by_function?: Json | null
          breakdown_by_model?: Json | null
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          profile_id?: string
          total_calls?: number
          total_cost_cents?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_ai_spend_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_ai_spend_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_ai_spend_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_bank_accounts: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          account_type: string | null
          bank_name: string
          branch_code: string | null
          branch_name: string | null
          country: string | null
          created_at: string
          currency: string | null
          iban: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          profile_id: string
          swift_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name: string
          branch_code?: string | null
          branch_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          profile_id: string
          swift_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          account_type?: string | null
          bank_name?: string
          branch_code?: string | null
          branch_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          iban?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          profile_id?: string
          swift_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_behavior_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: Json | null
          confidence_score: number
          created_at: string | null
          evidence: Json | null
          id: string
          is_validated: boolean | null
          predicted_date_range: unknown
          prediction_type: string
          prediction_value: Json
          profile_id: string | null
          time_horizon: string | null
          trigger_details: Json | null
          trigger_source: string
          updated_at: string | null
          user_id: string
          validation_date: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score: number
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_validated?: boolean | null
          predicted_date_range?: unknown
          prediction_type: string
          prediction_value: Json
          profile_id?: string | null
          time_horizon?: string | null
          trigger_details?: Json | null
          trigger_source: string
          updated_at?: string | null
          user_id: string
          validation_date?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number
          created_at?: string | null
          evidence?: Json | null
          id?: string
          is_validated?: boolean | null
          predicted_date_range?: unknown
          prediction_type?: string
          prediction_value?: Json
          profile_id?: string | null
          time_horizon?: string | null
          trigger_details?: Json | null
          trigger_source?: string
          updated_at?: string | null
          user_id?: string
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_behavior_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_behavior_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_behavior_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_biometrics: {
        Row: {
          ai_model_used: string | null
          body_language_baseline: Json | null
          body_measurements: Json | null
          created_at: string | null
          cross_id_enabled: boolean | null
          cross_id_matches: Json | null
          detected_in_contacts: Json | null
          facial_age_estimation: Json | null
          facial_confidence: number | null
          facial_embedding: string | null
          facial_features: Json | null
          facial_landmarks: Json | null
          facial_last_updated: string | null
          facial_multi_angle_data: Json | null
          facial_sample_count: number | null
          facial_unique_identifiers: Json | null
          fingerprint_data: Json | null
          fingerprint_samples_count: number | null
          gait_confidence: number | null
          gait_patterns: Json | null
          gait_profile_id: string | null
          gait_samples_count: number | null
          handwriting_confidence: number | null
          handwriting_features: Json | null
          handwriting_last_updated: string | null
          handwriting_samples_count: number | null
          id: string
          identity_confidence: number | null
          keystroke_confidence: number | null
          keystroke_profile_id: string | null
          keystroke_samples_count: number | null
          profile_id: string
          signature_confidence: number | null
          signature_features: Json | null
          signature_last_updated: string | null
          signature_samples_count: number | null
          signature_strength: number | null
          updated_at: string | null
          user_id: string
          voice_characteristics: Json | null
          voice_confidence: number | null
          voice_deception_baseline: Json | null
          voice_embedding: string | null
          voice_emotional_baseline: Json | null
          voice_last_updated: string | null
          voice_sample_count: number | null
          voice_speaker_profile: Json | null
        }
        Insert: {
          ai_model_used?: string | null
          body_language_baseline?: Json | null
          body_measurements?: Json | null
          created_at?: string | null
          cross_id_enabled?: boolean | null
          cross_id_matches?: Json | null
          detected_in_contacts?: Json | null
          facial_age_estimation?: Json | null
          facial_confidence?: number | null
          facial_embedding?: string | null
          facial_features?: Json | null
          facial_landmarks?: Json | null
          facial_last_updated?: string | null
          facial_multi_angle_data?: Json | null
          facial_sample_count?: number | null
          facial_unique_identifiers?: Json | null
          fingerprint_data?: Json | null
          fingerprint_samples_count?: number | null
          gait_confidence?: number | null
          gait_patterns?: Json | null
          gait_profile_id?: string | null
          gait_samples_count?: number | null
          handwriting_confidence?: number | null
          handwriting_features?: Json | null
          handwriting_last_updated?: string | null
          handwriting_samples_count?: number | null
          id?: string
          identity_confidence?: number | null
          keystroke_confidence?: number | null
          keystroke_profile_id?: string | null
          keystroke_samples_count?: number | null
          profile_id: string
          signature_confidence?: number | null
          signature_features?: Json | null
          signature_last_updated?: string | null
          signature_samples_count?: number | null
          signature_strength?: number | null
          updated_at?: string | null
          user_id: string
          voice_characteristics?: Json | null
          voice_confidence?: number | null
          voice_deception_baseline?: Json | null
          voice_embedding?: string | null
          voice_emotional_baseline?: Json | null
          voice_last_updated?: string | null
          voice_sample_count?: number | null
          voice_speaker_profile?: Json | null
        }
        Update: {
          ai_model_used?: string | null
          body_language_baseline?: Json | null
          body_measurements?: Json | null
          created_at?: string | null
          cross_id_enabled?: boolean | null
          cross_id_matches?: Json | null
          detected_in_contacts?: Json | null
          facial_age_estimation?: Json | null
          facial_confidence?: number | null
          facial_embedding?: string | null
          facial_features?: Json | null
          facial_landmarks?: Json | null
          facial_last_updated?: string | null
          facial_multi_angle_data?: Json | null
          facial_sample_count?: number | null
          facial_unique_identifiers?: Json | null
          fingerprint_data?: Json | null
          fingerprint_samples_count?: number | null
          gait_confidence?: number | null
          gait_patterns?: Json | null
          gait_profile_id?: string | null
          gait_samples_count?: number | null
          handwriting_confidence?: number | null
          handwriting_features?: Json | null
          handwriting_last_updated?: string | null
          handwriting_samples_count?: number | null
          id?: string
          identity_confidence?: number | null
          keystroke_confidence?: number | null
          keystroke_profile_id?: string | null
          keystroke_samples_count?: number | null
          profile_id?: string
          signature_confidence?: number | null
          signature_features?: Json | null
          signature_last_updated?: string | null
          signature_samples_count?: number | null
          signature_strength?: number | null
          updated_at?: string | null
          user_id?: string
          voice_characteristics?: Json | null
          voice_confidence?: number | null
          voice_deception_baseline?: Json | null
          voice_embedding?: string | null
          voice_emotional_baseline?: Json | null
          voice_last_updated?: string | null
          voice_sample_count?: number | null
          voice_speaker_profile?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_biometrics_gait_profile_id_fkey"
            columns: ["gait_profile_id"]
            isOneToOne: false
            referencedRelation: "gait_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_biometrics_keystroke_profile_id_fkey"
            columns: ["keystroke_profile_id"]
            isOneToOne: false
            referencedRelation: "keystroke_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_private: boolean | null
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean | null
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_communication_preferences: {
        Row: {
          ai_analysis: Json | null
          ai_analyzed_at: string | null
          avoid_channels: string[] | null
          best_contact_times: Json | null
          communication_style: string | null
          confidence_score: number | null
          conflict_resolution_style: string | null
          created_at: string | null
          decision_style: string | null
          favorite_topics: string[] | null
          how_they_show_appreciation: string | null
          how_to_apologize: string | null
          humor_receptivity: string | null
          id: string
          ideal_meeting_duration: string | null
          influence_factors: string[] | null
          meeting_preference: string | null
          preferred_channels: string[] | null
          preferred_greeting: string | null
          profile_id: string
          response_speed: string | null
          sensitivities: string | null
          small_talk_preference: string | null
          topics_to_avoid: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          avoid_channels?: string[] | null
          best_contact_times?: Json | null
          communication_style?: string | null
          confidence_score?: number | null
          conflict_resolution_style?: string | null
          created_at?: string | null
          decision_style?: string | null
          favorite_topics?: string[] | null
          how_they_show_appreciation?: string | null
          how_to_apologize?: string | null
          humor_receptivity?: string | null
          id?: string
          ideal_meeting_duration?: string | null
          influence_factors?: string[] | null
          meeting_preference?: string | null
          preferred_channels?: string[] | null
          preferred_greeting?: string | null
          profile_id: string
          response_speed?: string | null
          sensitivities?: string | null
          small_talk_preference?: string | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_analyzed_at?: string | null
          avoid_channels?: string[] | null
          best_contact_times?: Json | null
          communication_style?: string | null
          confidence_score?: number | null
          conflict_resolution_style?: string | null
          created_at?: string | null
          decision_style?: string | null
          favorite_topics?: string[] | null
          how_they_show_appreciation?: string | null
          how_to_apologize?: string | null
          humor_receptivity?: string | null
          id?: string
          ideal_meeting_duration?: string | null
          influence_factors?: string[] | null
          meeting_preference?: string | null
          preferred_channels?: string[] | null
          preferred_greeting?: string | null
          profile_id?: string
          response_speed?: string | null
          sensitivities?: string | null
          small_talk_preference?: string | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_communication_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_communication_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_communication_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_config_overrides: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_config_overrides_config_key_fkey"
            columns: ["config_key"]
            isOneToOne: false
            referencedRelation: "platform_config"
            referencedColumns: ["config_key"]
          },
          {
            foreignKeyName: "contact_config_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_config_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_config_overrides_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_devices: {
        Row: {
          brand: string | null
          created_at: string
          device_type: string
          id: string
          is_current: boolean | null
          model: string | null
          notes: string | null
          os: string | null
          profile_id: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          device_type: string
          id?: string
          is_current?: boolean | null
          model?: string | null
          notes?: string | null
          os?: string | null
          profile_id: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          device_type?: string
          id?: string
          is_current?: boolean | null
          model?: string | null
          notes?: string | null
          os?: string | null
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_devices_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_engagement_log: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          interaction_weight: number | null
          metadata: Json | null
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          interaction_weight?: number | null
          metadata?: Json | null
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          interaction_weight?: number | null
          metadata?: Json | null
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_engagement_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_engagement_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_engagement_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_financial_history: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          notes: string | null
          payment_method: string | null
          profile_id: string
          reference_number: string | null
          status: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          profile_id: string
          reference_number?: string | null
          status?: string | null
          transaction_date: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          profile_id?: string
          reference_number?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_financial_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_financial_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_financial_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_graduations: {
        Row: {
          created_at: string
          education_level: string
          graduation_date: string | null
          id: string
          institution_name: string | null
          notes: string | null
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          education_level: string
          graduation_date?: string | null
          id?: string
          institution_name?: string | null
          notes?: string | null
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          education_level?: string
          graduation_date?: string | null
          id?: string
          institution_name?: string | null
          notes?: string | null
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_graduations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_graduations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_graduations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          profile_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_group_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_identity_documents: {
        Row: {
          ai_parsed_at: string | null
          created_at: string
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuing_country: string | null
          linked_event_id: string | null
          notes: string | null
          parsed_data: Json | null
          profile_id: string
          reminder_days_before: number | null
          storage_path: string | null
          user_id: string
        }
        Insert: {
          ai_parsed_at?: string | null
          created_at?: string
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          linked_event_id?: string | null
          notes?: string | null
          parsed_data?: Json | null
          profile_id: string
          reminder_days_before?: number | null
          storage_path?: string | null
          user_id: string
        }
        Update: {
          ai_parsed_at?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_country?: string | null
          linked_event_id?: string | null
          notes?: string | null
          parsed_data?: Json | null
          profile_id?: string
          reminder_days_before?: number | null
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_identity_documents_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_identity_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_identity_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_identity_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_influence_profiles: {
        Row: {
          ai_model_used: string | null
          approach_sequence: Json | null
          attention_span: string | null
          authority_susceptibility: number | null
          avoid_words: string[] | null
          channel_preferences: Json | null
          commitment_consistency_susceptibility: number | null
          confidence_score: number | null
          created_at: string
          decision_style: string | null
          desire_motivators: string[] | null
          ego_sensitivities: string[] | null
          emotional_buying_triggers: Json | null
          evidence_sources: Json | null
          fear_motivators: string[] | null
          id: string
          information_preference: string | null
          last_analyzed_at: string | null
          liking_susceptibility: number | null
          memory_anchors: Json | null
          negative_triggers: Json | null
          overall_influence_score: number | null
          positive_triggers: Json | null
          power_words: string[] | null
          profile_id: string
          reciprocity_susceptibility: number | null
          recommended_methodologies: string[] | null
          risk_appetite: string | null
          scarcity_susceptibility: number | null
          social_proof_susceptibility: number | null
          thinking_style: string | null
          time_pressure_response: string | null
          timing_preferences: Json | null
          unity_susceptibility: number | null
          updated_at: string
          user_id: string
          validation_needs: Json | null
        }
        Insert: {
          ai_model_used?: string | null
          approach_sequence?: Json | null
          attention_span?: string | null
          authority_susceptibility?: number | null
          avoid_words?: string[] | null
          channel_preferences?: Json | null
          commitment_consistency_susceptibility?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_style?: string | null
          desire_motivators?: string[] | null
          ego_sensitivities?: string[] | null
          emotional_buying_triggers?: Json | null
          evidence_sources?: Json | null
          fear_motivators?: string[] | null
          id?: string
          information_preference?: string | null
          last_analyzed_at?: string | null
          liking_susceptibility?: number | null
          memory_anchors?: Json | null
          negative_triggers?: Json | null
          overall_influence_score?: number | null
          positive_triggers?: Json | null
          power_words?: string[] | null
          profile_id: string
          reciprocity_susceptibility?: number | null
          recommended_methodologies?: string[] | null
          risk_appetite?: string | null
          scarcity_susceptibility?: number | null
          social_proof_susceptibility?: number | null
          thinking_style?: string | null
          time_pressure_response?: string | null
          timing_preferences?: Json | null
          unity_susceptibility?: number | null
          updated_at?: string
          user_id: string
          validation_needs?: Json | null
        }
        Update: {
          ai_model_used?: string | null
          approach_sequence?: Json | null
          attention_span?: string | null
          authority_susceptibility?: number | null
          avoid_words?: string[] | null
          channel_preferences?: Json | null
          commitment_consistency_susceptibility?: number | null
          confidence_score?: number | null
          created_at?: string
          decision_style?: string | null
          desire_motivators?: string[] | null
          ego_sensitivities?: string[] | null
          emotional_buying_triggers?: Json | null
          evidence_sources?: Json | null
          fear_motivators?: string[] | null
          id?: string
          information_preference?: string | null
          last_analyzed_at?: string | null
          liking_susceptibility?: number | null
          memory_anchors?: Json | null
          negative_triggers?: Json | null
          overall_influence_score?: number | null
          positive_triggers?: Json | null
          power_words?: string[] | null
          profile_id?: string
          reciprocity_susceptibility?: number | null
          recommended_methodologies?: string[] | null
          risk_appetite?: string | null
          scarcity_susceptibility?: number | null
          social_proof_susceptibility?: number | null
          thinking_style?: string | null
          time_pressure_response?: string | null
          timing_preferences?: Json | null
          unity_susceptibility?: number | null
          updated_at?: string
          user_id?: string
          validation_needs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_influence_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interaction_notes: {
        Row: {
          action_items: string[] | null
          ai_extracted_insights: Json | null
          ai_processed_at: string | null
          audio_transcription: string | null
          audio_url: string | null
          created_at: string | null
          duration_minutes: number | null
          follow_up_date: string | null
          follow_up_needed: boolean | null
          follow_up_reason: string | null
          id: string
          interaction_date: string
          interaction_type: string
          location: string | null
          mood_observed: string | null
          notable_changes: string | null
          note_text: string
          profile_id: string
          promises_made: string[] | null
          relationship_temperature: string | null
          topics_discussed: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: string[] | null
          ai_extracted_insights?: Json | null
          ai_processed_at?: string | null
          audio_transcription?: string | null
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          follow_up_reason?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          location?: string | null
          mood_observed?: string | null
          notable_changes?: string | null
          note_text: string
          profile_id: string
          promises_made?: string[] | null
          relationship_temperature?: string | null
          topics_discussed?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: string[] | null
          ai_extracted_insights?: Json | null
          ai_processed_at?: string | null
          audio_transcription?: string | null
          audio_url?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          follow_up_date?: string | null
          follow_up_needed?: boolean | null
          follow_up_reason?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          location?: string | null
          mood_observed?: string | null
          notable_changes?: string | null
          note_text?: string
          profile_id?: string
          promises_made?: string[] | null
          relationship_temperature?: string | null
          topics_discussed?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interaction_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interaction_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interaction_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_interests: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          interest_type: string
          name: string
          notes: string | null
          profile_id: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type: string
          name: string
          notes?: string | null
          profile_id: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          interest_type?: string
          name?: string
          notes?: string | null
          profile_id?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_interests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_kids_schools: {
        Row: {
          child_name: string | null
          child_profile_id: string | null
          created_at: string
          end_date: string | null
          grade_or_year: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          profile_id: string
          school_address: string | null
          school_city: string | null
          school_country: string | null
          school_name: string
          school_type: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          child_name?: string | null
          child_profile_id?: string | null
          created_at?: string
          end_date?: string | null
          grade_or_year?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          profile_id: string
          school_address?: string | null
          school_city?: string | null
          school_country?: string | null
          school_name: string
          school_type?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          child_name?: string | null
          child_profile_id?: string | null
          created_at?: string
          end_date?: string | null
          grade_or_year?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          profile_id?: string
          school_address?: string | null
          school_city?: string | null
          school_country?: string | null
          school_name?: string
          school_type?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_kids_schools_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_kids_schools_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_kids_schools_child_profile_id_fkey"
            columns: ["child_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_kids_schools_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_kids_schools_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_kids_schools_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_languages: {
        Row: {
          created_at: string
          id: string
          is_native: boolean | null
          language_name: string
          proficiency_level: string | null
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_native?: boolean | null
          language_name: string
          proficiency_level?: string | null
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_native?: boolean | null
          language_name?: string
          proficiency_level?: string | null
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_languages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_languages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_languages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_life_milestones: {
        Row: {
          approximate_date: string | null
          created_at: string | null
          description: string | null
          emotional_valence: string | null
          event_date: string | null
          id: string
          impact_level: string | null
          milestone_type: string
          profile_id: string
          related_contacts: string[] | null
          source: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          verified: boolean | null
          your_involvement: string | null
        }
        Insert: {
          approximate_date?: string | null
          created_at?: string | null
          description?: string | null
          emotional_valence?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          milestone_type: string
          profile_id: string
          related_contacts?: string[] | null
          source?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          your_involvement?: string | null
        }
        Update: {
          approximate_date?: string | null
          created_at?: string | null
          description?: string | null
          emotional_valence?: string | null
          event_date?: string | null
          id?: string
          impact_level?: string | null
          milestone_type?: string
          profile_id?: string
          related_contacts?: string[] | null
          source?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          your_involvement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_life_milestones_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_locations: {
        Row: {
          address: string | null
          city: string | null
          confidence_score: number | null
          country: string | null
          country_code: string | null
          created_at: string
          first_seen_at: string | null
          id: string
          is_current: boolean | null
          last_seen_at: string | null
          latitude: number | null
          location_name: string | null
          location_type: string
          longitude: number | null
          metadata: Json | null
          profile_id: string
          region: string | null
          source: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          visit_count: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string | null
          id?: string
          is_current?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type: string
          longitude?: number | null
          metadata?: Json | null
          profile_id: string
          region?: string | null
          source?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          visit_count?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          confidence_score?: number | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          first_seen_at?: string | null
          id?: string
          is_current?: boolean | null
          last_seen_at?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string
          longitude?: number | null
          metadata?: Json | null
          profile_id?: string
          region?: string | null
          source?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_locations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_methods: {
        Row: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at: string
          encryption_classification: string | null
          id: string
          is_encrypted: boolean | null
          is_primary: boolean | null
          label: string | null
          last_accessed_at: string | null
          profile_id: string
          value: string
          value_encrypted: string | null
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          encryption_classification?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_accessed_at?: string | null
          profile_id: string
          value: string
          value_encrypted?: string | null
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          encryption_classification?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_primary?: boolean | null
          label?: string | null
          last_accessed_at?: string | null
          profile_id?: string
          value?: string
          value_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_methods_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_methods_access_logs: {
        Row: {
          access_context: string | null
          access_type: string
          accessed_at: string
          contact_method_id: string
          current_hash: string | null
          id: string
          ip_address: unknown
          previous_hash: string | null
          user_agent: string | null
          user_id: string
          was_decrypted: boolean | null
        }
        Insert: {
          access_context?: string | null
          access_type: string
          accessed_at?: string
          contact_method_id: string
          current_hash?: string | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          user_agent?: string | null
          user_id: string
          was_decrypted?: boolean | null
        }
        Update: {
          access_context?: string | null
          access_type?: string
          accessed_at?: string
          contact_method_id?: string
          current_hash?: string | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          user_agent?: string | null
          user_id?: string
          was_decrypted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_methods_access_logs_contact_method_id_fkey"
            columns: ["contact_method_id"]
            isOneToOne: false
            referencedRelation: "contact_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_news_alerts: {
        Row: {
          action_outcome: string | null
          actioned_at: string | null
          alert_type: string
          conversation_starters: string[] | null
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_actioned: boolean | null
          is_read: boolean | null
          news_item_id: string | null
          predicted_impact: Json | null
          profile_id: string | null
          recommended_actions: Json | null
          severity: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_outcome?: string | null
          actioned_at?: string | null
          alert_type: string
          conversation_starters?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          news_item_id?: string | null
          predicted_impact?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          severity?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_outcome?: string | null
          actioned_at?: string | null
          alert_type?: string
          conversation_starters?: string[] | null
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          news_item_id?: string | null
          predicted_impact?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          severity?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_news_alerts_news_item_id_fkey"
            columns: ["news_item_id"]
            isOneToOne: false
            referencedRelation: "news_intelligence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_news_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_news_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_news_alerts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_news_correlations: {
        Row: {
          action_recommendations: Json | null
          actual_outcome: string | null
          conversation_starters: string[] | null
          correlation_strength: number
          correlation_type: string
          created_at: string
          historical_accuracy: number | null
          id: string
          impact_on_contact: string | null
          is_dismissed: boolean | null
          is_reviewed: boolean | null
          matched_entities: Json | null
          news_item_id: string | null
          opportunity_type: string | null
          predicted_behavior: string | null
          predicted_behaviors: Json | null
          predicted_timeline: string | null
          prediction_type: string | null
          profile_id: string | null
          recommended_actions: Json | null
          user_id: string
          validated_at: string | null
        }
        Insert: {
          action_recommendations?: Json | null
          actual_outcome?: string | null
          conversation_starters?: string[] | null
          correlation_strength: number
          correlation_type: string
          created_at?: string
          historical_accuracy?: number | null
          id?: string
          impact_on_contact?: string | null
          is_dismissed?: boolean | null
          is_reviewed?: boolean | null
          matched_entities?: Json | null
          news_item_id?: string | null
          opportunity_type?: string | null
          predicted_behavior?: string | null
          predicted_behaviors?: Json | null
          predicted_timeline?: string | null
          prediction_type?: string | null
          profile_id?: string | null
          recommended_actions?: Json | null
          user_id: string
          validated_at?: string | null
        }
        Update: {
          action_recommendations?: Json | null
          actual_outcome?: string | null
          conversation_starters?: string[] | null
          correlation_strength?: number
          correlation_type?: string
          created_at?: string
          historical_accuracy?: number | null
          id?: string
          impact_on_contact?: string | null
          is_dismissed?: boolean | null
          is_reviewed?: boolean | null
          matched_entities?: Json | null
          news_item_id?: string | null
          opportunity_type?: string | null
          predicted_behavior?: string | null
          predicted_behaviors?: Json | null
          predicted_timeline?: string | null
          prediction_type?: string | null
          profile_id?: string | null
          recommended_actions?: Json | null
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_news_correlations_news_item_id_fkey"
            columns: ["news_item_id"]
            isOneToOne: false
            referencedRelation: "news_intelligence_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_news_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_news_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_news_correlations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_observations: {
        Row: {
          ai_confidence_score: number | null
          ai_validation_result: Json | null
          ai_validation_status: string | null
          category: string
          confidence_level: string | null
          created_at: string
          id: string
          observation: string
          profile_id: string
          related_analysis_ids: string[] | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_validation_result?: Json | null
          ai_validation_status?: string | null
          category: string
          confidence_level?: string | null
          created_at?: string
          id?: string
          observation: string
          profile_id: string
          related_analysis_ids?: string[] | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_validation_result?: Json | null
          ai_validation_status?: string | null
          category?: string
          confidence_level?: string | null
          created_at?: string
          id?: string
          observation?: string
          profile_id?: string
          related_analysis_ids?: string[] | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_observations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_payment_accounts: {
        Row: {
          account_holder_name: string | null
          account_identifier: string
          country: string | null
          created_at: string
          currency: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          notes: string | null
          platform: string
          profile_id: string
          user_id: string
        }
        Insert: {
          account_holder_name?: string | null
          account_identifier: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          platform: string
          profile_id: string
          user_id: string
        }
        Update: {
          account_holder_name?: string | null
          account_identifier?: string
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          notes?: string | null
          platform?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_payment_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_payment_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_payment_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_personal_info: {
        Row: {
          allergies: string[] | null
          blood_group: string | null
          chinese_zodiac: string | null
          clothing_size: string | null
          created_at: string
          date_of_birth: string | null
          dietary_preferences: string[] | null
          ethnicity: string | null
          eye_color: string | null
          father_name: string | null
          favorite_color: string | null
          gender: string | null
          hair_color: string | null
          handedness: string | null
          height_cm: number | null
          id: string
          main_residence_city: string | null
          main_residence_country: string | null
          marital_status: string | null
          mbti_type: string | null
          mother_name: string | null
          nationality: string | null
          place_of_birth: string | null
          political_affiliation: string | null
          profile_id: string
          religion: string | null
          rh_type: string | null
          shoe_size: string | null
          smoking_preference: string | null
          updated_at: string
          user_id: string
          usual_hangout_places: string[] | null
          weight_kg: number | null
          zodiac_sign: string | null
        }
        Insert: {
          allergies?: string[] | null
          blood_group?: string | null
          chinese_zodiac?: string | null
          clothing_size?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          ethnicity?: string | null
          eye_color?: string | null
          father_name?: string | null
          favorite_color?: string | null
          gender?: string | null
          hair_color?: string | null
          handedness?: string | null
          height_cm?: number | null
          id?: string
          main_residence_city?: string | null
          main_residence_country?: string | null
          marital_status?: string | null
          mbti_type?: string | null
          mother_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          political_affiliation?: string | null
          profile_id: string
          religion?: string | null
          rh_type?: string | null
          shoe_size?: string | null
          smoking_preference?: string | null
          updated_at?: string
          user_id: string
          usual_hangout_places?: string[] | null
          weight_kg?: number | null
          zodiac_sign?: string | null
        }
        Update: {
          allergies?: string[] | null
          blood_group?: string | null
          chinese_zodiac?: string | null
          clothing_size?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_preferences?: string[] | null
          ethnicity?: string | null
          eye_color?: string | null
          father_name?: string | null
          favorite_color?: string | null
          gender?: string | null
          hair_color?: string | null
          handedness?: string | null
          height_cm?: number | null
          id?: string
          main_residence_city?: string | null
          main_residence_country?: string | null
          marital_status?: string | null
          mbti_type?: string | null
          mother_name?: string | null
          nationality?: string | null
          place_of_birth?: string | null
          political_affiliation?: string | null
          profile_id?: string
          religion?: string | null
          rh_type?: string | null
          shoe_size?: string | null
          smoking_preference?: string | null
          updated_at?: string
          user_id?: string
          usual_hangout_places?: string[] | null
          weight_kg?: number | null
          zodiac_sign?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_personal_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_playbooks: {
        Row: {
          ai_generated: boolean | null
          ai_generated_at: string | null
          ai_model_used: string | null
          created_at: string | null
          donts: string[] | null
          dos: string[] | null
          gift_giving_notes: string | null
          how_to_ask_favor: string | null
          how_to_celebrate_with: string | null
          how_to_comfort: string | null
          how_to_deliver_bad_news: string | null
          how_to_give_feedback: string | null
          human_verified: boolean | null
          id: string
          ideal_contact_frequency: string | null
          personality_summary: string | null
          profile_id: string
          relationship_investment_tips: string[] | null
          signs_of_distance: string[] | null
          signs_of_openness: string[] | null
          signs_of_stress: string[] | null
          updated_at: string | null
          user_id: string
          working_with_them: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_generated_at?: string | null
          ai_model_used?: string | null
          created_at?: string | null
          donts?: string[] | null
          dos?: string[] | null
          gift_giving_notes?: string | null
          how_to_ask_favor?: string | null
          how_to_celebrate_with?: string | null
          how_to_comfort?: string | null
          how_to_deliver_bad_news?: string | null
          how_to_give_feedback?: string | null
          human_verified?: boolean | null
          id?: string
          ideal_contact_frequency?: string | null
          personality_summary?: string | null
          profile_id: string
          relationship_investment_tips?: string[] | null
          signs_of_distance?: string[] | null
          signs_of_openness?: string[] | null
          signs_of_stress?: string[] | null
          updated_at?: string | null
          user_id: string
          working_with_them?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_generated_at?: string | null
          ai_model_used?: string | null
          created_at?: string | null
          donts?: string[] | null
          dos?: string[] | null
          gift_giving_notes?: string | null
          how_to_ask_favor?: string | null
          how_to_celebrate_with?: string | null
          how_to_comfort?: string | null
          how_to_deliver_bad_news?: string | null
          how_to_give_feedback?: string | null
          human_verified?: boolean | null
          id?: string
          ideal_contact_frequency?: string | null
          personality_summary?: string | null
          profile_id?: string
          relationship_investment_tips?: string[] | null
          signs_of_distance?: string[] | null
          signs_of_openness?: string[] | null
          signs_of_stress?: string[] | null
          updated_at?: string | null
          user_id?: string
          working_with_them?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_predicted_preferences: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          evidence_count: number | null
          evidence_sources: Json | null
          id: string
          last_updated: string | null
          predicted_value: string | null
          preference_category: string
          preference_key: string
          profile_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          evidence_count?: number | null
          evidence_sources?: Json | null
          id?: string
          last_updated?: string | null
          predicted_value?: string | null
          preference_category: string
          preference_key: string
          profile_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          evidence_count?: number | null
          evidence_sources?: Json | null
          id?: string
          last_updated?: string | null
          predicted_value?: string | null
          preference_category?: string
          preference_key?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_predicted_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_predicted_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_predicted_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_properties: {
        Row: {
          address: string | null
          area_sqm: number | null
          city: string | null
          country: string | null
          created_at: string
          estimated_value: string | null
          google_maps_url: string | null
          id: string
          is_primary_residence: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          place_name: string | null
          postal_code: string | null
          profile_id: string
          property_type: string
          purchase_date: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          estimated_value?: string | null
          google_maps_url?: string | null
          id?: string
          is_primary_residence?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string | null
          postal_code?: string | null
          profile_id: string
          property_type: string
          purchase_date?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          estimated_value?: string | null
          google_maps_url?: string | null
          id?: string
          is_primary_residence?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string | null
          postal_code?: string | null
          profile_id?: string
          property_type?: string
          purchase_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_properties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_properties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_properties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_relationships: {
        Row: {
          created_at: string
          end_date: string | null
          from_profile_id: string
          id: string
          inferred_from_ids: string[] | null
          inverse_label: string | null
          is_bidirectional: boolean | null
          is_inferred: boolean | null
          notes: string | null
          relationship_label: string
          relationship_type: string
          start_date: string | null
          to_profile_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          from_profile_id: string
          id?: string
          inferred_from_ids?: string[] | null
          inverse_label?: string | null
          is_bidirectional?: boolean | null
          is_inferred?: boolean | null
          notes?: string | null
          relationship_label: string
          relationship_type: string
          start_date?: string | null
          to_profile_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          from_profile_id?: string
          id?: string
          inferred_from_ids?: string[] | null
          inverse_label?: string | null
          is_bidirectional?: boolean | null
          is_inferred?: boolean | null
          notes?: string | null
          relationship_label?: string
          relationship_type?: string
          start_date?: string | null
          to_profile_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_from_profile_id_fkey"
            columns: ["from_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_relationships_to_profile_id_fkey"
            columns: ["to_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_residences: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          end_date: string | null
          google_maps_url: string | null
          id: string
          is_current: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          place_name: string | null
          postal_code: string | null
          profile_id: string
          residence_type: string | null
          start_date: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country: string
          created_at?: string
          end_date?: string | null
          google_maps_url?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string | null
          postal_code?: string | null
          profile_id: string
          residence_type?: string | null
          start_date?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          end_date?: string | null
          google_maps_url?: string | null
          id?: string
          is_current?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          place_name?: string | null
          postal_code?: string | null
          profile_id?: string
          residence_type?: string | null
          start_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_residences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_residences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_residences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_skills: {
        Row: {
          created_at: string
          endorsement_count: number | null
          id: string
          linkedin_id: string | null
          proficiency_level: string | null
          profile_id: string
          skill_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          proficiency_level?: string | null
          profile_id: string
          skill_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          endorsement_count?: number | null
          id?: string
          linkedin_id?: string | null
          proficiency_level?: string | null
          profile_id?: string
          skill_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_skills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_travel_history: {
        Row: {
          created_at: string
          destination_city: string | null
          destination_country: string
          id: string
          notes: string | null
          profile_id: string
          purpose: string | null
          return_date: string | null
          travel_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          destination_city?: string | null
          destination_country: string
          id?: string
          notes?: string | null
          profile_id: string
          purpose?: string | null
          return_date?: string | null
          travel_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          destination_city?: string | null
          destination_country?: string
          id?: string
          notes?: string | null
          profile_id?: string
          purpose?: string | null
          return_date?: string | null
          travel_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_travel_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_travel_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_travel_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_current: boolean | null
          license_plate: string | null
          make: string | null
          model: string | null
          notes: string | null
          profile_id: string
          user_id: string
          vehicle_type: string
          year: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_current?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          profile_id: string
          user_id: string
          vehicle_type: string
          year?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_current?: boolean | null
          license_plate?: string | null
          make?: string | null
          model?: string | null
          notes?: string | null
          profile_id?: string
          user_id?: string
          vehicle_type?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contact_vehicles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_relationships: {
        Row: {
          confidence: number | null
          context: string | null
          created_at: string
          first_occurrence: string | null
          id: string
          last_occurrence: string | null
          occurrence_count: number | null
          profile_id_1: string
          profile_id_2: string
          relationship_type: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          context?: string | null
          created_at?: string
          first_occurrence?: string | null
          id?: string
          last_occurrence?: string | null
          occurrence_count?: number | null
          profile_id_1: string
          profile_id_2: string
          relationship_type?: string | null
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          context?: string | null
          created_at?: string
          first_occurrence?: string | null
          id?: string
          last_occurrence?: string | null
          occurrence_count?: number | null
          profile_id_1?: string
          profile_id_2?: string
          relationship_type?: string | null
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_relationships_profile_id_1_fkey"
            columns: ["profile_id_1"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "content_relationships_profile_id_1_fkey"
            columns: ["profile_id_1"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "content_relationships_profile_id_1_fkey"
            columns: ["profile_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_relationships_profile_id_2_fkey"
            columns: ["profile_id_2"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "content_relationships_profile_id_2_fkey"
            columns: ["profile_id_2"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "content_relationships_profile_id_2_fkey"
            columns: ["profile_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      context_snapshots: {
        Row: {
          activity_confidence: number | null
          activity_type: string | null
          ai_insights: Json | null
          ambient_light_level: number | null
          ambient_noise_level: number | null
          battery_level: number | null
          calendar_event_id: string | null
          captured_at: string | null
          connected_bluetooth_devices: Json | null
          context_confidence: number | null
          created_at: string | null
          heart_rate: number | null
          id: string
          inferred_context: string | null
          is_indoor: boolean | null
          latitude: number | null
          location_accuracy: number | null
          location_name: string | null
          location_type: string | null
          longitude: number | null
          nearby_contacts: Json | null
          network_type: string | null
          snapshot_type: string
          step_count: number | null
          stress_level: number | null
          trigger_source: string | null
          user_id: string
          weather_conditions: Json | null
        }
        Insert: {
          activity_confidence?: number | null
          activity_type?: string | null
          ai_insights?: Json | null
          ambient_light_level?: number | null
          ambient_noise_level?: number | null
          battery_level?: number | null
          calendar_event_id?: string | null
          captured_at?: string | null
          connected_bluetooth_devices?: Json | null
          context_confidence?: number | null
          created_at?: string | null
          heart_rate?: number | null
          id?: string
          inferred_context?: string | null
          is_indoor?: boolean | null
          latitude?: number | null
          location_accuracy?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          nearby_contacts?: Json | null
          network_type?: string | null
          snapshot_type: string
          step_count?: number | null
          stress_level?: number | null
          trigger_source?: string | null
          user_id: string
          weather_conditions?: Json | null
        }
        Update: {
          activity_confidence?: number | null
          activity_type?: string | null
          ai_insights?: Json | null
          ambient_light_level?: number | null
          ambient_noise_level?: number | null
          battery_level?: number | null
          calendar_event_id?: string | null
          captured_at?: string | null
          connected_bluetooth_devices?: Json | null
          context_confidence?: number | null
          created_at?: string | null
          heart_rate?: number | null
          id?: string
          inferred_context?: string | null
          is_indoor?: boolean | null
          latitude?: number | null
          location_accuracy?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          nearby_contacts?: Json | null
          network_type?: string | null
          snapshot_type?: string
          step_count?: number | null
          stress_level?: number | null
          trigger_source?: string | null
          user_id?: string
          weather_conditions?: Json | null
        }
        Relationships: []
      }
      convergence_events: {
        Row: {
          convergence_type: string
          converging_phases: string[]
          created_at: string | null
          detected_at: string | null
          event_name: string
          expires_at: string | null
          id: string
          opportunity_window: Json | null
          outcome: Json | null
          profile_id: string | null
          recommended_actions: Json | null
          status: string | null
          synergy_multiplier: number | null
          trigger_conditions: Json
          user_id: string
        }
        Insert: {
          convergence_type: string
          converging_phases: string[]
          created_at?: string | null
          detected_at?: string | null
          event_name: string
          expires_at?: string | null
          id?: string
          opportunity_window?: Json | null
          outcome?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          status?: string | null
          synergy_multiplier?: number | null
          trigger_conditions: Json
          user_id: string
        }
        Update: {
          convergence_type?: string
          converging_phases?: string[]
          created_at?: string | null
          detected_at?: string | null
          event_name?: string
          expires_at?: string | null
          id?: string
          opportunity_window?: Json | null
          outcome?: Json | null
          profile_id?: string | null
          recommended_actions?: Json | null
          status?: string | null
          synergy_multiplier?: number | null
          trigger_conditions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convergence_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "convergence_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "convergence_events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      convergence_protocols: {
        Row: {
          convergence_rules: Json | null
          created_at: string
          execution_count: number | null
          execution_sequence: Json | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          priority: number | null
          protocol_name: string
          protocol_type: string
          success_rate: number | null
          trigger_conditions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          convergence_rules?: Json | null
          created_at?: string
          execution_count?: number | null
          execution_sequence?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          protocol_name: string
          protocol_type: string
          success_rate?: number | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          convergence_rules?: Json | null
          created_at?: string
          execution_count?: number | null
          execution_sequence?: Json | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          priority?: number | null
          protocol_name?: string
          protocol_type?: string
          success_rate?: number | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_analyses: {
        Row: {
          activity_heatmap: Json | null
          ai_model_used: string | null
          analysis_type: string
          anomalies: Json | null
          anonymization_enabled: boolean | null
          communication_dynamics: Json | null
          confidence_score: number | null
          conversation_id: string
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          id: string
          insights: string[] | null
          intent_breakdown: Json | null
          message_count_analyzed: number | null
          messaging_patterns: Json | null
          model_used: string | null
          relationship_health_score: number | null
          response_time_trend: Json | null
          sampling_strategy: string | null
          sentiment_analysis: Json | null
          topic_clusters: Json | null
          total_messages_analyzed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_heatmap?: Json | null
          ai_model_used?: string | null
          analysis_type?: string
          anomalies?: Json | null
          anonymization_enabled?: boolean | null
          communication_dynamics?: Json | null
          confidence_score?: number | null
          conversation_id: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          insights?: string[] | null
          intent_breakdown?: Json | null
          message_count_analyzed?: number | null
          messaging_patterns?: Json | null
          model_used?: string | null
          relationship_health_score?: number | null
          response_time_trend?: Json | null
          sampling_strategy?: string | null
          sentiment_analysis?: Json | null
          topic_clusters?: Json | null
          total_messages_analyzed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_heatmap?: Json | null
          ai_model_used?: string | null
          analysis_type?: string
          anomalies?: Json | null
          anonymization_enabled?: boolean | null
          communication_dynamics?: Json | null
          confidence_score?: number | null
          conversation_id?: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          insights?: string[] | null
          intent_breakdown?: Json | null
          message_count_analyzed?: number | null
          messaging_patterns?: Json | null
          model_used?: string | null
          relationship_health_score?: number | null
          response_time_trend?: Json | null
          sampling_strategy?: string | null
          sentiment_analysis?: Json | null
          topic_clusters?: Json | null
          total_messages_analyzed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_analyses_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_scripts: {
        Row: {
          branches: Json | null
          created_at: string
          effectiveness_data: Json | null
          id: string
          objective: string
          profile_id: string | null
          script_tree: Json
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          branches?: Json | null
          created_at?: string
          effectiveness_data?: Json | null
          id?: string
          objective: string
          profile_id?: string | null
          script_tree?: Json
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          branches?: Json | null
          created_at?: string
          effectiveness_data?: Json | null
          id?: string
          objective?: string
          profile_id?: string | null
          script_tree?: Json
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_scripts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversation_scripts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversation_scripts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          action_items: string[] | null
          ai_model_used: string | null
          conversation_id: string
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          id: string
          important_dates: string[] | null
          key_topics: string[] | null
          message_count_summarized: number | null
          summary: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_items?: string[] | null
          ai_model_used?: string | null
          conversation_id: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          important_dates?: string[] | null
          key_topics?: string[] | null
          message_count_summarized?: number | null
          summary: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_items?: string[] | null
          ai_model_used?: string | null
          conversation_id?: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          id?: string
          important_dates?: string[] | null
          key_topics?: string[] | null
          message_count_summarized?: number | null
          summary?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          message_count: number | null
          platform: Database["public"]["Enums"]["message_platform"]
          profile_id: string
          started_at: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          platform: Database["public"]["Enums"]["message_platform"]
          profile_id: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          platform?: Database["public"]["Enums"]["message_platform"]
          profile_id?: string
          started_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      correlation_rules: {
        Row: {
          alert_severity: string | null
          auto_generate_alert: boolean | null
          correlation_logic: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          rule_name: string
          source_device_types: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_severity?: string | null
          auto_generate_alert?: boolean | null
          correlation_logic?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name: string
          source_device_types?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_severity?: string | null
          auto_generate_alert?: boolean | null
          correlation_logic?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          rule_name?: string
          source_device_types?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cosmic_awareness: {
        Row: {
          accuracy_score: number | null
          awareness_type: string
          causal_web_mapping: Json | null
          created_at: string
          emergence_tracking: Json | null
          id: string
          insight_depth: number | null
          pattern_matrix: Json | null
          prediction_horizon_days: number | null
          synchronicity_detection: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          awareness_type: string
          causal_web_mapping?: Json | null
          created_at?: string
          emergence_tracking?: Json | null
          id?: string
          insight_depth?: number | null
          pattern_matrix?: Json | null
          prediction_horizon_days?: number | null
          synchronicity_detection?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          awareness_type?: string
          causal_web_mapping?: Json | null
          created_at?: string
          emergence_tracking?: Json | null
          id?: string
          insight_depth?: number | null
          pattern_matrix?: Json | null
          prediction_horizon_days?: number | null
          synchronicity_detection?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_anomaly_alerts: {
        Row: {
          anomaly_type: string
          created_at: string
          description: string | null
          detected_value: number | null
          deviation_percentage: number | null
          expected_value: number | null
          function_name: string | null
          id: string
          is_resolved: boolean | null
          model_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          anomaly_type: string
          created_at?: string
          description?: string | null
          detected_value?: number | null
          deviation_percentage?: number | null
          expected_value?: number | null
          function_name?: string | null
          id?: string
          is_resolved?: boolean | null
          model_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          anomaly_type?: string
          created_at?: string
          description?: string | null
          detected_value?: number | null
          deviation_percentage?: number | null
          expected_value?: number | null
          function_name?: string | null
          id?: string
          is_resolved?: boolean | null
          model_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
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
      cross_references: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          normalized_value: string | null
          profile_id: string | null
          reference_type: string
          reference_value: string
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          profile_id?: string | null
          reference_type: string
          reference_value: string
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          normalized_value?: string | null
          profile_id?: string | null
          reference_type?: string
          reference_value?: string
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cross_references_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cult_tactic_deployments: {
        Row: {
          behavior_control_score: number | null
          confession_culture_metrics: Json | null
          created_at: string
          emotional_control_score: number | null
          exit_cost_perception: number | null
          group_identity_strength: number | null
          id: string
          information_control_score: number | null
          loaded_language_adoption: string[] | null
          profile_id: string | null
          surveillance_acceptance: number | null
          thought_control_score: number | null
          thought_stopping_techniques: Json | null
          total_bite_score: number | null
          updated_at: string
          us_vs_them_narrative_strength: number | null
          user_id: string
        }
        Insert: {
          behavior_control_score?: number | null
          confession_culture_metrics?: Json | null
          created_at?: string
          emotional_control_score?: number | null
          exit_cost_perception?: number | null
          group_identity_strength?: number | null
          id?: string
          information_control_score?: number | null
          loaded_language_adoption?: string[] | null
          profile_id?: string | null
          surveillance_acceptance?: number | null
          thought_control_score?: number | null
          thought_stopping_techniques?: Json | null
          total_bite_score?: number | null
          updated_at?: string
          us_vs_them_narrative_strength?: number | null
          user_id: string
        }
        Update: {
          behavior_control_score?: number | null
          confession_culture_metrics?: Json | null
          created_at?: string
          emotional_control_score?: number | null
          exit_cost_perception?: number | null
          group_identity_strength?: number | null
          id?: string
          information_control_score?: number | null
          loaded_language_adoption?: string[] | null
          profile_id?: string | null
          surveillance_acceptance?: number | null
          thought_control_score?: number | null
          thought_stopping_techniques?: Json | null
          total_bite_score?: number | null
          updated_at?: string
          us_vs_them_narrative_strength?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "cult_tactic_deployments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_layouts: {
        Row: {
          created_at: string
          grid_columns: number | null
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grid_columns?: number | null
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grid_columns?: number | null
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      deception_analyses: {
        Row: {
          analysis_version: string | null
          analyzed_at: string
          behavioral_indicators: Json | null
          conflict_severity: number | null
          created_at: string
          cross_modal_conflicts: Json | null
          deception_likelihood: string | null
          deception_score: number | null
          deception_timeline: Json | null
          expression_authenticity_score: number | null
          facial_indicators: Json | null
          id: string
          linguistic_authenticity_score: number | null
          linguistic_deception_markers: Json | null
          linguistic_indicators: Json | null
          micro_expressions: Json | null
          models_used: string[] | null
          overall_confidence: number
          peak_deception_moments: Json | null
          profile_id: string
          source_id: string | null
          source_type: string
          user_id: string
          vocal_authenticity_score: number | null
          vocal_indicators: Json | null
          voice_stress_markers: Json | null
        }
        Insert: {
          analysis_version?: string | null
          analyzed_at?: string
          behavioral_indicators?: Json | null
          conflict_severity?: number | null
          created_at?: string
          cross_modal_conflicts?: Json | null
          deception_likelihood?: string | null
          deception_score?: number | null
          deception_timeline?: Json | null
          expression_authenticity_score?: number | null
          facial_indicators?: Json | null
          id?: string
          linguistic_authenticity_score?: number | null
          linguistic_deception_markers?: Json | null
          linguistic_indicators?: Json | null
          micro_expressions?: Json | null
          models_used?: string[] | null
          overall_confidence: number
          peak_deception_moments?: Json | null
          profile_id: string
          source_id?: string | null
          source_type: string
          user_id: string
          vocal_authenticity_score?: number | null
          vocal_indicators?: Json | null
          voice_stress_markers?: Json | null
        }
        Update: {
          analysis_version?: string | null
          analyzed_at?: string
          behavioral_indicators?: Json | null
          conflict_severity?: number | null
          created_at?: string
          cross_modal_conflicts?: Json | null
          deception_likelihood?: string | null
          deception_score?: number | null
          deception_timeline?: Json | null
          expression_authenticity_score?: number | null
          facial_indicators?: Json | null
          id?: string
          linguistic_authenticity_score?: number | null
          linguistic_deception_markers?: Json | null
          linguistic_indicators?: Json | null
          micro_expressions?: Json | null
          models_used?: string[] | null
          overall_confidence?: number
          peak_deception_moments?: Json | null
          profile_id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
          vocal_authenticity_score?: number | null
          vocal_indicators?: Json | null
          voice_stress_markers?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "deception_analyses_profile_id_fkey"
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
      deletion_requests: {
        Row: {
          aggregates_affected: number | null
          confirmation_code: string | null
          confirmed_at: string | null
          created_at: string
          deletion_scope: string
          error_message: string | null
          events_affected: number | null
          events_deleted: number | null
          executed_at: string | null
          execution_log: Json | null
          id: string
          impact_preview: Json | null
          profiles_affected: string[] | null
          requested_at: string
          scope_parameters: Json
          status: string | null
          updated_at: string
          user_confirmation_method: string | null
          user_id: string
        }
        Insert: {
          aggregates_affected?: number | null
          confirmation_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          deletion_scope: string
          error_message?: string | null
          events_affected?: number | null
          events_deleted?: number | null
          executed_at?: string | null
          execution_log?: Json | null
          id?: string
          impact_preview?: Json | null
          profiles_affected?: string[] | null
          requested_at?: string
          scope_parameters: Json
          status?: string | null
          updated_at?: string
          user_confirmation_method?: string | null
          user_id: string
        }
        Update: {
          aggregates_affected?: number | null
          confirmation_code?: string | null
          confirmed_at?: string | null
          created_at?: string
          deletion_scope?: string
          error_message?: string | null
          events_affected?: number | null
          events_deleted?: number | null
          executed_at?: string | null
          execution_log?: Json | null
          id?: string
          impact_preview?: Json | null
          profiles_affected?: string[] | null
          requested_at?: string
          scope_parameters?: Json
          status?: string | null
          updated_at?: string
          user_confirmation_method?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dependency_scores: {
        Row: {
          attachment_dependency: number | null
          created_at: string
          dependency_creation_tactics: Json | null
          dependency_trend: Json | null
          emotional_dependency: number | null
          exit_prevention_protocols: Json | null
          financial_dependency: number | null
          id: string
          informational_dependency: number | null
          isolation_factor: number | null
          narcissistic_supply_dependency: number | null
          profile_id: string | null
          social_dependency: number | null
          total_dependency_score: number | null
          updated_at: string
          user_id: string
          withdrawal_severity_prediction: Json | null
        }
        Insert: {
          attachment_dependency?: number | null
          created_at?: string
          dependency_creation_tactics?: Json | null
          dependency_trend?: Json | null
          emotional_dependency?: number | null
          exit_prevention_protocols?: Json | null
          financial_dependency?: number | null
          id?: string
          informational_dependency?: number | null
          isolation_factor?: number | null
          narcissistic_supply_dependency?: number | null
          profile_id?: string | null
          social_dependency?: number | null
          total_dependency_score?: number | null
          updated_at?: string
          user_id: string
          withdrawal_severity_prediction?: Json | null
        }
        Update: {
          attachment_dependency?: number | null
          created_at?: string
          dependency_creation_tactics?: Json | null
          dependency_trend?: Json | null
          emotional_dependency?: number | null
          exit_prevention_protocols?: Json | null
          financial_dependency?: number | null
          id?: string
          informational_dependency?: number | null
          isolation_factor?: number | null
          narcissistic_supply_dependency?: number | null
          profile_id?: string | null
          social_dependency?: number | null
          total_dependency_score?: number | null
          updated_at?: string
          user_id?: string
          withdrawal_severity_prediction?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dependency_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_items: {
        Row: {
          ai_model_used: string | null
          bounding_box: Json | null
          brand: string | null
          category: string
          confidence: number | null
          created_at: string
          cropped_image_url: string | null
          description: string | null
          id: string
          item_type: string
          linked_at: string | null
          linked_by: string | null
          linked_status: string
          media_id: string | null
          model: string | null
          name: string | null
          profile_id: string | null
          source_mosaic_id: string | null
          specifications: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          bounding_box?: Json | null
          brand?: string | null
          category: string
          confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          description?: string | null
          id?: string
          item_type: string
          linked_at?: string | null
          linked_by?: string | null
          linked_status?: string
          media_id?: string | null
          model?: string | null
          name?: string | null
          profile_id?: string | null
          source_mosaic_id?: string | null
          specifications?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          bounding_box?: Json | null
          brand?: string | null
          category?: string
          confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          description?: string | null
          id?: string
          item_type?: string
          linked_at?: string | null
          linked_by?: string | null
          linked_status?: string
          media_id?: string | null
          model?: string | null
          name?: string | null
          profile_id?: string | null
          source_mosaic_id?: string | null
          specifications?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "detected_items_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "item_category_templates"
            referencedColumns: ["category"]
          },
          {
            foreignKeyName: "detected_items_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "detected_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "detected_items_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_captures: {
        Row: {
          ai_analysis: Json | null
          applied_at: string | null
          capture_type: string
          confidence_score: number | null
          created_at: string
          device_source: string | null
          error_message: string | null
          extracted_data: Json | null
          file_urls: string[] | null
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          metadata: Json | null
          processing_completed_at: string | null
          processing_started_at: string | null
          profile_id: string | null
          raw_content: string | null
          source_app: string | null
          status: string | null
          storage_paths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          applied_at?: string | null
          capture_type: string
          confidence_score?: number | null
          created_at?: string
          device_source?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_urls?: string[] | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          metadata?: Json | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          profile_id?: string | null
          raw_content?: string | null
          source_app?: string | null
          status?: string | null
          storage_paths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          applied_at?: string | null
          capture_type?: string
          confidence_score?: number | null
          created_at?: string
          device_source?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          file_urls?: string[] | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          metadata?: Json | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          profile_id?: string | null
          raw_content?: string | null
          source_app?: string | null
          status?: string | null
          storage_paths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_contacts: {
        Row: {
          birthday: string | null
          created_at: string | null
          emails: string[] | null
          has_photo: boolean | null
          id: string
          linked_profile_id: string | null
          name: string
          notes: string | null
          organization: string | null
          phone_contact_id: string
          phones: string[] | null
          photo_base64: string | null
          synced_at: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string | null
          emails?: string[] | null
          has_photo?: boolean | null
          id?: string
          linked_profile_id?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          phone_contact_id: string
          phones?: string[] | null
          photo_base64?: string | null
          synced_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string | null
          emails?: string[] | null
          has_photo?: boolean | null
          id?: string
          linked_profile_id?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone_contact_id?: string
          phones?: string[] | null
          photo_base64?: string | null
          synced_at?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_contacts_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_contacts_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_contacts_linked_profile_id_fkey"
            columns: ["linked_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_health_checks: {
        Row: {
          check_type: string
          created_at: string | null
          device_id: string | null
          health_score: number | null
          id: string
          issues_detected: Json | null
          metrics: Json | null
          next_check_at: string | null
          recommendations: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          check_type: string
          created_at?: string | null
          device_id?: string | null
          health_score?: number | null
          id?: string
          issues_detected?: Json | null
          metrics?: Json | null
          next_check_at?: string | null
          recommendations?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          check_type?: string
          created_at?: string | null
          device_id?: string | null
          health_score?: number | null
          id?: string
          issues_detected?: Json | null
          metrics?: Json | null
          next_check_at?: string | null
          recommendations?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_health_checks_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_health_data: {
        Row: {
          created_at: string | null
          device_id: string | null
          device_type: string
          id: string
          interaction_context_id: string | null
          interaction_profile_id: string | null
          metadata: Json | null
          metric_type: string
          metric_unit: string | null
          metric_value: number
          recorded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          device_type: string
          id?: string
          interaction_context_id?: string | null
          interaction_profile_id?: string | null
          metadata?: Json | null
          metric_type: string
          metric_unit?: string | null
          metric_value: number
          recorded_at: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          device_type?: string
          id?: string
          interaction_context_id?: string | null
          interaction_profile_id?: string | null
          metadata?: Json | null
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
          recorded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_health_data_interaction_profile_id_fkey"
            columns: ["interaction_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_health_data_interaction_profile_id_fkey"
            columns: ["interaction_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "device_health_data_interaction_profile_id_fkey"
            columns: ["interaction_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_presence: {
        Row: {
          created_at: string
          device_id: string | null
          device_type: string
          id: string
          last_seen_at: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_type?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_type?: string
          id?: string
          last_seen_at?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_sync_log: {
        Row: {
          created_at: string
          data_count: number | null
          device_id: string
          device_name: string | null
          device_type: string
          id: string
          metadata: Json | null
          sync_type: string
          synced_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_count?: number | null
          device_id: string
          device_name?: string | null
          device_type: string
          id?: string
          metadata?: Json | null
          sync_type: string
          synced_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_count?: number | null
          device_id?: string
          device_name?: string | null
          device_type?: string
          id?: string
          metadata?: Json | null
          sync_type?: string
          synced_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dimensional_influence: {
        Row: {
          amplification_factor: number | null
          created_at: string
          cross_dimensional_effects: Json | null
          decay_rate: number | null
          id: string
          influence_type: string
          influence_vectors: Json | null
          measured_impact: Json | null
          propagation_model: Json | null
          target_dimensions: Json | null
          user_id: string
        }
        Insert: {
          amplification_factor?: number | null
          created_at?: string
          cross_dimensional_effects?: Json | null
          decay_rate?: number | null
          id?: string
          influence_type: string
          influence_vectors?: Json | null
          measured_impact?: Json | null
          propagation_model?: Json | null
          target_dimensions?: Json | null
          user_id: string
        }
        Update: {
          amplification_factor?: number | null
          created_at?: string
          cross_dimensional_effects?: Json | null
          decay_rate?: number | null
          id?: string
          influence_type?: string
          influence_vectors?: Json | null
          measured_impact?: Json | null
          propagation_model?: Json | null
          target_dimensions?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      dimensional_operations: {
        Row: {
          created_at: string
          cross_dimensional_effects: Json | null
          current_coordinates: Json | null
          dimension_weights: Json | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          operation_name: string
          optimization_target: Json | null
          path_calculation: Json | null
          target_coordinates: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_dimensional_effects?: Json | null
          current_coordinates?: Json | null
          dimension_weights?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          operation_name: string
          optimization_target?: Json | null
          path_calculation?: Json | null
          target_coordinates?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_dimensional_effects?: Json | null
          current_coordinates?: Json | null
          dimension_weights?: Json | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          operation_name?: string
          optimization_target?: Json | null
          path_calculation?: Json | null
          target_coordinates?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_analysis_jobs: {
        Row: {
          actual_cost_cents: number | null
          completed_at: string | null
          contacts_linked: number | null
          created_at: string
          current_item_id: string | null
          documents_extracted: number | null
          estimated_cost_cents: number | null
          failed_items: number | null
          id: string
          last_error: string | null
          last_processed_index: number | null
          max_retries: number | null
          model: string | null
          options: Json
          patterns_found: number | null
          paused_at: string | null
          processed_items: number | null
          profile_id: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          contacts_linked?: number | null
          created_at?: string
          current_item_id?: string | null
          documents_extracted?: number | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          last_error?: string | null
          last_processed_index?: number | null
          max_retries?: number | null
          model?: string | null
          options?: Json
          patterns_found?: number | null
          paused_at?: string | null
          processed_items?: number | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          contacts_linked?: number | null
          created_at?: string
          current_item_id?: string | null
          documents_extracted?: number | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          last_error?: string | null
          last_processed_index?: number | null
          max_retries?: number | null
          model?: string | null
          options?: Json
          patterns_found?: number | null
          paused_at?: string | null
          processed_items?: number | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          backfill_error: string | null
          backfill_status: string | null
          content: string
          content_summary: string | null
          created_at: string | null
          embedding: string | null
          embedding_vector: string | null
          id: string
          metadata: Json | null
          profile_id: string | null
          source_id: string
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backfill_error?: string | null
          backfill_status?: string | null
          content: string
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          embedding_vector?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          source_id: string
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backfill_error?: string | null
          backfill_status?: string | null
          content?: string
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          embedding_vector?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          source_id?: string
          source_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_embeddings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_embeddings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_hashes: {
        Row: {
          algorithm: string | null
          created_at: string | null
          document_id: string
          document_type: string
          file_size: number | null
          hash: string
          id: string
          is_valid: boolean | null
          last_verified_at: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          algorithm?: string | null
          created_at?: string | null
          document_id: string
          document_type: string
          file_size?: number | null
          hash: string
          id?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          algorithm?: string | null
          created_at?: string | null
          document_id?: string
          document_type?: string
          file_size?: number | null
          hash?: string
          id?: string
          is_valid?: boolean | null
          last_verified_at?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      document_insights: {
        Row: {
          ai_model_used: string | null
          amounts_found: Json | null
          anomalies: Json | null
          authenticity_score: number | null
          classification_confidence: number | null
          contact_info_extracted: Json | null
          cost_cents: number | null
          created_at: string
          dates_found: Json | null
          document_id: string | null
          document_subtype: string | null
          document_type: string | null
          financial_data: Json | null
          form_fields: Json | null
          id: string
          job_id: string | null
          key_value_pairs: Json | null
          language_detected: string | null
          media_id: string | null
          patterns_detected: Json | null
          processing_time_ms: number | null
          profile_id: string | null
          raw_text: string | null
          sensitive_data: Json | null
          structured_data: Json | null
          suggested_contacts: Json | null
          suggested_reminders: Json | null
          tables_extracted: Json | null
          text_blocks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          amounts_found?: Json | null
          anomalies?: Json | null
          authenticity_score?: number | null
          classification_confidence?: number | null
          contact_info_extracted?: Json | null
          cost_cents?: number | null
          created_at?: string
          dates_found?: Json | null
          document_id?: string | null
          document_subtype?: string | null
          document_type?: string | null
          financial_data?: Json | null
          form_fields?: Json | null
          id?: string
          job_id?: string | null
          key_value_pairs?: Json | null
          language_detected?: string | null
          media_id?: string | null
          patterns_detected?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          raw_text?: string | null
          sensitive_data?: Json | null
          structured_data?: Json | null
          suggested_contacts?: Json | null
          suggested_reminders?: Json | null
          tables_extracted?: Json | null
          text_blocks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          amounts_found?: Json | null
          anomalies?: Json | null
          authenticity_score?: number | null
          classification_confidence?: number | null
          contact_info_extracted?: Json | null
          cost_cents?: number | null
          created_at?: string
          dates_found?: Json | null
          document_id?: string | null
          document_subtype?: string | null
          document_type?: string | null
          financial_data?: Json | null
          form_fields?: Json | null
          id?: string
          job_id?: string | null
          key_value_pairs?: Json | null
          language_detected?: string | null
          media_id?: string | null
          patterns_detected?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          raw_text?: string | null
          sensitive_data?: Json | null
          structured_data?: Json | null
          suggested_contacts?: Json | null
          suggested_reminders?: Json | null
          tables_extracted?: Json | null
          text_blocks?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "extracted_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "document_analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "document_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          ai_generation_error: string | null
          ai_generation_status: string | null
          ai_metadata: Json | null
          ai_metadata_generated_at: string | null
          ai_model_used: string | null
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          storage_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          ai_metadata?: Json | null
          ai_metadata_generated_at?: string | null
          ai_model_used?: string | null
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          storage_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          ai_metadata?: Json | null
          ai_metadata_generated_at?: string | null
          ai_model_used?: string | null
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          storage_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dominion_objectives: {
        Row: {
          created_at: string
          current_state: Json | null
          dependencies: Json | null
          id: string
          objective_class: string
          objective_name: string
          progress_percentage: number | null
          resource_allocation: Json | null
          risk_factors: Json | null
          status: string | null
          sub_objectives: Json | null
          success_criteria: Json | null
          target_state: Json | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_state?: Json | null
          dependencies?: Json | null
          id?: string
          objective_class: string
          objective_name: string
          progress_percentage?: number | null
          resource_allocation?: Json | null
          risk_factors?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json | null
          target_state?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_state?: Json | null
          dependencies?: Json | null
          id?: string
          objective_class?: string
          objective_name?: string
          progress_percentage?: number | null
          resource_allocation?: Json | null
          risk_factors?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json | null
          target_state?: Json | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          ai_model_used: string | null
          classification: string | null
          created_at: string
          data_sources_used: Json | null
          dossier_type: string
          expires_at: string | null
          file_url: string | null
          generated_at: string
          generation_cost_cents: number | null
          id: string
          is_archived: boolean | null
          key_findings: Json | null
          profile_id: string | null
          recommendations: Json | null
          risk_assessment: Json | null
          sections: Json
          storage_path: string | null
          summary: string | null
          title: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          classification?: string | null
          created_at?: string
          data_sources_used?: Json | null
          dossier_type: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          generation_cost_cents?: number | null
          id?: string
          is_archived?: boolean | null
          key_findings?: Json | null
          profile_id?: string | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          sections: Json
          storage_path?: string | null
          summary?: string | null
          title: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          classification?: string | null
          created_at?: string
          data_sources_used?: Json | null
          dossier_type?: string
          expires_at?: string | null
          file_url?: string | null
          generated_at?: string
          generation_cost_cents?: number | null
          id?: string
          is_archived?: boolean | null
          key_findings?: Json | null
          profile_id?: string | null
          recommendations?: Json | null
          risk_assessment?: Json | null
          sections?: Json
          storage_path?: string | null
          summary?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "dossiers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      education: {
        Row: {
          activities: string | null
          created_at: string
          degree_type: string | null
          description: string | null
          end_date: string | null
          field_of_study: string | null
          grade_or_gpa: string | null
          id: string
          institution_name: string
          is_current: boolean | null
          linkedin_id: string | null
          profile_id: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activities?: string | null
          created_at?: string
          degree_type?: string | null
          description?: string | null
          end_date?: string | null
          field_of_study?: string | null
          grade_or_gpa?: string | null
          id?: string
          institution_name?: string
          is_current?: boolean | null
          linkedin_id?: string | null
          profile_id?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "education_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      email_access_logs: {
        Row: {
          access_type: string
          accessed_at: string
          accessed_fields: string[] | null
          clearance_used: string | null
          current_hash: string | null
          email_message_id: string | null
          email_thread_id: string | null
          id: string
          ip_address: unknown
          previous_hash: string | null
          user_agent: string | null
          user_id: string
          was_decrypted: boolean | null
        }
        Insert: {
          access_type: string
          accessed_at?: string
          accessed_fields?: string[] | null
          clearance_used?: string | null
          current_hash?: string | null
          email_message_id?: string | null
          email_thread_id?: string | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          user_agent?: string | null
          user_id: string
          was_decrypted?: boolean | null
        }
        Update: {
          access_type?: string
          accessed_at?: string
          accessed_fields?: string[] | null
          clearance_used?: string | null
          current_hash?: string | null
          email_message_id?: string | null
          email_thread_id?: string | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          user_agent?: string | null
          user_id?: string
          was_decrypted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_access_logs_email_message_id_fkey"
            columns: ["email_message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_access_logs_email_thread_id_fkey"
            columns: ["email_thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_connected: boolean
          last_sync_at: string | null
          provider: string
          sync_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          provider: string
          sync_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_connected?: boolean
          last_sync_at?: string | null
          provider?: string
          sync_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          body_encrypted: string | null
          body_html: string | null
          body_preview: string | null
          cc_recipients: string[] | null
          created_at: string | null
          encryption_classification: string | null
          external_id: string
          has_attachments: boolean | null
          id: string
          importance: string | null
          is_encrypted: boolean | null
          is_from_contact: boolean | null
          received_at: string | null
          recipients: string[] | null
          sender_email: string
          sender_name: string | null
          sent_at: string
          subject: string | null
          subject_encrypted: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          body_encrypted?: string | null
          body_html?: string | null
          body_preview?: string | null
          cc_recipients?: string[] | null
          created_at?: string | null
          encryption_classification?: string | null
          external_id: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_encrypted?: boolean | null
          is_from_contact?: boolean | null
          received_at?: string | null
          recipients?: string[] | null
          sender_email: string
          sender_name?: string | null
          sent_at: string
          subject?: string | null
          subject_encrypted?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          body_encrypted?: string | null
          body_html?: string | null
          body_preview?: string | null
          cc_recipients?: string[] | null
          created_at?: string | null
          encryption_classification?: string | null
          external_id?: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_encrypted?: boolean | null
          is_from_contact?: boolean | null
          received_at?: string | null
          recipients?: string[] | null
          sender_email?: string
          sender_name?: string | null
          sent_at?: string
          subject?: string | null
          subject_encrypted?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          encryption_classification: string | null
          folder: string | null
          id: string
          is_encrypted: boolean | null
          is_read: boolean | null
          last_message_at: string | null
          message_count: number | null
          profile_id: string | null
          subject: string | null
          subject_encrypted: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          encryption_classification?: string | null
          folder?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          profile_id?: string | null
          subject?: string | null
          subject_encrypted?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          encryption_classification?: string | null
          folder?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          profile_id?: string | null
          subject?: string | null
          subject_encrypted?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "email_threads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "email_threads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_metadata: {
        Row: {
          chunk_index: number | null
          chunk_total: number | null
          created_at: string | null
          document_embedding_id: string | null
          embedding_dimensions: number | null
          embedding_model: string | null
          id: string
          is_stale: boolean | null
          last_refreshed_at: string | null
          quality_score: number | null
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_index?: number | null
          chunk_total?: number | null
          created_at?: string | null
          document_embedding_id?: string | null
          embedding_dimensions?: number | null
          embedding_model?: string | null
          id?: string
          is_stale?: boolean | null
          last_refreshed_at?: string | null
          quality_score?: number | null
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number | null
          chunk_total?: number | null
          created_at?: string | null
          document_embedding_id?: string | null
          embedding_dimensions?: number | null
          embedding_model?: string | null
          id?: string
          is_stale?: boolean | null
          last_refreshed_at?: string | null
          quality_score?: number | null
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embedding_metadata_document_embedding_id_fkey"
            columns: ["document_embedding_id"]
            isOneToOne: false
            referencedRelation: "document_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      emergence_patterns: {
        Row: {
          created_at: string | null
          detection_confidence: number | null
          exploitation_strategies: Json | null
          first_detected_at: string | null
          id: string
          is_validated: boolean | null
          last_observed_at: string | null
          novelty_score: number | null
          occurrence_count: number | null
          pattern_name: string
          pattern_signature: Json
          pattern_type: string
          source_domains: string[] | null
          strategic_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detection_confidence?: number | null
          exploitation_strategies?: Json | null
          first_detected_at?: string | null
          id?: string
          is_validated?: boolean | null
          last_observed_at?: string | null
          novelty_score?: number | null
          occurrence_count?: number | null
          pattern_name: string
          pattern_signature: Json
          pattern_type: string
          source_domains?: string[] | null
          strategic_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detection_confidence?: number | null
          exploitation_strategies?: Json | null
          first_detected_at?: string | null
          id?: string
          is_validated?: boolean | null
          last_observed_at?: string | null
          novelty_score?: number | null
          occurrence_count?: number | null
          pattern_name?: string
          pattern_signature?: Json
          pattern_type?: string
          source_domains?: string[] | null
          strategic_value?: number | null
          user_id?: string
        }
        Relationships: []
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
      enrichment_jobs: {
        Row: {
          completed_at: string | null
          cost_cents: number | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          max_retries: number | null
          priority: number | null
          processing_time_ms: number | null
          profile_id: string | null
          result: Json | null
          retry_count: number | null
          source_config: Json | null
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_retries?: number | null
          priority?: number | null
          processing_time_ms?: number | null
          profile_id?: string | null
          result?: Json | null
          retry_count?: number | null
          source_config?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number | null
          priority?: number | null
          processing_time_ms?: number | null
          profile_id?: string | null
          result?: Json | null
          retry_count?: number | null
          source_config?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "enrichment_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "enrichment_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          enrichment_type: string
          error_message: string | null
          id: string
          max_attempts: number | null
          metadata: Json | null
          priority: number | null
          profile_id: string | null
          scheduled_for: string | null
          source_id: string | null
          source_type: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          enrichment_type: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          metadata?: Json | null
          priority?: number | null
          profile_id?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          enrichment_type?: string
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          metadata?: Json | null
          priority?: number | null
          profile_id?: string | null
          scheduled_for?: string | null
          source_id?: string | null
          source_type?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "enrichment_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "enrichment_queue_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_links: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          discovered_at: string | null
          evidence: Json | null
          id: string
          is_confirmed: boolean | null
          link_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          discovered_at?: string | null
          evidence?: Json | null
          id?: string
          is_confirmed?: boolean | null
          link_type: string
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          discovered_at?: string | null
          evidence?: Json | null
          id?: string
          is_confirmed?: boolean | null
          link_type?: string
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      entity_mentions: {
        Row: {
          confidence: number | null
          context: string | null
          created_at: string | null
          entity_name: string
          entity_type: string
          id: string
          mentioned_in_profile_id: string | null
          metadata: Json | null
          normalized_name: string | null
          sentiment: number | null
          source_id: string
          source_type: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          entity_name: string
          entity_type: string
          id?: string
          mentioned_in_profile_id?: string | null
          metadata?: Json | null
          normalized_name?: string | null
          sentiment?: number | null
          source_id: string
          source_type: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          mentioned_in_profile_id?: string | null
          metadata?: Json | null
          normalized_name?: string | null
          sentiment?: number | null
          source_id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "entity_mentions_mentioned_in_profile_id_fkey"
            columns: ["mentioned_in_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          category: string | null
          code: string
          context: Json | null
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string | null
          reference_id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          reference_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string | null
          reference_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      escalation_rules: {
        Row: {
          campaign_id: string | null
          comparison_operator: string | null
          cooldown_hours: number | null
          created_at: string | null
          escalation_action: string
          escalation_params: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          rule_name: string
          threshold_value: number | null
          trigger_count: number | null
          trigger_metric: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          comparison_operator?: string | null
          cooldown_hours?: number | null
          created_at?: string | null
          escalation_action: string
          escalation_params?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          rule_name: string
          threshold_value?: number | null
          trigger_count?: number | null
          trigger_metric: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          comparison_operator?: string | null
          cooldown_hours?: number | null
          created_at?: string | null
          escalation_action?: string
          escalation_params?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          rule_name?: string
          threshold_value?: number | null
          trigger_count?: number | null
          trigger_metric?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "autonomous_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          is_active: boolean | null
          profile_id: string | null
          reminder_days_before: number | null
          reminder_frequency:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          reminder_days_before?: number | null
          reminder_frequency?:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          reminder_days_before?: number | null
          reminder_frequency?:
            | Database["public"]["Enums"]["reminder_frequency"]
            | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "events_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extension_scrape_sessions: {
        Row: {
          comments_captured: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          pages_captured: number | null
          platform: string
          posts_captured: number | null
          processed_data: Json | null
          profile_url: string | null
          profile_username: string | null
          raw_data: Json | null
          status: string | null
          target_profile_id: string | null
          user_id: string
        }
        Insert: {
          comments_captured?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          pages_captured?: number | null
          platform: string
          posts_captured?: number | null
          processed_data?: Json | null
          profile_url?: string | null
          profile_username?: string | null
          raw_data?: Json | null
          status?: string | null
          target_profile_id?: string | null
          user_id: string
        }
        Update: {
          comments_captured?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          pages_captured?: number | null
          platform?: string
          posts_captured?: number | null
          processed_data?: Json | null
          profile_url?: string | null
          profile_username?: string | null
          raw_data?: Json | null
          status?: string | null
          target_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extension_scrape_sessions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extension_scrape_sessions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extension_scrape_sessions_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_documents: {
        Row: {
          ai_model_used: string | null
          bounding_box: Json | null
          created_at: string
          cropped_image_url: string | null
          document_subtype: string | null
          document_type: string
          extracted_contact_info: Json | null
          id: string
          linked_at: string | null
          linked_status: string
          match_confidence: number | null
          media_id: string | null
          profile_id: string | null
          raw_text: string | null
          source_mosaic_id: string | null
          structured_data: Json | null
          suggested_profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          bounding_box?: Json | null
          created_at?: string
          cropped_image_url?: string | null
          document_subtype?: string | null
          document_type: string
          extracted_contact_info?: Json | null
          id?: string
          linked_at?: string | null
          linked_status?: string
          match_confidence?: number | null
          media_id?: string | null
          profile_id?: string | null
          raw_text?: string | null
          source_mosaic_id?: string | null
          structured_data?: Json | null
          suggested_profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          bounding_box?: Json | null
          created_at?: string
          cropped_image_url?: string | null
          document_subtype?: string | null
          document_type?: string
          extracted_contact_info?: Json | null
          id?: string
          linked_at?: string | null
          linked_status?: string
          match_confidence?: number | null
          media_id?: string | null
          profile_id?: string | null
          raw_text?: string | null
          source_mosaic_id?: string | null
          structured_data?: Json | null
          suggested_profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_documents_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extracted_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extracted_documents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extracted_documents_suggested_profile_id_fkey"
            columns: ["suggested_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extracted_documents_suggested_profile_id_fkey"
            columns: ["suggested_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "extracted_documents_suggested_profile_id_fkey"
            columns: ["suggested_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      face_regions: {
        Row: {
          confidence: number | null
          created_at: string | null
          cropped_storage_path: string | null
          cropped_thumbnail_url: string | null
          descriptor: string | null
          detection_method: string
          embedding: string | null
          error_message: string | null
          features: Json | null
          height: number
          id: string
          job_id: string | null
          media_id: string
          profile_id: string | null
          shape: string
          status: string | null
          updated_at: string | null
          user_id: string
          verified: boolean | null
          width: number
          x: number
          y: number
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          cropped_storage_path?: string | null
          cropped_thumbnail_url?: string | null
          descriptor?: string | null
          detection_method?: string
          embedding?: string | null
          error_message?: string | null
          features?: Json | null
          height: number
          id?: string
          job_id?: string | null
          media_id: string
          profile_id?: string | null
          shape?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verified?: boolean | null
          width: number
          x: number
          y: number
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          cropped_storage_path?: string | null
          cropped_thumbnail_url?: string | null
          descriptor?: string | null
          detection_method?: string
          embedding?: string | null
          error_message?: string | null
          features?: Json | null
          height?: number
          id?: string
          job_id?: string | null
          media_id?: string
          profile_id?: string | null
          shape?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verified?: boolean | null
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "face_regions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_regions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "face_regions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "face_regions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      face_scan_jobs: {
        Row: {
          actual_cost_cents: number | null
          auto_tag_threshold: number | null
          completed_at: string | null
          confirm_threshold: number | null
          created_at: string | null
          current_batch_index: number | null
          estimated_cost_cents: number | null
          faces_auto_tagged: number | null
          faces_detected: number | null
          faces_matched: number | null
          faces_pending_review: number | null
          failed_items: number | null
          failed_media_ids: Json | null
          id: string
          job_type: string
          last_error: string | null
          last_progress_at: string | null
          max_retries: number | null
          media_ids: string[] | null
          model_key: string | null
          paused_at: string | null
          processed_items: number | null
          processed_media_ids: string[] | null
          profile_ids: string[] | null
          retry_count: number | null
          scan_mode: string | null
          skipped_items: number | null
          started_at: string | null
          status: string | null
          successful_items: number | null
          tokens_used: number | null
          total_items: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          auto_tag_threshold?: number | null
          completed_at?: string | null
          confirm_threshold?: number | null
          created_at?: string | null
          current_batch_index?: number | null
          estimated_cost_cents?: number | null
          faces_auto_tagged?: number | null
          faces_detected?: number | null
          faces_matched?: number | null
          faces_pending_review?: number | null
          failed_items?: number | null
          failed_media_ids?: Json | null
          id?: string
          job_type: string
          last_error?: string | null
          last_progress_at?: string | null
          max_retries?: number | null
          media_ids?: string[] | null
          model_key?: string | null
          paused_at?: string | null
          processed_items?: number | null
          processed_media_ids?: string[] | null
          profile_ids?: string[] | null
          retry_count?: number | null
          scan_mode?: string | null
          skipped_items?: number | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          tokens_used?: number | null
          total_items?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          auto_tag_threshold?: number | null
          completed_at?: string | null
          confirm_threshold?: number | null
          created_at?: string | null
          current_batch_index?: number | null
          estimated_cost_cents?: number | null
          faces_auto_tagged?: number | null
          faces_detected?: number | null
          faces_matched?: number | null
          faces_pending_review?: number | null
          failed_items?: number | null
          failed_media_ids?: Json | null
          id?: string
          job_type?: string
          last_error?: string | null
          last_progress_at?: string | null
          max_retries?: number | null
          media_ids?: string[] | null
          model_key?: string | null
          paused_at?: string | null
          processed_items?: number | null
          processed_media_ids?: string[] | null
          profile_ids?: string[] | null
          retry_count?: number | null
          scan_mode?: string | null
          skipped_items?: number | null
          started_at?: string | null
          status?: string | null
          successful_items?: number | null
          tokens_used?: number | null
          total_items?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      facial_analyses: {
        Row: {
          ai_model_used: string | null
          confidence_score: number | null
          created_at: string
          deception_indicators: Json | null
          emotional_timeline: Json | null
          id: string
          micro_expressions: Json | null
          profile_id: string
          raw_analysis: Json | null
          source_recording_id: string | null
          stress_indicators: Json | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string
          deception_indicators?: Json | null
          emotional_timeline?: Json | null
          id?: string
          micro_expressions?: Json | null
          profile_id: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          stress_indicators?: Json | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string
          deception_indicators?: Json | null
          emotional_timeline?: Json | null
          id?: string
          micro_expressions?: Json | null
          profile_id?: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          stress_indicators?: Json | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facial_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "facial_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "facial_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facial_analyses_source_recording_id_fkey"
            columns: ["source_recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      false_memory_tracking: {
        Row: {
          confidence_after: number | null
          confidence_before: number | null
          contradiction_detections: Json | null
          created_at: string
          id: string
          implantation_technique: string | null
          implanted_narrative: string
          memory_stability_score: number | null
          profile_id: string | null
          reality_testing_bypass_score: number | null
          reinforcement_schedule: Json | null
          success_status: string | null
          target_memory_description: string
          updated_at: string
          user_id: string
          verification_attempts: Json | null
        }
        Insert: {
          confidence_after?: number | null
          confidence_before?: number | null
          contradiction_detections?: Json | null
          created_at?: string
          id?: string
          implantation_technique?: string | null
          implanted_narrative: string
          memory_stability_score?: number | null
          profile_id?: string | null
          reality_testing_bypass_score?: number | null
          reinforcement_schedule?: Json | null
          success_status?: string | null
          target_memory_description: string
          updated_at?: string
          user_id: string
          verification_attempts?: Json | null
        }
        Update: {
          confidence_after?: number | null
          confidence_before?: number | null
          contradiction_detections?: Json | null
          created_at?: string
          id?: string
          implantation_technique?: string | null
          implanted_narrative?: string
          memory_stability_score?: number | null
          profile_id?: string | null
          reality_testing_bypass_score?: number | null
          reinforcement_schedule?: Json | null
          success_status?: string | null
          target_memory_description?: string
          updated_at?: string
          user_id?: string
          verification_attempts?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "false_memory_tracking_profile_id_fkey"
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
      field_access_controls: {
        Row: {
          audit_access: boolean | null
          created_at: string | null
          encryption_required: boolean | null
          field_name: string
          id: string
          mask_pattern: string | null
          required_clearance: string | null
          required_compartments: string[] | null
          required_roles: string[] | null
          table_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audit_access?: boolean | null
          created_at?: string | null
          encryption_required?: boolean | null
          field_name: string
          id?: string
          mask_pattern?: string | null
          required_clearance?: string | null
          required_compartments?: string[] | null
          required_roles?: string[] | null
          table_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audit_access?: boolean | null
          created_at?: string | null
          encryption_required?: boolean | null
          field_name?: string
          id?: string
          mask_pattern?: string | null
          required_clearance?: string | null
          required_compartments?: string[] | null
          required_roles?: string[] | null
          table_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      gait_analyses: {
        Row: {
          ai_model_used: string | null
          confidence_score: number | null
          created_at: string | null
          emotional_indicators: Json | null
          gait_pattern: Json | null
          health_indicators: Json | null
          id: string
          personality_indicators: Json | null
          profile_id: string | null
          source_recording_id: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string | null
          emotional_indicators?: Json | null
          gait_pattern?: Json | null
          health_indicators?: Json | null
          id?: string
          personality_indicators?: Json | null
          profile_id?: string | null
          source_recording_id?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_model_used?: string | null
          confidence_score?: number | null
          created_at?: string | null
          emotional_indicators?: Json | null
          gait_pattern?: Json | null
          health_indicators?: Json | null
          id?: string
          personality_indicators?: Json | null
          profile_id?: string | null
          source_recording_id?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gait_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gait_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gait_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gait_analyses_source_recording_id_fkey"
            columns: ["source_recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      gait_profiles: {
        Row: {
          anomalies: Json | null
          created_at: string
          feature_vector: number[] | null
          features: Json
          id: string
          profile_id: string
          quality_score: number | null
          total_steps: number | null
          updated_at: string
          user_id: string
          walking_duration_ms: number | null
        }
        Insert: {
          anomalies?: Json | null
          created_at?: string
          feature_vector?: number[] | null
          features?: Json
          id?: string
          profile_id: string
          quality_score?: number | null
          total_steps?: number | null
          updated_at?: string
          user_id: string
          walking_duration_ms?: number | null
        }
        Update: {
          anomalies?: Json | null
          created_at?: string
          feature_vector?: number[] | null
          features?: Json
          id?: string
          profile_id?: string
          quality_score?: number | null
          total_steps?: number | null
          updated_at?: string
          user_id?: string
          walking_duration_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gait_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gait_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gait_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          file_size: number | null
          file_url: string | null
          format: string | null
          id: string
          metadata: Json | null
          report_type: string
          schedule_id: string | null
          storage_path: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          id?: string
          metadata?: Json | null
          report_type: string
          schedule_id?: string | null
          storage_path?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          file_url?: string | null
          format?: string | null
          id?: string
          metadata?: Json | null
          report_type?: string
          schedule_id?: string | null
          storage_path?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "reports_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          created_at: string | null
          description: string | null
          geofence_type: string | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          notification_enabled: boolean | null
          notification_message: string | null
          profile_id: string | null
          radius_meters: number
          trigger_count: number | null
          trigger_on_enter: boolean | null
          trigger_on_exit: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          geofence_type?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          notification_enabled?: boolean | null
          notification_message?: string | null
          profile_id?: string | null
          radius_meters?: number
          trigger_count?: number | null
          trigger_on_enter?: boolean | null
          trigger_on_exit?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          geofence_type?: string | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          notification_enabled?: boolean | null
          notification_message?: string | null
          profile_id?: string | null
          radius_meters?: number
          trigger_count?: number | null
          trigger_on_enter?: boolean | null
          trigger_on_exit?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "geofences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "geofences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geopolitical_events: {
        Row: {
          affected_commodities: Json | null
          affected_companies: Json | null
          affected_currencies: Json | null
          affected_sectors: Json | null
          countries: string[]
          created_at: string
          event_name: string
          event_type: string
          id: string
          investment_implications: Json | null
          key_actors: Json | null
          last_escalation_at: string | null
          last_news_at: string | null
          monitoring_priority: string | null
          news_item_count: number | null
          opportunity_score: number | null
          regions: string[]
          resolved_at: string | null
          risk_score: number | null
          severity_level: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          timeline: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_commodities?: Json | null
          affected_companies?: Json | null
          affected_currencies?: Json | null
          affected_sectors?: Json | null
          countries: string[]
          created_at?: string
          event_name: string
          event_type: string
          id?: string
          investment_implications?: Json | null
          key_actors?: Json | null
          last_escalation_at?: string | null
          last_news_at?: string | null
          monitoring_priority?: string | null
          news_item_count?: number | null
          opportunity_score?: number | null
          regions: string[]
          resolved_at?: string | null
          risk_score?: number | null
          severity_level?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          timeline?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_commodities?: Json | null
          affected_companies?: Json | null
          affected_currencies?: Json | null
          affected_sectors?: Json | null
          countries?: string[]
          created_at?: string
          event_name?: string
          event_type?: string
          id?: string
          investment_implications?: Json | null
          key_actors?: Json | null
          last_escalation_at?: string | null
          last_news_at?: string | null
          monitoring_priority?: string | null
          news_item_count?: number | null
          opportunity_score?: number | null
          regions?: string[]
          resolved_at?: string | null
          risk_score?: number | null
          severity_level?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          timeline?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_ideas: {
        Row: {
          ai_reasoning: string | null
          category: string | null
          created_at: string
          description: string | null
          given_date: string | null
          id: string
          is_given: boolean | null
          occasion: string | null
          price_range: string | null
          profile_id: string
          source: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          ai_reasoning?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          given_date?: string | null
          id?: string
          is_given?: boolean | null
          occasion?: string | null
          price_range?: string | null
          profile_id: string
          source?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          ai_reasoning?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          given_date?: string | null
          id?: string
          is_given?: boolean | null
          occasion?: string | null
          price_range?: string | null
          profile_id?: string
          source?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_ideas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gift_ideas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "gift_ideas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_config: {
        Row: {
          access_token: string | null
          contacts_synced: number | null
          created_at: string
          email: string | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          contacts_synced?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          contacts_synced?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_config: {
        Row: {
          access_token: string | null
          auto_sync_enabled: boolean | null
          calendar_ids: string[] | null
          created_at: string
          email: string | null
          events_synced: number | null
          id: string
          last_sync_at: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          sync_interval_minutes: number | null
          sync_status: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          calendar_ids?: string[] | null
          created_at?: string
          email?: string | null
          events_synced?: number | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_interval_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync_enabled?: boolean | null
          calendar_ids?: string[] | null
          created_at?: string
          email?: string | null
          events_synced?: number | null
          id?: string
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          sync_interval_minutes?: number | null
          sync_status?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hardware_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          auto_resolved: boolean | null
          created_at: string
          description: string | null
          device_id: string | null
          id: string
          is_acknowledged: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          source_data: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          auto_resolved?: boolean | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          is_acknowledged?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          source_data?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          auto_resolved?: boolean | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          is_acknowledged?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          source_data?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_analytics_snapshots: {
        Row: {
          alert_summary: Json | null
          created_at: string
          device_stats: Json | null
          fusion_summary: Json | null
          id: string
          metrics: Json
          period_end: string
          period_start: string
          snapshot_type: string
          trend_indicators: Json | null
          user_id: string
        }
        Insert: {
          alert_summary?: Json | null
          created_at?: string
          device_stats?: Json | null
          fusion_summary?: Json | null
          id?: string
          metrics?: Json
          period_end: string
          period_start: string
          snapshot_type: string
          trend_indicators?: Json | null
          user_id: string
        }
        Update: {
          alert_summary?: Json | null
          created_at?: string
          device_stats?: Json | null
          fusion_summary?: Json | null
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          snapshot_type?: string
          trend_indicators?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      hardware_commands: {
        Row: {
          acknowledged_at: string | null
          command_data: Json
          command_type: string
          completed_at: string | null
          created_at: string | null
          device_id: string
          error_message: string | null
          expires_at: string | null
          id: string
          max_retries: number | null
          mission_id: string | null
          priority: number | null
          response: Json | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          command_data: Json
          command_type: string
          completed_at?: string | null
          created_at?: string | null
          device_id: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_retries?: number | null
          mission_id?: string | null
          priority?: number | null
          response?: Json | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          command_data?: Json
          command_type?: string
          completed_at?: string | null
          created_at?: string | null
          device_id?: string
          error_message?: string | null
          expires_at?: string | null
          id?: string
          max_retries?: number | null
          mission_id?: string | null
          priority?: number | null
          response?: Json | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hardware_commands_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware_devices: {
        Row: {
          battery_level: number | null
          capabilities: Json | null
          configuration: Json | null
          created_at: string | null
          device_id: string
          device_model: string | null
          device_name: string | null
          device_type: string
          firmware_version: string | null
          health_status: string | null
          id: string
          is_online: boolean | null
          last_health_check_at: string | null
          last_seen_at: string | null
          location: Json | null
          location_name: string | null
          maintenance_due_at: string | null
          metadata: Json | null
          signal_strength: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          battery_level?: number | null
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          device_id: string
          device_model?: string | null
          device_name?: string | null
          device_type: string
          firmware_version?: string | null
          health_status?: string | null
          id?: string
          is_online?: boolean | null
          last_health_check_at?: string | null
          last_seen_at?: string | null
          location?: Json | null
          location_name?: string | null
          maintenance_due_at?: string | null
          metadata?: Json | null
          signal_strength?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          battery_level?: number | null
          capabilities?: Json | null
          configuration?: Json | null
          created_at?: string | null
          device_id?: string
          device_model?: string | null
          device_name?: string | null
          device_type?: string
          firmware_version?: string | null
          health_status?: string | null
          id?: string
          is_online?: boolean | null
          last_health_check_at?: string | null
          last_seen_at?: string | null
          location?: Json | null
          location_name?: string | null
          maintenance_due_at?: string | null
          metadata?: Json | null
          signal_strength?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hardware_telemetry: {
        Row: {
          data: Json
          device_id: string
          id: string
          location: Json | null
          priority: string | null
          processed: boolean | null
          recorded_at: string | null
          telemetry_type: string
          user_id: string
        }
        Insert: {
          data: Json
          device_id: string
          id?: string
          location?: Json | null
          priority?: string | null
          processed?: boolean | null
          recorded_at?: string | null
          telemetry_type: string
          user_id: string
        }
        Update: {
          data?: Json
          device_id?: string
          id?: string
          location?: Json | null
          priority?: string | null
          processed?: boolean | null
          recorded_at?: string | null
          telemetry_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_blueprints: {
        Row: {
          anchor_experiences: Json | null
          aspirational_identity: Json | null
          created_at: string
          current_identity: Json | null
          id: string
          identity_conflicts: Json | null
          integration_opportunities: Json | null
          malleability_score: number | null
          profile_id: string | null
          rejected_identity: Json | null
          shadow_identity: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_experiences?: Json | null
          aspirational_identity?: Json | null
          created_at?: string
          current_identity?: Json | null
          id?: string
          identity_conflicts?: Json | null
          integration_opportunities?: Json | null
          malleability_score?: number | null
          profile_id?: string | null
          rejected_identity?: Json | null
          shadow_identity?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_experiences?: Json | null
          aspirational_identity?: Json | null
          created_at?: string
          current_identity?: Json | null
          id?: string
          identity_conflicts?: Json | null
          integration_opportunities?: Json | null
          malleability_score?: number | null
          profile_id?: string | null
          rejected_identity?: Json | null
          shadow_identity?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_blueprints_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_destabilization_logs: {
        Row: {
          created_at: string | null
          delivery_context: Json | null
          deployed_at: string | null
          effectiveness_score: number | null
          id: string
          intensity_level: string | null
          profile_id: string | null
          response_observed: string | null
          script_content: string | null
          technique_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_context?: Json | null
          deployed_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intensity_level?: string | null
          profile_id?: string | null
          response_observed?: string | null
          script_content?: string | null
          technique_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_context?: Json | null
          deployed_at?: string | null
          effectiveness_score?: number | null
          id?: string
          intensity_level?: string | null
          profile_id?: string | null
          response_observed?: string | null
          script_content?: string | null
          technique_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "identity_destabilization_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      import_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number | null
          errors: Json | null
          id: string
          imported_items: number | null
          metadata: Json | null
          processed_items: number | null
          skipped_items: number | null
          source: string
          started_at: string | null
          status: string | null
          total_items: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          errors?: Json | null
          id?: string
          imported_items?: number | null
          metadata?: Json | null
          processed_items?: number | null
          skipped_items?: number | null
          source: string
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          errors?: Json | null
          id?: string
          imported_items?: number | null
          metadata?: Json | null
          processed_items?: number | null
          skipped_items?: number | null
          source?: string
          started_at?: string | null
          status?: string | null
          total_items?: number | null
          user_id?: string
        }
        Relationships: []
      }
      infinite_awareness: {
        Row: {
          awareness_score: number | null
          awareness_type: string
          blind_spot_elimination: Json | null
          created_at: string
          dimensional_coverage: Json | null
          id: string
          last_expansion_at: string | null
          penetration_depth: number | null
          perception_range: Json | null
          signal_sources: Json | null
          temporal_range: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_score?: number | null
          awareness_type: string
          blind_spot_elimination?: Json | null
          created_at?: string
          dimensional_coverage?: Json | null
          id?: string
          last_expansion_at?: string | null
          penetration_depth?: number | null
          perception_range?: Json | null
          signal_sources?: Json | null
          temporal_range?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_score?: number | null
          awareness_type?: string
          blind_spot_elimination?: Json | null
          created_at?: string
          dimensional_coverage?: Json | null
          id?: string
          last_expansion_at?: string | null
          penetration_depth?: number | null
          perception_range?: Json | null
          signal_sources?: Json | null
          temporal_range?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      infinite_protocols: {
        Row: {
          avg_execution_time_ms: number | null
          created_at: string
          execution_count: number | null
          execution_graph: Json | null
          id: string
          is_active: boolean | null
          priority: number | null
          protocol_class: string
          protocol_name: string
          resource_bounds: Json | null
          scaling_rules: Json | null
          success_rate: number | null
          trigger_matrix: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_execution_time_ms?: number | null
          created_at?: string
          execution_count?: number | null
          execution_graph?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          protocol_class: string
          protocol_name: string
          resource_bounds?: Json | null
          scaling_rules?: Json | null
          success_rate?: number | null
          trigger_matrix?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_execution_time_ms?: number | null
          created_at?: string
          execution_count?: number | null
          execution_graph?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          protocol_class?: string
          protocol_name?: string
          resource_bounds?: Json | null
          scaling_rules?: Json | null
          success_rate?: number | null
          trigger_matrix?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      influence_actions: {
        Row: {
          action_description: string | null
          action_title: string
          action_type: string
          actual_channel: string | null
          completed_at: string | null
          created_at: string
          effectiveness_rating: number | null
          id: string
          notes: string | null
          optimal_window_end: string | null
          optimal_window_start: string | null
          outcome: string | null
          priority: string | null
          profile_id: string
          reminder_before_minutes: number | null
          response_received: string | null
          scheduled_for: string | null
          status: string | null
          strategy_id: string | null
          suggested_channel: string | null
          suggested_message: string | null
          talking_points: string[] | null
          things_to_avoid: string[] | null
          things_to_mention: string[] | null
          trigger_context: Json | null
          trigger_event: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_description?: string | null
          action_title: string
          action_type: string
          actual_channel?: string | null
          completed_at?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          optimal_window_end?: string | null
          optimal_window_start?: string | null
          outcome?: string | null
          priority?: string | null
          profile_id: string
          reminder_before_minutes?: number | null
          response_received?: string | null
          scheduled_for?: string | null
          status?: string | null
          strategy_id?: string | null
          suggested_channel?: string | null
          suggested_message?: string | null
          talking_points?: string[] | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          trigger_context?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_description?: string | null
          action_title?: string
          action_type?: string
          actual_channel?: string | null
          completed_at?: string | null
          created_at?: string
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          optimal_window_end?: string | null
          optimal_window_start?: string | null
          outcome?: string | null
          priority?: string | null
          profile_id?: string
          reminder_before_minutes?: number | null
          response_received?: string | null
          scheduled_for?: string | null
          status?: string | null
          strategy_id?: string | null
          suggested_channel?: string | null
          suggested_message?: string | null
          talking_points?: string[] | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          trigger_context?: Json | null
          trigger_event?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_actions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influence_actions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "influence_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_campaigns: {
        Row: {
          adaptation_history: Json | null
          completed_at: string | null
          compliance_achieved: boolean | null
          control_group: boolean | null
          created_at: string
          description: string | null
          executed_touches: Json | null
          id: string
          lessons_learned: string[] | null
          name: string
          next_touch_at: string | null
          objective: string
          optimal_windows: Json | null
          outcome_value: Json | null
          planned_touches: Json | null
          primary_principle: string | null
          principles_applied: string[] | null
          priority: number | null
          profile_id: string
          resistance_patterns: Json | null
          started_at: string | null
          status: string | null
          updated_at: string
          urgency_level: string | null
          user_id: string
          variant_id: string | null
        }
        Insert: {
          adaptation_history?: Json | null
          completed_at?: string | null
          compliance_achieved?: boolean | null
          control_group?: boolean | null
          created_at?: string
          description?: string | null
          executed_touches?: Json | null
          id?: string
          lessons_learned?: string[] | null
          name: string
          next_touch_at?: string | null
          objective: string
          optimal_windows?: Json | null
          outcome_value?: Json | null
          planned_touches?: Json | null
          primary_principle?: string | null
          principles_applied?: string[] | null
          priority?: number | null
          profile_id: string
          resistance_patterns?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_level?: string | null
          user_id: string
          variant_id?: string | null
        }
        Update: {
          adaptation_history?: Json | null
          completed_at?: string | null
          compliance_achieved?: boolean | null
          control_group?: boolean | null
          created_at?: string
          description?: string | null
          executed_touches?: Json | null
          id?: string
          lessons_learned?: string[] | null
          name?: string
          next_touch_at?: string | null
          objective?: string
          optimal_windows?: Json | null
          outcome_value?: Json | null
          planned_touches?: Json | null
          primary_principle?: string | null
          principles_applied?: string[] | null
          priority?: number | null
          profile_id?: string
          resistance_patterns?: Json | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_cascades: {
        Row: {
          cascade_name: string
          cascade_type: string
          cascade_velocity: number | null
          completed_at: string | null
          created_at: string | null
          current_phase: string | null
          current_reach: number | null
          id: string
          infection_rate: number | null
          max_reach: number | null
          origin_profile_id: string | null
          predicted_peak_at: string | null
          propagation_model: string | null
          propagation_params: Json | null
          recovery_rate: number | null
          started_at: string | null
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cascade_name: string
          cascade_type: string
          cascade_velocity?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_reach?: number | null
          id?: string
          infection_rate?: number | null
          max_reach?: number | null
          origin_profile_id?: string | null
          predicted_peak_at?: string | null
          propagation_model?: string | null
          propagation_params?: Json | null
          recovery_rate?: number | null
          started_at?: string | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cascade_name?: string
          cascade_type?: string
          cascade_velocity?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          current_reach?: number | null
          id?: string
          infection_rate?: number | null
          max_reach?: number | null
          origin_profile_id?: string | null
          predicted_peak_at?: string | null
          propagation_model?: string | null
          propagation_params?: Json | null
          recovery_rate?: number | null
          started_at?: string | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_cascades_origin_profile_id_fkey"
            columns: ["origin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_paths: {
        Row: {
          bottleneck_nodes: Json | null
          calculated_at: string
          created_at: string
          id: string
          influence_strength: number | null
          path_nodes: Json
          path_type: string | null
          source_profile_id: string | null
          target_profile_id: string | null
          user_id: string
        }
        Insert: {
          bottleneck_nodes?: Json | null
          calculated_at?: string
          created_at?: string
          id?: string
          influence_strength?: number | null
          path_nodes?: Json
          path_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id: string
        }
        Update: {
          bottleneck_nodes?: Json | null
          calculated_at?: string
          created_at?: string
          id?: string
          influence_strength?: number | null
          path_nodes?: Json
          path_type?: string | null
          source_profile_id?: string | null
          target_profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_paths_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      influence_simulations: {
        Row: {
          created_at: string | null
          id: string
          max_reach_achieved: number | null
          optimal_seeds_suggested: string[] | null
          parameters: Json | null
          propagation_model: string | null
          results: Json
          seed_profile_ids: string[]
          simulation_name: string | null
          simulation_steps: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_reach_achieved?: number | null
          optimal_seeds_suggested?: string[] | null
          parameters?: Json | null
          propagation_model?: string | null
          results?: Json
          seed_profile_ids: string[]
          simulation_name?: string | null
          simulation_steps?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_reach_achieved?: number | null
          optimal_seeds_suggested?: string[] | null
          parameters?: Json | null
          propagation_model?: string | null
          results?: Json
          seed_profile_ids?: string[]
          simulation_name?: string | null
          simulation_steps?: number | null
          user_id?: string
        }
        Relationships: []
      }
      influence_strategies: {
        Row: {
          abort_signals: string[] | null
          ai_model_used: string | null
          closing_scripts: string[] | null
          context: string | null
          created_at: string
          duration_estimate: string | null
          emotional_hooks: string[] | null
          executed_at: string | null
          execution_steps: Json | null
          fallback_strategy: string | null
          follow_up_steps: Json | null
          goal_description: string | null
          goal_type: string
          id: string
          lessons_learned: Json | null
          methodologies_applied: string[] | null
          objection_handlers: Json | null
          opening_scripts: string[] | null
          optimal_timing: Json | null
          outcome: string | null
          outcome_rating: number | null
          preparation_steps: Json | null
          profile_id: string
          recovery_phrases: string[] | null
          risks: Json | null
          status: string | null
          strategy_name: string
          strategy_summary: string | null
          success_probability: number | null
          things_to_avoid: string[] | null
          things_to_mention: string[] | null
          transition_phrases: string[] | null
          updated_at: string
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          abort_signals?: string[] | null
          ai_model_used?: string | null
          closing_scripts?: string[] | null
          context?: string | null
          created_at?: string
          duration_estimate?: string | null
          emotional_hooks?: string[] | null
          executed_at?: string | null
          execution_steps?: Json | null
          fallback_strategy?: string | null
          follow_up_steps?: Json | null
          goal_description?: string | null
          goal_type: string
          id?: string
          lessons_learned?: Json | null
          methodologies_applied?: string[] | null
          objection_handlers?: Json | null
          opening_scripts?: string[] | null
          optimal_timing?: Json | null
          outcome?: string | null
          outcome_rating?: number | null
          preparation_steps?: Json | null
          profile_id: string
          recovery_phrases?: string[] | null
          risks?: Json | null
          status?: string | null
          strategy_name: string
          strategy_summary?: string | null
          success_probability?: number | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          abort_signals?: string[] | null
          ai_model_used?: string | null
          closing_scripts?: string[] | null
          context?: string | null
          created_at?: string
          duration_estimate?: string | null
          emotional_hooks?: string[] | null
          executed_at?: string | null
          execution_steps?: Json | null
          fallback_strategy?: string | null
          follow_up_steps?: Json | null
          goal_description?: string | null
          goal_type?: string
          id?: string
          lessons_learned?: Json | null
          methodologies_applied?: string[] | null
          objection_handlers?: Json | null
          opening_scripts?: string[] | null
          optimal_timing?: Json | null
          outcome?: string | null
          outcome_rating?: number | null
          preparation_steps?: Json | null
          profile_id?: string
          recovery_phrases?: string[] | null
          risks?: Json | null
          status?: string | null
          strategy_name?: string
          strategy_summary?: string | null
          success_probability?: number | null
          things_to_avoid?: string[] | null
          things_to_mention?: string[] | null
          transition_phrases?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "influence_strategies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          integration_type: string
          is_enabled: boolean | null
          last_used_at: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_type: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_type?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      integration_guides: {
        Row: {
          api_key_format: string | null
          api_key_location: string | null
          api_key_steps: Json | null
          category: string
          common_errors: Json | null
          created_at: string | null
          difficulty_level: string | null
          display_name: string
          documentation_url: string | null
          estimated_setup_time: string | null
          expected_response: string | null
          features_enabled: Json | null
          free_tier_limits: string | null
          has_connector: boolean | null
          id: string
          integration_id: string
          pricing_model: string | null
          pricing_url: string | null
          registration_steps: Json | null
          registration_url: string | null
          requires_oauth: boolean | null
          support_url: string | null
          test_endpoint: string | null
          test_headers: Json | null
          test_method: string | null
          updated_at: string | null
          usage_description: string | null
        }
        Insert: {
          api_key_format?: string | null
          api_key_location?: string | null
          api_key_steps?: Json | null
          category?: string
          common_errors?: Json | null
          created_at?: string | null
          difficulty_level?: string | null
          display_name: string
          documentation_url?: string | null
          estimated_setup_time?: string | null
          expected_response?: string | null
          features_enabled?: Json | null
          free_tier_limits?: string | null
          has_connector?: boolean | null
          id?: string
          integration_id: string
          pricing_model?: string | null
          pricing_url?: string | null
          registration_steps?: Json | null
          registration_url?: string | null
          requires_oauth?: boolean | null
          support_url?: string | null
          test_endpoint?: string | null
          test_headers?: Json | null
          test_method?: string | null
          updated_at?: string | null
          usage_description?: string | null
        }
        Update: {
          api_key_format?: string | null
          api_key_location?: string | null
          api_key_steps?: Json | null
          category?: string
          common_errors?: Json | null
          created_at?: string | null
          difficulty_level?: string | null
          display_name?: string
          documentation_url?: string | null
          estimated_setup_time?: string | null
          expected_response?: string | null
          features_enabled?: Json | null
          free_tier_limits?: string | null
          has_connector?: boolean | null
          id?: string
          integration_id?: string
          pricing_model?: string | null
          pricing_url?: string | null
          registration_steps?: Json | null
          registration_url?: string | null
          requires_oauth?: boolean | null
          support_url?: string | null
          test_endpoint?: string | null
          test_headers?: Json | null
          test_method?: string | null
          updated_at?: string | null
          usage_description?: string | null
        }
        Relationships: []
      }
      integration_test_history: {
        Row: {
          created_at: string | null
          id: string
          integration_id: string
          message: string | null
          response_time_ms: number | null
          secret_key: string
          success: boolean
          tested_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          integration_id: string
          message?: string | null
          response_time_ms?: number | null
          secret_key: string
          success: boolean
          tested_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          integration_id?: string
          message?: string | null
          response_time_ms?: number | null
          secret_key?: string
          success?: boolean
          tested_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      interaction_biometrics: {
        Row: {
          avg_heart_rate: number | null
          calories_burned: number | null
          created_at: string
          device_source: string | null
          duration_minutes: number | null
          energy_level: number | null
          heart_rate_variability: number | null
          id: string
          interaction_date: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_heart_rate: number | null
          min_heart_rate: number | null
          notes: string | null
          profile_id: string | null
          raw_data: Json | null
          steps_during: number | null
          stress_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          device_source?: string | null
          duration_minutes?: number | null
          energy_level?: number | null
          heart_rate_variability?: number | null
          id?: string
          interaction_date?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_heart_rate?: number | null
          min_heart_rate?: number | null
          notes?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          steps_during?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          device_source?: string | null
          duration_minutes?: number | null
          energy_level?: number | null
          heart_rate_variability?: number | null
          id?: string
          interaction_date?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          max_heart_rate?: number | null
          min_heart_rate?: number | null
          notes?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          steps_during?: number | null
          stress_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interaction_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "interaction_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "interaction_biometrics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_playbooks: {
        Row: {
          channel_recommendations: string[] | null
          churn_prediction_id: string | null
          completed_at: string | null
          created_at: string | null
          escalation_path: Json | null
          gift_suggestions: Json | null
          id: string
          intervention_steps: Json | null
          outcome: string | null
          outcome_notes: string | null
          outreach_scripts: Json | null
          playbook_type: string | null
          profile_id: string | null
          risk_level: string | null
          started_at: string | null
          status: string | null
          success_probability: number | null
          timing_recommendations: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_recommendations?: string[] | null
          churn_prediction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          escalation_path?: Json | null
          gift_suggestions?: Json | null
          id?: string
          intervention_steps?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          outreach_scripts?: Json | null
          playbook_type?: string | null
          profile_id?: string | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          timing_recommendations?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_recommendations?: string[] | null
          churn_prediction_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          escalation_path?: Json | null
          gift_suggestions?: Json | null
          id?: string
          intervention_steps?: Json | null
          outcome?: string | null
          outcome_notes?: string | null
          outreach_scripts?: Json | null
          playbook_type?: string | null
          profile_id?: string | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          success_probability?: number | null
          timing_recommendations?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_playbooks_churn_prediction_id_fkey"
            columns: ["churn_prediction_id"]
            isOneToOne: false
            referencedRelation: "churn_predictions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_playbooks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_triggers: {
        Row: {
          cooldown_hours: number | null
          created_at: string | null
          id: string
          intervention_action: string
          intervention_params: Json | null
          is_active: boolean | null
          last_triggered_at: string | null
          priority: number | null
          profile_id: string | null
          success_count: number | null
          trigger_config: Json
          trigger_count: number | null
          trigger_name: string
          trigger_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          intervention_action: string
          intervention_params?: Json | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          profile_id?: string | null
          success_count?: number | null
          trigger_config: Json
          trigger_count?: number | null
          trigger_name: string
          trigger_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          intervention_action?: string
          intervention_params?: Json | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          priority?: number | null
          profile_id?: string | null
          success_count?: number | null
          trigger_config?: Json
          trigger_count?: number | null
          trigger_name?: string
          trigger_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "intervention_triggers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_opportunities: {
        Row: {
          action: string
          actioned_at: string | null
          ai_reasoning: Json | null
          asset_class: string
          asset_identifier: string | null
          confidence_score: number
          conviction_level: string | null
          created_at: string
          description: string | null
          entry_price_suggestion: number | null
          expected_roi_pct: number | null
          historical_pattern_match: number | null
          id: string
          max_drawdown_pct: number | null
          opportunity_type: string
          outcome: Json | null
          risk_factors: Json | null
          risk_level: string
          sector: string | null
          source_agreement_score: number | null
          status: string | null
          stop_loss: number | null
          supporting_events: string[] | null
          supporting_news: string[] | null
          supporting_signals: string[] | null
          target_price: number | null
          thesis: string | null
          time_horizon_days: number | null
          title: string
          updated_at: string
          urgency: string | null
          user_id: string
          valid_from: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          action: string
          actioned_at?: string | null
          ai_reasoning?: Json | null
          asset_class: string
          asset_identifier?: string | null
          confidence_score: number
          conviction_level?: string | null
          created_at?: string
          description?: string | null
          entry_price_suggestion?: number | null
          expected_roi_pct?: number | null
          historical_pattern_match?: number | null
          id?: string
          max_drawdown_pct?: number | null
          opportunity_type: string
          outcome?: Json | null
          risk_factors?: Json | null
          risk_level: string
          sector?: string | null
          source_agreement_score?: number | null
          status?: string | null
          stop_loss?: number | null
          supporting_events?: string[] | null
          supporting_news?: string[] | null
          supporting_signals?: string[] | null
          target_price?: number | null
          thesis?: string | null
          time_horizon_days?: number | null
          title: string
          updated_at?: string
          urgency?: string | null
          user_id: string
          valid_from?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          action?: string
          actioned_at?: string | null
          ai_reasoning?: Json | null
          asset_class?: string
          asset_identifier?: string | null
          confidence_score?: number
          conviction_level?: string | null
          created_at?: string
          description?: string | null
          entry_price_suggestion?: number | null
          expected_roi_pct?: number | null
          historical_pattern_match?: number | null
          id?: string
          max_drawdown_pct?: number | null
          opportunity_type?: string
          outcome?: Json | null
          risk_factors?: Json | null
          risk_level?: string
          sector?: string | null
          source_agreement_score?: number | null
          status?: string | null
          stop_loss?: number | null
          supporting_events?: string[] | null
          supporting_news?: string[] | null
          supporting_signals?: string[] | null
          target_price?: number | null
          thesis?: string | null
          time_horizon_days?: number | null
          title?: string
          updated_at?: string
          urgency?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: []
      }
      item_category_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          specification_schema: Json
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          specification_schema?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          specification_schema?: Json
        }
        Relationships: []
      }
      key_rotation_schedule: {
        Row: {
          auto_rotate: boolean | null
          created_at: string | null
          id: string
          key_name: string
          last_rotated_at: string | null
          next_rotation_at: string | null
          rotation_interval_days: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_rotate?: boolean | null
          created_at?: string | null
          id?: string
          key_name: string
          last_rotated_at?: string | null
          next_rotation_at?: string | null
          rotation_interval_days?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_rotate?: boolean | null
          created_at?: string | null
          id?: string
          key_name?: string
          last_rotated_at?: string | null
          next_rotation_at?: string | null
          rotation_interval_days?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      keystroke_profiles: {
        Row: {
          created_at: string
          feature_vector: number[] | null
          features: Json
          id: string
          profile_id: string
          quality_score: number | null
          sample_text: string | null
          total_characters: number | null
          total_duration_ms: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_vector?: number[] | null
          features?: Json
          id?: string
          profile_id: string
          quality_score?: number | null
          sample_text?: string | null
          total_characters?: number | null
          total_duration_ms?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_vector?: number[] | null
          features?: Json
          id?: string
          profile_id?: string
          quality_score?: number | null
          sample_text?: string | null
          total_characters?: number | null
          total_duration_ms?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keystroke_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "keystroke_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "keystroke_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_detections: {
        Row: {
          context_text: string | null
          created_at: string
          dismissed: boolean | null
          id: string
          keyword_matched: string
          occurrence_count: number | null
          profile_id: string | null
          review_notes: string | null
          reviewed: boolean | null
          reviewed_at: string | null
          sentiment: string | null
          source_id: string
          source_type: string
          timestamp_in_source: string | null
          urgency: string | null
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          context_text?: string | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          keyword_matched: string
          occurrence_count?: number | null
          profile_id?: string | null
          review_notes?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          sentiment?: string | null
          source_id: string
          source_type: string
          timestamp_in_source?: string | null
          urgency?: string | null
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          context_text?: string | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          keyword_matched?: string
          occurrence_count?: number | null
          profile_id?: string | null
          review_notes?: string | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          sentiment?: string | null
          source_id?: string
          source_type?: string
          timestamp_in_source?: string | null
          urgency?: string | null
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keyword_detections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "keyword_detections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "keyword_detections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "keyword_detections_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "keyword_watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_watchlists: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          match_case_sensitive: boolean | null
          match_whole_word: boolean | null
          name: string
          notify_on_match: boolean | null
          priority: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          match_case_sensitive?: boolean | null
          match_whole_word?: boolean | null
          name: string
          notify_on_match?: boolean | null
          priority?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          match_case_sensitive?: boolean | null
          match_whole_word?: boolean | null
          name?: string
          notify_on_match?: boolean | null
          priority?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learned_helplessness_tracking: {
        Row: {
          attribution_style: Json | null
          created_at: string
          escape_attempt_detections: Json | null
          helplessness_score: number | null
          hopelessness_indicators: Json | null
          id: string
          initiative_blocking_events: Json | null
          no_win_situations_deployed: Json | null
          passivity_trend: Json | null
          profile_id: string | null
          response_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attribution_style?: Json | null
          created_at?: string
          escape_attempt_detections?: Json | null
          helplessness_score?: number | null
          hopelessness_indicators?: Json | null
          id?: string
          initiative_blocking_events?: Json | null
          no_win_situations_deployed?: Json | null
          passivity_trend?: Json | null
          profile_id?: string | null
          response_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attribution_style?: Json | null
          created_at?: string
          escape_attempt_detections?: Json | null
          helplessness_score?: number | null
          hopelessness_indicators?: Json | null
          id?: string
          initiative_blocking_events?: Json | null
          no_win_situations_deployed?: Json | null
          passivity_trend?: Json | null
          profile_id?: string | null
          response_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "learned_helplessness_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      life_trajectory_predictions: {
        Row: {
          career_trajectory: Json | null
          confidence_score: number | null
          created_at: string | null
          crisis_early_warnings: Json | null
          financial_trajectory: Json | null
          health_trajectory: Json | null
          id: string
          life_events_sequence: Json | null
          predicted_outcomes: Json | null
          prediction_type: string | null
          profile_id: string | null
          relationship_trajectory: Json | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
          vulnerability_windows: Json | null
        }
        Insert: {
          career_trajectory?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          crisis_early_warnings?: Json | null
          financial_trajectory?: Json | null
          health_trajectory?: Json | null
          id?: string
          life_events_sequence?: Json | null
          predicted_outcomes?: Json | null
          prediction_type?: string | null
          profile_id?: string | null
          relationship_trajectory?: Json | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
          vulnerability_windows?: Json | null
        }
        Update: {
          career_trajectory?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          crisis_early_warnings?: Json | null
          financial_trajectory?: Json | null
          health_trajectory?: Json | null
          id?: string
          life_events_sequence?: Json | null
          predicted_outcomes?: Json | null
          prediction_type?: string | null
          profile_id?: string | null
          relationship_trajectory?: Json | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
          vulnerability_windows?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "life_trajectory_predictions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_transcriptions: {
        Row: {
          audio_quality_score: number | null
          created_at: string | null
          id: string
          is_commitment: boolean | null
          is_question: boolean | null
          keywords: string[] | null
          language: string | null
          match_confidence: number | null
          matched_profile_id: string | null
          recording_id: string | null
          sentiment_score: number | null
          session_id: string
          speaker_label: string | null
          text: string
          timestamp_end: number | null
          timestamp_start: number
          user_id: string
          word_count: number | null
        }
        Insert: {
          audio_quality_score?: number | null
          created_at?: string | null
          id?: string
          is_commitment?: boolean | null
          is_question?: boolean | null
          keywords?: string[] | null
          language?: string | null
          match_confidence?: number | null
          matched_profile_id?: string | null
          recording_id?: string | null
          sentiment_score?: number | null
          session_id: string
          speaker_label?: string | null
          text: string
          timestamp_end?: number | null
          timestamp_start: number
          user_id: string
          word_count?: number | null
        }
        Update: {
          audio_quality_score?: number | null
          created_at?: string | null
          id?: string
          is_commitment?: boolean | null
          is_question?: boolean | null
          keywords?: string[] | null
          language?: string | null
          match_confidence?: number | null
          matched_profile_id?: string | null
          recording_id?: string | null
          sentiment_score?: number | null
          session_id?: string
          speaker_label?: string | null
          text?: string
          timestamp_end?: number | null
          timestamp_start?: number
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_transcriptions_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "live_transcriptions_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "live_transcriptions_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_transcriptions_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      local_ai_endpoints: {
        Row: {
          api_format: string | null
          capabilities: Json | null
          created_at: string
          endpoint_url: string
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          model_type: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_format?: string | null
          capabilities?: Json | null
          created_at?: string
          endpoint_url: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          model_type: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_format?: string | null
          capabilities?: Json | null
          created_at?: string
          endpoint_url?: string
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          model_type?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      local_ml_cache: {
        Row: {
          cache_size_bytes: number | null
          cache_status: string | null
          created_at: string
          id: string
          last_used_at: string | null
          model_name: string
          model_version: string | null
          performance_metrics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cache_size_bytes?: number | null
          cache_status?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          model_name: string
          model_version?: string | null
          performance_metrics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cache_size_bytes?: number | null
          cache_status?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          model_name?: string
          model_version?: string | null
          performance_metrics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      location_history: {
        Row: {
          accuracy: number | null
          activity_type: string | null
          altitude: number | null
          created_at: string | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          place_name: string | null
          place_type: string | null
          profile_id: string | null
          recorded_at: string
          source: string | null
          speed: number | null
          steps_since_last: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          activity_type?: string | null
          altitude?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          place_name?: string | null
          place_type?: string | null
          profile_id?: string | null
          recorded_at: string
          source?: string | null
          speed?: number | null
          steps_since_last?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          activity_type?: string | null
          altitude?: number | null
          created_at?: string | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          place_name?: string | null
          place_type?: string | null
          profile_id?: string | null
          recorded_at?: string
          source?: string | null
          speed?: number | null
          steps_since_last?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "location_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "location_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manipulation_detections: {
        Row: {
          affected_domains: string[] | null
          counter_measures: Json | null
          created_at: string | null
          detected_at: string | null
          detected_in_profile_id: string | null
          detection_confidence: number | null
          evidence: Json | null
          id: string
          is_ongoing: boolean | null
          manipulation_type: string
          resolved_at: string | null
          severity: string | null
          source_actor_id: string | null
          timeline: Json | null
          user_id: string
        }
        Insert: {
          affected_domains?: string[] | null
          counter_measures?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_in_profile_id?: string | null
          detection_confidence?: number | null
          evidence?: Json | null
          id?: string
          is_ongoing?: boolean | null
          manipulation_type: string
          resolved_at?: string | null
          severity?: string | null
          source_actor_id?: string | null
          timeline?: Json | null
          user_id: string
        }
        Update: {
          affected_domains?: string[] | null
          counter_measures?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_in_profile_id?: string | null
          detection_confidence?: number | null
          evidence?: Json | null
          id?: string
          is_ongoing?: boolean | null
          manipulation_type?: string
          resolved_at?: string | null
          severity?: string | null
          source_actor_id?: string | null
          timeline?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "manipulation_detections_detected_in_profile_id_fkey"
            columns: ["detected_in_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manipulation_detections_source_actor_id_fkey"
            columns: ["source_actor_id"]
            isOneToOne: false
            referencedRelation: "threat_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sentiment_snapshots: {
        Row: {
          asset_class_sentiments: Json | null
          created_at: string
          emerging_opportunities: Json | null
          emerging_risks: Json | null
          granularity: string
          id: string
          negative_news_pct: number | null
          news_volume: number | null
          overall_fear_greed: number | null
          overall_sentiment: number | null
          positive_news_pct: number | null
          regional_sentiments: Json | null
          sector_sentiments: Json | null
          snapshot_at: string
          source_count: number | null
          trending_topics: Json | null
          user_id: string
        }
        Insert: {
          asset_class_sentiments?: Json | null
          created_at?: string
          emerging_opportunities?: Json | null
          emerging_risks?: Json | null
          granularity: string
          id?: string
          negative_news_pct?: number | null
          news_volume?: number | null
          overall_fear_greed?: number | null
          overall_sentiment?: number | null
          positive_news_pct?: number | null
          regional_sentiments?: Json | null
          sector_sentiments?: Json | null
          snapshot_at: string
          source_count?: number | null
          trending_topics?: Json | null
          user_id: string
        }
        Update: {
          asset_class_sentiments?: Json | null
          created_at?: string
          emerging_opportunities?: Json | null
          emerging_risks?: Json | null
          granularity?: string
          id?: string
          negative_news_pct?: number | null
          news_volume?: number | null
          overall_fear_greed?: number | null
          overall_sentiment?: number | null
          positive_news_pct?: number | null
          regional_sentiments?: Json | null
          sector_sentiments?: Json | null
          snapshot_at?: string
          source_count?: number | null
          trending_topics?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      mbox_import_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          failed_emails: number | null
          file_name: string | null
          file_size: number | null
          id: string
          matched_emails: number | null
          processed_emails: number | null
          started_at: string | null
          status: string | null
          storage_path: string | null
          total_emails: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_emails?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          matched_emails?: number | null
          processed_emails?: number | null
          started_at?: string | null
          status?: string | null
          storage_path?: string | null
          total_emails?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          failed_emails?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          matched_emails?: number | null
          processed_emails?: number | null
          started_at?: string | null
          status?: string | null
          storage_path?: string | null
          total_emails?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          ai_generation_error: string | null
          ai_generation_status: string | null
          ai_metadata: Json | null
          ai_metadata_generated_at: string | null
          ai_model_used: string | null
          caption: string | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          storage_path: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          ai_metadata?: Json | null
          ai_metadata_generated_at?: string | null
          ai_model_used?: string | null
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          ai_generation_error?: string | null
          ai_generation_status?: string | null
          ai_metadata?: Json | null
          ai_metadata_generated_at?: string | null
          ai_model_used?: string | null
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          storage_path?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_analyses: {
        Row: {
          action_items: string[] | null
          analysis_context: Json | null
          analysis_depth: string | null
          analysis_modes: string[] | null
          behavioral_analysis: Json | null
          certainties: string[] | null
          confidence_score: number | null
          content_intelligence: Json | null
          created_at: string | null
          document_extraction: Json | null
          document_id: string | null
          entity_extraction: Json | null
          estimated_cost_cents: number | null
          face_intelligence: Json | null
          id: string
          key_insights: string[] | null
          lifestyle_profiling: Json | null
          media_id: string | null
          media_type: string
          model_used: string | null
          personality_cues: Json | null
          processing_time_ms: number | null
          profile_id: string | null
          red_flags: string[] | null
          relationship_mapping: Json | null
          scene_intelligence: Json | null
          sentiment_analysis: Json | null
          temporal_analysis: Json | null
          token_usage: Json | null
          updated_at: string | null
          user_id: string | null
          vocal_psychology: Json | null
          yellow_flags: string[] | null
        }
        Insert: {
          action_items?: string[] | null
          analysis_context?: Json | null
          analysis_depth?: string | null
          analysis_modes?: string[] | null
          behavioral_analysis?: Json | null
          certainties?: string[] | null
          confidence_score?: number | null
          content_intelligence?: Json | null
          created_at?: string | null
          document_extraction?: Json | null
          document_id?: string | null
          entity_extraction?: Json | null
          estimated_cost_cents?: number | null
          face_intelligence?: Json | null
          id?: string
          key_insights?: string[] | null
          lifestyle_profiling?: Json | null
          media_id?: string | null
          media_type: string
          model_used?: string | null
          personality_cues?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          red_flags?: string[] | null
          relationship_mapping?: Json | null
          scene_intelligence?: Json | null
          sentiment_analysis?: Json | null
          temporal_analysis?: Json | null
          token_usage?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vocal_psychology?: Json | null
          yellow_flags?: string[] | null
        }
        Update: {
          action_items?: string[] | null
          analysis_context?: Json | null
          analysis_depth?: string | null
          analysis_modes?: string[] | null
          behavioral_analysis?: Json | null
          certainties?: string[] | null
          confidence_score?: number | null
          content_intelligence?: Json | null
          created_at?: string | null
          document_extraction?: Json | null
          document_id?: string | null
          entity_extraction?: Json | null
          estimated_cost_cents?: number | null
          face_intelligence?: Json | null
          id?: string
          key_insights?: string[] | null
          lifestyle_profiling?: Json | null
          media_id?: string | null
          media_type?: string
          model_used?: string | null
          personality_cues?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          red_flags?: string[] | null
          relationship_mapping?: Json | null
          scene_intelligence?: Json | null
          sentiment_analysis?: Json | null
          temporal_analysis?: Json | null
          token_usage?: Json | null
          updated_at?: string | null
          user_id?: string | null
          vocal_psychology?: Json | null
          yellow_flags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "media_analyses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_analyses_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_contact_tags: {
        Row: {
          confidence: number | null
          created_at: string
          detection_method: string | null
          face_position: Json | null
          id: string
          media_id: string
          profile_id: string
          tagged_by: string
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          detection_method?: string | null
          face_position?: Json | null
          id?: string
          media_id: string
          profile_id: string
          tagged_by?: string
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          detection_method?: string | null
          face_position?: Json | null
          id?: string
          media_id?: string
          profile_id?: string
          tagged_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_contact_tags_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_contact_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_contact_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "media_contact_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_metadata_jobs: {
        Row: {
          actual_cost_cents: number | null
          completed_at: string | null
          created_at: string | null
          document_id: string | null
          error: string | null
          estimated_cost_cents: number | null
          id: string
          job_type: string
          media_id: string | null
          model_key: string | null
          priority: number | null
          result: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          error?: string | null
          estimated_cost_cents?: number | null
          id?: string
          job_type?: string
          media_id?: string | null
          model_key?: string | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string | null
          document_id?: string | null
          error?: string | null
          estimated_cost_cents?: number | null
          id?: string
          job_type?: string
          media_id?: string | null
          model_key?: string | null
          priority?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_metadata_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_metadata_jobs_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_intelligence: {
        Row: {
          action_items: Json | null
          briefing_generated_at: string | null
          commitments: Json | null
          created_at: string | null
          event_id: string | null
          follow_up_draft: Json | null
          follow_up_sent: boolean | null
          follow_up_sent_at: string | null
          id: string
          meeting_date: string | null
          meeting_effectiveness_score: number | null
          meeting_title: string | null
          next_touchpoint_date: string | null
          post_summary: Json | null
          pre_briefing: Json | null
          profile_id: string | null
          relationship_impact_score: number | null
          summary_generated_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_items?: Json | null
          briefing_generated_at?: string | null
          commitments?: Json | null
          created_at?: string | null
          event_id?: string | null
          follow_up_draft?: Json | null
          follow_up_sent?: boolean | null
          follow_up_sent_at?: string | null
          id?: string
          meeting_date?: string | null
          meeting_effectiveness_score?: number | null
          meeting_title?: string | null
          next_touchpoint_date?: string | null
          post_summary?: Json | null
          pre_briefing?: Json | null
          profile_id?: string | null
          relationship_impact_score?: number | null
          summary_generated_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_items?: Json | null
          briefing_generated_at?: string | null
          commitments?: Json | null
          created_at?: string | null
          event_id?: string | null
          follow_up_draft?: Json | null
          follow_up_sent?: boolean | null
          follow_up_sent_at?: string | null
          id?: string
          meeting_date?: string | null
          meeting_effectiveness_score?: number | null
          meeting_title?: string | null
          next_touchpoint_date?: string | null
          post_summary?: Json | null
          pre_briefing?: Json | null
          profile_id?: string | null
          relationship_impact_score?: number | null
          summary_generated_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_intelligence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meeting_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meeting_intelligence_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          audio_events: Json | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          file_size: number | null
          file_url: string
          folder: string | null
          id: string
          mime_type: string | null
          processed_at: string | null
          profile_id: string | null
          status: string | null
          title: string
          transcription: string | null
          transcription_with_speakers: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_events?: Json | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          file_url: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          profile_id?: string | null
          status?: string | null
          title: string
          transcription?: string | null
          transcription_with_speakers?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_events?: Json | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size?: number | null
          file_url?: string
          folder?: string | null
          id?: string
          mime_type?: string | null
          processed_at?: string | null
          profile_id?: string | null
          status?: string | null
          title?: string
          transcription?: string | null
          transcription_with_speakers?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meeting_recordings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "meeting_recordings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memetic_campaigns: {
        Row: {
          amplification_nodes: string[] | null
          campaign_name: string
          completed_at: string | null
          core_narrative: string | null
          counter_narratives: Json | null
          created_at: string | null
          current_reach: number | null
          emotional_hooks: string[] | null
          id: string
          infected_count: number | null
          infection_rate: number | null
          launched_at: string | null
          meme_content: Json
          peak_reach: number | null
          propagation_model: string | null
          recovered_count: number | null
          recovery_rate: number | null
          status: string | null
          susceptible_population: number | null
          target_networks: string[] | null
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
          virality_coefficient: number | null
        }
        Insert: {
          amplification_nodes?: string[] | null
          campaign_name: string
          completed_at?: string | null
          core_narrative?: string | null
          counter_narratives?: Json | null
          created_at?: string | null
          current_reach?: number | null
          emotional_hooks?: string[] | null
          id?: string
          infected_count?: number | null
          infection_rate?: number | null
          launched_at?: string | null
          meme_content: Json
          peak_reach?: number | null
          propagation_model?: string | null
          recovered_count?: number | null
          recovery_rate?: number | null
          status?: string | null
          susceptible_population?: number | null
          target_networks?: string[] | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
          virality_coefficient?: number | null
        }
        Update: {
          amplification_nodes?: string[] | null
          campaign_name?: string
          completed_at?: string | null
          core_narrative?: string | null
          counter_narratives?: Json | null
          created_at?: string | null
          current_reach?: number | null
          emotional_hooks?: string[] | null
          id?: string
          infected_count?: number | null
          infection_rate?: number | null
          launched_at?: string | null
          meme_content?: Json
          peak_reach?: number | null
          propagation_model?: string | null
          recovered_count?: number | null
          recovery_rate?: number | null
          status?: string | null
          susceptible_population?: number | null
          target_networks?: string[] | null
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
          virality_coefficient?: number | null
        }
        Relationships: []
      }
      memory_interventions: {
        Row: {
          created_at: string | null
          follow_up_required: boolean | null
          id: string
          intervention_type: string | null
          lability_window_end: string | null
          lability_window_start: string | null
          memory_category: string | null
          notes: string | null
          prediction_error_applied: boolean | null
          prediction_error_content: string | null
          profile_id: string | null
          success_score: number | null
          target_memory: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          intervention_type?: string | null
          lability_window_end?: string | null
          lability_window_start?: string | null
          memory_category?: string | null
          notes?: string | null
          prediction_error_applied?: boolean | null
          prediction_error_content?: string | null
          profile_id?: string | null
          success_score?: number | null
          target_memory: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          intervention_type?: string | null
          lability_window_end?: string | null
          lability_window_start?: string | null
          memory_category?: string | null
          notes?: string | null
          prediction_error_applied?: boolean | null
          prediction_error_content?: string | null
          profile_id?: string | null
          success_score?: number | null
          target_memory?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "memory_interventions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_fingerprints: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          fingerprint: string
          id: string
          message_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          fingerprint: string
          id?: string
          message_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          fingerprint?: string
          id?: string
          message_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_fingerprints_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_fingerprints_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_from_contact: boolean
          media_filename: string | null
          media_id: string | null
          media_type: string | null
          metadata: Json | null
          sent_at: string
          user_id: string
          whatsapp_message_id: string | null
          whatsapp_status: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          media_filename?: string | null
          media_id?: string | null
          media_type?: string | null
          metadata?: Json | null
          sent_at?: string
          user_id: string
          whatsapp_message_id?: string | null
          whatsapp_status?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          media_filename?: string | null
          media_id?: string | null
          media_type?: string | null
          metadata?: Json | null
          sent_at?: string
          user_id?: string
          whatsapp_message_id?: string | null
          whatsapp_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_learning_models: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          learning_domain: string
          model_name: string
          model_parameters: Json | null
          model_type: string
          performance_metrics: Json | null
          training_data_sources: Json | null
          training_iterations: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          learning_domain: string
          model_name: string
          model_parameters?: Json | null
          model_type?: string
          performance_metrics?: Json | null
          training_data_sources?: Json | null
          training_iterations?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          learning_domain?: string
          model_name?: string
          model_parameters?: Json | null
          model_type?: string
          performance_metrics?: Json | null
          training_data_sources?: Json | null
          training_iterations?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meta_patterns: {
        Row: {
          abstraction_level: number | null
          constituent_patterns: Json | null
          discovered_at: string
          discovery_method: string | null
          id: string
          last_validated_at: string | null
          manifestation_contexts: Json | null
          manipulation_leverage: number | null
          pattern_name: string
          prediction_power: number | null
          user_id: string
          validation_evidence: Json | null
        }
        Insert: {
          abstraction_level?: number | null
          constituent_patterns?: Json | null
          discovered_at?: string
          discovery_method?: string | null
          id?: string
          last_validated_at?: string | null
          manifestation_contexts?: Json | null
          manipulation_leverage?: number | null
          pattern_name: string
          prediction_power?: number | null
          user_id: string
          validation_evidence?: Json | null
        }
        Update: {
          abstraction_level?: number | null
          constituent_patterns?: Json | null
          discovered_at?: string
          discovery_method?: string | null
          id?: string
          last_validated_at?: string | null
          manifestation_contexts?: Json | null
          manipulation_leverage?: number | null
          pattern_name?: string
          prediction_power?: number | null
          user_id?: string
          validation_evidence?: Json | null
        }
        Relationships: []
      }
      metal_detection_sweeps: {
        Row: {
          completed_at: string | null
          created_at: string | null
          detection_points: Json | null
          device_id: string | null
          findings_summary: Json | null
          id: string
          location: Json | null
          location_name: string | null
          mission_id: string | null
          started_at: string | null
          sweep_area: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          detection_points?: Json | null
          device_id?: string | null
          findings_summary?: Json | null
          id?: string
          location?: Json | null
          location_name?: string | null
          mission_id?: string | null
          started_at?: string | null
          sweep_area?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          detection_points?: Json | null
          device_id?: string | null
          findings_summary?: Json | null
          id?: string
          location?: Json | null
          location_name?: string | null
          mission_id?: string | null
          started_at?: string | null
          sweep_area?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metal_detection_sweeps_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metal_detection_sweeps_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      methodology_outcomes: {
        Row: {
          action_id: string | null
          after_state: Json | null
          applied_at: string
          approach_used: string | null
          before_state: Json | null
          context: string | null
          created_at: string
          id: string
          lessons: string | null
          methodology_id: string | null
          methodology_name: string
          outcome: string
          outcome_score: number | null
          profile_id: string
          relationship_delta: number | null
          response_observed: string | null
          strategy_id: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          after_state?: Json | null
          applied_at?: string
          approach_used?: string | null
          before_state?: Json | null
          context?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          methodology_id?: string | null
          methodology_name: string
          outcome: string
          outcome_score?: number | null
          profile_id: string
          relationship_delta?: number | null
          response_observed?: string | null
          strategy_id?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          action_id?: string | null
          after_state?: Json | null
          applied_at?: string
          approach_used?: string | null
          before_state?: Json | null
          context?: string | null
          created_at?: string
          id?: string
          lessons?: string | null
          methodology_id?: string | null
          methodology_name?: string
          outcome?: string
          outcome_score?: number | null
          profile_id?: string
          relationship_delta?: number | null
          response_observed?: string | null
          strategy_id?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "methodology_outcomes_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "influence_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methodology_outcomes_methodology_id_fkey"
            columns: ["methodology_id"]
            isOneToOne: false
            referencedRelation: "intelligence_methodologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methodology_outcomes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "methodology_outcomes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "methodology_outcomes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "methodology_outcomes_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "influence_strategies"
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
      mission_events: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string | null
          device_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          location: Json | null
          mission_id: string
          severity: string | null
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          device_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          location?: Json | null
          mission_id: string
          severity?: string | null
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          device_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          location?: Json | null
          mission_id?: string
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_events_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_captures: {
        Row: {
          capture_context: Json | null
          captured_at: string
          decay_rate: number | null
          emotional_state_snapshot: Json | null
          expires_at: string | null
          id: string
          leverage_outcome: Json | null
          leverage_potential: number | null
          moment_type: string
          optimal_action_window: Json | null
          profile_id: string | null
          suggested_interventions: Json | null
          user_id: string
          was_leveraged: boolean | null
        }
        Insert: {
          capture_context?: Json | null
          captured_at?: string
          decay_rate?: number | null
          emotional_state_snapshot?: Json | null
          expires_at?: string | null
          id?: string
          leverage_outcome?: Json | null
          leverage_potential?: number | null
          moment_type: string
          optimal_action_window?: Json | null
          profile_id?: string | null
          suggested_interventions?: Json | null
          user_id: string
          was_leveraged?: boolean | null
        }
        Update: {
          capture_context?: Json | null
          captured_at?: string
          decay_rate?: number | null
          emotional_state_snapshot?: Json | null
          expires_at?: string | null
          id?: string
          leverage_outcome?: Json | null
          leverage_potential?: number | null
          moment_type?: string
          optimal_action_window?: Json | null
          profile_id?: string | null
          suggested_interventions?: Json | null
          user_id?: string
          was_leveraged?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "moment_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "moment_captures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      morphic_patterns: {
        Row: {
          affected_profiles: Json | null
          amplification_opportunities: Json | null
          decay_rate: number | null
          disruption_methods: Json | null
          first_detected_at: string
          id: string
          last_observed_at: string
          originating_profiles: Json | null
          pattern_name: string
          pattern_type: string
          propagation_mechanism: Json | null
          resonance_strength: number | null
          user_id: string
        }
        Insert: {
          affected_profiles?: Json | null
          amplification_opportunities?: Json | null
          decay_rate?: number | null
          disruption_methods?: Json | null
          first_detected_at?: string
          id?: string
          last_observed_at?: string
          originating_profiles?: Json | null
          pattern_name: string
          pattern_type: string
          propagation_mechanism?: Json | null
          resonance_strength?: number | null
          user_id: string
        }
        Update: {
          affected_profiles?: Json | null
          amplification_opportunities?: Json | null
          decay_rate?: number | null
          disruption_methods?: Json | null
          first_detected_at?: string
          id?: string
          last_observed_at?: string
          originating_profiles?: Json | null
          pattern_name?: string
          pattern_type?: string
          propagation_mechanism?: Json | null
          resonance_strength?: number | null
          user_id?: string
        }
        Relationships: []
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
      movement_routes: {
        Row: {
          created_at: string | null
          distance_meters: number | null
          duration_minutes: number | null
          end_location_id: string | null
          end_time: string | null
          id: string
          profile_id: string | null
          route_polyline: string | null
          start_location_id: string | null
          start_time: string | null
          transport_mode: string | null
          user_id: string
          waypoints: Json | null
        }
        Insert: {
          created_at?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          end_location_id?: string | null
          end_time?: string | null
          id?: string
          profile_id?: string | null
          route_polyline?: string | null
          start_location_id?: string | null
          start_time?: string | null
          transport_mode?: string | null
          user_id: string
          waypoints?: Json | null
        }
        Update: {
          created_at?: string | null
          distance_meters?: number | null
          duration_minutes?: number | null
          end_location_id?: string | null
          end_time?: string | null
          id?: string
          profile_id?: string | null
          route_polyline?: string | null
          start_location_id?: string | null
          start_time?: string | null
          transport_mode?: string | null
          user_id?: string
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "movement_routes_end_location_id_fkey"
            columns: ["end_location_id"]
            isOneToOne: false
            referencedRelation: "location_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_routes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "movement_routes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "movement_routes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movement_routes_start_location_id_fkey"
            columns: ["start_location_id"]
            isOneToOne: false
            referencedRelation: "location_history"
            referencedColumns: ["id"]
          },
        ]
      }
      multi_target_campaigns: {
        Row: {
          campaign_name: string
          campaign_objective: string
          completed_at: string | null
          coordination_strategy: string | null
          created_at: string | null
          cross_target_effects: Json | null
          current_phase: string | null
          id: string
          is_active: boolean | null
          overall_progress: number | null
          per_target_tactics: Json | null
          started_at: string | null
          synergy_score: number | null
          target_profiles: string[] | null
          target_statuses: Json | null
          timing_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          campaign_objective: string
          completed_at?: string | null
          coordination_strategy?: string | null
          created_at?: string | null
          cross_target_effects?: Json | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          overall_progress?: number | null
          per_target_tactics?: Json | null
          started_at?: string | null
          synergy_score?: number | null
          target_profiles?: string[] | null
          target_statuses?: Json | null
          timing_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          campaign_objective?: string
          completed_at?: string | null
          coordination_strategy?: string | null
          created_at?: string | null
          cross_target_effects?: Json | null
          current_phase?: string | null
          id?: string
          is_active?: boolean | null
          overall_progress?: number | null
          per_target_tactics?: Json | null
          started_at?: string | null
          synergy_score?: number | null
          target_profiles?: string[] | null
          target_statuses?: Json | null
          timing_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      narrative_identities: {
        Row: {
          created_at: string
          id: string
          life_narrative: Json | null
          narrative_gaps: Json | null
          narrative_momentum: number | null
          narrative_themes: Json | null
          profile_id: string | null
          protagonist_archetype: string | null
          reframe_opportunities: Json | null
          story_phase: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          life_narrative?: Json | null
          narrative_gaps?: Json | null
          narrative_momentum?: number | null
          narrative_themes?: Json | null
          profile_id?: string | null
          protagonist_archetype?: string | null
          reframe_opportunities?: Json | null
          story_phase?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          life_narrative?: Json | null
          narrative_gaps?: Json | null
          narrative_momentum?: number | null
          narrative_themes?: Json | null
          profile_id?: string | null
          protagonist_archetype?: string | null
          reframe_opportunities?: Json | null
          story_phase?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "narrative_identities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_simulations: {
        Row: {
          audience_segments: Json | null
          completed_at: string | null
          created_at: string
          dominant_narrative: string | null
          id: string
          iterations_run: number | null
          narratives: Json
          simulation_config: Json | null
          simulation_name: string
          simulation_results: Json | null
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          audience_segments?: Json | null
          completed_at?: string | null
          created_at?: string
          dominant_narrative?: string | null
          id?: string
          iterations_run?: number | null
          narratives?: Json
          simulation_config?: Json | null
          simulation_name: string
          simulation_results?: Json | null
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          audience_segments?: Json | null
          completed_at?: string | null
          created_at?: string
          dominant_narrative?: string | null
          id?: string
          iterations_run?: number | null
          narratives?: Json
          simulation_config?: Json | null
          simulation_name?: string
          simulation_results?: Json | null
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      navigation_preferences: {
        Row: {
          collapsed_groups: string[] | null
          color_overrides: Json | null
          created_at: string | null
          group_order: Json | null
          hidden_items: string[] | null
          id: string
          layout_mode: string | null
          pinned_items: string[] | null
          show_badges: boolean | null
          show_descriptions: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collapsed_groups?: string[] | null
          color_overrides?: Json | null
          created_at?: string | null
          group_order?: Json | null
          hidden_items?: string[] | null
          id?: string
          layout_mode?: string | null
          pinned_items?: string[] | null
          show_badges?: boolean | null
          show_descriptions?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collapsed_groups?: string[] | null
          color_overrides?: Json | null
          created_at?: string | null
          group_order?: Json | null
          hidden_items?: string[] | null
          id?: string
          layout_mode?: string | null
          pinned_items?: string[] | null
          show_badges?: boolean | null
          show_descriptions?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      navigation_quick_access: {
        Row: {
          access_count: number | null
          created_at: string | null
          id: string
          last_accessed: string | null
          route: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          route: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          route?: string
          user_id?: string
        }
        Relationships: []
      }
      negotiation_sessions: {
        Row: {
          accusation_audit: Json | null
          calibrated_questions: Json | null
          created_at: string | null
          evidence_strategy: Json | null
          fbi_tactics_used: Json | null
          id: string
          labels_applied: Json | null
          lessons_learned: Json | null
          mirroring_instances: Json | null
          objectives: Json | null
          outcome: string | null
          profile_id: string | null
          session_type: string | null
          success_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accusation_audit?: Json | null
          calibrated_questions?: Json | null
          created_at?: string | null
          evidence_strategy?: Json | null
          fbi_tactics_used?: Json | null
          id?: string
          labels_applied?: Json | null
          lessons_learned?: Json | null
          mirroring_instances?: Json | null
          objectives?: Json | null
          outcome?: string | null
          profile_id?: string | null
          session_type?: string | null
          success_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accusation_audit?: Json | null
          calibrated_questions?: Json | null
          created_at?: string | null
          evidence_strategy?: Json | null
          fbi_tactics_used?: Json | null
          id?: string
          labels_applied?: Json | null
          lessons_learned?: Json | null
          mirroring_instances?: Json | null
          objectives?: Json | null
          outcome?: string | null
          profile_id?: string | null
          session_type?: string | null
          success_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "negotiation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "negotiation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "negotiation_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_brokerage: {
        Row: {
          betweenness_centrality: number | null
          bridge_opportunities: Json | null
          brokerage_score: number | null
          constraint_score: number | null
          created_at: string | null
          disconnected_clusters: Json | null
          id: string
          network_control_coefficient: number | null
          profile_id: string | null
          structural_holes_bridged: number | null
          tertius_gaudens_positions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          betweenness_centrality?: number | null
          bridge_opportunities?: Json | null
          brokerage_score?: number | null
          constraint_score?: number | null
          created_at?: string | null
          disconnected_clusters?: Json | null
          id?: string
          network_control_coefficient?: number | null
          profile_id?: string | null
          structural_holes_bridged?: number | null
          tertius_gaudens_positions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          betweenness_centrality?: number | null
          bridge_opportunities?: Json | null
          brokerage_score?: number | null
          constraint_score?: number | null
          created_at?: string | null
          disconnected_clusters?: Json | null
          id?: string
          network_control_coefficient?: number | null
          profile_id?: string | null
          structural_holes_bridged?: number | null
          tertius_gaudens_positions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "network_brokerage_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_operations: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_phase: string | null
          effectiveness_score: number | null
          id: string
          is_active: boolean | null
          network_after: Json | null
          network_before: Json | null
          objective: string
          operation_name: string
          operation_type: string
          phase_details: Json | null
          progress_metrics: Json | null
          started_at: string | null
          target_network: Json | null
          target_nodes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          network_after?: Json | null
          network_before?: Json | null
          objective: string
          operation_name: string
          operation_type: string
          phase_details?: Json | null
          progress_metrics?: Json | null
          started_at?: string | null
          target_network?: Json | null
          target_nodes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_phase?: string | null
          effectiveness_score?: number | null
          id?: string
          is_active?: boolean | null
          network_after?: Json | null
          network_before?: Json | null
          objective?: string
          operation_name?: string
          operation_type?: string
          phase_details?: Json | null
          progress_metrics?: Json | null
          started_at?: string | null
          target_network?: Json | null
          target_nodes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: string | null
          confidence_score: number | null
          contributing_factors: Json | null
          created_at: string
          id: string
          model_version: string | null
          outcome_date: string | null
          predicted_date: string | null
          predicted_outcome: string | null
          prediction_type: string
          profile_id: string
          recommendations: Json | null
          risk_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          model_version?: string | null
          outcome_date?: string | null
          predicted_date?: string | null
          predicted_outcome?: string | null
          prediction_type: string
          profile_id: string
          recommendations?: Json | null
          risk_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          model_version?: string | null
          outcome_date?: string | null
          predicted_date?: string | null
          predicted_outcome?: string | null
          prediction_type?: string
          profile_id?: string
          recommendations?: Json | null
          risk_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_snapshots: {
        Row: {
          change_summary: Json | null
          community_structure: Json | null
          created_at: string | null
          graph_data: Json | null
          id: string
          metrics: Json
          snapshot_date: string
          snapshot_type: string | null
          user_id: string
        }
        Insert: {
          change_summary?: Json | null
          community_structure?: Json | null
          created_at?: string | null
          graph_data?: Json | null
          id?: string
          metrics?: Json
          snapshot_date: string
          snapshot_type?: string | null
          user_id: string
        }
        Update: {
          change_summary?: Json | null
          community_structure?: Json | null
          created_at?: string | null
          graph_data?: Json | null
          id?: string
          metrics?: Json
          snapshot_date?: string
          snapshot_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      news_correlations: {
        Row: {
          combined_impact_score: number | null
          conflicting_claims: Json | null
          consensus_sentiment: number | null
          correlation_confidence: number
          created_at: string
          disputed_claims: Json | null
          expires_at: string | null
          first_reported_at: string | null
          id: string
          last_updated_at: string
          narrative_consistency: number | null
          news_item_ids: string[]
          source_count: number
          sources: string[]
          topic_hash: string
          topic_summary: string
          user_id: string
          validated_facts: Json | null
        }
        Insert: {
          combined_impact_score?: number | null
          conflicting_claims?: Json | null
          consensus_sentiment?: number | null
          correlation_confidence: number
          created_at?: string
          disputed_claims?: Json | null
          expires_at?: string | null
          first_reported_at?: string | null
          id?: string
          last_updated_at?: string
          narrative_consistency?: number | null
          news_item_ids: string[]
          source_count?: number
          sources: string[]
          topic_hash: string
          topic_summary: string
          user_id: string
          validated_facts?: Json | null
        }
        Update: {
          combined_impact_score?: number | null
          conflicting_claims?: Json | null
          consensus_sentiment?: number | null
          correlation_confidence?: number
          created_at?: string
          disputed_claims?: Json | null
          expires_at?: string | null
          first_reported_at?: string | null
          id?: string
          last_updated_at?: string
          narrative_consistency?: number | null
          news_item_ids?: string[]
          source_count?: number
          sources?: string[]
          topic_hash?: string
          topic_summary?: string
          user_id?: string
          validated_facts?: Json | null
        }
        Relationships: []
      }
      news_intelligence_items: {
        Row: {
          content: string | null
          created_at: string
          embedding: string | null
          entities: Json | null
          fetched_at: string
          id: string
          impact_score: number | null
          processed_at: string | null
          processing_status: string | null
          published_at: string | null
          raw_response: Json | null
          regions: string[] | null
          sectors: string[] | null
          sentiment_confidence: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          source_credibility_score: number | null
          source_name: string
          source_url: string | null
          summary: string | null
          tickers: string[] | null
          title: string
          topics: string[] | null
          updated_at: string
          urgency_level: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          entities?: Json | null
          fetched_at?: string
          id?: string
          impact_score?: number | null
          processed_at?: string | null
          processing_status?: string | null
          published_at?: string | null
          raw_response?: Json | null
          regions?: string[] | null
          sectors?: string[] | null
          sentiment_confidence?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source_credibility_score?: number | null
          source_name: string
          source_url?: string | null
          summary?: string | null
          tickers?: string[] | null
          title: string
          topics?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          entities?: Json | null
          fetched_at?: string
          id?: string
          impact_score?: number | null
          processed_at?: string | null
          processing_status?: string | null
          published_at?: string | null
          raw_response?: Json | null
          regions?: string[] | null
          sectors?: string[] | null
          sentiment_confidence?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          source_credibility_score?: number | null
          source_name?: string
          source_url?: string | null
          summary?: string | null
          tickers?: string[] | null
          title?: string
          topics?: string[] | null
          updated_at?: string
          urgency_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      news_signals: {
        Row: {
          asset_class: string
          asset_identifier: string | null
          confidence_score: number
          contrary_indicators: Json | null
          correlation_id: string | null
          created_at: string
          expected_direction: string | null
          expected_magnitude: string | null
          expected_roi_high: number | null
          expected_roi_low: number | null
          historical_accuracy: number | null
          id: string
          outcome_recorded: Json | null
          risk_factors: Json | null
          risk_level: string | null
          sector: string | null
          signal_strength: number
          signal_type: string
          source_count: number
          status: string | null
          stop_loss_suggestion: number | null
          supporting_news: Json | null
          time_horizon: string | null
          triggered_at: string | null
          updated_at: string
          user_id: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          asset_class: string
          asset_identifier?: string | null
          confidence_score: number
          contrary_indicators?: Json | null
          correlation_id?: string | null
          created_at?: string
          expected_direction?: string | null
          expected_magnitude?: string | null
          expected_roi_high?: number | null
          expected_roi_low?: number | null
          historical_accuracy?: number | null
          id?: string
          outcome_recorded?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          sector?: string | null
          signal_strength: number
          signal_type: string
          source_count?: number
          status?: string | null
          stop_loss_suggestion?: number | null
          supporting_news?: Json | null
          time_horizon?: string | null
          triggered_at?: string | null
          updated_at?: string
          user_id: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          asset_class?: string
          asset_identifier?: string | null
          confidence_score?: number
          contrary_indicators?: Json | null
          correlation_id?: string | null
          created_at?: string
          expected_direction?: string | null
          expected_magnitude?: string | null
          expected_roi_high?: number | null
          expected_roi_low?: number | null
          historical_accuracy?: number | null
          id?: string
          outcome_recorded?: Json | null
          risk_factors?: Json | null
          risk_level?: string | null
          sector?: string | null
          signal_strength?: number
          signal_type?: string
          source_count?: number
          status?: string | null
          stop_loss_suggestion?: number | null
          supporting_news?: Json | null
          time_horizon?: string | null
          triggered_at?: string | null
          updated_at?: string
          user_id?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_signals_correlation_id_fkey"
            columns: ["correlation_id"]
            isOneToOne: false
            referencedRelation: "news_correlations"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_tags: {
        Row: {
          action_config: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          last_tapped_at: string | null
          profile_id: string | null
          tag_id: string
          tag_label: string | null
          tag_type: string | null
          tap_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_tapped_at?: string | null
          profile_id?: string | null
          tag_id: string
          tag_label?: string | null
          tag_type?: string | null
          tap_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_tapped_at?: string | null
          profile_id?: string | null
          tag_id?: string
          tag_label?: string | null
          tag_type?: string | null
          tap_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfc_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nfc_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nfc_tags_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          alert_types_enabled: string[] | null
          created_at: string | null
          digest_frequency: string | null
          email_enabled: boolean | null
          id: string
          min_severity: string | null
          push_enabled: boolean | null
          push_subscription: Json | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_types_enabled?: string[] | null
          created_at?: string | null
          digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          min_severity?: string | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_types_enabled?: string[] | null
          created_at?: string | null
          digest_frequency?: string | null
          email_enabled?: boolean | null
          id?: string
          min_severity?: string | null
          push_enabled?: boolean | null
          push_subscription?: Json | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nudge_campaigns: {
        Row: {
          campaign_name: string
          conversion_rate: number | null
          created_at: string | null
          dark_patterns: Json | null
          id: string
          is_active: boolean | null
          nudge_config: Json | null
          nudge_type: string | null
          profile_id: string | null
          success_metrics: Json | null
          target_behavior: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          conversion_rate?: number | null
          created_at?: string | null
          dark_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          nudge_config?: Json | null
          nudge_type?: string | null
          profile_id?: string | null
          success_metrics?: Json | null
          target_behavior?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          conversion_rate?: number | null
          created_at?: string | null
          dark_patterns?: Json | null
          id?: string
          is_active?: boolean | null
          nudge_config?: Json | null
          nudge_type?: string | null
          profile_id?: string | null
          success_metrics?: Json | null
          target_behavior?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "nudge_campaigns_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          account_email: string | null
          auto_sync_enabled: boolean | null
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          sync_interval_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_email?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          sync_interval_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_email?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          sync_interval_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      omnipresent_control: {
        Row: {
          amplification_nodes: Json | null
          control_domain: string
          control_strength: number | null
          control_vectors: Json | null
          created_at: string
          feedback_integration: Json | null
          id: string
          influence_reach: Json | null
          is_active: boolean | null
          resistance_points: Json | null
          simultaneous_operations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amplification_nodes?: Json | null
          control_domain: string
          control_strength?: number | null
          control_vectors?: Json | null
          created_at?: string
          feedback_integration?: Json | null
          id?: string
          influence_reach?: Json | null
          is_active?: boolean | null
          resistance_points?: Json | null
          simultaneous_operations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amplification_nodes?: Json | null
          control_domain?: string
          control_strength?: number | null
          control_vectors?: Json | null
          created_at?: string
          feedback_integration?: Json | null
          id?: string
          influence_reach?: Json | null
          is_active?: boolean | null
          resistance_points?: Json | null
          simultaneous_operations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      omniscient_awareness: {
        Row: {
          awareness_domain: string
          awareness_scope: Json | null
          blind_spots: Json | null
          coverage_percentage: number | null
          created_at: string
          id: string
          last_scan_at: string | null
          opportunity_detection: Json | null
          pattern_recognition: Json | null
          real_time_feeds: Json | null
          threat_detection: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_domain: string
          awareness_scope?: Json | null
          blind_spots?: Json | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          last_scan_at?: string | null
          opportunity_detection?: Json | null
          pattern_recognition?: Json | null
          real_time_feeds?: Json | null
          threat_detection?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_domain?: string
          awareness_scope?: Json | null
          blind_spots?: Json | null
          coverage_percentage?: number | null
          created_at?: string
          id?: string
          last_scan_at?: string | null
          opportunity_detection?: Json | null
          pattern_recognition?: Json | null
          real_time_feeds?: Json | null
          threat_detection?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunity_windows: {
        Row: {
          auto_action_config: Json | null
          auto_action_enabled: boolean | null
          created_at: string | null
          detected_at: string | null
          id: string
          opportunity_type: string
          profile_id: string | null
          recommended_actions: Json | null
          risk_factors: Json | null
          success_probability: number | null
          trigger_conditions: Json | null
          user_id: string
          utilization_outcome: Json | null
          was_utilized: boolean | null
          window_end: string
          window_quality: number | null
          window_start: string
        }
        Insert: {
          auto_action_config?: Json | null
          auto_action_enabled?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          opportunity_type: string
          profile_id?: string | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          success_probability?: number | null
          trigger_conditions?: Json | null
          user_id: string
          utilization_outcome?: Json | null
          was_utilized?: boolean | null
          window_end: string
          window_quality?: number | null
          window_start: string
        }
        Update: {
          auto_action_config?: Json | null
          auto_action_enabled?: boolean | null
          created_at?: string | null
          detected_at?: string | null
          id?: string
          opportunity_type?: string
          profile_id?: string | null
          recommended_actions?: Json | null
          risk_factors?: Json | null
          success_probability?: number | null
          trigger_conditions?: Json | null
          user_id?: string
          utilization_outcome?: Json | null
          was_utilized?: boolean | null
          window_end?: string
          window_quality?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "opportunity_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestrator_dead_letter: {
        Row: {
          created_at: string
          failure_count: number | null
          failure_reason: string
          first_failure_at: string | null
          id: string
          job_snapshot: Json
          last_failure_at: string | null
          original_job_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          failure_count?: number | null
          failure_reason: string
          first_failure_at?: string | null
          id?: string
          job_snapshot: Json
          last_failure_at?: string | null
          original_job_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          failure_count?: number | null
          failure_reason?: string
          first_failure_at?: string | null
          id?: string
          job_snapshot?: Json
          last_failure_at?: string | null
          original_job_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orchestrator_dead_letter_original_job_id_fkey"
            columns: ["original_job_id"]
            isOneToOne: false
            referencedRelation: "orchestrator_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestrator_jobs: {
        Row: {
          actual_cost_cents: number | null
          actual_duration_ms: number | null
          blocks_jobs: string[] | null
          completed_at: string | null
          created_at: string
          deadline_at: string | null
          depends_on_jobs: string[] | null
          error_details: Json | null
          error_message: string | null
          estimated_cost_cents: number | null
          estimated_duration_ms: number | null
          heartbeat_at: string | null
          id: string
          idempotency_key: string | null
          job_subtype: string | null
          job_type: string
          last_retry_at: string | null
          max_retries: number | null
          parent_job_id: string | null
          priority: number | null
          profile_id: string | null
          result_event_ids: string[] | null
          result_summary: Json | null
          retry_count: number | null
          scheduled_for: string | null
          source_id: string | null
          source_registry_id: string | null
          source_type: string | null
          started_at: string | null
          status: string | null
          status_history: Json | null
          tokens_used: number | null
          updated_at: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          actual_cost_cents?: number | null
          actual_duration_ms?: number | null
          blocks_jobs?: string[] | null
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          depends_on_jobs?: string[] | null
          error_details?: Json | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          estimated_duration_ms?: number | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_subtype?: string | null
          job_type: string
          last_retry_at?: string | null
          max_retries?: number | null
          parent_job_id?: string | null
          priority?: number | null
          profile_id?: string | null
          result_event_ids?: string[] | null
          result_summary?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          source_id?: string | null
          source_registry_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          status_history?: Json | null
          tokens_used?: number | null
          updated_at?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          actual_cost_cents?: number | null
          actual_duration_ms?: number | null
          blocks_jobs?: string[] | null
          completed_at?: string | null
          created_at?: string
          deadline_at?: string | null
          depends_on_jobs?: string[] | null
          error_details?: Json | null
          error_message?: string | null
          estimated_cost_cents?: number | null
          estimated_duration_ms?: number | null
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string | null
          job_subtype?: string | null
          job_type?: string
          last_retry_at?: string | null
          max_retries?: number | null
          parent_job_id?: string | null
          priority?: number | null
          profile_id?: string | null
          result_event_ids?: string[] | null
          result_summary?: Json | null
          retry_count?: number | null
          scheduled_for?: string | null
          source_id?: string | null
          source_registry_id?: string | null
          source_type?: string | null
          started_at?: string | null
          status?: string | null
          status_history?: Json | null
          tokens_used?: number | null
          updated_at?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orchestrator_jobs_parent_job_id_fkey"
            columns: ["parent_job_id"]
            isOneToOne: false
            referencedRelation: "orchestrator_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestrator_jobs_source_registry_id_fkey"
            columns: ["source_registry_id"]
            isOneToOne: false
            referencedRelation: "source_asset_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      osint_findings: {
        Row: {
          created_at: string
          finding_type: string
          full_content: string | null
          id: string
          is_dismissed: boolean | null
          is_important: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          profile_id: string
          published_at: string | null
          relevance_score: number | null
          sentiment_score: number | null
          snippet: string | null
          source: string
          source_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finding_type: string
          full_content?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_important?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          profile_id: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          snippet?: string | null
          source: string
          source_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finding_type?: string
          full_content?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_important?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          profile_id?: string
          published_at?: string | null
          relevance_score?: number | null
          sentiment_score?: number | null
          snippet?: string | null
          source?: string
          source_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "osint_findings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "osint_findings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "osint_findings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      outcome_learning_logs: {
        Row: {
          action_type: string
          actual_outcome: number | null
          applied_to_future: boolean | null
          campaign_id: string | null
          context_features: Json | null
          created_at: string | null
          execution_id: string | null
          id: string
          learned_adjustments: Json | null
          model_version: string | null
          predicted_outcome: number | null
          prediction_error: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          actual_outcome?: number | null
          applied_to_future?: boolean | null
          campaign_id?: string | null
          context_features?: Json | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          learned_adjustments?: Json | null
          model_version?: string | null
          predicted_outcome?: number | null
          prediction_error?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          actual_outcome?: number | null
          applied_to_future?: boolean | null
          campaign_id?: string | null
          context_features?: Json | null
          created_at?: string | null
          execution_id?: string | null
          id?: string
          learned_adjustments?: Json | null
          model_version?: string | null
          predicted_outcome?: number | null
          prediction_error?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcome_learning_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "autonomous_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_learning_logs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "agent_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      outlook_config: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          last_delta_link: string | null
          last_sync_at: string | null
          redirect_uri: string | null
          sync_days_back: number | null
          sync_enabled: boolean | null
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          last_delta_link?: string | null
          last_sync_at?: string | null
          redirect_uri?: string | null
          sync_days_back?: number | null
          sync_enabled?: boolean | null
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          last_delta_link?: string | null
          last_sync_at?: string | null
          redirect_uri?: string | null
          sync_days_back?: number | null
          sync_enabled?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personality_profiles: {
        Row: {
          agreeableness: Json | null
          conscientiousness: Json | null
          created_at: string
          exploitation_angles: Json | null
          extraction_sources: string[] | null
          extraversion: Json | null
          facet_scores: Json | null
          id: string
          influence_vulnerabilities: Json | null
          last_analyzed_at: string | null
          neuroticism: Json | null
          openness: Json | null
          profile_id: string
          sample_size: number | null
          stability_coefficient: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agreeableness?: Json | null
          conscientiousness?: Json | null
          created_at?: string
          exploitation_angles?: Json | null
          extraction_sources?: string[] | null
          extraversion?: Json | null
          facet_scores?: Json | null
          id?: string
          influence_vulnerabilities?: Json | null
          last_analyzed_at?: string | null
          neuroticism?: Json | null
          openness?: Json | null
          profile_id: string
          sample_size?: number | null
          stability_coefficient?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agreeableness?: Json | null
          conscientiousness?: Json | null
          created_at?: string
          exploitation_angles?: Json | null
          extraction_sources?: string[] | null
          extraversion?: Json | null
          facet_scores?: Json | null
          id?: string
          influence_vulnerabilities?: Json | null
          last_analyzed_at?: string | null
          neuroticism?: Json | null
          openness?: Json | null
          profile_id?: string
          sample_size?: number | null
          stability_coefficient?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "personality_profiles_profile_id_fkey"
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
      platform_config: {
        Row: {
          category: string
          config_key: string
          config_value: Json
          created_at: string
          default_value: Json
          description: string | null
          display_name: string
          id: string
          is_sensitive: boolean | null
          requires_restart: boolean | null
          subcategory: string | null
          updated_at: string
          value_constraints: Json | null
          value_type: string
        }
        Insert: {
          category: string
          config_key: string
          config_value?: Json
          created_at?: string
          default_value: Json
          description?: string | null
          display_name: string
          id?: string
          is_sensitive?: boolean | null
          requires_restart?: boolean | null
          subcategory?: string | null
          updated_at?: string
          value_constraints?: Json | null
          value_type?: string
        }
        Update: {
          category?: string
          config_key?: string
          config_value?: Json
          created_at?: string
          default_value?: Json
          description?: string | null
          display_name?: string
          id?: string
          is_sensitive?: boolean | null
          requires_restart?: boolean | null
          subcategory?: string | null
          updated_at?: string
          value_constraints?: Json | null
          value_type?: string
        }
        Relationships: []
      }
      power_base_scores: {
        Row: {
          coercive_power: number | null
          created_at: string | null
          expert_power: number | null
          id: string
          informational_power: number | null
          legitimate_power: number | null
          leverage_points: Json | null
          power_dynamics_history: Json | null
          profile_id: string | null
          referent_power: number | null
          reward_power: number | null
          total_power_score: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          coercive_power?: number | null
          created_at?: string | null
          expert_power?: number | null
          id?: string
          informational_power?: number | null
          legitimate_power?: number | null
          leverage_points?: Json | null
          power_dynamics_history?: Json | null
          profile_id?: string | null
          referent_power?: number | null
          reward_power?: number | null
          total_power_score?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          coercive_power?: number | null
          created_at?: string | null
          expert_power?: number | null
          id?: string
          informational_power?: number | null
          legitimate_power?: number | null
          leverage_points?: Json | null
          power_dynamics_history?: Json | null
          profile_id?: string | null
          referent_power?: number | null
          reward_power?: number | null
          total_power_score?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "power_base_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      power_network_analyses: {
        Row: {
          analysis_type: string
          average_clustering: number | null
          betweenness_rankings: Json | null
          brokers: Json | null
          closeness_rankings: Json | null
          coalition_strength: Json | null
          communities: Json | null
          community_bridges: Json | null
          computed_at: string
          created_at: string
          critical_nodes: Json | null
          detected_coalitions: Json | null
          eigenvector_rankings: Json | null
          expires_at: string | null
          gatekeepers: Json | null
          id: string
          influence_paths: Json | null
          influencers: Json | null
          katz_rankings: Json | null
          network_density: number | null
          optimal_targets: Json | null
          pagerank_rankings: Json | null
          power_scores: Json | null
          scope_description: string | null
          structural_holes: Json | null
          total_edges: number | null
          total_nodes: number | null
          user_id: string
          vulnerability_map: Json | null
          weak_ties: Json | null
        }
        Insert: {
          analysis_type: string
          average_clustering?: number | null
          betweenness_rankings?: Json | null
          brokers?: Json | null
          closeness_rankings?: Json | null
          coalition_strength?: Json | null
          communities?: Json | null
          community_bridges?: Json | null
          computed_at?: string
          created_at?: string
          critical_nodes?: Json | null
          detected_coalitions?: Json | null
          eigenvector_rankings?: Json | null
          expires_at?: string | null
          gatekeepers?: Json | null
          id?: string
          influence_paths?: Json | null
          influencers?: Json | null
          katz_rankings?: Json | null
          network_density?: number | null
          optimal_targets?: Json | null
          pagerank_rankings?: Json | null
          power_scores?: Json | null
          scope_description?: string | null
          structural_holes?: Json | null
          total_edges?: number | null
          total_nodes?: number | null
          user_id: string
          vulnerability_map?: Json | null
          weak_ties?: Json | null
        }
        Update: {
          analysis_type?: string
          average_clustering?: number | null
          betweenness_rankings?: Json | null
          brokers?: Json | null
          closeness_rankings?: Json | null
          coalition_strength?: Json | null
          communities?: Json | null
          community_bridges?: Json | null
          computed_at?: string
          created_at?: string
          critical_nodes?: Json | null
          detected_coalitions?: Json | null
          eigenvector_rankings?: Json | null
          expires_at?: string | null
          gatekeepers?: Json | null
          id?: string
          influence_paths?: Json | null
          influencers?: Json | null
          katz_rankings?: Json | null
          network_density?: number | null
          optimal_targets?: Json | null
          pagerank_rankings?: Json | null
          power_scores?: Json | null
          scope_description?: string | null
          structural_holes?: Json | null
          total_edges?: number | null
          total_nodes?: number | null
          user_id?: string
          vulnerability_map?: Json | null
          weak_ties?: Json | null
        }
        Relationships: []
      }
      predictive_supremacy: {
        Row: {
          accuracy_history: Json | null
          actual_outcome: Json | null
          causal_chain: Json | null
          confidence_interval: Json | null
          created_at: string
          id: string
          intervention_points: Json | null
          prediction_domain: string
          prediction_type: string
          probability_distribution: Json | null
          profile_id: string | null
          time_horizon_hours: number | null
          user_id: string
          validated_at: string | null
        }
        Insert: {
          accuracy_history?: Json | null
          actual_outcome?: Json | null
          causal_chain?: Json | null
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          intervention_points?: Json | null
          prediction_domain: string
          prediction_type: string
          probability_distribution?: Json | null
          profile_id?: string | null
          time_horizon_hours?: number | null
          user_id: string
          validated_at?: string | null
        }
        Update: {
          accuracy_history?: Json | null
          actual_outcome?: Json | null
          causal_chain?: Json | null
          confidence_interval?: Json | null
          created_at?: string
          id?: string
          intervention_points?: Json | null
          prediction_domain?: string
          prediction_type?: string
          probability_distribution?: Json | null
          profile_id?: string | null
          time_horizon_hours?: number | null
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "predictive_supremacy_profile_id_fkey"
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
      profiles: {
        Row: {
          activation_date: string | null
          avatar_url: string | null
          bio: string | null
          bio_encrypted: string | null
          created_at: string
          data_richness_score: number | null
          encryption_classification: string | null
          engagement_score: number | null
          first_name: string
          hierarchy_level: string | null
          id: string
          initial_intel_completed: boolean | null
          instagram_followers: number | null
          instagram_handle: string | null
          is_active: boolean | null
          is_encrypted: boolean | null
          is_favorite: boolean | null
          is_self_profile: boolean | null
          job_title: string | null
          last_accessed_at: string | null
          last_contact_date: string | null
          last_enriched_at: string | null
          last_interaction_at: string | null
          last_name: string | null
          last_osint_scan: string | null
          last_social_capture_at: string | null
          linkedin_connections: number | null
          linkedin_handle: string | null
          linkedin_url: string | null
          linkedin_url_encrypted: string | null
          nickname: string | null
          notes: string | null
          notes_encrypted: string | null
          organization: string | null
          osint_scan_priority: number | null
          relationship_subtype: string | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms: Json | null
          tags: string[] | null
          tiktok_followers: number | null
          tiktok_handle: string | null
          twitter_followers: number | null
          twitter_handle: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          activation_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_encrypted?: string | null
          created_at?: string
          data_richness_score?: number | null
          encryption_classification?: string | null
          engagement_score?: number | null
          first_name: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_encrypted?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_accessed_at?: string | null
          last_contact_date?: string | null
          last_enriched_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          last_social_capture_at?: string | null
          linkedin_connections?: number | null
          linkedin_handle?: string | null
          linkedin_url?: string | null
          linkedin_url_encrypted?: string | null
          nickname?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms?: Json | null
          tags?: string[] | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          activation_date?: string | null
          avatar_url?: string | null
          bio?: string | null
          bio_encrypted?: string | null
          created_at?: string
          data_richness_score?: number | null
          encryption_classification?: string | null
          engagement_score?: number | null
          first_name?: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          instagram_followers?: number | null
          instagram_handle?: string | null
          is_active?: boolean | null
          is_encrypted?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_accessed_at?: string | null
          last_contact_date?: string | null
          last_enriched_at?: string | null
          last_interaction_at?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          last_social_capture_at?: string | null
          linkedin_connections?: number | null
          linkedin_handle?: string | null
          linkedin_url?: string | null
          linkedin_url_encrypted?: string | null
          nickname?: string | null
          notes?: string | null
          notes_encrypted?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          social_platforms?: Json | null
          tags?: string[] | null
          tiktok_followers?: number | null
          tiktok_handle?: string | null
          twitter_followers?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_access_logs: {
        Row: {
          access_context: string | null
          access_type: string
          accessed_at: string
          current_hash: string | null
          fields_accessed: string[] | null
          id: string
          ip_address: unknown
          previous_hash: string | null
          profile_id: string
          user_agent: string | null
          user_id: string
          was_decrypted: boolean | null
        }
        Insert: {
          access_context?: string | null
          access_type: string
          accessed_at?: string
          current_hash?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id: string
          user_agent?: string | null
          user_id: string
          was_decrypted?: boolean | null
        }
        Update: {
          access_context?: string | null
          access_type?: string
          accessed_at?: string
          current_hash?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id?: string
          user_agent?: string | null
          user_id?: string
          was_decrypted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "profiles_access_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          avg_cost_cents: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          model_tier: string | null
          prompt_key: string
          prompt_text: string
          success_rate: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
          variables: string[] | null
          version: number
        }
        Insert: {
          avg_cost_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_tier?: string | null
          prompt_key: string
          prompt_text: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
          variables?: string[] | null
          version?: number
        }
        Update: {
          avg_cost_cents?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model_tier?: string | null
          prompt_key?: string
          prompt_text?: string
          success_rate?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
          variables?: string[] | null
          version?: number
        }
        Relationships: []
      }
      proximity_events: {
        Row: {
          confidence: number | null
          context_data: Json | null
          created_at: string | null
          detected_at: string | null
          detected_profile_id: string | null
          detection_method: string
          device_info: Json | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          interaction_type: string | null
          latitude: number | null
          location_accuracy: number | null
          location_name: string | null
          longitude: number | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          context_data?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_profile_id?: string | null
          detection_method: string
          device_info?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          interaction_type?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          location_name?: string | null
          longitude?: number | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          context_data?: Json | null
          created_at?: string | null
          detected_at?: string | null
          detected_profile_id?: string | null
          detection_method?: string
          device_info?: Json | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          interaction_type?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          location_name?: string | null
          longitude?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proximity_events_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proximity_events_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "proximity_events_detected_profile_id_fkey"
            columns: ["detected_profile_id"]
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
      psychological_profiles_access_logs: {
        Row: {
          access_denied: boolean | null
          access_type: string
          accessed_at: string
          clearance_used: string | null
          current_hash: string | null
          denial_reason: string | null
          fields_accessed: string[] | null
          id: string
          ip_address: unknown
          previous_hash: string | null
          profile_id: string
          user_id: string
          was_decrypted: boolean | null
        }
        Insert: {
          access_denied?: boolean | null
          access_type: string
          accessed_at?: string
          clearance_used?: string | null
          current_hash?: string | null
          denial_reason?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id: string
          user_id: string
          was_decrypted?: boolean | null
        }
        Update: {
          access_denied?: boolean | null
          access_type?: string
          accessed_at?: string
          clearance_used?: string | null
          current_hash?: string | null
          denial_reason?: string | null
          fields_accessed?: string[] | null
          id?: string
          ip_address?: unknown
          previous_hash?: string | null
          profile_id?: string
          user_id?: string
          was_decrypted?: boolean | null
        }
        Relationships: []
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quantum_states: {
        Row: {
          coherence_duration: unknown
          collapsed_at: string | null
          collapsed_state: Json | null
          created_at: string
          decoherence_factors: Json | null
          entangled_profiles: Json | null
          id: string
          measurement_strategy: Json | null
          observation_effects: Json | null
          probability_amplitudes: Json | null
          profile_id: string | null
          superposition_states: Json | null
          user_id: string
        }
        Insert: {
          coherence_duration?: unknown
          collapsed_at?: string | null
          collapsed_state?: Json | null
          created_at?: string
          decoherence_factors?: Json | null
          entangled_profiles?: Json | null
          id?: string
          measurement_strategy?: Json | null
          observation_effects?: Json | null
          probability_amplitudes?: Json | null
          profile_id?: string | null
          superposition_states?: Json | null
          user_id: string
        }
        Update: {
          coherence_duration?: unknown
          collapsed_at?: string | null
          collapsed_state?: Json | null
          created_at?: string
          decoherence_factors?: Json | null
          entangled_profiles?: Json | null
          id?: string
          measurement_strategy?: Json | null
          observation_effects?: Json | null
          probability_amplitudes?: Json | null
          profile_id?: string | null
          superposition_states?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "quantum_states_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      query_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          expires_at: string
          id: string
          result: Json
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          expires_at: string
          id?: string
          result: Json
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          result?: Json
          user_id?: string
        }
        Relationships: []
      }
      query_suggestions: {
        Row: {
          created_at: string | null
          id: string
          relevance_score: number | null
          suggestion_text: string
          suggestion_type: string | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          suggestion_text: string
          suggestion_type?: string | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          suggestion_text?: string
          suggestion_type?: string | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      rag_query_logs: {
        Row: {
          avg_result_score: number | null
          created_at: string | null
          filters_applied: Json | null
          id: string
          query_embedding: string | null
          query_text: string
          response_time_ms: number | null
          result_count: number | null
          search_mode: string | null
          top_result_score: number | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          avg_result_score?: number | null
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          query_embedding?: string | null
          query_text: string
          response_time_ms?: number | null
          result_count?: number | null
          search_mode?: string | null
          top_result_score?: number | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          avg_result_score?: number | null
          created_at?: string | null
          filters_applied?: Json | null
          id?: string
          query_embedding?: string | null
          query_text?: string
          response_time_ms?: number | null
          result_count?: number | null
          search_mode?: string | null
          top_result_score?: number | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reality_frameworks: {
        Row: {
          anchor_points: Json | null
          breakthrough_triggers: Json | null
          cognitive_load_score: number | null
          created_at: string
          current_reality_map: Json | null
          framework_name: string
          framework_type: string
          id: string
          is_active: boolean | null
          profile_id: string | null
          progress_percentage: number | null
          resistance_patterns: Json | null
          target_reality_map: Json | null
          transition_strategy: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_points?: Json | null
          breakthrough_triggers?: Json | null
          cognitive_load_score?: number | null
          created_at?: string
          current_reality_map?: Json | null
          framework_name: string
          framework_type?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          progress_percentage?: number | null
          resistance_patterns?: Json | null
          target_reality_map?: Json | null
          transition_strategy?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_points?: Json | null
          breakthrough_triggers?: Json | null
          cognitive_load_score?: number | null
          created_at?: string
          current_reality_map?: Json | null
          framework_name?: string
          framework_type?: string
          id?: string
          is_active?: boolean | null
          profile_id?: string | null
          progress_percentage?: number | null
          resistance_patterns?: Json | null
          target_reality_map?: Json | null
          transition_strategy?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_frameworks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_manipulation: {
        Row: {
          belief_architecture: Json | null
          consensus_engineering: Json | null
          created_at: string
          effectiveness_score: number | null
          id: string
          manipulation_type: string
          narrative_control: Json | null
          perception_vectors: Json | null
          profile_id: string | null
          stability_rating: number | null
          target_reality: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          belief_architecture?: Json | null
          consensus_engineering?: Json | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          manipulation_type: string
          narrative_control?: Json | null
          perception_vectors?: Json | null
          profile_id?: string | null
          stability_rating?: number | null
          target_reality?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          belief_architecture?: Json | null
          consensus_engineering?: Json | null
          created_at?: string
          effectiveness_score?: number | null
          id?: string
          manipulation_type?: string
          narrative_control?: Json | null
          perception_vectors?: Json | null
          profile_id?: string | null
          stability_rating?: number | null
          target_reality?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reality_manipulation_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reality_synthesis: {
        Row: {
          causal_depth: number | null
          confidence_score: number | null
          created_at: string
          id: string
          input_sources: Json | null
          reality_model: Json | null
          spatial_accuracy: number | null
          synthesis_timestamp: string | null
          synthesis_type: string
          temporal_accuracy: number | null
          updated_at: string
          user_id: string
          validity_window: Json | null
        }
        Insert: {
          causal_depth?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_sources?: Json | null
          reality_model?: Json | null
          spatial_accuracy?: number | null
          synthesis_timestamp?: string | null
          synthesis_type: string
          temporal_accuracy?: number | null
          updated_at?: string
          user_id: string
          validity_window?: Json | null
        }
        Update: {
          causal_depth?: number | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_sources?: Json | null
          reality_model?: Json | null
          spatial_accuracy?: number | null
          synthesis_timestamp?: string | null
          synthesis_type?: string
          temporal_accuracy?: number | null
          updated_at?: string
          user_id?: string
          validity_window?: Json | null
        }
        Relationships: []
      }
      relationship_goals: {
        Row: {
          created_at: string
          current_streak: number | null
          description: string | null
          frequency: string
          goal_type: string
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          longest_streak: number | null
          next_due_at: string | null
          profile_id: string | null
          target_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency: string
          goal_type: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          description?: string | null
          frequency?: string
          goal_type?: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          longest_streak?: number | null
          next_due_at?: string | null
          profile_id?: string | null
          target_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_inferences: {
        Row: {
          confidence_score: number | null
          created_at: string
          evidence: Json | null
          id: string
          inference_type: string
          is_verified: boolean | null
          opportunity_score: number | null
          opportunity_type: string | null
          path_distance: number | null
          path_profiles: string[] | null
          relationship_strength: number | null
          source_profile_id: string
          target_profile_id: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          inference_type: string
          is_verified?: boolean | null
          opportunity_score?: number | null
          opportunity_type?: string | null
          path_distance?: number | null
          path_profiles?: string[] | null
          relationship_strength?: number | null
          source_profile_id: string
          target_profile_id: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          evidence?: Json | null
          id?: string
          inference_type?: string
          is_verified?: boolean | null
          opportunity_score?: number | null
          opportunity_type?: string | null
          path_distance?: number | null
          path_profiles?: string[] | null
          relationship_strength?: number | null
          source_profile_id?: string
          target_profile_id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_source_profile_id_fkey"
            columns: ["source_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_inferences_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_opportunities: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          opportunity_type: string
          optimal_timing: string | null
          priority: number | null
          profile_id: string
          status: string | null
          suggested_action: string | null
          suggested_methodology_id: string | null
          trigger_event: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          opportunity_type: string
          optimal_timing?: string | null
          priority?: number | null
          profile_id: string
          status?: string | null
          suggested_action?: string | null
          suggested_methodology_id?: string | null
          trigger_event?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          opportunity_type?: string
          optimal_timing?: string | null
          priority?: number | null
          profile_id?: string
          status?: string | null
          suggested_action?: string | null
          suggested_methodology_id?: string | null
          trigger_event?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_opportunities_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationship_opportunities_suggested_methodology_id_fkey"
            columns: ["suggested_methodology_id"]
            isOneToOne: false
            referencedRelation: "intelligence_methodologies"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_scores: {
        Row: {
          created_at: string
          decay_rate: number | null
          diversity_score: number
          frequency_score: number
          id: string
          last_calculated_at: string
          overall_score: number
          profile_id: string
          recency_score: number
          sentiment_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decay_rate?: number | null
          diversity_score?: number
          frequency_score?: number
          id?: string
          last_calculated_at?: string
          overall_score?: number
          profile_id: string
          recency_score?: number
          sentiment_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decay_rate?: number | null
          diversity_score?: number
          frequency_score?: number
          id?: string
          last_calculated_at?: string
          overall_score?: number
          profile_id?: string
          recency_score?: number
          sentiment_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_trends: {
        Row: {
          communication_count: number | null
          created_at: string
          health_score: number
          id: string
          profile_id: string
          recorded_at: string
          sentiment_avg: number | null
          user_id: string
        }
        Insert: {
          communication_count?: number | null
          created_at?: string
          health_score: number
          id?: string
          profile_id: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id: string
        }
        Update: {
          communication_count?: number | null
          created_at?: string
          health_score?: number
          id?: string
          profile_id?: string
          recorded_at?: string
          sentiment_avg?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "relationship_trends_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports_schedule: {
        Row: {
          config: Json | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          name: string
          next_scheduled_at: string | null
          recipients: string[] | null
          report_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name: string
          next_scheduled_at?: string | null
          recipients?: string[] | null
          report_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          name?: string
          next_scheduled_at?: string | null
          recipients?: string[] | null
          report_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rf_signal_captures: {
        Row: {
          analysis: Json | null
          associated_profile_id: string | null
          bandwidth_hz: number | null
          captured_at: string | null
          decoded_data: Json | null
          device_fingerprint: Json | null
          device_id: string | null
          frequency_hz: number | null
          id: string
          location: Json | null
          location_name: string | null
          mission_id: string | null
          modulation: string | null
          protocol: string | null
          raw_data_url: string | null
          signal_strength_dbm: number | null
          signal_type: string
          threat_classification: string | null
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          associated_profile_id?: string | null
          bandwidth_hz?: number | null
          captured_at?: string | null
          decoded_data?: Json | null
          device_fingerprint?: Json | null
          device_id?: string | null
          frequency_hz?: number | null
          id?: string
          location?: Json | null
          location_name?: string | null
          mission_id?: string | null
          modulation?: string | null
          protocol?: string | null
          raw_data_url?: string | null
          signal_strength_dbm?: number | null
          signal_type: string
          threat_classification?: string | null
          user_id: string
        }
        Update: {
          analysis?: Json | null
          associated_profile_id?: string | null
          bandwidth_hz?: number | null
          captured_at?: string | null
          decoded_data?: Json | null
          device_fingerprint?: Json | null
          device_id?: string | null
          frequency_hz?: number | null
          id?: string
          location?: Json | null
          location_name?: string | null
          mission_id?: string | null
          modulation?: string | null
          protocol?: string | null
          raw_data_url?: string | null
          signal_strength_dbm?: number | null
          signal_type?: string
          threat_classification?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rf_signal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "rf_signal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "rf_signal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rf_signal_captures_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rf_signal_captures_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
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
      saga_transactions: {
        Row: {
          audit_log: Json | null
          completed_at: string | null
          context: Json | null
          created_at: string | null
          current_step: number | null
          error_message: string | null
          id: string
          result: Json | null
          saga_name: string
          saga_type: string | null
          started_at: string | null
          status: string | null
          steps: Json
          total_steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audit_log?: Json | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          result?: Json | null
          saga_name: string
          saga_type?: string | null
          started_at?: string | null
          status?: string | null
          steps: Json
          total_steps: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audit_log?: Json | null
          completed_at?: string | null
          context?: Json | null
          created_at?: string | null
          current_step?: number | null
          error_message?: string | null
          id?: string
          result?: Json | null
          saga_name?: string
          saga_type?: string | null
          started_at?: string | null
          status?: string | null
          steps?: Json
          total_steps?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          is_pinned: boolean | null
          last_used_at: string | null
          name: string
          query_text: string | null
          updated_at: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          is_pinned?: boolean | null
          last_used_at?: string | null
          name: string
          query_text?: string | null
          updated_at?: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          is_pinned?: boolean | null
          last_used_at?: string | null
          name?: string
          query_text?: string | null
          updated_at?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      scheduled_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_name: string
          result: Json | null
          started_at: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name: string
          result?: Json | null
          started_at?: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_name?: string
          result?: Json | null
          started_at?: string
          status?: string | null
        }
        Relationships: []
      }
      screenshot_imports: {
        Row: {
          confidence_score: number | null
          created_at: string
          device_source: string | null
          error_message: string | null
          extracted_data: Json | null
          id: string
          image_urls: string[]
          processing_completed_at: string | null
          processing_started_at: string | null
          profile_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          status: string | null
          storage_paths: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          device_source?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          image_urls: string[]
          processing_completed_at?: string | null
          processing_started_at?: string | null
          profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type: string
          status?: string | null
          storage_paths?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          device_source?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          image_urls?: string[]
          processing_completed_at?: string | null
          processing_started_at?: string | null
          profile_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          status?: string | null
          storage_paths?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "screenshot_imports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "screenshot_imports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "screenshot_imports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      sensitive_data_access_log: {
        Row: {
          access_granted: boolean
          access_type: string
          created_at: string | null
          data_classification: Database["public"]["Enums"]["clearance_level"]
          denial_reason: string | null
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_clearance: Database["public"]["Enums"]["clearance_level"] | null
          user_id: string
        }
        Insert: {
          access_granted: boolean
          access_type: string
          created_at?: string | null
          data_classification: Database["public"]["Enums"]["clearance_level"]
          denial_reason?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_clearance?: Database["public"]["Enums"]["clearance_level"] | null
          user_id: string
        }
        Update: {
          access_granted?: boolean
          access_type?: string
          created_at?: string | null
          data_classification?: Database["public"]["Enums"]["clearance_level"]
          denial_reason?: string | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_clearance?: Database["public"]["Enums"]["clearance_level"] | null
          user_id?: string
        }
        Relationships: []
      }
      sensor_network_nodes: {
        Row: {
          alert_rules: Json | null
          battery_level: number | null
          created_at: string | null
          hardware_device_id: string | null
          id: string
          is_active: boolean | null
          last_reading_at: string | null
          location: Json | null
          location_description: string | null
          node_address: string
          node_name: string | null
          node_type: string | null
          sensors: Json | null
          signal_strength: number | null
          solar_voltage: number | null
          updated_at: string | null
          user_id: string
          zone_name: string | null
        }
        Insert: {
          alert_rules?: Json | null
          battery_level?: number | null
          created_at?: string | null
          hardware_device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_reading_at?: string | null
          location?: Json | null
          location_description?: string | null
          node_address: string
          node_name?: string | null
          node_type?: string | null
          sensors?: Json | null
          signal_strength?: number | null
          solar_voltage?: number | null
          updated_at?: string | null
          user_id: string
          zone_name?: string | null
        }
        Update: {
          alert_rules?: Json | null
          battery_level?: number | null
          created_at?: string | null
          hardware_device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_reading_at?: string | null
          location?: Json | null
          location_description?: string | null
          node_address?: string
          node_name?: string | null
          node_type?: string | null
          sensors?: Json | null
          signal_strength?: number | null
          solar_voltage?: number | null
          updated_at?: string | null
          user_id?: string
          zone_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_network_nodes_hardware_device_id_fkey"
            columns: ["hardware_device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          alert_triggered: boolean | null
          anomaly_detected: boolean | null
          anomaly_type: string | null
          id: string
          mission_id: string | null
          node_id: string
          recorded_at: string | null
          sensor_type: string
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          alert_triggered?: boolean | null
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          id?: string
          mission_id?: string | null
          node_id: string
          recorded_at?: string | null
          sensor_type: string
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          alert_triggered?: boolean | null
          anomaly_detected?: boolean | null
          anomaly_type?: string | null
          id?: string
          mission_id?: string | null
          node_id?: string
          recorded_at?: string | null
          sensor_type?: string
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_readings_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "sensor_network_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_contacts: {
        Row: {
          id: string
          notes: string | null
          permission_level: string
          profile_id: string
          shared_at: string
          shared_by: string
          workspace_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          permission_level?: string
          profile_id: string
          shared_at?: string
          shared_by: string
          workspace_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          permission_level?: string
          profile_id?: string
          shared_at?: string
          shared_by?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_contacts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_experiences: {
        Row: {
          created_at: string
          description: string | null
          experience_date: string | null
          experience_type: string
          id: string
          location: string | null
          media_urls: string[] | null
          profile_id: string
          sentiment: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          experience_type: string
          id?: string
          location?: string | null
          media_urls?: string[] | null
          profile_id: string
          sentiment?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          experience_type?: string
          id?: string
          location?: string | null
          media_urls?: string[] | null
          profile_id?: string
          sentiment?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "shared_experiences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      singularity_objectives: {
        Row: {
          constraint_parameters: Json | null
          created_at: string | null
          estimated_completion: string | null
          id: string
          objective_name: string
          objective_type: string
          priority_level: number | null
          progress_percentage: number | null
          resource_requirements: Json | null
          status: string | null
          sub_objectives: Json | null
          success_criteria: Json
          target_profiles: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          constraint_parameters?: Json | null
          created_at?: string | null
          estimated_completion?: string | null
          id?: string
          objective_name: string
          objective_type?: string
          priority_level?: number | null
          progress_percentage?: number | null
          resource_requirements?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria: Json
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          constraint_parameters?: Json | null
          created_at?: string | null
          estimated_completion?: string | null
          id?: string
          objective_name?: string
          objective_type?: string
          priority_level?: number | null
          progress_percentage?: number | null
          resource_requirements?: Json | null
          status?: string | null
          sub_objectives?: Json | null
          success_criteria?: Json
          target_profiles?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          author_avatar_url: string | null
          author_display_name: string | null
          author_profile_url: string | null
          author_username: string | null
          comment_id: string | null
          commented_at: string | null
          content: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          likes_count: number | null
          platform: string
          post_id: string | null
          replied_to_id: string | null
          replies_count: number | null
          scraped_at: string | null
          sentiment_score: number | null
          user_id: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_profile_url?: string | null
          author_username?: string | null
          comment_id?: string | null
          commented_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          platform: string
          post_id?: string | null
          replied_to_id?: string | null
          replies_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          user_id: string
        }
        Update: {
          author_avatar_url?: string | null
          author_display_name?: string | null
          author_profile_url?: string | null
          author_username?: string | null
          comment_id?: string | null
          commented_at?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          likes_count?: number | null
          platform?: string
          post_id?: string | null
          replied_to_id?: string | null
          replies_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_comments_replied_to_id_fkey"
            columns: ["replied_to_id"]
            isOneToOne: false
            referencedRelation: "social_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          connected_avatar_url: string | null
          connected_bio: string | null
          connected_display_name: string | null
          connected_followers_count: number | null
          connected_profile_url: string | null
          connected_user_id: string | null
          connected_username: string
          connected_verified: boolean | null
          connection_type: string
          created_at: string | null
          first_seen_at: string | null
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          platform: string
          profile_id: string | null
          relationship_strength: number | null
          scraped_at: string | null
          user_id: string
        }
        Insert: {
          connected_avatar_url?: string | null
          connected_bio?: string | null
          connected_display_name?: string | null
          connected_followers_count?: number | null
          connected_profile_url?: string | null
          connected_user_id?: string | null
          connected_username: string
          connected_verified?: boolean | null
          connection_type: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          platform: string
          profile_id?: string | null
          relationship_strength?: number | null
          scraped_at?: string | null
          user_id: string
        }
        Update: {
          connected_avatar_url?: string | null
          connected_bio?: string | null
          connected_display_name?: string | null
          connected_followers_count?: number | null
          connected_profile_url?: string | null
          connected_user_id?: string | null
          connected_username?: string
          connected_verified?: boolean | null
          connection_type?: string
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          platform?: string
          profile_id?: string | null
          relationship_strength?: number | null
          scraped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_identity_links: {
        Row: {
          capture_ids: string[]
          confidence_score: number | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          is_confirmed: boolean | null
          match_reasons: Json | null
          platforms: string[]
          primary_profile_id: string | null
          updated_at: string | null
          user_id: string
          usernames: Json | null
        }
        Insert: {
          capture_ids: string[]
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          match_reasons?: Json | null
          platforms: string[]
          primary_profile_id?: string | null
          updated_at?: string | null
          user_id: string
          usernames?: Json | null
        }
        Update: {
          capture_ids?: string[]
          confidence_score?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          match_reasons?: Json | null
          platforms?: string[]
          primary_profile_id?: string | null
          updated_at?: string | null
          user_id?: string
          usernames?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_identity_links_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_likers: {
        Row: {
          created_at: string | null
          id: string
          liked_at: string | null
          liker_avatar_url: string | null
          liker_display_name: string | null
          liker_profile_url: string | null
          liker_user_id: string | null
          liker_username: string
          liker_verified: boolean | null
          post_id: string | null
          scraped_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_at?: string | null
          liker_avatar_url?: string | null
          liker_display_name?: string | null
          liker_profile_url?: string | null
          liker_user_id?: string | null
          liker_username: string
          liker_verified?: boolean | null
          post_id?: string | null
          scraped_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_at?: string | null
          liker_avatar_url?: string | null
          liker_display_name?: string | null
          liker_profile_url?: string | null
          liker_user_id?: string | null
          liker_username?: string
          liker_verified?: boolean | null
          post_id?: string | null
          scraped_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_likers_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          caption: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          is_pinned: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          location: string | null
          media_type: string | null
          media_urls: Json | null
          mentions: string[] | null
          platform: string
          post_id: string
          post_url: string | null
          posted_at: string | null
          profile_id: string | null
          raw_data: Json | null
          saves_count: number | null
          scraped_at: string | null
          sentiment_score: number | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform: string
          post_id: string
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          saves_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          media_type?: string | null
          media_urls?: Json | null
          mentions?: string[] | null
          platform?: string
          post_id?: string
          post_url?: string | null
          posted_at?: string | null
          profile_id?: string | null
          raw_data?: Json | null
          saves_count?: number | null
          scraped_at?: string | null
          sentiment_score?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_scrape_jobs: {
        Row: {
          completed_at: string | null
          cost_cents: number | null
          created_at: string | null
          error_message: string | null
          id: string
          is_recurring: boolean | null
          items_scraped: number | null
          items_total: number | null
          last_cursor: string | null
          platform: string
          profile_id: string | null
          provider: string | null
          raw_response: Json | null
          recurrence_interval: string | null
          scheduled_for: string | null
          scrape_type: string
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          items_scraped?: number | null
          items_total?: number | null
          last_cursor?: string | null
          platform: string
          profile_id?: string | null
          provider?: string | null
          raw_response?: Json | null
          recurrence_interval?: string | null
          scheduled_for?: string | null
          scrape_type: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cost_cents?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_recurring?: boolean | null
          items_scraped?: number | null
          items_total?: number | null
          last_cursor?: string | null
          platform?: string
          profile_id?: string | null
          provider?: string | null
          raw_response?: Json | null
          recurrence_interval?: string | null
          scheduled_for?: string | null
          scrape_type?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "social_scrape_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      source_asset_registry: {
        Row: {
          analysis_count: number | null
          asset_id: string
          asset_type: string
          content_hash: string | null
          created_at: string
          deleted_at: string | null
          deletion_reason: string | null
          file_size_bytes: number | null
          first_seen_at: string
          has_active_analyses: boolean | null
          id: string
          last_analyzed_at: string | null
          metadata: Json | null
          original_filename: string | null
          original_mime_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_count?: number | null
          asset_id: string
          asset_type: string
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          file_size_bytes?: number | null
          first_seen_at?: string
          has_active_analyses?: boolean | null
          id?: string
          last_analyzed_at?: string | null
          metadata?: Json | null
          original_filename?: string | null
          original_mime_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_count?: number | null
          asset_id?: string
          asset_type?: string
          content_hash?: string | null
          created_at?: string
          deleted_at?: string | null
          deletion_reason?: string | null
          file_size_bytes?: number | null
          first_seen_at?: string
          has_active_analyses?: boolean | null
          id?: string
          last_analyzed_at?: string | null
          metadata?: Json | null
          original_filename?: string | null
          original_mime_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stockholm_syndrome_tracking: {
        Row: {
          bonding_score: number | null
          captor_identification_level: number | null
          created_at: string
          defender_behavior_instances: Json | null
          gratitude_for_kindness_events: Json | null
          id: string
          isolation_from_others: number | null
          kindness_cruelty_ratio: Json | null
          optimal_ratio_calculation: Json | null
          perceived_threat_level: number | null
          profile_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonding_score?: number | null
          captor_identification_level?: number | null
          created_at?: string
          defender_behavior_instances?: Json | null
          gratitude_for_kindness_events?: Json | null
          id?: string
          isolation_from_others?: number | null
          kindness_cruelty_ratio?: Json | null
          optimal_ratio_calculation?: Json | null
          perceived_threat_level?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonding_score?: number | null
          captor_identification_level?: number | null
          created_at?: string
          defender_behavior_instances?: Json | null
          gratitude_for_kindness_events?: Json | null
          id?: string
          isolation_from_others?: number | null
          kindness_cruelty_ratio?: Json | null
          optimal_ratio_calculation?: Json | null
          perceived_threat_level?: number | null
          profile_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "stockholm_syndrome_tracking_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_snapshots: {
        Row: {
          created_at: string | null
          id: string
          media_by_type: Json | null
          snapshot_date: string
          total_contacts: number | null
          total_document_bytes: number | null
          total_document_files: number | null
          total_media_bytes: number | null
          total_media_files: number | null
          total_messages: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_by_type?: Json | null
          snapshot_date: string
          total_contacts?: number | null
          total_document_bytes?: number | null
          total_document_files?: number | null
          total_media_bytes?: number | null
          total_media_files?: number | null
          total_messages?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_by_type?: Json | null
          snapshot_date?: string
          total_contacts?: number | null
          total_document_bytes?: number | null
          total_document_files?: number | null
          total_media_bytes?: number | null
          total_media_files?: number | null
          total_messages?: number | null
          user_id?: string
        }
        Relationships: []
      }
      strategic_omnipotence: {
        Row: {
          contingency_branches: Json | null
          created_at: string
          execution_timeline: Json | null
          id: string
          objective_hierarchy: Json | null
          outcome: Json | null
          power_projection: Json | null
          resource_allocation: Json | null
          risk_assessment: Json | null
          status: string | null
          strategy_name: string
          success_probability: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contingency_branches?: Json | null
          created_at?: string
          execution_timeline?: Json | null
          id?: string
          objective_hierarchy?: Json | null
          outcome?: Json | null
          power_projection?: Json | null
          resource_allocation?: Json | null
          risk_assessment?: Json | null
          status?: string | null
          strategy_name: string
          success_probability?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contingency_branches?: Json | null
          created_at?: string
          execution_timeline?: Json | null
          id?: string
          objective_hierarchy?: Json | null
          outcome?: Json | null
          power_projection?: Json | null
          resource_allocation?: Json | null
          risk_assessment?: Json | null
          status?: string | null
          strategy_name?: string
          success_probability?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strategic_synthesis: {
        Row: {
          alternative_strategies: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          input_sources: Json
          profile_id: string | null
          recommendation_rank: number | null
          resource_efficiency: number | null
          risk_assessment: Json | null
          status: string | null
          synthesis_type: string
          synthesized_strategy: Json
          timeline_projection: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternative_strategies?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_sources: Json
          profile_id?: string | null
          recommendation_rank?: number | null
          resource_efficiency?: number | null
          risk_assessment?: Json | null
          status?: string | null
          synthesis_type: string
          synthesized_strategy: Json
          timeline_projection?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternative_strategies?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          input_sources?: Json
          profile_id?: string | null
          recommendation_rank?: number | null
          resource_efficiency?: number | null
          risk_assessment?: Json | null
          status?: string | null
          synthesis_type?: string
          synthesized_strategy?: Json
          timeline_projection?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "strategic_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      sync_cursors: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          items_synced_total: number | null
          last_item_id: string | null
          last_item_timestamp: string | null
          last_sync_at: string | null
          metadata: Json | null
          profile_id: string | null
          source_identifier: string | null
          source_type: string
          sync_hash: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_synced_total?: number | null
          last_item_id?: string | null
          last_item_timestamp?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          profile_id?: string | null
          source_identifier?: string | null
          source_type: string
          sync_hash?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          items_synced_total?: number | null
          last_item_id?: string | null
          last_item_timestamp?: string | null
          last_sync_at?: string | null
          metadata?: Json | null
          profile_id?: string | null
          source_identifier?: string | null
          source_type?: string
          sync_hash?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_cursors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sync_cursors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "sync_cursors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      synced_calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string | null
          description: string | null
          end_time: string
          external_id: string
          id: string
          location: string | null
          matched_profile_id: string | null
          raw_data: Json | null
          source: string
          start_time: string
          synced_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time: string
          external_id: string
          id?: string
          location?: string | null
          matched_profile_id?: string | null
          raw_data?: Json | null
          source: string
          start_time: string
          synced_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string | null
          description?: string | null
          end_time?: string
          external_id?: string
          id?: string
          location?: string | null
          matched_profile_id?: string | null
          raw_data?: Json | null
          source?: string
          start_time?: string
          synced_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "synced_calendar_events_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "synced_calendar_events_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "synced_calendar_events_matched_profile_id_fkey"
            columns: ["matched_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      synthetic_consensus_campaigns: {
        Row: {
          actual_consensus_level: number | null
          astroturf_networks: string[] | null
          authority_endorsements: Json | null
          campaign_name: string
          consensus_narrative: string | null
          created_at: string | null
          effectiveness_score: number | null
          id: string
          manufactured_agreement_sources: Json | null
          perceived_consensus_level: number | null
          social_proof_elements: Json | null
          spiral_of_silence_effect: number | null
          status: string | null
          target_audience_segments: Json | null
          target_belief: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_consensus_level?: number | null
          astroturf_networks?: string[] | null
          authority_endorsements?: Json | null
          campaign_name: string
          consensus_narrative?: string | null
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          manufactured_agreement_sources?: Json | null
          perceived_consensus_level?: number | null
          social_proof_elements?: Json | null
          spiral_of_silence_effect?: number | null
          status?: string | null
          target_audience_segments?: Json | null
          target_belief: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_consensus_level?: number | null
          astroturf_networks?: string[] | null
          authority_endorsements?: Json | null
          campaign_name?: string
          consensus_narrative?: string | null
          created_at?: string | null
          effectiveness_score?: number | null
          id?: string
          manufactured_agreement_sources?: Json | null
          perceived_consensus_level?: number | null
          social_proof_elements?: Json | null
          spiral_of_silence_effect?: number | null
          status?: string | null
          target_audience_segments?: Json | null
          target_belief?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_evolution_log: {
        Row: {
          affected_components: string[] | null
          after_state: Json | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          autonomous: boolean | null
          before_state: Json | null
          created_at: string | null
          evolution_type: string
          id: string
          improvement_metrics: Json | null
          rollback_available: boolean | null
          trigger_reason: string | null
          user_id: string
        }
        Insert: {
          affected_components?: string[] | null
          after_state?: Json | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          autonomous?: boolean | null
          before_state?: Json | null
          created_at?: string | null
          evolution_type: string
          id?: string
          improvement_metrics?: Json | null
          rollback_available?: boolean | null
          trigger_reason?: string | null
          user_id: string
        }
        Update: {
          affected_components?: string[] | null
          after_state?: Json | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          autonomous?: boolean | null
          before_state?: Json | null
          created_at?: string | null
          evolution_type?: string
          id?: string
          improvement_metrics?: Json | null
          rollback_available?: boolean | null
          trigger_reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_health: {
        Row: {
          active_alerts: Json | null
          alert_history: Json | null
          avg_latency_ms: number | null
          circuit_failure_count: number | null
          circuit_opened_at: string | null
          circuit_state: string | null
          component: string
          consecutive_failures: number | null
          errors_last_hour: number | null
          id: string
          last_heartbeat: string | null
          p95_latency_ms: number | null
          requests_last_hour: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          active_alerts?: Json | null
          alert_history?: Json | null
          avg_latency_ms?: number | null
          circuit_failure_count?: number | null
          circuit_opened_at?: string | null
          circuit_state?: string | null
          component: string
          consecutive_failures?: number | null
          errors_last_hour?: number | null
          id?: string
          last_heartbeat?: string | null
          p95_latency_ms?: number | null
          requests_last_hour?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          active_alerts?: Json | null
          alert_history?: Json | null
          avg_latency_ms?: number | null
          circuit_failure_count?: number | null
          circuit_opened_at?: string | null
          circuit_state?: string | null
          component?: string
          consecutive_failures?: number | null
          errors_last_hour?: number | null
          id?: string
          last_heartbeat?: string | null
          p95_latency_ms?: number | null
          requests_last_hour?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
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
      task_checkpoints: {
        Row: {
          created_at: string | null
          current_step: number | null
          data: Json | null
          error_message: string | null
          id: string
          status: string | null
          task_id: string
          task_name: string
          total_steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          error_message?: string | null
          id?: string
          status?: string | null
          task_id: string
          task_name: string
          total_steps: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          data?: Json | null
          error_message?: string | null
          id?: string
          status?: string | null
          task_id?: string
          task_name?: string
          total_steps?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_presence: {
        Row: {
          current_view: string | null
          id: string
          last_seen: string
          status: string
          user_id: string
          viewing_profile_id: string | null
          workspace_id: string
        }
        Insert: {
          current_view?: string | null
          id?: string
          last_seen?: string
          status?: string
          user_id: string
          viewing_profile_id?: string | null
          workspace_id: string
        }
        Update: {
          current_view?: string | null
          id?: string
          last_seen?: string
          status?: string
          user_id?: string
          viewing_profile_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_presence_viewing_profile_id_fkey"
            columns: ["viewing_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "team_presence_viewing_profile_id_fkey"
            columns: ["viewing_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "team_presence_viewing_profile_id_fkey"
            columns: ["viewing_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_presence_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      temporal_orchestrations: {
        Row: {
          contingency_branches: Json | null
          created_at: string
          current_position: Json | null
          estimated_completion: string | null
          id: string
          is_active: boolean | null
          orchestration_name: string
          orchestration_type: string
          synchronization_points: Json | null
          target_profiles: Json | null
          timeline_definition: Json | null
          trajectory_confidence: number | null
          updated_at: string
          user_id: string
          velocity_metrics: Json | null
        }
        Insert: {
          contingency_branches?: Json | null
          created_at?: string
          current_position?: Json | null
          estimated_completion?: string | null
          id?: string
          is_active?: boolean | null
          orchestration_name: string
          orchestration_type?: string
          synchronization_points?: Json | null
          target_profiles?: Json | null
          timeline_definition?: Json | null
          trajectory_confidence?: number | null
          updated_at?: string
          user_id: string
          velocity_metrics?: Json | null
        }
        Update: {
          contingency_branches?: Json | null
          created_at?: string
          current_position?: Json | null
          estimated_completion?: string | null
          id?: string
          is_active?: boolean | null
          orchestration_name?: string
          orchestration_type?: string
          synchronization_points?: Json | null
          target_profiles?: Json | null
          timeline_definition?: Json | null
          trajectory_confidence?: number | null
          updated_at?: string
          user_id?: string
          velocity_metrics?: Json | null
        }
        Relationships: []
      }
      thermal_captures: {
        Row: {
          ambient_temperature_celsius: number | null
          analysis: Json | null
          associated_profile_id: string | null
          captured_at: string | null
          detected_signatures: Json | null
          device_id: string | null
          heat_anomalies: Json | null
          id: string
          location: Json | null
          location_name: string | null
          max_temperature_celsius: number | null
          min_temperature_celsius: number | null
          mission_id: string | null
          occupancy_count: number | null
          overlay_image_url: string | null
          processed_image_url: string | null
          raw_thermal_url: string | null
          user_id: string
        }
        Insert: {
          ambient_temperature_celsius?: number | null
          analysis?: Json | null
          associated_profile_id?: string | null
          captured_at?: string | null
          detected_signatures?: Json | null
          device_id?: string | null
          heat_anomalies?: Json | null
          id?: string
          location?: Json | null
          location_name?: string | null
          max_temperature_celsius?: number | null
          min_temperature_celsius?: number | null
          mission_id?: string | null
          occupancy_count?: number | null
          overlay_image_url?: string | null
          processed_image_url?: string | null
          raw_thermal_url?: string | null
          user_id: string
        }
        Update: {
          ambient_temperature_celsius?: number | null
          analysis?: Json | null
          associated_profile_id?: string | null
          captured_at?: string | null
          detected_signatures?: Json | null
          device_id?: string | null
          heat_anomalies?: Json | null
          id?: string
          location?: Json | null
          location_name?: string | null
          max_temperature_celsius?: number | null
          min_temperature_celsius?: number | null
          mission_id?: string | null
          occupancy_count?: number | null
          overlay_image_url?: string | null
          processed_image_url?: string | null
          raw_thermal_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thermal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "thermal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "thermal_captures_associated_profile_id_fkey"
            columns: ["associated_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thermal_captures_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "hardware_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thermal_captures_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "intelligence_missions"
            referencedColumns: ["id"]
          },
        ]
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
      tracked_industries: {
        Row: {
          contacts_count: number | null
          created_at: string | null
          current_sentiment: number | null
          event_summary: string | null
          id: string
          industry_name: string
          keywords: string[] | null
          last_major_event: string | null
          opportunity_score: number | null
          risk_level: string | null
          sentiment_baseline: number | null
          sentiment_trend: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contacts_count?: number | null
          created_at?: string | null
          current_sentiment?: number | null
          event_summary?: string | null
          id?: string
          industry_name: string
          keywords?: string[] | null
          last_major_event?: string | null
          opportunity_score?: number | null
          risk_level?: string | null
          sentiment_baseline?: number | null
          sentiment_trend?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contacts_count?: number | null
          created_at?: string | null
          current_sentiment?: number | null
          event_summary?: string | null
          id?: string
          industry_name?: string
          keywords?: string[] | null
          last_major_event?: string | null
          opportunity_score?: number | null
          risk_level?: string | null
          sentiment_baseline?: number | null
          sentiment_trend?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trajectory_intercepts: {
        Row: {
          correction_progress: number | null
          created_at: string | null
          current_deviation: number | null
          current_trajectory: Json
          desired_trajectory: Json
          id: string
          intercept_points: Json | null
          intercept_status: string | null
          intervention_plan: Json | null
          next_intercept_at: string | null
          predicted_trajectory: Json
          profile_id: string | null
          trajectory_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          correction_progress?: number | null
          created_at?: string | null
          current_deviation?: number | null
          current_trajectory: Json
          desired_trajectory: Json
          id?: string
          intercept_points?: Json | null
          intercept_status?: string | null
          intervention_plan?: Json | null
          next_intercept_at?: string | null
          predicted_trajectory: Json
          profile_id?: string | null
          trajectory_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          correction_progress?: number | null
          created_at?: string | null
          current_deviation?: number | null
          current_trajectory?: Json
          desired_trajectory?: Json
          id?: string
          intercept_points?: Json | null
          intercept_status?: string | null
          intervention_plan?: Json | null
          next_intercept_at?: string | null
          predicted_trajectory?: Json
          profile_id?: string | null
          trajectory_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trajectory_intercepts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transcendence_operations: {
        Row: {
          breakthrough_moments: Json | null
          completed_at: string | null
          completion_percentage: number | null
          current_state: Json | null
          id: string
          initial_state: Json | null
          is_active: boolean | null
          lessons_learned: Json | null
          operation_scope: string
          operation_type: string
          resistance_encountered: Json | null
          started_at: string
          success_metrics: Json | null
          target_entities: Json | null
          target_state: Json | null
          transformation_vector: Json | null
          user_id: string
        }
        Insert: {
          breakthrough_moments?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          current_state?: Json | null
          id?: string
          initial_state?: Json | null
          is_active?: boolean | null
          lessons_learned?: Json | null
          operation_scope: string
          operation_type: string
          resistance_encountered?: Json | null
          started_at?: string
          success_metrics?: Json | null
          target_entities?: Json | null
          target_state?: Json | null
          transformation_vector?: Json | null
          user_id: string
        }
        Update: {
          breakthrough_moments?: Json | null
          completed_at?: string | null
          completion_percentage?: number | null
          current_state?: Json | null
          id?: string
          initial_state?: Json | null
          is_active?: boolean | null
          lessons_learned?: Json | null
          operation_scope?: string
          operation_type?: string
          resistance_encountered?: Json | null
          started_at?: string
          success_metrics?: Json | null
          target_entities?: Json | null
          target_state?: Json | null
          transformation_vector?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      transcendence_protocols: {
        Row: {
          advancement_criteria: Json | null
          created_at: string
          current_stage: number | null
          id: string
          is_active: boolean | null
          max_stage: number | null
          next_milestone: Json | null
          progression_metrics: Json | null
          protocol_name: string
          protocol_type: string
          unlocked_capabilities: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          advancement_criteria?: Json | null
          created_at?: string
          current_stage?: number | null
          id?: string
          is_active?: boolean | null
          max_stage?: number | null
          next_milestone?: Json | null
          progression_metrics?: Json | null
          protocol_name: string
          protocol_type: string
          unlocked_capabilities?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          advancement_criteria?: Json | null
          created_at?: string
          current_stage?: number | null
          id?: string
          is_active?: boolean | null
          max_stage?: number | null
          next_milestone?: Json | null
          progression_metrics?: Json | null
          protocol_name?: string
          protocol_type?: string
          unlocked_capabilities?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcendent_operations: {
        Row: {
          completed_at: string | null
          consciousness_level: string | null
          created_at: string
          execution_matrix: Json | null
          id: string
          initiated_at: string | null
          operation_name: string
          operation_type: string
          outcome: Json | null
          probability_manipulation: Json | null
          reality_modifications: Json | null
          status: string | null
          strategic_objectives: Json | null
          success_probability: number | null
          target_profiles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          consciousness_level?: string | null
          created_at?: string
          execution_matrix?: Json | null
          id?: string
          initiated_at?: string | null
          operation_name: string
          operation_type: string
          outcome?: Json | null
          probability_manipulation?: Json | null
          reality_modifications?: Json | null
          status?: string | null
          strategic_objectives?: Json | null
          success_probability?: number | null
          target_profiles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          consciousness_level?: string | null
          created_at?: string
          execution_matrix?: Json | null
          id?: string
          initiated_at?: string | null
          operation_name?: string
          operation_type?: string
          outcome?: Json | null
          probability_manipulation?: Json | null
          reality_modifications?: Json | null
          status?: string | null
          strategic_objectives?: Json | null
          success_probability?: number | null
          target_profiles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcendent_synthesis: {
        Row: {
          accuracy_metrics: Json | null
          coherence_level: number | null
          created_at: string
          emergent_patterns: Json | null
          fusion_algorithm: string | null
          id: string
          input_streams: Json | null
          output_insights: Json | null
          prediction_horizon_days: number | null
          profile_id: string | null
          synthesis_depth: number | null
          synthesis_domain: string
          user_id: string
        }
        Insert: {
          accuracy_metrics?: Json | null
          coherence_level?: number | null
          created_at?: string
          emergent_patterns?: Json | null
          fusion_algorithm?: string | null
          id?: string
          input_streams?: Json | null
          output_insights?: Json | null
          prediction_horizon_days?: number | null
          profile_id?: string | null
          synthesis_depth?: number | null
          synthesis_domain: string
          user_id: string
        }
        Update: {
          accuracy_metrics?: Json | null
          coherence_level?: number | null
          created_at?: string
          emergent_patterns?: Json | null
          fusion_algorithm?: string | null
          id?: string
          input_streams?: Json | null
          output_insights?: Json | null
          prediction_horizon_days?: number | null
          profile_id?: string | null
          synthesis_depth?: number | null
          synthesis_domain?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "transcendent_synthesis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trauma_exploitation_windows: {
        Row: {
          anniversary_date: string | null
          counter_resistance_notes: string | null
          created_at: string
          emotional_state_indicators: Json | null
          id: string
          last_triggered_at: string | null
          optimal_exploitation_time: Json | null
          profile_id: string | null
          recommended_tactics: string[] | null
          success_rate: number | null
          trauma_type: string
          trigger_description: string | null
          updated_at: string
          user_id: string
          vulnerability_score: number | null
        }
        Insert: {
          anniversary_date?: string | null
          counter_resistance_notes?: string | null
          created_at?: string
          emotional_state_indicators?: Json | null
          id?: string
          last_triggered_at?: string | null
          optimal_exploitation_time?: Json | null
          profile_id?: string | null
          recommended_tactics?: string[] | null
          success_rate?: number | null
          trauma_type: string
          trigger_description?: string | null
          updated_at?: string
          user_id: string
          vulnerability_score?: number | null
        }
        Update: {
          anniversary_date?: string | null
          counter_resistance_notes?: string | null
          created_at?: string
          emotional_state_indicators?: Json | null
          id?: string
          last_triggered_at?: string | null
          optimal_exploitation_time?: Json | null
          profile_id?: string | null
          recommended_tactics?: string[] | null
          success_rate?: number | null
          trauma_type?: string
          trigger_description?: string | null
          updated_at?: string
          user_id?: string
          vulnerability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trauma_exploitation_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trauma_exploitation_windows_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "trauma_exploitation_windows_profile_id_fkey"
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
      ultimate_orchestration: {
        Row: {
          component_systems: Json | null
          conflict_resolution: Json | null
          created_at: string
          execution_order: Json | null
          id: string
          last_orchestration_at: string | null
          latency_ms: number | null
          optimization_targets: Json | null
          orchestration_name: string
          performance_score: number | null
          status: string | null
          synchronization_rules: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          component_systems?: Json | null
          conflict_resolution?: Json | null
          created_at?: string
          execution_order?: Json | null
          id?: string
          last_orchestration_at?: string | null
          latency_ms?: number | null
          optimization_targets?: Json | null
          orchestration_name: string
          performance_score?: number | null
          status?: string | null
          synchronization_rules?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          component_systems?: Json | null
          conflict_resolution?: Json | null
          created_at?: string
          execution_order?: Json | null
          id?: string
          last_orchestration_at?: string | null
          latency_ms?: number | null
          optimization_targets?: Json | null
          orchestration_name?: string
          performance_score?: number | null
          status?: string | null
          synchronization_rules?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ultimate_synthesis: {
        Row: {
          created_at: string
          cross_domain_fusion: Json | null
          emergent_capabilities: Json | null
          evolution_stage: string | null
          id: string
          next_evolution_threshold: number | null
          phase_integration: Json | null
          synergy_multipliers: Json | null
          synthesis_name: string
          total_power_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cross_domain_fusion?: Json | null
          emergent_capabilities?: Json | null
          evolution_stage?: string | null
          id?: string
          next_evolution_threshold?: number | null
          phase_integration?: Json | null
          synergy_multipliers?: Json | null
          synthesis_name: string
          total_power_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cross_domain_fusion?: Json | null
          emergent_capabilities?: Json | null
          evolution_stage?: string | null
          id?: string
          next_evolution_threshold?: number | null
          phase_integration?: Json | null
          synergy_multipliers?: Json | null
          synthesis_name?: string
          total_power_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_control_matrix: {
        Row: {
          constraint_violations: Json | null
          control_nodes: Json | null
          created_at: string
          efficiency_score: number | null
          feedback_loops: Json | null
          id: string
          influence_vectors: Json | null
          is_active: boolean | null
          last_optimization_at: string | null
          matrix_name: string
          optimization_targets: Json | null
          system_state: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          constraint_violations?: Json | null
          control_nodes?: Json | null
          created_at?: string
          efficiency_score?: number | null
          feedback_loops?: Json | null
          id?: string
          influence_vectors?: Json | null
          is_active?: boolean | null
          last_optimization_at?: string | null
          matrix_name: string
          optimization_targets?: Json | null
          system_state?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          constraint_violations?: Json | null
          control_nodes?: Json | null
          created_at?: string
          efficiency_score?: number | null
          feedback_loops?: Json | null
          id?: string
          influence_vectors?: Json | null
          is_active?: boolean | null
          last_optimization_at?: string | null
          matrix_name?: string
          optimization_targets?: Json | null
          system_state?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_field_control: {
        Row: {
          coherence_rating: number | null
          control_nodes: Json | null
          created_at: string
          expansion_potential: number | null
          field_name: string
          field_strength: number | null
          field_topology: Json | null
          id: string
          influence_gradients: Json | null
          resonance_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coherence_rating?: number | null
          control_nodes?: Json | null
          created_at?: string
          expansion_potential?: number | null
          field_name: string
          field_strength?: number | null
          field_topology?: Json | null
          id?: string
          influence_gradients?: Json | null
          resonance_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coherence_rating?: number | null
          control_nodes?: Json | null
          created_at?: string
          expansion_potential?: number | null
          field_name?: string
          field_strength?: number | null
          field_topology?: Json | null
          id?: string
          influence_gradients?: Json | null
          resonance_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_intelligence_feed: {
        Row: {
          actionable_insights: string[] | null
          content: Json
          created_at: string | null
          expires_at: string | null
          id: string
          intelligence_type: string
          is_processed: boolean | null
          priority_score: number | null
          processed_at: string | null
          profile_id: string | null
          related_objectives: string[] | null
          source_module: string
          source_phase: string
          user_id: string
        }
        Insert: {
          actionable_insights?: string[] | null
          content: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type: string
          is_processed?: boolean | null
          priority_score?: number | null
          processed_at?: string | null
          profile_id?: string | null
          related_objectives?: string[] | null
          source_module: string
          source_phase: string
          user_id: string
        }
        Update: {
          actionable_insights?: string[] | null
          content?: Json
          created_at?: string | null
          expires_at?: string | null
          id?: string
          intelligence_type?: string
          is_processed?: boolean | null
          priority_score?: number | null
          processed_at?: string | null
          profile_id?: string | null
          related_objectives?: string[] | null
          source_module?: string
          source_phase?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unified_intelligence_feed_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_omniscience: {
        Row: {
          awareness_depth: number | null
          consciousness_expansion: Json | null
          created_at: string
          id: string
          knowledge_domains: Json | null
          omniscience_type: string
          probability_fields: Json | null
          reality_perception: Json | null
          timeline_awareness: Json | null
          transcendence_level: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          awareness_depth?: number | null
          consciousness_expansion?: Json | null
          created_at?: string
          id?: string
          knowledge_domains?: Json | null
          omniscience_type: string
          probability_fields?: Json | null
          reality_perception?: Json | null
          timeline_awareness?: Json | null
          transcendence_level?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          awareness_depth?: number | null
          consciousness_expansion?: Json | null
          created_at?: string
          id?: string
          knowledge_domains?: Json | null
          omniscience_type?: string
          probability_fields?: Json | null
          reality_perception?: Json | null
          timeline_awareness?: Json | null
          transcendence_level?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unknown_persons: {
        Row: {
          ai_model_used: string | null
          assigned_at: string | null
          assigned_profile_id: string | null
          best_match_confidence: number | null
          created_at: string
          cropped_image_url: string | null
          estimated_age_range: string | null
          estimated_gender: string | null
          face_region: Json | null
          facial_features: Json | null
          id: string
          media_id: string | null
          source_mosaic_id: string | null
          status: string
          suggested_profiles: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          assigned_at?: string | null
          assigned_profile_id?: string | null
          best_match_confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          estimated_age_range?: string | null
          estimated_gender?: string | null
          face_region?: Json | null
          facial_features?: Json | null
          id?: string
          media_id?: string | null
          source_mosaic_id?: string | null
          status?: string
          suggested_profiles?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          assigned_at?: string | null
          assigned_profile_id?: string | null
          best_match_confidence?: number | null
          created_at?: string
          cropped_image_url?: string | null
          estimated_age_range?: string | null
          estimated_gender?: string | null
          face_region?: Json | null
          facial_features?: Json | null
          id?: string
          media_id?: string | null
          source_mosaic_id?: string | null
          status?: string
          suggested_profiles?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "unknown_persons_assigned_profile_id_fkey"
            columns: ["assigned_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unknown_persons_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      user_config_overrides: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_config_overrides_config_key_fkey"
            columns: ["config_key"]
            isOneToOne: false
            referencedRelation: "platform_config"
            referencedColumns: ["config_key"]
          },
        ]
      }
      user_preferences: {
        Row: {
          ai_budget_alert_threshold: number | null
          ai_budget_alerts_enabled: boolean | null
          ai_budget_daily_limit_cents: number | null
          ai_budget_enforce_limits: boolean | null
          ai_budget_monthly_limit_cents: number | null
          ai_budget_weekly_limit_cents: number | null
          ai_model_tier: string | null
          created_at: string
          documents_items_per_page: number | null
          documents_view_mode: string | null
          email_reminders: boolean | null
          id: string
          main_documents_items_per_page: number | null
          main_documents_view_mode: string | null
          main_media_items_per_page: number | null
          main_media_view_mode: string | null
          media_items_per_page: number | null
          media_view_mode: string | null
          preferred_ai_provider: string | null
          reminder_email: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_budget_alert_threshold?: number | null
          ai_budget_alerts_enabled?: boolean | null
          ai_budget_daily_limit_cents?: number | null
          ai_budget_enforce_limits?: boolean | null
          ai_budget_monthly_limit_cents?: number | null
          ai_budget_weekly_limit_cents?: number | null
          ai_model_tier?: string | null
          created_at?: string
          documents_items_per_page?: number | null
          documents_view_mode?: string | null
          email_reminders?: boolean | null
          id?: string
          main_documents_items_per_page?: number | null
          main_documents_view_mode?: string | null
          main_media_items_per_page?: number | null
          main_media_view_mode?: string | null
          media_items_per_page?: number | null
          media_view_mode?: string | null
          preferred_ai_provider?: string | null
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_budget_alert_threshold?: number | null
          ai_budget_alerts_enabled?: boolean | null
          ai_budget_daily_limit_cents?: number | null
          ai_budget_enforce_limits?: boolean | null
          ai_budget_monthly_limit_cents?: number | null
          ai_budget_weekly_limit_cents?: number | null
          ai_model_tier?: string | null
          created_at?: string
          documents_items_per_page?: number | null
          documents_view_mode?: string | null
          email_reminders?: boolean | null
          id?: string
          main_documents_items_per_page?: number | null
          main_documents_view_mode?: string | null
          main_media_items_per_page?: number | null
          main_media_view_mode?: string | null
          media_items_per_page?: number | null
          media_view_mode?: string | null
          preferred_ai_provider?: string | null
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          clearance: Database["public"]["Enums"]["clearance_level"]
          clearance_expires_at: string | null
          clearance_granted_at: string | null
          compartments: string[] | null
          created_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clearance?: Database["public"]["Enums"]["clearance_level"]
          clearance_expires_at?: string | null
          clearance_granted_at?: string | null
          compartments?: string[] | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clearance?: Database["public"]["Enums"]["clearance_level"]
          clearance_expires_at?: string | null
          clearance_granted_at?: string | null
          compartments?: string[] | null
          created_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      video_mosaics: {
        Row: {
          canvas_height: number
          canvas_width: number
          cell_height: number
          cell_width: number
          created_at: string
          file_size: number | null
          frame_count: number
          frames_per_second: number
          grid_cols: number
          grid_rows: number
          id: string
          media_id: string
          model_key: string
          mosaic_url: string
          profile_id: string
          user_id: string
          video_duration: number
        }
        Insert: {
          canvas_height: number
          canvas_width: number
          cell_height: number
          cell_width: number
          created_at?: string
          file_size?: number | null
          frame_count: number
          frames_per_second: number
          grid_cols: number
          grid_rows: number
          id?: string
          media_id: string
          model_key: string
          mosaic_url: string
          profile_id: string
          user_id: string
          video_duration: number
        }
        Update: {
          canvas_height?: number
          canvas_width?: number
          cell_height?: number
          cell_width?: number
          created_at?: string
          file_size?: number | null
          frame_count?: number
          frames_per_second?: number
          grid_cols?: number
          grid_rows?: number
          id?: string
          media_id?: string
          model_key?: string
          mosaic_url?: string
          profile_id?: string
          user_id?: string
          video_duration?: number
        }
        Relationships: [
          {
            foreignKeyName: "video_mosaics_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_mosaics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "video_mosaics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "video_mosaics_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vocal_analyses: {
        Row: {
          ai_model_used: string | null
          audio_url: string | null
          confidence_indicators: Json | null
          confidence_score: number | null
          created_at: string
          deception_likelihood: Json | null
          hesitation_markers: Json | null
          id: string
          mood_changes: Json | null
          profile_id: string
          raw_analysis: Json | null
          source_recording_id: string | null
          speech_patterns: Json | null
          stress_points: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          audio_url?: string | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          deception_likelihood?: Json | null
          hesitation_markers?: Json | null
          id?: string
          mood_changes?: Json | null
          profile_id: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          speech_patterns?: Json | null
          stress_points?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          audio_url?: string | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          created_at?: string
          deception_likelihood?: Json | null
          hesitation_markers?: Json | null
          id?: string
          mood_changes?: Json | null
          profile_id?: string
          raw_analysis?: Json | null
          source_recording_id?: string | null
          speech_patterns?: Json | null
          stress_points?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocal_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vocal_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vocal_analyses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocal_analyses_source_recording_id_fkey"
            columns: ["source_recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_analysis_jobs: {
        Row: {
          actual_cost_cents: number | null
          completed_at: string | null
          contacts_identified: number | null
          created_at: string
          current_item_id: string | null
          estimated_cost_cents: number | null
          failed_items: number | null
          id: string
          keywords_detected: number | null
          last_error: string | null
          last_processed_index: number | null
          max_retries: number | null
          model: string | null
          options: Json
          patterns_found: number | null
          paused_at: string | null
          processed_items: number | null
          profile_id: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          total_duration_seconds: number | null
          total_items: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          contacts_identified?: number | null
          created_at?: string
          current_item_id?: string | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          keywords_detected?: number | null
          last_error?: string | null
          last_processed_index?: number | null
          max_retries?: number | null
          model?: string | null
          options?: Json
          patterns_found?: number | null
          paused_at?: string | null
          processed_items?: number | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_duration_seconds?: number | null
          total_items?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_cost_cents?: number | null
          completed_at?: string | null
          contacts_identified?: number | null
          created_at?: string
          current_item_id?: string | null
          estimated_cost_cents?: number | null
          failed_items?: number | null
          id?: string
          keywords_detected?: number | null
          last_error?: string | null
          last_processed_index?: number | null
          max_retries?: number | null
          model?: string | null
          options?: Json
          patterns_found?: number | null
          paused_at?: string | null
          processed_items?: number | null
          profile_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          total_duration_seconds?: number | null
          total_items?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_analysis_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_insights: {
        Row: {
          action_items: Json | null
          ai_model_used: string | null
          audio_events: Json | null
          commitments: Json | null
          confidence_indicators: Json | null
          confidence_score: number | null
          cost_cents: number | null
          created_at: string
          deception_indicators: Json | null
          decisions_made: Json | null
          detected_keywords: Json | null
          duration_seconds: number | null
          emotional_markers: Json | null
          flagged_content: Json | null
          full_transcription: string | null
          id: string
          identified_contacts: Json | null
          job_id: string | null
          language_detected: string | null
          mentioned_contacts: Json | null
          mood_patterns: Json | null
          named_entities: Json | null
          processing_time_ms: number | null
          profile_id: string | null
          questions_asked: Json | null
          sentiment_timeline: Json | null
          source_id: string
          source_type: string
          speaker_profiles: Json | null
          speakers: Json | null
          stress_points: Json | null
          topics_discussed: Json | null
          transcription_with_timestamps: Json | null
          updated_at: string
          user_id: string
          voice_signatures: Json | null
        }
        Insert: {
          action_items?: Json | null
          ai_model_used?: string | null
          audio_events?: Json | null
          commitments?: Json | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string
          deception_indicators?: Json | null
          decisions_made?: Json | null
          detected_keywords?: Json | null
          duration_seconds?: number | null
          emotional_markers?: Json | null
          flagged_content?: Json | null
          full_transcription?: string | null
          id?: string
          identified_contacts?: Json | null
          job_id?: string | null
          language_detected?: string | null
          mentioned_contacts?: Json | null
          mood_patterns?: Json | null
          named_entities?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          questions_asked?: Json | null
          sentiment_timeline?: Json | null
          source_id: string
          source_type: string
          speaker_profiles?: Json | null
          speakers?: Json | null
          stress_points?: Json | null
          topics_discussed?: Json | null
          transcription_with_timestamps?: Json | null
          updated_at?: string
          user_id: string
          voice_signatures?: Json | null
        }
        Update: {
          action_items?: Json | null
          ai_model_used?: string | null
          audio_events?: Json | null
          commitments?: Json | null
          confidence_indicators?: Json | null
          confidence_score?: number | null
          cost_cents?: number | null
          created_at?: string
          deception_indicators?: Json | null
          decisions_made?: Json | null
          detected_keywords?: Json | null
          duration_seconds?: number | null
          emotional_markers?: Json | null
          flagged_content?: Json | null
          full_transcription?: string | null
          id?: string
          identified_contacts?: Json | null
          job_id?: string | null
          language_detected?: string | null
          mentioned_contacts?: Json | null
          mood_patterns?: Json | null
          named_entities?: Json | null
          processing_time_ms?: number | null
          profile_id?: string | null
          questions_asked?: Json | null
          sentiment_timeline?: Json | null
          source_id?: string
          source_type?: string
          speaker_profiles?: Json | null
          speakers?: Json | null
          stress_points?: Json | null
          topics_discussed?: Json | null
          transcription_with_timestamps?: Json | null
          updated_at?: string
          user_id?: string
          voice_signatures?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_insights_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "voice_analysis_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_insights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_notes: {
        Row: {
          ai_extracted_insights: Json | null
          created_at: string
          duration_seconds: number | null
          file_size: number | null
          file_url: string
          id: string
          profile_id: string | null
          storage_path: string | null
          title: string | null
          transcription: string | null
          transcription_error: string | null
          transcription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_extracted_insights?: Json | null
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          profile_id?: string | null
          storage_path?: string | null
          title?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_extracted_insights?: Json | null
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          profile_id?: string | null
          storage_path?: string | null
          title?: string | null
          transcription?: string | null
          transcription_error?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_recording_sessions: {
        Row: {
          audio_format: string | null
          channels: number | null
          created_at: string
          detected_speakers: string[] | null
          device_source: string | null
          duration_seconds: number | null
          ended_at: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          keywords_detected: string[] | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          metadata: Json | null
          participants: string[] | null
          profile_id: string | null
          recording_type: string
          sample_rate: number | null
          sentiment_analysis: Json | null
          speaker_diarization: Json | null
          started_at: string
          status: string | null
          storage_path: string | null
          title: string | null
          transcription: string | null
          transcription_status: string | null
          updated_at: string
          user_id: string
          voice_signatures_extracted: string[] | null
        }
        Insert: {
          audio_format?: string | null
          channels?: number | null
          created_at?: string
          detected_speakers?: string[] | null
          device_source?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          keywords_detected?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          metadata?: Json | null
          participants?: string[] | null
          profile_id?: string | null
          recording_type: string
          sample_rate?: number | null
          sentiment_analysis?: Json | null
          speaker_diarization?: Json | null
          started_at?: string
          status?: string | null
          storage_path?: string | null
          title?: string | null
          transcription?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_id: string
          voice_signatures_extracted?: string[] | null
        }
        Update: {
          audio_format?: string | null
          channels?: number | null
          created_at?: string
          detected_speakers?: string[] | null
          device_source?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          keywords_detected?: string[] | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          metadata?: Json | null
          participants?: string[] | null
          profile_id?: string | null
          recording_type?: string
          sample_rate?: number | null
          sentiment_analysis?: Json | null
          speaker_diarization?: Json | null
          started_at?: string
          status?: string | null
          storage_path?: string | null
          title?: string | null
          transcription?: string | null
          transcription_status?: string | null
          updated_at?: string
          user_id?: string
          voice_signatures_extracted?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_recording_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_recording_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_recording_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_signatures: {
        Row: {
          audio_characteristics: Json | null
          created_at: string | null
          embedding_vector: string | null
          id: string
          profile_id: string | null
          quality_score: number | null
          sample_count: number | null
          sample_duration_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_characteristics?: Json | null
          created_at?: string | null
          embedding_vector?: string | null
          id?: string
          profile_id?: string | null
          quality_score?: number | null
          sample_count?: number | null
          sample_duration_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_characteristics?: Json | null
          created_at?: string | null
          embedding_vector?: string | null
          id?: string
          profile_id?: string | null
          quality_score?: number | null
          sample_count?: number | null
          sample_duration_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "voice_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      web_monitoring_jobs: {
        Row: {
          alert_on_new_results: boolean | null
          alert_threshold: number | null
          created_at: string | null
          frequency_hours: number | null
          id: string
          is_active: boolean | null
          job_name: string
          last_result_count: number | null
          last_results: Json | null
          last_run_at: string | null
          profile_id: string | null
          search_query: string
          search_type: string | null
          total_mentions_found: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_on_new_results?: boolean | null
          alert_threshold?: number | null
          created_at?: string | null
          frequency_hours?: number | null
          id?: string
          is_active?: boolean | null
          job_name: string
          last_result_count?: number | null
          last_results?: Json | null
          last_run_at?: string | null
          profile_id?: string | null
          search_query: string
          search_type?: string | null
          total_mentions_found?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_on_new_results?: boolean | null
          alert_threshold?: number | null
          created_at?: string | null
          frequency_hours?: number | null
          id?: string
          is_active?: boolean | null
          job_name?: string
          last_result_count?: number | null
          last_results?: Json | null
          last_run_at?: string | null
          profile_id?: string | null
          search_query?: string
          search_type?: string | null
          total_mentions_found?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_monitoring_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "web_monitoring_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "web_monitoring_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      web_monitoring_results: {
        Row: {
          detected_at: string | null
          id: string
          importance_score: number | null
          is_flagged: boolean | null
          is_new: boolean | null
          is_read: boolean | null
          job_id: string
          metadata: Json | null
          profile_id: string | null
          result_content: string | null
          result_snippet: string | null
          result_title: string | null
          result_url: string | null
          sentiment_score: number | null
          source_domain: string | null
          user_id: string
        }
        Insert: {
          detected_at?: string | null
          id?: string
          importance_score?: number | null
          is_flagged?: boolean | null
          is_new?: boolean | null
          is_read?: boolean | null
          job_id: string
          metadata?: Json | null
          profile_id?: string | null
          result_content?: string | null
          result_snippet?: string | null
          result_title?: string | null
          result_url?: string | null
          sentiment_score?: number | null
          source_domain?: string | null
          user_id: string
        }
        Update: {
          detected_at?: string | null
          id?: string
          importance_score?: number | null
          is_flagged?: boolean | null
          is_new?: boolean | null
          is_read?: boolean | null
          job_id?: string
          metadata?: Json | null
          profile_id?: string | null
          result_content?: string | null
          result_snippet?: string | null
          result_title?: string | null
          result_url?: string | null
          sentiment_score?: number | null
          source_domain?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_monitoring_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "web_monitoring_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "web_monitoring_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "web_monitoring_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "web_monitoring_results_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_status: number | null
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          generated_at: string
          highlights: string[] | null
          id: string
          recommendations: string[] | null
          summary_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          generated_at?: string
          highlights?: string[] | null
          id?: string
          recommendations?: string[] | null
          summary_data: Json
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          generated_at?: string
          highlights?: string[] | null
          id?: string
          recommendations?: string[] | null
          summary_data?: Json
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          business_account_id: string | null
          created_at: string
          display_phone_number: string | null
          id: string
          is_connected: boolean
          last_webhook_at: string | null
          phone_number_id: string
          updated_at: string
          user_id: string
          webhook_verify_token: string
        }
        Insert: {
          business_account_id?: string | null
          created_at?: string
          display_phone_number?: string | null
          id?: string
          is_connected?: boolean
          last_webhook_at?: string | null
          phone_number_id: string
          updated_at?: string
          user_id: string
          webhook_verify_token?: string
        }
        Update: {
          business_account_id?: string | null
          created_at?: string
          display_phone_number?: string | null
          id?: string
          is_connected?: boolean
          last_webhook_at?: string | null
          phone_number_id?: string
          updated_at?: string
          user_id?: string
          webhook_verify_token?: string
        }
        Relationships: []
      }
      whatsapp_import_sessions: {
        Row: {
          created_at: string | null
          duplicate_action: string | null
          error_message: string | null
          existing_conversation_id: string | null
          failed_files: Json | null
          file_name: string | null
          file_size: number | null
          id: string
          last_processed_index: number | null
          media_files_state: Json | null
          media_uploaded: number | null
          messages_imported: number | null
          metadata: Json | null
          new_conversation_id: string | null
          parsed_messages: Json | null
          paused_at: string | null
          processing_mode: string | null
          profile_id: string
          skipped_files: Json | null
          status: string
          total_media_files: number | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duplicate_action?: string | null
          error_message?: string | null
          existing_conversation_id?: string | null
          failed_files?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          last_processed_index?: number | null
          media_files_state?: Json | null
          media_uploaded?: number | null
          messages_imported?: number | null
          metadata?: Json | null
          new_conversation_id?: string | null
          parsed_messages?: Json | null
          paused_at?: string | null
          processing_mode?: string | null
          profile_id: string
          skipped_files?: Json | null
          status?: string
          total_media_files?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duplicate_action?: string | null
          error_message?: string | null
          existing_conversation_id?: string | null
          failed_files?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          last_processed_index?: number | null
          media_files_state?: Json | null
          media_uploaded?: number | null
          messages_imported?: number | null
          metadata?: Json | null
          new_conversation_id?: string | null
          parsed_messages?: Json | null
          paused_at?: string | null
          processing_mode?: string | null
          profile_id?: string
          skipped_files?: Json | null
          status?: string
          total_media_files?: number | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_import_sessions_existing_conversation_id_fkey"
            columns: ["existing_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_import_sessions_new_conversation_id_fkey"
            columns: ["new_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_import_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "whatsapp_import_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "whatsapp_import_sessions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          components: Json | null
          created_at: string
          id: string
          status: string
          template_language: string
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          components?: Json | null
          created_at?: string
          id?: string
          status?: string
          template_language?: string
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          components?: Json | null
          created_at?: string
          id?: string
          status?: string
          template_language?: string
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          invited_by: string | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      contact_storage_stats: {
        Row: {
          avatar_url: string | null
          document_bytes: number | null
          document_count: number | null
          first_name: string | null
          last_name: string | null
          media_bytes: number | null
          media_count: number | null
          message_count: number | null
          profile_id: string | null
          total_bytes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      contact_storage_stats_mv: {
        Row: {
          avatar_url: string | null
          document_bytes: number | null
          document_count: number | null
          first_name: string | null
          last_name: string | null
          media_bytes: number | null
          media_count: number | null
          message_count: number | null
          profile_id: string | null
          total_bytes: number | null
          user_id: string | null
        }
        Relationships: []
      }
      prediction_accuracy_stats: {
        Row: {
          accuracy_percentage: number | null
          avg_accuracy: number | null
          false_negatives: number | null
          false_positives: number | null
          model_used: string | null
          risk_level: string | null
          total_predictions: number | null
          true_negatives: number | null
          true_positives: number | null
          user_id: string | null
          verified_predictions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      archive_old_messages: {
        Args: { days_old?: number }
        Returns: {
          archived_count: number
          freed_bytes: number
        }[]
      }
      bootstrap_first_admin: { Args: never; Returns: boolean }
      check_workspace_membership: {
        Args: { uid: string; ws_id: string }
        Returns: boolean
      }
      clean_expired_cache: { Args: never; Returns: number }
      compute_event_hash: {
        Args: {
          p_analysis_type: string
          p_created_at: string
          p_event_id: string
          p_event_type: string
          p_previous_hash: string
          p_raw_result: Json
        }
        Returns: string
      }
      create_storage_snapshot: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      find_connection_path: {
        Args: {
          p_max_depth?: number
          p_source_id: string
          p_target_id: string
          p_user_id: string
        }
        Returns: {
          distance: number
          path: string[]
          strength: number
        }[]
      }
      find_cross_reference_matches: {
        Args: {
          p_normalized_value: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: {
          confidence: number
          profile_id: string
          source: string
        }[]
      }
      get_account_storage_summary: {
        Args: { p_user_id: string }
        Returns: {
          ai_cost_cents: number
          ai_tokens_used: number
          contact_count: number
          document_bytes: number
          media_bytes: number
          message_count: number
          recording_bytes: number
          storage_quota_bytes: number
          total_bytes: number
          usage_percentage: number
        }[]
      }
      get_contact_filter_options: {
        Args: { p_user_id: string }
        Returns: {
          relationships: string[]
          subtypes: string[]
          tags: string[]
        }[]
      }
      get_contact_letter_counts: {
        Args: { p_user_id: string }
        Returns: {
          count: number
          letter: string
        }[]
      }
      get_contact_media_counts: {
        Args: {
          p_profile_id?: string
          p_skip_analyzed?: boolean
          p_user_id: string
        }
        Returns: {
          analyzed_count: number
          audio_count: number
          image_count: number
          total_count: number
          video_count: number
        }[]
      }
      get_contact_media_paginated: {
        Args: {
          p_limit?: number
          p_media_type?: string
          p_offset?: number
          p_profile_id: string
          p_search_query?: string
          p_sort_by?: string
          p_sort_order?: string
          p_user_id: string
        }
        Returns: {
          ai_generation_status: string
          ai_metadata: Json
          caption: string
          created_at: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          profile_id: string
          storage_path: string
          thumbnail_url: string
          total_count: number
        }[]
      }
      get_contact_storage_stats: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          document_bytes: number
          document_count: number
          first_name: string
          last_name: string
          media_bytes: number
          media_count: number
          message_count: number
          profile_id: string
          total_bytes: number
          user_id: string
        }[]
      }
      get_contacts_for_selection: {
        Args: {
          p_limit?: number
          p_recent_ids?: string[]
          p_search_query?: string
          p_user_id: string
        }
        Returns: {
          avatar_url: string
          first_name: string
          id: string
          is_active: boolean
          is_favorite: boolean
          last_interaction_at: string
          last_name: string
          organization: string
          selection_priority: number
        }[]
      }
      get_document_folders: {
        Args: { p_user_id: string }
        Returns: {
          first_name: string
          last_name: string
          profile_id: string
          total_bytes: number
          total_files: number
        }[]
      }
      get_entity_mentions_cross_contact: {
        Args: {
          p_entity_name: string
          p_entity_type?: string
          p_user_id: string
        }
        Returns: {
          avg_sentiment: number
          contexts: string[]
          first_name: string
          last_name: string
          mention_count: number
          profile_id: string
        }[]
      }
      get_media_folders: {
        Args: { p_user_id: string }
        Returns: {
          audio_count: number
          first_name: string
          image_count: number
          last_name: string
          profile_id: string
          total_files: number
          video_count: number
        }[]
      }
      get_media_ids_for_analysis: {
        Args: {
          p_limit?: number
          p_media_types?: string[]
          p_offset?: number
          p_profile_id?: string
          p_skip_analyzed?: boolean
          p_user_id: string
        }
        Returns: {
          file_size: number
          id: string
          mime_type: string
          storage_path: string
        }[]
      }
      get_or_set_cache: {
        Args: { p_cache_key: string; p_ttl_seconds?: number; p_user_id: string }
        Returns: Json
      }
      get_previous_event_for_chain: {
        Args: { p_profile_id: string; p_user_id: string }
        Returns: {
          event_hash: string
          event_id: string
        }[]
      }
      get_shared_organizations: {
        Args: { p_profile_ids: string[]; p_user_id: string }
        Returns: {
          organization_name: string
          profile_count: number
          profile_ids: string[]
        }[]
      }
      get_single_contact_storage: {
        Args: { p_profile_id: string; p_user_id: string }
        Returns: {
          document_bytes: number
          document_count: number
          media_breakdown: Json
          media_bytes: number
          media_count: number
          message_count: number
          total_bytes: number
        }[]
      }
      get_storage_summary: {
        Args: { p_user_id: string }
        Returns: {
          contact_count: number
          total_bytes: number
          total_document_bytes: number
          total_document_files: number
          total_media_bytes: number
          total_media_files: number
          total_messages: number
        }[]
      }
      get_unread_alerts_count: { Args: { p_user_id: string }; Returns: number }
      get_user_clearance: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["clearance_level"]
      }
      has_clearance: {
        Args: {
          _required: Database["public"]["Enums"]["clearance_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_compartment: {
        Args: { _compartment: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_bulk_session_progress: {
        Args: {
          p_cost_cents?: number
          p_is_completed?: boolean
          p_is_failed?: boolean
          p_session_id: string
        }
        Returns: undefined
      }
      keyword_search_documents: {
        Args: {
          match_count?: number
          p_profile_id?: string
          p_source_types?: string[]
          p_user_id?: string
          search_query: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          profile_id: string
          rank: number
          source_id: string
          source_type: string
        }[]
      }
      log_contact_method_access: {
        Args: {
          p_access_context?: string
          p_access_type: string
          p_contact_method_id: string
          p_ip_address?: unknown
          p_was_decrypted?: boolean
        }
        Returns: string
      }
      log_email_access: {
        Args: {
          p_access_type?: string
          p_accessed_fields?: string[]
          p_clearance_used?: string
          p_email_message_id?: string
          p_email_thread_id?: string
          p_was_decrypted?: boolean
        }
        Returns: string
      }
      log_profile_access: {
        Args: {
          p_access_context?: string
          p_access_type: string
          p_fields_accessed?: string[]
          p_profile_id: string
          p_was_decrypted?: boolean
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_action_successful?: boolean
          p_action_taken?: string
          p_event_type: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_severity?: string
        }
        Returns: string
      }
      match_documents: {
        Args: {
          p_match_count?: number
          p_match_threshold?: number
          p_profile_id?: string
          p_query_embedding: string
          p_source_types?: string[]
          p_user_id: string
        }
        Returns: {
          content: string
          content_summary: string
          id: string
          metadata: Json
          profile_id: string
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_documents_v2: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_date_from?: string
          p_date_to?: string
          p_profile_id?: string
          p_source_types?: string[]
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          content: string
          created_at: string
          id: string
          metadata: Json
          profile_id: string
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      match_facial_embeddings: {
        Args: {
          match_count?: number
          match_threshold?: number
          p_user_id?: string
          query_embedding: string
        }
        Returns: {
          avatar_url: string
          facial_confidence: number
          first_name: string
          last_name: string
          profile_id: string
          similarity: number
        }[]
      }
      merge_duplicate_profiles: {
        Args: {
          p_duplicate_id: string
          p_primary_id: string
          p_user_id: string
        }
        Returns: Json
      }
      owns_profile: {
        Args: { profile_uuid: string; uid: string }
        Returns: boolean
      }
      rebuild_analysis_aggregate: {
        Args: {
          p_aggregate_type: string
          p_profile_id: string
          p_user_id: string
        }
        Returns: Json
      }
      refresh_contact_storage_stats: { Args: never; Returns: undefined }
      search_contacts_v2: {
        Args: {
          p_is_favorite?: boolean
          p_limit?: number
          p_offset?: number
          p_relationship_type?: string
          p_search_query?: string
          p_user_id: string
        }
        Returns: {
          avatar_url: string
          first_name: string
          id: string
          is_favorite: boolean
          job_title: string
          last_name: string
          organization: string
          relationship_type: string
          tags: string[]
          total_count: number
        }[]
      }
      search_contacts_v3:
        | {
            Args: {
              p_first_letter?: string
              p_is_favorite?: boolean
              p_limit?: number
              p_offset?: number
              p_relationship_subtype?: string
              p_relationship_type?: string
              p_search_query?: string
              p_sort_by?: string
              p_sort_order?: string
              p_tag?: string
              p_user_id: string
            }
            Returns: {
              avatar_url: string
              country: string
              created_at: string
              first_name: string
              hierarchy_level: string
              id: string
              is_favorite: boolean
              job_title: string
              last_name: string
              organization: string
              relationship_subtype: string
              relationship_type: string
              tags: string[]
              total_count: number
            }[]
          }
        | {
            Args: {
              p_first_letter?: string
              p_is_active?: boolean
              p_is_favorite?: boolean
              p_limit?: number
              p_offset?: number
              p_relationship_subtype?: string
              p_relationship_type?: string
              p_search_query?: string
              p_sort_by?: string
              p_sort_order?: string
              p_tag?: string
              p_user_id: string
            }
            Returns: {
              avatar_url: string
              country: string
              created_at: string
              engagement_score: number
              first_name: string
              hierarchy_level: string
              id: string
              is_active: boolean
              is_favorite: boolean
              job_title: string
              last_interaction_at: string
              last_name: string
              organization: string
              relationship_subtype: string
              relationship_type: string
              tags: string[]
              total_count: number
            }[]
          }
      search_document_embeddings: {
        Args: {
          p_limit?: number
          p_profile_id?: string
          p_source_type?: string
          p_user_id: string
        }
        Returns: {
          content: string
          content_summary: string
          id: string
          metadata: Json
          profile_id: string
          source_id: string
          source_type: string
        }[]
      }
      search_messages_v2: {
        Args: {
          p_conversation_id?: string
          p_cursor_time?: string
          p_limit?: number
          p_profile_id?: string
          p_search_query?: string
          p_user_id: string
        }
        Returns: {
          content: string
          conversation_id: string
          id: string
          is_from_contact: boolean
          profile_id: string
          sent_at: string
        }[]
      }
      toggle_contact_active_status: {
        Args: { p_is_active: boolean; p_profile_id: string }
        Returns: undefined
      }
      track_navigation_access: { Args: { p_route: string }; Returns: undefined }
      verify_audit_chain_segment: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          broken_at: string
          first_broken_id: string
          is_valid: boolean
          total_checked: number
        }[]
      }
      verify_churn_prediction_outcomes: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "supervisor" | "analyst" | "viewer"
      clearance_level:
        | "uncleared"
        | "confidential"
        | "secret"
        | "top_secret"
        | "sci"
      communication_channel:
        | "email"
        | "phone"
        | "video_call"
        | "in_person"
        | "message"
        | "social_media"
        | "other"
      communication_direction: "inbound" | "outbound"
      contact_type:
        | "email"
        | "phone"
        | "linkedin"
        | "twitter"
        | "facebook"
        | "instagram"
        | "website"
        | "other"
      data_classification:
        | "public"
        | "internal"
        | "confidential"
        | "restricted"
        | "top_secret"
      document_type:
        | "resume"
        | "contract"
        | "presentation"
        | "notes"
        | "article"
        | "other"
      event_type:
        | "birthday"
        | "anniversary"
        | "milestone"
        | "meeting"
        | "follow_up"
        | "other"
      message_platform:
        | "sms"
        | "whatsapp"
        | "linkedin"
        | "telegram"
        | "messenger"
        | "imessage"
        | "slack"
        | "discord"
        | "email_thread"
        | "other"
      relationship_type:
        | "family"
        | "friend"
        | "colleague"
        | "client"
        | "mentor"
        | "mentee"
        | "acquaintance"
        | "other"
      reminder_frequency: "once" | "daily" | "weekly" | "monthly" | "yearly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "supervisor", "analyst", "viewer"],
      clearance_level: [
        "uncleared",
        "confidential",
        "secret",
        "top_secret",
        "sci",
      ],
      communication_channel: [
        "email",
        "phone",
        "video_call",
        "in_person",
        "message",
        "social_media",
        "other",
      ],
      communication_direction: ["inbound", "outbound"],
      contact_type: [
        "email",
        "phone",
        "linkedin",
        "twitter",
        "facebook",
        "instagram",
        "website",
        "other",
      ],
      data_classification: [
        "public",
        "internal",
        "confidential",
        "restricted",
        "top_secret",
      ],
      document_type: [
        "resume",
        "contract",
        "presentation",
        "notes",
        "article",
        "other",
      ],
      event_type: [
        "birthday",
        "anniversary",
        "milestone",
        "meeting",
        "follow_up",
        "other",
      ],
      message_platform: [
        "sms",
        "whatsapp",
        "linkedin",
        "telegram",
        "messenger",
        "imessage",
        "slack",
        "discord",
        "email_thread",
        "other",
      ],
      relationship_type: [
        "family",
        "friend",
        "colleague",
        "client",
        "mentor",
        "mentee",
        "acquaintance",
        "other",
      ],
      reminder_frequency: ["once", "daily", "weekly", "monthly", "yearly"],
    },
  },
} as const
