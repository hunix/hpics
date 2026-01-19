/**
 * Database type helpers - commonly used types extracted from the massive types.ts
 * 
 * IMPORTANT: Always import from this file instead of directly from types.ts
 * This dramatically improves IDE performance and TypeScript compilation speed.
 * 
 * @example
 * // ✅ Good - import from database-helpers
 * import type { Profile, Communication } from '@/types/database-helpers';
 * 
 * // ❌ Bad - direct import from types.ts (33,000+ lines)
 * import type { Tables } from '@/integrations/supabase/types';
 */

import type { Database, Json, Enums } from '@/integrations/supabase/types';

// Re-export Json and Enums types for convenience
export type { Json, Enums };

type Tables = Database['public']['Tables'];

// ============================================
// Enum types
// ============================================
export type MessagePlatform = Enums<'message_platform'>;

// Helper type for table access
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// ============================================
// Profile & Contact types
// ============================================
export type Profile = Tables['profiles']['Row'];
export type ProfileInsert = Tables['profiles']['Insert'];
export type ProfileUpdate = Tables['profiles']['Update'];

/** Extended profile with optional relationship fields */
export type ExtendedProfile = Profile & { 
  relationship_subtype?: string; 
  hierarchy_level?: string; 
  country?: string | null;
  is_self_profile?: boolean;
};

export type ContactMethod = Tables['contact_methods']['Row'];
export type ContactMethodInsert = Tables['contact_methods']['Insert'];

// ============================================
// Communication types
// ============================================
export type Communication = Tables['communications']['Row'];
export type CommunicationInsert = Tables['communications']['Insert'];
export type CommunicationUpdate = Tables['communications']['Update'];

/** Communication with joined profile data */
export type CommunicationWithProfile = Communication & {
  profiles: { first_name: string; last_name: string | null } | null;
};

// ============================================
// Event types
// ============================================
export type Event = Tables['events']['Row'];
export type EventInsert = Tables['events']['Insert'];
export type EventUpdate = Tables['events']['Update'];

/** Event with joined profile data */
export type EventWithProfile = Event & {
  profiles: { first_name: string; last_name: string | null } | null;
};

// ============================================
// Media types
// ============================================
export type Media = Tables['media']['Row'];
export type MediaInsert = Tables['media']['Insert'];
export type MediaUpdate = Tables['media']['Update'];
export type MediaAnalysis = Tables['media_analyses']['Row'];

/** Media with joined profile data */
export type MediaWithProfile = Media & {
  profiles: { first_name: string; last_name: string | null } | null;
};

export type MeetingRecording = Tables['meeting_recordings']['Row'];
export type MeetingRecordingInsert = Tables['meeting_recordings']['Insert'];

/** Recording with joined profile data */
export type RecordingWithProfile = MeetingRecording & {
  profiles: { first_name: string; last_name: string | null } | null;
};

// ============================================
// Document types
// ============================================
export type Document = Tables['documents']['Row'];
export type DocumentInsert = Tables['documents']['Insert'];
export type DocumentUpdate = Tables['documents']['Update'];
export type DocumentInsight = Tables['document_insights']['Row'];

/** Document with joined profile data */
export type DocumentWithProfile = Document & {
  profiles: { first_name: string; last_name: string | null } | null;
};

// ============================================
// Bulk Analysis types
// ============================================
export type BulkSession = Tables['bulk_analysis_sessions']['Row'];
export type BulkSessionInsert = Tables['bulk_analysis_sessions']['Insert'];
export type BulkSessionUpdate = Tables['bulk_analysis_sessions']['Update'];

export type BulkItem = Tables['bulk_analysis_items']['Row'];
export type BulkItemInsert = Tables['bulk_analysis_items']['Insert'];
export type BulkItemUpdate = Tables['bulk_analysis_items']['Update'];

// ============================================
// AI & Intelligence types
// ============================================
export type VoiceInsight = Tables['voice_insights']['Row'];
export type VoiceInsightInsert = Tables['voice_insights']['Insert'];

