/**
 * Network Repository Interface - DDD Repository Contract
 * 
 * Defines the contract for network and relationship data persistence.
 */

import { 
  IUserScopedRepository, 
  QuerySpec, 
  PaginatedResult 
} from '@/domains/shared/repositories/BaseRepository';
import { BaseEntity } from '@/domains/shared/entities/BaseEntity';

/**
 * Network Node representation
 */
export interface NetworkNode {
  id: string;
  profileId: string;
  label: string;
  type: 'profile' | 'organization' | 'group';
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Network Edge representation
 */
export interface NetworkEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Network Snapshot for point-in-time analysis
 */
export interface NetworkSnapshotData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metrics: {
    density: number;
    clusteringCoefficient: number;
    averagePathLength: number;
  };
  capturedAt: Date;
}

/**
 * Network query options
 */
export interface NetworkQueryOptions {
  depth?: number;
  includeInactive?: boolean;
  relationshipTypes?: string[];
  minStrength?: number;
}

/**
 * Network Repository Interface
 */
export interface INetworkRepository {
  /**
   * Get nodes connected to a profile
   */
  findConnectedNodes(
    userId: string,
    profileId: string,
    options?: NetworkQueryOptions
  ): Promise<NetworkNode[]>;

  /**
   * Get edges for a profile
   */
  findEdgesForProfile(
    userId: string,
    profileId: string,
    options?: NetworkQueryOptions
  ): Promise<NetworkEdge[]>;

  /**
   * Get the full network graph for a user
   */
  getNetworkGraph(
    userId: string,
    options?: NetworkQueryOptions
  ): Promise<{ nodes: NetworkNode[]; edges: NetworkEdge[] }>;

  /**
   * Save a network snapshot
   */
  saveSnapshot(userId: string, snapshot: NetworkSnapshotData): Promise<string>;

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(userId: string): Promise<NetworkSnapshotData | null>;

  /**
   * Calculate network metrics
   */
  calculateMetrics(userId: string): Promise<NetworkSnapshotData['metrics']>;

  /**
   * Find shortest path between two profiles
   */
  findShortestPath(
    userId: string,
    sourceProfileId: string,
    targetProfileId: string
  ): Promise<NetworkNode[]>;

  /**
   * Get influence scores for profiles
   */
  getInfluenceScores(
    userId: string,
    profileIds: string[]
  ): Promise<Map<string, number>>;
}
