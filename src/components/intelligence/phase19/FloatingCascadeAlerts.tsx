// Floating Cascade Alert Card
// Displays real-time cascade notifications in AppLayout

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useRealtimeCascadeAlerts, type CascadeAlert } from '@/hooks/intelligence/useRealtimeCascadeAlerts';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export function FloatingCascadeAlerts() {
  const { alerts, dismissAlert, dismissAll, unreadCount, criticalAlerts } = useRealtimeCascadeAlerts();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  // Only show if there are alerts
  if (alerts.length === 0) return null;

  const latestAlert = alerts[0];

  return (
    <>
      {/* Collapsed: Show badge indicator */}
      {!expanded && unreadCount > 0 && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setExpanded(true)}
          className={cn(
            "fixed bottom-20 right-4 md:bottom-6 z-40",
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-gradient-to-r from-violet-600 to-indigo-600 text-white",
            "shadow-lg shadow-violet-500/30",
            "hover:scale-105 transition-transform"
          )}
        >
          <Zap className="h-4 w-4" />
          <span className="text-sm font-medium">
            {unreadCount} Cascade{unreadCount > 1 ? 's' : ''}
          </span>
        </motion.button>
      )}

      {/* Expanded: Show alert cards */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className={cn(
              "fixed bottom-20 right-4 left-4 md:left-auto md:w-96 md:bottom-6 z-40",
              "bg-background/95 backdrop-blur-lg rounded-xl",
              "border shadow-2xl max-h-80 overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Cascade Events</span>
                <Badge variant="secondary" className="text-xs">
                  {alerts.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={dismissAll}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setExpanded(false)}
                  className="h-7 w-7"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Alert List */}
            <div className="overflow-y-auto max-h-56 p-2 space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <CascadeAlertItem 
                  key={alert.id} 
                  alert={alert} 
                  onDismiss={() => dismissAlert(alert.id)}
                  onClick={() => {
                    navigate('/agis-command');
                    setExpanded(false);
                  }}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-center text-xs h-8"
                onClick={() => {
                  navigate('/agis-command');
                  setExpanded(false);
                }}
              >
                View All in Command Center
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CascadeAlertItem({ 
  alert, 
  onDismiss, 
  onClick 
}: { 
  alert: CascadeAlert; 
  onDismiss: () => void;
  onClick: () => void;
}) {
  const isCritical = alert.outcomeStatus === 'failed' || alert.affectedPhases.length > 3;
  const isSuccess = alert.outcomeStatus === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={onClick}
      className={cn(
        "relative flex items-start gap-3 p-3 rounded-lg cursor-pointer",
        "hover:bg-accent/50 transition-colors",
        alert.isNew && "bg-primary/5 border border-primary/20",
        isCritical && "bg-destructive/5 border border-destructive/20"
      )}
    >
      <div className={cn(
        "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isSuccess ? "bg-green-500/20 text-green-500" :
        isCritical ? "bg-destructive/20 text-destructive" :
        "bg-primary/20 text-primary"
      )}>
        {isSuccess ? <CheckCircle2 className="h-4 w-4" /> :
         isCritical ? <AlertTriangle className="h-4 w-4" /> :
         <Zap className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {alert.phaseName}
          </span>
          {alert.isNew && (
            <Badge className="text-[10px] h-4 px-1.5 bg-primary">New</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {alert.eventType.replace(/_/g, ' ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(alert.startedAt), { addSuffix: true })}
          </span>
          {alert.affectedPhases.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {alert.affectedPhases.length} phases affected
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </motion.div>
  );
}
