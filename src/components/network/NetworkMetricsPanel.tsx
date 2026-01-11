import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Layers, AlertTriangle } from 'lucide-react';
import { getClusterColor, type NetworkMetrics } from '@/lib/network';
import type { VisualizationNode } from '@/lib/network/types/visualization';
import { RELATIONSHIP_TYPES, RELATIONSHIP_COLORS } from '@/lib/network/types/visualization';

interface NetworkMetricsPanelProps {
  nodes: VisualizationNode[];
  metrics: NetworkMetrics | null;
  needsAttention: VisualizationNode[];
}

export function NetworkMetricsPanel({ nodes, metrics, needsAttention }: NetworkMetricsPanelProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Top Influencers by PageRank */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top Influencers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nodes
              .sort((a, b) => (b.pageRank || 0) - (a.pageRank || 0))
              .slice(0, 5)
              .map((node) => (
                <div key={node.id} className="flex items-center justify-between">
                  <span className="text-sm truncate">{node.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {((node.pageRank || 0) * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Bridge Connectors by Betweenness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            Bridge Connectors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {nodes
              .sort((a, b) => (b.betweenness || 0) - (a.betweenness || 0))
              .slice(0, 5)
              .map((node) => (
                <div key={node.id} className="flex items-center justify-between">
                  <span className="text-sm truncate">{node.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {((node.betweenness || 0) * 100).toFixed(0)}%
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Clusters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-500" />
            Clusters ({metrics?.clusterCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics && Array.from(new Set(nodes.map(n => n.clusterId)))
              .slice(0, 5)
              .map((clusterId) => {
                const clusterNodes = nodes.filter(n => n.clusterId === clusterId);
                return (
                  <div key={clusterId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: getClusterColor(clusterId || 0) }}
                      />
                      <span className="text-sm">Cluster {(clusterId || 0) + 1}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{clusterNodes.length} members</span>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* By Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">By Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {RELATIONSHIP_TYPES
              .map((type) => ({
                type,
                count: nodes.filter((n) => n.type === type).length,
              }))
              .filter((t) => t.count > 0)
              .sort((a, b) => b.count - a.count)
              .map(({ type, count }) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: RELATIONSHIP_COLORS[type] }}
                    />
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Needs Attention */}
      <Card className={needsAttention.length > 0 ? 'border-orange-500/50' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${needsAttention.length > 0 ? 'text-orange-500' : ''}`} />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {needsAttention.slice(0, 5).map((node) => (
              <div key={node.id} className="flex items-center justify-between">
                <span className="text-sm truncate">{node.name}</span>
                <Badge variant={node.decayLevel > 75 ? "destructive" : "secondary"}>
                  {node.decayLevel}% decay
                </Badge>
              </div>
            ))}
            {needsAttention.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All relationships are well-maintained! 🎉
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
