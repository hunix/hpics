/**
 * Network Facade
 * Simplified interface for common network operations
 */

import { NetworkService, type NetworkSummary } from '@/domains/network';
import type { NetworkGraph, NetworkAnalysis, ConnectionRecommendation } from '@/domains/network';

export interface NetworkHealth {
  overall: 'healthy' | 'warning' | 'critical';
  density: number;
  fragmentation: number;
  sleepingCount: number;
  recommendations: string[];
}

export interface QuickNetworkStats {
  totalContacts: number;
  activeClusters: number;
  topInfluencer: string | null;
  needsAttentionCount: number;
}

export class NetworkFacade {
  constructor(private networkService: NetworkService) {}

  // Get quick stats for dashboard
  async getQuickStats(userId: string): Promise<QuickNetworkStats> {
    const summary = await this.networkService.getNetworkSummary(userId);

    return {
      totalContacts: summary.nodeCount,
      activeClusters: summary.clusterCount,
      topInfluencer: summary.topInfluencers[0]?.name || null,
      needsAttentionCount: summary.needsAttention.length,
    };
  }

  // Assess network health
  async assessHealth(userId: string): Promise<NetworkHealth> {
    const summary = await this.networkService.getNetworkSummary(userId);
    const sleeping = await this.networkService.detectSleepingConnections(userId);

    const recommendations: string[] = [];

    // Analyze and generate recommendations
    if (summary.density < 0.1) {
      recommendations.push('Your network is sparse. Consider introducing connections between clusters.');
    }

    if (sleeping.length > 10) {
      recommendations.push(`${sleeping.length} connections are dormant. Consider reaching out.`);
    }

    if (summary.clusterCount === 1 && summary.nodeCount > 20) {
      recommendations.push('Your network lacks diversity. Try connecting with different groups.');
    }

    if (summary.bridgeConnectors.length < 2) {
      recommendations.push('You have few bridge connectors. Identify key people who can connect groups.');
    }

    // Determine overall health
    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (recommendations.length >= 3 || sleeping.length > 20) {
      overall = 'critical';
    } else if (recommendations.length >= 1 || sleeping.length > 5) {
      overall = 'warning';
    }

    return {
      overall,
      density: summary.density,
      fragmentation: 1 - summary.density,
      sleepingCount: sleeping.length,
      recommendations,
    };
  }

  // Get full network package for visualization
  async getNetworkPackage(userId: string): Promise<{
    graph: NetworkGraph;
    analysis: NetworkAnalysis;
    summary: NetworkSummary;
  }> {
    const [graph, analysis, summary] = await Promise.all([
      this.networkService.getNetworkGraph(userId, 500),
      this.networkService.analyzeNetwork({ userId, maxNodes: 500 }),
      this.networkService.getNetworkSummary(userId),
    ]);

    return { graph, analysis, summary };
  }

  // Get top recommendations for a specific contact
  async getTopRecommendationsFor(
    userId: string,
    profileId: string
  ): Promise<ConnectionRecommendation[]> {
    return this.networkService.getConnectionRecommendations(userId, profileId, 3);
  }

  // Find optimal path between two nodes
  async findConnectionPath(
    userId: string,
    fromId: string,
    toId: string
  ): Promise<string[] | null> {
    const graph = await this.networkService.getNetworkGraph(userId);
    
    // BFS to find shortest path
    const visited = new Set<string>();
    const queue: { node: string; path: string[] }[] = [{ node: fromId, path: [fromId] }];
    
    const adjacency = new Map<string, string[]>();
    graph.links.forEach(link => {
      if (!adjacency.has(link.source)) adjacency.set(link.source, []);
      if (!adjacency.has(link.target)) adjacency.set(link.target, []);
      adjacency.get(link.source)!.push(link.target);
      adjacency.get(link.target)!.push(link.source);
    });

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      
      if (node === toId) return path;
      if (visited.has(node)) continue;
      
      visited.add(node);
      
      const neighbors = adjacency.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null; // No path found
  }
}
