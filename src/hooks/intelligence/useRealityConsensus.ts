import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ConsensusBubble {
  id: string;
  userId: string;
  bubbleName: string;
  bubbleType: string;
  memberCount: number;
  consensusStrength: number;
  coreBeliefs: string[];
  boundaryPermeability: number;
  manipulationVectors: Record<string, unknown>[];
  createdAt: string;
}

export interface RealityAnchor {
  id: string;
  userId: string;
  profileId?: string;
  anchorType: string;
  anchorStrength: number;
  anchorDescription: string;
  stabilityIndex: number;
  disruptionVulnerabilities: string[];
  createdAt: string;
}

export interface RealityInjectionProtocol {
  id: string;
  userId: string;
  targetBubbleId?: string;
  injectionType: string;
  injectionContent: Record<string, unknown>;
  successProbability: number;
  requiredResources: string[];
  expectedOutcome: string;
  createdAt: string;
}

export function useRealityConsensus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: bubbles, isLoading: bubblesLoading } = useQuery({
    queryKey: ['consensus-bubbles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consensus_bubbles')
        .select('*')
        .eq('user_id', user!.id)
        .order('consensus_strength', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        bubbleName: row.bubble_name,
        bubbleType: row.bubble_type,
        memberCount: row.member_count || 0,
        consensusStrength: row.consensus_strength || 0,
        coreBeliefs: row.core_beliefs || [],
        boundaryPermeability: row.boundary_permeability || 0,
        manipulationVectors: row.manipulation_vectors as Record<string, unknown>[] || [],
        createdAt: row.created_at
      })) as ConsensusBubble[];
    },
    enabled: !!user,
  });

  const { data: anchors, isLoading: anchorsLoading } = useQuery({
    queryKey: ['reality-anchors', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reality_anchors')
        .select('*')
        .eq('user_id', user!.id)
        .order('anchor_strength', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        profileId: row.profile_id,
        anchorType: row.anchor_type,
        anchorStrength: row.anchor_strength || 0,
        anchorDescription: row.anchor_description || '',
        stabilityIndex: row.stability_index || 0,
        disruptionVulnerabilities: row.disruption_vulnerabilities || [],
        createdAt: row.created_at
      })) as RealityAnchor[];
    },
    enabled: !!user,
  });

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ['reality-injection-protocols', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reality_injection_protocols')
        .select('*')
        .eq('user_id', user!.id)
        .order('success_probability', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        targetBubbleId: row.target_bubble_id,
        injectionType: row.injection_type,
        injectionContent: row.injection_content as Record<string, unknown> || {},
        successProbability: row.success_probability || 0,
        requiredResources: row.required_resources || [],
        expectedOutcome: row.expected_outcome || '',
        createdAt: row.created_at
      })) as RealityInjectionProtocol[];
    },
    enabled: !!user,
  });

  const analyzeConsensus = useMutation({
    mutationFn: async (input: { action?: 'map' | 'analyze_anchors' | 'generate_protocols'; targetPopulation?: string }) => {
      const { data, error } = await supabase.functions.invoke('reality-consensus-engine', {
        body: {
          userId: user!.id,
          action: input.action || 'map',
          targetPopulation: input.targetPopulation || 'network'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consensus-bubbles'] });
      queryClient.invalidateQueries({ queryKey: ['reality-anchors'] });
      queryClient.invalidateQueries({ queryKey: ['reality-injection-protocols'] });
    }
  });

  return {
    bubbles,
    anchors,
    protocols,
    isLoading: bubblesLoading || anchorsLoading || protocolsLoading,
    analyzeConsensus: analyzeConsensus.mutateAsync,
    isAnalyzing: analyzeConsensus.isPending,
    permeableBubbles: bubbles?.filter(b => b.boundaryPermeability > 0.6) || [],
    strongAnchors: anchors?.filter(a => a.anchorStrength > 0.7) || [],
    viableProtocols: protocols?.filter(p => p.successProbability > 0.6) || []
  };
}
