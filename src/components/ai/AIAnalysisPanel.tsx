import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PersonalityChart } from './PersonalityChart';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';
import { 
  Brain, TrendingUp, Users, FileText, Loader2, Sparkles, 
  RefreshCw, CheckCircle, AlertTriangle, Lightbulb, Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SavedBadge = ({ generatedAt }: { generatedAt: string }) => (
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
      <Database className="h-3 w-3 mr-1" />
      Saved
    </Badge>
    <p className="text-xs text-muted-foreground">
      Generated {formatDistanceToNow(new Date(generatedAt), { addSuffix: true })}
    </p>
  </div>
);

const AnalysisSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <div className="flex gap-1">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
  </div>
);

interface AIAnalysisPanelProps {
  profileId: string;
  profileName: string;
}

export function AIAnalysisPanel({ profileId, profileName }: AIAnalysisPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personality');
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('analyze-profile');

  const { data: analyses, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['ai-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('generated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ analysisType, logId }: { analysisType: string; logId: string }) => {
      const startTime = Date.now();
      
      const { data, error } = await supabase.functions.invoke('analyze-profile', {
        body: { profileId, analysisType }
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
      
      if (data.error) {
        await updateLogWithResult(logId, {
          status: 'failed',
          errorMessage: data.error,
          responseTimeMs: responseTime,
        });
        throw new Error(data.error);
      }
      
      // Update log with success
      await updateLogWithResult(logId, {
        status: 'completed',
        responseTimeMs: responseTime,
        actualCostCents: calculateCostCents(modelKey, 2000, 1000),
      });
      
      return data.result;
    },
    onSuccess: (_, { analysisType }) => {
      queryClient.invalidateQueries({ queryKey: ['ai-analyses', profileId] });
      toast({ 
        title: 'Analysis complete', 
        description: `${analysisType} analysis generated successfully.` 
      });
    },
    onError: (error) => {
      toast({ 
        title: 'Analysis failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleAnalyze = async (analysisType: string) => {
    const promptText = `Analyzing ${profileName}'s profile for ${analysisType} insights. This will analyze communications, events, and relationship data.`;
    
    const { approved, logId } = await requestConfirmation({
      functionName: 'analyze-profile',
      modelKey,
      promptText,
      profileId,
    });
    
    if (approved && logId) {
      analyzeMutation.mutate({ analysisType, logId });
    }
  };

  const getLatestAnalysis = (type: string) => {
    return analyses?.find(a => a.analysis_type === type);
  };

  const personalityAnalysis = getLatestAnalysis('personality');
  const sentimentAnalysis = getLatestAnalysis('sentiment');
  const playbookAnalysis = getLatestAnalysis('playbook');
  const scoreAnalysis = getLatestAnalysis('relationship_score');

  const renderPersonality = () => {
    const data = personalityAnalysis?.result as any;
    if (!data) {
      return (
        <div className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No personality analysis yet</p>
          <Button 
            onClick={() => handleAnalyze('personality')}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'personality' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Analysis
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SavedBadge generatedAt={personalityAnalysis.generated_at} />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAnalyze('personality')}
            disabled={analyzeMutation.isPending}
            title="Regenerate analysis"
          >
            <RefreshCw className={`h-4 w-4 ${analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'personality' ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <PersonalityChart data={data} />
        
        <p className="text-sm">{data.summary}</p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Communication Style</h4>
          <p className="text-sm text-muted-foreground">{data.communicationStyle}</p>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Strengths</h4>
          <div className="flex flex-wrap gap-1">
            {data.strengths?.map((s: string, i: number) => (
              <Badge key={i} variant="secondary">{s}</Badge>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Things to Keep in Mind</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {data.considerationsWhenInteracting?.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderSentiment = () => {
    const data = sentimentAnalysis?.result as any;
    if (!data) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No sentiment analysis yet</p>
          <Button 
            onClick={() => handleAnalyze('sentiment')}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'sentiment' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze Sentiment
          </Button>
        </div>
      );
    }

    const sentimentColors: Record<string, string> = {
      very_positive: 'bg-green-500',
      positive: 'bg-green-400',
      neutral: 'bg-gray-400',
      negative: 'bg-orange-400',
      very_negative: 'bg-red-500',
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SavedBadge generatedAt={sentimentAnalysis.generated_at} />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAnalyze('sentiment')}
            disabled={analyzeMutation.isPending}
            title="Regenerate analysis"
          >
            <RefreshCw className={`h-4 w-4 ${analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'sentiment' ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{data.sentimentScore}</div>
            <p className="text-xs text-muted-foreground">Sentiment Score</p>
          </div>
          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${sentimentColors[data.overallSentiment]}`}
              style={{ width: `${data.sentimentScore}%` }}
            />
          </div>
          <Badge className="capitalize">{data.overallSentiment.replace('_', ' ')}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Trend</p>
            <p className="font-medium capitalize">{data.trend}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Frequency</p>
            <p className="font-medium capitalize">{data.communicationFrequency.replace('_', ' ')}</p>
          </div>
        </div>

        {data.keyThemes?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Key Themes</h4>
            <div className="flex flex-wrap gap-1">
              {data.keyThemes.map((theme: string, i: number) => (
                <Badge key={i} variant="outline">{theme}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.recommendations?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.recommendations.map((r: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPlaybook = () => {
    const data = playbookAnalysis?.result as any;
    if (!data) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No playbook generated yet</p>
          <Button 
            onClick={() => handleAnalyze('playbook')}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'playbook' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Playbook
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SavedBadge generatedAt={playbookAnalysis.generated_at} />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAnalyze('playbook')}
            disabled={analyzeMutation.isPending}
            title="Regenerate analysis"
          >
            <RefreshCw className={`h-4 w-4 ${analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'playbook' ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2">Quick Summary</h4>
            <p className="text-sm">{data.quickSummary}</p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Personality Insights</h4>
          <p className="text-sm text-muted-foreground">{data.personalityInsights}</p>
        </div>

        {data.recentInteractions && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recent Interactions</h4>
            <p className="text-sm text-muted-foreground">{data.recentInteractions}</p>
          </div>
        )}

        {data.conversationStarters?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">💬 Conversation Starters</h4>
            <ul className="text-sm space-y-1">
              {data.conversationStarters.map((c: string, i: number) => (
                <li key={i} className="p-2 rounded bg-muted/50">{c}</li>
              ))}
            </ul>
          </div>
        )}

        {data.thingsToRemember?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">📝 Things to Remember</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.thingsToRemember.map((t: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.topicsToAvoid?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">⚠️ Topics to Avoid</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.topicsToAvoid.map((t: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.followUpActions?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">📋 Follow-up Actions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.followUpActions.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderScore = () => {
    const data = scoreAnalysis?.result as any;
    if (!data) {
      return (
        <div className="text-center py-8">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No relationship score yet</p>
          <Button 
            onClick={() => handleAnalyze('relationship_score')}
            disabled={analyzeMutation.isPending}
          >
            {analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'relationship_score' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Calculate Score
          </Button>
        </div>
      );
    }

    const gradeColors: Record<string, string> = {
      'A+': 'text-green-500',
      'A': 'text-green-500',
      'B+': 'text-blue-500',
      'B': 'text-blue-500',
      'C+': 'text-yellow-500',
      'C': 'text-yellow-500',
      'D': 'text-orange-500',
      'F': 'text-red-500',
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <SavedBadge generatedAt={scoreAnalysis.generated_at} />
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAnalyze('relationship_score')}
            disabled={analyzeMutation.isPending}
            title="Regenerate analysis"
          >
            <RefreshCw className={`h-4 w-4 ${analyzeMutation.isPending && analyzeMutation.variables?.analysisType === 'relationship_score' ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold">{data.score}</div>
            <p className="text-sm text-muted-foreground">out of 100</p>
          </div>
          <div className={`text-6xl font-bold ${gradeColors[data.grade]}`}>
            {data.grade}
          </div>
        </div>

        {data.factors?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Score Breakdown</h4>
            <div className="space-y-2">
              {data.factors.map((f: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm">
                      <span>{f.name}</span>
                      <span className="font-medium">{f.score}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${f.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.strengths?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Strengths</h4>
            <div className="flex flex-wrap gap-1">
              {data.strengths.map((s: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-green-100 text-green-800">{s}</Badge>
              ))}
            </div>
          </div>
        )}

        {data.areasForImprovement?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Areas for Improvement</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.areasForImprovement.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.suggestedActions?.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Suggested Actions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {data.suggestedActions.map((a: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Insights for {profileName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personality">
              <Brain className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment">
              <TrendingUp className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="playbook">
              <FileText className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Playbook</span>
            </TabsTrigger>
            <TabsTrigger value="score">
              <Users className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Score</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personality" className="mt-4">
            {isLoadingAnalyses ? <AnalysisSkeleton /> : renderPersonality()}
          </TabsContent>

          <TabsContent value="sentiment" className="mt-4">
            {isLoadingAnalyses ? <AnalysisSkeleton /> : renderSentiment()}
          </TabsContent>

          <TabsContent value="playbook" className="mt-4">
            {isLoadingAnalyses ? <AnalysisSkeleton /> : renderPlaybook()}
          </TabsContent>

          <TabsContent value="score" className="mt-4">
            {isLoadingAnalyses ? <AnalysisSkeleton /> : renderScore()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
