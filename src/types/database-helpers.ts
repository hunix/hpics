/**
 * Database type helpers - commonly used types extracted from the massive types.ts
 * Import from here instead of directly from types.ts for better performance
 */

import type { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];

// Profile & Contact types
export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

// Communication types
export type Communication = Tables['communications']['Row'];
export type CommunicationInsert = Tables['communications']['Insert'];

// Media types
export type Media = Tables['media']['Row'];
export type MediaInsert = Tables['media']['Insert'];
export type MediaAnalysis = Tables['media_analyses']['Row'];

// Bulk Analysis types
export type BulkSession = Tables['bulk_analysis_sessions']['Row'];
export type BulkSessionInsert = Tables['bulk_analysis_sessions']['Insert'];
export type BulkSessionUpdate = Tables['bulk_analysis_sessions']['Update'];

export type BulkItem = Tables['bulk_analysis_items']['Row'];
export type BulkItemInsert = Tables['bulk_analysis_items']['Insert'];
export type BulkItemUpdate = Tables['bulk_analysis_items']['Update'];

// AI Insight types
export type VoiceInsight = Tables['voice_insights']['Row'];
export type DocumentInsight = Tables['document_insights']['Row'];
export type FacialAnalysis = Tables['facial_analyses']['Row'];
export type BehavioralAnalysis = Tables['behavioral_analyses']['Row'];

// System types
export type UserPreference = Tables['user_preferences']['Row'];
export type AppSetting = Tables['app_settings']['Row'];

// Export the full Database type for advanced use cases
export type { Database };
