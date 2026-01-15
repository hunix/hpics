/**
 * Narrative Warfare Simulator
 * Monte Carlo simulation of competing narratives
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Swords, Play, Pause, RotateCcw, TrendingUp, Users, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Narrative {
  id: string;
  name: string;
  description: string;
  initialPenetration: number;
  virality: number; // R0 equivalent
  resilience: number; // Resistance to counter-narratives
  color: string;
}

interface SimulationStep {
  step: number;
  [key: string]: number; // narrative_id: penetration
}

interface AudienceSegment {
  id: string;
  name: string;
  size: number;
  susceptibility: Record<string, number>; // narrative_id: susceptibility (0-1)
}

export function NarrativeWarfareSimulator() {
  const [narratives, setNarratives] = useState<Narrative[]>([
    {
      id: 'narrative_a',
      name: 'Your Narrative',
      description: 'The narrative you want to propagate',
      initialPenetration: 10,
      virality: 1.3,
      resilience: 0.7,
      color: 'hsl(var(--primary))',
    },
    {
      id: 'narrative_b',
      name: 'Counter Narrative',
      description: 'Competing narrative from opposition',
      initialPenetration: 20,
      virality: 1.1,
      resilience: 0.6,
      color: 'hsl(var(--destructive))',
    },
  ]);

  const [audienceSegments] = useState<AudienceSegment[]>([
    { id: 'seg_1', name: 'Core Supporters', size: 20, susceptibility: { narrative_a: 0.9, narrative_b: 0.2 } },
    { id: 'seg_2', name: 'Swing Population', size: 50, susceptibility: { narrative_a: 0.5, narrative_b: 0.5 } },
    { id: 'seg_3', name: 'Opposition Base', size: 30, susceptibility: { narrative_a: 0.2, narrative_b: 0.8 } },
  ]);

  const [simulationData, setSimulationData] = useState<SimulationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState([50]);
  const [simulationCount, setSimulationCount] = useState(100);
  const animationRef = useRef<number>();

  // New narrative form
  const [newNarrativeName, setNewNarrativeName] = useState('');
  const [newNarrativeDesc, setNewNarrativeDesc] = useState('');

  // Run Monte Carlo simulation
  const runSimulation = () => {
    const steps: SimulationStep[] = [];
    const maxSteps = 50;
    
    // Initialize penetration tracking
    const penetration: Record<string, number[]> = {};
    narratives.forEach(n => {
      penetration[n.id] = [n.initialPenetration];
    });

    // Run simulation steps
    for (let step = 1; step <= maxSteps; step++) {
      narratives.forEach(narrative => {
        const prevPen = penetration[narrative.id][step - 1];
        const available = 100 - prevPen;
        
        // Calculate growth based on virality and remaining audience
        const growth = (prevPen / 100) * narrative.virality * (available / 100) * 100;
        
        // Calculate resistance from competing narratives
        const resistance = narratives
          .filter(n => n.id !== narrative.id)
          .reduce((sum, n) => {
            const competitorPen = penetration[n.id][step - 1];
            return sum + (competitorPen / 100) * (1 - narrative.resilience) * 5;
          }, 0);
        
        // Apply random variation (Monte Carlo)
        const randomFactor = 0.9 + Math.random() * 0.2;
        
        const newPen = Math.max(0, Math.min(100, 
          prevPen + (growth - resistance) * randomFactor
        ));
        
        penetration[narrative.id].push(newPen);
      });

      const stepData: SimulationStep = { step };
      narratives.forEach(n => {
        stepData[n.id] = parseFloat(penetration[n.id][step].toFixed(2));
      });
      steps.push(stepData);
    }

    setSimulationData(steps);
    setCurrentStep(0);
    toast.success(`Simulation complete: ${maxSteps} steps`);
  };

  // Animation effect
  useEffect(() => {
    if (!isRunning || simulationData.length === 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    let lastTime = 0;
    const interval = 200 - speed[0] * 1.8;

    const animate = (time: number) => {
      if (time - lastTime > interval) {
        lastTime = time;
        setCurrentStep(prev => {
          if (prev >= simulationData.length - 1) {
            setIsRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRunning, speed, simulationData.length]);

  const updateNarrative = (id: string, field: keyof Narrative, value: any) => {
    setNarratives(prev => prev.map(n => 
      n.id === id ? { ...n, [field]: value } : n
    ));
  };

  const addNarrative = () => {
    if (!newNarrativeName.trim()) return;
    
    const colors = ['hsl(48, 96%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 67%, 60%)'];
    const newNarrative: Narrative = {
      id: `narrative_${Date.now()}`,
      name: newNarrativeName,
      description: newNarrativeDesc,
      initialPenetration: 5,
      virality: 1.0,
      resilience: 0.5,
      color: colors[narratives.length % colors.length],
    };
    
    setNarratives(prev => [...prev, newNarrative]);
    setNewNarrativeName('');
    setNewNarrativeDesc('');
    toast.success('Narrative added');
  };

  const removeNarrative = (id: string) => {
    if (narratives.length <= 2) {
      toast.error('Minimum 2 narratives required');
      return;
    }
    setNarratives(prev => prev.filter(n => n.id !== id));
  };

  const currentData = simulationData.slice(0, currentStep + 1);
  const finalData = simulationData[simulationData.length - 1];
  
  const winner = finalData 
    ? narratives.reduce((a, b) => 
        (finalData[a.id] || 0) > (finalData[b.id] || 0) ? a : b
      )
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Narrative Warfare Simulator</CardTitle>
        </div>
        <CardDescription>Monte Carlo simulation of competing narrative penetration</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configure</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            {/* Existing Narratives */}
            {narratives.map((narrative) => (
              <div key={narrative.id} className="p-4 rounded-lg border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: narrative.color }} />
                    <Input
                      value={narrative.name}
                      onChange={(e) => updateNarrative(narrative.id, 'name', e.target.value)}
                      className="h-8 w-48"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeNarrative(narrative.id)}
                    className="text-destructive"
                  >
                    ×
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Initial Penetration</label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[narrative.initialPenetration]}
                        onValueChange={([v]) => updateNarrative(narrative.id, 'initialPenetration', v)}
                        max={50}
                        min={1}
                        className="flex-1"
                      />
                      <span className="text-sm w-8">{narrative.initialPenetration}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Virality (R₀)</label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[narrative.virality * 100]}
                        onValueChange={([v]) => updateNarrative(narrative.id, 'virality', v / 100)}
                        max={200}
                        min={50}
                        className="flex-1"
                      />
                      <span className="text-sm w-10">{narrative.virality.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Resilience</label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[narrative.resilience * 100]}
                        onValueChange={([v]) => updateNarrative(narrative.id, 'resilience', v / 100)}
                        max={100}
                        min={10}
                        className="flex-1"
                      />
                      <span className="text-sm w-10">{(narrative.resilience * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Narrative */}
            <div className="p-4 rounded-lg border border-dashed space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New narrative name"
                  value={newNarrativeName}
                  onChange={(e) => setNewNarrativeName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addNarrative} disabled={!newNarrativeName.trim()}>
                  Add Narrative
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="simulate" className="space-y-4 mt-4">
            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button onClick={runSimulation} variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Run Simulation
              </Button>
              <Button
                onClick={() => setIsRunning(!isRunning)}
                disabled={simulationData.length === 0}
                variant={isRunning ? 'destructive' : 'default'}
              >
                {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? 'Pause' : 'Animate'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setCurrentStep(0); setIsRunning(false); }}
                disabled={simulationData.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Speed:</span>
                <Slider value={speed} onValueChange={setSpeed} max={100} min={10} className="w-32" />
              </div>
              <Badge variant="outline">Step: {currentStep}</Badge>
            </div>

            {/* Chart */}
            {simulationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="step" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  {narratives.map((narrative) => (
                    <Area
                      key={narrative.id}
                      type="monotone"
                      dataKey={narrative.id}
                      name={narrative.name}
                      stroke={narrative.color}
                      fill={narrative.color}
                      fillOpacity={0.3}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Run simulation to see results</p>
                </div>
              </div>
            )}

            {/* Current State */}
            {currentData.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {narratives.map((narrative) => {
                  const currentPen = currentData[currentData.length - 1]?.[narrative.id] || 0;
                  return (
                    <div key={narrative.id} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: narrative.color }} />
                        <span className="font-medium">{narrative.name}</span>
                      </div>
                      <div className="text-2xl font-bold">{currentPen.toFixed(1)}%</div>
                      <div className="w-full h-2 rounded-full bg-muted mt-2">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${currentPen}%`, backgroundColor: narrative.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {finalData ? (
              <>
                {/* Winner */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    <span className="font-medium">Dominant Narrative</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: winner?.color }} />
                    <span className="text-xl font-bold">{winner?.name}</span>
                    <Badge variant="secondary">{finalData[winner?.id || '']?.toFixed(1)}% penetration</Badge>
                  </div>
                </div>

                {/* Final Results */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Final Penetration Scores</label>
                  {narratives
                    .sort((a, b) => (finalData[b.id] || 0) - (finalData[a.id] || 0))
                    .map((narrative, idx) => (
                      <div key={narrative.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <span className="text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: narrative.color }} />
                        <span className="flex-1 font-medium">{narrative.name}</span>
                        <span className="text-lg font-bold">{finalData[narrative.id]?.toFixed(1)}%</span>
                        <Badge variant={idx === 0 ? 'default' : 'outline'}>
                          {idx === 0 ? 'Winner' : `${((finalData[narrative.id] / finalData[narratives[0].id]) * 100).toFixed(0)}% of leader`}
                        </Badge>
                      </div>
                    ))}
                </div>

                {/* Recommendations */}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <label className="text-sm font-medium mb-2 block">Strategic Recommendations</label>
                  <ul className="space-y-2 text-sm">
                    {narratives[0].id !== winner?.id && (
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Increase virality of your narrative (current R₀: {narratives[0].virality.toFixed(2)})
                      </li>
                    )}
                    {narratives[0].resilience < 0.7 && (
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Strengthen narrative resilience against counter-narratives
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Focus on swing population segments for maximum impact
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
                <p className="text-muted-foreground">Run simulation to see analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
