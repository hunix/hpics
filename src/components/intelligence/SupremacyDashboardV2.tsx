/**
 * Supremacy Dashboard V2
 * Unified command center for AGIS Phase 2 capabilities
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Crown, 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  Network, 
  Zap,
  Shield,
  Eye,
  Heart
} from 'lucide-react';
import { TacticalNegotiationPanel } from './TacticalNegotiationPanel';
import { AttachmentVulnerabilityPanel } from './AttachmentVulnerabilityPanel';
import { ChronotypePanel } from './ChronotypePanel';
import { LifeTrajectoryPanel } from './LifeTrajectoryPanel';
import { NetworkBrokeragePanel } from './NetworkBrokeragePanel';

interface SupremacyDashboardV2Props {
  profileId?: string;
}

const CAPABILITY_DOMAINS = [
  { id: 'negotiation', label: 'Tactical Negotiation', icon: Target, color: 'text-red-500', description: 'FBI-inspired tactics' },
  { id: 'attachment', label: 'Attachment Analysis', icon: Heart, color: 'text-pink-500', description: 'Vulnerability mapping' },
  { id: 'chronotype', label: 'Chronotype Intel', icon: Clock, color: 'text-blue-500', description: 'Strategic timing' },
  { id: 'trajectory', label: 'Life Trajectory', icon: TrendingUp, color: 'text-green-500', description: 'Predictive forecasting' },
  { id: 'brokerage', label: 'Network Brokerage', icon: Network, color: 'text-purple-500', description: 'Structural advantages' },
];

export function SupremacyDashboardV2({ profileId }: SupremacyDashboardV2Props) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Supremacy Command</h1>
            <p className="text-muted-foreground">AGIS Phase 2 - Absolute Superiority</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
          <Zap className="h-3 w-3 mr-1" />
          12 Active Capabilities
        </Badge>
      </div>

      {/* Capability Grid */}
      <div className="grid grid-cols-5 gap-3">
        {CAPABILITY_DOMAINS.map((domain) => (
          <Card 
            key={domain.id}
            className={`cursor-pointer transition-all hover:scale-105 ${activeTab === domain.id ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveTab(domain.id)}
          >
            <CardContent className="p-4 text-center">
              <domain.icon className={`h-6 w-6 mx-auto mb-2 ${domain.color}`} />
              <p className="text-sm font-medium">{domain.label}</p>
              <p className="text-xs text-muted-foreground">{domain.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="negotiation">Negotiation</TabsTrigger>
          <TabsTrigger value="attachment">Attachment</TabsTrigger>
          <TabsTrigger value="chronotype">Chronotype</TabsTrigger>
          <TabsTrigger value="trajectory">Trajectory</TabsTrigger>
          <TabsTrigger value="brokerage">Brokerage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewPanel profileId={profileId} />
        </TabsContent>

        <TabsContent value="negotiation" className="mt-6">
          <TacticalNegotiationPanel profileId={profileId || ''} />
        </TabsContent>

        <TabsContent value="attachment" className="mt-6">
          <AttachmentVulnerabilityPanel profileId={profileId || ''} />
        </TabsContent>

        <TabsContent value="chronotype" className="mt-6">
          <ChronotypePanel profileId={profileId || ''} />
        </TabsContent>

        <TabsContent value="trajectory" className="mt-6">
          <LifeTrajectoryPanel profileId={profileId || ''} />
        </TabsContent>

        <TabsContent value="brokerage" className="mt-6">
          <NetworkBrokeragePanel profileId={profileId || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewPanel({ profileId }: { profileId?: string }) {
  const stats = [
    { label: 'Active Analyses', value: '24', change: '+3', icon: Brain },
    { label: 'Vulnerability Windows', value: '7', change: 'Active', icon: Shield },
    { label: 'Influence Score', value: '87%', change: '+12%', icon: Crown },
    { label: 'Network Control', value: '0.73', change: '+0.08', icon: Network },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">{stat.change}</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Intelligence Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {[
                { time: '2m ago', action: 'Vulnerability window detected', target: 'Contact A', type: 'alert' },
                { time: '15m ago', action: 'Negotiation strategy generated', target: 'Deal #47', type: 'success' },
                { time: '1h ago', action: 'Chronotype analysis completed', target: 'Contact B', type: 'info' },
                { time: '2h ago', action: 'Network position calculated', target: 'Your Network', type: 'info' },
                { time: '3h ago', action: 'Life trajectory predicted', target: 'Contact C', type: 'warning' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'alert' ? 'bg-red-500' :
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.target}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default SupremacyDashboardV2;
