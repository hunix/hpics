/**
 * Meta-Learning Synthesis Panel
 * 
 * AGIS Phase 7: Cross-phase pattern recognition, emergence detection, and singularity synthesis
 */

import { useState } from 'react';
import { useMetaLearning, useEmergenceDetection, useCrossPhaseOperations } from '@/hooks/intelligence/transcendent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BrainCircuit, Network, Sparkles, TrendingUp, 
  Activity, Layers, Zap, RefreshCw, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PatternCardProps {
  pattern: {
    id: string;
    patternType: string;
    description?: string;
    confidenceScore: number;
    sourcePhases: number[];
    createdAt: Date;
  };
}

function PatternCard({ pattern }: PatternCardProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    behavioral: <Activity className="h-4 w-4 text-blue-500" />,
    cross_phase: <Network className="h-4 w-4 text-purple-500" />,
    emergent: <Sparkles className="h-4 w-4 text-amber-500" />,
    predictive: <TrendingUp className="h-4 w-4 text-green-500" />,
  };

  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-transparent hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {typeIcons[pattern.patternType] || <Layers className="h-4 w-4" />}
          <span className="font-medium text-sm capitalize">{pattern.patternType.replace(/_/g, ' ')}</span>
        </div>
        <Badge variant="outline" className={cn(
          pattern.confidenceScore > 0.8 ? 'text-green-500' :
          pattern.confidenceScore > 0.5 ? 'text-amber-500' : 'text-muted-foreground'
        )}>
          {(pattern.confidenceScore * 100).toFixed(0)}%
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
        {pattern.description || 'Pattern detected from cross-phase analysis'}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Sources:</span>
        <div className="flex gap-1">
          {(pattern.sourcePhases || []).map(phase => (
            <Badge key={phase} variant="secondary" className="text-xs h-5">
              Phase {phase}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EmergenceEventCardProps {
  event: {
    id: string;
    eventType: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    isResolved: boolean;
    detectedAt: Date;
  };
}

function EmergenceEventCard({ event }: EmergenceEventCardProps) {
  const severityColors: Record<string, string> = {
    low: 'text-blue-500 bg-blue-500/10',
    medium: 'text-amber-500 bg-amber-500/10',
    high: 'text-orange-500 bg-orange-500/10',
    critical: 'text-red-500 bg-red-500/10',
  };

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      event.isResolved ? "bg-muted/20 border-muted" : "bg-card border-border"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="font-medium text-sm capitalize">{event.eventType.replace(/_/g, ' ')}</span>
        </div>
        <Badge className={severityColors[event.severity]}>
          {event.severity}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {event.description || 'Emergence event detected'}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{new Date(event.detectedAt).toLocaleString()}</span>
        {event.isResolved && (
          <Badge variant="outline" className="text-green-500">Resolved</Badge>
        )}
      </div>
    </div>
  );
}

export function MetaLearningSynthesisPanel() {
  const { models, isLoading: modelsLoading, trainModel } = useMetaLearning();
  const { patterns, convergenceEvents, isLoading: emergenceLoading, validatePattern } = useEmergenceDetection();
  const { operations, isLoading: opsLoading, executeOperation } = useCrossPhaseOperations();

  const [activeTab, setActiveTab] = useState('patterns');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate pattern detection
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate synthesis metrics
  const totalPatterns = patterns.length;
  const highConfidencePatterns = patterns.filter(p => (p as any).confidence > 0.7).length;
  const unresolvedEvents = convergenceEvents.filter(e => !(e as any).isResolved).length;
  const activeModels = models.filter(m => m.isActive).length;

  const isLoading = modelsLoading || emergenceLoading || opsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <BrainCircuit className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Singularity Synthesis</h2>
            <p className="text-sm text-muted-foreground">
              AGIS Phase 7 • Meta-learning & cross-phase pattern recognition
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRunAnalysis} 
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Detect Patterns
            </>
          )}
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Network className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPatterns}</p>
              <p className="text-xs text-muted-foreground">Patterns Detected</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{highConfidencePatterns}</p>
              <p className="text-xs text-muted-foreground">High Confidence</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unresolvedEvents}</p>
              <p className="text-xs text-muted-foreground">Emergence Events</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BrainCircuit className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeModels}</p>
              <p className="text-xs text-muted-foreground">Active Models</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patterns" className="gap-1.5">
            <Network className="h-4 w-4" />
            Cross-Phase Patterns
          </TabsTrigger>
          <TabsTrigger value="emergence" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Emergence Events
          </TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5">
            <BrainCircuit className="h-4 w-4" />
            Meta-Learning Models
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading patterns...</span>
                </div>
              </CardContent>
            </Card>
          ) : patterns.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="grid gap-3 md:grid-cols-2">
                {patterns.map(pattern => (
                  <PatternCard key={pattern.id} pattern={{
                    id: pattern.id,
                    patternType: pattern.patternType,
                    description: pattern.description,
                    confidenceScore: (pattern as any).confidence || 0.5,
                    sourcePhases: (pattern as any).sourcePhases || [],
                    createdAt: pattern.detectedAt,
                  }} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Patterns Detected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Run cross-phase analysis to detect patterns across intelligence domains.
                </p>
                <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="emergence" className="space-y-4">
          {events.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {events.map(event => (
                  <EmergenceEventCard key={event.id} event={event} />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Emergence Events</h3>
                <p className="text-sm text-muted-foreground">
                  Emergence events are detected when unexpected patterns arise from cross-phase operations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          {models.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {models.map(model => (
                <Card key={model.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{model.modelName}</span>
                      </div>
                      {model.isActive ? (
                        <Badge variant="default" className="bg-green-500/20 text-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{((model.accuracyScore || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(model.accuracyScore || 0) * 100} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>Training iterations: {model.trainingIterations || 0}</span>
                        <span>v{model.modelVersion || '1.0'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => trainModel.mutate(model.id)}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Evaluate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => trainModel.mutate(model.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Train
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No Meta-Learning Models</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Meta-learning models are trained from cross-phase operation data.
                </p>
                <Button>
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize First Model
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
