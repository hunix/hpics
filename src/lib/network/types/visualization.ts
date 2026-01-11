// Network Visualization Types
// Used by D3-based network graph components

export interface VisualizationNode {
  id: string;
  name: string;
  type: string;
  isFavorite: boolean;
  communicationCount: number;
  messageCount: number;
  eventCount: number;
  importance: number;
  lastContactDate: Date | null;
  decayLevel: number;
  pageRank?: number;
  closeness?: number;
  betweenness?: number;
  clusterId?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface VisualizationLink {
  source: string | VisualizationNode;
  target: string | VisualizationNode;
  weight: number;
  type: string;
}

export interface NetworkVisualizationData {
  nodes: VisualizationNode[];
  links: VisualizationLink[];
  metrics?: import('../types').NetworkMetrics;
}

export type ColorMode = 'type' | 'cluster' | 'pagerank';

export const RELATIONSHIP_COLORS: Record<string, string> = {
  family: '#ef4444',
  friend: '#3b82f6',
  colleague: '#a855f7',
  client: '#22c55e',
  mentor: '#eab308',
  mentee: '#f97316',
  acquaintance: '#6b7280',
  other: '#9ca3af',
  favorite: '#fbbf24',
};

export const RELATIONSHIP_TYPES = [
  'family', 'friend', 'colleague', 'client', 
  'mentor', 'mentee', 'acquaintance', 'other'
] as const;
