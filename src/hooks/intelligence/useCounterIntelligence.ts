/**
 * Counter-Intelligence Hook
 * AGIS Phase 5 - Omniscient Command
 * Threat detection, manipulation detection, adversary profiling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ThreatActor {
  id: string;
  actorName: string;
  actorType: 'individual' | 'organization' | 'state' | 'unknown';
  profileId?: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  capabilities: Record<string, unknown>;
  knownTactics: string[];
  attributedActions: Record<string, unknown>;
  indicatorsOfCompromise: Record<string, unknown>;
  networkAffiliations: string[];
  activityPattern: Record<string, unknown>;
  lastActivityAt?: Date;
  status: 'active' | 'dormant' | 'neutralized';
}

export interface ManipulationDetection {
  id: string;
  detectedInProfileId: string;
  sourceActorId?: string;
  manipulationType: string;
  detectionConfidence: number;
  evidence: Record<string, unknown>;
  affectedDomains: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  timeline: Record<string, unknown>;
  counterMeasures: Record<string, unknown>;
  isOngoing: boolean;
  detectedAt: Date;
  resolvedAt?: Date;
}

export interface DefensivePosture {
  id: string;
  profileId?: string;
  postureType: 'information_control' | 'social_shielding' | 'counter_narrative';
  threatModel: Record<string, unknown>;
  activeDefenses: Record<string, unknown>;
  monitoringConfig: Record<string, unknown>;
  alertThresholds: Record<string, unknown>;
  currentThreatLevel: string;
  lastThreatAssessmentAt?: Date;
  postureEffectiveness: number;
  isActive: boolean;
}

export interface CounterOperation {
  id: string;
  operationName: string;
  targetThreatId?: string;
  operationType: 'neutralize' | 'deceive' | 'redirect' | 'expose';
  objective: string;
  tactics: Record<string, unknown>;
  resourcesAllocated: Record<string, unknown>;
  currentPhase: string;
  phaseProgress: number;
  successMetrics: Record<string, unknown>;
  outcome?: string;
  outcomeDetails: Record<string, unknown>;
  isActive: boolean;
}

export function useCounterIntelligence(profileId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const threatActorsQuery = useQuery({
    queryKey: ['threat-actors'],
    queryFn: async (): Promise<ThreatActor[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('threat_actors')
        .select('*')
        .eq('user_id', user.id)
        .order('threat_level', { ascending: false });

      if (error) throw error;

      return (data || []).map(t => ({
        id: t.id,
        actorName: t.actor_name,
        actorType: t.actor_type as ThreatActor['actorType'],
        profileId: t.profile_id,
        threatLevel: t.threat_level as ThreatActor['threatLevel'],
        capabilities: t.capabilities as Record<string, unknown>,
        knownTactics: t.known_tactics || [],
        attributedActions: t.attributed_actions as Record<string, unknown>,
        indicatorsOfCompromise: t.indicators_of_compromise as Record<string, unknown>,
        networkAffiliations: t.network_affiliations || [],
        activityPattern: t.activity_pattern as Record<string, unknown>,
        lastActivityAt: t.last_activity_at ? new Date(t.last_activity_at) : undefined,
        status: t.status as ThreatActor['status'],
      }));
    },
    enabled: !!user?.id,
  });

  const detectionsQuery = useQuery({
    queryKey: ['manipulation-detections', profileId],
    queryFn: async (): Promise<ManipulationDetection[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('manipulation_detections')
        .select('*')
        .eq('user_id', user.id)
        .order('detected_at', { ascending: false });

      if (profileId) {
        query = query.eq('detected_in_profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(d => ({
        id: d.id,
        detectedInProfileId: d.detected_in_profile_id,
        sourceActorId: d.source_actor_id,
        manipulationType: d.manipulation_type,
        detectionConfidence: Number(d.detection_confidence) || 0,
        evidence: d.evidence as Record<string, unknown>,
        affectedDomains: d.affected_domains || [],
        severity: d.severity as ManipulationDetection['severity'],
        timeline: d.timeline as Record<string, unknown>,
        counterMeasures: d.counter_measures as Record<string, unknown>,
        isOngoing: d.is_ongoing || false,
        detectedAt: new Date(d.detected_at),
        resolvedAt: d.resolved_at ? new Date(d.resolved_at) : undefined,
      }));
    },
    enabled: !!user?.id,
  });

  const posturesQuery = useQuery({
    queryKey: ['defensive-postures', profileId],
    queryFn: async (): Promise<DefensivePosture[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('defensive_postures')
        .select('*')
        .eq('user_id', user.id);

      if (profileId) {
        query = query.eq('profile_id', profileId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(p => ({
        id: p.id,
        profileId: p.profile_id,
        postureType: p.posture_type as DefensivePosture['postureType'],
        threatModel: p.threat_model as Record<string, unknown>,
        activeDefenses: p.active_defenses as Record<string, unknown>,
        monitoringConfig: p.monitoring_config as Record<string, unknown>,
        alertThresholds: p.alert_thresholds as Record<string, unknown>,
        currentThreatLevel: p.current_threat_level || 'low',
        lastThreatAssessmentAt: p.last_threat_assessment_at ? new Date(p.last_threat_assessment_at) : undefined,
        postureEffectiveness: Number(p.posture_effectiveness) || 0,
        isActive: p.is_active || false,
      }));
    },
    enabled: !!user?.id,
  });

  const counterOpsQuery = useQuery({
    queryKey: ['counter-operations'],
    queryFn: async (): Promise<CounterOperation[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('counter_operations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(o => ({
        id: o.id,
        operationName: o.operation_name,
        targetThreatId: o.target_threat_id,
        operationType: o.operation_type as CounterOperation['operationType'],
        objective: o.objective,
        tactics: o.tactics as Record<string, unknown>,
        resourcesAllocated: o.resources_allocated as Record<string, unknown>,
        currentPhase: o.current_phase || 'planning',
        phaseProgress: Number(o.phase_progress) || 0,
        successMetrics: o.success_metrics as Record<string, unknown>,
        outcome: o.outcome,
        outcomeDetails: o.outcome_details as Record<string, unknown>,
        isActive: o.is_active || false,
      }));
    },
    enabled: !!user?.id,
  });

  const registerThreatMutation = useMutation({
    mutationFn: async (threat: Omit<ThreatActor, 'id' | 'lastActivityAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('threat_actors')
        .insert({
          user_id: user.id,
          actor_name: threat.actorName,
          actor_type: threat.actorType,
          profile_id: threat.profileId,
          threat_level: threat.threatLevel,
          capabilities: threat.capabilities,
          known_tactics: threat.knownTactics,
          attributed_actions: threat.attributedActions,
          indicators_of_compromise: threat.indicatorsOfCompromise,
          network_affiliations: threat.networkAffiliations,
          activity_pattern: threat.activityPattern,
          status: threat.status,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threat-actors'] });
    },
  });

  const reportManipulationMutation = useMutation({
    mutationFn: async (detection: Omit<ManipulationDetection, 'id' | 'detectedAt' | 'resolvedAt'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('manipulation_detections')
        .insert({
          user_id: user.id,
          detected_in_profile_id: detection.detectedInProfileId,
          source_actor_id: detection.sourceActorId,
          manipulation_type: detection.manipulationType,
          detection_confidence: detection.detectionConfidence,
          evidence: detection.evidence,
          affected_domains: detection.affectedDomains,
          severity: detection.severity,
          timeline: detection.timeline,
          counter_measures: detection.counterMeasures,
          is_ongoing: detection.isOngoing,
        } as never);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manipulation-detections'] });
    },
  });

  // Computed metrics
  const criticalThreats = threatActorsQuery.data?.filter(t => t.threatLevel === 'critical') || [];
  const activeDetections = detectionsQuery.data?.filter(d => d.isOngoing) || [];
  const overallThreatLevel = criticalThreats.length > 0 ? 'critical' 
    : activeDetections.length > 3 ? 'high'
    : activeDetections.length > 0 ? 'medium'
    : 'low';

  return {
    threatActors: threatActorsQuery.data || [],
    detections: detectionsQuery.data || [],
    postures: posturesQuery.data || [],
    counterOperations: counterOpsQuery.data || [],
    isLoading: threatActorsQuery.isLoading || detectionsQuery.isLoading,
    error: threatActorsQuery.error || detectionsQuery.error,

    // Computed
    criticalThreats,
    activeDetections,
    overallThreatLevel,

    // Actions
    registerThreat: registerThreatMutation.mutateAsync,
    reportManipulation: reportManipulationMutation.mutateAsync,
  };
}
