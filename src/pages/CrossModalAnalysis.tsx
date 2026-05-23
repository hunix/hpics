import { useState } from 'react';
import { useCrossModalCorrelation } from '@/hooks/intelligence/useCrossModalCorrelation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Network, Activity, Brain, AlertTriangle, Lightbulb, 
  Link2, Zap, BarChart3, RefreshCw, Play, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function CrossModalAnalysis() {
  const {
    correlations,
    modalityStreams,
    isLoading,
    runCorrelation,
    detectAnomalies,
    avgConfidence,
    totalCausalLinks,
    totalAnomalies,
    totalInsights,
    activeModalities,
  } = useCrossModalCorrelation();

  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [correlationType, setCorrelationType] = useState<'pairwise' | 'multi-way' | 'temporal' | 'causal'>('multi-way');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunCorrelation = async () => {
    if (selectedModalities.length < 2) {
      toast.error('Select at least 2 modalities for correlation analysis');
      return;
    }

    setIsRunning(true);
    try {
      await runCorrelation.mutateAsync({
        profileId: 'current', // Would be dynamic in real use
        modalities: selectedModalities,
        correlationType,
      });
      toast.success('Correlation analysis complete');
    } catch (error) {
      toast.error('Failed to run correlation analysis');
    } finally {
      setIsRunning(false);
    }
  };

  const toggleModality = (modalityId: string) => {
    setSelectedModalities(prev => 
      prev.includes(modalityId) 
        ? prev.filter(m => m !== modalityId)
        : [...prev, modalityId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              Cross-Modal Correlation Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Synthesize intelligence across multiple data modalities
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Active Modalities</span>
              </div>
              <p className="text-2xl font-bold mt-2">{activeModalities}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Causal Links</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalCausalLinks}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Anomalies</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalAnomalies}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Insights</span>
              </div>
              <p className="text-2xl font-bold mt-2">{totalInsights}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Avg Confidence</span>
              </div>
              <p className="text-2xl font-bold mt-2">{(avgConfidence * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modality Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Data Modalities</CardTitle>
              <CardDescription>Select modalities to correlate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modalityStreams?.map((stream) => (
                <div 
                  key={stream.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedModalities.includes(stream.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleModality(stream.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedModalities.includes(stream.id)}
                        onCheckedChange={() => toggleModality(stream.id)}
                      />
                      <div>
                        <p className="font-medium text-sm">{stream.name}</p>
                        <p className="text-xs text-muted-foreground">{stream.dataPoints} data points</p>
                      </div>
                    </div>
                    <Badge variant="outline">{(stream.quality * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              ))}

              {(!modalityStreams || modalityStreams.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No modality streams available</p>
                  <p className="text-sm">Collect data to enable correlation analysis</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Select value={correlationType} onValueChange={(v: any) => setCorrelationType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Correlation Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pairwise">Pairwise Correlation</SelectItem>
                    <SelectItem value="multi-way">Multi-way Synthesis</SelectItem>
                    <SelectItem value="temporal">Temporal Alignment</SelectItem>
                    <SelectItem value="causal">Causal Discovery</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  className="w-full" 
                  onClick={handleRunCorrelation}
                  disabled={selectedModalities.length < 2 || isRunning}
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Run Correlation Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Correlation Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Correlation Results</CardTitle>
              <CardDescription>Cross-modal analysis findings</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="matrix">
                <TabsList className="mb-4">
                  <TabsTrigger value="matrix">Correlation Matrix</TabsTrigger>
                  <TabsTrigger value="causal">Causal Links</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="matrix">
                  {correlations && correlations.length > 0 ? (
                    <div className="space-y-4">
                      {correlations.slice(0, 3).map((correlation) => (
                        <div key={correlation.id} className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-3">
                            <Badge>{correlation.correlationType}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(correlation.createdAt ?? Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(correlation.correlationMatrix).slice(0, 4).map(([key, values]) => (
                              <div key={key} className="text-sm">
                                <span className="font-medium">{key}:</span>
                                {Object.entries(values as Record<string, number>).slice(0, 2).map(([k, v]) => (
                                  <span key={k} className="ml-2 text-muted-foreground">
                                    {k}: {(v as number).toFixed(2)}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No correlation data yet</p>
                      <p className="text-sm">Run an analysis to see results</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="causal">
                  <ScrollArea className="h-[300px]">
                    {correlations?.flatMap(c => c.causalLinks || []).length ? (
                      <div className="space-y-3">
                        {correlations?.flatMap(c => c.causalLinks || []).map((link, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Badge variant="outline">{link.source}</Badge>
                            <div className="flex-1 relative h-1 bg-border rounded">
                              <div 
                                className="absolute top-0 left-0 h-full bg-primary rounded"
                                style={{ width: `${link.strength * 100}%` }}
                              />
                              <Zap className="absolute -right-2 -top-2 h-4 w-4 text-primary" />
                            </div>
                            <Badge variant="outline">{link.target}</Badge>
                            <span className="text-xs text-muted-foreground">{link.direction}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Link2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No causal links discovered</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="insights">
                  <ScrollArea className="h-[300px]">
                    {correlations?.flatMap(c => c.synthesizedInsights || []).length ? (
                      <div className="space-y-3">
                        {correlations?.flatMap(c => c.synthesizedInsights || []).map((insight, i) => (
                          <div key={i} className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-start gap-3">
                              <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm">{insight.insight}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Progress value={insight.confidence * 100} className="flex-1 h-1" />
                                  <span className="text-xs text-muted-foreground">
                                    {(insight.confidence * 100).toFixed(0)}% confidence
                                  </span>
                                </div>
                                <div className="flex gap-1 mt-2">
                                  {insight.sources?.map((source: string) => (
                                    <Badge key={source} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No insights generated yet</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Anomaly Detection
            </CardTitle>
            <CardDescription>Cross-modal anomalies and pattern breaks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {correlations?.flatMap(c => c.anomalyDetections || []).slice(0, 8).map((anomaly, i) => (
                <div key={i} className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{anomaly.modality}</Badge>
                    <span className={`text-xs font-medium ${
                      anomaly.severity > 0.7 ? 'text-red-500' : 
                      anomaly.severity > 0.4 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {(anomaly.severity * 100).toFixed(0)}% severity
                    </span>
                  </div>
                  <p className="text-sm font-medium capitalize">{anomaly.type.replace('_', ' ')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(anomaly.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}

              {(!correlations || correlations.flatMap(c => c.anomalyDetections || []).length === 0) && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No anomalies detected</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
