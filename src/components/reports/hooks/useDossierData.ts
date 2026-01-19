/**
 * Dossier Data Fetching Hook
 * Centralizes all Supabase queries for dossier generation
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
      milestonesData,
      relationshipsData,
      trustData,
    ] = await Promise.all([
      supabase.from('contact_observations').select('*').eq('profile_id', profileId).order('observed_at', { ascending: false }).limit(50),
      supabase.from('communications').select('*').eq('profile_id', profileId).order('communication_date', { ascending: false }).limit(100),
      (supabase.from as Function)('anomaly_detections').select('*').eq('profile_id', profileId).order('detected_at', { ascending: false }).limit(20),
      (supabase.from as Function)('life_milestones').select('*').eq('profile_id', profileId).order('milestone_date', { ascending: false }).limit(10),
      supabase.from('contact_relationships').select('*, to_profile:to_profile_id(id, first_name, last_name, organization)').eq('from_profile_id', profileId).limit(50),
      supabase.from('trust_assessments').select('*').eq('profile_id', profileId).order('assessed_at', { ascending: false }).limit(1),
    ]);

    // Batch 3: Advanced intelligence
    const [
      traumaData,
      mediaAnalyses,
      betrayalData,
      scenarioPredictions,
      elicitationSessions,
      financialPsychology,
    ] = await Promise.all([
      (supabase.from as Function)('trauma_indicators').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      supabase.from('media_analyses').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(30),
      (supabase.from as Function)('betrayal_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      (supabase.from as Function)('scenario_predictions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      (supabase.from as Function)('elicitation_sessions').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(5),
      (supabase.from as Function)('financial_psychology').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
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
      proportionalResponseData,
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
      supabase.from('proportional_response_logs').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(10),
      supabase.from('mosaic_intelligence_fusion').select('*').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
    ]);

    // Batch 5: Data Fusion Engine Results
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

    return {
      profile,
      allAnalyses: allAnalyses.data || [],
      psychData: psychData.data || [],
      miceData: miceData.data || [],
      influenceData: influenceData.data,
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
    };
  }, []);

  return { fetchAllDossierData };
}
