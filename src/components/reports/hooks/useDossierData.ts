/**
 * Dossier Data Fetching Hook (v3.7.3)
 * Centralizes all Supabase queries for dossier generation
 * Expanded to fetch 55+ data sources for 64-section PDF
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
      supabase.from('communications').select('*').eq('profile_id', profileId).order('communication_date', { ascending: false }).limit(100),
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
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'digital_twin').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'graph_rag').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'shadow_network').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'dempster_shafer').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'counterfactual').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'pattern_of_life').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'entity_resolution').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sentiment_cascade').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 6: Additional AI Analyses by Type (for section renderers expecting specific data)
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
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'engagement_playbook').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'hypnotic_patterns').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'cognitive_load').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'sacred_values').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'reality_testing').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'identity_destabilization').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'semantic_warfare').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'memetic_propagation').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 7: More AI Analyses by Type
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
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'future_modeling').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'precognitive').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'choice_architecture').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_operations').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'threat_actor').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_resistance').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'network_position').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'prediction_accuracy').order('generated_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'counter_intel').order('generated_at', { ascending: false }).limit(1),
    ]);

    // Batch 8: Final batch of AI Analyses
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
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'deception_analysis').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'dark_tetrad').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'influence_vectors').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'coercive_control').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'pattern_of_life_engine').order('generated_at', { ascending: false }).limit(1),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'financial_psychology_profile').order('generated_at', { ascending: false }).limit(1),
      supabase.from('elicitation_sessions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'scenario_prediction').order('generated_at', { ascending: false }).limit(5),
      supabase.from('ai_analyses').select('*').eq('profile_id', profileId).eq('analysis_type', 'life_milestones').order('generated_at', { ascending: false }).limit(10),
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
    };
  }, []);

  return { fetchAllDossierData };
}
