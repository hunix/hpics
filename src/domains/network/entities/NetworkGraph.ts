/**
 * Network Graph Entity
 * Core domain entity representing a network of connected nodes
 */

export type CentralityType = 'pagerank' | 'closeness' | 'betweenness' | 'eigenvector';
export type ClusterAlgorithm = 'louvain' | 'label_propagation' | 'hierarchical';
export type NodeRole = 'leader' | 'connector' | 'active' | 'peripheral' | 'isolated';
export type TrendDirection = 'strengthening' | 'stable' | 'weakening' | 'dormant';

export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  isFavorite: boolean;
  importance: number;
  decayLevel: number;
  lastContactDate: Date | null;
  
  // Centrality metrics
  pageRank?: number;
  closeness?: number;
  betweenness?: number;
  eigenvector?: number;
  
  // Cluster membership
  clusterId?: number;
  role?: NodeRole;
  
  // Visualization coordinates
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface NetworkLink {
  source: string;
  target: string;
  weight: number;
  type: string;
  timestamp?: number;
}

export interface NetworkCluster {
  id: number;
  members: string[];
  size: number;
  cohesion: number;
  leaderId: string | null;
  externalConnections: number;
}

export interface CentralityMetrics {
  pageRank: Map<string, number>;
  closeness: Map<string, number>;
  betweenness: Map<string, number>;
  eigenvector: Map<string, number>;
}

export interface NetworkAnalysis {
  centrality: CentralityMetrics;
  clusters: NetworkCluster[];
  topInfluencers: string[];
  bridgeConnectors: string[];
  structuralHoles: StructuralHole[];
  density: number;
  averagePathLength: number;
}

export interface StructuralHole {
  bridgeNode: string;
  communities: number[];
  bridgeScore: number;
  potentialValue: 'high' | 'medium' | 'low';
}

export interface NetworkGraph {
  id: string;
  userId: string;
  nodes: NetworkNode[];
  links: NetworkLink[];
  analysis?: NetworkAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkSnapshot {
  graphId: string;
  timestamp: Date;
  nodeCount: number;
  linkCount: number;
  clusterCount: number;
  metrics: {
    density: number;
    avgCentrality: number;
    fragmentation: number;
  };
}
