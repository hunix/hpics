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
          output_tokens: number | null
          profile_id: string | null
          prompt_summary: string | null
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
          output_tokens?: number | null
          profile_id?: string | null
          prompt_summary?: string | null
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
          output_tokens?: number | null
          profile_id?: string | null
          prompt_summary?: string | null
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
            referencedRelation: "profiles"
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
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_profile_id_fkey"
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
            referencedRelation: "profiles"
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
      media: {
        Row: {
          caption: string | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          profile_id: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          profile_id?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_profile_id_fkey"
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
          metadata: Json | null
          sent_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          metadata?: Json | null
          sent_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_from_contact?: boolean
          metadata?: Json | null
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          first_name: string
          hierarchy_level: string | null
          id: string
          is_favorite: boolean | null
          job_title: string | null
          last_contact_date: string | null
          last_name: string | null
          linkedin_url: string | null
          nickname: string | null
          notes: string | null
          organization: string | null
          relationship_subtype: string | null
          relationship_type:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name: string
          hierarchy_level?: string | null
          id?: string
          is_favorite?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          first_name?: string
          hierarchy_level?: string | null
          id?: string
          is_favorite?: boolean | null
          job_title?: string | null
          last_contact_date?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          nickname?: string | null
          notes?: string | null
          organization?: string | null
          relationship_subtype?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["relationship_type"]
            | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
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
          email_reminders: boolean | null
          id: string
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
          email_reminders?: boolean | null
          id?: string
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
          email_reminders?: boolean | null
          id?: string
          reminder_email?: string | null
          theme?: string | null
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
