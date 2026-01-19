/**
 * Media Documents Domain Types
 * 
 * @lovable-protected - Do not regenerate
 * Auto-generated from types.ts split script
 */

import type { Json, Database } from '../base';

/**
 * Tables in this domain: document_analysis_jobs, document_embeddings, document_hashes, document_insights, documents, extracted_documents, face_regions, face_scan_jobs, facial_analyses, gait_analyses, gait_profiles, media, media_analyses, media_contact_tags, media_metadata_jobs, moment_captures, screenshot_imports, thermal_captures, video_mosaics
 */
export interface MediaDocumentsTables {
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
          completed_analysis_modes: string[] | null
          created_at: string
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size: number | null
          file_url: string
          id: string
          last_analysis_at: string | null
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
          completed_analysis_modes?: string[] | null
          created_at?: string
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url: string
          id?: string
          last_analysis_at?: string | null
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
          completed_analysis_modes?: string[] | null
          created_at?: string
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_size?: number | null
          file_url?: string
          id?: string
          last_analysis_at?: string | null
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
      media: {
        Row: {
          ai_generation_error: string | null
          ai_generation_status: string | null
          ai_metadata: Json | null
          ai_metadata_generated_at: string | null
          ai_model_used: string | null
          caption: string | null
          completed_analysis_modes: string[] | null
          created_at: string
          file_size: number | null
          file_url: string
          id: string
          last_analysis_at: string | null
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
          completed_analysis_modes?: string[] | null
          created_at?: string
          file_size?: number | null
          file_url: string
          id?: string
          last_analysis_at?: string | null
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
          completed_analysis_modes?: string[] | null
          created_at?: string
          file_size?: number | null
          file_url?: string
          id?: string
          last_analysis_at?: string | null
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
}
