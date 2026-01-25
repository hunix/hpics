/**
 * Intelligence Progress Header Component
 * Animated header with overall stats and controls
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Pause, 
  X, 
  Play,
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface IntelligenceProgressHeaderProps {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  skippedTasks: number;
  isPaused?: boolean;
  onPause: () => void;
  onResume?: () => void;
  onCancel: () => void;
  currentCategory?: string;
  elapsedTimeMs?: number;
}

export function IntelligenceProgressHeader({
  totalTasks,
  completedTasks,
  failedTasks,
  runningTasks,
  skippedTasks,
  isPaused = false,
  onPause,
  onResume,
  onCancel,
  currentCategory,
  elapsedTimeMs,
}: IntelligenceProgressHeaderProps) {
  const processedTasks = completedTasks + failedTasks + skippedTasks;
  const progress = totalTasks > 0 ? (processedTasks / totalTasks) * 100 : 0;
  const pendingTasks = totalTasks - processedTasks;

  // Format elapsed time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Title and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: isPaused ? 0 : 360 }}
            transition={{ 
              duration: 2, 
              repeat: isPaused ? 0 : Infinity, 
              ease: 'linear' 
            }}
            className={cn(
              'p-2 rounded-lg',
              isPaused ? 'bg-amber-500/10' : 'bg-primary/10'
            )}
          >
            <Brain className={cn(
              'h-6 w-6',
              isPaused ? 'text-amber-500' : 'text-primary'
            )} />
          </motion.div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Intelligence Package Generation
              {!isPaused && runningTasks > 0 && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1 text-sm font-normal text-primary"
                >
                  <Zap className="h-4 w-4" />
                  Processing
                </motion.span>
              )}
              {isPaused && (
                <Badge variant="outline" className="text-amber-500 border-amber-500">
                  Paused
                </Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentCategory ? `Current: ${currentCategory}` : 'Initializing...'}
              {elapsedTimeMs && ` • ${formatTime(elapsedTimeMs)} elapsed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPaused && onResume ? (
            <Button variant="outline" size="sm" onClick={onResume}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onPause}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-destructive hover:text-destructive">
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
      </div>

      {/* Progress bar with percentage */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <motion.span 
            key={Math.round(progress)}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="font-medium"
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-3" />
          {/* Animated progress indicator */}
          {!isPaused && progress > 0 && progress < 100 && (
            <motion.div
              className="absolute top-0 h-3 w-1 bg-primary-foreground/50 rounded"
              style={{ left: `${progress}%` }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2">
        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          whileHover={{ scale: 1.02 }}
        >
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs">
            <div className="font-medium">{pendingTasks}</div>
            <div className="text-muted-foreground">Pending</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-primary/10"
          animate={runningTasks > 0 ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <Zap className="h-4 w-4 text-primary" />
          <div className="text-xs">
            <div className="font-medium">{runningTasks}</div>
            <div className="text-muted-foreground">Running</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10"
          whileHover={{ scale: 1.02 }}
        >
          <CheckCircle className="h-4 w-4 text-emerald-500" />
          <div className="text-xs">
            <div className="font-medium">{completedTasks}</div>
            <div className="text-muted-foreground">Completed</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10"
          whileHover={{ scale: 1.02 }}
        >
          <XCircle className="h-4 w-4 text-destructive" />
          <div className="text-xs">
            <div className="font-medium">{failedTasks}</div>
            <div className="text-muted-foreground">Failed</div>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10"
          whileHover={{ scale: 1.02 }}
        >
          <div className="h-4 w-4 text-amber-500 flex items-center justify-center text-xs font-bold">⊘</div>
          <div className="text-xs">
            <div className="font-medium">{skippedTasks}</div>
            <div className="text-muted-foreground">Skipped</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
