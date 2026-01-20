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

type DbRow = Record<string, unknown>;

export class SupabaseNetworkRepository implements INetworkRepository {
  
  async findConnectedNodes(
    userId: string,
    profileId: string,
    _options?: NetworkQueryOptions
  ): Promise<NetworkNode[]> {
    const { data, error } = await supabase
      .from('contact_relationships')
      .select('id, from_profile_id, to_profile_id, relationship_type, created_at, updated_at')
      .eq('user_id', userId)
      .eq('from_profile_id', profileId);

    if (error) throw error;

    return ((data || []) as unknown as DbRow[]).map(row => this.mapToNetworkNode(row));
  }

  async findEdgesForProfile(
    userId: string,
    profileId: string,
    _options?: NetworkQueryOptions
  ): Promise<NetworkEdge[]> {
    const { data, error } = await supabase
      .from('contact_relationships')
      .select('id, from_profile_id, to_profile_id, relationship_type, created_at, updated_at')
      .eq('user_id', userId)
      .or(`from_profile_id.eq.${profileId},to_profile_id.eq.${profileId}`);

    if (error) throw error;

    return ((data || []) as unknown as DbRow[]).map(row => this.mapToNetworkEdge(row));
  }

  async getNetworkGraph(
    userId: string,
    _options?: NetworkQueryOptions
  ): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }> {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_type, created_at, updated_at')
      .eq('user_id', userId);

    if (profilesError) throw profilesError;

    const { data: relationships, error: relError } = await supabase
      .from('contact_relationships')
      .select('id, from_profile_id, to_profile_id, relationship_type, created_at, updated_at')
      .eq('user_id', userId);

    if (relError) throw relError;

    const nodes: NetworkNode[] = ((profiles || []) as unknown as DbRow[]).map(p => ({
      id: p.id as string,
      profileId: p.id as string,
      label: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
      type: 'profile' as const,
      metadata: { relationshipType: p.relationship_type },
      createdAt: new Date(p.created_at as string),
      updatedAt: new Date(p.updated_at as string)
    }));

    const edges: NetworkEdge[] = ((relationships || []) as unknown as DbRow[]).map(row => this.mapToNetworkEdge(row));

    return { nodes, edges };
  }

  async saveSnapshot(userId: string, snapshot: NetworkSnapshotData): Promise<string> {
    const graphPayload = JSON.parse(JSON.stringify({
      nodes: snapshot.nodes,
      edges: snapshot.edges
    }));
    const metricsPayload = JSON.parse(JSON.stringify(snapshot.metrics));

    const { data, error } = await supabase
      .from('network_snapshots')
      .insert([{
        user_id: userId,
        snapshot_date: snapshot.capturedAt.toISOString(),
        snapshot_type: 'manual',
        graph_data: graphPayload,
        metrics: metricsPayload
      }])
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
    
    // Calculate density
    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxEdges > 0 ? edgeCount / maxEdges : 0;

    // Build adjacency list for calculations
    const adjacencyList = new Map<string, Set<string>>();
    nodes.forEach(n => adjacencyList.set(n.id, new Set()));
    edges.forEach(edge => {
      adjacencyList.get(edge.sourceId)?.add(edge.targetId);
      adjacencyList.get(edge.targetId)?.add(edge.sourceId);
    });

    // Calculate clustering coefficient (average local clustering)
    let totalClustering = 0;
    let nodesWithNeighbors = 0;
    
    for (const [nodeId, neighbors] of adjacencyList) {
      const k = neighbors.size;
      if (k < 2) continue;
      
      nodesWithNeighbors++;
      let triangles = 0;
      const neighborArray = Array.from(neighbors);
      
      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          if (adjacencyList.get(neighborArray[i])?.has(neighborArray[j])) {
            triangles++;
          }
        }
      }
      
      const possibleTriangles = (k * (k - 1)) / 2;
      totalClustering += triangles / possibleTriangles;
    }
    
    const clusteringCoefficient = nodesWithNeighbors > 0 
      ? totalClustering / nodesWithNeighbors 
      : 0;

    // Calculate average path length using BFS from each node
    let totalPathLength = 0;
    let pathCount = 0;
    
    for (const sourceNode of nodes) {
      const distances = this.bfsDistances(sourceNode.id, adjacencyList);
      for (const [, distance] of distances) {
        if (distance > 0 && distance < Infinity) {
          totalPathLength += distance;
          pathCount++;
        }
      }
    }
    
    const averagePathLength = pathCount > 0 ? totalPathLength / pathCount : 0;

    return {
      density,
      clusteringCoefficient,
      averagePathLength
    };
  }

  private bfsDistances(startId: string, adjacencyList: Map<string, Set<string>>): Map<string, number> {
    const distances = new Map<string, number>();
    const queue: { nodeId: string; distance: number }[] = [{ nodeId: startId, distance: 0 }];
    distances.set(startId, 0);
    
    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;
      const neighbors = adjacencyList.get(nodeId) || new Set();
      
      for (const neighbor of neighbors) {
        if (!distances.has(neighbor)) {
          distances.set(neighbor, distance + 1);
          queue.push({ nodeId: neighbor, distance: distance + 1 });
        }
      }
    }
    
    return distances;
  }

  async findShortestPath(
    userId: string,
    sourceProfileId: string,
    targetProfileId: string
  ): Promise<NetworkNode[]> {
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
    
    return [];
  }

  async getInfluenceScores(
    userId: string,
    profileIds: string[]
  ): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    for (const profileId of profileIds) {
      const edges = await this.findEdgesForProfile(userId, profileId);
      const totalStrength = edges.reduce((sum, e) => sum + e.strength, 0);
      const connectionCount = edges.length;
      const avgStrength = connectionCount > 0 ? totalStrength / connectionCount : 0;
      scores.set(profileId, connectionCount * avgStrength);
    }
    
    return scores;
  }

  private mapToNetworkNode(row: DbRow): NetworkNode {
    // Build label from available name fields, fallback to relationship type or ID
    const firstName = row.first_name as string | undefined;
    const lastName = row.last_name as string | undefined;
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const relationshipType = row.relationship_type as string | undefined;
    const profileId = (row.to_profile_id || row.id) as string;
    
    const label = fullName || relationshipType || `Contact ${profileId.slice(0, 8)}`;
    
    return {
      id: row.id as string,
      profileId: profileId,
      label,
      type: 'profile',
      metadata: {
        relationshipType: relationshipType,
        firstName,
        lastName
      },
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }

  private mapToNetworkEdge(row: DbRow): NetworkEdge {
    return {
      id: row.id as string,
      sourceId: row.from_profile_id as string,
      targetId: row.to_profile_id as string,
      relationshipType: (row.relationship_type as string) || 'connected',
      strength: 50, // Default strength since table doesn't have this column
      metadata: {},
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    };
  }
}