export type FacialAnalysis = Tables['facial_analyses']['Row'];
export type FacialAnalysisInsert = Tables['facial_analyses']['Insert'];

export type BehavioralAnalysis = Tables['behavioral_analyses']['Row'];
export type BehavioralAnalysisInsert = Tables['behavioral_analyses']['Insert'];

export type AIAnalysis = Tables['ai_analyses']['Row'];
export type AIAnalysisInsert = Tables['ai_analyses']['Insert'];

export type AIUsageLog = Tables['ai_usage_logs']['Row'];
export type AIUsageLogInsert = Tables['ai_usage_logs']['Insert'];

// ============================================
// Intelligence Assessment types
// ============================================
export type MICEAssessment = Tables['mice_assessments']['Row'];
export type MICEAssessmentInsert = Tables['mice_assessments']['Insert'];

export type SemanticOperation = Tables['semantic_operations']['Row'];
export type SemanticOperationInsert = Tables['semantic_operations']['Insert'];

export type PsychologicalProfile = Tables['psychological_profiles']['Row'];
export type TrustAssessment = Tables['trust_assessments']['Row'];

// ============================================
// Hardware & Mission types
// ============================================
export type HardwareDevice = Tables['hardware_devices']['Row'];
export type HardwareDeviceInsert = Tables['hardware_devices']['Insert'];

export type IntelligenceMission = Tables['intelligence_missions']['Row'];
export type IntelligenceMissionInsert = Tables['intelligence_missions']['Insert'];

// ============================================
// System types
// ============================================
export type UserPreference = Tables['user_preferences']['Row'];
export type UserPreferenceInsert = Tables['user_preferences']['Insert'];

export type AppSetting = Tables['app_settings']['Row'];
export type AppSettingInsert = Tables['app_settings']['Insert'];

export type ErrorLog = Tables['error_logs']['Row'];
export type ErrorLogInsert = Tables['error_logs']['Insert'];

// ============================================
// Analysis & Aggregation types
// ============================================
export type AnalysisEvent = Tables['analysis_events']['Row'];
export type AnalysisAggregate = Tables['analysis_aggregates']['Row'];
export type AnalysisSession = Tables['analysis_sessions']['Row'];

// ============================================
// Network & Graph types
// ============================================
export type NetworkSnapshot = Tables['network_snapshots']['Row'];
export type ContactRelationship = Tables['contact_relationships']['Row'];
export type ContactRelationshipInsert = Tables['contact_relationships']['Insert'];

// ============================================
// Face Region types
// ============================================
export type FaceRegion = Tables['face_regions']['Row'];
export type FaceRegionInsert = Tables['face_regions']['Insert'];

// ============================================
// Campaign & Warfare types
// ============================================
export type AutonomousCampaign = Tables['autonomous_campaigns']['Row'];
export type AutonomousCampaignInsert = Tables['autonomous_campaigns']['Insert'];
export type AutonomousCampaignUpdate = Tables['autonomous_campaigns']['Update'];

export type ThreatActor = Tables['threat_actors']['Row'];
export type ThreatActorInsert = Tables['threat_actors']['Insert'];

export type ActionRecommendation = Tables['action_recommendations']['Row'];
export type ActionRecommendationInsert = Tables['action_recommendations']['Insert'];

// ============================================
// Insight & Observation types
// ============================================
export type ContactObservation = Tables['contact_observations']['Row'];
export type ContactObservationInsert = Tables['contact_observations']['Insert'];

export type ContactInterest = Tables['contact_interests']['Row'];
export type ContactInterestInsert = Tables['contact_interests']['Insert'];

// ============================================
// Personal Info types
// ============================================
export type ContactPersonalInfo = Tables['contact_personal_info']['Row'];
export type ContactPersonalInfoInsert = Tables['contact_personal_info']['Insert'];

// Export the full Database type for advanced use cases only
export type { Database };
