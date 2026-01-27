/**
 * HypergameVisualizer Component (v9.0)
 * 
 * Visualizes multi-level strategic games and perception gaps.
 * Supports Level-N belief modeling and Nash equilibrium analysis.
 */

import React, { useState, useMemo } from 'react';
import { Layers, Target, GitBranch, AlertTriangle, Play, Pause, RotateCcw, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useHypergameTheory } from '@/hooks/intelligence/useHypergameTheory';
import { cn } from '@/lib/utils';

interface HypergameVisualizerProps {
  profileId?: string;
  className?: string;
}

interface Player {
  id: string;
  name: string;
  level: number;
  perceivedGame: string;
  strategies: string[];
  currentStrategy?: string;
}

interface PerceptionGap {
  fromPlayer: string;
  toPlayer: string;
  gapType: string;
  magnitude: number;
  exploitability: number;
}

export function HypergameVisualizer({ profileId, className }: HypergameVisualizerProps) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('structure');
  const [hypergameResult, setHypergameResult] = useState<{ equilibriumType?: string; stability?: number; exploitable?: boolean } | null>(null);
  
  const {
    modelHypergame,
    findPerceptionGaps,
    isAnalyzing: isModeling,
  } = useHypergameTheory(profileId ? [profileId] : undefined);

  // Sample players for demonstration
  const players: Player[] = useMemo(() => [
    {
      id: 'self',
      name: 'Self (Analyst)',
      level: 2,
      perceivedGame: 'Information Asymmetry',
      strategies: ['Reveal', 'Conceal', 'Deceive', 'Signal'],
      currentStrategy: 'Signal',
    },
    {
      id: 'target',
      name: 'Target',
      level: 1,
      perceivedGame: 'Trust Building',
      strategies: ['Cooperate', 'Defect', 'Test', 'Withdraw'],
      currentStrategy: 'Test',
    },
    {
      id: 'adversary',
      name: 'Adversary',
      level: 0,
      perceivedGame: 'Zero-Sum Competition',
      strategies: ['Attack', 'Defend', 'Feint', 'Observe'],
      currentStrategy: 'Observe',
    },
  ], []);

  // Sample perception gaps
  const gaps: PerceptionGap[] = useMemo(() => [
    {
      fromPlayer: 'Target',
      toPlayer: 'Self',
      gapType: 'Strategy Space',
      magnitude: 0.72,
      exploitability: 0.85,
    },
    {
      fromPlayer: 'Adversary',
      toPlayer: 'Target',
      gapType: 'Payoff Structure',
      magnitude: 0.45,
      exploitability: 0.62,
    },
    {
      fromPlayer: 'Target',
      toPlayer: 'Adversary',
      gapType: 'Information Set',
      magnitude: 0.58,
      exploitability: 0.41,
    },
  ], []);

  const maxLevel = Math.max(...players.map(p => p.level));

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const formattedPlayers = players.map(p => ({
        id: p.id,
        name: p.name,
        profileId: p.id,
        strategies: p.strategies,
        perceivedGame: {
          players: players.map(pl => pl.id),
          strategies: players.reduce((acc, pl) => {
            acc[pl.id] = pl.strategies;
            return acc;
          }, {} as Record<string, string[]>),
          payoffs: players.reduce((acc, pl) => {
            acc[pl.id] = pl.strategies.reduce((s, strat, i) => {
              s[strat] = 3 - i;
              return s;
            }, {} as Record<string, number>);
            return acc;
          }, {} as Record<string, Record<string, number>>),
        },
        beliefLevel: p.level,
      }));
      
      const result = modelHypergame(formattedPlayers);
      setHypergameResult({
        equilibriumType: result.equilibria?.[0]?.isStrong ? 'Strong HNE' : 'Weak HNE',
        stability: result.equilibria?.[0]?.stability || 0.75,
        exploitable: result.exploitableAsymmetries?.length > 0,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Hypergame Visualizer
        </CardTitle>
        <CardDescription>
          Multi-level strategic game analysis with perception gap detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Level Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Analysis Depth (Level-N)</span>
            <Badge variant="outline">Level {selectedLevel}</Badge>
          </div>
          <Slider
            value={[selectedLevel]}
            onValueChange={([v]) => setSelectedLevel(v)}
            min={0}
            max={maxLevel + 1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>L0: Actual Game</span>
            <span>L{maxLevel + 1}: Meta-awareness</span>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunSimulation}
            disabled={isModeling || isSimulating}
            size="sm"
            className="flex-1"
          >
            {isModeling || isSimulating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Computing HNE...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Simulation
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedLevel(0)}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structure" className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              Structure
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Gaps
            </TabsTrigger>
            <TabsTrigger value="equilibria" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Equilibria
            </TabsTrigger>
          </TabsList>

          {/* Game Structure Tab */}
          <TabsContent value="structure" className="space-y-3">
            {/* Visual Game Tree */}
            <div className="relative rounded-lg border bg-muted/20 p-4 min-h-[200px]">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Simplified tree visualization */}
                <div className="flex flex-col items-center gap-4">
                  {/* Level indicators */}
                  {[...Array(maxLevel + 2)].map((_, level) => (
                    <div 
                      key={level}
                      className={cn(
                        'flex items-center gap-4 transition-opacity',
                        level > selectedLevel ? 'opacity-30' : 'opacity-100'
                      )}
                    >
                      <span className="text-xs text-muted-foreground w-12">L{level}</span>
                      <div className="flex gap-2">
                        {players
                          .filter(p => p.level >= level || level === 0)
                          .map(player => (
                            <div
                              key={`${level}-${player.id}`}
                              className={cn(
                                'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                                player.level === level 
                                  ? 'bg-primary/20 border-primary text-primary' 
                                  : 'bg-muted/50 border-muted-foreground/20',
                                level <= selectedLevel ? 'scale-100' : 'scale-90'
                              )}
                            >
                              {player.name}
                              {player.currentStrategy && level === player.level && (
                                <span className="ml-1 opacity-60">→ {player.currentStrategy}</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Player Details */}
            <div className="grid gap-2">
              {players.map(player => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded border bg-muted/30"
                >
                  <div>
                    <div className="font-medium text-sm">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Perceives: {player.perceivedGame}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">L{player.level}</Badge>
                    {player.level < selectedLevel ? (
                      <Eye className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Perception Gaps Tab */}
          <TabsContent value="gaps" className="space-y-3">
            {gaps.map((gap, i) => (
              <div 
                key={i}
                className={cn(
                  'rounded-lg border p-3 space-y-2',
                  gap.exploitability > 0.7 ? 'border-amber-500/50 bg-amber-500/5' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{gap.fromPlayer}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{gap.toPlayer}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {gap.gapType}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Magnitude</span>
                      <span>{(gap.magnitude * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={gap.magnitude * 100} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Exploitability</span>
                      <span className={gap.exploitability > 0.7 ? 'text-amber-500' : ''}>
                        {(gap.exploitability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={gap.exploitability * 100} 
                      className={cn(
                        'h-1.5',
                        gap.exploitability > 0.7 ? '[&>div]:bg-amber-500' : ''
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            {gaps.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No perception gaps detected</p>
              </div>
            )}
          </TabsContent>

          {/* Equilibria Tab */}
          <TabsContent value="equilibria" className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Nash Equilibria Analysis
              </h4>

              {hypergameResult ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Equilibrium Type</span>
                    <Badge>{hypergameResult.equilibriumType || 'Strong HNE'}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stability</span>
                    <span className="font-medium">
                      {((hypergameResult.stability || 0.75) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exploitable</span>
                    <Badge variant={hypergameResult.exploitable ? 'destructive' : 'secondary'}>
                      {hypergameResult.exploitable ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Strong HNE</span>
                    <Badge variant="default">Stable</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weak HNE</span>
                    <Badge variant="secondary">2 Found</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deception Potential</span>
                    <Badge variant="outline">High at L{selectedLevel}</Badge>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  At Level-{selectedLevel}, {selectedLevel > 0 ? 'higher-level players' : 'all players'} have 
                  {selectedLevel > 1 ? ' significant' : ' limited'} strategic advantage through 
                  perception gap exploitation.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
