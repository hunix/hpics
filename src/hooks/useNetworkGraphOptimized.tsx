import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface NetworkNode {
  id: string;
  name: string;
  avatar_url: string | null;
  relationship_type: string | null;
  is_favorite: boolean;
}

export interface NetworkLink {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  links: NetworkLink[];
  totalNodes: number;
  sampled: boolean;
}

type SamplingStrategy = 'most_connected' | 'favorites' | 'recent';

interface UseNetworkGraphOptions {
  maxNodes?: number;
  strategy?: SamplingStrategy;
  enabled?: boolean;
}

export function useNetworkGraphOptimized({
  maxNodes = 500,
  strategy = 'most_connected',
  enabled = true,
}: UseNetworkGraphOptions = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['network-graph-optimized', user?.id, maxNodes, strategy],
    queryFn: async (): Promise<NetworkGraphData> => {
      if (!user?.id) throw new Error('No user');

      // Get total count first
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalNodes = count || 0;
      const needsSampling = totalNodes > maxNodes;

      // Build query based on strategy
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, relationship_type, is_favorite, created_at, updated_at')
        .eq('user_id', user.id);

      if (needsSampling) {
        switch (strategy) {
          case 'favorites':
            query = query.order('is_favorite', { ascending: false }).order('created_at', { ascending: false });
            break;
          case 'recent':
            query = query.order('updated_at', { ascending: false });
            break;
          case 'most_connected':
          default:
            // For most_connected, we'll fetch favorites first, then recent
            query = query.order('is_favorite', { ascending: false }).order('updated_at', { ascending: false });
            break;
        }
        query = query.limit(maxNodes);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      const profileIds = (profiles || []).map(p => p.id);
      
      const nodes: NetworkNode[] = (profiles || []).map(p => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name || ''}`.trim() || 'Unknown',
        avatar_url: p.avatar_url,
        relationship_type: p.relationship_type,
        is_favorite: p.is_favorite || false,
      }));

      // Fetch relationships between the selected profiles
      let links: NetworkLink[] = [];
      if (profileIds.length > 0) {
        const { data: relationships } = await supabase
          .from('contact_relationships')
          .select('from_profile_id, to_profile_id, relationship_type')
          .eq('user_id', user.id)
          .in('from_profile_id', profileIds)
          .in('to_profile_id', profileIds);

        links = (relationships || []).map(r => ({
          source: r.from_profile_id,
          target: r.to_profile_id,
          type: r.relationship_type || 'connected',
          strength: 1, // Default strength since column doesn't exist
        }));
      }

      return {
        nodes,
        links,
        totalNodes,
        sampled: needsSampling,
      };
    },
    enabled: enabled && !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Hook to refresh storage stats materialized view
export function useRefreshStorageStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['refresh-storage-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // This triggers a refresh of the materialized view
      // The function exists in the database
      try {
        await supabase.rpc('refresh_contact_storage_stats' as any);
        return true;
      } catch (error) {
        console.error('Failed to refresh storage stats:', error);
        return false;
      }
    },
    enabled: false, // Only run when explicitly called
  });
}
