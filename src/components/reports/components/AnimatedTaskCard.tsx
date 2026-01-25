/**
 * Animated Task Card Component
 * Real-time animated visualization for individual intelligence tasks
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Clock, 
  RefreshCw,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

interface AnimatedTaskCardProps {
  id: string;
  name: string;
  status: TaskStatus;
  category: string;
  processingTimeMs?: number;
  errorMessage?: string;
  onRetry?: (id: string) => void;
  index: number;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    bgClass: 'bg-muted/50',
    borderClass: 'border-border/50',
    textClass: 'text-muted-foreground',
    pulseClass: '',
  },
  running: {
    icon: Loader2,
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/50',
    textClass: 'text-primary',
    pulseClass: 'animate-pulse',
  },
  completed: {
    icon: CheckCircle,
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/50',
    textClass: 'text-emerald-500',
    pulseClass: '',
  },
  failed: {
    icon: XCircle,
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/50',
    textClass: 'text-destructive',
    pulseClass: '',
  },
  skipped: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/50',
    textClass: 'text-amber-500',
    pulseClass: '',
  },
};

export function AnimatedTaskCard({
  id,
  name,
  status,
  category,
  processingTimeMs,
  errorMessage,
  onRetry,
  index,
}: AnimatedTaskCardProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { 
          delay: index * 0.02,
          type: 'spring',
          stiffness: 300,
          damping: 25
        }
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
      className={cn(
        'relative p-3 rounded-lg border transition-colors duration-300',
        config.bgClass,
        config.borderClass,
        config.pulseClass
      )}
    >
      {/* Running indicator glow */}
      <AnimatePresence>
        {status === 'running' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-lg bg-primary/5 animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Status icon with animation */}
      <div className="flex items-start justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <motion.div
            animate={status === 'running' ? { rotate: 360 } : { rotate: 0 }}
            transition={status === 'running' ? { 
              duration: 1, 
              repeat: Infinity, 
              ease: 'linear' 
            } : {}}
          >
            <StatusIcon className={cn('h-4 w-4 shrink-0', config.textClass)} />
          </motion.div>
          <span className={cn(
            'text-xs font-medium truncate',
            status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {name}
          </span>
        </div>

        {/* Completion badge with animation */}
        <AnimatePresence mode="wait">
          {status === 'completed' && processingTimeMs && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="text-[10px] text-muted-foreground shrink-0 bg-background/50 px-1.5 py-0.5 rounded"
            >
              {(processingTimeMs / 1000).toFixed(1)}s
            </motion.span>
          )}
          {status === 'running' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message and retry */}
      <AnimatePresence>
        {status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 pt-2 border-t border-destructive/20"
          >
            {errorMessage && (
              <p className="text-[10px] text-destructive/80 truncate mb-1">
                {errorMessage}
              </p>
            )}
            {onRetry && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs w-full"
                onClick={() => onRetry(id)}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success checkmark animation */}
      <AnimatePresence>
        {status === 'completed' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5"
          >
            <CheckCircle className="h-3 w-3" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
