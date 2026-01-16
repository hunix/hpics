import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PhaseHealthScore } from '@/hooks/intelligence/useAGISGlobalState';

interface AGISPhaseHealthGridProps {
  phaseHealthScores: Record<string, PhaseHealthScore>;
  onPhaseClick?: (phase: number) => void;
}

const statusColors = {
  optimal: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
  stable: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
  degraded: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
  critical: 'bg-red-500/20 border-red-500/50 text-red-400'
};

const statusIcons = {
  optimal: CheckCircle,
  stable: Activity,
  degraded: AlertTriangle,
  critical: XCircle
};

export function AGISPhaseHealthGrid({ phaseHealthScores, onPhaseClick }: AGISPhaseHealthGridProps) {
  const phases = useMemo(() => {
    return Object.values(phaseHealthScores).sort((a, b) => a.phase - b.phase);
  }, [phaseHealthScores]);

  if (phases.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No phase data available. Initialize AGIS Global State to begin.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {phases.map((phase, index) => {
        const StatusIcon = statusIcons[phase.status];
        
        return (
          <motion.button
            key={phase.phase}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            onClick={() => onPhaseClick?.(phase.phase)}
            className={cn(
              'relative p-3 rounded-lg border transition-all duration-200',
              'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50',
              statusColors[phase.status]
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold opacity-70">P{phase.phase}</span>
              <StatusIcon className="h-4 w-4" />
            </div>
            
            <div className="text-left">
              <div className="text-2xl font-bold mb-1">{phase.health}%</div>
              <div className="text-xs truncate opacity-80">{phase.name}</div>
            </div>
            
            {phase.activeOperations > 0 && (
              <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {phase.activeOperations}
              </div>
            )}
            
            {/* Health bar */}
            <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${phase.health}%` }}
                transition={{ delay: index * 0.02 + 0.2, duration: 0.5 }}
                className={cn(
                  'h-full rounded-full',
                  phase.status === 'optimal' && 'bg-emerald-400',
                  phase.status === 'stable' && 'bg-blue-400',
                  phase.status === 'degraded' && 'bg-amber-400',
                  phase.status === 'critical' && 'bg-red-400'
                )}
              />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
