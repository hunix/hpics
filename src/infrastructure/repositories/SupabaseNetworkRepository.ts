/**
 * Supabase Network Repository Implementation
 * 
 * Implements INetworkRepository using Supabase as the data store.
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  INetworkRepository, 
  NetworkNode, 
  NetworkEdge, 
  NetworkSnapshotData,
  NetworkQueryOptions 
} from '@/domains/network/repositories/INetworkRepository';

export class SupabaseNetworkRepository implements INetworkRepository {
  
  async findConnectedNodes(
    userId: string,
    profileId: string,
    options?: NetworkQueryOptions
  ): Promise<NetworkNode[]> {
    const { data, error } = await supabase
      .from('contact_relationships')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);

    if (error) throw error;

    return (data || []).map(row => this.mapToNetworkNode(row));
  }

  async findEdgesForProfile(
    userId: string,
    profileId: string,
    options?: NetworkQueryOptions
  ): Promise<NetworkEdge[]> {
    let query = supabase
      .from('contact_relationships')
      .select('*')
      .eq('user_id', userId)
      .or(`profile_id.eq.${profileId},related_profile_id.eq.${profileId}`);

    if (options?.minStrength) {
      query = query.gte('strength', options.minStrength);
    }

    if (options?.relationshipTypes?.length) {
      query = query.in('relationship_type', options.relationshipTypes);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(row => this.mapToNetworkEdge(row));
  }

  async getNetworkGraph(
    userId: string,
    options?: NetworkQueryOptions
  ): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }> {
    // Get all profiles as nodes
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, relationship_type, created_at, updated_at')
      .eq('user_id', userId);

    if (profilesError) throw profilesError;

    // Get all relationships as edges
    let edgesQuery = supabase
      .from('contact_relationships')
      .select('*')
      .eq('user_id', userId);

    if (options?.minStrength) {
      edgesQuery = edgesQuery.gte('strength', options.minStrength);
    }

    const { data: relationships, error: relError } = await edgesQuery;
    if (relError) throw relError;

    const nodes: NetworkNode[] = (profiles || []).map(p => ({
      id: p.id,
      profileId: p.id,
      label: p.full_name || 'Unknown',
      type: 'profile' as const,
      metadata: { relationshipType: p.relationship_type },
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at)
    }));

    const edges: NetworkEdge[] = (relationships || []).map(row => this.mapToNetworkEdge(row));

    return { nodes, edges };
  }

  async saveSnapshot(userId: string, snapshot: NetworkSnapshotData): Promise<string> {
    const { data, error } = await supabase
      .from('network_snapshots')
      .insert({
        user_id: userId,
        snapshot_date: snapshot.capturedAt.toISOString(),
        snapshot_type: 'manual',
        graph_data: {
          nodes: snapshot.nodes,
          edges: snapshot.edges
        },
        metrics: snapshot.metrics
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getLatestSnapshot(userId: string): Promise<NetworkSnapshotData | null> {
    const { data, error } = await supabase
      .from('network_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const graphData = data.graph_data as {
      nodes?: NetworkNode[];
      edges?: NetworkEdge[];
    } | null;

    const metricsData = data.metrics as {
      density?: number;
      clusteringCoefficient?: number;
      averagePathLength?: number;
    } | null;

    return {
      nodes: graphData?.nodes || [],
      edges: graphData?.edges || [],
      metrics: {
        density: metricsData?.density || 0,
        clusteringCoefficient: metricsData?.clusteringCoefficient || 0,
        averagePathLength: metricsData?.averagePathLength || 0
      },
      capturedAt: new Date(data.snapshot_date)
    };
  }

  async calculateMetrics(userId: string): Promise<NetworkSnapshotData['metrics']> {
    const { nodes, edges } = await this.getNetworkGraph(userId);
    
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    // Calculate density: 2 * edges / (nodes * (nodes - 1))
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

    return {
      density,
      clusteringCoefficient: 0, // Simplified - would need full graph analysis
      averagePathLength: 0 // Simplified - would need BFS/DFS
    };
  }

  async findShortestPath(
    userId: string,
    sourceProfileId: string,
    targetProfileId: string
  ): Promise<NetworkNode[]> {
    // Simplified BFS implementation
    const { nodes, edges } = await this.getNetworkGraph(userId);
    
    const adjacencyList = new Map<string, string[]>();
    edges.forEach(edge => {
      if (!adjacencyList.has(edge.sourceId)) adjacencyList.set(edge.sourceId, []);
      if (!adjacencyList.has(edge.targetId)) adjacencyList.set(edge.targetId, []);
      adjacencyList.get(edge.sourceId)!.push(edge.targetId);
      adjacencyList.get(edge.targetId)!.push(edge.sourceId);
    });

    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: sourceProfileId, path: [sourceProfileId] }];
    
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      
      if (nodeId === targetProfileId) {
        return path.map(id => nodes.find(n => n.id === id)!).filter(Boolean);
      }
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ nodeId: neighbor, path: [...path, neighbor] });
        }
      }
    }
    
    return []; // No path found
  }

  async getInfluenceScores(
    userId: string,
    profileIds: string[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    // Calculate influence based on connection count and strength
    for (const profileId of profileIds) {
      const edges = await this.findEdgesForProfile(userId, profileId);
      const totalStrength = edges.reduce((sum, e) => sum + e.strength, 0);
      const connectionCount = edges.length;
      
      // Simple influence score: connections * average strength
      const avgStrength = connectionCount > 0 ? totalStrength / connectionCount : 0;
      scores.set(profileId, connectionCount * avgStrength);
    }
    
    return scores;
  }

  private mapToNetworkNode(row: Record<string, unknown>): NetworkNode {
    return {
      id: row.id as string,
      profileId: row.related_profile_id as string,
      label: 'Connection',
      type: 'profile',
      metadata: {
        relationshipType: row.relationship_type,
        strength: row.strength
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }

  private mapToNetworkEdge(row: Record<string, unknown>): NetworkEdge {
    return {
      id: row.id as string,
      sourceId: row.profile_id as string,
      targetId: row.related_profile_id as string,
      relationshipType: (row.relationship_type as string) || 'connected',
      strength: (row.strength as number) || 50,
      metadata: {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }
}
