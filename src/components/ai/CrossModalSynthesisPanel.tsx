import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Layers, Eye, Mic, Brain, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SynthesisResult {
  id: string;
  profile_id: string;
  synthesis_type: string;
  corroborated_findings: Array<{ finding: string; modalities: string[]; confidence: number }>;
  contradictions: Array<{ finding: string; modalities: string[]; severity: string }>;
  unified_baseline: Record<string, unknown>;
  deception_assessment: { risk_level: string; indicators: string[] };
  confidence_boosted_insights: string[];
  overall_summary: string;
  created_at: string;
}

export function CrossModalSynthesisPanel() {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<string>('');

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-synthesis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('first_name')
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: synthesis, isLoading: loadingSynthesis, refetch } = useQuery({
    queryKey: ['cross-modal-synthesis', selectedProfile],
    queryFn: async () => {
      // Cross-modal syntheses are stored in behavioral_analyses with type 'cross_modal'
      const { data, error } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .eq('analysis_type', 'cross_modal')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      
      // Map behavioral_analyses to SynthesisResult format
      if (!data) return null;
      const rawAnalysis = data.raw_analysis as Record<string, unknown> || {};
      return {
        id: data.id,
        profile_id: data.profile_id,
        synthesis_type: 'cross_modal',
        corroborated_findings: (rawAnalysis.corroborated_findings || []) as SynthesisResult['corroborated_findings'],
        contradictions: (rawAnalysis.contradictions || []) as SynthesisResult['contradictions'],
        unified_baseline: (rawAnalysis.unified_baseline || {}) as Record<string, unknown>,
        deception_assessment: (rawAnalysis.deception_assessment || { risk_level: 'unknown', indicators: [] }) as SynthesisResult['deception_assessment'],
        confidence_boosted_insights: (rawAnalysis.confidence_boosted_insights || []) as string[],
        overall_summary: (rawAnalysis.overall_summary || 'No summary available') as string,
        created_at: data.created_at,
      } as SynthesisResult;
    },
    enabled: !!selectedProfile,
  });

  const synthesizeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProfile) throw new Error('Select a contact first');
      const { data, error } = await supabase.functions.invoke('cross-modal-synthesis', {
        body: { profileId: selectedProfile },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetch();
      toast.success('Cross-modal synthesis complete');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const result = synthesis as SynthesisResult | null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Cross-Modal Synthesis
        </CardTitle>
        <CardDescription>
          Correlate insights across voice, facial, behavioral, and text analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.first_name} {p.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => synthesizeMutation.mutate()}
            disabled={!selectedProfile || synthesizeMutation.isPending}
          >
            {synthesizeMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Brain className="h-4 w-4 mr-2" />
            )}
            Synthesize
          </Button>
        </div>

        {loadingSynthesis && selectedProfile && (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {result && (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Overall Summary</h4>
                <p className="text-sm text-muted-foreground">{result.overall_summary}</p>
              </div>

              {/* Corroborated Findings */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Corroborated Findings
                </h4>
                <div className="space-y-2">
                  {result.corroborated_findings?.map((finding, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <p className="text-sm mb-2">{finding.finding}</p>
                      <div className="flex items-center gap-2">
                        {finding.modalities?.map((m) => (
                          <Badge key={m} variant="outline" className="text-xs">
                            {m === 'vocal' && <Mic className="h-3 w-3 mr-1" />}
                            {m === 'facial' && <Eye className="h-3 w-3 mr-1" />}
                            {m === 'behavioral' && <Brain className="h-3 w-3 mr-1" />}
                            {m}
                          </Badge>
                        ))}
                        <Progress 
                          value={(finding.confidence || 0) * 100} 
                          className="w-20 h-2 ml-auto" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {((finding.confidence || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground">No corroborated findings</p>
                  )}
                </div>
              </div>

              {/* Contradictions */}
              {result.contradictions && result.contradictions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Detected Contradictions
                  </h4>
                  <div className="space-y-2">
                    {result.contradictions.map((c, idx) => (
                      <div key={idx} className="p-3 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                        <p className="text-sm mb-2">{c.finding}</p>
                        <div className="flex items-center gap-2">
                          {c.modalities?.map((m) => (
                            <Badge key={m} variant="outline" className="text-xs">
                              {m}
                            </Badge>
                          ))}
                          <Badge 
                            variant={c.severity === 'high' ? 'destructive' : 'secondary'}
                            className="ml-auto"
                          >
                            {c.severity} severity
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deception Assessment */}
              {result.deception_assessment && (
                <div>
                  <h4 className="font-medium mb-3">Deception Assessment</h4>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">Risk Level:</span>
                      <Badge 
                        variant={
                          result.deception_assessment.risk_level === 'high' ? 'destructive' :
                          result.deception_assessment.risk_level === 'medium' ? 'secondary' : 'outline'
                        }
                      >
                        {result.deception_assessment.risk_level}
                      </Badge>
                    </div>
                    {result.deception_assessment.indicators?.length > 0 && (
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {result.deception_assessment.indicators.map((ind, idx) => (
                          <li key={idx}>{ind}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Confidence Boosted Insights */}
              {result.confidence_boosted_insights && result.confidence_boosted_insights.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    High-Confidence Insights
                  </h4>
                  <ul className="space-y-1">
                    {result.confidence_boosted_insights.map((insight, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {!result && selectedProfile && !loadingSynthesis && (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No synthesis available for this contact</p>
            <p className="text-sm">Click Synthesize to analyze cross-modal data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
