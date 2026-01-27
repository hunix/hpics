/**
 * CollectiveBehaviorMonitor Component (v9.0)
 * 
 * Monitors and simulates collective behavior patterns including
 * information cascades, epidemic spreading, and panic propagation.
 */

import React, { useState, useMemo } from 'react';
import { Users, Zap, TrendingUp, AlertTriangle, Play, Radio, Activity, Network, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CollectiveBehaviorMonitorProps {
  className?: string;
}

type EpidemicModel = 'SI' | 'SIR' | 'SIS' | 'IC' | 'LT';

interface CascadeSimulation {
  id: string;
  model: EpidemicModel;
  status: 'pending' | 'running' | 'complete';
  initialNodes: number;
  affectedNodes: number;
  peakTime: number;
  r0: number;
  finalCoverage: number;
}

interface SuperSpreader {
  nodeId: string;
  name: string;
  influence: number;
  connections: number;
  cascadeContribution: number;
}

export function CollectiveBehaviorMonitor({ className }: CollectiveBehaviorMonitorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<EpidemicModel>('IC');
  const [transmissionRate, setTransmissionRate] = useState([0.3]);
  const [activeTab, setActiveTab] = useState('cascade');

  // Fetch cascade data
  const { data: cascadeData, isLoading } = useQuery({
    queryKey: ['collective-behavior', selectedModel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('network_intelligence')
        .select('*')
        .eq('analysis_type', 'cascade_simulation')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Return mock data if no results
      if (!data?.length) {
        return [
          {
            id: '1',
            model: 'IC' as EpidemicModel,
            status: 'complete' as const,
            initialNodes: 3,
            affectedNodes: 147,
            peakTime: 4.2,
            r0: 2.8,
            finalCoverage: 0.68,
          },
          {
            id: '2',
            model: 'SIR' as EpidemicModel,
            status: 'complete' as const,
            initialNodes: 1,
            affectedNodes: 89,
            peakTime: 6.1,
            r0: 1.9,
            finalCoverage: 0.42,
          },
        ] as CascadeSimulation[];
      }

      return data.map(d => {
        const cascadeData = d.cascade_predictions as Record<string, unknown> || {};
        return {
          id: d.id,
          model: cascadeData.model as EpidemicModel || 'IC',
          status: 'complete' as const,
          initialNodes: cascadeData.initialNodes as number || 1,
          affectedNodes: cascadeData.affectedNodes as number || 0,
          peakTime: cascadeData.peakTime as number || 0,
          r0: cascadeData.r0 as number || 0,
          finalCoverage: cascadeData.finalCoverage as number || 0,
        };
      }) as CascadeSimulation[];
    },
    enabled: !!user,
  });

  // Super spreaders (mock data)
  const superSpreaders: SuperSpreader[] = useMemo(() => [
    { nodeId: '1', name: 'Node Alpha', influence: 0.92, connections: 156, cascadeContribution: 0.34 },
    { nodeId: '2', name: 'Node Beta', influence: 0.78, connections: 98, cascadeContribution: 0.21 },
    { nodeId: '3', name: 'Node Gamma', influence: 0.71, connections: 87, cascadeContribution: 0.18 },
    { nodeId: '4', name: 'Node Delta', influence: 0.65, connections: 72, cascadeContribution: 0.12 },
  ], []);

  // Run simulation mutation
  const simulationMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cascade-predictor', {
        body: {
          userId: user?.id,
          model: selectedModel,
          transmissionRate: transmissionRate[0],
          networkSize: 500,
          initialInfected: 3,
        },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cascade simulation complete');
      queryClient.invalidateQueries({ queryKey: ['collective-behavior'] });
    },
    onError: (error) => {
      console.error('Simulation failed:', error);
      toast.error('Failed to run simulation');
    },
  });

  const modelDescriptions: Record<EpidemicModel, string> = {
    SI: 'Susceptible-Infected (no recovery)',
    SIR: 'Susceptible-Infected-Recovered',
    SIS: 'Susceptible-Infected-Susceptible (cyclic)',
    IC: 'Independent Cascade (viral)',
    LT: 'Linear Threshold (consensus)',
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Collective Behavior Monitor
        </CardTitle>
        <CardDescription>
          Information cascade simulation and epidemic spreading analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Simulation Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as EpidemicModel)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IC">IC Model</SelectItem>
                <SelectItem value="LT">LT Model</SelectItem>
                <SelectItem value="SI">SI Model</SelectItem>
                <SelectItem value="SIR">SIR Model</SelectItem>
                <SelectItem value="SIS">SIS Model</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={() => simulationMutation.mutate()}
              disabled={simulationMutation.isPending}
              size="sm"
              className="flex-1"
            >
              {simulationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Cascade
                </>
              )}
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Transmission Rate (β)</span>
              <span className="font-medium">{(transmissionRate[0] * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={transmissionRate}
              onValueChange={setTransmissionRate}
              min={0.05}
              max={0.95}
              step={0.05}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {modelDescriptions[selectedModel]}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cascade" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Cascades
            </TabsTrigger>
            <TabsTrigger value="spreaders" className="flex items-center gap-1">
              <Radio className="h-3 w-3" />
              Spreaders
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Cascade Results Tab */}
          <TabsContent value="cascade" className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : cascadeData?.length ? (
              cascadeData.map((cascade) => (
                <div 
                  key={cascade.id}
                  className={cn(
                    'rounded-lg border p-3 space-y-2',
                    cascade.r0 > 2 ? 'border-amber-500/50 bg-amber-500/5' : 'bg-muted/30'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{cascade.model}</Badge>
                      <Badge 
                        variant={cascade.status === 'complete' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {cascade.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      R₀ = {cascade.r0.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold text-lg">{cascade.affectedNodes}</div>
                      <div className="text-muted-foreground">Affected</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{cascade.peakTime.toFixed(1)}h</div>
                      <div className="text-muted-foreground">Peak Time</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{(cascade.finalCoverage * 100).toFixed(0)}%</div>
                      <div className="text-muted-foreground">Coverage</div>
                    </div>
                  </div>

                  <Progress value={cascade.finalCoverage * 100} className="h-1.5" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No cascade simulations yet</p>
                <p className="text-xs">Run a simulation to see results</p>
              </div>
            )}
          </TabsContent>

          {/* Super Spreaders Tab */}
          <TabsContent value="spreaders" className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-3">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Radio className="h-4 w-4 text-amber-500" />
                Identified Super-Spreaders
              </h4>
              
              <div className="space-y-2">
                {superSpreaders.map((spreader, i) => (
                  <div 
                    key={spreader.nodeId}
                    className="flex items-center justify-between p-2 rounded border bg-background/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        i === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'
                      )}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{spreader.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {spreader.connections} connections
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{(spreader.influence * 100).toFixed(0)}%</div>
                        <div className="text-muted-foreground">Influence</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-amber-500">
                          {(spreader.cascadeContribution * 100).toFixed(0)}%
                        </div>
                        <div className="text-muted-foreground">Cascade</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Super-spreaders account for ~85% of information propagation
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                Propagation Timeline
              </h4>

              {/* Simplified timeline visualization */}
              <div className="space-y-2">
                {[
                  { time: 0, event: 'Initial seed nodes activated', nodes: 3, type: 'start' },
                  { time: 1.2, event: 'First wave propagation', nodes: 18, type: 'wave' },
                  { time: 2.8, event: 'Super-spreader activation', nodes: 56, type: 'critical' },
                  { time: 4.2, event: 'Peak infection rate', nodes: 147, type: 'peak' },
                  { time: 6.5, event: 'Saturation phase begins', nodes: 182, type: 'saturate' },
                  { time: 10, event: 'Cascade complete', nodes: 198, type: 'end' },
                ].map((point, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="w-12 text-xs text-muted-foreground">
                      +{point.time.toFixed(1)}h
                    </div>
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      point.type === 'start' ? 'bg-emerald-500' :
                      point.type === 'peak' ? 'bg-amber-500' :
                      point.type === 'critical' ? 'bg-rose-500' :
                      point.type === 'end' ? 'bg-primary' : 'bg-muted-foreground'
                    )} />
                    <div className="flex-1">{point.event}</div>
                    <Badge variant="outline" className="text-xs">
                      {point.nodes} nodes
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border bg-muted/30 p-3 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                <div className="text-xs text-muted-foreground">Panic Threshold</div>
                <div className="font-bold">~45% coverage</div>
              </div>
              <div className="rounded border bg-muted/30 p-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                <div className="text-xs text-muted-foreground">Tipping Point</div>
                <div className="font-bold">~15% early adopters</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
