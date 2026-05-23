/**
 * Network Intelligence Hook (v9.0)
 * 
 * React hooks for TAS-Com community detection and influence analysis.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface NetworkIntelligenceResult {
  id: string;
  networkSnapshotId: string;
  communityDetection: CommunityResult;
  influenceNodes: string[];
  cascadePredictions: Record<string, unknown>;
  propagandaIndicators: Record<string, unknown>;
  createdAt: string;
}

export interface CommunityResult {
  communities: Community[];
  modularity: number;
  coverageScore: number;
  algorithm: string;
}

export interface Community {
  id: string;
  members: string[];
  cohesionScore: number;
  centroids: string[];
  dominantAttributes: string[];
  covertIndicators: number;
}

export interface InfluenceNode {
  profileId: string;
  influenceScore: number;
  reachEstimate: number;
  exploitationPotential: number;
}

export function useNetworkIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: networkIntel, isLoading: intelLoading } = useQuery({
    queryKey: ['network-intelligence'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_intelligence')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        networkSnapshotId: (row.network_snapshot_id || '') as string,
        communityDetection: (row.community_detection || { communities: [], modularity: 0, coverageScore: 0, algorithm: 'TAS-Com' }) as CommunityResult,
        influenceNodes: (row.influence_nodes || []) as string[],
        cascadePredictions: (row.cascade_predictions || {}) as Record<string, unknown>,
        propagandaIndicators: (row.propaganda_indicators || {}) as Record<string, unknown>,
        createdAt: row.created_at as string
      })) as NetworkIntelligenceResult[];
    },
    enabled: !!user,
  });

  const detectCommunities = useMutation({
    mutationFn: async (input: {
      networkId: string;
      algorithm?: 'TAS-Com' | 'Leiden' | 'Louvain';
      minCommunitySize?: number;
    }) => {
      const { data, error } = await invokeFunction('tas-com-detector', {
          userId: user!.id,
          networkId: input.networkId,
          algorithm: input.algorithm || 'TAS-Com',
          minCommunitySize: input.minCommunitySize || 3
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-intelligence'] });
    }
  });

  const identifyInfluencers = useMutation({
    mutationFn: async (input: {
      networkId: string;
      topK?: number;
      method?: 'bandit' | 'centrality' | 'pagerank';
    }) => {
      const { data, error } = await invokeFunction('influence-max-bandit', {
          userId: user!.id,
          networkId: input.networkId,
          topK: input.topK || 10,
          method: input.method || 'bandit'
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-intelligence'] });
    }
  });

  const detectPropaganda = useMutation({
    mutationFn: async (input: { cascadeId: string }) => {
      const { data, error } = await invokeFunction('propaganda-analyzer', {
          userId: user!.id,
          cascadeId: input.cascadeId
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-intelligence'] });
    }
  });

  const allCommunities = networkIntel?.flatMap(n => n.communityDetection.communities) || [];
  const covertCommunities = allCommunities.filter(c => c.covertIndicators > 0.5);
  const topInfluencers = networkIntel?.flatMap(n => n.influenceNodes).slice(0, 20) || [];

  return {
    networkIntel,
    allCommunities,
    covertCommunities,
    topInfluencers,
    isLoading: intelLoading,
    detectCommunities: detectCommunities.mutateAsync,
    identifyInfluencers: identifyInfluencers.mutateAsync,
    detectPropaganda: detectPropaganda.mutateAsync,
    isDetectingCommunities: detectCommunities.isPending,
    isIdentifyingInfluencers: identifyInfluencers.isPending
  };
}
