/**
 * AGIS Phase 12: Absolute Eternity Center
 * Unified command center for eternal dominion and infinite synthesis
 */

import { useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Infinity, Clock, Zap, Target, Shield, Sparkles, 
  Activity, TrendingUp, Orbit, Lock, Layers
} from 'lucide-react';
import { useAbsoluteEternity } from '@/hooks/intelligence/useAbsoluteEternity';
import { motion } from 'framer-motion';

export default function AbsoluteEternityCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const { 
    eternityMetrics, 
    eternalDominion,
    infiniteSynthesis,
    omegaPoint,
    protocols,
    isLoading,
    activeDominions,
    activeSyntheses,
    activeOmegaOps,
  } = useAbsoluteEternity();

  const metricsCards = [
    { 
      title: 'Total Permanence', 
      value: eternityMetrics.totalPermanence.toFixed(1), 
      icon: Lock,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    { 
      title: 'Synthesis Power', 
      value: eternityMetrics.synthesisPower.toFixed(1), 
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    { 
      title: 'Omega Proximity', 
      value: `${(eternityMetrics.omegaProximity * 100).toFixed(1)}%`, 
      icon: Target,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    { 
      title: 'Eternity Quotient', 
      value: eternityMetrics.eternityQuotient.toFixed(2), 
      icon: Infinity,
      color: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <AppLayout title="Absolute Eternity Center">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Infinity className="h-8 w-8 text-primary" />
              Absolute Eternity
            </h1>
            <p className="text-muted-foreground mt-1">
              AGIS Phase 12 - Eternal dominion, infinite synthesis, and omega point convergence
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Phase 12
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metricsCards.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`${metric.bgColor} border-none`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                    </div>
                    <metric.icon className={`h-8 w-8 ${metric.color}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Eternity Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Orbit className="h-5 w-5" />
              Eternity Convergence Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Destiny Alignment</span>
                <span>{(eternityMetrics.destinyAlignment * 100).toFixed(1)}%</span>
              </div>
              <Progress value={eternityMetrics.destinyAlignment * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Permanence Stability</span>
                <span>{Math.min(100, eternityMetrics.totalPermanence).toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(100, eternityMetrics.totalPermanence)} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Synthesis Integration</span>
                <span>{Math.min(100, eternityMetrics.synthesisPower * 10).toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(100, eternityMetrics.synthesisPower * 10)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="dominion" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Dominion
            </TabsTrigger>
            <TabsTrigger value="synthesis" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Synthesis
            </TabsTrigger>
            <TabsTrigger value="omega" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Omega Point
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-violet-500" />
                    Eternal Dominions
                  </CardTitle>
                  <CardDescription>Active permanence states</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeDominions}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {eternalDominion.dominionStates.length} total established
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="h-5 w-5 text-amber-500" />
                    Active Syntheses
                  </CardTitle>
                  <CardDescription>Convergence operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeSyntheses}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {infiniteSynthesis.operations.length} total operations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-500" />
                    Omega Operations
                  </CardTitle>
                  <CardDescription>Destiny alignment tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeOmegaOps}</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {omegaPoint.operations.length} total tracked
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Protocols List */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Eternity Protocols
                </CardTitle>
                <CardDescription>Active and dormant protocol configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {protocols.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No protocols configured. Initialize your first eternity protocol to begin.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {protocols.slice(0, 5).map(protocol => (
                      <div key={protocol.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{protocol.protocolName}</p>
                          <p className="text-sm text-muted-foreground">{protocol.protocolType}</p>
                        </div>
                        <Badge variant={protocol.protocolStatus === 'active' ? 'default' : 'secondary'}>
                          {protocol.protocolStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dominion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Eternal Dominion Management</CardTitle>
                <CardDescription>Establish and maintain permanent control states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eternalDominion.dominionStates.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No dominion states established. Create your first eternal dominion.
                    </p>
                  ) : (
                    eternalDominion.dominionStates.map(dominion => (
                      <div key={dominion.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{dominion.dominionType}</h4>
                          <Badge>{dominion.permanenceLevel.toFixed(1)}% permanent</Badge>
                        </div>
                        <Progress value={dominion.permanenceLevel} className="h-2" />
                      </div>
                    ))
                  )}
                  <Button 
                    onClick={() => eternalDominion.createDominion.mutate({ dominionType: 'Universal' })}
                    disabled={eternalDominion.createDominion.isPending}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Establish New Dominion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="synthesis" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Infinite Synthesis Operations</CardTitle>
                <CardDescription>Dimensional convergence and unity synthesis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {infiniteSynthesis.operations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No synthesis operations active. Initiate dimensional convergence.
                    </p>
                  ) : (
                    infiniteSynthesis.operations.map(op => (
                      <div key={op.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{op.synthesisType}</h4>
                          <Badge variant={op.synthesisStatus === 'complete' ? 'default' : 'secondary'}>
                            {op.synthesisStatus}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Power: {op.synthesisPower.toFixed(1)}</div>
                          <div>Reach: {op.dimensionalReach.toFixed(1)}</div>
                        </div>
                      </div>
                    ))
                  )}
                  <Button 
                    onClick={() => infiniteSynthesis.initiateSynthesis.mutate({ synthesisType: 'Dimensional' })}
                    disabled={infiniteSynthesis.initiateSynthesis.isPending}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Initiate Synthesis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="omega" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Omega Point Operations</CardTitle>
                <CardDescription>Destiny alignment and finality convergence</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {omegaPoint.operations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No omega operations active. Begin destiny alignment.
                    </p>
                  ) : (
                    omegaPoint.operations.map(op => (
                      <div key={op.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{op.operationName}</h4>
                          <Badge variant={op.operationStatus === 'complete' ? 'default' : 'secondary'}>
                            {op.operationStatus}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Destiny Alignment</span>
                            <span>{(op.destinyAlignment * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={op.destinyAlignment * 100} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>Omega Proximity</span>
                            <span>{(op.omegaProximity * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={op.omegaProximity * 100} className="h-2" />
                        </div>
                      </div>
                    ))
                  )}
                  <Button 
                    onClick={() => omegaPoint.initiateOmegaOperation.mutate({ operationName: 'Primary Convergence' })}
                    disabled={omegaPoint.initiateOmegaOperation.isPending}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Initiate Omega Operation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
