/**
 * Supabase Database Types
 * 
 * @lovable-protected - Do not regenerate this file
 * 
 * This file imports table definitions from domain-specific modules in ./types/domains/
 * See .lovable/config.json for regeneration settings.
 * 
 * Domain Structure:
 * - profiles-contacts: Profile, contact, relationship tables
 * - communications: Messages, emails, voice recordings
 * - intelligence: AI analyses, psychological profiles
 * - media-documents: Media, documents, face regions
 * - network-social: Social connections, network analysis
 * - security-defense: Threats, security, defenses
 * - operations-campaigns: Campaigns, missions, warfare
 * - behavioral-predictions: Predictions, patterns
 * - fusion-analysis: Cross-domain correlations
 * - system-config: User preferences, settings
 * - hardware-devices: Hardware, sensors
 * - reality-dimensional: Reality, quantum, dimensional ops
 * - infinity-eternal: Infinity, eternal protocols
 * - omniscient-transcendent: Omniscient, transcendent ops
 * - strategic-synthesis: Strategic, AGIS, synthesis ops
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Import all domain table types
import type { ProfilesContactsTables } from './types/domains/profiles-contacts.types';
import type { CommunicationsTables } from './types/domains/communications.types';
import type { IntelligenceTables } from './types/domains/intelligence.types';
import type { MediaDocumentsTables } from './types/domains/media-documents.types';
import type { NetworkSocialTables } from './types/domains/network-social.types';
import type { SecurityDefenseTables } from './types/domains/security-defense.types';
import type { OperationsCampaignsTables } from './types/domains/operations-campaigns.types';
import type { BehavioralPredictionsTables } from './types/domains/behavioral-predictions.types';
import type { FusionAnalysisTables } from './types/domains/fusion-analysis.types';
import type { SystemConfigTables } from './types/domains/system-config.types';
import type { HardwareDevicesTables } from './types/domains/hardware-devices.types';
import type { RealityDimensionalTables } from './types/domains/reality-dimensional.types';
import type { InfinityEternalTables } from './types/domains/infinity-eternal.types';
import type { OmniscientTranscendentTables } from './types/domains/omniscient-transcendent.types';
import type { StrategicSynthesisTables } from './types/domains/strategic-synthesis.types';

// Compose all tables from domain modules
type AllTables = 
  & ProfilesContactsTables
  & CommunicationsTables
  & IntelligenceTables
  & MediaDocumentsTables
  & NetworkSocialTables
  & SecurityDefenseTables
  & OperationsCampaignsTables
  & BehavioralPredictionsTables
  & FusionAnalysisTables
  & SystemConfigTables
  & HardwareDevicesTables
  & RealityDimensionalTables
  & InfinityEternalTables
  & OmniscientTranscendentTables
  & StrategicSynthesisTables;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: AllTables
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
      get_contact_counts: {
        Args: { p_user_id: string }
        Returns: {
          active_count: number
          inactive_count: number
          total_count: number
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
      get_remaining_modes: {
        Args: { completed_modes: string[]; requested_modes: string[] }
        Returns: string[]
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
      is_workspace_admin: {
        Args: { uid: string; ws_id: string }
        Returns: boolean
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
      modes_all_completed: {
        Args: { completed_modes: string[]; requested_modes: string[] }
        Returns: boolean
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
      search_contacts_v5: {
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

