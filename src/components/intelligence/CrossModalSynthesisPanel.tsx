import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Brain, Mic, Camera, Activity, AlertTriangle, CheckCircle2, 
  TrendingUp, TrendingDown, Minus, RefreshCw, Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface CrossModalSynthesisPanelProps {
  profileId: string;
}

interface ModalityData {
  available: boolean;
  count: number;
  lastUpdated?: string;
}

interface SynthesisResult {
  corroborated_traits: Array<{
    trait: string;
    modalities: string[];
    confidence: number;
    evidence: string;
  }>;
  contradictions: Array<{
    aspect: string;
    modality_a: string;
    finding_a: string;
    modality_b: string;
    finding_b: string;
    severity: 'low' | 'medium' | 'high';
    interpretation: string;
  }>;
  emotional_baseline: {
    dominant_state: string;
    stability: number;
    triggers: string[];
  };
  deception_assessment: {
    overall_risk: 'low' | 'medium' | 'high';
    indicators: string[];
    confidence: number;
  };
  confidence_boosted_insights: Array<{
    insight: string;
    confidence_boost: number;
    sources: string[];
  }>;
  summary: string;
}

export function CrossModalSynthesisPanel({ profileId }: CrossModalSynthesisPanelProps) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch modality availability
  const { data: modalities } = useQuery({
    queryKey: ['modality-availability', profileId],
    queryFn: async () => {
      const [vocal, facial, bodyLanguage, behavioral] = await Promise.all([
        supabase.from('vocal_analyses').select('id, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('facial_analyses').select('id, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('body_language_analyses').select('id, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
        supabase.from('behavioral_analyses').select('id, created_at').eq('profile_id', profileId).order('created_at', { ascending: false }).limit(1),
      ]);

      const [vocalCount, facialCount, bodyCount, behavioralCount] = await Promise.all([
        supabase.from('vocal_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('facial_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('body_language_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
        supabase.from('behavioral_analyses').select('id', { count: 'exact', head: true }).eq('profile_id', profileId),
      ]);

      return {
        vocal: { 
          available: (vocalCount.count || 0) > 0, 
          count: vocalCount.count || 0,
          lastUpdated: vocal.data?.[0]?.created_at
        },
        facial: { 
          available: (facialCount.count || 0) > 0, 
          count: facialCount.count || 0,
          lastUpdated: facial.data?.[0]?.created_at
        },
        body_language: { 
          available: (bodyCount.count || 0) > 0, 
          count: bodyCount.count || 0,
          lastUpdated: bodyLanguage.data?.[0]?.created_at
        },
        behavioral: { 
          available: (behavioralCount.count || 0) > 0, 
          count: behavioralCount.count || 0,
          lastUpdated: behavioral.data?.[0]?.created_at
        },
      };
    },
    enabled: !!profileId,
  });

  // Fetch existing synthesis
  const { data: synthesis, isLoading: synthesisLoading } = useQuery({
    queryKey: ['cross-modal-synthesis', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .eq('analysis_type', 'cross_modal_synthesis')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.result as unknown as SynthesisResult | null;
    },
    enabled: !!profileId,
  });

  // Run synthesis mutation
  const runSynthesisMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('cross-modal-synthesis', {
        body: { profileId },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-modal-synthesis', profileId] });
      toast.success('Cross-modal synthesis complete');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to run synthesis');
    },
  });

  const handleRunSynthesis = () => {
    setIsAnalyzing(true);
    runSynthesisMutation.mutate(undefined, {
      onSettled: () => setIsAnalyzing(false),
    });
  };

  const availableModalities = modalities 
    ? Object.entries(modalities).filter(([_, data]) => data.available).length 
    : 0;

  const canRunSynthesis = availableModalities >= 2;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-blue-500';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge variant="destructive">High Risk</Badge>;
      case 'medium': return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium Risk</Badge>;
      default: return <Badge variant="secondary">Low Risk</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Cross-Modal Synthesis
            </CardTitle>
            <CardDescription>
              Unified insights from voice, face, body language & behavior
            </CardDescription>
          </div>
          <Button 
            onClick={handleRunSynthesis} 
            disabled={!canRunSynthesis || isAnalyzing}
            size="sm"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Run Synthesis
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modality Availability */}
        <div className="grid grid-cols-4 gap-2">
          <div className={`p-3 rounded-lg text-center ${modalities?.vocal.available ? 'bg-primary/10' : 'bg-muted'}`}>
            <Mic className={`h-5 w-5 mx-auto mb-1 ${modalities?.vocal.available ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Voice</p>
            <p className="text-xs text-muted-foreground">{modalities?.vocal.count || 0} samples</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${modalities?.facial.available ? 'bg-primary/10' : 'bg-muted'}`}>
            <Camera className={`h-5 w-5 mx-auto mb-1 ${modalities?.facial.available ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Facial</p>
            <p className="text-xs text-muted-foreground">{modalities?.facial.count || 0} samples</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${modalities?.body_language.available ? 'bg-primary/10' : 'bg-muted'}`}>
            <Activity className={`h-5 w-5 mx-auto mb-1 ${modalities?.body_language.available ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Body</p>
            <p className="text-xs text-muted-foreground">{modalities?.body_language.count || 0} samples</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${modalities?.behavioral.available ? 'bg-primary/10' : 'bg-muted'}`}>
            <Eye className={`h-5 w-5 mx-auto mb-1 ${modalities?.behavioral.available ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-xs font-medium">Behavioral</p>
            <p className="text-xs text-muted-foreground">{modalities?.behavioral.count || 0} samples</p>
          </div>
        </div>

        {!canRunSynthesis && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Need at least 2 modalities for cross-modal synthesis.
              Upload voice recordings, videos, or run behavioral analysis first.
            </p>
          </div>
        )}

        {synthesisLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        )}

        {synthesis && (
          <Tabs defaultValue="corroborated" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="corroborated" className="text-xs">Corroborated</TabsTrigger>
              <TabsTrigger value="contradictions" className="text-xs">Contradictions</TabsTrigger>
              <TabsTrigger value="deception" className="text-xs">Deception</TabsTrigger>
              <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="corroborated">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {synthesis.corroborated_traits?.map((trait, i) => (
                    <div key={i} className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {trait.trait}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {trait.confidence}% confident
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{trait.evidence}</p>
                      <div className="flex gap-1">
                        {trait.modalities.map((m, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="contradictions">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {synthesis.contradictions?.map((c, i) => (
                    <div key={i} className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium text-sm ${getSeverityColor(c.severity)}`}>
                          {c.aspect}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={getSeverityColor(c.severity)}
                        >
                          {c.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-muted-foreground">{c.modality_a}:</span>
                          <p>{c.finding_a}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{c.modality_b}:</span>
                          <p>{c.finding_b}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground italic">{c.interpretation}</p>
                    </div>
                  ))}
                  {(!synthesis.contradictions || synthesis.contradictions.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No contradictions detected
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="deception">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Deception Risk Assessment</p>
                    <p className="text-xs text-muted-foreground">
                      Based on cross-modal analysis of voice, face, and body language
                    </p>
                  </div>
                  {getRiskBadge(synthesis.deception_assessment?.overall_risk || 'low')}
                </div>
                
                {synthesis.deception_assessment?.indicators && synthesis.deception_assessment.indicators.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Detected Indicators</p>
                    <ul className="space-y-1">
                      {synthesis.deception_assessment.indicators.map((indicator, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {synthesis.confidence_boosted_insights?.map((insight, i) => (
                    <div key={i} className="p-3 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-xs text-primary font-medium">
                          +{insight.confidence_boost}% confidence boost
                        </span>
                      </div>
                      <p className="text-sm">{insight.insight}</p>
                      <div className="flex gap-1 mt-2">
                        {insight.sources.map((s, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {synthesis?.summary && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">Synthesis Summary</p>
            <p className="text-sm text-muted-foreground">{synthesis.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
