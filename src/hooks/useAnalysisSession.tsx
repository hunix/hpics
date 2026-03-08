import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { calculateCostCents } from '@/lib/aiPricing';

export type AnalysisType = 'behavioral' | 'facial' | 'body_language' | 'vocal' | 'multi_party';
export type JobStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'skipped';
export type SessionStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';

export interface AnalysisJob {
  id: string;
  type: AnalysisType;
  modelKey: string;
  status: JobStatus;
  progress: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs: number;
  estimatedCostCents: number;
  actualCostCents: number;
}

export interface AnalysisSession {
  id: string;
  status: SessionStatus;
  jobs: AnalysisJob[];
  totalDurationMs: number;
  totalCostCents: number;
  startedAt?: Date;
  currentJobIndex: number;
}

interface UseAnalysisSessionProps {
  profileId: string;
  mediaId: string;
  mediaUrl: string;
  mosaicUrl?: string | null;
  analysisMode: 'video' | 'mosaic';
  contextType: 'screening' | 'interview';
  selectedTypes: AnalysisType[];
  getModelForType: (type: AnalysisType) => string;
}

export function useAnalysisSession({
  profileId,
  mediaId,
  mediaUrl,
  mosaicUrl,
  analysisMode,
  contextType,
  selectedTypes,
  getModelForType,
}: UseAnalysisSessionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentCostEstimate, setCurrentCostEstimate] = useState(0);
  
  const isPausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Timer effect
  useEffect(() => {
    if (session?.status === 'running') {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session?.status]);

  // Estimate cost based on model and typical analysis
  const estimateCost = useCallback((modelKey: string): number => {
    // Estimate ~3000 input tokens and ~1500 output tokens for video analysis
    return calculateCostCents(modelKey, 3000, 1500);
  }, []);

  // Create a new session
  const createSession = useCallback(async (): Promise<string | null> => {
    if (!user || !profileId || !mediaId) return null;

    try {
      // Create session in database
      const { data: sessionData, error: sessionError } = await supabase
        .from('analysis_sessions')
        .insert({
          user_id: user.id,
          profile_id: profileId,
          media_id: mediaId,
          media_url: mediaUrl,
          mosaic_url: mosaicUrl,
          analysis_mode: analysisMode,
          context_type: contextType,
          status: 'pending',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Create jobs for each selected type
      const jobs: AnalysisJob[] = selectedTypes.map(type => ({
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        modelKey: getModelForType(type),
        status: 'pending' as JobStatus,
        progress: 0,
        durationMs: 0,
        estimatedCostCents: estimateCost(getModelForType(type)),
        actualCostCents: 0,
      }));

      // Insert jobs into database
      const { error: jobsError } = await supabase
        .from('analysis_jobs')
        .insert(jobs.map(job => ({
          session_id: sessionData.id,
          user_id: user.id,
          analysis_type: job.type,
          model_key: job.modelKey,
          status: 'pending',
          estimated_cost_cents: job.estimatedCostCents,
        })));

      if (jobsError) throw jobsError;

      const newSession: AnalysisSession = {
        id: sessionData.id,
        status: 'pending',
        jobs,
        totalDurationMs: 0,
        totalCostCents: 0,
        currentJobIndex: 0,
      };

      setSession(newSession);
      sessionIdRef.current = sessionData.id;
      setElapsedTime(0);
      setCurrentCostEstimate(jobs.reduce((sum, j) => sum + j.estimatedCostCents, 0));

      return sessionData.id;
    } catch (error) {
      toast({ title: 'Failed to create session', description: error instanceof Error ? error.message : 'Unknown error', variant: 'destructive' });
      return null;
    }
  }, [user, profileId, mediaId, mediaUrl, mosaicUrl, analysisMode, contextType, selectedTypes, getModelForType, estimateCost, toast]);

  // Run a single analysis job
  const runJob = useCallback(async (job: AnalysisJob): Promise<boolean> => {
    if (!user || !sessionIdRef.current) return false;

    const endpoints: Record<AnalysisType, string> = {
      behavioral: 'analyze-behavioral',
      facial: 'analyze-facial',
      body_language: 'analyze-body-language',
      vocal: 'analyze-vocal',
    };

    const startTime = Date.now();

    // Update job status to running
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === job.id ? { ...j, status: 'running' as JobStatus, startedAt: new Date() } : j
        ),
      };
    });

    // Update database
    await supabase
      .from('analysis_jobs')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('session_id', sessionIdRef.current)
      .eq('analysis_type', job.type);

    try {
      // Check if paused
      if (isPausedRef.current) {
        setSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            jobs: prev.jobs.map(j => 
              j.id === job.id ? { ...j, status: 'paused' as JobStatus } : j
            ),
          };
        });
        return false;
      }

      const response = await supabase.functions.invoke(endpoints[job.type], {
        body: {
          profileId,
          videoUrl: analysisMode === 'video' ? mediaUrl : undefined,
          mosaicUrl: analysisMode === 'mosaic' ? mosaicUrl : undefined,
          analysisType: contextType,
          useMosaic: analysisMode === 'mosaic',
        },
      });

      const duration = Date.now() - startTime;
      const actualCost = calculateCostCents(job.modelKey, 3000, 1500);

      if (response.error) {
        throw response.error;
      }

      // Update job as completed
      setSession(prev => {
        if (!prev) return prev;
        const totalCost = prev.totalCostCents + actualCost;
        return {
          ...prev,
          jobs: prev.jobs.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'completed' as JobStatus, 
              progress: 100,
              completedAt: new Date(),
              durationMs: duration,
              actualCostCents: actualCost,
            } : j
          ),
          totalDurationMs: prev.totalDurationMs + duration,
          totalCostCents: totalCost,
        };
      });

      // Update database
      await supabase
        .from('analysis_jobs')
        .update({ 
          status: 'completed', 
          progress: 100,
          completed_at: new Date().toISOString(),
          duration_ms: duration,
          actual_cost_cents: actualCost,
        })
        .eq('session_id', sessionIdRef.current)
        .eq('analysis_type', job.type);

      queryClient.invalidateQueries({ queryKey: ['recent-analyses'] });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      // Update job as failed
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          jobs: prev.jobs.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'failed' as JobStatus,
              errorMessage: message,
              durationMs: duration,
            } : j
          ),
        };
      });

      // Update database
      await supabase
        .from('analysis_jobs')
        .update({ 
          status: 'failed',
          error_message: message,
          duration_ms: duration,
        })
        .eq('session_id', sessionIdRef.current)
        .eq('analysis_type', job.type);

      return false;
    }
  }, [user, profileId, mediaUrl, mosaicUrl, analysisMode, contextType, queryClient]);

  // Start or resume the session
  const start = useCallback(async () => {
    let currentSession = session;
    
    if (!currentSession) {
      const sessionId = await createSession();
      if (!sessionId) return;
      currentSession = session;
    }

    if (!currentSession) return;

    isPausedRef.current = false;

    // Update session status to running
    setSession(prev => prev ? { ...prev, status: 'running', startedAt: prev.startedAt || new Date() } : prev);
    
    await supabase
      .from('analysis_sessions')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', sessionIdRef.current);

    // Find first pending or failed job to run
    const pendingJobs = currentSession.jobs.filter(j => j.status === 'pending' || j.status === 'paused');
    
    for (const job of pendingJobs) {
      if (isPausedRef.current) break;
      
      setSession(prev => prev ? { 
        ...prev, 
        currentJobIndex: prev.jobs.findIndex(j => j.id === job.id) 
      } : prev);
      
      await runJob(job);
    }

    // Check if all jobs completed
    setSession(prev => {
      if (!prev) return prev;
      const allCompleted = prev.jobs.every(j => j.status === 'completed' || j.status === 'skipped');
      const anyFailed = prev.jobs.some(j => j.status === 'failed');
      
      const finalStatus: SessionStatus = allCompleted ? 'completed' : (anyFailed ? 'failed' : prev.status);
      
      return { ...prev, status: finalStatus };
    });

    // Update session in database
    const updatedSession = session;
    if (updatedSession) {
      await supabase
        .from('analysis_sessions')
        .update({ 
          status: updatedSession.jobs.every(j => j.status === 'completed' || j.status === 'skipped') ? 'completed' : 'running',
          completed_at: new Date().toISOString(),
          total_duration_ms: updatedSession.totalDurationMs,
          total_cost_cents: updatedSession.totalCostCents,
        })
        .eq('id', sessionIdRef.current);
    }

    toast({ title: 'Analysis session completed' });
  }, [session, createSession, runJob, toast]);

  // Pause the session
  const pause = useCallback(async () => {
    isPausedRef.current = true;
    setSession(prev => prev ? { ...prev, status: 'paused' } : prev);
    
    if (sessionIdRef.current) {
      await supabase
        .from('analysis_sessions')
        .update({ status: 'paused' })
        .eq('id', sessionIdRef.current);
    }
    
    toast({ title: 'Analysis paused' });
  }, [toast]);

  // Resume the session
  const resume = useCallback(() => {
    start();
  }, [start]);

  // Skip a failed job
  const skipJob = useCallback(async (jobId: string) => {
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, status: 'skipped' as JobStatus } : j
        ),
      };
    });

    const job = session?.jobs.find(j => j.id === jobId);
    if (job && sessionIdRef.current) {
      await supabase
        .from('analysis_jobs')
        .update({ status: 'skipped' })
        .eq('session_id', sessionIdRef.current)
        .eq('analysis_type', job.type);
    }

    toast({ title: 'Job skipped' });
  }, [session, toast]);

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    const job = session?.jobs.find(j => j.id === jobId);
    if (!job) return;

    // Reset job status
    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'running',
        jobs: prev.jobs.map(j => 
          j.id === jobId ? { ...j, status: 'pending' as JobStatus, errorMessage: undefined } : j
        ),
      };
    });

    isPausedRef.current = false;
    await runJob(job);
  }, [session, runJob]);

  // Reset the session
  const reset = useCallback(() => {
    setSession(null);
    sessionIdRef.current = null;
    isPausedRef.current = false;
    setElapsedTime(0);
    setCurrentCostEstimate(0);
  }, []);

  return {
    session,
    elapsedTime,
    currentCostEstimate,
    start,
    pause,
    resume,
    skipJob,
    retryJob,
    reset,
    isRunning: session?.status === 'running',
    isPaused: session?.status === 'paused',
    isCompleted: session?.status === 'completed',
  };
}
