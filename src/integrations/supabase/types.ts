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
            referencedRelation: "profiles"
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          content: string
          content_summary: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          profile_id: string | null
          source_id: string
          source_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          source_id: string
          source_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_summary?: string | null
          created_at?: string | null
          embedding?: string | null
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          storage_path: string | null
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
          storage_path?: string | null
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
          storage_path?: string | null
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
            referencedRelation: "profiles"
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
          storage_path: string | null
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
          storage_path?: string | null
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
          storage_path?: string | null
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
      oauth_tokens: {
        Row: {
          access_token: string
          account_email: string | null
          created_at: string | null
          expires_at: string
          id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_email?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_email?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
