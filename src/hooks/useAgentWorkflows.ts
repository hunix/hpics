/**
 * Agent Workflows Hook
 * 
 * Provides CRUD operations and execution for agent workflows.
 * Supports LangGraph-style cyclical workflows with backtracking.
 * 
 * @version 3.9.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

export interface WorkflowState {
  name: string;
  description?: string;
  action: string;
  action_params?: Record<string, unknown>;
  timeout_ms?: number;
  on_error?: 'retry' | 'backtrack' | 'fail' | 'skip';
  max_retries?: number;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  condition?: string;
  priority?: number;
}

export interface SelfCorrectionRule {
  condition: string;
  action: 'backtrack' | 'retry' | 'skip' | 'escalate';
  backtrack_to?: string;
  max_attempts?: number;
}

export interface AgentWorkflow {
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
  tags: string[];
  priority: number;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  profile_id: string | null;
  current_state: string;
  state_history: Array<{
    state: string;
    input: Record<string, unknown>;
    output: Record<string, unknown>;
    timestamp: string;
    iteration: number;
  }>;
  backtrack_history: unknown[];
  initial_input: Record<string, unknown>;
  current_context: Record<string, unknown>;
  final_output: Record<string, unknown> | null;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  iterations_completed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const WORKFLOWS_QUERY_KEY = ['agent-workflows'];
const EXECUTIONS_QUERY_KEY = ['workflow-executions'];

export function useAgentWorkflows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load all workflows (user's + system)
  const {
    data: workflows,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: WORKFLOWS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('agent_workflows' as any)
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user?.id}`)
        .order('workflow_name')) as any;

      if (error) throw error;
      return (data || []) as unknown as AgentWorkflow[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user
  });

  // Get active workflows
  const activeWorkflows = useMemo(() => {
    return workflows?.filter(w => w.is_active) || [];
  }, [workflows]);

  // Group by type
  const byType = useMemo(() => {
    const grouped: Record<string, AgentWorkflow[]> = {};
    for (const workflow of activeWorkflows) {
      if (!grouped[workflow.workflow_type]) {
        grouped[workflow.workflow_type] = [];
      }
      grouped[workflow.workflow_type].push(workflow);
    }
    return grouped;
  }, [activeWorkflows]);

  // Get user's custom workflows
  const userWorkflows = useMemo(() => {
    return workflows?.filter(w => w.user_id === user?.id) || [];
  }, [workflows, user?.id]);

  // Get system workflows
  const systemWorkflows = useMemo(() => {
    return workflows?.filter(w => w.is_system) || [];
  }, [workflows]);

  // Create new workflow
  const createWorkflow = useMutation({
    mutationFn: async (workflow: Omit<AgentWorkflow, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data, error } = await (supabase
        .from('agent_workflows' as any)
        .insert({
          ...workflow,
          user_id: user?.id
        })
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as AgentWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Workflow created');
    },
    onError: (error: Error) => {
      toast.error('Failed to create workflow', { description: error.message });
    }
  });

  // Update workflow
  const updateWorkflow = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AgentWorkflow> }) => {
      const workflow = workflows?.find(w => w.id === id);
      if (workflow?.is_system && workflow.user_id !== user?.id) {
        throw new Error('Cannot modify system workflows');
      }

      const { data, error } = await (supabase
        .from('agent_workflows' as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()) as any;

      if (error) throw error;
      return data as unknown as AgentWorkflow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Workflow updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update workflow', { description: error.message });
    }
  });

  // Delete workflow
  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const workflow = workflows?.find(w => w.id === id);
      if (workflow?.is_system) {
        throw new Error('Cannot delete system workflows');
      }

      const { error } = await (supabase
        .from('agent_workflows' as any)
        .delete()
        .eq('id', id)) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY });
      toast.success('Workflow deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete workflow', { description: error.message });
    }
  });

  // Execute workflow
  const executeWorkflow = useMutation({
    mutationFn: async ({ workflowKey, input, profileId }: { 
      workflowKey: string; 
      input: Record<string, unknown>;
      profileId?: string;
    }) => {
      const { data, error } = await invokeFunction('workflow-executor', {
          workflowKey,
          input,
          profileId,
          userId: user?.id
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error('Workflow execution failed', { description: error.message });
    }
  });

  // Get workflow by key
  const getWorkflow = useCallback((key: string): AgentWorkflow | undefined => {
    return workflows?.find(w => w.workflow_key === key);
  }, [workflows]);

  return {
    // Data
    workflows: workflows || [],
    activeWorkflows,
    userWorkflows,
    systemWorkflows,
    byType,

    // State
    isLoading,
    error,
    refetch,

    // Utilities
    getWorkflow,

    // Mutations
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow
  };
}

/**
 * Hook for workflow execution history
 */
export function useWorkflowExecutions(options?: { 
  workflowId?: string; 
  status?: string;
  limit?: number;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: executions,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...EXECUTIONS_QUERY_KEY, options?.workflowId, options?.status, options?.limit],
    queryFn: async () => {
      let query = (supabase
        .from('agent_workflow_executions' as any)
        .select('*')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false })
        .limit(options?.limit || 50)) as any;

      if (options?.workflowId) {
        query = query.eq('workflow_id', options.workflowId);
      }

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as WorkflowExecution[];
    },
    staleTime: 30 * 1000,
    enabled: !!user
  });

  // Get execution stats
  const stats = useMemo(() => {
    if (!executions) return null;

    const byStatus: Record<string, number> = {};
    let totalIterations = 0;
    let completedCount = 0;

    for (const exec of executions) {
      byStatus[exec.status] = (byStatus[exec.status] || 0) + 1;
      totalIterations += exec.iterations_completed;
      if (exec.status === 'completed') completedCount++;
    }

    return {
      total: executions.length,
      byStatus,
      successRate: executions.length > 0 ? (completedCount / executions.length) * 100 : 0,
      avgIterations: executions.length > 0 ? totalIterations / executions.length : 0
    };
  }, [executions]);

  // Cancel execution
  const cancelExecution = useMutation({
    mutationFn: async (executionId: string) => {
      const { error } = await (supabase
        .from('agent_workflow_executions' as any)
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', executionId)
        .eq('user_id', user?.id ?? '')) as any;

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXECUTIONS_QUERY_KEY });
      toast.success('Execution cancelled');
    }
  });

  return {
    executions: executions || [],
    stats,
    isLoading,
    error,
    refetch,
    cancelExecution
  };
}

// Query keys factory
export const workflowKeys = {
  all: WORKFLOWS_QUERY_KEY,
  byType: (type: string) => [...WORKFLOWS_QUERY_KEY, 'type', type],
  executions: EXECUTIONS_QUERY_KEY,
  executionsByWorkflow: (workflowId: string) => [...EXECUTIONS_QUERY_KEY, 'workflow', workflowId]
};
