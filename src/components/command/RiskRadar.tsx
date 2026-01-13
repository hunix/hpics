/**
 * Risk Radar Component
 * 360° threat/decay monitoring with edge function integration
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Shield, AlertTriangle, AlertCircle, Info, TrendingDown, Clock, RefreshCw, Scan } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface RiskRadarProps {
  compact?: boolean;
}

interface Risk {
  id: string;
  type: 'decay' | 'anomaly' | 'deception' | 'churn' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  profileName: string;
  profileId: string;
  detectedAt: Date;
  metrics: {
    currentValue: number;
    threshold: number;
    trend: 'worsening' | 'stable' | 'improving';
  };
}

export function RiskRadar({ compact = false }: RiskRadarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mutation to scan for risks using deception analysis
  const scanForRisks = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('cross-modal-deception-v2', {
        body: {
          userId: user?.id,
          analysisType: 'network_scan'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-radar'] });
      toast.success('Risk scan complete');
    },
    onError: (error) => {
      console.error('Scan failed:', error);
      toast.error('Risk scan failed');
    }
  });

  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risk-radar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch behavioral anomalies
      const { data: anomalies } = await supabase
        .from('behavioral_anomalies')
        .select(`
          id,
          anomaly_type,
          severity,
          description,
          deviation_score,
          detected_at,
          profile_id,
          profiles!behavioral_anomalies_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .eq('is_resolved', false)
        .order('detected_at', { ascending: false })
        .limit(compact ? 5 : 15);

      // Fetch deception analyses
      const { data: deceptions } = await supabase
        .from('deception_analyses')
        .select(`
          id,
          deception_score,
          analyzed_at,
          profile_id,
          profiles!deception_analyses_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .gt('deception_score', 0.5)
        .order('analyzed_at', { ascending: false })
        .limit(5);

      const riskList: Risk[] = [];

      if (anomalies) {
        anomalies.forEach(a => {
          riskList.push({
            id: a.id,
            type: 'anomaly',
            severity: a.severity as Risk['severity'],
            title: `Behavioral Anomaly: ${a.anomaly_type}`,
            description: a.description || 'Unusual pattern detected',
            profileName: a.profiles 
              ? `${a.profiles.first_name || ''} ${a.profiles.last_name || ''}`.trim()
              : 'Unknown',
            profileId: a.profile_id,
            detectedAt: new Date(a.detected_at),
            metrics: {
              currentValue: a.deviation_score || 0,
              threshold: 2,
              trend: 'worsening'
            }
          });
        });
      }

      if (deceptions) {
        deceptions.forEach((d: { id: string; deception_score: number | null; analyzed_at: string; profile_id: string; profiles: { first_name: string | null; last_name: string | null } | null }) => {
          const score = d.deception_score || 0;
          riskList.push({
            id: d.id,
            type: 'deception',
            severity: score > 0.8 ? 'critical' : score > 0.6 ? 'high' : 'medium',
            title: 'Credibility Concern',
            description: `Deception indicators detected (${(score * 100).toFixed(0)}% confidence)`,
            profileName: d.profiles 
              ? `${d.profiles.first_name || ''} ${d.profiles.last_name || ''}`.trim()
              : 'Unknown',
            profileId: d.profile_id,
            detectedAt: new Date(d.analyzed_at),
            metrics: {
              currentValue: score * 100,
              threshold: 50,
              trend: 'worsening'
            }
          });
        });
      }

      // Add simulated risks for demonstration if needed
      if (riskList.length < 2) {
        const sampleRisks: Risk[] = [
          {
            id: 'decay-1',
            type: 'decay',
            severity: 'high',
            title: 'Relationship Decay Alert',
            description: 'No contact in 45 days - relationship health declining',
            profileName: 'Sample Contact',
            profileId: '',
            detectedAt: new Date(),
            metrics: { currentValue: 45, threshold: 30, trend: 'worsening' }
          },
          {
            id: 'churn-1',
            type: 'churn',
            severity: 'medium',
            title: 'Churn Risk Detected',
            description: 'Response rate dropped 40% this month',
            profileName: 'Another Contact',
            profileId: '',
            detectedAt: new Date(),
            metrics: { currentValue: 40, threshold: 25, trend: 'worsening' }
          }
        ];
        riskList.push(...sampleRisks.slice(0, 2 - riskList.length));
      }

      return riskList.sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    },
    enabled: !!user?.id
  });

  const getSeverityIcon = (severity: Risk['severity']) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-rose-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: Risk['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    }
  };

  const getTypeIcon = (type: Risk['type']) => {
    switch (type) {
      case 'decay': return '📉';
      case 'anomaly': return '🔍';
      case 'deception': return '🎭';
      case 'churn': return '⚠️';
      case 'network': return '🕸️';
      default: return '❓';
    }
  };

  const criticalCount = risks.filter(r => r.severity === 'critical').length;
  const highCount = risks.filter(r => r.severity === 'high').length;

  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-[300px]')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-rose-500" />
            Risk Radar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && 'h-[300px]')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-rose-500" />
            Risk Radar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scanForRisks.mutate()}
              disabled={scanForRisks.isPending}
              className="h-8 gap-1"
            >
              {scanForRisks.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Scan className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Scan</span>
            </Button>
            <div className="flex gap-1">
              {criticalCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalCount} Critical
                </Badge>
              )}
              {highCount > 0 && (
                <Badge variant="outline" className={cn('text-xs', getSeverityColor('high'))}>
                  {highCount} High
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(compact ? 'h-[200px]' : 'h-[400px]')}>
          <div className="space-y-3">
            {risks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No active risks detected</p>
                <p className="text-sm">Your network is healthy</p>
              </div>
            ) : (
              risks.map(risk => (
                <div
                  key={risk.id}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    risk.severity === 'critical' ? 'border-rose-500/30 bg-rose-500/5' :
                    risk.severity === 'high' ? 'border-amber-500/30 bg-amber-500/5' :
                    'border-border bg-card'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getTypeIcon(risk.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityIcon(risk.severity)}
                        <span className="font-medium text-sm truncate">{risk.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{risk.profileName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{risk.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(risk.detectedAt, { addSuffix: true })}
                        </span>
                        {risk.metrics.trend === 'worsening' && (
                          <span className="flex items-center gap-1 text-rose-500">
                            <TrendingDown className="h-3 w-3" />
                            Worsening
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
