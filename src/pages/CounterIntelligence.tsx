import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  ShieldAlert, AlertTriangle, Eye, UserX, Activity, 
  TrendingDown, Clock, RefreshCw, CheckCircle, XCircle,
  Fingerprint, Brain, Target, AlertCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export default function CounterIntelligence() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch threat assessments
  const { data: threats, isLoading: threatsLoading } = useQuery({
    queryKey: ['threat-assessments', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('threat_assessments')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url)
        `)
        .order('overall_risk_score', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch behavioral anomalies
  const { data: anomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ['behavioral-anomalies', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('behavioral_anomalies')
        .select(`
          *,
          profiles (first_name, last_name, avatar_url)
        `)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch identity confidence stats
  const { data: identityStats, isLoading: identityLoading } = useQuery({
    queryKey: ['identity-confidence-stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('contact_biometrics')
        .select('identity_confidence, facial_confidence, voice_confidence, profile_id');
      
      const total = data?.length || 0;
      const high = data?.filter(d => (d.identity_confidence || 0) >= 80).length || 0;
      const medium = data?.filter(d => (d.identity_confidence || 0) >= 50 && (d.identity_confidence || 0) < 80).length || 0;
      const low = data?.filter(d => (d.identity_confidence || 0) < 50).length || 0;
      const unverified = data?.filter(d => !d.identity_confidence).length || 0;
      
      return { total, high, medium, low, unverified };
    },
    enabled: !!user,
  });

  // Fetch deception indicators from ai_analyses
  const { data: deceptionData, isLoading: deceptionLoading } = useQuery({
    queryKey: ['deception-indicators', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_analyses')
        .select(`
          id,
          profile_id,
          result,
          generated_at,
          profiles (first_name, last_name)
        `)
        .eq('analysis_type', 'deception_analysis')
        .order('generated_at', { ascending: false })
        .limit(20);
      return (data || []).map((d: any) => ({
        id: d.id,
        profile_id: d.profile_id,
        profiles: d.profiles,
        analyzed_at: d.generated_at,
        deception_probability: d.result?.deception_probability || 0,
        deception_indicators: d.result?.indicators || [],
      }));
    },
    enabled: !!user,
  });

  // Run threat scan mutation
  const runThreatScan = useMutation({
    mutationFn: async () => {
      const { error } = await invokeFunction('batch-intelligence-init', { jobType: 'threat_assessment' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Threat assessment scan started');
      queryClient.invalidateQueries({ queryKey: ['threat-assessments'] });
    },
    onError: (error: Error) => {
      toast.error(`Scan failed: ${error.message}`);
    },
  });

  // Resolve anomaly mutation
  const resolveAnomaly = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('behavioral_anomalies')
        .update({ is_resolved: true, resolution_notes: 'Marked as resolved' })
        .eq('id', anomalyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-anomalies'] });
      toast.success('Anomaly resolved');
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Critical', color: 'destructive' };
    if (score >= 60) return { label: 'High', color: 'destructive' };
    if (score >= 40) return { label: 'Medium', color: 'secondary' };
    return { label: 'Low', color: 'outline' };
  };

  const highRiskCount = threats?.filter((t: any) => (t.overall_risk_score || 0) >= 60).length || 0;
  const unresolvedAnomalies = anomalies?.length || 0;

  return (
    <AppLayout title="Counter-Intelligence">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                High Risk Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {threatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-red-500">{highRiskCount}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-yellow-500" />
                Unresolved Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomaliesLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-yellow-500">{unresolvedAnomalies}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Fingerprint className="h-4 w-4 text-blue-500" />
                Verified Identities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {identityLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{identityStats?.high || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                Deception Flags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deceptionLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{deceptionData?.length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end">
          <Button 
            onClick={() => runThreatScan.mutate()}
            disabled={runThreatScan.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${runThreatScan.isPending ? 'animate-spin' : ''}`} />
            Run Full Threat Scan
          </Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="threats" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="threats" className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Threat Assessment
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Behavioral Anomalies
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              Identity Confidence
            </TabsTrigger>
            <TabsTrigger value="deception" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Deception Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="threats" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Threat Assessments</CardTitle>
                <CardDescription>
                  Contacts ranked by potential risk indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {threatsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : threats && threats.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {threats.map((threat: any) => {
                        const risk = getRiskLevel(threat.overall_risk_score || 0);
                        return (
                          <div key={threat.id} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <AlertTriangle className={`h-5 w-5 ${threat.overall_risk_score >= 60 ? 'text-red-500' : 'text-yellow-500'}`} />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {threat.profiles?.first_name} {threat.profiles?.last_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {threat.primary_concerns?.slice(0, 2).join(', ') || 'No specific concerns'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant={risk.color as any}>{risk.label}</Badge>
                              <div className="text-right">
                                <p className="font-bold">{threat.overall_risk_score || 0}</p>
                                <p className="text-xs text-muted-foreground">risk score</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No threat assessments yet</p>
                    <p className="text-sm">Run a threat scan to analyze your contacts</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Anomalies</CardTitle>
                <CardDescription>
                  Unusual patterns detected in contact behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                {anomaliesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : anomalies && anomalies.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {anomalies.map((anomaly: any) => (
                        <div key={anomaly.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className={`h-3 w-3 rounded-full ${getSeverityColor(anomaly.severity)}`} />
                            <div>
                              <p className="font-medium">
                                {anomaly.profiles?.first_name} {anomaly.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {anomaly.anomaly_type}: {anomaly.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Detected {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{anomaly.severity}</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => resolveAnomaly.mutate(anomaly.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No behavioral anomalies detected</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Identity Verification Status</CardTitle>
                  <CardDescription>
                    Confidence levels for contact identity verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {identityLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-green-500" />
                          High Confidence (80%+)
                        </span>
                        <span className="font-bold">{identityStats?.high || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-yellow-500" />
                          Medium Confidence (50-79%)
                        </span>
                        <span className="font-bold">{identityStats?.medium || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-500" />
                          Low Confidence (&lt;50%)
                        </span>
                        <span className="font-bold">{identityStats?.low || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-muted" />
                          Unverified
                        </span>
                        <span className="font-bold">{identityStats?.unverified || 0}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Coverage</CardTitle>
                  <CardDescription>
                    Overall identity verification progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {identityLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold">
                          {identityStats?.total ? Math.round(((identityStats.high + identityStats.medium) / identityStats.total) * 100) : 0}%
                        </div>
                        <p className="text-sm text-muted-foreground">Contacts verified</p>
                      </div>
                      <Progress 
                        value={identityStats?.total ? ((identityStats.high + identityStats.medium) / identityStats.total) * 100 : 0} 
                        className="h-3"
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        {(identityStats?.high || 0) + (identityStats?.medium || 0)} of {identityStats?.total || 0} contacts verified
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deception" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deception Analysis Timeline</CardTitle>
                <CardDescription>
                  Historical deception indicators detected in communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {deceptionLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : deceptionData && deceptionData.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {deceptionData.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-4">
                            <Eye className="h-5 w-5 text-purple-500" />
                            <div>
                              <p className="font-medium">
                                {item.profiles?.first_name} {item.profiles?.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {item.deception_indicators?.length || 0} indicators detected
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.analyzed_at), 'PPp')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{Math.round((item.deception_probability || 0) * 100)}%</p>
                            <p className="text-xs text-muted-foreground">probability</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No deception analyses yet</p>
                    <p className="text-sm">Analyses are performed during communication processing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
