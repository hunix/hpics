/**
 * Workflow Engine
 * 
 * LangGraph-style cyclical workflow execution with state machines,
 * backtracking, and self-correction capabilities.
 * 
 * All workflow definitions are stored in the database.
 * 
 * @version 3.9.0
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export interface WorkflowState {
  name: string;
  description?: string;
  action: string; // Edge function to invoke or 'end'
  action_params?: Record<string, unknown>;
  timeout_ms?: number;
  on_error?: 'retry' | 'backtrack' | 'fail' | 'skip';
  max_retries?: number;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  condition?: string; // JSON expression to evaluate
  priority?: number;
}

export interface Workflow {
  id: string;
  user_id: string | null;
  workflow_key: string;
  workflow_name: string;
  description: string | null;
  workflow_type: 'linear' | 'cyclical' | 'conditional' | 'parallel';
  initial_state: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  enable_backtracking: boolean;
  max_backtrack_depth: number;
  self_correction_rules: SelfCorrectionRule[];
  max_iterations: number;
  timeout_ms: number;
  checkpoint_enabled: boolean;
  requires_human_approval: boolean;
  approval_stages: string[];
  is_active: boolean;
}

export interface SelfCorrectionRule {
  condition: string; // JSON expression
  action: 'backtrack' | 'retry' | 'skip' | 'escalate';
  backtrack_to?: string; // State to backtrack to
  max_attempts?: number;
}

export interface StateSnapshot {
  state: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: string;
  iteration: number;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  current_state: string;
  state_history: StateSnapshot[];
  backtrack_history: StateSnapshot[];
  initial_input: Record<string, unknown>;
  current_context: Record<string, unknown>;
  final_output: Record<string, unknown> | null;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  iterations_completed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface WorkflowResult {
  success: boolean;
  finalState: string;
  output: Record<string, unknown>;
  history: StateSnapshot[];
  iterations: number;
  error?: string;
}

/**
 * Load workflow definition from database
 */
