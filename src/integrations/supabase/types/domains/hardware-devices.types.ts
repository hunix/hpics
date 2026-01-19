/**
 * Hardware Devices Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: aerial_captures, aerial_missions, device_captures, device_contacts, device_health_checks, device_health_data, device_presence, geofences, google_calendar_config, hardware_alerts, hardware_analytics_snapshots, hardware_commands, hardware_devices, hardware_telemetry, interaction_biometrics, keystroke_profiles, location_history, metal_detection_sweeps, microexpression_readings, movement_routes, nfc_tags, proximity_events, rf_signal_captures, sensor_network_nodes, sensor_readings, synced_calendar_events
 */
export interface HardwareDevicesTables {
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
      microexpression_readings: {
        Row: {
          context: string | null
          created_at: string
          detected_emotions: Json | null
          duration_ms: number | null
          facs_action_units: Json | null
          frame_data: Json | null
          id: string
          intensity_score: number | null
          micro_expressions: Json | null
          profile_id: string | null
          session_id: string | null
          timestamp_ms: number | null
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          detected_emotions?: Json | null
          duration_ms?: number | null
          facs_action_units?: Json | null
          frame_data?: Json | null
          id?: string
          intensity_score?: number | null
          micro_expressions?: Json | null
          profile_id?: string | null
          session_id?: string | null
          timestamp_ms?: number | null
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          detected_emotions?: Json | null
          duration_ms?: number | null
          facs_action_units?: Json | null
          frame_data?: Json | null
          id?: string
          intensity_score?: number | null
          micro_expressions?: Json | null
          profile_id?: string | null
          session_id?: string | null
          timestamp_ms?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "microexpression_readings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "microexpression_readings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "contact_storage_stats_mv"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "microexpression_readings_profile_id_fkey"
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
}
