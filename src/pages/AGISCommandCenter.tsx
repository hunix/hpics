import React from 'react';
import { motion } from 'framer-motion';
import { Brain, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/AppLayout';
import { useAGISGlobalState } from '@/hooks/intelligence/useAGISGlobalState';
import { useAGISCascade } from '@/hooks/intelligence/useAGISCascade';
import { useAGISAnalytics } from '@/hooks/intelligence/useAGISAnalytics';
import { AGISPhaseHealthGrid, CrossPhaseCorrelationMatrix, AGISOperationalMetrics, CascadeEventTimeline } from '@/components/intelligence/phase19';

export default function AGISCommandCenter() {
  const { globalState, stats: globalStats, isLoading: globalLoading, initializeGlobalState, synthesizeGlobalState } = useAGISGlobalState();
  const { cascadeEvents, phaseSynergies, realtimeEvents, stats: cascadeStats, isLoading: cascadeLoading } = useAGISCascade();
  const { stats: analyticsStats, isLoading: analyticsLoading } = useAGISAnalytics();

  const isLoading = globalLoading || cascadeLoading || analyticsLoading;

  return (
    <AppLayout title="AGIS Command Center">
      <div className="container mx-auto p-4 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AGIS Command Center
            </h1>
            <p className="text-muted-foreground">Phase 19: Unified Supremacy - Master Orchestration Layer</p>
          </div>
          <div className="flex gap-2">
            {!globalState && (
              <Button onClick={() => initializeGlobalState.mutate()} disabled={initializeGlobalState.isPending}>
                Initialize AGIS
              </Button>
            )}
            <Button variant="outline" onClick={() => synthesizeGlobalState.mutate()} disabled={synthesizeGlobalState.isPending}>
              <RefreshCw className={`h-4 w-4 mr-2 ${synthesizeGlobalState.isPending ? 'animate-spin' : ''}`} />
              Synthesize
            </Button>
          </div>
        </motion.div>

        <AGISOperationalMetrics globalStats={globalStats} cascadeStats={cascadeStats} analyticsStats={analyticsStats} />

        <Tabs defaultValue="health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="health">Phase Health</TabsTrigger>
            <TabsTrigger value="synergy">Synergy Matrix</TabsTrigger>
            <TabsTrigger value="cascades">Cascade Events</TabsTrigger>
          </TabsList>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>Phase Health Grid</CardTitle>
                <CardDescription>Real-time status of all 18 AGIS phases</CardDescription>
              </CardHeader>
              <CardContent>
                <AGISPhaseHealthGrid phaseHealthScores={globalState?.phaseHealthScores || {}} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="synergy">
            <Card>
              <CardHeader>
                <CardTitle>Cross-Phase Correlation Matrix</CardTitle>
                <CardDescription>Synergy scores between phase pairs</CardDescription>
              </CardHeader>
              <CardContent>
                <CrossPhaseCorrelationMatrix synergies={phaseSynergies} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cascades">
            <Card>
              <CardHeader>
                <CardTitle>Cascade Event Timeline</CardTitle>
                <CardDescription>Real-time cross-phase operation flow</CardDescription>
              </CardHeader>
              <CardContent>
                <CascadeEventTimeline events={cascadeEvents} realtimeEvents={realtimeEvents} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
