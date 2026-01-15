import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronDown, 
  ChevronRight,
  ListTodo,
  Clock,
  AlertCircle,
  Zap,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export interface TaskNote {
  id: string;
  content: string;
  timestamp: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  notes: TaskNote[];
  createdAt: Date;
  updatedAt: Date;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  estimatedMinutes?: number;
  phase?: string;
}

interface TaskProgressPanelProps {
  tasks: Task[];
  currentPhase?: string;
  onTaskClick?: (taskId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<TaskStatus, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  todo: { 
    icon: <Circle className="h-4 w-4" />, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted/50',
    label: 'Todo'
  },
  in_progress: { 
    icon: <Loader2 className="h-4 w-4 animate-spin" />, 
    color: 'text-primary', 
    bgColor: 'bg-primary/10',
    label: 'In Progress'
  },
  done: { 
    icon: <CheckCircle2 className="h-4 w-4" />, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10',
    label: 'Done'
  },
  blocked: { 
    icon: <AlertCircle className="h-4 w-4" />, 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    label: 'Blocked'
  }
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-muted text-muted-foreground', label: 'Low' },
  medium: { color: 'bg-blue-500/20 text-blue-400', label: 'Medium' },
  high: { color: 'bg-orange-500/20 text-orange-400', label: 'High' },
  critical: { color: 'bg-destructive/20 text-destructive', label: 'Critical' }
};

export function TaskProgressPanel({ tasks, currentPhase, onTaskClick, compact = false }: TaskProgressPanelProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const toggleExpanded = (taskId: string) => {
    const next = new Set(expandedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setExpandedTasks(next);
  };

  // Group tasks by phase if phases are present
  const tasksByPhase = tasks.reduce((acc, task) => {
    const phase = task.phase || 'General';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListTodo className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Operation Progress</CardTitle>
              {currentPhase && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Phase: {currentPhase}
                </p>
              )}
            </div>
          </div>
          <Badge variant="outline" className="font-mono">
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-mono text-primary">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center p-2 rounded-lg bg-muted/30">
            <span className="text-lg font-bold text-muted-foreground">{todoCount}</span>
            <span className="text-xs text-muted-foreground">Todo</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-primary/10">
            <span className="text-lg font-bold text-primary">{inProgressCount}</span>
            <span className="text-xs text-primary">Active</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-green-500/10">
            <span className="text-lg font-bold text-green-500">{completedCount}</span>
            <span className="text-xs text-green-500">Done</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-lg bg-destructive/10">
            <span className="text-lg font-bold text-destructive">{blockedCount}</span>
            <span className="text-xs text-destructive">Blocked</span>
          </div>
        </div>

        {/* Task list */}
        <ScrollArea className={compact ? "h-[200px]" : "h-[350px]"}>
          <div className="space-y-3 pr-3">
            <AnimatePresence mode="popLayout">
              {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
                <motion.div
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {Object.keys(tasksByPhase).length > 1 && (
                    <div className="flex items-center gap-2 py-1">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {phase}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}
                  
                  {phaseTasks.map((task) => {
                    const config = statusConfig[task.status];
                    const isExpanded = expandedTasks.has(task.id);
                    
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`rounded-lg border transition-all ${config.bgColor} ${
                          task.status === 'in_progress' ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border/50'
                        }`}
                      >
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(task.id)}>
                          <CollapsibleTrigger asChild>
                            <button
                              className="w-full p-3 flex items-start gap-3 text-left hover:bg-accent/30 transition-colors rounded-lg"
                              onClick={() => onTaskClick?.(task.id)}
                            >
                              <div className={`mt-0.5 ${config.color}`}>
                                {config.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium text-sm truncate ${
                                    task.status === 'done' ? 'line-through text-muted-foreground' : ''
                                  }`}>
                                    {task.title}
                                  </span>
                                  {task.priority && (
                                    <Badge className={`text-[10px] px-1.5 py-0 ${priorityConfig[task.priority].color}`}>
                                      {priorityConfig[task.priority].label}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {task.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {task.notes.length > 0 && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <StickyNote className="h-3 w-3" />
                                    <span className="text-xs">{task.notes.length}</span>
                                  </div>
                                )}
                                {task.estimatedMinutes && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span className="text-xs">{task.estimatedMinutes}m</span>
                                  </div>
                                )}
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/30 mt-1">
                              {task.notes.length > 0 ? (
                                <div className="space-y-1.5">
                                  {task.notes.map((note) => (
                                    <div 
                                      key={note.id}
                                      className="text-xs p-2 rounded bg-background/50 border border-border/30"
                                    >
                                      <p className="text-foreground/80">{note.content}</p>
                                      <p className="text-muted-foreground mt-1">
                                        {new Date(note.timestamp).toLocaleTimeString()}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No notes yet</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