export async function loadWorkflow(
  supabase: SupabaseClient,
  workflowKey: string,
  userId?: string
): Promise<Workflow | null> {
  // First try user-specific workflow, then fall back to system workflow
  const { data, error } = await supabase
    .from('agent_workflows')
    .select('*')
    .eq('workflow_key', workflowKey)
    .eq('is_active', true)
    .or(`user_id.is.null,user_id.eq.${userId || 'null'}`)
    .order('user_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .single();

  if (error) {
    console.warn(`[WorkflowEngine] Failed to load workflow ${workflowKey}:`, error.message);
    return null;
  }

  return data as unknown as Workflow;
}

/**
 * Get all workflows for a user
 */
export async function getUserWorkflows(
  supabase: SupabaseClient,
  userId: string
): Promise<Workflow[]> {
  const { data, error } = await supabase
    .from('agent_workflows')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .eq('is_active', true)
    .order('workflow_name');

  if (error) {
    console.error('[WorkflowEngine] Failed to load user workflows:', error.message);
    return [];
  }

  return (data || []) as unknown as Workflow[];
}

/**
 * Create a new workflow execution record
 */
export async function createExecution(
  supabase: SupabaseClient,
  workflowId: string,
  userId: string,
  initialInput: Record<string, unknown>,
  profileId?: string
): Promise<WorkflowExecution | null> {
  const workflow = await supabase
    .from('agent_workflows')
    .select('initial_state')
    .eq('id', workflowId)
    .single();

  if (workflow.error) {
    console.error('[WorkflowEngine] Failed to get workflow:', workflow.error.message);
    return null;
  }

  const { data, error } = await supabase
    .from('agent_workflow_executions')
    .insert({
      workflow_id: workflowId,
      user_id: userId,
      profile_id: profileId,
      current_state: workflow.data.initial_state,
      initial_input: initialInput,
      current_context: initialInput,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('[WorkflowEngine] Failed to create execution:', error.message);
    return null;
  }

  return data as unknown as WorkflowExecution;
}

/**
 * Update execution state
 */
export async function updateExecution(
  supabase: SupabaseClient,
  executionId: string,
  updates: Partial<WorkflowExecution>
): Promise<void> {
  const { error } = await supabase
    .from('agent_workflow_executions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', executionId);

  if (error) {
    console.error('[WorkflowEngine] Failed to update execution:', error.message);
  }
}

/**
 * Evaluate a condition expression against context
 */
function evaluateCondition(
  condition: string | undefined,
  context: Record<string, unknown>
): boolean {
  if (!condition) return true;

  try {
    // Simple JSON path evaluation
    // Format: "path.to.value == expected" or "path.to.value > number"
    const match = condition.match(/^([\w.]+)\s*(==|!=|>|<|>=|<=)\s*(.+)$/);
    if (!match) return true;

    const [, path, operator, expectedRaw] = match;
    const pathParts = path.split('.');
    let value: unknown = context;
    
    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return false;
      }
    }

    const expected = expectedRaw.trim().replace(/^['"]|['"]$/g, '');

    switch (operator) {
      case '==': return String(value) === expected;
      case '!=': return String(value) !== expected;
      case '>': return Number(value) > Number(expected);
      case '<': return Number(value) < Number(expected);
      case '>=': return Number(value) >= Number(expected);
      case '<=': return Number(value) <= Number(expected);
      default: return true;
    }
  } catch {
    return true;
  }
}

/**
 * Check if self-correction is needed
 */
function shouldSelfCorrect(
  output: Record<string, unknown>,
  rules: SelfCorrectionRule[]
): SelfCorrectionRule | null {
  for (const rule of rules) {
    if (evaluateCondition(rule.condition, output)) {
      return rule;
    }
  }
  return null;
}

/**
 * Find next transition based on current state and context
 */
function findNextTransition(
  currentState: string,
  context: Record<string, unknown>,
  transitions: WorkflowTransition[]
): WorkflowTransition | null {
  // Filter transitions from current state
  const possibleTransitions = transitions
    .filter(t => t.from === currentState)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Find first matching condition
  for (const transition of possibleTransitions) {
    if (evaluateCondition(transition.condition, context)) {
      return transition;
    }
  }

  return null;
}

/**
 * Execute a single workflow state
 */
async function executeState(
  supabase: SupabaseClient,
  state: WorkflowState,
  context: Record<string, unknown>,
  userId: string
): Promise<{ success: boolean; output: Record<string, unknown>; error?: string }> {
  if (state.action === 'end') {
    return { success: true, output: context };
  }

  try {
    // Invoke edge function
    const { data, error } = await supabase.functions.invoke(state.action, {
      body: {
        ...state.action_params,
        ...context,
        userId
      }
    });

    if (error) {
      return { success: false, output: {}, error: error.message };
    }

    return { success: true, output: data || {} };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, output: {}, error: message };
  }
}

/**
 * Execute a complete workflow
 */
export async function executeWorkflow(
  supabase: SupabaseClient,
  workflow: Workflow,
  initialInput: Record<string, unknown>,
  userId: string,
  executionId?: string
): Promise<WorkflowResult> {
  let currentState = workflow.initial_state;
  let iterations = 0;
  let context = { ...initialInput };
  const stateHistory: StateSnapshot[] = [];
  const backtrackStack: StateSnapshot[] = [];

  // Update execution status
  if (executionId) {
    await updateExecution(supabase, executionId, {
      status: 'running',
      started_at: new Date().toISOString()
    });
  }

  while (iterations < workflow.max_iterations) {
    // Find current state definition
    const stateConfig = workflow.states.find(s => s.name === currentState);
    if (!stateConfig) {
      return {
        success: false,
        finalState: currentState,
        output: context,
        history: stateHistory,
        iterations,
        error: `State '${currentState}' not found in workflow`
      };
    }

    // Execute state action
    const result = await executeState(supabase, stateConfig, context, userId);

    // Create snapshot
    const snapshot: StateSnapshot = {
      state: currentState,
      input: context,
      output: result.output,
      timestamp: new Date().toISOString(),
      iteration: iterations
    };

    stateHistory.push(snapshot);

    // Checkpoint for backtracking
    if (workflow.checkpoint_enabled) {
      if (backtrackStack.length >= workflow.max_backtrack_depth) {
        backtrackStack.shift();
      }
      backtrackStack.push(snapshot);
    }

    // Handle errors
    if (!result.success) {
      const errorAction = stateConfig.on_error || 'fail';
      
      if (errorAction === 'backtrack' && workflow.enable_backtracking && backtrackStack.length > 1) {
        // Pop current and go back one state
        backtrackStack.pop();
        const previousState = backtrackStack[backtrackStack.length - 1];
        currentState = previousState.state;
        context = previousState.input as Record<string, unknown>;
        iterations++;
        continue;
      } else if (errorAction === 'retry' && (stateConfig.max_retries || 1) > 0) {
        // Retry logic would go here
        iterations++;
        continue;
      } else if (errorAction === 'skip') {
        // Find default transition
        const transition = findNextTransition(currentState, context, workflow.transitions);
        if (transition) {
          currentState = transition.to;
          iterations++;
          continue;
        }
      }
      
      // Default: fail
      if (executionId) {
        await updateExecution(supabase, executionId, {
          status: 'failed',
          error_message: result.error,
          completed_at: new Date().toISOString()
        });
      }
      
      return {
        success: false,
        finalState: currentState,
        output: context,
        history: stateHistory,
        iterations,
        error: result.error
      };
    }

    // Merge output into context
    context = { ...context, ...result.output };

    // Check self-correction rules
    const correctionRule = shouldSelfCorrect(result.output, workflow.self_correction_rules);
    if (correctionRule) {
      if (correctionRule.action === 'backtrack' && correctionRule.backtrack_to) {
        const targetIndex = backtrackStack.findIndex(s => s.state === correctionRule.backtrack_to);
        if (targetIndex >= 0) {
          currentState = backtrackStack[targetIndex].state;
          context = backtrackStack[targetIndex].input as Record<string, unknown>;
          // Trim backtrack stack
          backtrackStack.length = targetIndex + 1;
          iterations++;
          continue;
        }
      }
    }

    // Find next transition
    const transition = findNextTransition(currentState, context, workflow.transitions);
    if (!transition || transition.to === 'END') {
      // Workflow complete
      if (executionId) {
        await updateExecution(supabase, executionId, {
          status: 'completed',
          final_output: context,
          current_state: 'END',
          completed_at: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        finalState: 'END',
        output: context,
        history: stateHistory,
        iterations
      };
    }

    // Update execution checkpoint
    if (executionId) {
      await updateExecution(supabase, executionId, {
        current_state: transition.to,
        current_context: context,
        state_history: stateHistory,
        iterations_completed: iterations
      });
    }

    currentState = transition.to;
    iterations++;
  }

  // Max iterations reached
  if (executionId) {
    await updateExecution(supabase, executionId, {
      status: 'failed',
      error_message: 'Max iterations reached',
      completed_at: new Date().toISOString()
    });
  }

  return {
    success: false,
    finalState: currentState,
    output: context,
    history: stateHistory,
    iterations,
    error: 'Max iterations reached'
  };
}
