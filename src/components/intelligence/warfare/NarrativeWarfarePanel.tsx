import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Radio, MessageSquare, TrendingUp, Zap, Shield, Target, 
  Play, AlertTriangle, Network, Users, Sparkles, Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NarrativeWarfarePanelProps {
  profileId?: string;
  profileName?: string;
}

interface NarrativeAnalysis {
  narrativeType: 'connective' | 'institutional';
  dominantFrames: string[];
  vulnerabilityPoints: string[];
  resistanceFactors: string[];
  memeticResilience: number;
  algorithmicExposure: number;
  counterNarrativeVectors: Array<{
    vector: string;
    effectiveness: number;
    deploymentContext: string;
  }>;
  folkloreTraditions: string[];
  syntheticCredibility: number;
}

export function NarrativeWarfarePanel({ profileId, profileName }: NarrativeWarfarePanelProps) {
  const queryClient = useQueryClient();
  const [targetNarrative, setTargetNarrative] = useState('');
  const [deploymentContext, setDeploymentContext] = useState('');
  
  // Fetch existing narrative analyses
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['narrative-warfare', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'narrative_warfare')
        .order('generated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!profileId,
  });

  // Run narrative analysis
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cognitive-warfare-engine', {
        body: {
          profileId,
          operationType: 'narrative_analysis',
          targetNarrative,
          deploymentContext,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Narrative analysis complete');
      queryClient.invalidateQueries({ queryKey: ['narrative-warfare', profileId] });
      setTargetNarrative('');
      setDeploymentContext('');
    },
    onError: (error) => {
      toast.error('Analysis failed', { description: error instanceof Error ? error.message : 'Unknown error' });
    },
  });

  const latestAnalysis = analyses?.[0]?.result as unknown as NarrativeAnalysis | undefined;

  const getResilienceColor = (score: number) => {
    if (score >= 0.7) return 'text-red-400';
    if (score >= 0.4) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <Card className="border-violet-500/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-violet-400" />
            <CardTitle>Narrative Warfare Engine</CardTitle>
            <Badge variant="outline" className="text-violet-400 border-violet-400/50">DARPA-Inspired</Badge>
          </div>
        </div>
        <CardDescription>
          Connective vs Institutional narrative analysis • Memetic resilience • Counter-narrative deployment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="deploy">Deploy Counter</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : !latestAnalysis ? (
              <div className="space-y-4">
                <div className="text-center py-4 text-muted-foreground">
                  {profileId ? 'No narrative analysis yet. Run analysis to begin.' : 'Select a profile to analyze.'}
                </div>
                {profileId && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Target narrative to analyze (optional)"
                      value={targetNarrative}
                      onChange={(e) => setTargetNarrative(e.target.value)}
                    />
                    <Button 
                      className="w-full"
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {analyzeMutation.isPending ? 'Analyzing...' : 'Run Narrative Analysis'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Narrative Type */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium">Narrative Type</span>
                      </div>
                      <Badge className={latestAnalysis.narrativeType === 'connective' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}>
                        {latestAnalysis.narrativeType === 'connective' ? 'Connective (Bottom-Up)' : 'Institutional (Top-Down)'}
                      </Badge>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-background/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium">Memetic Resilience</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={latestAnalysis.memeticResilience * 100} className="flex-1 h-2" />
                        <span className={`text-sm font-bold ${getResilienceColor(latestAnalysis.memeticResilience)}`}>
                          {Math.round(latestAnalysis.memeticResilience * 100)}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Dominant Frames */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    Dominant Narrative Frames
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {latestAnalysis.dominantFrames?.map((frame, idx) => (
                      <Badge key={idx} variant="outline" className="text-blue-400 border-blue-400/30">
                        {frame}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Vulnerability Points */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Narrative Vulnerability Points
                  </h4>
                  <div className="space-y-2">
                    {latestAnalysis.vulnerabilityPoints?.map((point, idx) => (
                      <div key={idx} className="p-2 rounded bg-red-500/10 border border-red-500/20 text-sm">
                        {point}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Counter-Narrative Vectors */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    Counter-Narrative Vectors
                  </h4>
                  <div className="space-y-2">
                    {latestAnalysis.counterNarrativeVectors?.map((vector, idx) => (
                      <div key={idx} className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{vector.vector}</span>
                          <Badge className="bg-emerald-500/20 text-emerald-400">
                            {Math.round(vector.effectiveness * 100)}% effective
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{vector.deploymentContext}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Synthetic Credibility & Algorithmic Exposure */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-amber-400" />
                      Synthetic Credibility
                    </h4>
                    <Progress value={latestAnalysis.syntheticCredibility * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Detection of artificial amplification
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      Algorithmic Exposure
                    </h4>
                    <Progress value={latestAnalysis.algorithmicExposure * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Platform algorithm vulnerability
                    </p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzeMutation.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Refresh Analysis
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="deploy" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Counter-Narrative Message</label>
                <Textarea
                  placeholder="Enter the counter-narrative to deploy..."
                  value={targetNarrative}
                  onChange={(e) => setTargetNarrative(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deployment Context</label>
                <Input
                  placeholder="e.g., social media, direct conversation, group setting"
                  value={deploymentContext}
                  onChange={(e) => setDeploymentContext(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={!targetNarrative || !deploymentContext}
              >
                <Shield className="h-4 w-4 mr-2" />
                Plan Counter-Narrative Deployment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {analyses?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No analysis history</div>
            ) : (
              <div className="space-y-2">
                {analyses?.map((analysis: any, idx: number) => (
                  <Card key={analysis.id} className="bg-background/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Analysis #{analyses.length - idx}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(analysis.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
