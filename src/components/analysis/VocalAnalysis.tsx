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
import { 
  Volume2, Loader2, TrendingUp, AlertTriangle,
  Zap, MessageSquare, Smile
} from 'lucide-react';
import { format } from 'date-fns';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';

interface VocalAnalysisProps {
  profileId: string;
  profileName: string;
}

export function VocalAnalysis({ profileId, profileName }: VocalAnalysisProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('analyze-vocal');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['vocal-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocal_analyses')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profileId,
  });

  const { data: recordings } = useQuery({
    queryKey: ['contact-recordings', profileId],
    queryFn: async () => {
      const { data } = await supabase
        .from('meeting_recordings')
        .select('id, title, file_url')
        .eq('profile_id', profileId)
        .eq('status', 'completed');
      return data || [];
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
    mutationFn: async () => {
      if (!selectedRecording) throw new Error('Please select a recording');
      
      const recording = recordings?.find(r => r.id === selectedRecording);
      const localEndpoint = localEndpoints?.find(e => 
        e.model_type === 'audio' || e.model_type === 'vocal' || e.model_type === 'general'
      )?.endpoint_url;

      const { data, error } = await supabase.functions.invoke('analyze-vocal', {
        body: {
          profileId,
          userId: user?.id,
          recordingId: selectedRecording,
          audioUrl: recording?.file_url,
          localEndpoint,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocal-analyses', profileId] });
      toast({ title: 'Analysis complete', description: 'Vocal analysis has been generated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

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
              <Volume2 className="h-5 w-5" />
              Vocal Analysis
            </CardTitle>
            <CardDescription>
              Speech patterns, stress points, mood changes, and vocal indicators
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Input */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="space-y-2">
            <Select 
              value={selectedRecording || undefined} 
              onValueChange={setSelectedRecording}
              disabled={!recordings?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={recordings?.length ? "Select a transcribed recording" : "No recordings available"} />
              </SelectTrigger>
              <SelectContent>
                {recordings?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending || !selectedRecording}
            className="w-full"
          >
            {runAnalysis.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="mr-2 h-4 w-4" />
            )}
            Run Vocal Analysis
          </Button>
        </div>

        {!analyses?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No vocal analysis yet</p>
            <p className="text-sm">Select a transcribed recording to analyze vocal patterns</p>
          </div>
        ) : latestAnalysis && (
          <div className="space-y-4">
            {/* Speech Patterns */}
            {latestAnalysis.speech_patterns && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Speech Patterns
                </h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Pace</p>
                    <p className="font-medium capitalize">{(latestAnalysis.speech_patterns as any).average_pace}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fluency</p>
                    <div className="flex items-center gap-2">
                      <Progress value={(latestAnalysis.speech_patterns as any).fluency_score} className="h-2 flex-1" />
                      <span className="text-sm">{(latestAnalysis.speech_patterns as any).fluency_score}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Filler Words</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(latestAnalysis.speech_patterns as any).filler_words?.slice(0, 3).map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Confidence Indicators */}
            {latestAnalysis.confidence_indicators && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4" />
                  Confidence Level
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Confidence</span>
                    <span>{(latestAnalysis.confidence_indicators as any).overall_confidence}%</span>
                  </div>
                  <Progress value={(latestAnalysis.confidence_indicators as any).overall_confidence} className="h-3" />
                </div>
                <div className="grid gap-2 md:grid-cols-2 mt-3">
                  {(latestAnalysis.confidence_indicators as any).strong_moments?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600">Strong Moments</p>
                      <ul className="text-xs text-muted-foreground">
                        {(latestAnalysis.confidence_indicators as any).strong_moments.slice(0, 2).map((m: string, i: number) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(latestAnalysis.confidence_indicators as any).weak_moments?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-600">Hesitation Points</p>
                      <ul className="text-xs text-muted-foreground">
                        {(latestAnalysis.confidence_indicators as any).weak_moments.slice(0, 2).map((m: string, i: number) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stress Points */}
            {latestAnalysis.stress_points && (latestAnalysis.stress_points as any[]).length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4" />
                  Stress Points
                </h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {(latestAnalysis.stress_points as any[]).map((point, i) => (
                      <div key={i} className="flex items-start justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm">{point.context}</p>
                          <p className="text-xs text-muted-foreground">{point.indicators?.join(', ')}</p>
                        </div>
                        <Badge variant={point.intensity > 70 ? 'destructive' : 'secondary'}>
                          {point.intensity}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Mood Changes */}
            {latestAnalysis.mood_changes && (latestAnalysis.mood_changes as any[]).length > 0 && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Smile className="h-4 w-4" />
                  Mood Timeline
                </h4>
                <div className="grid gap-2 md:grid-cols-3">
                  {(latestAnalysis.mood_changes as any[]).map((phase, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground capitalize">{phase.phase}</p>
                      <p className="font-medium capitalize">{phase.mood}</p>
                      <div className="flex gap-2 mt-2 justify-center">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Energy</p>
                          <p className="text-sm">{phase.energy_level}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Engagement</p>
                          <p className="text-sm">{phase.engagement}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deception Likelihood */}
            {latestAnalysis.deception_likelihood && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Deception Risk Assessment
                  </h4>
                  <Badge 
                    variant={(latestAnalysis.deception_likelihood as any).risk_level === 'low' ? 'default' : 'destructive'}
                  >
                    {(latestAnalysis.deception_likelihood as any).risk_level} risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(latestAnalysis.deception_likelihood as any).disclaimer}
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground flex items-center justify-between pt-2 border-t">
              <span>Model: {latestAnalysis.ai_model_used}</span>
              <span>{format(new Date(latestAnalysis.created_at), 'MMM d, yyyy HH:mm')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
