import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CascadeEvent } from '@/hooks/intelligence/useAGISCascade';
import { getPhaseConfig } from '@/lib/agis/phaseConfig';
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  X,
  Bell
} from 'lucide-react';

interface CascadeAlertCardProps {
  cascadeEvents: CascadeEvent[];
  onDismiss?: (eventId: string) => void;
  onView?: (event: CascadeEvent) => void;
  maxAlerts?: number;
  className?: string;
}

export function CascadeAlertCard({ 
  cascadeEvents, 
  onDismiss,
  onView,
  maxAlerts = 3,
  className 
}: CascadeAlertCardProps) {
  // Only show pending or recent events
  const alertEvents = cascadeEvents
    .filter(e => e.outcomeStatus === 'pending' || 
      (e.outcomeStatus === 'completed' && 
        new Date(e.createdAt).getTime() > Date.now() - 30 * 60 * 1000)) // Last 30 min
    .slice(0, maxAlerts);

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending': return <Clock className="h-5 w-5 text-primary animate-pulse" />;
      default: return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'border-green-500/30 bg-green-500/5';
      case 'failed': return 'border-destructive/30 bg-destructive/5';
      case 'pending': return 'border-primary/30 bg-primary/5';
      default: return 'border-yellow-500/30 bg-yellow-500/5';
    }
  };

  if (alertEvents.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No active cascade alerts</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Cascade Alerts</span>
          </div>
          <Badge variant="secondary">{alertEvents.length}</Badge>
        </div>

        <AnimatePresence mode="popLayout">
          {alertEvents.map(event => (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getStatusColor(event.outcomeStatus)}`}
            >
              {getStatusIcon(event.outcomeStatus)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <span>P{event.triggerPhase}</span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="truncate">
                    {event.affectedPhases?.map(p => `P${p}`).join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {event.triggerEventType}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                {onView && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs"
                    onClick={() => onView(event)}
                  >
                    View
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onDismiss(event.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
