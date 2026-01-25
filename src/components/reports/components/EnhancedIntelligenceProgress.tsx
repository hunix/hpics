/**
 * Enhanced Intelligence Session Progress v2.0
 * Real-time animated visualization for 49-task intelligence pipeline
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';
import type { IntelligenceSession, IntelligenceSessionTask } from '@/hooks/useIntelligenceSession';
import { IntelligenceProgressHeader } from './IntelligenceProgressHeader';
import { AnimatedTaskGrid } from './AnimatedTaskGrid';
import { AnimatedTaskCard, type TaskStatus } from './AnimatedTaskCard';

interface EnhancedIntelligenceProgressProps {
  session: IntelligenceSession;
  tasks: IntelligenceSessionTask[];
  onPause: () => void;
  onResume?: () => void;
  onCancel: () => void;
  onRetryTask: (taskId: string) => void;
  categoryProgress: Record<string, { total: number; completed: number; failed: number }>;
}

export function EnhancedIntelligenceProgress({
  session,
  tasks,
  onPause,
  onResume,
  onCancel,
  onRetryTask,
  categoryProgress,
}: EnhancedIntelligenceProgressProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate running tasks
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const isPaused = session.status === 'paused';

  // Track elapsed time
  useEffect(() => {
    if (session.status !== 'running') return;
    
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    
    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session.status, session.startedAt]);

  // Map tasks to the format expected by AnimatedTaskGrid
  const mappedTasks = tasks.map(task => ({
    id: task.id,
    taskName: task.taskName,
    status: task.status as TaskStatus,
    category: task.category,
    processingTimeMs: task.processingTimeMs ?? undefined,
    errorMessage: task.errorMessage ?? undefined,
  }));

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header with stats */}
        <IntelligenceProgressHeader
          totalTasks={session.totalTasks}
          completedTasks={session.completedTasks}
          failedTasks={session.failedTasks}
          runningTasks={runningTasks}
          skippedTasks={session.skippedTasks}
          isPaused={isPaused}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          currentCategory={session.currentCategory ?? undefined}
          elapsedTimeMs={elapsedTime}
        />

        {/* View mode toggle */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'list')}>
          <div className="flex items-center justify-between">
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="px-3 h-7">
                <LayoutGrid className="h-4 w-4 mr-1" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3 h-7">
                <List className="h-4 w-4 mr-1" />
                List
              </TabsTrigger>
            </TabsList>
            <span className="text-xs text-muted-foreground">
              {tasks.length} total tasks
            </span>
          </div>

          <TabsContent value="grid" className="mt-3">
            <ScrollArea className="h-[450px] pr-2">
              <AnimatedTaskGrid
                tasks={mappedTasks}
                onRetryTask={onRetryTask}
                currentCategory={session.currentCategory ?? undefined}
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="list" className="mt-3">
            <ScrollArea className="h-[450px] pr-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {mappedTasks.map((task, index) => (
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
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
