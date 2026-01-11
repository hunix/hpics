import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, GitBranch, TrendingUp } from 'lucide-react';
import { FamilyTreeGraph } from '@/components/network/FamilyTreeGraph';
import { ChurnPredictionPanel } from '@/components/network/ChurnPredictionPanel';
import { NetworkGrowthOptimizer } from '@/components/network/NetworkGrowthOptimizer';
import { RelationshipGraphViewer } from '@/components/network/RelationshipGraphViewer';
import { NetworkControls } from '@/components/network/NetworkControls';
import { NetworkMetricsPanel } from '@/components/network/NetworkMetricsPanel';
import { ForceGraphVisualization } from '@/components/network/ForceGraphVisualization';
import { useNetworkData } from '@/hooks/useNetworkData';
import type { ColorMode, VisualizationNode } from '@/lib/network/types/visualization';
import type { NetworkMetrics } from '@/lib/network';

export default function NetworkPage() {
  const [filter, setFilter] = useState<string>('all');
  const [minImportance, setMinImportance] = useState([0]);
  const [selectedNode, setSelectedNode] = useState<VisualizationNode | null>(null);
  const [showDecay, setShowDecay] = useState(true);
  const [colorBy, setColorBy] = useState<ColorMode>('cluster');
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | null>(null);

  const { data: networkData, isLoading } = useNetworkData();

  // Update network metrics when data changes
  useMemo(() => {
    if (networkData?.metrics) {
      setNetworkMetrics(networkData.metrics);
    }
  }, [networkData]);

  // Calculate nodes needing attention
  const needsAttention = useMemo(() => {
    return networkData?.nodes.filter(n => 
      (n.isFavorite && n.decayLevel > 50) || n.decayLevel > 75
    ) || [];
  }, [networkData]);

  return (
    <AppLayout title="Relationship Network">
      <Tabs defaultValue="network" className="space-y-6">
        <TabsList>
          <TabsTrigger value="network" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Full Network
          </TabsTrigger>
          <TabsTrigger value="family" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Family Tree
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <p className="text-muted-foreground">
                Visualize your relationship network with importance weights, decay indicators, and connections
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {/* Controls */}
              <NetworkControls
                filter={filter}
                setFilter={setFilter}
                minImportance={minImportance}
                setMinImportance={setMinImportance}
                colorBy={colorBy}
                setColorBy={setColorBy}
                showDecay={showDecay}
                setShowDecay={setShowDecay}
                totalContacts={networkData?.nodes.length || 0}
                favoriteCount={networkData?.nodes.filter((n) => n.isFavorite).length || 0}
                needsAttentionCount={needsAttention.length}
              />

              {/* Network Graph */}
              <ForceGraphVisualization
                nodes={networkData?.nodes || []}
                links={networkData?.links || []}
                isLoading={isLoading}
                filter={filter}
                minImportance={minImportance[0]}
                showDecay={showDecay}
                colorBy={colorBy}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
              />
            </div>

            {/* Insights */}
            {networkData && networkData.nodes.length > 0 && (
              <NetworkMetricsPanel 
                nodes={networkData.nodes}
                metrics={networkMetrics}
                needsAttention={needsAttention}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="family">
          <FamilyTreeGraph />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChurnPredictionPanel />
            <NetworkGrowthOptimizer />
          </div>
          <RelationshipGraphViewer />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
