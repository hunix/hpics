/**
 * Network Domain Service
 * Orchestrates network analysis, influence calculation, and connection recommendations
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  NetworkGraph,
  NetworkNode,
  NetworkLink,
  NetworkAnalysis,
  CentralityMetrics,
  NetworkCluster,
} from '../entities/NetworkGraph';
import type { ConnectionRecommendation, SleepingConnection } from '../entities/Connection';
import type { InfluencePropagation } from '../entities/Influence';
import {
  NetworkAnalyzed,
  ClustersDetected,
  InfluencersIdentified,
  SleepingConnectionsDetected,
} from '../events/NetworkEvents';

// Import existing network algorithms
import {
  calculatePageRank,
  calculateClosenessCentrality,
  calculateBetweennessCentrality,
  calculateEigenvectorCentrality,
  detectClusters,
  detectStructuralHoles,
  calculateInfluencePropagation,
  recommendStrategicConnections,
  calculateNetworkDensity,
  buildAdjacencyList,
} from '@/lib/network';

export interface NetworkAnalysisRequest {
  userId: string;
  includeMetrics?: boolean;
  includeClusters?: boolean;
  includeInfluence?: boolean;
  maxNodes?: number;
}

export interface NetworkSummary {
  nodeCount: number;
  linkCount: number;
  clusterCount: number;
  density: number;
  topInfluencers: { id: string; name: string; score: number }[];
  bridgeConnectors: { id: string; name: string; score: number }[];
  needsAttention: { id: string; name: string; decayLevel: number }[];
}

export class NetworkService {
  private eventHandlers: ((event: unknown) => void)[] = [];

  // Subscribe to domain events
  onEvent(handler: (event: unknown) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  private emit(event: unknown): void {
    this.eventHandlers.forEach(handler => handler(event));
  }

  // Fetch network graph for a user
  async getNetworkGraph(userId: string, maxNodes?: number): Promise<NetworkGraph> {
    // Fetch profiles
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, relationship_type, is_favorite, last_contact_date, created_at, updated_at')
      .eq('user_id', userId);

    if (maxNodes) {
      query = query.order('is_favorite', { ascending: false }).limit(maxNodes);
    }

    const { data: profiles, error: profilesError } = await query;
    if (profilesError) throw profilesError;

    const profileIds = (profiles || []).map(p => p.id);

    // Fetch relationships
    const { data: relationships, error: relError } = await supabase
      .from('contact_relationships')
      .select('from_profile_id, to_profile_id, relationship_type')
      .eq('user_id', userId)
      .in('from_profile_id', profileIds)
      .in('to_profile_id', profileIds);

    if (relError) throw relError;

    const now = new Date();
    const nodes: NetworkNode[] = (profiles || []).map(p => {
      const lastContact = p.last_contact_date ? new Date(p.last_contact_date) : null;
      const daysSince = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : 365;

      return {
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
        type: p.relationship_type || 'other',
        isFavorite: p.is_favorite || false,
        importance: p.is_favorite ? 100 : 50,
        decayLevel: Math.min(100, daysSince / 3.65),
        lastContactDate: lastContact,
      };
    });

    const links: NetworkLink[] = (relationships || []).map(r => ({
      source: r.from_profile_id,
      target: r.to_profile_id,
      weight: 1,
      type: r.relationship_type || 'connected',
    }));

    return {
      id: `graph_${userId}`,
      userId,
      nodes,
      links,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Run full network analysis
  async analyzeNetwork(request: NetworkAnalysisRequest, preloadedGraph?: NetworkGraph): Promise<NetworkAnalysis> {
    const graph = preloadedGraph || await this.getNetworkGraph(request.userId, request.maxNodes);
    
    // Build node/link arrays for algorithms
    const nodesForAlgo = graph.nodes.map(n => ({ id: n.id }));
    const linksForAlgo = graph.links.map(l => ({ source: l.source, target: l.target, weight: l.weight }));

    // Build adjacency list
    const adj = buildAdjacencyList(nodesForAlgo, linksForAlgo);

    // Calculate centrality metrics
    const centrality: CentralityMetrics = {
      pageRank: calculatePageRank(nodesForAlgo, linksForAlgo),
      closeness: calculateClosenessCentrality(nodesForAlgo, linksForAlgo),
      betweenness: calculateBetweennessCentrality(nodesForAlgo, linksForAlgo),
      eigenvector: calculateEigenvectorCentrality(nodesForAlgo, linksForAlgo),
    };

    // Detect clusters
    const clusterMap = detectClusters(nodesForAlgo, linksForAlgo);
    const clusters = this.buildClusterList(graph.nodes, clusterMap);

    // Find structural holes
    const structuralHoles = detectStructuralHoles(nodesForAlgo, linksForAlgo, clusterMap).map(h => ({
      bridgeNode: h.bridgeNode,
      communities: h.communities,
      bridgeScore: h.bridgeScore,
      potentialValue: h.potentialValue as 'high' | 'medium' | 'low',
    }));

    // Identify top influencers and bridges
    const topInfluencers = this.getTopByMetric(centrality.pageRank, 10);
    const bridgeConnectors = this.getTopByMetric(centrality.betweenness, 10);

    // Calculate density
    const density = calculateNetworkDensity(nodesForAlgo, linksForAlgo);

    const analysis: NetworkAnalysis = {
      centrality,
      clusters,
      topInfluencers,
      bridgeConnectors,
      structuralHoles,
      density,
      averagePathLength: this.calculateAveragePathLength(adj),
    };

    // Emit event
    this.emit(new NetworkAnalyzed({
      userId: request.userId,
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
      clusterCount: clusters.length,
      analysis,
    }));

    return analysis;
  }

  // Get network summary for quick overview
  async getNetworkSummary(userId: string): Promise<NetworkSummary> {
    const graph = await this.getNetworkGraph(userId, 500);
    const analysis = await this.analyzeNetwork({ userId, maxNodes: 500 }, graph);

    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    return {
      nodeCount: graph.nodes.length,
      linkCount: graph.links.length,
      clusterCount: analysis.clusters.length,
      density: analysis.density,
      topInfluencers: analysis.topInfluencers.slice(0, 5).map(id => ({
        id,
        name: nodeMap.get(id)?.name || 'Unknown',
        score: analysis.centrality.pageRank.get(id) || 0,
      })),
      bridgeConnectors: analysis.bridgeConnectors.slice(0, 5).map(id => ({
        id,
        name: nodeMap.get(id)?.name || 'Unknown',
        score: analysis.centrality.betweenness.get(id) || 0,
      })),
      needsAttention: graph.nodes
        .filter(n => n.decayLevel > 70)
        .sort((a, b) => b.decayLevel - a.decayLevel)
        .slice(0, 5)
        .map(n => ({ id: n.id, name: n.name, decayLevel: n.decayLevel })),
    };
  }

  // Simulate influence propagation from a seed node
  async simulateInfluence(
    userId: string,
    seedNodeId: string,
    steps: number = 5
  ): Promise<InfluencePropagation> {
    const graph = await this.getNetworkGraph(userId);
    
    const nodesForAlgo = graph.nodes.map(n => ({ id: n.id }));
    const linksForAlgo = graph.links.map(l => ({ source: l.source, target: l.target, weight: l.weight }));
    
    // Use the simple influence propagation and build our own structure
    const influenceMap = calculateInfluencePropagation(
      nodesForAlgo,
      linksForAlgo,
      [seedNodeId],
      0.5,
      steps
    );

    // Build propagation waves from the influence map
    const waves: { step: number; nodesReached: string[]; cumulativeReach: number; influenceStrength: number }[] = [];
    let cumulative = 0;
    
    // Group nodes by their influence level as a proxy for "wave"
    const sortedNodes = Array.from(influenceMap.entries())
      .filter(([_, influence]) => influence > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedNodes.length > 0) {
      waves.push({
        step: 0,
        nodesReached: [seedNodeId],
        cumulativeReach: 1,
        influenceStrength: 1,
      });
      cumulative = 1;
      
      const others = sortedNodes.filter(([id]) => id !== seedNodeId);
      if (others.length > 0) {
        waves.push({
          step: 1,
          nodesReached: others.map(([id]) => id),
          cumulativeReach: cumulative + others.length,
          influenceStrength: 0.5,
        });
      }
    }

    return {
      seedNode: seedNodeId,
      reachableNodes: influenceMap,
      maxReach: influenceMap.size,
      avgTimeToReach: 1,
      propagationWaves: waves,
      bottlenecks: [],
    };
  }

  // Get strategic connection recommendations
  async getConnectionRecommendations(
    userId: string,
    profileId: string,
    limit: number = 5
  ): Promise<ConnectionRecommendation[]> {
    const graph = await this.getNetworkGraph(userId);
    
    const nodesForAlgo = graph.nodes.map(n => ({ id: n.id }));
    const linksForAlgo = graph.links.map(l => ({ source: l.source, target: l.target, weight: l.weight }));

    const recommendations = recommendStrategicConnections(
      nodesForAlgo,
      linksForAlgo,
      profileId,
      limit
    );

    return recommendations.map(r => ({
      targetNodeId: r.targetNodeId,
      reason: r.reason,
      expectedImpact: r.expectedImpact,
      requiredIntroductions: r.requiredIntroductions,
      difficulty: r.difficulty,
      bridgesCommunities: r.bridgesCommunities || false,
      fillsStructuralHole: r.fillsStructuralHole || false,
      networkROI: r.networkROI || r.expectedImpact,
    }));
  }

  // Detect sleeping connections
  async detectSleepingConnections(
    userId: string,
    dormancyThreshold: number = 90
  ): Promise<SleepingConnection[]> {
    const graph = await this.getNetworkGraph(userId);
    const now = new Date();

    const sleeping = graph.nodes
      .filter(n => {
        if (!n.lastContactDate) return true;
        const daysSince = Math.floor(
          (now.getTime() - n.lastContactDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince >= dormancyThreshold;
      })
      .map(n => {
        const daysSince = n.lastContactDate
          ? Math.floor((now.getTime() - n.lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
          : 365;

        return {
          nodeId: n.id,
          targetId: n.id,
          lastActiveDate: n.lastContactDate || new Date(0),
          historicalStrength: n.importance,
          dormancyDays: daysSince,
          revivalPotential: daysSince < 180 ? 'high' : daysSince < 365 ? 'medium' : 'low',
        } as SleepingConnection;
      });

    this.emit(new SleepingConnectionsDetected({
      userId,
      connections: sleeping,
    }));

    return sleeping;
  }

  // Private helper methods
  private buildClusterList(nodes: NetworkNode[], clusterMap: Map<string, number>): NetworkCluster[] {
    const clusterGroups = new Map<number, string[]>();
    
    clusterMap.forEach((clusterId, nodeId) => {
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, []);
      }
      clusterGroups.get(clusterId)!.push(nodeId);
    });

    return Array.from(clusterGroups.entries()).map(([id, members]) => ({
      id,
      members,
      size: members.length,
      cohesion: 0.8, // Simplified
      leaderId: members[0] || null,
      externalConnections: 0,
    }));
  }

  private getTopByMetric(metricMap: Map<string, number>, limit: number): string[] {
    return Array.from(metricMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);
  }

  private calculateAveragePathLength(adj: Map<string, Map<string, number>>): number {
    // Simplified calculation
    const nodeCount = adj.size;
    if (nodeCount < 2) return 0;
    
    let totalEdges = 0;
    adj.forEach(neighbors => {
      totalEdges += neighbors.size;
    });
    
    const avgDegree = totalEdges / nodeCount;
    return avgDegree > 0 ? Math.log(nodeCount) / Math.log(avgDegree) : 0;
  }
}
