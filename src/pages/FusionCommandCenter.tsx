import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, Network, Clock, Users, Layers, GitBranch, 
  Target, Activity, Zap, Database, RefreshCw, 
  TrendingUp, AlertTriangle, Shield, Eye, Loader2,
  Workflow, Binary, Atom, Cpu, Search, PlayCircle
} from 'lucide-react';
import { ScalableContactSearch } from '@/components/contacts/ScalableContactSearch';

export default function FusionCommandCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedContactName, setSelectedContactName] = useState('');
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const runFusionEngine = async (engine: string, functionName: string) => {
    if (!selectedProfileId) {
      toast.error('Please select a contact first');
      return;
    }

    setIsRunning(prev => ({ ...prev, [engine]: true }));
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { profileId: selectedProfileId }
      });

      if (error) throw error;
      
      setResults(prev => ({ ...prev, [engine]: data }));
      toast.success(`${engine} analysis complete`);
    } catch (error) {
      console.error(`${engine} error:`, error);
      toast.error(`${engine} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(prev => ({ ...prev, [engine]: false }));
    }
  };

  const engines = [
    {
      id: 'temporal',
      name: 'Temporal Fusion Transformer',
      description: 'Probabilistic behavioral forecasting with Variable Selection Networks',
      icon: Clock,
      function: 'temporal-fusion-transformer',
      color: 'bg-blue-500/10 border-blue-500/30',
      features: ['30/90/180 day predictions', 'Quantile uncertainty bounds', 'Attention-based feature selection']
    },
    {
      id: 'digital-twin',
      name: 'Behavioral Digital Twin',
      description: 'Real-time behavioral simulation using SMGA loop architecture',
      icon: Users,
      function: 'behavioral-digital-twin',
      color: 'bg-purple-500/10 border-purple-500/30',
      features: ['Sense-Map-Generate-Act loop', 'Scenario simulation', 'Decision prediction']
    },
    {
      id: 'graph-rag',
      name: 'Graph RAG Engine',
      description: 'Knowledge graph construction with community detection and multi-hop reasoning',
      icon: Network,
      function: 'graph-rag-engine',
      color: 'bg-green-500/10 border-green-500/30',
      features: ['Automated knowledge extraction', 'Community detection', 'Semantic reasoning']
    },
    {
      id: 'shadow-network',
      name: 'Shadow Network Analyzer',
      description: 'Detect hidden actors, covert relationships, and homophily violations',
      icon: Eye,
      function: 'shadow-network-analyzer',
      color: 'bg-red-500/10 border-red-500/30',
      features: ['Hidden actor detection', 'Anomalous relationship patterns', 'Threat scoring']
    },
    {
      id: 'dempster-shafer',
      name: 'Dempster-Shafer Fusion',
      description: 'Uncertainty quantification and conflicting evidence resolution',
      icon: Layers,
      function: 'dempster-shafer-fusion',
      color: 'bg-amber-500/10 border-amber-500/30',
      features: ['Belief mass functions', 'Evidence combination', 'Conflict detection']
    },
    {
      id: 'counterfactual',
      name: 'Counterfactual Engine',
      description: 'Causal modeling and "what-if" scenario analysis',
      icon: GitBranch,
      function: 'counterfactual-engine',
      color: 'bg-cyan-500/10 border-cyan-500/30',
      features: ['Causal graph construction', 'Intervention modeling', 'Outcome prediction']
    },
    {
      id: 'pattern-of-life',
      name: 'Pattern-of-Life Engine',
      description: 'Automated behavioral baseline extraction and deviation monitoring',
      icon: Activity,
      function: 'pattern-of-life-engine',
      color: 'bg-indigo-500/10 border-indigo-500/30',
      features: ['Daily routine extraction', 'Anomaly detection', 'Predictive scheduling']
    },
    {
      id: 'entity-resolution',
      name: 'Entity Resolution Engine',
      description: 'Fuzzy matching and alias detection for entity deduplication',
      icon: Database,
      function: 'entity-resolution-engine',
      color: 'bg-pink-500/10 border-pink-500/30',
      features: ['Cross-source matching', 'Alias detection', 'Network discovery']
    },
    {
      id: 'sentiment-cascade',
      name: 'Sentiment Cascade Predictor',
      description: 'Model sentiment propagation using epidemic dynamics (SIR model)',
      icon: TrendingUp,
      function: 'sentiment-cascade-predictor',
      color: 'bg-orange-500/10 border-orange-500/30',
      features: ['Propagation modeling', 'Influence prediction', 'Viral potential scoring']
    }
  ];

  const runAllEngines = async () => {
    if (!selectedProfileId) {
      toast.error('Please select a contact first');
      return;
    }

    toast.info('Running all fusion engines...');
    
    for (const engine of engines) {
      await runFusionEngine(engine.id, engine.function);
    }
    
    toast.success('All fusion engines complete!');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Atom className="h-8 w-8 text-primary" />
            Fusion Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Advanced data fusion and predictive intelligence synthesis
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="w-80">
            <ScalableContactSearch
              onSelect={(id, contact) => {
                setSelectedProfileId(id);
                if (contact) {
                  setSelectedContactName(`${contact.first_name} ${contact.last_name || ''}`.trim());
                }
              }}
              placeholder="Select target profile..."
            />
          </div>
          <Button 
            onClick={runAllEngines}
            disabled={!selectedProfileId || Object.values(isRunning).some(Boolean)}
            className="gap-2"
          >
            <PlayCircle className="h-4 w-4" />
            Run All Engines
          </Button>
        </div>
      </div>

      {selectedProfileId && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-primary border-primary">
                Active Target
              </Badge>
              <span className="font-semibold">{selectedContactName}</span>
              <Badge variant="secondary" className="ml-auto">
                {Object.keys(results).length} / {engines.length} engines complete
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engine Grid */}
      <Tabs defaultValue="engines" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="engines">Fusion Engines</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
        </TabsList>

        <TabsContent value="engines" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engines.map(engine => {
              const Icon = engine.icon;
              const isActive = isRunning[engine.id];
              const hasResult = results[engine.id];

              return (
                <Card 
                  key={engine.id}
                  className={`${engine.color} border transition-all hover:shadow-md ${hasResult ? 'ring-2 ring-green-500/50' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-background/50">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{engine.name}</CardTitle>
                        </div>
                      </div>
                      {hasResult && (
                        <Badge variant="default" className="bg-green-600">
                          Complete
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-2">
                      {engine.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {engine.features.map(feature => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        onClick={() => runFusionEngine(engine.id, engine.function)}
                        disabled={!selectedProfileId || isActive}
                        variant={hasResult ? 'secondary' : 'default'}
                        size="sm"
                        className="w-full gap-2"
                      >
                        {isActive ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : hasResult ? (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Re-run
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4" />
                            Execute
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(results).map(([engineId, result]) => {
              const engine = engines.find(e => e.id === engineId);
              if (!engine) return null;
              const Icon = engine.icon;

              return (
                <Card key={engineId} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      <CardTitle className="text-base">{engine.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-80 overflow-auto">
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {Object.keys(results).length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Database className="h-12 w-12 mb-4 opacity-50" />
                <p>No results yet. Run fusion engines to see data here.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="synthesis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Synthesis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Intelligence Synthesis
                </CardTitle>
                <CardDescription>
                  Combined insights from all fusion engines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(results).length > 0 ? (
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {Object.keys(results).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Engines Complete</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {results['temporal']?.predictions?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Predictions</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {results['graph-rag']?.nodes?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Knowledge Nodes</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {results['shadow-network']?.hiddenActors?.length || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">Hidden Actors</div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Fusion Progress</span>
                        <span>{Math.round((Object.keys(results).length / engines.length) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(Object.keys(results).length / engines.length) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Run fusion engines to generate synthesis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Risk Indicators
                </CardTitle>
                <CardDescription>
                  Aggregated threat and opportunity signals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results['shadow-network']?.hiddenActors?.slice(0, 3).map((actor: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-red-500" />
                        <span className="text-sm">{actor.name || `Hidden Actor ${i + 1}`}</span>
                      </div>
                      <Badge variant="destructive">
                        {Math.round((actor.threatScore || 0.5) * 100)}%
                      </Badge>
                    </div>
                  ))}
                  
                  {results['dempster-shafer']?.conflicts?.slice(0, 3).map((conflict: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-amber-500" />
                        <span className="text-sm">{conflict.description || `Evidence Conflict ${i + 1}`}</span>
                      </div>
                      <Badge variant="secondary">
                        {Math.round((conflict.conflictDegree || 0.3) * 100)}%
                      </Badge>
                    </div>
                  ))}

                  {Object.keys(results).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No risk indicators available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
