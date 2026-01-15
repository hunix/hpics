import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface InfiniteAwareness {
  id: string;
  awarenessType: string;
  perceptionRange: Record<string, unknown>;
  dimensionalCoverage: Array<{ dimension: string; coverage: number }>;
  temporalRange: { past: number; future: number };
  signalSources: Array<{ source: string; strength: number }>;
  blindSpotElimination: Array<{ spot: string; eliminated: boolean }>;
  awarenessScore: number;
  penetrationDepth: number;
  lastExpansionAt: string;
}

export interface OmnipresentControl {
  id: string;
  controlDomain: string;
  controlVectors: Array<{ vector: string; strength: number }>;
  influenceReach: Record<string, number>;
  simultaneousOperations: number;
  controlStrength: number;
  resistancePoints: Array<{ point: string; resistance: number }>;
  amplificationNodes: Array<{ node: string; factor: number }>;
  feedbackIntegration: Record<string, unknown>;
  isActive: boolean;
}

export function useInfiniteAwareness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: awarenessData = [], isLoading: awarenessLoading } = useQuery({
    queryKey: ['infinite-awareness', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('infinite_awareness')
        .select('*')
        .eq('user_id', user?.id)
        .order('awareness_score', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        awarenessType: row.awareness_type,
        perceptionRange: row.perception_range as Record<string, unknown>,
        dimensionalCoverage: row.dimensional_coverage as InfiniteAwareness['dimensionalCoverage'],
        temporalRange: row.temporal_range as InfiniteAwareness['temporalRange'],
        signalSources: row.signal_sources as InfiniteAwareness['signalSources'],
        blindSpotElimination: row.blind_spot_elimination as InfiniteAwareness['blindSpotElimination'],
        awarenessScore: Number(row.awareness_score),
        penetrationDepth: row.penetration_depth,
        lastExpansionAt: row.last_expansion_at
      })) as InfiniteAwareness[];
    },
    enabled: !!user?.id
  });

  const { data: controlData = [], isLoading: controlLoading } = useQuery({
    queryKey: ['omnipresent-control', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('omnipresent_control')
        .select('*')
        .eq('user_id', user?.id)
        .order('control_strength', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        controlDomain: row.control_domain,
        controlVectors: row.control_vectors as OmnipresentControl['controlVectors'],
        influenceReach: row.influence_reach as Record<string, number>,
        simultaneousOperations: row.simultaneous_operations,
        controlStrength: Number(row.control_strength),
        resistancePoints: row.resistance_points as OmnipresentControl['resistancePoints'],
        amplificationNodes: row.amplification_nodes as OmnipresentControl['amplificationNodes'],
        feedbackIntegration: row.feedback_integration as Record<string, unknown>,
        isActive: row.is_active
      })) as OmnipresentControl[];
    },
    enabled: !!user?.id
  });

  const createAwarenessMutation = useMutation({
    mutationFn: async (awareness: Partial<InfiniteAwareness>) => {
      const { data, error } = await supabase
        .from('infinite_awareness')
        .insert({
          user_id: user?.id,
          awareness_type: awareness.awarenessType,
          perception_range: awareness.perceptionRange,
          dimensional_coverage: awareness.dimensionalCoverage,
          temporal_range: awareness.temporalRange,
          signal_sources: awareness.signalSources,
          awareness_score: awareness.awarenessScore,
          penetration_depth: awareness.penetrationDepth
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['infinite-awareness'] })
  });

  const createControlMutation = useMutation({
    mutationFn: async (control: Partial<OmnipresentControl>) => {
      const { data, error } = await supabase
        .from('omnipresent_control')
        .insert({
          user_id: user?.id,
          control_domain: control.controlDomain,
          control_vectors: control.controlVectors,
          influence_reach: control.influenceReach,
          simultaneous_operations: control.simultaneousOperations,
          control_strength: control.controlStrength,
          resistance_points: control.resistancePoints,
          amplification_nodes: control.amplificationNodes
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['omnipresent-control'] })
  });

  return {
    awarenessData,
    controlData,
    isLoading: awarenessLoading || controlLoading,
    createAwareness: createAwarenessMutation.mutateAsync,
    createControl: createControlMutation.mutateAsync,
    avgAwarenessScore: awarenessData.reduce((s, a) => s + a.awarenessScore, 0) / Math.max(awarenessData.length, 1),
    totalPenetration: awarenessData.reduce((s, a) => s + a.penetrationDepth, 0),
    activeControls: controlData.filter(c => c.isActive).length,
    avgControlStrength: controlData.reduce((s, c) => s + c.controlStrength, 0) / Math.max(controlData.length, 1)
  };
}
