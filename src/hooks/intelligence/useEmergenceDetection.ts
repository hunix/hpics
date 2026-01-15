import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface EmergencePattern {
  id: string;
  patternName: string;
  patternType: string;
  sourceDomains: string[];
  patternSignature: Record<string, unknown>;
  detectionConfidence: number | null;
  noveltyScore: number | null;
  strategicValue: number | null;
  exploitationStrategies: unknown[];
  firstDetectedAt: string;
  occurrenceCount: number;
  lastObservedAt: string;
  isValidated: boolean;
}

export interface ConvergenceEvent {
  id: string;
  profileId: string | null;
  eventName: string;
  convergingPhases: string[];
  convergenceType: string;
  triggerConditions: Record<string, unknown>;
  synergyMultiplier: number;
  opportunityWindow: Record<string, unknown> | null;
  recommendedActions: unknown[];
  detectedAt: string;
  expiresAt: string | null;
  status: string;
  outcome: Record<string, unknown> | null;
}

export function useEmergenceDetection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const patternsQuery = useQuery({
    queryKey: ['emergence-patterns', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergence_patterns')
        .select('*')
        .order('strategic_value', { ascending: false, nullsFirst: false });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        patternName: row.pattern_name,
        patternType: row.pattern_type,
        sourceDomains: row.source_domains || [],
        patternSignature: row.pattern_signature as Record<string, unknown>,
        detectionConfidence: row.detection_confidence ? Number(row.detection_confidence) : null,
        noveltyScore: row.novelty_score ? Number(row.novelty_score) : null,
        strategicValue: row.strategic_value ? Number(row.strategic_value) : null,
        exploitationStrategies: row.exploitation_strategies as unknown[] || [],
        firstDetectedAt: row.first_detected_at,
        occurrenceCount: row.occurrence_count || 1,
        lastObservedAt: row.last_observed_at,
        isValidated: row.is_validated ?? false,
      })) as EmergencePattern[];
    },
    enabled: !!user,
  });

  const convergenceQuery = useQuery({
    queryKey: ['convergence-events', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('convergence_events')
        .select('*')
        .eq('status', 'active')
        .order('synergy_multiplier', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(row => ({
        id: row.id,
        profileId: row.profile_id,
        eventName: row.event_name,
        convergingPhases: row.converging_phases || [],
        convergenceType: row.convergence_type,
        triggerConditions: row.trigger_conditions as Record<string, unknown>,
        synergyMultiplier: row.synergy_multiplier ? Number(row.synergy_multiplier) : 1,
        opportunityWindow: row.opportunity_window as Record<string, unknown> | null,
        recommendedActions: row.recommended_actions as unknown[] || [],
        detectedAt: row.detected_at,
        expiresAt: row.expires_at,
        status: row.status || 'active',
        outcome: row.outcome as Record<string, unknown> | null,
      })) as ConvergenceEvent[];
    },
    enabled: !!user,
  });

  const validatePattern = useMutation({
    mutationFn: async (patternId: string) => {
      const { data, error } = await supabase
        .from('emergence_patterns')
        .update({ is_validated: true } as never)
        .eq('id', patternId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergence-patterns'] });
      toast.success('Pattern validated');
    },
  });

  const highValuePatterns = (patternsQuery.data || []).filter(
    p => (p.strategicValue || 0) > 0.7
  );

  return {
    patterns: patternsQuery.data || [],
    highValuePatterns,
    convergenceEvents: convergenceQuery.data || [],
    isLoading: patternsQuery.isLoading || convergenceQuery.isLoading,
    validatePattern,
  };
}
