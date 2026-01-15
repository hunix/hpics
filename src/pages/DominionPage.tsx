/**
 * Dominion Command Center
 * AGIS Phase 4 - Ultimate Dark Psychology & Absolute Control Suite
 */
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skull, Syringe, Lock, Brain, Target, UserMinus, Heart, Users, Layers, Zap, Ghost } from 'lucide-react';

import { TraumaExploitationPanel } from '@/components/intelligence/dominion/TraumaExploitationPanel';
import { AddictionFormationPanel } from '@/components/intelligence/dominion/AddictionFormationPanel';
import { CoerciveControlPanel } from '@/components/intelligence/dominion/CoerciveControlPanel';
import { BreakingPointCalculator } from '@/components/intelligence/dominion/BreakingPointCalculator';
import { LearnedHelplessnessPanel } from '@/components/intelligence/dominion/LearnedHelplessnessPanel';
import { IdentityDestabilizationPanel } from '@/components/intelligence/dominion/IdentityDestabilizationPanel';
import { StockholmSyndromeMonitor } from '@/components/intelligence/dominion/StockholmSyndromeMonitor';
import { CultTacticsPanel } from '@/components/intelligence/dominion/CultTacticsPanel';
import { DependencyOrchestratorPanel } from '@/components/intelligence/dominion/DependencyOrchestratorPanel';
import { UniversalDataFusionHub } from '@/components/intelligence/dominion/UniversalDataFusionHub';
import { PhobiaExploitationPanel } from '@/components/intelligence/dominion/PhobiaExploitationPanel';

const dominionTabs = [
  { id: 'fusion', label: 'Data Fusion Hub', icon: Layers, description: 'Universal intelligence integration' },
  { id: 'trauma', label: 'Trauma Exploitation', icon: Skull, description: 'Anniversary & loss timing vectors' },
  { id: 'phobia', label: 'Phobia Exploitation', icon: Ghost, description: 'Fear mapping & activation' },
  { id: 'addiction', label: 'Addiction Formation', icon: Syringe, description: 'Variable-ratio reinforcement protocols' },
  { id: 'coercive', label: 'Coercive Control', icon: Lock, description: '6-category control tactics' },
  { id: 'breaking', label: 'Breaking Point', icon: Target, description: '15 pressure vector analysis' },
  { id: 'helplessness', label: 'Learned Helplessness', icon: UserMinus, description: 'Systematic agency elimination' },
  { id: 'identity', label: 'Identity Destabilization', icon: Brain, description: 'Reality disruption & gaslighting' },
  { id: 'stockholm', label: 'Stockholm Syndrome', icon: Heart, description: 'Captor-captive bond monitoring' },
  { id: 'cult', label: 'Cult Tactics', icon: Users, description: 'BITE model deployment' },
  { id: 'dependency', label: 'Dependency Orchestration', icon: Zap, description: 'Multi-vector dependency creation' },
];

export default function DominionPage() {
  const [activeTab, setActiveTab] = useState('fusion');
  // Test profile ID for development
  const testProfileId = 'test-profile-001';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-destructive/30 bg-gradient-to-r from-destructive/10 via-background to-destructive/10">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/20 border border-destructive/30">
              <Skull className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                Dominion Command Center
                <Badge variant="destructive" className="text-xs">PHASE 4</Badge>
              </h1>
              <p className="text-muted-foreground">
                Ultimate Dark Psychology & Absolute Control Suite
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto p-1 bg-card border border-border gap-1 min-w-max">
              {dominionTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content */}
          <TabsContent value="fusion" className="mt-0">
            <UniversalDataFusionHub profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="trauma" className="mt-0">
            <TraumaExploitationPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="phobia" className="mt-0">
            <PhobiaExploitationPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="addiction" className="mt-0">
            <AddictionFormationPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="coercive" className="mt-0">
            <CoerciveControlPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="breaking" className="mt-0">
            <BreakingPointCalculator profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="helplessness" className="mt-0">
            <LearnedHelplessnessPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="identity" className="mt-0">
            <IdentityDestabilizationPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="stockholm" className="mt-0">
            <StockholmSyndromeMonitor profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="cult" className="mt-0">
            <CultTacticsPanel profileId={testProfileId} />
          </TabsContent>

          <TabsContent value="dependency" className="mt-0">
            <DependencyOrchestratorPanel profileId={testProfileId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
