import { useState, useCallback, useMemo } from 'react';
import { Task, TaskStatus, TaskNote } from '@/components/intelligence/TaskProgressPanel';

export interface UseTaskProgressOptions {
  initialPhase?: string;
  onPhaseComplete?: (phase: string) => void;
}

export function useTaskProgress(options: UseTaskProgressOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPhase, setCurrentPhase] = useState(options.initialPhase);

  const createTask = useCallback((
    title: string, 
    description: string, 
    taskOptions?: Partial<Omit<Task, 'id' | 'title' | 'description' | 'createdAt' | 'updatedAt' | 'notes'>>
  ): Task => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      status: 'todo',
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      phase: currentPhase,
      ...taskOptions
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, [currentPhase]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status, updatedAt: new Date() }
        : task
    ));

    // Check if phase is complete
    if (status === 'done' && options.onPhaseComplete) {
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status } : t);
      const phaseTasks = updatedTasks.filter(t => t.phase === currentPhase);
      const allComplete = phaseTasks.every(t => t.status === 'done');
      if (allComplete && currentPhase) {
        options.onPhaseComplete(currentPhase);
      }
    }
  }, [tasks, currentPhase, options]);

  const addNote = useCallback((taskId: string, content: string) => {
    const note: TaskNote = {
      id: `note-${Date.now()}`,
      content,
      timestamp: new Date()
    };
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, notes: [...task.notes, note], updatedAt: new Date() }
        : task
    ));
  }, []);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(t => t.id === taskId);
  }, [tasks]);

  const startPhase = useCallback((phaseName: string) => {
    setCurrentPhase(phaseName);
  }, []);

  const stats = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    progress: tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) 
      : 0
  }), [tasks]);

  const phaseTasks = useMemo(() => {
    if (!currentPhase) return tasks;
    return tasks.filter(t => t.phase === currentPhase);
  }, [tasks, currentPhase]);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const bulkCreate = useCallback((taskDefs: Array<{ title: string; description: string; priority?: Task['priority'] }>) => {
    const newTasks = taskDefs.map(def => ({
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: def.title,
      description: def.description,
      status: 'todo' as TaskStatus,
      notes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      phase: currentPhase,
      priority: def.priority
    }));
    setTasks(prev => [...prev, ...newTasks]);
    return newTasks;
  }, [currentPhase]);

  return {
    tasks,
    phaseTasks,
    currentPhase,
    stats,
    createTask,
    updateTaskStatus,
    addNote,
    getTaskById,
    startPhase,
    clearTasks,
    bulkCreate
  };
}
