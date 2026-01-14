import { useState } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  X,
  ChevronDown,
  ChevronUp,
  Filter,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useHardwareAlerts, type HardwareAlert, type AlertSeverity } from '@/hooks/useHardwareAlerts';
import { formatDistanceToNow } from 'date-fns';

const severityConfig: Record<AlertSeverity, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { icon: Info, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  low: { icon: Bell, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

interface AlertItemProps {
  alert: HardwareAlert;
  onAcknowledge: (id: string) => void;
  isAcknowledging: boolean;
}

function AlertItem({ alert, onAcknowledge, isAcknowledging }: AlertItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const config = severityConfig[alert.severity];
  const Icon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`rounded-lg border ${config.bg} p-3 mb-2`}>
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between cursor-pointer">
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{alert.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(alert.id);
                }}
                disabled={isAcknowledging}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 pt-3 border-t border-border/50">
            {alert.description && (
              <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
            )}
            {alert.source_data && Object.keys(alert.source_data).length > 0 && (
              <div className="text-xs bg-background/50 rounded p-2 font-mono">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(alert.source_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function HardwareAlertPanel() {
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const {
    alerts,
    criticalAlerts,
    highAlerts,
    mediumAlerts,
    lowAlerts,
    isLoading,
    acknowledgeAlert,
    acknowledgeAll,
    isAcknowledging,
    totalUnacknowledged,
    hasCritical,
  } = useHardwareAlerts();

  const filteredAlerts = severityFilter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === severityFilter);

  return (
    <Card className={hasCritical ? 'border-red-500/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className={`h-5 w-5 ${hasCritical ? 'text-red-500 animate-pulse' : ''}`} />
              Hardware Alerts
            </CardTitle>
            {totalUnacknowledged > 0 && (
              <Badge variant={hasCritical ? 'destructive' : 'secondary'}>
                {totalUnacknowledged}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as AlertSeverity | 'all')}>
              <SelectTrigger className="w-32 h-8">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {totalUnacknowledged > 0 && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => acknowledgeAll()}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Ack All
              </Button>
            )}
          </div>
        </div>

        {/* Severity Summary */}
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Critical: {criticalAlerts.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">High: {highAlerts.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">Medium: {mediumAlerts.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Low: {lowAlerts.length}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">All systems operating normally</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-3">
            {filteredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledgeAlert}
                isAcknowledging={isAcknowledging}
              />
            ))}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
