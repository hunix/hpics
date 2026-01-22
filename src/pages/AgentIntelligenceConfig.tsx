/**
 * @fileoverview Agent Intelligence Configuration Page
 * Dedicated admin page for AI agent systems: Tribunals, Verification, Memory, Observability, Procedural Memory
 * Plus new tabs: Functions, Workflows, Constitutional, Kill Switch, Genesis, Cost, Anomaly, Health
 */

import { AppLayout } from '@/components/AppLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, Shield, Brain, Scale, Activity, 
  Sparkles, Network, BookOpen, Workflow, GitBranch,
  ShieldOff, DollarSign, AlertTriangle, HeartPulse
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

// Lazy load panels to improve initial load
import { AgentObservabilityPanel } from '@/components/settings/AgentObservabilityPanel';
import { TribunalConfigPanel } from '@/components/settings/TribunalConfigPanel';
import { MemoryNetworkPanel } from '@/components/settings/MemoryNetworkPanel';
import { VerificationConfigPanel } from '@/components/settings/VerificationConfigPanel';
import { ProceduralMemoryPanel } from '@/components/settings/ProceduralMemoryPanel';
import { EdgeFunctionRegistryPanel } from '@/components/settings/EdgeFunctionRegistryPanel';
import { AgentWorkflowDesigner } from '@/components/settings/AgentWorkflowDesigner';
import { ConstitutionalRulesPanel } from '@/components/settings/ConstitutionalRulesPanel';
import { KillSwitchPanel } from '@/components/settings/KillSwitchPanel';
import { GenesisConfigPanel } from '@/components/settings/GenesisConfigPanel';

type TabValue = 
  | 'observability' 
  | 'tribunals' 
  | 'verification' 
  | 'memory' 
  | 'procedural'
  | 'functions'
  | 'workflows'
  | 'constitutional'
  | 'killswitch'
  | 'genesis'
  | 'cost-analytics'
  | 'anomaly'
  | 'health';

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
  procedural: {
    icon: <BookOpen className="h-4 w-4" />,
    label: 'Procedural',
    description: 'SOP distillation & MUSE framework',
  },
  functions: {
    icon: <Workflow className="h-4 w-4" />,
    label: 'Functions',
    description: 'Edge function registry & schema',
  },
  workflows: {
    icon: <GitBranch className="h-4 w-4" />,
    label: 'Workflows',
    description: 'Agent state machine designer',
  },
  constitutional: {
    icon: <Scale className="h-4 w-4" />,
    label: 'Constitutional',
    description: 'Ethical & legal guardrails',
  },
  killswitch: {
    icon: <ShieldOff className="h-4 w-4" />,
    label: 'Kill Switch',
    description: 'Emergency agent containment',
  },
  genesis: {
    icon: <Sparkles className="h-4 w-4" />,
    label: 'Genesis',
    description: 'Phase 22 reality creation config',
  },
  'cost-analytics': {
    icon: <DollarSign className="h-4 w-4" />,
    label: 'Cost Analytics',
    description: 'AI spending & budget tracking',
  },
  anomaly: {
    icon: <AlertTriangle className="h-4 w-4" />,
    label: 'Anomaly',
    description: 'Behavioral anomaly detection',
  },
  health: {
    icon: <HeartPulse className="h-4 w-4" />,
    label: 'Health',
    description: 'System health monitoring',
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
                  Configure multi-agent systems, observability, memory networks, workflows, and verification chambers
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

            <TabsContent value="procedural" className="mt-0">
              <ProceduralMemoryPanel />
            </TabsContent>

            <TabsContent value="functions" className="mt-0">
              <EdgeFunctionRegistryPanel />
            </TabsContent>

            <TabsContent value="workflows" className="mt-0">
              <AgentWorkflowDesigner />
            </TabsContent>

            <TabsContent value="constitutional" className="mt-0">
              <ConstitutionalRulesPanel />
            </TabsContent>

            <TabsContent value="killswitch" className="mt-0">
              <KillSwitchPanel />
            </TabsContent>

            <TabsContent value="genesis" className="mt-0">
              <GenesisConfigPanel />
            </TabsContent>

            <TabsContent value="cost-analytics" className="mt-0">
              <CostAnalyticsPlaceholder />
            </TabsContent>

            <TabsContent value="anomaly" className="mt-0">
              <AnomalyDetectionPlaceholder />
            </TabsContent>

            <TabsContent value="health" className="mt-0">
              <SystemHealthPlaceholder />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// Placeholder components for tabs that need dedicated dashboards
function CostAnalyticsPlaceholder() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          AI Cost Analytics
        </CardTitle>
        <CardDescription>
          Track and analyze AI spending across all agents and functions.
        </CardDescription>
      </CardHeader>
      <div className="p-6">
        <Button onClick={() => navigate('/ai-cost-dashboard')}>
          Open Full Dashboard
        </Button>
      </div>
    </Card>
  );
}

function AnomalyDetectionPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Anomaly Detection
        </CardTitle>
        <CardDescription>
          Monitor for unusual behavioral patterns and system anomalies.
        </CardDescription>
      </CardHeader>
      <div className="p-6 text-muted-foreground text-center py-12">
        Anomaly detection panel - monitors AI agent behavior patterns and flags unusual activity.
      </div>
    </Card>
  );
}

function SystemHealthPlaceholder() {
  const navigate = useNavigate();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="h-5 w-5" />
          System Health Monitor
        </CardTitle>
        <CardDescription>
          Real-time health status of all AI systems and edge functions.
        </CardDescription>
      </CardHeader>
      <div className="p-6">
        <Button onClick={() => navigate('/system-health-dashboard')}>
          Open Health Dashboard
        </Button>
      </div>
    </Card>
  );
}
