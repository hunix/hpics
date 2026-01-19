import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, AlertTriangle, Eye, Scale, Siren, Activity, 
  Users, DollarSign, Radio, Fingerprint, Target, Brain
} from 'lucide-react';

import { OpsecDashboard } from '@/components/warfare/OpsecDashboard';
import { CrisisResponsePanel } from '@/components/warfare/CrisisResponsePanel';
import { SocialEngineeringDetector } from '@/components/warfare/SocialEngineeringDetector';
import { ReputationDefensePanel } from '@/components/warfare/ReputationDefensePanel';
import { LawfareDefensePanel } from '@/components/warfare/LawfareDefensePanel';
import { BehavioralBaselinePanel } from '@/components/warfare/BehavioralBaselinePanel';

export default function WarfarePage() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Warfare & Defense Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive security operations, threat detection, and defensive countermeasures
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          v5.0
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="opsec" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            OPSEC
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Social Eng
          </TabsTrigger>
          <TabsTrigger value="crisis" className="flex items-center gap-2">
            <Siren className="h-4 w-4" />
            Crisis
          </TabsTrigger>
          <TabsTrigger value="reputation" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reputation
          </TabsTrigger>
          <TabsTrigger value="lawfare" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Lawfare
          </TabsTrigger>
          <TabsTrigger value="behavioral" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Behavioral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-3 gap-6">
            <OverviewCard
              icon={<Shield className="h-6 w-6" />}
              title="OPSEC Analysis"
              description="Operational security vulnerability assessment"
              status="operational"
              onClick={() => setActiveTab('opsec')}
            />
            <OverviewCard
              icon={<Users className="h-6 w-6" />}
              title="Social Engineering"
              description="Detect and analyze manipulation attempts"
              status="operational"
              onClick={() => setActiveTab('social')}
            />
            <OverviewCard
              icon={<Siren className="h-6 w-6" />}
              title="Crisis Response"
              description="Manage and respond to active crisis events"
              status="operational"
              onClick={() => setActiveTab('crisis')}
            />
            <OverviewCard
              icon={<Eye className="h-6 w-6" />}
              title="Reputation Defense"
              description="Monitor and protect against reputation attacks"
              status="operational"
              onClick={() => setActiveTab('reputation')}
            />
            <OverviewCard
              icon={<Scale className="h-6 w-6" />}
              title="Lawfare Defense"
              description="Legal threat analysis and defense strategies"
              status="operational"
              onClick={() => setActiveTab('lawfare')}
            />
            <OverviewCard
              icon={<Activity className="h-6 w-6" />}
              title="Behavioral Analysis"
              description="Baseline monitoring and anomaly detection"
              status="operational"
              onClick={() => setActiveTab('behavioral')}
            />
            <OverviewCard
              icon={<DollarSign className="h-6 w-6" />}
              title="Economic Warfare"
              description="Detect financial and economic attacks"
              status="available"
            />
            <OverviewCard
              icon={<Radio className="h-6 w-6" />}
              title="TSCM Sweeps"
              description="Technical surveillance countermeasures"
              status="available"
            />
            <OverviewCard
              icon={<Fingerprint className="h-6 w-6" />}
              title="Digital Footprint"
              description="Exposure scanning and remediation"
              status="available"
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Warfare Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Active Threats" value="0" trend="stable" />
                <StatCard label="OPSEC Score" value="--" trend="unknown" />
                <StatCard label="Crisis Events" value="0" trend="stable" />
                <StatCard label="Reputation Health" value="--" trend="unknown" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opsec">
          <OpsecDashboard />
        </TabsContent>

        <TabsContent value="social">
          <SocialEngineeringDetector />
        </TabsContent>

        <TabsContent value="crisis">
          <CrisisResponsePanel />
        </TabsContent>

        <TabsContent value="reputation">
          <ReputationDefensePanel />
        </TabsContent>

        <TabsContent value="lawfare">
          <LawfareDefensePanel />
        </TabsContent>

        <TabsContent value="behavioral">
          <BehavioralBaselinePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewCard({ 
  icon, title, description, status, onClick 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  status: 'operational' | 'available' | 'offline';
  onClick?: () => void;
}) {
  const statusColors = {
    operational: 'bg-green-500',
    available: 'bg-blue-500',
    offline: 'bg-muted'
  };

  return (
    <Card 
      className={`cursor-pointer hover:border-primary/50 transition-colors ${onClick ? '' : 'opacity-75'}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <div className={`h-3 w-3 rounded-full ${statusColors[status]}`} />
        </div>
        <h3 className="font-semibold mt-4">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatCard({ 
  label, value, trend 
}: { 
  label: string; 
  value: string; 
  trend: 'up' | 'down' | 'stable' | 'unknown';
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-destructive',
    stable: 'text-muted-foreground',
    unknown: 'text-muted-foreground'
  };

  return (
    <div className="text-center p-4 bg-muted/30 rounded-lg">
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-sm ${trendColors[trend]}`}>{label}</div>
    </div>
  );
}
