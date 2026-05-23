import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

type HealingStrategy = 
  | 'retry_same'
  | 'simplify_prompt'
  | 'change_model'
  | 'reduce_context'
  | 'decompose_task'
  | 'alternative_approach';

interface AttemptRecord {
  strategy: HealingStrategy;
  timestamp: string;
  success: boolean;
  error?: string;
  duration?: number;
  modelUsed?: string;
}

interface HealingContext {
  originalPrompt?: string;
  currentPrompt?: string;
  originalModel?: string;
  currentModel?: string;
  contextSize?: number;
  taskDescription?: string;
  attemptHistory: AttemptRecord[];
  metadata?: Record<string, unknown>;
}

interface SelfHealState {
  isExecuting: boolean;
  currentStrategy: HealingStrategy | null;
  attemptNumber: number;
  lastError: string | null;
  context: HealingContext;
  succeeded: boolean;
}

interface AISelfHealOptions<T, C> {
  taskDescription: string;
  maxAttempts?: number;
  strategies?: HealingStrategy[];
  fallbackModels?: string[];
  contextReductionRatio?: number;
  onAttempt?: (attempt: AttemptRecord) => void;
  onStrategyChange?: (strategy: HealingStrategy, context: C) => C;
  onSuccess?: (result: T, attempts: number) => void;
  onExhausted?: (context: HealingContext) => void;
}

// Default strategy order
const DEFAULT_STRATEGIES: HealingStrategy[] = [
  'retry_same',
  'simplify_prompt',
  'change_model',
  'reduce_context',
  'decompose_task',
  'alternative_approach',
];

// Default model fallback chain
const DEFAULT_FALLBACK_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
];

// Error patterns that suggest specific strategies
const ERROR_STRATEGY_MAP: Record<string, HealingStrategy> = {
  'rate_limit': 'change_model',
  'context_length': 'reduce_context',
  'timeout': 'simplify_prompt',
  'overloaded': 'change_model',
  'token_limit': 'reduce_context',
  'complexity': 'decompose_task',
  'unsupported': 'alternative_approach',
};

function categorizeError(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('rate') || message.includes('429')) return 'rate_limit';
  if (message.includes('context') || message.includes('too long')) return 'context_length';
  if (message.includes('timeout') || message.includes('timed out')) return 'timeout';
  if (message.includes('overloaded') || message.includes('503')) return 'overloaded';
  if (message.includes('token')) return 'token_limit';
  if (message.includes('complex') || message.includes('cannot process')) return 'complexity';
  if (message.includes('unsupported') || message.includes('not available')) return 'unsupported';
  
  return 'unknown';
}

