import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type BatchStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_decision';
type ItemStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
type UserDecision = 'skip' | 'retry' | 'abort' | 'skip_similar';

interface BatchItem<T> {
  id: string;
  data: T;
  status: ItemStatus;
  attempts: number;
  error?: string;
  result?: unknown;
  processedAt?: string;
}

interface BatchState<T> {
  batchId: string;
  status: BatchStatus;
  items: BatchItem<T>[];
  currentIndex: number;
  totalItems: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  lastError?: { item: T; error: string; index: number };
  skipPatterns: string[];
}

interface ReliableBatchOptions<T> {
  items: T[];
  taskName: string;
  batchId?: string;
  maxItemRetries?: number;
  pauseOnError?: boolean;
  concurrency?: number;
  persistProgress?: boolean;
  processItem: (item: T, index: number) => Promise<unknown>;
  onItemComplete?: (item: T, result: unknown, index: number) => void;
  onItemFail?: (item: T, error: Error, index: number) => Promise<UserDecision> | UserDecision;
  onBatchComplete?: (results: Array<{ item: T; result?: unknown; error?: string }>) => void;
  getItemId?: (item: T) => string;
  getErrorPattern?: (item: T, error: Error) => string;
}

const STORAGE_PREFIX = 'reliable_batch_';

