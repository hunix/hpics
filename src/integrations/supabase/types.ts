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
          gait_patterns: Json | null
          handwriting_confidence: number | null
          handwriting_features: Json | null
          handwriting_last_updated: string | null
          handwriting_samples_count: number | null
          id: string
          identity_confidence: number | null
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
          gait_patterns?: Json | null
          handwriting_confidence?: number | null
          handwriting_features?: Json | null
          handwriting_last_updated?: string | null
          handwriting_samples_count?: number | null
          id?: string
          identity_confidence?: number | null
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
          gait_patterns?: Json | null
          handwriting_confidence?: number | null
          handwriting_features?: Json | null
          handwriting_last_updated?: string | null
          handwriting_samples_count?: number | null
          id?: string
          identity_confidence?: number | null
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
          id: string
          is_primary: boolean | null
          label: string | null
          profile_id: string
          value: string
        }
        Insert: {
          contact_type: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          profile_id: string
          value: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["contact_type"]
          created_at?: string
          id?: string
          is_primary?: boolean | null
          label?: string | null
          profile_id?: string
          value?: string
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
      dashboard_layouts: {
        Row: {
          created_at: string
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout?: Json
          updated_at?: string
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
          body_html: string | null
          body_preview: string | null
          cc_recipients: string[] | null
          created_at: string | null
          external_id: string
          has_attachments: boolean | null
          id: string
          importance: string | null
          is_from_contact: boolean | null
          received_at: string | null
          recipients: string[] | null
          sender_email: string
          sender_name: string | null
          sent_at: string
          subject: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          body_html?: string | null
          body_preview?: string | null
          cc_recipients?: string[] | null
          created_at?: string | null
          external_id: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_from_contact?: boolean | null
          received_at?: string | null
          recipients?: string[] | null
          sender_email: string
          sender_name?: string | null
          sent_at: string
          subject?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          body_html?: string | null
          body_preview?: string | null
          cc_recipients?: string[] | null
          created_at?: string | null
          external_id?: string
          has_attachments?: boolean | null
          id?: string
          importance?: string | null
          is_from_contact?: boolean | null
          received_at?: string | null
          recipients?: string[] | null
          sender_email?: string
          sender_name?: string | null
          sent_at?: string
          subject?: string | null
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
          folder: string | null
          id: string
          is_read: boolean | null
          last_message_at: string | null
          message_count: number | null
          profile_id: string | null
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          folder?: string | null
          id?: string
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          profile_id?: string | null
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          folder?: string | null
          id?: string
          is_read?: boolean | null
          last_message_at?: string | null
          message_count?: number | null
          profile_id?: string | null
          subject?: string | null
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
          action_taken: string | null
          alert_type: string
          created_at: string
          description: string | null
          evidence: Json | null
          id: string
          is_acknowledged: boolean | null
          is_dismissed: boolean | null
          profile_id: string | null
          rule_id: string | null
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          is_dismissed?: boolean | null
          profile_id?: string | null
          rule_id?: string | null
          severity: string
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          evidence?: Json | null
          id?: string
          is_acknowledged?: boolean | null
          is_dismissed?: boolean | null
          profile_id?: string | null
          rule_id?: string | null
          severity?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string
          hierarchy_level: string | null
          id: string
          initial_intel_completed: boolean | null
          is_favorite: boolean | null
          is_self_profile: boolean | null
          job_title: string | null
          last_contact_date: string | null
          last_name: string | null
          last_osint_scan: string | null
          linkedin_url: string | null
          nickname: string | null
          notes: string | null
          organization: string | null
          osint_scan_priority: number | null
          relationship_subtype: string | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags: string[] | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          hierarchy_level?: string | null
          id?: string
          initial_intel_completed?: boolean | null
          is_favorite?: boolean | null
          is_self_profile?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          last_osint_scan?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          osint_scan_priority?: number | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
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
          cognitive_profile: Json | null
          communication_dna: Json | null
          confidence_score: number | null
          created_at: string
          dark_triad: Json | null
          data_completeness: number | null
          data_sources_used: Json | null
          deception_analysis: Json | null
          emotional_intelligence: Json | null
          flags: Json | null
          hexaco_honesty_humility: Json | null
          id: string
          last_analysis_at: string | null
          personality_ocean: Json | null
          profile_id: string
          psychiatric_indicators: Json | null
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
          cognitive_profile?: Json | null
          communication_dna?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad?: Json | null
          data_completeness?: number | null
          data_sources_used?: Json | null
          deception_analysis?: Json | null
          emotional_intelligence?: Json | null
          flags?: Json | null
          hexaco_honesty_humility?: Json | null
          id?: string
          last_analysis_at?: string | null
          personality_ocean?: Json | null
          profile_id: string
          psychiatric_indicators?: Json | null
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
          cognitive_profile?: Json | null
          communication_dna?: Json | null
          confidence_score?: number | null
          created_at?: string
          dark_triad?: Json | null
          data_completeness?: number | null
          data_sources_used?: Json | null
          deception_analysis?: Json | null
          emotional_intelligence?: Json | null
          flags?: Json | null
          hexaco_honesty_humility?: Json | null
          id?: string
          last_analysis_at?: string | null
          personality_ocean?: Json | null
          profile_id?: string
          psychiatric_indicators?: Json | null
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
      user_preferences: {
        Row: {
          ai_budget_alerts_enabled: boolean | null
          ai_budget_daily_cents: number | null
          ai_budget_monthly_cents: number | null
          ai_budget_weekly_cents: number | null
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
          reminder_email: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_budget_alerts_enabled?: boolean | null
          ai_budget_daily_cents?: number | null
          ai_budget_monthly_cents?: number | null
          ai_budget_weekly_cents?: number | null
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
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_budget_alerts_enabled?: boolean | null
          ai_budget_daily_cents?: number | null
          ai_budget_monthly_cents?: number | null
          ai_budget_weekly_cents?: number | null
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
          new_conversation_id: string | null
          parsed_messages: Json | null
          paused_at: string | null
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
          new_conversation_id?: string | null
          parsed_messages?: Json | null
          paused_at?: string | null
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
          new_conversation_id?: string | null
          parsed_messages?: Json | null
          paused_at?: string | null
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
      clean_expired_cache: { Args: never; Returns: number }
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
      merge_duplicate_profiles: {
        Args: {
          p_duplicate_id: string
          p_primary_id: string
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
      search_contacts_v3: {
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
      track_navigation_access: { Args: { p_route: string }; Returns: undefined }
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
