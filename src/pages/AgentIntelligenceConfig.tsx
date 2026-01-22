/**
 * @fileoverview Agent Intelligence Configuration Page
 * Dedicated admin page for AI agent systems: Tribunals, Verification, Memory, Observability
 */

import { AppLayout } from '@/components/AppLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Shield, Brain, Scale, Activity, 
  Sparkles, Network
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Lazy load panels to improve initial load
import { AgentObservabilityPanel } from '@/components/settings/AgentObservabilityPanel';
import { TribunalConfigPanel } from '@/components/settings/TribunalConfigPanel';
import { MemoryNetworkPanel } from '@/components/settings/MemoryNetworkPanel';
import { VerificationConfigPanel } from '@/components/settings/VerificationConfigPanel';

type TabValue = 'observability' | 'tribunals' | 'verification' | 'memory';

const TAB_CONFIG: Record<TabValue, { icon: React.ReactNode; label: string; description: string }> = {
  observability: {
    icon: <Activity className="h-4 w-4" />,
    label: 'Observability',
    description: 'OpenTelemetry tracing for AI agents',
  },
  tribunals: {
    icon: <Scale className="h-4 w-4" />,
    label: 'Tribunals',
    description: 'Multi-agent deliberation systems',
  },
  verification: {
    icon: <Shield className="h-4 w-4" />,
    label: 'Verification',
    description: 'Warfare operation verification',
  },
  memory: {
    icon: <Brain className="h-4 w-4" />,
    label: 'Memory Network',
    description: 'Agentic memory & knowledge graph',
  },
};

export default function AgentIntelligenceConfig() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabValue>('observability');

  return (
    <AppLayout title="Agent Intelligence">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Settings
            </Button>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="h-3 w-3" />
            Advanced
          </Badge>
        </div>

        {/* Page Header Card */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Network className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Agent Intelligence Configuration</CardTitle>
                <CardDescription>
                  Configure multi-agent systems, observability, memory networks, and verification chambers
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <TabsList className="inline-flex h-auto gap-1 p-1 flex-nowrap min-w-max">
              {(Object.entries(TAB_CONFIG) as [TabValue, typeof TAB_CONFIG[TabValue]][]).map(([key, config]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="flex items-center gap-2 text-sm whitespace-nowrap px-4 py-2.5"
                >
                  {config.icon}
                  <span>{config.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          <div className="mt-6">
            <TabsContent value="observability" className="mt-0">
              <AgentObservabilityPanel />
            </TabsContent>

            <TabsContent value="tribunals" className="mt-0">
              <TribunalConfigPanel />
            </TabsContent>

            <TabsContent value="verification" className="mt-0">
              <VerificationConfigPanel />
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <MemoryNetworkPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
