/**
 * Dossier Data Fetching Hook (v8.0)
 * Centralizes all Supabase queries for dossier generation
 * Expanded to fetch 73+ data sources for 137-section PDF
 */

import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DossierDataResult {
  profile: any;
  allAnalyses: any[];
  psychData: any[];
  miceData: any[];
  influenceData: any;
  mediaData: any[];
  voiceData: any[];
  observationsData: any[];
  commData: any[];
  anomaliesData: any[];
  milestonesData: any[];
  relationshipsData: any[];
  trustData: any[];
  traumaData: any[];
  mediaAnalyses: any[];
  betrayalData: any[];
  scenarioPredictions: any[];
  elicitationSessions: any[];
  financialPsychology: any[];
  crossModalData: any[];
  cognitiveSuperpositions: any[];
  timelineProbabilities: any[];
  precursorSignatures: any[];
  cognitiveWarfareData: any[];
  activeDefenseData: any[];
  deceptionOpsData: any[];
  vulnerabilityWindowsData: any[];
  trustTrajectoriesData: any[];
  proportionalResponseData: any[];
  mosaicFusionData: any[];
  temporalFusionData: any[];
  digitalTwinData: any[];
  graphRagData: any[];
  shadowNetworkData: any[];
  dempsterShaferData: any[];
  counterfactualData: any[];
  patternOfLifeData: any[];
  entityResolutionData: any[];
  sentimentCascadeData: any[];
  // Additional fields for v3.7.3
  quantumCognitionData: any[];
  playbookData: any[];
  hypnoticPatternsData: any[];
  elicitationData: any[];
  cognitiveLoadData: any[];
  sacredValuesData: any[];
  realityTestingData: any[];
  identityDestabData: any[];
  semanticWarfareData: any[];
  memeticData: any[];
  futureModelingData: any[];
  precognitiveData: any[];
  choiceArchitectureData: any[];
  influenceOpsData: any[];
  threatActorData: any[];
  influenceResistanceData: any[];
  financialPsychData: any[];
  networkPositionData: any[];
  predictionHistoryData: any[];
  counterIntelData: any[];
  deceptionAnalysisData: any[];
  actionPlansData: any[];
  darkTetradData: any[];
  relationshipData: any[];
  influenceVectorData: any[];
  coerciveControlData: any[];
  patternOfLifeEngineData: any[];
  // New Warfare Enhancement fields (v5.0)
  opsecAssessments: any[];
  digitalFootprints: any[];
  socialEngineeringIncidents: any[];
  honeyProfiles: any[];
  legalThreats: any[];
  reputationIncidents: any[];
  protectedPersons: any[];
  emergencyProtocols: any[];
  crisisEvents: any[];
  economicThreats: any[];
  tscmSweeps: any[];
  behavioralBaselines: any[];
  // New Fusion Engine fields (v5.0)
  biometricBehavioralFusion: any[];
  geospatialCommunicationFusion: any[];
  financialDocumentSynthesis: any[];
  calendarPatternAnalysis: any[];
  // New v6.0 Advanced Intelligence fields
  relationshipHalfLifeData: any[];
  automatedRedTeamData: any[];
  multiPartyDeceptionData: any[];
  zeroDayAnomalyData: any[];
  hypergameTheoryData: any[];
  // New v7.0 Extreme Intelligence fields
  subvocalizationData: any[];
  audioBurstData: any[];
  iioAttributionData: any[];
  reflexiveControlData: any[];
  cognitiveEffectData: any[];
  theoryOfMindData: any[];
  collectiveBehaviorData: any[];
  stylometricData: any[];
  dark2ClearData: any[];
  gatedBioFusionData: any[];
  tasComCommunityData: any[];
  biometricRetentionData: any[];
  // New v8.0 Masterpiece Intelligence fields
  // Phase 1: Counter-Intelligence
  dracoDeceptionData: any[];
  sentientIntentData: any[];
  insiderThreatData: any[];
  bayesianIntentionData: any[];
  redTeamAdversaryData: any[];
  semaforForgeryData: any[];
  epistemicVulnerabilityData: any[];
  cognitiveIwData: any[];
  // Phase 2: Psychological Warfare
  psychoagentCascadeData: any[];
  affectiveManipulationData: any[];
  hyperpersonalizationData: any[];
  computationalPersuasionData: any[];
  syntheticMemoryData: any[];
  prememBeliefData: any[];
  linguisticStressData: any[];
  memoryAnchorData: any[];
  emotionalContagionData: any[];
  sacredValuePredictorData: any[];
  // Phase 3: Biometric & Network
  pupillometryData: any[];
  thermalStressData: any[];
  attentionFuserData: any[];
  keystrokeDynamicsData: any[];
  sheafNeuralData: any[];
  ctdgLinkData: any[];
  cascadeViralityData: any[];
  networkResilienceData: any[];
  // Phase 4: Doctrine & Prediction
  gazePatternData: any[];
  microExpressionData: any[];
  voiceStressCorrelatorData: any[];
  socialGraphPredictorData: any[];
  influenceCampaignData: any[];
  counterNarrativeData: any[];
  predictiveDoctrineData: any[];
  cognitiveDefenseData: any[];
  behavioralFingerprintData: any[];
}

