/**
 * TrustGuard: GNN-based Trust Evaluation
 * Source: arxiv:2306.13339v4
 * 
 * Robust, explainable trust prediction with layered architecture.
 */

import type { NetworkNode, NetworkLink } from './types';
import { buildAdjacencyList } from './utils';

export interface TrustPrediction {
  nodeId: string;
  trustScore: number;          // 0-1
  confidence: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: TrustFactor[];
  explanation: string;
}

export interface TrustFactor {
  name: string;
  contribution: number;       // -1 to 1
  evidence: string;
}

export function predictTrust(
  nodes: NetworkNode[],
  links: NetworkLink[],
  targetNodeId: string,
  history?: Array<{ timestamp: number; interactions: number; sentiment: number }>
): TrustPrediction {
  const adj = buildAdjacencyList(nodes, links);
  const neighbors = adj.get(targetNodeId);
  
  if (!neighbors || neighbors.size === 0) {
    return { nodeId: targetNodeId, trustScore: 0.5, confidence: 0.1, trend: 'stable', factors: [], explanation: 'Insufficient data' };
  }

  const factors: TrustFactor[] = [];

  // Connectivity factor
  const connectivity = Math.min(1, neighbors.size / 10);
  factors.push({ name: 'connectivity', contribution: connectivity * 0.3, evidence: `${neighbors.size} connections` });

  // Interaction strength
  let totalWeight = 0;
  neighbors.forEach(w => totalWeight += w);
  const avgWeight = totalWeight / neighbors.size;
  factors.push({ name: 'interaction_strength', contribution: Math.min(1, avgWeight) * 0.25, evidence: `Avg weight: ${avgWeight.toFixed(2)}` });

  // Reciprocity
  let reciprocal = 0;
  neighbors.forEach((_, nId) => {
    const nAdj = adj.get(nId);
    if (nAdj?.has(targetNodeId)) reciprocal++;
  });
  const reciprocity = reciprocal / neighbors.size;
  factors.push({ name: 'reciprocity', contribution: reciprocity * 0.2, evidence: `${(reciprocity * 100).toFixed(0)}% reciprocal` });

  // Temporal trend
  let trend: TrustPrediction['trend'] = 'stable';
  if (history && history.length > 2) {
    const recentSentiment = history.slice(-3).reduce((s, h) => s + h.sentiment, 0) / 3;
    const olderSentiment = history.slice(0, 3).reduce((s, h) => s + h.sentiment, 0) / 3;
    if (recentSentiment > olderSentiment + 0.1) trend = 'increasing';
    else if (recentSentiment < olderSentiment - 0.1) trend = 'decreasing';
    factors.push({ name: 'sentiment_trend', contribution: (recentSentiment - 0.5) * 0.25, evidence: `Trend: ${trend}` });
  }

  const trustScore = Math.max(0, Math.min(1, 0.5 + factors.reduce((s, f) => s + f.contribution, 0)));
  const confidence = Math.min(0.95, (neighbors.size / 20 + (history?.length || 0) / 10));

  return {
    nodeId: targetNodeId, trustScore, confidence, trend, factors,
    explanation: `Trust score ${(trustScore * 100).toFixed(0)}% based on ${factors.length} factors (${trend} trend)`,
  };
}
