/**
 * System Config Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: ab_test_assignments, ab_tests, app_settings, dashboard_layouts, deletion_requests, device_sync_log, error_logs, generated_reports, integration_configs, integration_guides, integration_test_history, navigation_preferences, navigation_quick_access, notification_preferences, oauth_tokens, platform_config, prompt_versions, push_subscriptions, query_cache, query_suggestions, reports_schedule, saved_searches, sync_cursors, system_evolution_log, system_health, user_config_overrides, user_preferences, user_roles, webhook_logs, webhooks, weekly_summaries, workspace_members, workspaces
 */
export interface SystemConfigTables {
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
