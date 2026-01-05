import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useSecurityAlerts } from '@/hooks/useSecurityAlerts';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY_CONFIG = {
  critical: { 
    color: 'bg-red-500 text-white', 
    icon: XCircle,
    bgColor: 'bg-red-500/10' 
  },
  high: { 
    color: 'bg-orange-500 text-white', 
    icon: AlertTriangle,
    bgColor: 'bg-orange-500/10' 
  },
  medium: { 
    color: 'bg-yellow-500 text-white', 
    icon: ShieldAlert,
    bgColor: 'bg-yellow-500/10' 
  },
  low: { 
    color: 'bg-blue-500 text-white', 
    icon: Shield,
    bgColor: 'bg-blue-500/10' 
  },
};

export function SecurityAlertsWidget() {
  const { alerts, alertCounts, isLoading, acknowledgeAlert, hasCriticalAlerts } = useSecurityAlerts();

  const getOverallStatus = () => {
    if (hasCriticalAlerts) return { text: 'Critical', color: 'text-red-500', icon: XCircle };
    if (alertCounts.high > 0) return { text: 'High Risk', color: 'text-orange-500', icon: AlertTriangle };
    if (alertCounts.medium > 0) return { text: 'Moderate', color: 'text-yellow-500', icon: ShieldAlert };
    if (alertCounts.low > 0) return { text: 'Low Risk', color: 'text-blue-500', icon: Shield };
    return { text: 'Secure', color: 'text-green-500', icon: ShieldCheck };
  };

  const status = getOverallStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${status.color}`} />
              Security Status
            </CardTitle>
            <CardDescription>Real-time security monitoring and alerts</CardDescription>
          </div>
          <Badge className={status.color === 'text-green-500' ? 'bg-green-500' : status.color.replace('text-', 'bg-')}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Summary */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <div className="text-xl font-bold">{alertCounts.total}</div>
            <div className="text-[10px] text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-500/10">
            <div className="text-xl font-bold text-red-600">{alertCounts.critical}</div>
            <div className="text-[10px] text-muted-foreground">Critical</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-orange-500/10">
            <div className="text-xl font-bold text-orange-600">{alertCounts.high}</div>
            <div className="text-[10px] text-muted-foreground">High</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-xl font-bold text-yellow-600">{alertCounts.medium}</div>
            <div className="text-[10px] text-muted-foreground">Medium</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/10">
            <div className="text-xl font-bold text-blue-600">{alertCounts.low}</div>
            <div className="text-[10px] text-muted-foreground">Low</div>
          </div>
        </div>

        {/* Alert List */}
        <ScrollArea className="h-[180px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
          ) : alerts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
              <p>No active security alerts</p>
              <p className="text-xs">Your system is secure</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts?.slice(0, 10).map((alert) => {
                const config = SEVERITY_CONFIG[alert.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;
                const SeverityIcon = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-2 rounded-lg border ${config.bgColor}`}
                  >
                    <SeverityIcon className="h-4 w-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`${config.color} text-[10px]`}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          {alert.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm truncate">{alert.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
