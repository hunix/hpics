// AGIS Phase Tracking HOC Pattern
// Wrapper utilities for automatic phase operation tracking

import { createTrackingContext, getTrackingDuration, type TrackingContext } from './trackingUtils';

type PhaseMiddleware = {
  recordSuccess: (phase: number, operationType: string, duration?: number, metadata?: Record<string, unknown>) => void;
  recordFailure: (phase: number, operationType: string, duration?: number, metadata?: Record<string, unknown>) => void;
};

/**
 * Creates a tracked mutation function that automatically records success/failure
 */
export function createTrackedMutation<TArgs extends unknown[], TResult>(
  phase: number,
  operationType: string,
  mutationFn: (...args: TArgs) => Promise<TResult>,
  middleware: PhaseMiddleware | null
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const context = createTrackingContext(phase, operationType);
    
    try {
      const result = await mutationFn(...args);
      
      if (middleware) {
        const duration = getTrackingDuration(context);
        middleware.recordSuccess(phase, operationType, duration, { args: args.length });
      }
      
      return result;
    } catch (error) {
      if (middleware) {
        const duration = getTrackingDuration(context);
        middleware.recordFailure(phase, operationType, duration, { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      throw error;
    }
  };
}

/**
 * Wraps an existing mutation's callbacks with phase tracking
 */
export function withPhaseTracking(
  phase: number,
  operationType: string,
  middleware: PhaseMiddleware | null,
  startTime: number
) {
  return {
    onSuccess: () => {
      if (middleware) {
        middleware.recordSuccess(phase, operationType, Date.now() - startTime);
      }
    },
    onError: (error: Error) => {
      if (middleware) {
        middleware.recordFailure(phase, operationType, Date.now() - startTime, {
          error: error.message,
        });
      }
    },
  };
}

/**
 * Hook wrapper pattern for adding tracking to existing mutations
 * Usage: wrap mutation options with this to add automatic tracking
 */
export function createTrackedMutationOptions<T>(
  phase: number,
  operationType: string,
  middleware: PhaseMiddleware | null,
  existingOnSuccess?: () => void,
  existingOnError?: (error: Error) => void
): { onSuccess: () => void; onError: (error: Error) => void } {
  const startTime = Date.now();
  
  return {
    onSuccess: () => {
      if (middleware) {
        middleware.recordSuccess(phase, operationType, Date.now() - startTime);
      }
      existingOnSuccess?.();
    },
    onError: (error: Error) => {
      if (middleware) {
        middleware.recordFailure(phase, operationType, Date.now() - startTime, {
          error: error.message,
        });
      }
      existingOnError?.(error);
    },
  };
}
