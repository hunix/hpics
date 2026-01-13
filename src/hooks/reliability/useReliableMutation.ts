// Reliable Mutation Hook - Enterprise-grade mutations with resilience
import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors?: string[];
}

export interface OptimisticConfig<TData, TVariables> {
  updateCache: boolean;
  queryKey?: string[];
  optimisticUpdate?: (variables: TVariables) => TData;
  rollbackOnError?: boolean;
}

export interface AuditConfig {
  enabled: boolean;
  action: string;
  includeVariables?: boolean;
  sensitiveFields?: string[];
}

export interface OfflineConfig {
  queue: boolean;
  maxQueueSize?: number;
  syncOnReconnect?: boolean;
}

export interface ReliableMutationOptions<TData, TError, TVariables> {
  retry?: Partial<RetryConfig>;
  optimistic?: Partial<OptimisticConfig<TData, TVariables>>;
  audit?: Partial<AuditConfig>;
  offline?: Partial<OfflineConfig>;
  deduplicateMs?: number;
  circuitBreakerKey?: string;
  onRetry?: (attempt: number, error: TError) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
}

interface MutationState {
  attempts: number;
  lastError?: Error;
  isRetrying: boolean;
  queuedOperations: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryableErrors: ['NetworkError', 'TimeoutError', 'ECONNRESET', '503', '504'],
};

const offlineQueue: Map<string, { variables: unknown; timestamp: number }[]> = new Map();

export function useReliableMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: ReliableMutationOptions<TData, TError, TVariables> = {}
) {
  const {
    retry = {},
    optimistic = {},
    audit = {},
    offline = {},
    deduplicateMs = 1000,
    onRetry,
    onSuccess,
    onError,
  } = options;

  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry };
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<MutationState>({
    attempts: 0,
    isRetrying: false,
    queuedOperations: 0,
  });

  const lastMutationRef = useRef<{ hash: string; timestamp: number } | null>(null);
  const pendingRollbackRef = useRef<(() => void) | null>(null);

  // Simple hash for deduplication
  const hashVariables = useCallback((variables: TVariables): string => {
    return JSON.stringify(variables);
  }, []);

  const isRetryableError = useCallback((error: TError): boolean => {
    const errorString = String(error);
    return retryConfig.retryableErrors?.some(e => errorString.includes(e)) ?? false;
  }, [retryConfig.retryableErrors]);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = retryConfig.baseDelayMs * Math.pow(retryConfig.backoffMultiplier, attempt - 1);
    const jitter = delay * 0.2 * Math.random(); // 20% jitter
    return Math.min(delay + jitter, retryConfig.maxDelayMs);
  }, [retryConfig]);

  const logAudit = useCallback((action: string, variables: TVariables, result: 'success' | 'error', error?: TError) => {
    if (!audit.enabled) return;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: audit.action || action,
      result,
      ...(audit.includeVariables && {
        variables: sanitizeForAudit(variables, audit.sensitiveFields),
      }),
      ...(error && { error: String(error) }),
    };

    console.log('[Audit]', auditEntry);
    // Could persist to database here
  }, [audit]);

  const sanitizeForAudit = (data: unknown, sensitiveFields?: string[]): unknown => {
    if (!sensitiveFields?.length || !data || typeof data !== 'object') return data;
    
    const sanitized = { ...data as Record<string, unknown> };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  };

  const executeWithRetry = useCallback(async (variables: TVariables): Promise<TData> => {
    let lastError: TError | null = null;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        setState(prev => ({ ...prev, attempts: attempt, isRetrying: attempt > 1 }));
        
        const result = await mutationFn(variables);
        
        setState(prev => ({ ...prev, isRetrying: false }));
        return result;
      } catch (error) {
        lastError = error as TError;
        setState(prev => ({ ...prev, lastError: error as Error }));

        if (attempt < retryConfig.maxAttempts && isRetryableError(lastError)) {
          onRetry?.(attempt, lastError);
          const delay = calculateDelay(attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    throw lastError;
  }, [mutationFn, retryConfig.maxAttempts, isRetryableError, calculateDelay, onRetry]);

  const mutationOptions: UseMutationOptions<TData, TError, TVariables> = {
    mutationFn: async (variables: TVariables) => {
      // Deduplication check
      const hash = hashVariables(variables);
      const now = Date.now();
      
      if (lastMutationRef.current && 
          lastMutationRef.current.hash === hash && 
          now - lastMutationRef.current.timestamp < deduplicateMs) {
        throw new Error('Duplicate mutation blocked');
      }
      
      lastMutationRef.current = { hash, timestamp: now };

      // Offline handling
      if (!navigator.onLine && offline.queue) {
        const key = hash;
        const queue = offlineQueue.get(key) || [];
        
        if (!offline.maxQueueSize || queue.length < offline.maxQueueSize) {
          queue.push({ variables, timestamp: now });
          offlineQueue.set(key, queue);
          setState(prev => ({ ...prev, queuedOperations: queue.length }));
        }
        
        throw new Error('Operation queued for offline sync');
      }

      return executeWithRetry(variables);
    },
    onMutate: async (variables) => {
      // Optimistic update
      if (optimistic.updateCache && optimistic.queryKey && optimistic.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: optimistic.queryKey });
        
        const previousData = queryClient.getQueryData(optimistic.queryKey);
        
        queryClient.setQueryData(
          optimistic.queryKey,
          optimistic.optimisticUpdate(variables)
        );

        pendingRollbackRef.current = () => {
          queryClient.setQueryData(optimistic.queryKey!, previousData);
        };

        return { previousData };
      }
    },
    onSuccess: (data, variables) => {
      logAudit('mutation', variables, 'success');
      pendingRollbackRef.current = null;
      onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      logAudit('mutation', variables, 'error', error);
      
      // Rollback optimistic update
      if (optimistic.rollbackOnError !== false && pendingRollbackRef.current) {
        pendingRollbackRef.current();
        pendingRollbackRef.current = null;
      }
      
      onError?.(error, variables);
    },
  };

  const mutation = useMutation(mutationOptions);

  // Sync offline queue when back online
  const syncOfflineQueue = useCallback(async () => {
    if (!offline.syncOnReconnect) return;

    for (const [key, queue] of offlineQueue.entries()) {
      for (const item of queue) {
        try {
          await mutationFn(item.variables as TVariables);
        } catch (error) {
          console.error('Failed to sync offline mutation:', error);
        }
      }
      offlineQueue.delete(key);
    }
    
    setState(prev => ({ ...prev, queuedOperations: 0 }));
  }, [offline.syncOnReconnect, mutationFn]);

  return {
    ...mutation,
    state,
    syncOfflineQueue,
    hasQueuedOperations: state.queuedOperations > 0,
  };
}
