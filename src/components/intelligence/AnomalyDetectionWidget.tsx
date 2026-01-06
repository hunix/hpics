import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, TrendingDown, Clock, MessageSquare,
  RefreshCw, Check, ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Anomaly {
  id: string;
  profile_id: string;
  anomaly_type: string;
  severity: string;
  description: string | null;
  expected_value: Record<string, any>;
  actual_value: Record<string, any>;
  deviation_score: number | null;
  is_resolved: boolean;
  detected_at: string;
  profile?: { first_name: string; last_name: string | null };
}

const anomalyIcons: Record<string, any> = {
  frequency_drop: TrendingDown,
  sentiment_shift: MessageSquare,
  unusual_silence: Clock,
  pattern_break: AlertTriangle,
};

const severityColors: Record<string, { badge: string; border: string }> = {
  critical: { badge: 'destructive', border: 'border-red-500/50' },
  high: { badge: 'destructive', border: 'border-orange-500/50' },
  medium: { badge: 'default', border: 'border-yellow-500/50' },
  low: { badge: 'secondary', border: 'border-blue-500/50' },
};

export function AnomalyDetectionWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['behavioral-anomalies', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_anomalies')
        .select(`
          *,
          profile:profiles(first_name, last_name)
        `)
        .eq('user_id', user!.id)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Anomaly[];
    },
    enabled: !!user,
  });

  const detectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('detect-anomalies');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-anomalies'] });
      toast.success(`Detected ${data.anomalies_detected} anomalies, updated ${data.baselines_updated} baselines`);
    },
    onError: (error) => {
      toast.error('Detection failed: ' + error.message);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (anomalyId: string) => {
      const { error } = await supabase
        .from('behavioral_anomalies')
        .update({ is_resolved: true })
        .eq('id', anomalyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-anomalies'] });
      toast.success('Anomaly resolved');
    },
  });

  const getSeverityInfo = (severity: string) => severityColors[severity] || severityColors.medium;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = anomalies?.filter(a => a.severity === 'critical' || a.severity === 'high').length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Anomaly Detection
              {criticalCount > 0 && (
                <Badge variant="destructive">{criticalCount} Critical</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Behavioral deviations and pattern breaks
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => detectMutation.mutate()}
            disabled={detectMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${detectMutation.isPending ? 'animate-spin' : ''}`} />
            Scan
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {anomalies && anomalies.length > 0 ? (
            <div className="space-y-3">
              {anomalies.map(anomaly => {
                const Icon = anomalyIcons[anomaly.anomaly_type] || AlertTriangle;
                const severityInfo = getSeverityInfo(anomaly.severity);
                
                return (
                  <div
                    key={anomaly.id}
                    className={`p-4 rounded-lg border ${severityInfo.border} bg-card`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium capitalize">
                              {anomaly.anomaly_type.replace(/_/g, ' ')}
                            </span>
                            <Badge variant={severityInfo.badge as any}>
                              {anomaly.severity}
                            </Badge>
                            {anomaly.deviation_score && anomaly.deviation_score > 2 && (
                              <Badge variant="outline">
                                {anomaly.deviation_score.toFixed(1)}σ deviation
                              </Badge>
                            )}
                          </div>
                          {anomaly.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {anomaly.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {anomaly.profile && (
                              <button
                                onClick={() => navigate(`/contacts/${anomaly.profile_id}`)}
                                className="font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                {anomaly.profile.first_name} {anomaly.profile.last_name}
                                <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                            <span>
                              {formatDistanceToNow(new Date(anomaly.detected_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resolveMutation.mutate(anomaly.id)}
                        title="Mark as resolved"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Check className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No anomalies detected</p>
              <p className="text-sm">All behavioral patterns are within normal ranges</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
