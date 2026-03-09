/**
 * Database type helpers - commonly used types extracted from the massive types.ts
 * 
 * IMPORTANT: Always import from this file instead of directly from types.ts
 * This dramatically improves IDE performance and TypeScript compilation speed.
 * 
 * v3.7.0: Expanded with 50+ additional types for warfare, fusion, and assessment tables
 * 
 * @example
 * // ✅ Good - import from database-helpers
 * import type { Profile, Communication, BetrayalPrediction } from '@/types/database-helpers';
 * 
 * // ❌ Bad - direct import from types.ts (35,000+ lines)
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
// Voice Recording types (v3.7.0)
// ============================================
export type VoiceRecordingSession = Tables['voice_recording_sessions']['Row'];
export type VoiceRecordingSessionInsert = Tables['voice_recording_sessions']['Insert'];

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
// Influence & Elicitation types (v3.7.0)
// ============================================
export type ContactInfluenceProfile = Tables['contact_influence_profiles']['Row'];
export type ContactInfluenceProfileInsert = Tables['contact_influence_profiles']['Insert'];

export type ElicitationSession = Tables['elicitation_sessions']['Row'];
export type ElicitationSessionInsert = Tables['elicitation_sessions']['Insert'];

// ============================================
// Financial Psychology types (v3.7.0)
// ============================================
export type FinancialPsychologyProfile = Tables['financial_psychology_profiles']['Row'];
export type FinancialPsychologyProfileInsert = Tables['financial_psychology_profiles']['Insert'];

// ============================================
// Sacred Values & Memetic types (v3.7.0)
// ============================================
export type SacredValue = Tables['sacred_values']['Row'];
export type SacredValueInsert = Tables['sacred_values']['Insert'];

export type MemeticCampaign = Tables['memetic_campaigns']['Row'];
export type MemeticCampaignInsert = Tables['memetic_campaigns']['Insert'];

// ============================================
// Betrayal & Trauma types (v3.7.0)
// ============================================
export type BetrayalPrediction = Tables['betrayal_predictions']['Row'];
export type BetrayalPredictionInsert = Tables['betrayal_predictions']['Insert'];

export type TraumaExploitationWindow = Tables['trauma_exploitation_windows']['Row'];
export type TraumaExploitationWindowInsert = Tables['trauma_exploitation_windows']['Insert'];

// ============================================
// Identity & Psychological Warfare types (v3.7.0)
// ============================================
export type IdentityDestabilizationLog = Tables['identity_destabilization_logs']['Row'];
export type IdentityDestabilizationLogInsert = Tables['identity_destabilization_logs']['Insert'];

export type RealityFramework = Tables['reality_frameworks']['Row'];
export type RealityFrameworkInsert = Tables['reality_frameworks']['Insert'];

// ============================================
// Cognitive & Deception Warfare types (v3.7.0)
// ============================================
export type CognitiveWarfareOperation = Tables['cognitive_warfare_operations']['Row'];
export type CognitiveWarfareOperationInsert = Tables['cognitive_warfare_operations']['Insert'];

export type DeceptionOperation = Tables['deception_operations']['Row'];
export type DeceptionOperationInsert = Tables['deception_operations']['Insert'];

export type ActiveDefenseOperation = Tables['active_defense_operations']['Row'];
export type ActiveDefenseOperationInsert = Tables['active_defense_operations']['Insert'];

// ============================================
// Vulnerability & Trust Trajectory types (v3.7.0)
// ============================================
export type VulnerabilityWindow = Tables['vulnerability_windows']['Row'];
export type VulnerabilityWindowInsert = Tables['vulnerability_windows']['Insert'];

export type TrustTrajectory = Tables['trust_trajectories']['Row'];
export type TrustTrajectoryInsert = Tables['trust_trajectories']['Insert'];

export type ProportionalResponseLog = Tables['proportional_response_logs']['Row'];
export type ProportionalResponseLogInsert = Tables['proportional_response_logs']['Insert'];

// ============================================
// Fusion Intelligence types (v3.7.0)
// ============================================
export type MosaicIntelligenceFusion = Tables['mosaic_intelligence_fusion']['Row'];
export type MosaicIntelligenceFusionInsert = Tables['mosaic_intelligence_fusion']['Insert'];

export type CrossDomainCorrelation = Tables['cross_domain_correlations']['Row'];
export type CrossDomainCorrelationInsert = Tables['cross_domain_correlations']['Insert'];

export type CognitiveSuperposition = Tables['cognitive_superpositions']['Row'];
export type CognitiveSuperpositionInsert = Tables['cognitive_superpositions']['Insert'];

export type TimelineProbability = Tables['timeline_probabilities']['Row'];
export type TimelineProbabilityInsert = Tables['timeline_probabilities']['Insert'];

export type PrecursorSignature = Tables['precursor_signatures']['Row'];
export type PrecursorSignatureInsert = Tables['precursor_signatures']['Insert'];

// ============================================
// Behavioral Prediction types (v3.7.0)
// ============================================
export type BehavioralPrediction = Tables['behavioral_predictions']['Row'];
export type BehavioralPredictionInsert = Tables['behavioral_predictions']['Insert'];

export type BehavioralAnomaly = Tables['behavioral_anomalies']['Row'];
export type BehavioralAnomalyInsert = Tables['behavioral_anomalies']['Insert'];

export type BehavioralScenarioPrediction = Tables['behavioral_scenario_predictions']['Row'];
export type BehavioralScenarioPredictionInsert = Tables['behavioral_scenario_predictions']['Insert'];

// ============================================
// Cross-Modal Analysis types (v3.7.0)
// ============================================
export type CrossModalCorrelation = Tables['cross_modal_correlations']['Row'];
export type CrossModalCorrelationInsert = Tables['cross_modal_correlations']['Insert'];

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
// Life Milestones types (v3.7.0)
// ============================================
export type ContactLifeMilestone = Tables['contact_life_milestones']['Row'];
export type ContactLifeMilestoneInsert = Tables['contact_life_milestones']['Insert'];

// ============================================
// Personal Info types
// ============================================
export type ContactPersonalInfo = Tables['contact_personal_info']['Row'];
export type ContactPersonalInfoInsert = Tables['contact_personal_info']['Insert'];

// ============================================
// Education & Certification types
// ============================================
export type Education = Tables['education']['Row'];
export type EducationInsert = Tables['education']['Insert'];

export type Certification = Tables['certifications']['Row'];
export type CertificationInsert = Tables['certifications']['Insert'];

// ============================================
// Location types
// ============================================
export type ContactLocation = Tables['contact_locations']['Row'];
export type ContactLocationInsert = Tables['contact_locations']['Insert'];

// ============================================
// Dossier types (v3.7.0)
// ============================================
export type Dossier = Tables['dossiers']['Row'];
export type DossierInsert = Tables['dossiers']['Insert'];

// ============================================
// Addiction & Coercive Control types (v3.7.0)
// ============================================
export type AddictionProtocol = Tables['addiction_protocols']['Row'];
export type AddictionProtocolInsert = Tables['addiction_protocols']['Insert'];

// ============================================
// AGIS System types (v3.7.0 + v3.8.0 Insert/Update)
// ============================================
export type AGISGlobalState = Tables['agis_global_state']['Row'];
export type AGISGlobalStateUpdate = Tables['agis_global_state']['Update'];
export type AGISCascadeEvent = Tables['agis_cascade_events']['Row'];
export type AGISCascadeEventInsert = Tables['agis_cascade_events']['Insert'];
export type AGISAnalytics = Tables['agis_analytics']['Row'];
export type AGISAnalyticsInsert = Tables['agis_analytics']['Insert'];
export type AGISObjectiveTracking = Tables['agis_objective_tracking']['Row'];
export type AGISPhaseSynergy = Tables['agis_phase_synergies']['Row'];
export type AGISPhaseSynergyInsert = Tables['agis_phase_synergies']['Insert'];
export type AGISPhaseSynergyUpdate = Tables['agis_phase_synergies']['Update'];
export type AGISCascadeRule = Tables['agis_cascade_rules']['Row'];
export type AGISCascadeRuleUpdate = Tables['agis_cascade_rules']['Update'];

// ============================================
// New Warfare Enhancement types (v5.0)
// ============================================
export type OpsecAssessment = Tables['opsec_assessments']['Row'];
export type OpsecAssessmentInsert = Tables['opsec_assessments']['Insert'];

export type DigitalFootprintItem = Tables['digital_footprint_items']['Row'];
export type DigitalFootprintItemInsert = Tables['digital_footprint_items']['Insert'];

export type SocialEngineeringIncident = Tables['social_engineering_incidents']['Row'];
export type SocialEngineeringIncidentInsert = Tables['social_engineering_incidents']['Insert'];

export type HoneyProfile = Tables['honey_profiles']['Row'];
export type HoneyProfileInsert = Tables['honey_profiles']['Insert'];

export type LegalThreatAssessment = Tables['legal_threat_assessments']['Row'];
export type LegalThreatAssessmentInsert = Tables['legal_threat_assessments']['Insert'];

export type ReputationIncident = Tables['reputation_incidents']['Row'];
export type ReputationIncidentInsert = Tables['reputation_incidents']['Insert'];

export type ProtectedPerson = Tables['protected_persons']['Row'];
export type ProtectedPersonInsert = Tables['protected_persons']['Insert'];

export type EmergencyProtocol = Tables['emergency_protocols']['Row'];
export type EmergencyProtocolInsert = Tables['emergency_protocols']['Insert'];

export type CrisisEvent = Tables['crisis_events']['Row'];
export type CrisisEventInsert = Tables['crisis_events']['Insert'];

export type EconomicThreatAssessment = Tables['economic_threat_assessments']['Row'];
export type EconomicThreatAssessmentInsert = Tables['economic_threat_assessments']['Insert'];

export type TscmSweepResult = Tables['tscm_sweep_results']['Row'];
export type TscmSweepResultInsert = Tables['tscm_sweep_results']['Insert'];

export type BehavioralBaseline = Tables['behavioral_baselines']['Row'];
export type BehavioralBaselineInsert = Tables['behavioral_baselines']['Insert'];

// Export the full Database type for advanced use cases only
export type { Database };
