/**
 * Animated Task Grid Component
 * Real-time visualization grid for 49-task intelligence pipeline
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Shield, 
  Sword, 
  Network, 
  Clock, 
  Atom,
  Layers,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AnimatedTaskCard, type TaskStatus } from './AnimatedTaskCard';
import { cn } from '@/lib/utils';

interface TaskData {
  id: string;
  taskName: string;
  status: TaskStatus;
  category: string;
  processingTimeMs?: number;
  errorMessage?: string;
}

interface AnimatedTaskGridProps {
  tasks: TaskData[];
  onRetryTask?: (taskId: string) => void;
  currentCategory?: string;
}

const CATEGORY_CONFIG: Record<string, {
  label: string;
  icon: typeof Brain;
  color: string;
  bgColor: string;
}> = {
  core: {
    label: 'Core Intelligence',
    icon: Brain,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  psychological: {
    label: 'Psychological Operations',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  warfare: {
    label: 'Advanced Warfare',
    icon: Sword,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  network: {
    label: 'Network Intelligence',
    icon: Network,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  temporal: {
    label: 'Temporal & Quantum',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  fusion: {
    label: 'Fusion Intelligence',
    icon: Layers,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  meta: {
    label: 'Meta Intelligence',
    icon: Atom,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
};

const CATEGORY_ORDER = ['core', 'psychological', 'warfare', 'network', 'temporal', 'meta', 'fusion'];

export function AnimatedTaskGrid({ 
  tasks, 
  onRetryTask,
  currentCategory 
}: AnimatedTaskGridProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(['core', currentCategory].filter(Boolean) as string[])
  );

  // Group tasks by category
  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, TaskData[]> = {};
    for (const task of tasks) {
      if (!grouped[task.category]) {
        grouped[task.category] = [];
      }
      grouped[task.category].push(task);
    }
    return grouped;
  }, [tasks]);

  // Calculate stats per category
  const categoryStats = useMemo(() => {
    const stats: Record<string, {
      total: number;
      completed: number;
      failed: number;
      running: number;
      pending: number;
    }> = {};
    
    for (const [category, catTasks] of Object.entries(tasksByCategory)) {
      stats[category] = {
        total: catTasks.length,
        completed: catTasks.filter(t => t.status === 'completed').length,
        failed: catTasks.filter(t => t.status === 'failed').length,
        running: catTasks.filter(t => t.status === 'running').length,
        pending: catTasks.filter(t => t.status === 'pending').length,
      };
    }
    
    return stats;
  }, [tasksByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Auto-expand current category
  React.useEffect(() => {
    if (currentCategory && !expandedCategories.has(currentCategory)) {
      setExpandedCategories(prev => new Set([...prev, currentCategory]));
    }
  }, [currentCategory]);

  return (
    <div className="space-y-3">
      {CATEGORY_ORDER.map((category, categoryIndex) => {
        const catTasks = tasksByCategory[category];
        if (!catTasks || catTasks.length === 0) return null;

        const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.fusion;
        const stats = categoryStats[category];
        const isExpanded = expandedCategories.has(category);
        const isActive = category === currentCategory;
        const progress = stats.total > 0 
          ? ((stats.completed + stats.failed) / stats.total) * 100 
          : 0;
        const CategoryIcon = config.icon;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.05 }}
          >
            <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
              <div className={cn(
                'border rounded-lg overflow-hidden transition-all duration-300',
                isActive && 'ring-2 ring-primary/50 shadow-lg'
              )}>
                <CollapsibleTrigger className="w-full">
                  <div className={cn(
                    'flex items-center justify-between p-3 transition-colors',
                    'hover:bg-muted/30',
                    isActive && config.bgColor
                  )}>
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className={cn('p-1.5 rounded-md', config.bgColor)}>
                        <CategoryIcon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <span className="font-medium text-sm">{config.label}</span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                          </span>
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badges */}
                      <div className="flex items-center gap-1.5">
                        {stats.completed > 0 && (
                          <Badge variant="secondary" className="text-emerald-600 bg-emerald-500/10 h-5 px-1.5">
                            {stats.completed}✓
                          </Badge>
                        )}
                        {stats.running > 0 && (
                          <Badge variant="secondary" className="text-primary bg-primary/10 h-5 px-1.5 animate-pulse">
                            {stats.running}⚡
                          </Badge>
                        )}
                        {stats.failed > 0 && (
                          <Badge variant="secondary" className="text-destructive bg-destructive/10 h-5 px-1.5">
                            {stats.failed}✗
                          </Badge>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div className="w-24">
                        <Progress value={progress} className="h-1.5" />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 pt-0 border-t bg-muted/20"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-3">
                      <AnimatePresence mode="popLayout">
                        {catTasks.map((task, index) => (
                          <AnimatedTaskCard
                            key={task.id}
                            id={task.id}
                            name={task.taskName}
                            status={task.status}
                            category={task.category}
                            processingTimeMs={task.processingTimeMs}
                            errorMessage={task.errorMessage}
                            onRetry={onRetryTask}
                            index={index}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </motion.div>
        );
      })}
    </div>
  );
}
