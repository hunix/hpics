import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { invokeFunction } from '@/lib/api';

export interface AgentRunStep {
  id: string;
  run_id: string;
  step_index: number;
  thinking: string | null;
  tool: string | null;
  args: Record<string, unknown> | null;
  observation: unknown;
  is_final: boolean;
  created_at: string;
}

export interface AgentRun {
  id: string;
  user_id: string;
  goal: string;
  profile_id: string | null;
  status: 'running' | 'completed' | 'failed';
  final_answer: string | null;
  step_count: number;
  model: string;
  created_at: string;
  updated_at: string;
}

const keys = {
  list: (userId?: string) => ['intel-agent', 'runs', userId] as const,
  run:  (runId: string) => ['intel-agent', 'run', runId] as const,
  steps: (runId: string) => ['intel-agent', 'steps', runId] as const,
};

// The agent_runs / agent_run_steps tables were added in a Phase-7 migration
// not yet reflected in the auto-generated Supabase types. Cast through a
// minimally-typed handle so the strict TS pass stops complaining about
// "excessively deep" inference for unknown tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function useAgentRuns(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.list(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from('agent_runs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AgentRun[];
    },
  });
}

export function useAgentRun(runId: string | null) {
  return useQuery({
    queryKey: runId ? keys.run(runId) : ['intel-agent', 'run', 'none'],
    enabled: !!runId,
    refetchInterval: (q) => {
      const run = q.state.data as AgentRun | undefined;
      return run && (run.status === 'completed' || run.status === 'failed') ? false : 2000;
    },
    queryFn: async () => {
      const { data, error } = await db.from('agent_runs').select('*').eq('id', runId!).maybeSingle();
      if (error) throw error;
      return data as AgentRun | null;
    },
  });
}

export function useAgentRunSteps(runId: string | null) {
  return useQuery({
    queryKey: runId ? keys.steps(runId) : ['intel-agent', 'steps', 'none'],
    enabled: !!runId,
    refetchInterval: 2000,
    queryFn: async () => {
      const { data, error } = await db
        .from('agent_run_steps')
        .select('*')
        .eq('run_id', runId!)
        .order('step_index');
      if (error) throw error;
      return (data ?? []) as AgentRunStep[];
    },
  });
}

/** Subscribe to realtime updates for a run's steps. */
export function useAgentRunRealtime(runId: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!runId) return;
    const channel = supabase
      .channel(`agent-run-${runId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_run_steps', filter: `run_id=eq.${runId}` }, () => {
        queryClient.invalidateQueries({ queryKey: keys.steps(runId) });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agent_runs', filter: `id=eq.${runId}` }, () => {
        queryClient.invalidateQueries({ queryKey: keys.run(runId) });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [runId, queryClient]);
}

export interface LaunchAgentArgs {
  goal: string;
  profileId?: string;
  maxSteps?: number;
  model?: string;
}

export function useLaunchAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: LaunchAgentArgs): Promise<{ runId: string }> => {
      const { data, error } = await invokeFunction('intel-agent', args as unknown as Record<string, unknown>);
      if (error) throw error;
      return data as { runId: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intel-agent', 'runs'] });
    },
  });
}

export function useActiveRunId() {
  const [runId, setRunId] = useState<string | null>(null);
  const clear = useCallback(() => setRunId(null), []);
  return { runId, setRunId, clear };
}
