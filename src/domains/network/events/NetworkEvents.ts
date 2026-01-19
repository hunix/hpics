/**
 * Network Domain Events
 * Events emitted when network-related operations occur
 */

import type { NetworkAnalysis, NetworkNode, NetworkCluster } from '../entities/NetworkGraph';
import type { ConnectionRecommendation, SleepingConnection } from '../entities/Connection';
import type { InfluencePropagation } from '../entities/Influence';

export interface DomainEvent<T = unknown> {
  type: string;
  timestamp: Date;
  payload: T;
  getPayload(): T;
}

// Network Analysis Events
export class NetworkAnalyzed implements DomainEvent<{
  userId: string;
  nodeCount: number;
  linkCount: number;
  clusterCount: number;
  analysis: NetworkAnalysis;
}> {
  readonly type = 'NETWORK_ANALYZED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      nodeCount: number;
      linkCount: number;
      clusterCount: number;
      analysis: NetworkAnalysis;
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export class ClustersDetected implements DomainEvent<{
  userId: string;
  clusters: NetworkCluster[];
  algorithm: string;
}> {
  readonly type = 'CLUSTERS_DETECTED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      clusters: NetworkCluster[];
      algorithm: string;
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export class InfluencersIdentified implements DomainEvent<{
  userId: string;
  influencers: NetworkNode[];
  metric: string;
}> {
  readonly type = 'INFLUENCERS_IDENTIFIED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      influencers: NetworkNode[];
      metric: string;
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export class BridgeConnectorsFound implements DomainEvent<{
  userId: string;
  bridges: NetworkNode[];
}> {
  readonly type = 'BRIDGE_CONNECTORS_FOUND';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      bridges: NetworkNode[];
    }
  ) {}
  
  getPayload() { return this.payload; }
}

// Influence Events
export class InfluenceSimulated implements DomainEvent<{
  userId: string;
  seedNode: string;
  propagation: InfluencePropagation;
}> {
  readonly type = 'INFLUENCE_SIMULATED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      seedNode: string;
      propagation: InfluencePropagation;
    }
  ) {}
  
  getPayload() { return this.payload; }
}

// Connection Events
export class ConnectionsRecommended implements DomainEvent<{
  userId: string;
  profileId: string;
  recommendations: ConnectionRecommendation[];
}> {
  readonly type = 'CONNECTIONS_RECOMMENDED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      profileId: string;
      recommendations: ConnectionRecommendation[];
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export class SleepingConnectionsDetected implements DomainEvent<{
  userId: string;
  connections: SleepingConnection[];
}> {
  readonly type = 'SLEEPING_CONNECTIONS_DETECTED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      connections: SleepingConnection[];
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export class NetworkHealthUpdated implements DomainEvent<{
  userId: string;
  density: number;
  fragmentation: number;
  avgPathLength: number;
  vulnerabilityScore: number;
}> {
  readonly type = 'NETWORK_HEALTH_UPDATED';
  readonly timestamp = new Date();
  
  constructor(
    public readonly payload: {
      userId: string;
      density: number;
      fragmentation: number;
      avgPathLength: number;
      vulnerabilityScore: number;
    }
  ) {}
  
  getPayload() { return this.payload; }
}

export type NetworkDomainEvent =
  | NetworkAnalyzed
  | ClustersDetected
  | InfluencersIdentified
  | BridgeConnectorsFound
  | InfluenceSimulated
  | ConnectionsRecommended
  | SleepingConnectionsDetected
  | NetworkHealthUpdated;
