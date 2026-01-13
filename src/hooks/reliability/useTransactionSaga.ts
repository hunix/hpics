// Transaction Saga Pattern - Multi-step transactions with compensation
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SagaStepStatus = 'pending' | 'executing' | 'completed' | 'failed' | 'compensating' | 'compensated';

export interface SagaStep<TContext = Record<string, unknown>> {
  name: string;
  execute: (context: TContext) => Promise<TContext>;
  compensate?: (context: TContext) => Promise<void>;
  validate?: (context: TContext) => Promise<boolean>;
  retryable?: boolean;
  maxRetries?: number;
}

export interface SagaStepResult {
  name: string;
  status: SagaStepStatus;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
  retryCount: number;
}

export interface SagaState<TContext = Record<string, unknown>> {
  status: 'idle' | 'running' | 'completed' | 'failed' | 'rolling_back' | 'rolled_back';
  currentStep: number;
  steps: SagaStepResult[];
  context: TContext;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
}

export interface SagaOptions<TContext = Record<string, unknown>> {
  steps: SagaStep<TContext>[];
  onStepComplete?: (stepName: string, context: TContext) => void;
  onStepFail?: (stepName: string, error: Error, context: TContext) => void;
  onComplete?: (context: TContext) => void;
  onRollback?: (context: TContext) => void;
  onError?: (error: Error, context: TContext) => void;
  persistState?: boolean;
  sagaId?: string;
  userId?: string;
  sagaName?: string;
}

export interface SagaActions<TContext = Record<string, unknown>> {
  execute: (initialContext: TContext) => Promise<{ success: boolean; context: TContext; error?: Error }>;
  reset: () => void;
  getAuditLog: () => SagaAuditEntry[];
}

interface SagaAuditEntry {
  timestamp: Date;
  action: 'step_start' | 'step_complete' | 'step_fail' | 'compensate_start' | 'compensate_complete' | 'saga_complete' | 'saga_fail';
  stepName?: string;
  details?: string;
}

