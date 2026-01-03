import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Brain, ChevronDown, Loader2, RefreshCw, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';

interface BehavioralAnalysisProps {
  profileId: string;
  profileName: string;
}

interface PersonalityTrait {
  score: number;
  evidence: string[];
  description: string;
}

export function BehavioralAnalysis({ profileId, profileName }: BehavioralAnalysisProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analysisType, setAnalysisType] = useState('screening');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('analyze-behavioral');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['behavioral-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profileId,
  });

  const { data: localEndpoints } = useQuery({
    queryKey: ['local-ai-endpoints'],
    queryFn: async () => {
      const { data } = await supabase
        .from('local_ai_endpoints')
        .select('*')
        .eq('is_active', true);
      return data || [];
    },
    enabled: !!user,
  });

  const runAnalysis = useMutation({
    mutationFn: async (logId: string) => {
      const startTime = Date.now();
      const localEndpoint = localEndpoints?.find(e => 
        e.model_type === 'behavioral' || e.model_type === 'general'
      )?.endpoint_url;

      const { data, error } = await supabase.functions.invoke('analyze-behavioral', {
        body: {
          profileId,
          userId: user?.id,
          analysisType,
          localEndpoint,
        },
      });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        await updateLogWithResult(logId, {
          status: 'failed',
          errorMessage: error.message,
          responseTimeMs: responseTime,
        });
        throw error;
      }
      
      await updateLogWithResult(logId, {
        status: 'completed',
        responseTimeMs: responseTime,
        actualCostCents: calculateCostCents(modelKey, 2000, 1500),
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-analyses', profileId] });
      toast({ title: 'Analysis complete', description: 'Behavioral analysis has been generated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleRunAnalysis = async () => {
    const promptText = `Running behavioral analysis for ${profileName}. This will analyze personality patterns, communication style, and decision-making indicators.`;
    
    const { approved, logId } = await requestConfirmation({
      functionName: 'analyze-behavioral',
      modelKey,
      promptText,
      profileId,
    });
    
    if (approved && logId) {
      runAnalysis.mutate(logId);
    }
  };

  const renderPersonalityChart = (indicators: Record<string, PersonalityTrait> | null) => {
    if (!indicators) return null;
    
    const traits = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const labels = {
      openness: 'Openness',
      conscientiousness: 'Conscientiousness',
      extraversion: 'Extraversion',
      agreeableness: 'Agreeableness',
      neuroticism: 'Neuroticism',
    };

    return (
      <div className="space-y-3">
        {traits.map((trait) => {
          const data = indicators[trait];
          if (!data) return null;
          
          return (
            <div key={trait} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{labels[trait as keyof typeof labels]}</span>
                <span className="text-muted-foreground">{data.score}%</span>
              </div>
              <Progress value={data.score} className="h-2" />
              <p className="text-xs text-muted-foreground">{data.description}</p>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const latestAnalysis = analyses?.[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Behavioral Analysis
            </CardTitle>
            <CardDescription>
              Psychology-based behavioral patterns and personality profiling
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleRunAnalysis}
              disabled={runAnalysis.isPending}
            >
              {runAnalysis.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!analyses?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No behavioral analysis yet</p>
            <p className="text-sm">Run an analysis to understand {profileName}'s behavioral patterns</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest Analysis Summary */}
            {latestAnalysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Big Five Personality Profile</h4>
                  <Badge variant="outline">
                    Confidence: {latestAnalysis.confidence_score || 'N/A'}%
                  </Badge>
                </div>
                
                {renderPersonalityChart(latestAnalysis.personality_indicators as unknown as Record<string, PersonalityTrait> | null)}

                {/* Behavioral Patterns */}
                {latestAnalysis.behavioral_patterns && (
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-medium">Key Insights</h4>
                    {(() => {
                      const patterns = latestAnalysis.behavioral_patterns as any;
                      return (
                        <div className="grid gap-3 md:grid-cols-2">
                          {patterns.communication_style && (
                            <div className="p-3 bg-muted rounded-lg">
                              <h5 className="text-sm font-medium">Communication Style</h5>
                              <p className="text-sm text-muted-foreground mt-1">
                                {patterns.communication_style.type}
                              </p>
                            </div>
                          )}
                          {patterns.decision_making && (
                            <div className="p-3 bg-muted rounded-lg">
                              <h5 className="text-sm font-medium">Decision Making</h5>
                              <p className="text-sm text-muted-foreground mt-1">
                                {patterns.decision_making.style} ({patterns.decision_making.speed})
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Strengths & Red Flags */}
                {latestAnalysis.raw_analysis && (
                  <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                    {(latestAnalysis.raw_analysis as any).strengths && (
                      <div>
                        <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Strengths
                        </h5>
                        <ul className="text-sm space-y-1">
                          {((latestAnalysis.raw_analysis as any).strengths || []).slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="text-muted-foreground">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(latestAnalysis.raw_analysis as any).red_flags && (
                      <div>
                        <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Watch Points
                        </h5>
                        <ul className="text-sm space-y-1">
                          {((latestAnalysis.raw_analysis as any).red_flags || []).slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="text-muted-foreground">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* History */}
            {analyses.length > 1 && (
              <Collapsible className="border-t pt-4">
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                  <ChevronDown className="h-4 w-4" />
                  Previous Analyses ({analyses.length - 1})
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {analyses.slice(1).map((analysis) => (
                        <div
                          key={analysis.id}
                          className="p-3 border rounded-lg text-sm cursor-pointer hover:bg-muted"
                          onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span>{analysis.analysis_type}</span>
                            <span className="text-muted-foreground">
                              {format(new Date(analysis.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
