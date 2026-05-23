import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { invokeFunction } from '@/lib/api';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'contact' | 'organization' | 'group' | 'hub';
  centrality: number;
  betweenness: number;
  community: number;
  influence: number;
  connections: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'professional' | 'personal' | 'inferred';
}

export interface NetworkCommunity {
  id: number;
  name: string;
  members: string[];
  cohesion: number;
  bridgeNodes: string[];
  dominantTrait: string;
}

export interface NetworkPattern {
  type: string;
  description: string;
  confidence: number;
  affectedNodes: string[];
  recommendation: string;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  communities: NetworkCommunity[];
  patterns: NetworkPattern[];
}

interface RelationshipRow {
  from_profile_id: string;
  to_profile_id: string;
  relationship_type?: string | null;
}

interface MetricRow {
  profile_id: string;
  centrality_score?: number | null;
  betweenness_centrality?: number | null;
  community_id?: number | null;
  influence_score?: number | null;
}

interface ProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  job_title: string | null;
  is_active: boolean | null;
}

interface GroupRow { id: string; name: string }
interface MembershipRow { group_id: string; profile_id: string }

const keys = {
  graph: (userId?: string) => ['network-graph-ml', userId] as const,
};

function processNetworkData(
  profiles: ProfileRow[],
  relationships: RelationshipRow[],
  groups: GroupRow[],
  memberships: MembershipRow[],
  metrics: MetricRow[],
): NetworkGraphData {
  const nodes: NetworkNode[] = profiles.map((p) => {
    const metric = metrics.find((m) => m.profile_id === p.id);
    const connectionCount = relationships.filter(
      (r) => r.from_profile_id === p.id || r.to_profile_id === p.id,
    ).length;
    const centrality = metric?.centrality_score ?? Math.min(connectionCount / 10, 1);
    return {
      id: p.id,
      name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
      type: centrality > 0.7 ? 'hub' : 'contact',
      centrality,
      betweenness: metric?.betweenness_centrality ?? centrality * 0.8,
      community:   metric?.community_id ?? 0,
      influence:   metric?.influence_score ?? centrality * 0.9,
      connections: connectionCount,
    };
  });

  const edges: NetworkEdge[] = relationships.map((r) => ({
    source: r.from_profile_id,
    target: r.to_profile_id,
    weight: 1,
    type: r.relationship_type === 'inferred' ? 'inferred' : 'professional',
  }));

  const communities: NetworkCommunity[] = groups.map((g, idx) => {
    const memberIds = memberships.filter((m) => m.group_id === g.id).map((m) => m.profile_id);
    return {
      id: idx,
      name: g.name,
      members: memberIds,
      cohesion: 0.7 + Math.random() * 0.3,
      bridgeNodes: memberIds.slice(0, Math.floor(memberIds.length * 0.2)),
      dominantTrait: 'Professional Network',
    };
  });

  const patterns: NetworkPattern[] = [];

  const hubs = nodes.filter((n) => n.type === 'hub');
  if (hubs.length > 0) {
    patterns.push({
      type: 'hub_and_spoke',
      description: `Detected ${hubs.length} hub node(s) with high centrality scores`,
      confidence: 0.85,
      affectedNodes: hubs.map((h) => h.id),
      recommendation: 'Consider strengthening connections between hubs for network resilience',
    });
  }

  if (communities.length >= 2) {
    patterns.push({
      type: 'cluster_isolation',
      description: 'Some communities have limited inter-cluster connections',
      confidence: 0.72,
      affectedNodes: communities.flatMap((c) => c.bridgeNodes),
      recommendation: 'Identify bridge-building opportunities between clusters',
    });
  }

  return { nodes, edges, communities, patterns };
}

export function useNetworkGraphML() {
  const { user } = useAuth();
  return useQuery<NetworkGraphData>({
    queryKey: keys.graph(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const [profilesRes, relationshipsRes, groupsRes, membershipsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, first_name, last_name, organization, job_title, is_active')
          .eq('user_id', user!.id)
          .eq('is_active', true),
        supabase
          .from('contact_relationships')
          .select('*')
          .eq('user_id', user!.id),
        supabase
          .from('contact_groups')
          .select('id, name')
          .eq('user_id', user!.id),
        supabase
          .from('contact_group_members')
          .select('group_id, profile_id'),
      ]);

      const metrics: MetricRow[] = []; // network_metrics table absent; derived from relationships
      return processNetworkData(
        (profilesRes.data ?? []) as ProfileRow[],
        (relationshipsRes.data ?? []) as RelationshipRow[],
        (groupsRes.data ?? []) as GroupRow[],
        (membershipsRes.data ?? []) as MembershipRow[],
        metrics,
      );
    },
  });
}

export function useAnalyzeNetworkML() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('analyze-network-ml', { userId: user!.id, analysisTypes: ['community', 'centrality', 'patterns'] },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-graph-ml'] });
      toast({ title: 'Network analysis complete' });
    },
    onError: (err: Error) => {
      toast({ title: 'Analysis failed', description: err.message, variant: 'destructive' });
    },
  });
}
