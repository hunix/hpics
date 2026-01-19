/**
 * Communications Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json } from '../base';

/**
 * Tables in this domain: communications, email_access_logs, email_accounts, email_messages, email_threads, gmail_config, live_transcriptions, meeting_intelligence, meeting_recordings, message_fingerprints, messages, outlook_config, vocal_analyses, voice_analysis_jobs, voice_insights, voice_notes, voice_recording_sessions, voice_signatures, whatsapp_config, whatsapp_import_sessions, whatsapp_templates
 */
export interface CommunicationsTables {
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
}
