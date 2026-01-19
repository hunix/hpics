/**
 * Base types used across all Supabase type definitions
 * 
 * @lovable-protected - Do not regenerate
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type PostgrestVersion = "14.1"

/**
 * Database Enums - extracted for use in domain type files
 * These must match the enums defined in the database migrations
 */
export interface DatabaseEnums {
  app_role: "admin" | "supervisor" | "analyst" | "viewer"
  clearance_level: "uncleared" | "confidential" | "secret" | "top_secret" | "sci"
  communication_channel: "email" | "phone" | "video_call" | "in_person" | "message" | "social_media" | "other"
  communication_direction: "inbound" | "outbound"
  contact_type: "email" | "phone" | "linkedin" | "twitter" | "facebook" | "instagram" | "website" | "other"
  document_type: "resume" | "contract" | "presentation" | "notes" | "article" | "other"
  event_type: "birthday" | "anniversary" | "milestone" | "meeting" | "follow_up" | "other"
  reminder_frequency: "once" | "daily" | "weekly" | "monthly" | "yearly"
  relationship_type: "family" | "friend" | "colleague" | "client" | "mentor" | "mentee" | "acquaintance" | "other"
}

/**
 * Minimal Database interface for domain type files
 * Provides access to Enums without importing the full 35k line types file
 */
export interface Database {
  public: {
    Enums: DatabaseEnums
  }
}
