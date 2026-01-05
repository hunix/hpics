import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ShieldAlert, ShieldCheck, Activity, Eye, RefreshCw } from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

export function ThreatMonitorWidget() {
  const { getRecentEvents, getThreatSummary } = useSecurityMonitor();
  const [events, setEvents] = useState<ReturnType<typeof getRecentEvents>>([]);
  const [summary, setSummary] = useState(getThreatSummary());

  useEffect(() => {
    const refresh = () => {
      setEvents(getRecentEvents(60));
      setSummary(getThreatSummary());
    };

    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [getRecentEvents, getThreatSummary]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'threat':
        return <ShieldAlert className="h-4 w-4 text-destructive" />;
      case 'anomaly':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'warning':
        return <Eye className="h-4 w-4 text-orange-500" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    if (summary.threats > 0) return 'text-destructive';
    if (summary.anomalies > 0) return 'text-yellow-500';
    if (summary.warnings > 0) return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (summary.threats > 0) return 'Threats Detected';
    if (summary.anomalies > 0) return 'Anomalies Detected';
    if (summary.warnings > 0) return 'Warnings Present';
    return 'All Clear';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className={`h-5 w-5 ${getStatusColor()}`} />
              Security Monitor
            </CardTitle>
            <CardDescription>Real-time threat detection and monitoring</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={summary.threats > 0 ? 'destructive' : 'secondary'}>
              {getStatusText()}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEvents(getRecentEvents(60));
                setSummary(getThreatSummary());
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-destructive">{summary.threats}</div>
            <div className="text-xs text-muted-foreground">Threats</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-yellow-600">{summary.anomalies}</div>
            <div className="text-xs text-muted-foreground">Anomalies</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <div className="text-2xl font-bold text-orange-600">{summary.warnings}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
        </div>

        {/* Recent Events */}
        <ScrollArea className="h-[200px]">
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No security events in the last hour</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.slice(0, 20).map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded-lg border bg-card"
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">{event.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {event.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
