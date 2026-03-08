import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface IntelligenceSession {
  id: string;
  userId: string;
  profileId: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  forceRefresh: boolean;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  skippedTasks: number;
  currentCategory: string | null;
  errorMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  resumedAt: string | null;
  pausedAt: string | null;
}

export interface IntelligenceSessionTask {
  id: string;
  sessionId: string;
  taskName: string;
  edgeFunction: string;
  analysisType: string | null;
  category: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  errorDetails: Record<string, unknown> | null;
  processingTimeMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

interface UseIntelligenceSessionReturn {
  session: IntelligenceSession | null;
  tasks: IntelligenceSessionTask[];
  isLoading: boolean;
  isProcessing: boolean;
  // Actions
  startGeneration: (forceRefresh?: boolean) => Promise<void>;
  resumeGeneration: () => Promise<void>;
  pauseGeneration: () => Promise<void>;
  cancelGeneration: () => Promise<void>;
  retryFailed: () => Promise<void>;
  retryTask: (taskId: string) => Promise<void>;
  discardSession: () => Promise<void>;
  // Computed
  progress: number;
  isGenerating: boolean;
  isPaused: boolean;
  canResume: boolean;
  hasExistingSession: boolean;
  currentTaskName: string | null;
  completedTaskNames: string[];
  failedTaskNames: string[];
  // Categories
  categoryProgress: Record<string, { total: number; completed: number; failed: number }>;
}

// Map database row to session interface
function mapSession(row: any): IntelligenceSession {
  return {
    id: row.id,
    userId: row.user_id,
    profileId: row.profile_id,
    status: row.status,
    forceRefresh: row.force_refresh,
    totalTasks: row.total_tasks,
    completedTasks: row.completed_tasks,
    failedTasks: row.failed_tasks,
    skippedTasks: row.skipped_tasks,
    currentCategory: row.current_category,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    resumedAt: row.resumed_at,
    pausedAt: row.paused_at,
  };
}

// Map database row to task interface
function mapTask(row: any): IntelligenceSessionTask {
  return {
    id: row.id,
    sessionId: row.session_id,
    taskName: row.task_name,
    edgeFunction: row.edge_function,
    analysisType: row.analysis_type,
    category: row.category,
    priority: row.priority,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    result: row.result,
    errorMessage: row.error_message,
    errorDetails: row.error_details,
    processingTimeMs: row.processing_time_ms,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}

export function useIntelligenceSession(profileId: string): UseIntelligenceSessionReturn {
  const { user } = useAuth();
  const [session, setSession] = useState<IntelligenceSession | null>(null);
  const [tasks, setTasks] = useState<IntelligenceSessionTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionChannelRef = useRef<RealtimeChannel | null>(null);
  const tasksChannelRef = useRef<RealtimeChannel | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false); // Prevent concurrent processing calls
  const isMountedRef = useRef(true); // Track component mount status

  // Cleanup effect for mount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load existing session and subscribe to updates
  useEffect(() => {
    if (!user?.id || !profileId) {
      setIsLoading(false);
      return;
    }

    const loadSession = async () => {
      setIsLoading(true);
      try {
        // Load most recent active or completed session for this profile
        const { data: sessionData, error: sessionError } = await supabase
          .from('intelligence_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (sessionError) throw sessionError;

        if (sessionData) {
          setSession(mapSession(sessionData));

          // Load tasks for this session
          const { data: tasksData, error: tasksError } = await supabase
            .from('intelligence_session_tasks')
            .select('*')
            .eq('session_id', sessionData.id)
            .order('priority', { ascending: true })
            .order('created_at', { ascending: true });

          if (tasksError) throw tasksError;
          setTasks((tasksData || []).map(mapTask));
        } else {
          setSession(null);
          setTasks([]);
        }
      } catch (error) {
        console.error('[useIntelligenceSession] Load error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Subscribe to session changes
    sessionChannelRef.current = supabase
      .channel(`intelligence-session-${profileId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intelligence_sessions',
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          console.log('[Realtime] Session update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSession(mapSession(payload.new));
          } else if (payload.eventType === 'DELETE') {
            setSession(null);
            setTasks([]);
          }
        }
      )
      .subscribe();

    return () => {
      if (sessionChannelRef.current) {
        supabase.removeChannel(sessionChannelRef.current);
      }
    };
  }, [user?.id, profileId]);

  // Subscribe to task changes when we have a session
  useEffect(() => {
    if (!session?.id) {
      if (tasksChannelRef.current) {
        supabase.removeChannel(tasksChannelRef.current);
        tasksChannelRef.current = null;
      }
      return;
    }

    tasksChannelRef.current = supabase
      .channel(`intelligence-tasks-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'intelligence_session_tasks',
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          console.log('[Realtime] Task update:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, mapTask(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => 
              prev.map(t => t.id === payload.new.id ? mapTask(payload.new) : t)
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      if (tasksChannelRef.current) {
        supabase.removeChannel(tasksChannelRef.current);
      }
    };
  }, [session?.id]);

  // Process batch function - called repeatedly while session is running
  const processBatch = useCallback(async (sessionId: string) => {
    if (isProcessingRef.current) {
      console.log('[processBatch] Already processing, skipping');
      return null;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      console.log('[processBatch] Processing batch for session:', sessionId);
      
      const { data, error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'process', sessionId, batchSize: 3 }
      });

      if (error) {
        console.error('[processBatch] Error:', error);
        return null;
      }

      console.log('[processBatch] Result:', data);
      return data;
    } catch (error) {
      console.error('[processBatch] Exception:', error);
      return null;
    } finally {
      isProcessingRef.current = false;
      if (isMountedRef.current) {
        setIsProcessing(false);
      }
    }
  }, []);

  // Polling effect - continuously process batches while session is running
  useEffect(() => {
    // Clear any existing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    // Only poll if session is running
    if (!session?.id || session.status !== 'running') {
      console.log('[Polling] Not starting - session status:', session?.status);
      return;
    }

    console.log('[Polling] Starting batch processing for session:', session.id);

    // Immediately process first batch
    processBatch(session.id);

    // Set up polling interval (process next batch after current completes)
    processingIntervalRef.current = setInterval(async () => {
      if (!isProcessingRef.current && session?.status === 'running') {
        const result = await processBatch(session.id);
        
        // Stop polling if session is no longer running
        if (result && result.status !== 'running') {
          console.log('[Polling] Session finished, stopping polling');
          if (processingIntervalRef.current) {
            clearInterval(processingIntervalRef.current);
            processingIntervalRef.current = null;
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    };
  }, [session?.id, session?.status, processBatch]);

  // Actions
  const startGeneration = useCallback(async (forceRefresh = false) => {
    if (!user?.id || !profileId) return;

    try {
      toast.info('Starting intelligence generation...');
      
      const { data, error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'start', profileId, forceRefresh }
      });

      if (error) throw error;

      if (data.status === 'existing') {
        toast.info('Active session found. Use resume to continue.');
      } else {
        toast.success(`Started ${data.totalTasks} intelligence tasks`);
      }
    } catch (error) {
      console.error('[startGeneration] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to start: ${message}`);
    }
  }, [user?.id, profileId]);

  const resumeGeneration = useCallback(async () => {
    if (!session?.id) return;

    try {
      toast.info('Resuming generation...');
      
      const { error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'resume', sessionId: session.id }
      });

      if (error) throw error;
      toast.success('Generation resumed');
    } catch (error) {
      console.error('[resumeGeneration] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to resume: ${message}`);
    }
  }, [session?.id]);

  const pauseGeneration = useCallback(async () => {
    if (!session?.id) return;

    try {
      const { error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'pause', sessionId: session.id }
      });

      if (error) throw error;
      toast.info('Generation paused');
    } catch (error) {
      console.error('[pauseGeneration] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to pause: ${message}`);
    }
  }, [session?.id]);

  const cancelGeneration = useCallback(async () => {
    if (!session?.id) return;

    try {
      const { error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'cancel', sessionId: session.id }
      });

      if (error) throw error;
      toast.info('Generation cancelled');
    } catch (error) {
      console.error('[cancelGeneration] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to cancel: ${message}`);
    }
  }, [session?.id]);

  const retryFailed = useCallback(async () => {
    if (!session?.id) return;

    try {
      toast.info('Retrying failed tasks...');
      
      const { data, error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'retry_failed', sessionId: session.id }
      });

      if (error) throw error;
      toast.success(`Retrying ${data.tasksReset} failed tasks`);
    } catch (error) {
      console.error('[retryFailed] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to retry: ${message}`);
    }
  }, [session?.id]);

  const retryTask = useCallback(async (taskId: string) => {
    try {
      const { error } = await supabase.functions.invoke('intelligence-session-runner', {
        body: { action: 'retry_task', taskId }
      });

      if (error) throw error;
      toast.info('Retrying task...');
    } catch (error) {
      console.error('[retryTask] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to retry task: ${message}`);
    }
  }, []);

  const discardSession = useCallback(async () => {
    if (!session?.id) return;

    try {
      // Delete the session (cascade will delete tasks)
      const { error } = await supabase
        .from('intelligence_sessions')
        .delete()
        .eq('id', session.id);

      if (error) throw error;
      
      setSession(null);
      setTasks([]);
      toast.info('Session discarded');
    } catch (error) {
      console.error('[discardSession] Error:', error);
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to discard: ${message}`);
    }
  }, [session?.id]);

  // Computed values
  const progress = session ? 
    session.totalTasks > 0 
      ? ((session.completedTasks + session.failedTasks + session.skippedTasks) / session.totalTasks) * 100 
      : 0 
    : 0;

  const isGenerating = session?.status === 'running';
  const isPaused = session?.status === 'paused';
  
  // Can resume if paused, or if running but no recent task updates (stale)
  const canResume = isPaused || (
    session?.status === 'running' && 
    tasks.every(t => t.status !== 'running')
  );

  const hasExistingSession = !!session && ['pending', 'running', 'paused'].includes(session.status);

  const currentTaskName = tasks.find(t => t.status === 'running')?.taskName || null;
  const completedTaskNames = tasks.filter(t => t.status === 'completed').map(t => t.taskName);
  const failedTaskNames = tasks.filter(t => t.status === 'failed').map(t => t.taskName);

  // Category progress
  const categoryProgress = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = { total: 0, completed: 0, failed: 0 };
    }
    acc[task.category].total++;
    if (task.status === 'completed') acc[task.category].completed++;
    if (task.status === 'failed') acc[task.category].failed++;
    return acc;
  }, {} as Record<string, { total: number; completed: number; failed: number }>);

  return {
    session,
    tasks,
    isLoading,
    isProcessing,
    startGeneration,
    resumeGeneration,
    pauseGeneration,
    cancelGeneration,
    retryFailed,
    retryTask,
    discardSession,
    progress,
    isGenerating,
    isPaused,
    canResume,
    hasExistingSession,
    currentTaskName,
    completedTaskNames,
    failedTaskNames,
    categoryProgress,
  };
}