function generateBatchId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useReliableBatch<T>({
  items,
  taskName,
  batchId: providedBatchId,
  maxItemRetries = 3,
  pauseOnError = true,
  concurrency = 1,
  persistProgress = true,
  processItem,
  onItemComplete,
  onItemFail,
  onBatchComplete,
  getItemId = (_item: T, index: number) => `item_${index}`,
  getErrorPattern = () => 'default',
}: ReliableBatchOptions<T> & { getItemId?: (item: T, index: number) => string }) {
  const { user } = useAuth();
  const storageKey = `${STORAGE_PREFIX}${taskName}_${providedBatchId || 'current'}`;
  const processingRef = useRef(false);
  const abortRef = useRef(false);

  // Initialize state
  const getInitialState = (): BatchState<T> => {
    // Try to restore from storage
    if (persistProgress) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as BatchState<T>;
          if (parsed.status !== 'completed' && parsed.status !== 'failed') {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error loading batch state:', error);
      }
    }

    return {
      batchId: providedBatchId || generateBatchId(),
      status: 'idle',
      items: items.map((data, index) => ({
        id: getItemId(data, index),
        data,
        status: 'pending',
        attempts: 0,
      })),
      currentIndex: 0,
      totalItems: items.length,
      completedCount: 0,
      failedCount: 0,
      skippedCount: 0,
      startedAt: null,
      completedAt: null,
      skipPatterns: [],
    };
  };

  const [state, setState] = useState<BatchState<T>>(getInitialState);
  const [pendingDecision, setPendingDecision] = useState<{
    item: T;
    error: Error;
    index: number;
  } | null>(null);

  // Save state to storage
  const saveState = useCallback((newState: BatchState<T>) => {
    if (persistProgress) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newState));
      } catch (error) {
        console.error('Error saving batch state:', error);
      }
    }
  }, [storageKey, persistProgress]);

  // Persist to database
  const persistToDatabase = useCallback(async (newState: BatchState<T>) => {
    if (!user) return;

    try {
      // Using batch_jobs table for persistence
      const { error } = await supabase
        .from('batch_jobs')
        .upsert({
          id: newState.batchId,
          user_id: user.id,
          job_type: taskName,
          status: newState.status === 'completed' ? 'completed' : 
                  newState.status === 'failed' ? 'failed' : 'processing',
          total_items: newState.totalItems,
          processed_items: newState.completedCount + newState.failedCount + newState.skippedCount,
          failed_items: newState.failedCount,
          started_at: newState.startedAt,
          completed_at: newState.completedAt,
        });

      if (error) {
        console.error('Error persisting batch to database:', error);
      }
    } catch (error) {
      console.error('Error persisting batch to database:', error);
    }
  }, [user, taskName]);

  // Process a single item
  const processOneItem = useCallback(async (index: number): Promise<boolean> => {
    if (abortRef.current) return false;

    const item = state.items[index];
    if (!item || item.status === 'completed' || item.status === 'skipped') {
      return true;
    }

    // Check if error pattern should be skipped
    const errorPattern = getErrorPattern(item.data, new Error(''));
    if (state.skipPatterns.includes(errorPattern)) {
      setState(prev => {
        const newItems = [...prev.items];
        newItems[index] = { ...newItems[index], status: 'skipped' };
        return {
          ...prev,
          items: newItems,
          skippedCount: prev.skippedCount + 1,
          currentIndex: index + 1,
        };
      });
      return true;
    }

    // Update status to processing
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], status: 'processing', attempts: newItems[index].attempts + 1 };
      return { ...prev, items: newItems, currentIndex: index };
    });

    try {
      const result = await processItem(item.data, index);
      
      // Success
      setState(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          status: 'completed',
          result,
          processedAt: new Date().toISOString(),
        };
        const newState = {
          ...prev,
          items: newItems,
          completedCount: prev.completedCount + 1,
          currentIndex: index + 1,
        };
        saveState(newState);
        return newState;
      });

      onItemComplete?.(item.data, result, index);
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Check if max retries exceeded
      if (item.attempts >= maxItemRetries) {
        if (pauseOnError) {
          // Pause for user decision
          setPendingDecision({ item: item.data, error: err, index });
          setState(prev => ({
            ...prev,
            status: 'awaiting_decision',
            lastError: { item: item.data, error: err.message, index },
          }));
          return false;
        }

        // Auto-skip on max retries
        setState(prev => {
          const newItems = [...prev.items];
          newItems[index] = {
            ...newItems[index],
            status: 'failed',
            error: err.message,
          };
          const newState = {
            ...prev,
            items: newItems,
            failedCount: prev.failedCount + 1,
            currentIndex: index + 1,
          };
          saveState(newState);
          return newState;
        });

        return true;
      }

      // Will retry
      setState(prev => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          status: 'pending',
          error: err.message,
        };
        return { ...prev, items: newItems };
      });

      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, item.attempts) * 1000));
      return processOneItem(index);
    }
  }, [state, processItem, maxItemRetries, pauseOnError, saveState, onItemComplete, getErrorPattern]);

  // Handle user decision
  const handleDecision = useCallback(async (decision: UserDecision) => {
    if (!pendingDecision) return;

    const { item, error, index } = pendingDecision;
    setPendingDecision(null);

    switch (decision) {
      case 'skip':
        setState(prev => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], status: 'skipped' };
          const newState = {
            ...prev,
            items: newItems,
            skippedCount: prev.skippedCount + 1,
            currentIndex: index + 1,
            status: 'running' as BatchStatus,
          };
          saveState(newState);
          return newState;
        });
        break;

      case 'retry':
        setState(prev => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], status: 'pending', attempts: 0 };
          return { ...prev, items: newItems, status: 'running' };
        });
        break;

      case 'abort':
        abortRef.current = true;
        setState(prev => ({
          ...prev,
          status: 'failed',
          completedAt: new Date().toISOString(),
        }));
        return;

      case 'skip_similar':
        const pattern = getErrorPattern(item, error);
        setState(prev => {
          const newItems = [...prev.items];
          newItems[index] = { ...newItems[index], status: 'skipped' };
          const newState = {
            ...prev,
            items: newItems,
            skippedCount: prev.skippedCount + 1,
            currentIndex: index + 1,
            status: 'running' as BatchStatus,
            skipPatterns: [...prev.skipPatterns, pattern],
          };
          saveState(newState);
          return newState;
        });
        break;
    }

    // Continue processing
    processingRef.current = false;
    runBatch();
  }, [pendingDecision, saveState, getErrorPattern]);

  // Run the batch
  const runBatch = useCallback(async () => {
    if (processingRef.current || abortRef.current) return;
    if (state.status === 'awaiting_decision' as BatchStatus || state.status === 'paused' as BatchStatus) return;

    processingRef.current = true;

    for (let i = state.currentIndex; i < state.items.length; i++) {
      if (abortRef.current || state.status === ('paused' as BatchStatus)) break;

      const success = await processOneItem(i);
      if (!success) {
        processingRef.current = false;
        return;
      }
    }

    // All items processed
    if (!abortRef.current && state.status !== ('awaiting_decision' as BatchStatus)) {
      setState(prev => {
        const newState = {
          ...prev,
          status: 'completed' as BatchStatus,
          completedAt: new Date().toISOString(),
        };
        saveState(newState);
        persistToDatabase(newState);
        return newState;
      });

      onBatchComplete?.(
        state.items.map(item => ({
          item: item.data,
          result: item.result,
          error: item.error,
        }))
      );

      toast.success(`Batch "${taskName}" completed`);
    }

    processingRef.current = false;
  }, [state, processOneItem, saveState, persistToDatabase, taskName, onBatchComplete]);

  // Start batch
  const start = useCallback(() => {
    abortRef.current = false;
    setState(prev => ({
      ...prev,
      status: 'running',
      startedAt: new Date().toISOString(),
    }));
    toast.info(`Starting batch "${taskName}" with ${items.length} items`);
  }, [taskName, items.length]);

  // Auto-run when status changes to running
  useEffect(() => {
    if (state.status === 'running' && !processingRef.current) {
      runBatch();
    }
  }, [state.status, runBatch]);

  // Pause batch
  const pause = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, status: 'paused' as BatchStatus };
      saveState(newState);
      return newState;
    });
    toast.info('Batch paused');
  }, [saveState]);

  // Resume batch
  const resume = useCallback(() => {
    setState(prev => ({ ...prev, status: 'running' }));
    toast.info('Batch resumed');
  }, []);

  // Abort batch
  const abort = useCallback(() => {
    abortRef.current = true;
    setState(prev => ({
      ...prev,
      status: 'failed',
      completedAt: new Date().toISOString(),
    }));
    toast.error('Batch aborted');
  }, []);

  // Reset batch
  const reset = useCallback(() => {
    abortRef.current = false;
    processingRef.current = false;
    localStorage.removeItem(storageKey);
    setState(getInitialState());
  }, [storageKey]);

  // Export failed items
  const exportFailedItems = useCallback(() => {
    const failed = state.items
      .filter(item => item.status === 'failed')
      .map(item => ({ data: item.data, error: item.error }));
    
    const blob = new Blob([JSON.stringify(failed, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed_items_${taskName}_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${failed.length} failed items`);
    return failed;
  }, [state.items, taskName]);

  // Calculate progress
  const progress = Math.round(
    ((state.completedCount + state.failedCount + state.skippedCount) / state.totalItems) * 100
  );

  return {
    state,
    progress,
    pendingDecision,
    actions: {
      start,
      pause,
      resume,
      abort,
      reset,
      handleDecision,
      exportFailedItems,
    },
    stats: {
      total: state.totalItems,
      completed: state.completedCount,
      failed: state.failedCount,
      skipped: state.skippedCount,
      remaining: state.totalItems - state.completedCount - state.failedCount - state.skippedCount,
      progress,
    },
  };
}
