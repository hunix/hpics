import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ArrowRight, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CascadeEvent } from '@/hooks/intelligence/useAGISCascade';

interface CascadeEventTimelineProps {
  events: CascadeEvent[];
  realtimeEvents: CascadeEvent[];
}

const statusIcons = {
  pending: Clock,
  executing: ArrowRight,
  completed: CheckCircle,
  failed: XCircle
};

const statusColors = {
  pending: 'text-amber-400 bg-amber-500/20',
  executing: 'text-blue-400 bg-blue-500/20',
  completed: 'text-emerald-400 bg-emerald-500/20',
  failed: 'text-red-400 bg-red-500/20'
};

export function CascadeEventTimeline({ events, realtimeEvents }: CascadeEventTimelineProps) {
  const allEvents = [...realtimeEvents, ...events.filter(e => !realtimeEvents.some(r => r.id === e.id))].slice(0, 20);

  if (allEvents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No cascade events yet. Configure rules to automate cross-phase operations.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        <AnimatePresence>
          {allEvents.map((event, index) => {
            const StatusIcon = statusIcons[event.outcomeStatus];
            const isRealtime = realtimeEvents.some(r => r.id === event.id);
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                className={`relative pl-6 pb-3 border-l-2 ${
                  event.outcomeStatus === 'completed' ? 'border-emerald-500/50' :
                  event.outcomeStatus === 'failed' ? 'border-red-500/50' :
                  event.outcomeStatus === 'executing' ? 'border-blue-500/50' :
                  'border-muted-foreground/30'
                }`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${
                  event.outcomeStatus === 'completed' ? 'bg-emerald-500' :
                  event.outcomeStatus === 'failed' ? 'bg-red-500' :
                  event.outcomeStatus === 'executing' ? 'bg-blue-500 animate-pulse' :
                  'bg-muted-foreground'
                }`} />
                
                <div className="bg-card/50 rounded-lg p-3 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Phase {event.triggerPhase}
                      </Badge>
                      <span className="text-sm font-medium">{event.triggerEventType}</span>
                      {isRealtime && (
                        <Badge className="bg-primary/20 text-primary text-xs animate-pulse">
                          LIVE
                        </Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${statusColors[event.outcomeStatus]}`}>
                      <StatusIcon className="h-3 w-3" />
                      <span className="capitalize">{event.outcomeStatus}</span>
                    </div>
                  </div>
                  
                  {/* Cascade path */}
                  {event.cascadePath.length > 1 && (
                    <div className="flex items-center gap-1 flex-wrap mb-2">
                      {event.cascadePath.map((step, i) => (
                        <React.Fragment key={i}>
                          <Badge variant="secondary" className="text-xs">
                            P{step.phase}: {step.action}
                          </Badge>
                          {i < event.cascadePath.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                  
                  {/* Affected phases */}
                  {event.affectedPhases.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>Affected:</span>
                      {event.affectedPhases.map(p => (
                        <Badge key={p} variant="outline" className="text-xs">
                          P{p}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(event.startedAt), { addSuffix: true })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
