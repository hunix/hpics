/**
 * Enhancement Suite Page (v9.0)
 * 
 * Unified dashboard for the Revolutionary Enhancement Suite.
 * Provides access to 50+ AI intelligence engines.
 */

import React, { useState, Suspense } from 'react';
import { 
  Atom, Brain, Shield, Network, Layers, Users, Fingerprint,
  Swords, Eye, Target, Zap, Activity, Sparkles
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/shared/PageHeader';
import { Panel } from '@/components/shared/Panel';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';

// Lazy load heavy components
const CognitiveWarfarePanel = React.lazy(() => 
  import('@/components/intelligence/enhancement/CognitiveWarfarePanel').then(m => ({ default: m.CognitiveWarfarePanel }))
);
const DeceptionFusionDashboard = React.lazy(() => 
  import('@/components/intelligence/enhancement/DeceptionFusionDashboard').then(m => ({ default: m.DeceptionFusionDashboard }))
);
const DigitalTwinManager = React.lazy(() => 
  import('@/components/intelligence/enhancement/DigitalTwinManager').then(m => ({ default: m.DigitalTwinManager }))
);
const DarkPsychologyScanner = React.lazy(() => 
  import('@/components/intelligence/enhancement/DarkPsychologyScanner').then(m => ({ default: m.DarkPsychologyScanner }))
);
const QuantumDecisionPanel = React.lazy(() => 
  import('@/components/intelligence/enhancement/QuantumDecisionPanel').then(m => ({ default: m.QuantumDecisionPanel }))
);
const NetworkIntelligenceGraph = React.lazy(() => 
  import('@/components/intelligence/enhancement/NetworkIntelligenceGraph').then(m => ({ default: m.NetworkIntelligenceGraph }))
);
const StylemetryAnalyzer = React.lazy(() => 
  import('@/components/intelligence/enhancement/StylemetryAnalyzer').then(m => ({ default: m.StylemetryAnalyzer }))
);
const MemoryExploitationPanel = React.lazy(() => 
  import('@/components/intelligence/enhancement/MemoryExploitationPanel').then(m => ({ default: m.MemoryExploitationPanel }))
);
const HypergameVisualizer = React.lazy(() => 
  import('@/components/intelligence/enhancement/HypergameVisualizer').then(m => ({ default: m.HypergameVisualizer }))
);
const CollectiveBehaviorMonitor = React.lazy(() => 
  import('@/components/intelligence/enhancement/CollectiveBehaviorMonitor').then(m => ({ default: m.CollectiveBehaviorMonitor }))
);

const TABS = [
  { id: 'cognitive', label: 'Cognitive', icon: Swords },
  { id: 'deception', label: 'Deception', icon: Eye },
  { id: 'psychology', label: 'Psychology', icon: Brain },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'game-theory', label: 'Game Theory', icon: Layers },
  { id: 'collective', label: 'Collective', icon: Users },
  { id: 'twins', label: 'Digital Twins', icon: Fingerprint },
] as const;

type TabId = typeof TABS[number]['id'];

function EnhancementSuite() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'cognitive';
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabId);
    setSearchParams({ tab });
  };

  // Quick action buttons
  const quickActions = [
    { id: 'cognitive', label: 'Cognitive Warfare', icon: Swords },
    { id: 'deception', label: 'Deception Analysis', icon: Eye },
    { id: 'twins', label: 'Digital Twins', icon: Fingerprint },
    { id: 'psychology', label: 'Dark Psychology', icon: Brain },
    { id: 'game-theory', label: 'Quantum Decisions', icon: Atom },
    { id: 'network', label: 'Network Intel', icon: Network },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      <PageHeader
        title="Enhancement Suite"
        subtitle="Revolutionary Intelligence Platform v9.0"
        icon={Sparkles}
        badge={<Badge variant="default" className="ml-2">50+ Engines</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Active
            </Badge>
          </div>
        }
      />

      {/* Quick Actions */}
      <div className="rounded-lg bg-muted/30 p-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant={activeTab === action.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTabChange(action.id)}
              className="flex items-center gap-1.5"
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            {TABS.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Cognitive Warfare Tab */}
        <TabsContent value="cognitive" className="space-y-4">
          <ErrorBoundaryWithRecovery>
            <Suspense fallback={<LoadingState message="Loading Cognitive Warfare..." />}>
              <CognitiveWarfarePanel />
            </Suspense>
          </ErrorBoundaryWithRecovery>
        </TabsContent>

        {/* Deception Tab */}
        <TabsContent value="deception" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Deception Analysis..." />}>
                <DeceptionFusionDashboard />
              </Suspense>
            </ErrorBoundaryWithRecovery>
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Stylometry..." />}>
                <StylemetryAnalyzer />
              </Suspense>
            </ErrorBoundaryWithRecovery>
          </div>
        </TabsContent>

        {/* Psychology Tab */}
        <TabsContent value="psychology" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Dark Psychology..." />}>
                <DarkPsychologyScanner />
              </Suspense>
            </ErrorBoundaryWithRecovery>
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Memory Exploitation..." />}>
                <MemoryExploitationPanel />
              </Suspense>
            </ErrorBoundaryWithRecovery>
          </div>
        </TabsContent>

        {/* Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <ErrorBoundaryWithRecovery>
            <Suspense fallback={<LoadingState message="Loading Network Intelligence..." />}>
              <NetworkIntelligenceGraph />
            </Suspense>
          </ErrorBoundaryWithRecovery>
        </TabsContent>

        {/* Game Theory Tab */}
        <TabsContent value="game-theory" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Quantum Decisions..." />}>
                <QuantumDecisionPanel />
              </Suspense>
            </ErrorBoundaryWithRecovery>
            <ErrorBoundaryWithRecovery>
              <Suspense fallback={<LoadingState message="Loading Hypergame Theory..." />}>
                <HypergameVisualizer />
              </Suspense>
            </ErrorBoundaryWithRecovery>
          </div>
        </TabsContent>

        {/* Collective Behavior Tab */}
        <TabsContent value="collective" className="space-y-4">
          <ErrorBoundaryWithRecovery>
            <Suspense fallback={<LoadingState message="Loading Collective Behavior..." />}>
              <CollectiveBehaviorMonitor />
            </Suspense>
          </ErrorBoundaryWithRecovery>
        </TabsContent>

        {/* Digital Twins Tab */}
        <TabsContent value="twins" className="space-y-4">
          <ErrorBoundaryWithRecovery>
            <Suspense fallback={<LoadingState message="Loading Digital Twins..." />}>
              <DigitalTwinManager />
            </Suspense>
          </ErrorBoundaryWithRecovery>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancementSuite;
