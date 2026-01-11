import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle, TrendingDown, Eye, Bell, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ThreatIndicator {
  id: string;
  type: 'churn_risk' | 'anomaly' | 'sentiment_drop' | 'engagement_drop' | 'web_mention';
  severity: 'critical' | 'high' | 'medium' | 'low';
  profileId: string;
  profileName: string;
  title: string;
  description: string;
  detectedAt: Date;
  isResolved: boolean;
}

export function ThreatSurfaceDashboard() {
  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['threat-surface'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { alerts: [], anomalies: [], churnRisks: [] };

      const [alertsRes, anomaliesRes, churnRes] = await Promise.all([
        supabase
          .from('surveillance_alerts')
          .select('*, profiles(first_name, last_name)')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('behavioral_anomalies')
          .select('*, profiles(first_name, last_name)')
          .eq('user_id', user.id)
          .eq('is_resolved', false)
          .order('detected_at', { ascending: false })
          .limit(20),
        supabase
          .from('churn_predictions')
          .select('*, profiles(first_name, last_name)')
          .eq('user_id', user.id)
          .gte('risk_score', 0.6)
          .order('risk_score', { ascending: false })
          .limit(20)
      ]);

      return {
        alerts: alertsRes.data || [],
        anomalies: anomaliesRes.data || [],
        churnRisks: churnRes.data || []
      };
    },
    refetchInterval: 30000
  });

  const threats = useMemo(() => {
    if (!alertsData) return [];

    const allThreats: ThreatIndicator[] = [];

    // Map surveillance alerts
    alertsData.alerts.forEach((alert: any) => {
      const profile = alert.profiles;
      allThreats.push({
        id: alert.id,
        type: alert.alert_type === 'web_mention' ? 'web_mention' : 'anomaly',
        severity: alert.severity || 'medium',
        profileId: alert.profile_id,
        profileName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
        title: alert.title,
        description: alert.description || '',
        detectedAt: new Date(alert.created_at),
        isResolved: alert.is_read
      });
    });

    // Map behavioral anomalies
    alertsData.anomalies.forEach((anomaly: any) => {
      const profile = anomaly.profiles;
      allThreats.push({
        id: anomaly.id,
        type: 'anomaly',
        severity: anomaly.severity || 'medium',
        profileId: anomaly.profile_id,
        profileName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
        title: `${anomaly.anomaly_type} Anomaly`,
        description: anomaly.description || '',
        detectedAt: new Date(anomaly.detected_at),
        isResolved: anomaly.is_resolved
      });
    });

    // Map churn risks
    alertsData.churnRisks.forEach((risk: any) => {
      const profile = risk.profiles;
      const riskLevel = risk.risk_score >= 0.8 ? 'critical' : risk.risk_score >= 0.7 ? 'high' : 'medium';
      allThreats.push({
        id: risk.id,
        type: 'churn_risk',
        severity: riskLevel,
        profileId: risk.profile_id,
        profileName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Unknown',
        title: `Churn Risk: ${Math.round(risk.risk_score * 100)}%`,
        description: risk.intervention_recommended || 'High probability of disengagement',
        detectedAt: new Date(risk.prediction_date || risk.created_at),
        isResolved: false
      });
    });

    return allThreats.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [alertsData]);

  const stats = useMemo(() => ({
    critical: threats.filter(t => t.severity === 'critical').length,
    high: threats.filter(t => t.severity === 'high').length,
    medium: threats.filter(t => t.severity === 'medium').length,
    total: threats.length
  }), [threats]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'churn_risk': return <TrendingDown className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'web_mention': return <Eye className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const markAsResolved = async (threatId: string, type: string) => {
    if (type === 'anomaly') {
      await supabase.from('behavioral_anomalies').update({ is_resolved: true }).eq('id', threatId);
    } else {
      await supabase.from('surveillance_alerts').update({ is_read: true }).eq('id', threatId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Threat Surface Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Severity Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-xl font-bold text-red-500">{stats.critical}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="text-xl font-bold text-orange-500">{stats.high}</div>
            <div className="text-xs text-muted-foreground">High</div>
          </div>
          <div className="text-center p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="text-xl font-bold text-yellow-500">{stats.medium}</div>
            <div className="text-xs text-muted-foreground">Medium</div>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>

        {/* Threat List */}
        <ScrollArea className="h-[300px]">
          {threats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
              <p>No active threats detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {threats.map(threat => (
                <div
                  key={threat.id}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded ${getSeverityColor(threat.severity)}`}>
                    {getTypeIcon(threat.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{threat.profileName}</span>
                      <Badge variant="outline" className="text-xs">
                        {threat.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm text-foreground mt-1">{threat.title}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {threat.description}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(threat.detectedAt, { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsResolved(threat.id, threat.type)}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
