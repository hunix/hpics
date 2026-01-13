import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

type TaskStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'recovering';

interface StepHistory {
  step: number;
  timestamp: string;
  action: 'entered' | 'completed' | 'failed' | 'skipped';
  data?: Record<string, unknown>;
  error?: string;
}

interface TaskState<T> {
  taskId: string;
  taskName: string;
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  data: T;
  stepHistory: StepHistory[];
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  lastCheckpoint: string | null;
  error: string | null;
}

interface ReliableTaskOptions<T> {
  taskName: string;
  taskType: 'wizard' | 'workflow' | 'process';
  totalSteps: number;
  initialData: T;
  maxAttempts?: number;
  autoSaveIntervalMs?: number;
  validationSchema?: z.ZodSchema<Partial<T>>;
  stepValidators?: Record<number, (data: T) => boolean | string>;
  onComplete?: (result: T) => void;
  onError?: (error: Error, state: TaskState<T>) => void;
  onStepChange?: (step: number, data: T) => void;
  persistToDb?: boolean;
  userId?: string;
}

const STORAGE_PREFIX = 'reliable_task_';

function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useReliableTask<T extends Record<string, unknown>>({
  taskName,
  taskType,
  totalSteps,
  initialData,
  maxAttempts = 5,
  autoSaveIntervalMs = 5000,
  validationSchema,
  stepValidators = {},
  onComplete,
  onError,
  onStepChange,
  persistToDb = false,
  userId,
}: ReliableTaskOptions<T>) {
  const storageKey = `${STORAGE_PREFIX}${taskName}`;
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize state from storage or defaults
  const getInitialState = (): TaskState<T> => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as TaskState<T>;
        // Only restore if not completed/failed
        if (parsed.status !== 'completed' && parsed.status !== 'failed') {
          return { ...parsed, status: 'recovering' };
        }
      }
    } catch (error) {
      console.error('Error loading task state:', error);
    }

    return {
      taskId: generateTaskId(),
      taskName,
      status: 'idle',
      currentStep: 0,
      totalSteps,
      data: initialData,
      stepHistory: [],
      attempts: 0,
      startedAt: null,
      completedAt: null,
      lastCheckpoint: null,
      error: null,
    };
  };

  const [state, setState] = useState<TaskState<T>>(getInitialState);

  // Load from DB on mount if persistToDb is enabled
  useEffect(() => {
    if (!persistToDb || !userId) return;
    
    const loadFromDb = async () => {
      try {
        const { data: checkpoint } = await supabase
          .from('task_checkpoints')
          .select('*')
          .eq('user_id', userId)
          .eq('task_name', taskName)
          .eq('status', 'running')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (checkpoint && checkpoint.data) {
          const checkpointData = checkpoint.data as Record<string, unknown>;
          setState(prev => ({
            ...prev,
            taskId: checkpoint.task_id,
            currentStep: checkpoint.current_step,
            status: 'recovering' as TaskStatus,
            data: checkpointData as T,
            lastCheckpoint: checkpoint.updated_at,
          }));
        }
      } catch (error) {
        // No checkpoint found or error, use localStorage
        console.debug('No DB checkpoint found, using localStorage');
      }
    };
    
    loadFromDb();
  }, [persistToDb, userId, taskName]);

  // Save checkpoint to storage and optionally to DB
  const saveCheckpoint = useCallback(async (newState: TaskState<T>) => {
    const checkpointTime = new Date().toISOString();
    
    try {
      // Always save to localStorage as fallback
      const checkpoint = {
        ...newState,
        lastCheckpoint: checkpointTime,
      };
      localStorage.setItem(storageKey, JSON.stringify(checkpoint));
      setState(prev => ({ ...prev, lastCheckpoint: checkpointTime }));
      
      // Save to DB if enabled
      if (persistToDb && userId) {
        // First check if record exists
        const { data: existing } = await supabase
          .from('task_checkpoints')
          .select('id')
          .eq('task_id', newState.taskId)
          .maybeSingle();
        
        if (existing) {
          await supabase
            .from('task_checkpoints')
            .update({
              current_step: newState.currentStep,
              total_steps: totalSteps,
              data: JSON.parse(JSON.stringify(newState.data)),
              status: newState.status !== 'completed' && newState.status !== 'failed' ? 'running' : newState.status,
              updated_at: checkpointTime,
            })
            .eq('task_id', newState.taskId);
        } else {
          await supabase
            .from('task_checkpoints')
            .insert([{
              task_id: newState.taskId,
              user_id: userId,
              task_name: taskName,
              current_step: newState.currentStep,
              total_steps: totalSteps,
              data: JSON.parse(JSON.stringify(newState.data)),
              status: 'running',
            }]);
        }
      }
    } catch (error) {
      console.error('Error saving checkpoint:', error);
    }
  }, [storageKey, persistToDb, userId, taskName, totalSteps]);

  // Auto-save interval
  useEffect(() => {
    if (state.status === 'running' && autoSaveIntervalMs > 0) {
      autoSaveRef.current = setInterval(() => {
        saveCheckpoint(state);
      }, autoSaveIntervalMs);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [state, autoSaveIntervalMs, saveCheckpoint]);

  // Validate current step data
  const validateStep = useCallback((step: number, data: T): { valid: boolean; error?: string } => {
    // Check step-specific validator
    if (stepValidators[step]) {
      const result = stepValidators[step](data);
      if (typeof result === 'string') {
        return { valid: false, error: result };
      }
      if (!result) {
        return { valid: false, error: `Step ${step} validation failed` };
      }
    }

    // Check schema validation
    if (validationSchema) {
      const result = validationSchema.safeParse(data);
      if (!result.success) {
        return { valid: false, error: result.error.errors[0]?.message || 'Validation failed' };
      }
    }

    return { valid: true };
  }, [stepValidators, validationSchema]);

  // Start task
  const start = useCallback(() => {
    setState(prev => {
      const newState: TaskState<T> = {
        ...prev,
        status: 'running',
        startedAt: new Date().toISOString(),
        attempts: prev.attempts + 1,
        stepHistory: [
          ...prev.stepHistory,
          { step: 0, timestamp: new Date().toISOString(), action: 'entered' },
        ],
      };
      saveCheckpoint(newState);
      return newState;
    });
    toast.info(`Task "${taskName}" started`);
  }, [taskName, saveCheckpoint]);

  // Resume from recovery
  const resume = useCallback(() => {
    if (state.status === 'recovering') {
      setState(prev => ({ ...prev, status: 'running' }));
      toast.success(`Task "${taskName}" resumed from step ${state.currentStep + 1}`);
    }
  }, [state.status, state.currentStep, taskName]);

  // Pause task
  const pause = useCallback(() => {
    setState(prev => {
      const newState: TaskState<T> = { ...prev, status: 'paused' };
      saveCheckpoint(newState);
      return newState;
    });
    toast.info(`Task "${taskName}" paused`);
  }, [taskName, saveCheckpoint]);

  // Update data
  const updateData = useCallback((updates: Partial<T> | ((prev: T) => T)) => {
    setState(prev => {
      const newData = typeof updates === 'function' 
        ? updates(prev.data)
        : { ...prev.data, ...updates };
      return { ...prev, data: newData };
    });
  }, []);

  // Go to next step
  const nextStep = useCallback(() => {
    const validation = validateStep(state.currentStep, state.data);
    
    if (!validation.valid) {
      toast.error(validation.error || 'Please complete current step before proceeding');
      return false;
    }

    if (state.currentStep >= totalSteps - 1) {
      // Complete task
      setState(prev => {
        const newState: TaskState<T> = {
          ...prev,
          status: 'completed',
          completedAt: new Date().toISOString(),
          stepHistory: [
            ...prev.stepHistory,
            { step: prev.currentStep, timestamp: new Date().toISOString(), action: 'completed' },
          ],
        };
        localStorage.removeItem(storageKey);
        return newState;
      });
      onComplete?.(state.data);
      toast.success(`Task "${taskName}" completed successfully`);
      return true;
    }

    setState(prev => {
      const newStep = prev.currentStep + 1;
      const newState: TaskState<T> = {
        ...prev,
        currentStep: newStep,
        stepHistory: [
          ...prev.stepHistory,
          { step: prev.currentStep, timestamp: new Date().toISOString(), action: 'completed' },
          { step: newStep, timestamp: new Date().toISOString(), action: 'entered' },
        ],
      };
      saveCheckpoint(newState);
      onStepChange?.(newStep, prev.data);
      return newState;
    });

    return true;
  }, [state, totalSteps, validateStep, saveCheckpoint, storageKey, taskName, onComplete, onStepChange]);

  // Go to previous step
  const prevStep = useCallback(() => {
    if (state.currentStep <= 0) return false;

    setState(prev => {
      const newStep = prev.currentStep - 1;
      const newState: TaskState<T> = {
        ...prev,
        currentStep: newStep,
        stepHistory: [
          ...prev.stepHistory,
          { step: newStep, timestamp: new Date().toISOString(), action: 'entered' },
        ],
      };
      saveCheckpoint(newState);
      onStepChange?.(newStep, prev.data);
      return newState;
    });

    return true;
  }, [state.currentStep, saveCheckpoint, onStepChange]);

  // Go to specific step
  const goToStep = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return false;
    
    // Can only go back, or to current step
    if (step > state.currentStep) {
      toast.error('Cannot skip ahead. Please complete current step first.');
      return false;
    }

    setState(prev => {
      const newState: TaskState<T> = {
        ...prev,
        currentStep: step,
        stepHistory: [
          ...prev.stepHistory,
          { step, timestamp: new Date().toISOString(), action: 'entered' },
        ],
      };
      saveCheckpoint(newState);
      onStepChange?.(step, prev.data);
      return newState;
    });

    return true;
  }, [totalSteps, state.currentStep, saveCheckpoint, onStepChange]);

  // Fail task
  const fail = useCallback((error: Error) => {
    setState(prev => {
      const newState: TaskState<T> = {
        ...prev,
        status: 'failed',
        error: error.message,
        stepHistory: [
          ...prev.stepHistory,
          { 
            step: prev.currentStep, 
            timestamp: new Date().toISOString(), 
            action: 'failed',
            error: error.message,
          },
        ],
      };
      
      if (prev.attempts < maxAttempts) {
        saveCheckpoint(newState);
      } else {
        localStorage.removeItem(storageKey);
      }
      
      return newState;
    });
    
    onError?.(error, state);
    toast.error(`Task failed: ${error.message}`);
  }, [maxAttempts, saveCheckpoint, storageKey, state, onError]);

  // Reset task
  const reset = useCallback(() => {
    localStorage.removeItem(storageKey);
    setState({
      taskId: generateTaskId(),
      taskName,
      status: 'idle',
      currentStep: 0,
      totalSteps,
      data: initialData,
      stepHistory: [],
      attempts: 0,
      startedAt: null,
      completedAt: null,
      lastCheckpoint: null,
      error: null,
    });
  }, [storageKey, taskName, totalSteps, initialData]);

  // Retry task
  const retry = useCallback(() => {
    if (state.attempts >= maxAttempts) {
      toast.error('Maximum retry attempts reached');
      return false;
    }
    
    setState(prev => ({
      ...prev,
      status: 'running',
      error: null,
      attempts: prev.attempts + 1,
    }));
    
    return true;
  }, [state.attempts, maxAttempts]);

  // Get progress percentage
  const progress = Math.round(((state.currentStep + 1) / totalSteps) * 100);

  return {
    state,
    taskId: state.taskId,
    progress,
    actions: {
      start,
      resume,
      pause,
      nextStep,
      prevStep,
      goToStep,
      updateData,
      fail,
      reset,
      retry,
      saveCheckpoint: () => saveCheckpoint(state),
    },
    validation: {
      validate: () => validateStep(state.currentStep, state.data),
      isValid: validateStep(state.currentStep, state.data).valid,
    },
  };
}