export function useAISelfHeal<T, C extends Record<string, unknown> = Record<string, unknown>>(
  executeFunction: (context: C) => Promise<T>,
  options: AISelfHealOptions<T, C>
) {
  const {
    taskDescription,
    maxAttempts = 5,
    strategies = DEFAULT_STRATEGIES,
    fallbackModels = DEFAULT_FALLBACK_MODELS,
    contextReductionRatio = 0.5,
    onAttempt,
    onStrategyChange,
    onSuccess,
    onExhausted,
  } = options;

  const [state, setState] = useState<SelfHealState>({
    isExecuting: false,
    currentStrategy: null,
    attemptNumber: 0,
    lastError: null,
    context: {
      taskDescription,
      attemptHistory: [],
    },
    succeeded: false,
  });

  const currentModelIndexRef = useRef(0);
  const strategyIndexRef = useRef(0);

  // Apply healing strategy to context
  const applyStrategy = useCallback((
    strategy: HealingStrategy,
    context: C,
    healingContext: HealingContext
  ): C => {
    let modifiedContext = { ...context };

    switch (strategy) {
      case 'retry_same':
        // No modification, just retry
        break;

      case 'simplify_prompt':
        // If context has a prompt field, try to simplify it
        if ('prompt' in modifiedContext && typeof modifiedContext.prompt === 'string') {
          const prompt = modifiedContext.prompt as string;
          // Remove examples, reduce formatting instructions
          const simplified = prompt
            .replace(/for example[^.]*\./gi, '')
            .replace(/such as[^.]*\./gi, '')
            .replace(/e\.g\.[^.]*\./gi, '')
            .trim();
          modifiedContext = { ...modifiedContext, prompt: simplified };
        }
        break;

      case 'change_model': {
        // Cycle through fallback models
        currentModelIndexRef.current = (currentModelIndexRef.current + 1) % fallbackModels.length;
        const newModel = fallbackModels[currentModelIndexRef.current];
        if ('model' in modifiedContext) {
          modifiedContext = { ...modifiedContext, model: newModel };
        }
        healingContext.currentModel = newModel;
        break;
      }

      case 'reduce_context':
        // Reduce context size if applicable
        if ('context' in modifiedContext && typeof modifiedContext.context === 'string') {
          const ctx = modifiedContext.context as string;
          const reducedLength = Math.floor(ctx.length * contextReductionRatio);
          modifiedContext = { ...modifiedContext, context: ctx.slice(0, reducedLength) };
        }
        if ('messages' in modifiedContext && Array.isArray(modifiedContext.messages)) {
          const messages = modifiedContext.messages as unknown[];
          const reducedCount = Math.max(1, Math.floor(messages.length * contextReductionRatio));
          modifiedContext = { ...modifiedContext, messages: messages.slice(-reducedCount) };
        }
        break;

      case 'decompose_task':
        // Add decomposition hint to context
        if ('decompose' in modifiedContext) {
          modifiedContext = { ...modifiedContext, decompose: true };
        }
        break;

      case 'alternative_approach':
        // Signal to use alternative approach
        if ('useAlternative' in modifiedContext) {
          modifiedContext = { ...modifiedContext, useAlternative: true };
        }
        break;
    }

    // Allow custom strategy modifications
    if (onStrategyChange) {
      modifiedContext = onStrategyChange(strategy, modifiedContext);
    }

    return modifiedContext;
  }, [fallbackModels, contextReductionRatio, onStrategyChange]);

  // Get next strategy based on error type
  const getNextStrategy = useCallback((error: Error): HealingStrategy | null => {
    const errorCategory = categorizeError(error);
    
    // Check if there's a specific strategy for this error type
    const suggestedStrategy = ERROR_STRATEGY_MAP[errorCategory];
    if (suggestedStrategy && strategies.includes(suggestedStrategy)) {
      const strategyIndex = strategies.indexOf(suggestedStrategy);
      if (strategyIndex >= strategyIndexRef.current) {
        strategyIndexRef.current = strategyIndex;
        return suggestedStrategy;
      }
    }

    // Otherwise, use next strategy in sequence
    if (strategyIndexRef.current < strategies.length) {
      const strategy = strategies[strategyIndexRef.current];
      strategyIndexRef.current++;
      return strategy;
    }

    return null;
  }, [strategies]);

  // Execute with self-healing
  const execute = useCallback(async (initialContext: C): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      isExecuting: true,
      attemptNumber: 0,
      lastError: null,
      succeeded: false,
      context: {
        ...prev.context,
        attemptHistory: [],
      },
    }));

    strategyIndexRef.current = 0;
    currentModelIndexRef.current = 0;

    let context = initialContext;
    const healingContext: HealingContext = {
      taskDescription,
      attemptHistory: [],
      originalModel: 'model' in context ? String(context.model) : undefined,
      originalPrompt: 'prompt' in context ? String(context.prompt) : undefined,
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const strategy = attempt === 0 ? 'retry_same' : getNextStrategy(new Error(state.lastError || ''));
      
      if (!strategy && attempt > 0) {
        // All strategies exhausted
        break;
      }

      setState(prev => ({
        ...prev,
        attemptNumber: attempt + 1,
        currentStrategy: strategy,
      }));

      const startTime = Date.now();
      
      try {
        // Apply strategy if not first attempt
        if (attempt > 0 && strategy) {
          context = applyStrategy(strategy, context, healingContext);
        }

        const result = await executeFunction(context);
        
        const attemptRecord: AttemptRecord = {
          strategy: strategy || 'retry_same',
          timestamp: new Date().toISOString(),
          success: true,
          duration: Date.now() - startTime,
          modelUsed: 'model' in context ? String(context.model) : undefined,
        };

        healingContext.attemptHistory.push(attemptRecord);
        onAttempt?.(attemptRecord);

        setState(prev => ({
          ...prev,
          isExecuting: false,
          succeeded: true,
          context: healingContext,
        }));

        onSuccess?.(result, attempt + 1);
        
        if (attempt > 0) {
          toast.success(`AI recovered using "${strategy}" strategy`);
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        const attemptRecord: AttemptRecord = {
          strategy: strategy || 'retry_same',
          timestamp: new Date().toISOString(),
          success: false,
          error: err.message,
          duration: Date.now() - startTime,
          modelUsed: 'model' in context ? String(context.model) : undefined,
        };

        healingContext.attemptHistory.push(attemptRecord);
        onAttempt?.(attemptRecord);

        setState(prev => ({
          ...prev,
          lastError: err.message,
          context: healingContext,
        }));

        // Brief delay before retry with exponential backoff
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 10000)));
        }
      }
    }

    // All attempts exhausted
    setState(prev => ({
      ...prev,
      isExecuting: false,
      succeeded: false,
    }));

    onExhausted?.(healingContext);
    toast.error(`AI task failed after ${maxAttempts} attempts`);
    
    return null;
  }, [
    taskDescription,
    maxAttempts,
    executeFunction,
    getNextStrategy,
    applyStrategy,
    state.lastError,
    onAttempt,
    onSuccess,
    onExhausted,
  ]);

  // Reset state
  const reset = useCallback(() => {
    strategyIndexRef.current = 0;
    currentModelIndexRef.current = 0;
    setState({
      isExecuting: false,
      currentStrategy: null,
      attemptNumber: 0,
      lastError: null,
      context: {
        taskDescription,
        attemptHistory: [],
      },
      succeeded: false,
    });
  }, [taskDescription]);

  return {
    execute,
    reset,
    state,
    strategies: {
      available: strategies,
      current: state.currentStrategy,
      remaining: strategies.length - strategyIndexRef.current,
    },
  };
}

// Utility hook for simpler cases
export function useSimpleAISelfHeal<T>(
  executeFunction: () => Promise<T>,
  options: Omit<AISelfHealOptions<T, Record<string, unknown>>, 'onStrategyChange'> = { taskDescription: 'AI Task' }
) {
  const selfHeal = useAISelfHeal<T, Record<string, unknown>>(
    () => executeFunction(),
    options
  );

  return {
    ...selfHeal,
    execute: () => selfHeal.execute({}),
  };
}
