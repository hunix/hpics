import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Layers, Brain, Eye, Mic, Activity, AlertTriangle, CheckCircle, 
  XCircle, HelpCircle, Loader2, RefreshCw, TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { ModalityCorrelationMatrix } from './ModalityCorrelationMatrix';
import { invokeFunction } from '@/lib/api';

interface ModalityData {
  type: 'vocal' | 'facial' | 'body_language' | 'behavioral' | 'text';
  confidence: number;
  keyFindings: string[];
  timestamp: string;
}

interface SynthesisResult {
  corroborated: Array<{ finding: string; modalities: string[]; confidence: number }>;
  contradictions: Array<{ finding: string; modalities: string[]; severity: 'low' | 'medium' | 'high' }>;
  deception: { riskLevel: 'low' | 'medium' | 'high'; indicators: string[]; confidence: number };
  insights: string[];
  summary: string;
  overallConfidence: number;
}

export function CrossModalIntelligenceHub() {
  const { user } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-hub', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, is_favorite, updated_at')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .order('is_favorite', { ascending: false })
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('first_name')
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: modalityData, isLoading: loadingModalities } = useQuery({
    queryKey: ['modality-data', selectedProfile],
    queryFn: async (): Promise<ModalityData[]> => {
      if (!selectedProfile) return [];
      
      const modalities: ModalityData[] = [];

      // Fetch vocal analyses
      const { data: vocalData } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .eq('analysis_type', 'vocal')
        .order('generated_at', { ascending: false })
        .limit(1);

      if (vocalData?.[0]) {
        const result = vocalData[0].result as Record<string, unknown>;
        modalities.push({
          type: 'vocal',
          confidence: (result.confidence as number) || 0.7,
          keyFindings: (result.key_findings as string[]) || [],
          timestamp: vocalData[0].generated_at,
        });
      }

      // Fetch facial analyses
      const { data: facialData } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .eq('analysis_type', 'facial')
        .order('generated_at', { ascending: false })
        .limit(1);

      if (facialData?.[0]) {
        const result = facialData[0].result as Record<string, unknown>;
        modalities.push({
          type: 'facial',
          confidence: (result.confidence as number) || 0.75,
          keyFindings: (result.key_findings as string[]) || [],
          timestamp: facialData[0].generated_at,
        });
      }

      // Fetch body language analyses
      const { data: bodyData } = await supabase
        .from('body_language_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .order('created_at', { ascending: false })
        .limit(1);

      if (bodyData?.[0]) {
        modalities.push({
          type: 'body_language',
          confidence: bodyData[0].confidence_score || 0.65,
          keyFindings: [],
          timestamp: bodyData[0].created_at,
        });
      }

      // Fetch behavioral analyses
      const { data: behavioralData } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .neq('analysis_type', 'cross_modal')
        .order('created_at', { ascending: false })
        .limit(1);

      if (behavioralData?.[0]) {
        modalities.push({
          type: 'behavioral',
          confidence: behavioralData[0].confidence_score || 0.7,
          keyFindings: [],
          timestamp: behavioralData[0].created_at,
        });
      }

      return modalities;
    },
    enabled: !!selectedProfile,
  });

  const { data: synthesis, refetch: refetchSynthesis } = useQuery({
    queryKey: ['synthesis-result', selectedProfile],
    queryFn: async (): Promise<SynthesisResult | null> => {
      const { data } = await supabase
        .from('behavioral_analyses')
        .select('*')
        .eq('profile_id', selectedProfile)
        .eq('analysis_type', 'cross_modal')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return null;

      const raw = data.raw_analysis as Record<string, unknown>;
      return {
        corroborated: (raw.corroborated_findings || []) as SynthesisResult['corroborated'],
        contradictions: (raw.contradictions || []) as SynthesisResult['contradictions'],
        deception: (raw.deception_assessment || { riskLevel: 'low', indicators: [], confidence: 0 }) as SynthesisResult['deception'],
        insights: (raw.confidence_boosted_insights || []) as string[],
        summary: (raw.overall_summary || '') as string,
        overallConfidence: data.confidence_score || 0.5,
      };
    },
    enabled: !!selectedProfile,
  });

  const synthesizeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('cross-modal-synthesis', { profileId: selectedProfile },);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refetchSynthesis();
      toast.success('Cross-modal synthesis complete');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getModalityIcon = (type: string) => {
    switch (type) {
      case 'vocal': return <Mic className="h-4 w-4" />;
      case 'facial': return <Eye className="h-4 w-4" />;
      case 'body_language': return <Activity className="h-4 w-4" />;
      case 'behavioral': return <Brain className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high': return <Badge variant="destructive">High Risk</Badge>;
      case 'medium': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Medium Risk</Badge>;
      default: return <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Low Risk</Badge>;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Cross-Modal Intelligence Hub
        </CardTitle>
        <CardDescription>
          Unified analysis across voice, facial, body language, and behavioral data
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
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synthesize
          </Button>
        </div>

        {selectedProfile && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="correlations">Correlations</TabsTrigger>
              <TabsTrigger value="contradictions">Contradictions</TabsTrigger>
              <TabsTrigger value="deception">Deception</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Modality Status */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['vocal', 'facial', 'body_language', 'behavioral'].map(type => {
                  const data = modalityData?.find(m => m.type === type);
                  return (
                    <div key={type} className={`p-3 border rounded-lg ${data ? 'bg-primary/5' : 'bg-muted/50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getModalityIcon(type)}
                        <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      {data ? (
                        <div>
                          <Progress value={data.confidence * 100} className="h-2 mb-1" />
                          <span className="text-xs text-muted-foreground">{(data.confidence * 100).toFixed(0)}% confidence</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No data</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              {synthesis && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Overall Assessment</h4>
                      <Badge variant="outline">
                        {(synthesis.overallConfidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{synthesis.summary || 'No summary available'}</p>
                  </div>

                  {synthesis.insights.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        High-Confidence Insights
                      </h4>
                      <ul className="space-y-1">
                        {synthesis.insights.map((insight, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="correlations" className="mt-4">
              <ModalityCorrelationMatrix profileId={selectedProfile} />
            </TabsContent>

            <TabsContent value="contradictions" className="mt-4">
              <ScrollArea className="h-[400px]">
                {synthesis?.contradictions && synthesis.contradictions.length > 0 ? (
                  <div className="space-y-3">
                    {synthesis.contradictions.map((c, idx) => (
                      <div key={idx} className="p-4 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">Contradiction Detected</span>
                          </div>
                          <Badge variant={c.severity === 'high' ? 'destructive' : 'secondary'}>
                            {c.severity} severity
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{c.finding}</p>
                        <div className="flex gap-2">
                          {c.modalities.map(m => (
                            <Badge key={m} variant="outline" className="text-xs">
                              {getModalityIcon(m)}
                              <span className="ml-1">{m}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                    <p>No contradictions detected</p>
                    <p className="text-sm">All modalities show consistent signals</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="deception" className="mt-4">
              {synthesis?.deception ? (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Deception Risk Assessment</h4>
                      {getRiskBadge(synthesis.deception.riskLevel)}
                    </div>
                    <Progress 
                      value={synthesis.deception.confidence * 100} 
                      className={`h-3 mb-2 ${
                        synthesis.deception.riskLevel === 'high' ? '[&>div]:bg-destructive' :
                        synthesis.deception.riskLevel === 'medium' ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'
                      }`}
                    />
                    <p className="text-sm text-muted-foreground">
                      Assessment confidence: {(synthesis.deception.confidence * 100).toFixed(0)}%
                    </p>
                  </div>

                  {synthesis.deception.indicators.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detected Indicators</h4>
                      <ul className="space-y-2">
                        {synthesis.deception.indicators.map((ind, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm p-2 border rounded">
                            <XCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                            {ind}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No deception assessment available</p>
                  <p className="text-sm">Run synthesis to analyze deception indicators</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!selectedProfile && (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Select a contact to view cross-modal intelligence</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
