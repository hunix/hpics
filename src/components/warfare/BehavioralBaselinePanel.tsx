import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, AlertTriangle, TrendingUp, RefreshCw, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Baseline {
  id: string;
  profile_id: string;
  baseline_type: string;
  baseline_metrics: any;
  confidence_score: number;
  sample_size: number;
  anomaly_count: number;
  updated_at: string;
}

interface Anomaly {
  type: string;
  expected: number;
  actual: number;
  deviation: number;
  severity: string;
}

export function BehavioralBaselinePanel({ profileId }: { profileId?: string }) {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [isEstablishing, setIsEstablishing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBaselines();
  }, []);

  const fetchBaselines = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('behavioral-baseline-monitor', {
        body: { action: 'get_baselines' }
      });

      if (error) throw error;
      setBaselines(data.baselines || []);
    } catch (error) {
      console.error('Failed to fetch baselines:', error);
    }
  };

  const establishBaseline = async () => {
    if (!profileId) {
      toast({ title: 'Error', description: 'Profile ID required', variant: 'destructive' });
      return;
    }

    setIsEstablishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('behavioral-baseline-monitor', {
        body: { action: 'establish_baseline', profileId }
      });

      if (error) throw error;

      toast({
        title: 'Baseline Established',
        description: `Confidence: ${Math.round((data.baseline?.confidence_score || 0) * 100)}%`
      });
      fetchBaselines();
    } catch (error) {
      console.error('Baseline error:', error);
      toast({ title: 'Error', description: 'Failed to establish baseline', variant: 'destructive' });
    } finally {
      setIsEstablishing(false);
    }
  };

  const detectAnomalies = async () => {
    if (!profileId) {
      toast({ title: 'Error', description: 'Profile ID required', variant: 'destructive' });
      return;
    }

    setIsDetecting(true);
    try {
      // Simulate behavioral data for detection
      const { data, error } = await supabase.functions.invoke('behavioral-baseline-monitor', {
        body: {
          action: 'detect_anomalies',
          profileId,
          behavioralData: {
            frequency: 0.3,
            sentiment: -0.2,
            responseTime: 48
          }
        }
      });

      if (error) throw error;

      if (!data.success) {
        toast({ title: 'No Baseline', description: data.recommendation || 'Establish baseline first' });
        return;
      }

      setAnomalies(data.anomalies || []);
      setRiskAssessment(data.riskAssessment);

      if (data.anomalies?.length > 0) {
        toast({
          title: 'Anomalies Detected',
          description: `${data.anomalies.length} behavioral anomalies found`,
          variant: 'destructive'
        });
      } else {
        toast({ title: 'No Anomalies', description: 'Behavior within normal parameters' });
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast({ title: 'Error', description: 'Detection failed', variant: 'destructive' });
    } finally {
      setIsDetecting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-muted';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Behavioral Baseline Monitor
              </CardTitle>
              <CardDescription>
                Establish behavioral baselines and detect anomalous patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={establishBaseline} disabled={isEstablishing || !profileId}>
                <BarChart3 className={`h-4 w-4 mr-2 ${isEstablishing ? 'animate-pulse' : ''}`} />
                {isEstablishing ? 'Establishing...' : 'Establish Baseline'}
              </Button>
              <Button onClick={detectAnomalies} disabled={isDetecting || !profileId}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                {isDetecting ? 'Detecting...' : 'Detect Anomalies'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!profileId && (
            <div className="text-center py-8 text-muted-foreground">
              Select a profile to establish and monitor behavioral baselines
            </div>
          )}

          {profileId && baselines.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Established Baselines</h3>
              <div className="grid gap-4">
                {baselines.filter(b => b.profile_id === profileId).map(baseline => (
                  <Card key={baseline.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {baseline.baseline_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {baseline.sample_size} samples
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <Progress value={baseline.confidence_score * 100} className="w-20" />
                          <span className="text-sm font-medium">
                            {Math.round(baseline.confidence_score * 100)}%
                          </span>
                        </div>
                      </div>
                      {baseline.baseline_metrics && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Frequency:</span>
                            <span className="ml-2 font-medium">
                              {baseline.baseline_metrics.communicationFrequency?.toFixed(2) || 'N/A'}/day
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sentiment:</span>
                            <span className="ml-2 font-medium">
                              {baseline.baseline_metrics.averageSentiment?.toFixed(2) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Response Time:</span>
                            <span className="ml-2 font-medium">
                              {baseline.baseline_metrics.averageResponseTime?.toFixed(1) || 'N/A'}h
                            </span>
                          </div>
                        </div>
                      )}
                      {baseline.anomaly_count > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm">{baseline.anomaly_count} anomalies detected</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Detected Anomalies
                </h3>
                {riskAssessment && (
                  <Badge className={getSeverityColor(riskAssessment.level)}>
                    {riskAssessment.level} risk
                  </Badge>
                )}
              </div>
              <div className="space-y-3">
                {anomalies.map((anomaly, idx) => (
                  <Card key={idx} className="border-destructive/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium capitalize">
                          {anomaly.type.replace(/_/g, ' ')}
                        </span>
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Expected:</span>
                          <span className="ml-2">{anomaly.expected.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Actual:</span>
                          <span className="ml-2">{anomaly.actual.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deviation:</span>
                          <span className="ml-2 text-destructive">+{anomaly.deviation.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {riskAssessment?.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {riskAssessment.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
