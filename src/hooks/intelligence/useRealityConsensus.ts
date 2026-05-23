import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface ConsensusBubble { id: string; userId: string; bubbleName: string; bubbleType: string; memberCount: number; consensusStrength: number; coreBeliefs: string[]; boundaryPermeability: number; manipulationVectors: Record<string, unknown>[]; createdAt: string | null; }
export interface RealityAnchor { id: string; userId: string; profileId?: string; anchorType: string; anchorStrength: number; anchorDescription: string; stabilityIndex: number; disruptionVulnerabilities: string[]; createdAt: string | null; }
export interface RealityInjectionProtocol { id: string; userId: string; targetBubbleId?: string; injectionType: string; injectionContent: Record<string, unknown>; successProbability: number; requiredResources: string[]; expectedOutcome: string; createdAt: string | null; }

export function useRealityConsensus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bubbles, isLoading: bubblesLoading } = useQuery({
    queryKey: ['consensus-bubbles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('consensus_bubbles').select('*').eq('user_id', user!.id).order('internal_coherence', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string, userId: row.user_id as string, bubbleName: (row.bubble_name || '') as string,
        bubbleType: '' as string, memberCount: ((row.member_profiles as string[])?.length || 0) as number,
        consensusStrength: (row.internal_coherence || 0) as number, coreBeliefs: [] as string[],
        boundaryPermeability: (row.boundary_permeability || 0) as number, manipulationVectors: [] as Record<string, unknown>[],
        createdAt: row.created_at as string
      })) as ConsensusBubble[];
    },
    enabled: !!user,
  });

  const { data: anchors, isLoading: anchorsLoading } = useQuery({
    queryKey: ['reality-anchors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reality_anchors').select('*').eq('user_id', user!.id).order('anchor_strength', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string, userId: row.user_id as string, profileId: '' as string,
        anchorType: (row.anchor_belief || '') as string, anchorStrength: (row.anchor_strength || 0) as number,
        anchorDescription: (row.anchor_belief || '') as string, stabilityIndex: (row.removal_difficulty || 0) as number,
        disruptionVulnerabilities: [] as string[], createdAt: row.created_at as string
      })) as RealityAnchor[];
    },
    enabled: !!user,
  });

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ['reality-injection-protocols', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('reality_injection_protocols').select('*').eq('user_id', user!.id).order('success_probability', { ascending: false });
      if (error) throw error;
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string, userId: row.user_id as string, targetBubbleId: row.target_bubble_id as string,
        injectionType: (row.injection_method || '') as string, injectionContent: {} as Record<string, unknown>,
        successProbability: (row.success_probability || 0) as number, requiredResources: [] as string[],
        expectedOutcome: (row.injection_belief || '') as string, createdAt: row.created_at as string
      })) as RealityInjectionProtocol[];
    },
    enabled: !!user,
  });

  const analyzeConsensus = useMutation({
    mutationFn: async (input: { action?: 'map' | 'analyze_anchors' | 'generate_protocols'; targetPopulation?: string }) => {
      const { data, error } = await invokeFunction('reality-consensus-engine', { userId: user!.id, action: input.action || 'map', targetPopulation: input.targetPopulation || 'network' });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consensus-bubbles'] }); queryClient.invalidateQueries({ queryKey: ['reality-anchors'] }); queryClient.invalidateQueries({ queryKey: ['reality-injection-protocols'] }); }
  });

  return { bubbles, anchors, protocols, isLoading: bubblesLoading || anchorsLoading || protocolsLoading, analyzeConsensus: analyzeConsensus.mutateAsync, isAnalyzing: analyzeConsensus.isPending, permeableBubbles: bubbles?.filter(b => b.boundaryPermeability > 0.6) || [], strongAnchors: anchors?.filter(a => a.anchorStrength > 0.7) || [], viableProtocols: protocols?.filter(p => p.successProbability > 0.6) || [] };
}
