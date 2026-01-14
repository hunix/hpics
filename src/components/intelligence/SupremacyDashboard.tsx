/**
 * AGIS Phase 10: Supremacy Dashboard
 * 
 * The ultimate command interface for total situational awareness and control.
 * Integrates all AGIS modules into a unified strategic superiority interface.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Brain, Eye, Target, Shield, Zap, 
  AlertTriangle, TrendingUp, Network, Activity,
  Crosshair, Radar, Globe, Clock, Users, Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThreatIndicator {
  id: string;
  type: 'deception' | 'adversary' | 'network' | 'behavioral';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  description: string;
  confidence: number;
  timestamp: Date;
}

interface StrategicAsset {
  id: string;
  name: string;
  type: 'contact' | 'network' | 'intelligence';
  value: number;
  status: 'active' | 'dormant' | 'compromised';
  influence: number;
}

interface OperationalMetric {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export function SupremacyDashboard() {
  const [activeThreats, setActiveThreats] = useState<ThreatIndicator[]>([]);
  const [strategicAssets, setStrategicAssets] = useState<StrategicAsset[]>([]);
  const [overallSupremacy, setOverallSupremacy] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'optimal' | 'alert' | 'critical'>('optimal');
  
  // Simulated real-time data
  useEffect(() => {
    // Initialize with mock data
    setActiveThreats([
      {
        id: '1',
        type: 'deception',
        severity: 'high',
        source: 'Forensic Analyzer',
        description: 'Linguistic deception patterns detected in recent communication',
        confidence: 0.87,
        timestamp: new Date()
      },
      {
        id: '2',
        type: 'adversary',
        severity: 'medium',
        source: 'Counter-Intelligence',
        description: 'Potential social engineering attempt identified',
        confidence: 0.72,
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '3',
        type: 'network',
        severity: 'low',
        source: 'Network Propagation',
        description: 'Influence cascade opportunity in secondary network',
        confidence: 0.65,
        timestamp: new Date(Date.now() - 7200000)
      }
    ]);
    
    setStrategicAssets([
      { id: '1', name: 'Primary Network', type: 'network', value: 95, status: 'active', influence: 0.92 },
      { id: '2', name: 'Key Contacts', type: 'contact', value: 87, status: 'active', influence: 0.85 },
      { id: '3', name: 'Intel Repository', type: 'intelligence', value: 78, status: 'active', influence: 0.78 }
    ]);
    
    setOverallSupremacy(84);
    setSystemStatus('optimal');
  }, []);

  const operationalMetrics: OperationalMetric[] = [
    { label: 'Network Control', value: 87, trend: 'up', change: 5 },
    { label: 'Intel Quality', value: 92, trend: 'up', change: 3 },
    { label: 'Threat Mitigation', value: 78, trend: 'stable', change: 0 },
    { label: 'Influence Reach', value: 84, trend: 'up', change: 7 },
    { label: 'Counter-Intel', value: 91, trend: 'up', change: 2 },
    { label: 'Predictive Accuracy', value: 89, trend: 'down', change: -2 }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-400';
      case 'alert': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-400 rotate-180" />;
      default: return <Activity className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Supreme Command Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-blue-900/50 border border-purple-500/30 p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(147,51,234,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.15),transparent_50%)]" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
              <Crown className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400">
                AGIS Supremacy Console
              </h1>
              <p className="text-muted-foreground text-sm">
                Absolute General Intelligence System • Total Situational Control
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">{overallSupremacy}%</div>
              <div className="text-xs text-muted-foreground">Supremacy Index</div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full animate-pulse ${
                systemStatus === 'optimal' ? 'bg-green-400' :
                systemStatus === 'alert' ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className={`text-sm font-medium ${getStatusColor(systemStatus)}`}>
                {systemStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Assessment Panel */}
        <Card className="lg:col-span-2 bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <CardTitle className="text-lg">Active Threat Matrix</CardTitle>
            <Badge variant="outline" className="ml-auto">
              {activeThreats.length} Active
            </Badge>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                <AnimatePresence>
                  {activeThreats.map((threat, index) => (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${getSeverityColor(threat.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {threat.type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              via {threat.source}
                            </span>
                          </div>
                          <p className="text-sm">{threat.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {Math.round(threat.confidence * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            confidence
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Strategic Assets Panel */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-lg">Strategic Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {strategicAssets.map((asset) => (
                <div key={asset.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {asset.type === 'network' && <Network className="h-4 w-4 text-purple-400" />}
                      {asset.type === 'contact' && <Users className="h-4 w-4 text-blue-400" />}
                      {asset.type === 'intelligence' && <Brain className="h-4 w-4 text-green-400" />}
                      <span className="text-sm font-medium">{asset.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={asset.status === 'active' ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}
                    >
                      {asset.status}
                    </Badge>
                  </div>
                  <Progress value={asset.value} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Value: {asset.value}%</span>
                    <span>Influence: {Math.round(asset.influence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {operationalMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.trend)}
                    <span className={`text-xs ${
                      metric.change > 0 ? 'text-green-400' : 
                      metric.change < 0 ? 'text-red-400' : 'text-muted-foreground'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold">{metric.value}%</div>
                <Progress value={metric.value} className="h-1 mt-2" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* AGIS Module Status */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <CardTitle className="text-lg">AGIS Module Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cognitive" className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
              <TabsTrigger value="forensic">Forensic</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="predictive">Predictive</TabsTrigger>
              <TabsTrigger value="counter">Counter-Intel</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cognitive" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModuleCard 
                  icon={<Brain className="h-5 w-5" />}
                  name="Hypnotic Patterns"
                  status="active"
                  efficiency={94}
                />
                <ModuleCard 
                  icon={<Zap className="h-5 w-5" />}
                  name="Conditioning"
                  status="active"
                  efficiency={88}
                />
                <ModuleCard 
                  icon={<Target className="h-5 w-5" />}
                  name="Cognitive Load"
                  status="active"
                  efficiency={91}
                />
                <ModuleCard 
                  icon={<Eye className="h-5 w-5" />}
                  name="Subliminal"
                  status="active"
                  efficiency={86}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="forensic" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModuleCard 
                  icon={<Eye className="h-5 w-5" />}
                  name="Micro-Expression"
                  status="active"
                  efficiency={92}
                />
                <ModuleCard 
                  icon={<Activity className="h-5 w-5" />}
                  name="Voice Stress"
                  status="active"
                  efficiency={89}
                />
                <ModuleCard 
                  icon={<Brain className="h-5 w-5" />}
                  name="Statement Analysis"
                  status="active"
                  efficiency={95}
                />
                <ModuleCard 
                  icon={<Crosshair className="h-5 w-5" />}
                  name="Pupillometry"
                  status="active"
                  efficiency={87}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="network" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModuleCard 
                  icon={<Network className="h-5 w-5" />}
                  name="Influence Prop"
                  status="active"
                  efficiency={90}
                />
                <ModuleCard 
                  icon={<Globe className="h-5 w-5" />}
                  name="Network Analysis"
                  status="active"
                  efficiency={93}
                />
                <ModuleCard 
                  icon={<Users className="h-5 w-5" />}
                  name="Social Graph"
                  status="active"
                  efficiency={88}
                />
                <ModuleCard 
                  icon={<Radar className="h-5 w-5" />}
                  name="Proximity Intel"
                  status="active"
                  efficiency={85}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="predictive" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModuleCard 
                  icon={<Brain className="h-5 w-5" />}
                  name="MDP Predictor"
                  status="active"
                  efficiency={91}
                />
                <ModuleCard 
                  icon={<Network className="h-5 w-5" />}
                  name="Bayesian Network"
                  status="active"
                  efficiency={89}
                />
                <ModuleCard 
                  icon={<Target className="h-5 w-5" />}
                  name="Game Theory"
                  status="active"
                  efficiency={94}
                />
                <ModuleCard 
                  icon={<Clock className="h-5 w-5" />}
                  name="Temporal Model"
                  status="active"
                  efficiency={87}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="counter" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ModuleCard 
                  icon={<Shield className="h-5 w-5" />}
                  name="Adversary Profiler"
                  status="active"
                  efficiency={93}
                />
                <ModuleCard 
                  icon={<Eye className="h-5 w-5" />}
                  name="Deepfake Detect"
                  status="active"
                  efficiency={96}
                />
                <ModuleCard 
                  icon={<Lock className="h-5 w-5" />}
                  name="OPSEC Monitor"
                  status="active"
                  efficiency={91}
                />
                <ModuleCard 
                  icon={<AlertTriangle className="h-5 w-5" />}
                  name="Threat Intel"
                  status="active"
                  efficiency={88}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-component for module cards
function ModuleCard({ 
  icon, 
  name, 
  status, 
  efficiency 
}: { 
  icon: React.ReactNode; 
  name: string; 
  status: 'active' | 'standby' | 'offline'; 
  efficiency: number;
}) {
  return (
    <div className="p-3 rounded-lg bg-background/50 border border-border/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${
          status === 'active' ? 'bg-green-500/20 text-green-400' :
          status === 'standby' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {icon}
        </div>
        <span className="text-sm font-medium truncate">{name}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`${
          status === 'active' ? 'text-green-400' :
          status === 'standby' ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {status.toUpperCase()}
        </span>
        <span className="text-muted-foreground">{efficiency}%</span>
      </div>
      <Progress value={efficiency} className="h-1 mt-2" />
    </div>
  );
}
