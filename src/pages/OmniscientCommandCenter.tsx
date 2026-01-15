import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Bot, Network, Shield, Zap, Activity, Target, Brain } from 'lucide-react';
import { AutonomousOperationsPanel } from '@/components/intelligence/phase5/AutonomousOperationsPanel';
import { NetworkWarfarePanel } from '@/components/intelligence/phase5/NetworkWarfarePanel';
import { CounterIntelligencePanel } from '@/components/intelligence/phase5/CounterIntelligencePanel';
import { PredictiveInterventionPanel } from '@/components/intelligence/phase5/PredictiveInterventionPanel';
import { useAutonomousOperations } from '@/hooks/intelligence/useAutonomousOperations';
import { useNetworkWarfare } from '@/hooks/intelligence/useNetworkWarfare';
import { useCounterIntelligence } from '@/hooks/intelligence/useCounterIntelligence';
import { usePredictiveIntervention } from '@/hooks/intelligence/usePredictiveIntervention';

export default function OmniscientCommandCenter() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  const { activeCampaigns, executions } = useAutonomousOperations();
  const { activeCascades } = useNetworkWarfare();
  const { criticalThreats } = useCounterIntelligence();
  const { activeWindows } = usePredictiveIntervention();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout title="Omniscient Command">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
              <Eye className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                AGIS Phase 5: Omniscient Command
              </h1>
              <p className="text-sm text-muted-foreground">
                Autonomous • Network Warfare • Counter-Intelligence • Predictive Intervention
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-violet-500/50 text-violet-400">
            <Activity className="h-3 w-3 mr-1 animate-pulse" />
            OMNISCIENT MODE
          </Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-muted-foreground">Active Campaigns</span>
              </div>
              <p className="text-2xl font-bold text-blue-400 mt-1">{activeCampaigns?.length || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-muted-foreground">Active Cascades</span>
              </div>
              <p className="text-2xl font-bold text-purple-400 mt-1">{activeCascades?.length || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                <span className="text-xs text-muted-foreground">Critical Threats</span>
              </div>
              <p className="text-2xl font-bold text-red-400 mt-1">{criticalThreats?.length || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-muted-foreground">Open Opportunities</span>
              </div>
              <p className="text-2xl font-bold text-amber-400 mt-1">{activeWindows?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="autonomous" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="autonomous" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Autonomous</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
            <TabsTrigger value="counter-intel" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Counter-Intel</span>
            </TabsTrigger>
            <TabsTrigger value="predictive" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Predictive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="autonomous">
            <AutonomousOperationsPanel />
          </TabsContent>
          <TabsContent value="network">
            <NetworkWarfarePanel />
          </TabsContent>
          <TabsContent value="counter-intel">
            <CounterIntelligencePanel />
          </TabsContent>
          <TabsContent value="predictive">
            <PredictiveInterventionPanel />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