export function useDossierData() {
  const fetchAllDossierData = useCallback(async (profileId: string): Promise<DossierDataResult | null> => {
    // Fetch profile first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      return null;
    }

    // Batch 1: Core profile data
    const [
      allAnalyses,
      psychData,
      miceData,
      influenceData,
      mediaData,
      voiceData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).order('generated_at', { ascending: false }),
      supabase.from('psychological_profiles').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      supabase.from('mice_assessments').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      supabase.from('contact_influence_profiles').select('*').eq('profile_id', profileId).maybeSingle(),
      supabase.from('media').select('*').eq('profile_id', profileId).not('ai_metadata', 'is', null).order('created_at', { ascending: false }).limit(50),
      supabase.from('voice_recording_sessions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(20),
    ]);

    // Batch 2: Secondary intelligence sources
    const [
      observationsData,
      commData,
      anomaliesData,
      relationshipsData,
      trustData,
      actionPlansData,
    ] = await Promise.all([
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(50),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('occurred_at', { ascending: false }).limit(100),
      supabase.from('behavioral_anomalies').select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(20),
      supabase.from('contact_relationships').select('*, to_profile:to_profile_id(id, first_name, last_name, organization)').eq('from_profile_id', profileId).limit(50),
      supabase.from('trust_assessments').select('*').eq('profile_id', profileId).order('assessed_at', { ascending: false }).limit(1),
      supabase.from('action_recommendations').select('*').eq('profile_id', profileId).order('priority_score', { ascending: false }).limit(10),
    ]);

    // Batch 3: Advanced intelligence
    const [
      traumaData,
      mediaAnalyses,
      betrayalData,
      elicitationSessions,
      financialPsychology,
      proportionalResponseData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'trauma_analysis').limit(5),
      supabase.from('media_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(30),
      supabase.from('betrayal_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      supabase.from('elicitation_sessions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'financial_psychology').order('generated_at', { ascending: false }).limit(1),
      supabase.from('proportional_response_logs').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
    ]);

    // Batch 4: Warfare intelligence
    const [
      crossModalData,
      cognitiveSuperpositions,
      timelineProbabilities,
      precursorSignatures,
      cognitiveWarfareData,
      activeDefenseData,
      deceptionOpsData,
      vulnerabilityWindowsData,
      trustTrajectoriesData,
      mosaicFusionData,
    ] = await Promise.all([
      supabase.from('cross_modal_correlations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('cognitive_superpositions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('timeline_probabilities').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('precursor_signatures').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('cognitive_warfare_operations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('active_defense_operations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(3),
      supabase.from('deception_operations').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('vulnerability_windows').select('*').eq('profile_id', profileId).order('predicted_start', { ascending: false }).limit(10),
      supabase.from('trust_trajectories').select('*').eq('profile_id', profileId).order('trajectory_date', { ascending: false }).limit(180),
      supabase.from('mosaic_intelligence_fusion').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
    ]);

    // Batch 5: Data Fusion Engine Results (from ai_analyses by type)
    // v3.9.24: Use actual analysis_type values stored by edge functions
    const [
      temporalFusionData,
      digitalTwinData,
      graphRagData,
      shadowNetworkData,
      dempsterShaferData,
      counterfactualData,
      patternOfLifeData,
      entityResolutionData,
      sentimentCascadeData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'temporal_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_baseline').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'deep_intelligence_comprehensive').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'network_exploitation').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'mosaic_intelligence_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_prediction').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_dna').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'intelligence_dossier').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sentiment').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 6: Additional AI Analyses by Type (for section renderers expecting specific data)
    // v3.9.24: Use actual analysis_type values stored by edge functions
    const [
      quantumCognitionData,
      playbookData,
      hypnoticPatternsData,
      cognitiveLoadData,
      sacredValuesData,
      realityTestingData,
      identityDestabData,
      semanticWarfareData,
      memeticData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'quantum_cognition').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'playbook').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'narrative_control').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_warfare').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'existential_leverage').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_warfare').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'manipulation_susceptibility').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'narrative_control').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'memetic_propagation').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 7: More AI Analyses by Type
    // v3.9.24: Use actual analysis_type values stored by edge functions
    const [
      futureModelingData,
      precognitiveData,
      choiceArchitectureData,
      influenceOpsData,
      threatActorData,
      influenceResistanceData,
      networkPositionData,
      predictionHistoryData,
      counterIntelData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_prediction').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'precognitive_patterns').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'manipulation_susceptibility').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_profile').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'counter_intelligence').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'coercion_resistance').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'power_network').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_prediction').order('generated_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'counter_intelligence').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 8: Final batch of AI Analyses
    // v3.9.24: Use actual analysis_type values stored by edge functions
    const [
      deceptionAnalysisData,
      darkTetradData,
      influenceVectorData,
      coerciveControlData,
      patternOfLifeEngineData,
      financialPsychData,
      elicitationData,
      scenarioPredictions,
      milestonesData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'enhanced_deception_detection').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'manipulation_susceptibility').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_profile').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'coercion_resistance').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'temporal_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'economic_warfare').order('generated_at', { ascending: false }).limit(1),
      supabase.from('elicitation_sessions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_prediction').order('generated_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'intelligence_dossier').order('generated_at', { ascending: false }).limit(10),
    ]);

    // Also fetch relationship data separately
    const relationshipData = await supabase
      .from('contact_relationships')
      .select('*, related_profile:to_profile_id(id, first_name, last_name)')
      .eq('from_profile_id', profileId)
      .limit(20);

    // Get userId for user-scoped tables
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Batch 9: Warfare Enhancement Tables (v5.0)
    // Using explicit type casts to handle tables that may not exist in all environments
    const warfareBatch = await Promise.all([
      supabase.from('opsec_assessments' as any).select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      supabase.from('digital_footprint_items' as any).select('*').eq('profile_id', profileId).order('discovered_at', { ascending: false }).limit(20),
      supabase.from('social_engineering_incidents' as any).select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(10),
      supabase.from('honey_profiles' as any).select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('legal_threat_assessments' as any).select('*').eq('profile_id', profileId).order('assessed_at', { ascending: false }).limit(3),
      supabase.from('reputation_incidents' as any).select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(10),
      userId ? supabase.from('protected_persons' as any).select('*').eq('user_id', userId).limit(20) : Promise.resolve({ data: [] }),
      userId ? supabase.from('emergency_protocols' as any).select('*').eq('user_id', userId).eq('is_active', true).limit(5) : Promise.resolve({ data: [] }),
      supabase.from('crisis_events' as any).select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(10),
      supabase.from('economic_threat_assessments' as any).select('*').eq('profile_id', profileId).order('assessed_at', { ascending: false }).limit(3),
      supabase.from('tscm_sweep_results' as any).select('*').eq('profile_id', profileId).order('sweep_date', { ascending: false }).limit(5),
      supabase.from('behavioral_baselines' as any).select('*').eq('profile_id', profileId).order('baseline_date', { ascending: false }).limit(1),
    ]);

    // Batch 10: New Fusion Engine Results (v5.0)
    const [
      biometricBehavioralFusion,
      geospatialCommunicationFusion,
      financialDocumentSynthesis,
      calendarPatternAnalysis,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'biometric_behavioral_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'geospatial_communication_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'financial_document_synthesis').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'calendar_pattern_analysis').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 11: Advanced Intelligence Engine Results (v6.0)
    const [
      relationshipHalfLifeData,
      automatedRedTeamData,
      multiPartyDeceptionData,
      zeroDayAnomalyData,
      hypergameTheoryData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'relationship_half_life').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'automated_red_team').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'multi_party_deception').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'zero_day_anomaly').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'hypergame_theory').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 12: Extreme Intelligence Engine Results (v7.0)
    const [
      subvocalizationData,
      audioBurstData,
      iioAttributionData,
      reflexiveControlData,
      cognitiveEffectData,
      theoryOfMindData,
      collectiveBehaviorData,
      stylometricData,
      dark2ClearData,
      gatedBioFusionData,
      tasComCommunityData,
      biometricRetentionData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'subvocalization_detection').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'audio_burst_mental_state').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'iio_attribution').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'reflexive_control').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_effect').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'adversary_mental_model').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'collective_behavior').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'stylometric_fingerprint').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'surface_identity_bridge').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'gated_bio_fusion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'tas_com_community').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'biometric_retention').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 13: v8.0 Masterpiece Intelligence - Phase 1 (Counter-Intelligence)
    const [
      dracoDeceptionData,
      sentientIntentData,
      insiderThreatData,
      bayesianIntentionData,
      redTeamAdversaryData,
      semaforForgeryData,
      epistemicVulnerabilityData,
      cognitiveIwData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'draco_deception').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sentient_intent').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'insider_threat_matrix').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'bayesian_intention').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'red_team_adversary').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'semafor_forgery').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'epistemic_vulnerability').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_iw').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 14: v8.0 Masterpiece Intelligence - Phase 2 (Psychological Warfare)
    const [
      psychoagentCascadeData,
      affectiveManipulationData,
      hyperpersonalizationData,
      computationalPersuasionData,
      syntheticMemoryData,
      prememBeliefData,
      linguisticStressData,
      memoryAnchorData,
      emotionalContagionData,
      sacredValuePredictorData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'psychoagent_cascade').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'affective_manipulation').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'hyperpersonalization').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'computational_persuasion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'synthetic_memory').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'premem_belief').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'linguistic_stress').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'memory_anchor').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'emotional_contagion').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sacred_value_predictor').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 15: v8.0 Masterpiece Intelligence - Phase 3 (Biometric & Network)
    const [
      pupillometryData,
      thermalStressData,
      attentionFuserData,
      keystrokeDynamicsData,
      sheafNeuralData,
      ctdgLinkData,
      cascadeViralityData,
      networkResilienceData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'pupillometry').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'thermal_stress').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'attention_multimodal').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'keystroke_dynamics').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sheaf_neural').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'ctdg_link').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cascade_virality').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'network_resilience').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 16: v8.0 Masterpiece Intelligence - Phase 4 (Doctrine & Prediction)
    const [
      gazePatternData,
      microExpressionData,
      voiceStressCorrelatorData,
      socialGraphPredictorData,
      influenceCampaignData,
      counterNarrativeData,
      predictiveDoctrineData,
      cognitiveDefenseData,
      behavioralFingerprintData,
    ] = await Promise.all([
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'gaze_pattern').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'micro_expression_timeline').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'voice_stress_correlator').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'social_graph_predictor').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_campaign_optimizer').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'counter_narrative').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'predictive_doctrine').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_defense').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'behavioral_fingerprint').order('generated_at', { ascending: false }).limit(1),
    ]);

    const [
      opsecAssessments,
      digitalFootprints,
      socialEngineeringIncidents,
      honeyProfiles,
      legalThreats,
      reputationIncidents,
      protectedPersons,
      emergencyProtocols,
      crisisEvents,
      economicThreats,
      tscmSweeps,
      behavioralBaselines,
    ] = warfareBatch as unknown as Array<{ data: any[] | null }>;

    return {
      profile,
      allAnalyses: allAnalyses.data || [],
      psychData: psychData.data || [],
      miceData: miceData.data || [],
      influenceData: influenceData,
      mediaData: mediaData.data || [],
      voiceData: voiceData.data || [],
      observationsData: observationsData.data || [],
      commData: commData.data || [],
      anomaliesData: anomaliesData.data || [],
      milestonesData: milestonesData.data || [],
      relationshipsData: relationshipsData.data || [],
      trustData: trustData.data || [],
      traumaData: traumaData.data || [],
      mediaAnalyses: mediaAnalyses.data || [],
      betrayalData: betrayalData.data || [],
      scenarioPredictions: scenarioPredictions.data || [],
      elicitationSessions: elicitationSessions.data || [],
      financialPsychology: financialPsychology.data || [],
      crossModalData: crossModalData.data || [],
      cognitiveSuperpositions: cognitiveSuperpositions.data || [],
      timelineProbabilities: timelineProbabilities.data || [],
      precursorSignatures: precursorSignatures.data || [],
      cognitiveWarfareData: cognitiveWarfareData.data || [],
      activeDefenseData: activeDefenseData.data || [],
      deceptionOpsData: deceptionOpsData.data || [],
      vulnerabilityWindowsData: vulnerabilityWindowsData.data || [],
      trustTrajectoriesData: trustTrajectoriesData.data || [],
      proportionalResponseData: proportionalResponseData.data || [],
      mosaicFusionData: mosaicFusionData.data || [],
      temporalFusionData: temporalFusionData.data || [],
      digitalTwinData: digitalTwinData.data || [],
      graphRagData: graphRagData.data || [],
      shadowNetworkData: shadowNetworkData.data || [],
      dempsterShaferData: dempsterShaferData.data || [],
      counterfactualData: counterfactualData.data || [],
      patternOfLifeData: patternOfLifeData.data || [],
      entityResolutionData: entityResolutionData.data || [],
      sentimentCascadeData: sentimentCascadeData.data || [],
      // Additional v3.7.3 fields
      quantumCognitionData: quantumCognitionData.data || [],
      playbookData: playbookData.data || [],
      hypnoticPatternsData: hypnoticPatternsData.data || [],
      elicitationData: elicitationData.data || [],
      cognitiveLoadData: cognitiveLoadData.data || [],
      sacredValuesData: sacredValuesData.data || [],
      realityTestingData: realityTestingData.data || [],
      identityDestabData: identityDestabData.data || [],
      semanticWarfareData: semanticWarfareData.data || [],
      memeticData: memeticData.data || [],
      futureModelingData: futureModelingData.data || [],
      precognitiveData: precognitiveData.data || [],
      choiceArchitectureData: choiceArchitectureData.data || [],
      influenceOpsData: influenceOpsData.data || [],
      threatActorData: threatActorData.data || [],
      influenceResistanceData: influenceResistanceData.data || [],
      financialPsychData: financialPsychData.data || [],
      networkPositionData: networkPositionData.data || [],
      predictionHistoryData: predictionHistoryData.data || [],
      counterIntelData: counterIntelData.data || [],
      deceptionAnalysisData: deceptionAnalysisData.data || [],
      actionPlansData: actionPlansData.data || [],
      darkTetradData: darkTetradData.data || [],
      relationshipData: relationshipData.data || [],
      influenceVectorData: influenceVectorData.data || [],
      coerciveControlData: coerciveControlData.data || [],
      patternOfLifeEngineData: patternOfLifeEngineData.data || [],
      // New Warfare Enhancement fields (v5.0)
      opsecAssessments: opsecAssessments.data || [],
      digitalFootprints: digitalFootprints.data || [],
      socialEngineeringIncidents: socialEngineeringIncidents.data || [],
      honeyProfiles: honeyProfiles.data || [],
      legalThreats: legalThreats.data || [],
      reputationIncidents: reputationIncidents.data || [],
      protectedPersons: protectedPersons.data || [],
      emergencyProtocols: emergencyProtocols.data || [],
      crisisEvents: crisisEvents.data || [],
      economicThreats: economicThreats.data || [],
      tscmSweeps: tscmSweeps.data || [],
      behavioralBaselines: behavioralBaselines.data || [],
      // New Fusion Engine fields (v5.0)
      biometricBehavioralFusion: biometricBehavioralFusion.data || [],
      geospatialCommunicationFusion: geospatialCommunicationFusion.data || [],
      financialDocumentSynthesis: financialDocumentSynthesis.data || [],
      calendarPatternAnalysis: calendarPatternAnalysis.data || [],
      // New v6.0 Advanced Intelligence fields
      relationshipHalfLifeData: relationshipHalfLifeData.data || [],
      automatedRedTeamData: automatedRedTeamData.data || [],
      multiPartyDeceptionData: multiPartyDeceptionData.data || [],
      zeroDayAnomalyData: zeroDayAnomalyData.data || [],
      hypergameTheoryData: hypergameTheoryData.data || [],
      // New v7.0 Extreme Intelligence fields
      subvocalizationData: subvocalizationData.data || [],
      audioBurstData: audioBurstData.data || [],
      iioAttributionData: iioAttributionData.data || [],
      reflexiveControlData: reflexiveControlData.data || [],
      cognitiveEffectData: cognitiveEffectData.data || [],
      theoryOfMindData: theoryOfMindData.data || [],
      collectiveBehaviorData: collectiveBehaviorData.data || [],
      stylometricData: stylometricData.data || [],
      dark2ClearData: dark2ClearData.data || [],
      gatedBioFusionData: gatedBioFusionData.data || [],
      tasComCommunityData: tasComCommunityData.data || [],
      biometricRetentionData: biometricRetentionData.data || [],
      // New v8.0 Masterpiece Intelligence fields
      // Phase 1: Counter-Intelligence
      dracoDeceptionData: dracoDeceptionData.data || [],
      sentientIntentData: sentientIntentData.data || [],
      insiderThreatData: insiderThreatData.data || [],
      bayesianIntentionData: bayesianIntentionData.data || [],
      redTeamAdversaryData: redTeamAdversaryData.data || [],
      semaforForgeryData: semaforForgeryData.data || [],
      epistemicVulnerabilityData: epistemicVulnerabilityData.data || [],
      cognitiveIwData: cognitiveIwData.data || [],
      // Phase 2: Psychological Warfare
      psychoagentCascadeData: psychoagentCascadeData.data || [],
      affectiveManipulationData: affectiveManipulationData.data || [],
      hyperpersonalizationData: hyperpersonalizationData.data || [],
      computationalPersuasionData: computationalPersuasionData.data || [],
      syntheticMemoryData: syntheticMemoryData.data || [],
      prememBeliefData: prememBeliefData.data || [],
      linguisticStressData: linguisticStressData.data || [],
      memoryAnchorData: memoryAnchorData.data || [],
      emotionalContagionData: emotionalContagionData.data || [],
      sacredValuePredictorData: sacredValuePredictorData.data || [],
      // Phase 3: Biometric & Network
      pupillometryData: pupillometryData.data || [],
      thermalStressData: thermalStressData.data || [],
      attentionFuserData: attentionFuserData.data || [],
      keystrokeDynamicsData: keystrokeDynamicsData.data || [],
      sheafNeuralData: sheafNeuralData.data || [],
      ctdgLinkData: ctdgLinkData.data || [],
      cascadeViralityData: cascadeViralityData.data || [],
      networkResilienceData: networkResilienceData.data || [],
      // Phase 4: Doctrine & Prediction
      gazePatternData: gazePatternData.data || [],
      microExpressionData: microExpressionData.data || [],
      voiceStressCorrelatorData: voiceStressCorrelatorData.data || [],
      socialGraphPredictorData: socialGraphPredictorData.data || [],
      influenceCampaignData: influenceCampaignData.data || [],
      counterNarrativeData: counterNarrativeData.data || [],
      predictiveDoctrineData: predictiveDoctrineData.data || [],
      cognitiveDefenseData: cognitiveDefenseData.data || [],
      behavioralFingerprintData: behavioralFingerprintData.data || [],
    };
  }, []);

  return { fetchAllDossierData };
}
