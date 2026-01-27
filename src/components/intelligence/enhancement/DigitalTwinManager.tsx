/**
 * Digital Twin Manager (v9.0)
 * 
 * HDTwin cognitive simulation and persona generation management.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Bot, 
  Brain,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle,
  Loader2,
  Clock,
  Cpu
} from 'lucide-react';
import { useDigitalTwin } from '@/hooks/intelligence/useDigitalTwin';

interface DigitalTwinManagerProps {
  profileId?: string;
}

export function DigitalTwinManager({ profileId }: DigitalTwinManagerProps) {
  const {
    twins,
    activeTwin,
    highAccuracyTwins,
    isLoading,
    createTwin,
    simulateScenario,
    syncTwin,
    isCreating,
    isSimulating
  } = useDigitalTwin(profileId);

  const [scenario, setScenario] = useState('');
  const [selectedTwinId, setSelectedTwinId] = useState<string | null>(null);

  const getTwinTypeIcon = (type: string) => {
    switch (type) {
      case 'cognitive': return <Brain className="h-4 w-4" />;
      case 'behavioral': return <User className="h-4 w-4" />;
      case 'social': return <Bot className="h-4 w-4" />;
      case 'full': return <Sparkles className="h-4 w-4" />;
      default: return <Cpu className="h-4 w-4" />;
    }
  };

  const getAccuracyColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    if (score >= 0.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const handleCreateTwin = async (twinType: 'cognitive' | 'behavioral' | 'social' | 'full') => {
    if (!profileId) return;
    await createTwin({ profileId, twinType });
  };

  const handleSimulate = async () => {
    if (!selectedTwinId || !scenario) return;
    await simulateScenario({
      twinId: selectedTwinId,
      scenario,
      conditions: {}
    });
    setScenario('');
  };

  if (isLoading) {
    return (
      <Card className="border-cyan-500/30">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <Bot className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <CardTitle>Digital Twin Manager</CardTitle>
              <CardDescription>HDTwin cognitive simulation & DeepPersona generation</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
            {twins?.length || 0} Twins
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="twins">
          <TabsList className="mb-4">
            <TabsTrigger value="twins">Active Twins</TabsTrigger>
            <TabsTrigger value="simulate">Simulate</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="twins">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {twins?.map(twin => (
                  <div 
                    key={twin.id} 
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      selectedTwinId === twin.id 
                        ? 'border-cyan-500/50 bg-cyan-950/30' 
                        : 'border-border/50 bg-card/50 hover:bg-card/80'
                    }`}
                    onClick={() => setSelectedTwinId(twin.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          {getTwinTypeIcon(twin.twinType)}
                        </div>
                        <div>
                          <p className="font-medium capitalize">{twin.twinType} Twin</p>
                          <p className="text-xs text-muted-foreground">
                            Profile: {twin.profileId.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getAccuracyColor(twin.accuracyScore)}`}>
                            {Math.round(twin.accuracyScore * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            syncTwin(twin.id);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Simulation Fidelity</span>
                        <span>{Math.round(twin.accuracyScore * 100)}%</span>
                      </div>
                      <Progress value={twin.accuracyScore * 100} className="h-1" />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last synced: {new Date(twin.lastSynced).toLocaleString()}
                    </div>
                  </div>
                ))}
                {(!twins || twins.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No digital twins created yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="simulate">
            <Card className="border-border/50">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Selected Twin</p>
                  {selectedTwinId ? (
                    <Badge variant="outline" className="border-cyan-500/50">
                      {twins?.find(t => t.id === selectedTwinId)?.twinType} Twin
                    </Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a twin from the list</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Scenario Description</p>
                  <Input
                    placeholder="Describe the scenario to simulate..."
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  disabled={!selectedTwinId || !scenario || isSimulating}
                  onClick={handleSimulate}
                >
                  {isSimulating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Simulating...</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" />Run Simulation</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create">
            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'cognitive' as const, label: 'Cognitive Twin', desc: 'Decision-making & beliefs' },
                { type: 'behavioral' as const, label: 'Behavioral Twin', desc: 'Actions & patterns' },
                { type: 'social' as const, label: 'Social Twin', desc: 'Relationships & influence' },
                { type: 'full' as const, label: 'Full Twin', desc: 'Complete digital replica' }
              ].map(opt => (
                <Card key={opt.type} className="border-border/50 hover:border-cyan-500/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20">
                          {getTwinTypeIcon(opt.type)}
                        </div>
                        <div>
                          <p className="font-medium">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        disabled={!profileId || isCreating}
                        onClick={() => handleCreateTwin(opt.type)}
                      >
                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
