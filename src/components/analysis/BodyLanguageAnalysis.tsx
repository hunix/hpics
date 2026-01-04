import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Loader2, Shield, Heart, Activity,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { format } from 'date-fns';
import { useAIConfirmationContext } from '@/contexts/AIConfirmationContext';
import { useAIModelPreference } from '@/hooks/useAIModelPreference';
import { calculateCostCents } from '@/lib/aiPricing';

interface BodyLanguageAnalysisProps {
  profileId: string;
  profileName: string;
}

export function BodyLanguageAnalysis({ profileId, profileName }: BodyLanguageAnalysisProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<string>('');
  const { requestConfirmation, updateLogWithResult } = useAIConfirmationContext();
  const modelKey = useAIModelPreference('analyze-body-language');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['body-language-analyses', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_language_analyses')
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
        e.model_type === 'vision' || e.model_type === 'body_language' || e.model_type === 'general'
      )?.endpoint_url;

      const { data, error } = await supabase.functions.invoke('analyze-body-language', {
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
      queryClient.invalidateQueries({ queryKey: ['body-language-analyses', profileId] });
      toast({ title: 'Analysis complete', description: 'Body language analysis has been generated.' });
      setVideoUrl('');
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const getPostureIcon = (posture: string) => {
    switch (posture?.toLowerCase()) {
      case 'open':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
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
              <Users className="h-5 w-5" />
              Body Language Analysis
            </CardTitle>
            <CardDescription>
              Posture, gestures, rapport signals, and interpersonal dynamics
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
              <Activity className="mr-2 h-4 w-4" />
            )}
            Run Body Language Analysis
          </Button>
        </div>

        {!analyses?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No body language analysis yet</p>
            <p className="text-sm">Upload a video or select a recording to analyze</p>
          </div>
        ) : latestAnalysis && (
          <div className="space-y-4">
            {/* Posture Analysis */}
            {latestAnalysis.posture_analysis && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    {getPostureIcon((latestAnalysis.posture_analysis as any).primary_posture)}
                    Posture
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span>{(latestAnalysis.posture_analysis as any).confidence_indicators}%</span>
                    </div>
                    <Progress value={(latestAnalysis.posture_analysis as any).confidence_indicators} className="h-2" />
                    <div className="flex justify-between text-sm">
                      <span>Comfort Level</span>
                      <span>{(latestAnalysis.posture_analysis as any).comfort_level}%</span>
                    </div>
                    <Progress value={(latestAnalysis.posture_analysis as any).comfort_level} className="h-2" />
                  </div>
                  <Badge className="mt-3 capitalize">
                    {(latestAnalysis.posture_analysis as any).power_dynamics}
                  </Badge>
                </div>

                {/* Rapport Signals */}
                {latestAnalysis.rapport_signals && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4" />
                      Rapport Signals
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Synchrony Level</span>
                        <span>{(latestAnalysis.rapport_signals as any).synchrony_level}%</span>
                      </div>
                      <Progress value={(latestAnalysis.rapport_signals as any).synchrony_level} className="h-2" />
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={(latestAnalysis.rapport_signals as any).mirroring_observed ? 'default' : 'secondary'}>
                          {(latestAnalysis.rapport_signals as any).mirroring_observed ? 'Mirroring' : 'No Mirroring'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gesture Patterns */}
            {latestAnalysis.gesture_patterns && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4" />
                  Gesture Patterns
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  {(latestAnalysis.gesture_patterns as any).barriers?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-amber-600">Barriers</p>
                      <ul className="text-sm text-muted-foreground">
                        {(latestAnalysis.gesture_patterns as any).barriers.slice(0, 3).map((b: string, i: number) => (
                          <li key={i}>• {b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(latestAnalysis.gesture_patterns as any).openness_signals?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-green-600">Openness Signals</p>
                      <ul className="text-sm text-muted-foreground">
                        {(latestAnalysis.gesture_patterns as any).openness_signals.slice(0, 3).map((s: string, i: number) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comfort Indicators */}
            {latestAnalysis.comfort_indicators && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4" />
                  Comfort Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Comfort</span>
                    <span>{(latestAnalysis.comfort_indicators as any).overall_comfort}%</span>
                  </div>
                  <Progress value={(latestAnalysis.comfort_indicators as any).overall_comfort} className="h-2" />
                </div>
                {(latestAnalysis.comfort_indicators as any).discomfort_triggers?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Discomfort Triggers:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(latestAnalysis.comfort_indicators as any).discomfort_triggers.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
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
