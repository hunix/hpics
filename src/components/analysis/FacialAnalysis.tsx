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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, Loader2, Upload, AlertTriangle, 
  Smile, Frown, Meh, Zap, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';

interface FacialAnalysisProps {
  profileId: string;
  profileName: string;
}

export function FacialAnalysis({ profileId, profileName }: FacialAnalysisProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('analyze-facial');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['facial-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('facial_analyses')
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
        .select('id, title')
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
      const localEndpoint = localEndpoints?.find(e => 
        e.model_type === 'vision' || e.model_type === 'facial' || e.model_type === 'general'
      )?.endpoint_url;

      const { data, error } = await supabase.functions.invoke('analyze-facial', {
        body: {
          profileId,
          userId: user?.id,
          videoUrl: videoUrl || undefined,
          recordingId: selectedRecording || undefined,
          localEndpoint,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facial-analyses', profileId] });
      toast({ title: 'Analysis complete', description: 'Facial expression analysis has been generated.' });
      setVideoUrl('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getEmotionIcon = (emotion: string) => {
    switch (emotion?.toLowerCase()) {
      case 'happiness':
      case 'joy':
        return <Smile className="h-4 w-4 text-green-500" />;
      case 'sadness':
        return <Frown className="h-4 w-4 text-blue-500" />;
      case 'anger':
        return <Zap className="h-4 w-4 text-red-500" />;
      default:
        return <Meh className="h-4 w-4 text-gray-500" />;
    }
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
              <Eye className="h-5 w-5" />
              Facial & Micro-Expression Analysis
            </CardTitle>
            <CardDescription>
              Detect micro-expressions, stress indicators, and emotional patterns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analysis Input */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Video URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Or use recording</Label>
              <Select value={selectedRecording || undefined} onValueChange={(v) => setSelectedRecording(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recording" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {recordings?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="w-full"
          >
            {runAnalysis.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-2 h-4 w-4" />
            )}
            Run Facial Analysis
          </Button>
        </div>

        {!analyses?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No facial analysis yet</p>
            <p className="text-sm">Upload a video or select a recording to analyze</p>
          </div>
        ) : latestAnalysis && (
          <div className="space-y-4">
            {/* Stress Level */}
            {latestAnalysis.stress_indicators && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Stress Level
                  </span>
                  <span>{(latestAnalysis.stress_indicators as any).overall_level || 0}%</span>
                </div>
                <Progress value={(latestAnalysis.stress_indicators as any).overall_level || 0} className="h-2" />
              </div>
            )}

            {/* Emotional Timeline */}
            {latestAnalysis.emotional_timeline && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Emotional Timeline
                </h4>
                <div className="grid gap-2 md:grid-cols-3">
                  {(latestAnalysis.emotional_timeline as any[]).map((phase, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getEmotionIcon(phase.dominant_emotion)}
                        <span className="text-sm font-medium capitalize">{phase.phase}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 capitalize">
                        {phase.dominant_emotion}
                      </p>
                      <Badge 
                        variant={phase.congruence_with_speech ? 'default' : 'destructive'}
                        className="mt-2 text-xs"
                      >
                        {phase.congruence_with_speech ? 'Congruent' : 'Incongruent'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deception Indicators */}
            {latestAnalysis.deception_indicators && (
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Deception Risk Assessment
                  </h4>
                  <Badge 
                    variant={(latestAnalysis.deception_indicators as any).risk_level === 'low' ? 'default' : 'destructive'}
                  >
                    {(latestAnalysis.deception_indicators as any).risk_level} risk
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(latestAnalysis.deception_indicators as any).notes}
                </p>
                {(latestAnalysis.deception_indicators as any).observed_signs?.length > 0 && (
                  <ul className="text-sm space-y-1 mt-2">
                    {(latestAnalysis.deception_indicators as any).observed_signs.slice(0, 3).map((sign: string, i: number) => (
                      <li key={i} className="text-muted-foreground">• {sign}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Micro-expressions */}
            {latestAnalysis.micro_expressions && (latestAnalysis.micro_expressions as any[]).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Detected Micro-Expressions</h4>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {(latestAnalysis.micro_expressions as any[]).map((expr, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          {getEmotionIcon(expr.expression_type)}
                          <span className="text-sm capitalize">{expr.expression_type}</span>
                        </div>
                        <Badge variant="outline">{expr.intensity}%</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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