export function useTransactionSaga<TContext extends Record<string, unknown>>(
  options: SagaOptions<TContext>
): { state: SagaState<TContext>; actions: SagaActions<TContext> } {
  const { 
    steps, 
    onStepComplete, 
    onStepFail, 
    onComplete, 
    onRollback, 
    onError,
    persistState = false,
    sagaId: providedSagaId,
    userId,
    sagaName = 'unnamed_saga',
  } = options;
  
  const sagaIdRef = useRef(providedSagaId || `saga_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const [state, setState] = useState<SagaState<TContext>>(() => ({
    status: 'idle',
    currentStep: 0,
    steps: steps.map(step => ({
      name: step.name,
      status: 'pending' as SagaStepStatus,
      retryCount: 0,
    })),
    context: {} as TContext,
  }));

  const auditLogRef = useRef<SagaAuditEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist saga state to DB
  const persistSagaState = useCallback(async (
    sagaState: SagaState<TContext>,
    auditLog: SagaAuditEntry[]
  ) => {
    if (!persistState || !userId) return;
    
    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('saga_transactions')
        .select('id')
        .eq('saga_name', `${sagaName}_${sagaIdRef.current}`)
        .eq('user_id', userId)
        .maybeSingle();
      
      const sagaData = {
        saga_name: `${sagaName}_${sagaIdRef.current}`,
        user_id: userId,
        saga_type: 'transaction',
        status: sagaState.status,
        current_step: sagaState.currentStep,
        total_steps: steps.length,
        steps: JSON.parse(JSON.stringify(sagaState.steps.map(s => ({
          name: s.name,
          status: s.status,
          retryCount: s.retryCount,
          error: s.error?.message,
        })))),
        context: JSON.parse(JSON.stringify(sagaState.context)),
        audit_log: JSON.parse(JSON.stringify(auditLog.map(e => ({
          timestamp: e.timestamp.toISOString(),
          action: e.action,
          stepName: e.stepName,
          details: e.details,
        })))),
        error_message: sagaState.error?.message || null,
        started_at: sagaState.startedAt?.toISOString() || null,
        completed_at: sagaState.completedAt?.toISOString() || null,
        updated_at: new Date().toISOString(),
      };
      
      if (existing) {
        await supabase
          .from('saga_transactions')
          .update(sagaData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('saga_transactions')
          .insert([sagaData]);
      }
    } catch (error) {
      console.error('Error persisting saga state:', error);
    }
  }, [persistState, userId, sagaName, steps.length]);

  const addAuditEntry = useCallback((entry: Omit<SagaAuditEntry, 'timestamp'>) => {
    const newEntry = { ...entry, timestamp: new Date() };
    auditLogRef.current.push(newEntry);
  }, []);

  const updateStepStatus = useCallback((stepIndex: number, updates: Partial<SagaStepResult>) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map((step, idx) => 
        idx === stepIndex ? { ...step, ...updates } : step
      ),
    }));
  }, []);

  const executeStep = useCallback(async (
    step: SagaStep<TContext>,
    stepIndex: number,
    context: TContext
  ): Promise<TContext> => {
    const maxRetries = step.maxRetries ?? 3;
    let lastError: Error | null = null;
    let retryCount = 0;

    while (retryCount <= maxRetries) {
      try {
        // Validate if validator exists
        if (step.validate) {
          const isValid = await step.validate(context);
          if (!isValid) {
            throw new Error(`Validation failed for step: ${step.name}`);
          }
        }

        addAuditEntry({ action: 'step_start', stepName: step.name });
        updateStepStatus(stepIndex, { 
          status: 'executing', 
          startedAt: new Date(),
          retryCount,
        });

        const newContext = await step.execute(context);
        
        updateStepStatus(stepIndex, { 
          status: 'completed', 
          completedAt: new Date(),
        });
        addAuditEntry({ action: 'step_complete', stepName: step.name });
        
        onStepComplete?.(step.name, newContext);
        
        return newContext;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryCount++;
        
        if (!step.retryable || retryCount > maxRetries) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
      }
    }

    updateStepStatus(stepIndex, { 
      status: 'failed', 
      error: lastError!,
      retryCount,
    });
    addAuditEntry({ action: 'step_fail', stepName: step.name, details: lastError?.message });
    onStepFail?.(step.name, lastError!, context);
    
    throw lastError;
  }, [addAuditEntry, updateStepStatus, onStepComplete, onStepFail]);

  const compensateSteps = useCallback(async (
    completedStepIndex: number,
    context: TContext
  ): Promise<void> => {
    setState(prev => ({ ...prev, status: 'rolling_back' }));

    // Compensate in reverse order
    for (let i = completedStepIndex; i >= 0; i--) {
      const step = steps[i];
      if (step.compensate) {
        try {
          addAuditEntry({ action: 'compensate_start', stepName: step.name });
          updateStepStatus(i, { status: 'compensating' });
          
          await step.compensate(context);
          
          updateStepStatus(i, { status: 'compensated' });
          addAuditEntry({ action: 'compensate_complete', stepName: step.name });
        } catch (compensateError) {
          console.error(`Compensation failed for step ${step.name}:`, compensateError);
          // Continue compensating other steps even if one fails
        }
      }
    }

    setState(prev => ({ ...prev, status: 'rolled_back' }));
    onRollback?.(context);
  }, [steps, addAuditEntry, updateStepStatus, onRollback]);

  const execute = useCallback(async (
    initialContext: TContext
  ): Promise<{ success: boolean; context: TContext; error?: Error }> => {
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({
      ...prev,
      status: 'running',
      currentStep: 0,
      context: initialContext,
      startedAt: new Date(),
      steps: prev.steps.map(step => ({ ...step, status: 'pending' as SagaStepStatus, retryCount: 0 })),
    }));

    let currentContext = initialContext;
    let lastCompletedStep = -1;

    try {
      for (let i = 0; i < steps.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Saga aborted');
        }

        setState(prev => ({ ...prev, currentStep: i }));
        currentContext = await executeStep(steps[i], i, currentContext);
        lastCompletedStep = i;
        
        setState(prev => ({ ...prev, context: currentContext }));
      }

      const completedState: SagaState<TContext> = {
        ...state,
        status: 'completed',
        completedAt: new Date(),
        context: currentContext,
        currentStep: steps.length - 1,
        steps: state.steps.map(s => ({ ...s })),
      };
      
      setState(completedState);
      addAuditEntry({ action: 'saga_complete' });
      
      // Persist to DB
      await persistSagaState(completedState, auditLogRef.current);
      
      onComplete?.(currentContext);

      return { success: true, context: currentContext };
    } catch (error) {
      const sagaError = error instanceof Error ? error : new Error(String(error));
      
      const failedState: SagaState<TContext> = {
        ...state,
        status: 'failed',
        error: sagaError,
        completedAt: new Date(),
        context: currentContext,
        steps: state.steps.map(s => ({ ...s })),
      };
      
      setState(failedState);
      addAuditEntry({ action: 'saga_fail', details: sagaError.message });

      // Compensate completed steps
      if (lastCompletedStep >= 0) {
        await compensateSteps(lastCompletedStep, currentContext);
      }
      
      // Persist failed state to DB
      await persistSagaState(failedState, auditLogRef.current);

      onError?.(sagaError, currentContext);
      
      return { success: false, context: currentContext, error: sagaError };
    }
  }, [steps, executeStep, compensateSteps, addAuditEntry, onComplete, onError, persistSagaState, state]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    auditLogRef.current = [];
    
    setState({
      status: 'idle',
      currentStep: 0,
      steps: steps.map(step => ({
        name: step.name,
        status: 'pending',
        retryCount: 0,
      })),
      context: {} as TContext,
    });
  }, [steps]);

  const getAuditLog = useCallback(() => {
    return [...auditLogRef.current];
  }, []);

  return {
    state,
    actions: {
      execute,
      reset,
      getAuditLog,
    },
  };
}
