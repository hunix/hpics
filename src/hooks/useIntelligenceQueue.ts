// Hook for managing intelligence processing queue with validation
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type JobType = 
  | 'embed_content'
  | 'extract_entities'
  | 'detect_patterns'
  | 'generate_insights'
  | 'process_voice'
  | 'sync_device'
  | 'refresh_embeddings';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface QueueJob {
  id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  priority: number;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  error_message?: string;
  scheduled_for: string;
  created_at: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export function useIntelligenceQueue() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobs = useCallback(async (limit = 50) => {
    if (!user?.id) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('intelligence_queue')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setJobs(data as QueueJob[]);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchStats = useCallback(async () => {
    if (!user?.id) return;

    const statuses = ['pending', 'processing', 'completed', 'failed'] as const;
    const counts: Partial<QueueStats> = {};

    await Promise.all(
      statuses.map(async (status) => {
        const { count } = await supabase
          .from('intelligence_queue')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', status);
        
        counts[status] = count || 0;
      })
    );

    const total = Object.values(counts).reduce((a, b) => (a || 0) + (b || 0), 0);
    
    setStats({
      pending: counts.pending || 0,
      processing: counts.processing || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      total,
    });
  }, [user?.id]);

  const addJob = useCallback(async (
    jobType: JobType,
    payload: Record<string, unknown>,
    options: { priority?: number; scheduledFor?: Date } = {}
  ): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Authentication required');
      return null;
    }

    try {
      const jobPayload = JSON.parse(JSON.stringify(payload));
      
      const { data, error } = await supabase
        .from('intelligence_queue')
        .insert([{
          user_id: user.id,
          job_type: jobType,
          payload: jobPayload,
          priority: options.priority || 5,
          scheduled_for: options.scheduledFor?.toISOString() || new Date().toISOString(),
          status: 'pending' as const,
          attempts: 0,
          max_attempts: 3,
        }])
        .select('id')
        .single();

      if (error) throw error;
      
      toast.success('Job queued successfully');
      fetchJobs();
      fetchStats();
      return data?.id || null;
    } catch (err) {
      toast.error('Failed to queue job');
      return null;
    }
  }, [user?.id, fetchJobs, fetchStats]);

  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('intelligence_queue')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;
      
      toast.success('Job cancelled');
      fetchJobs();
      fetchStats();
      return true;
    } catch {
      return false;
    }
  }, [user?.id, fetchJobs, fetchStats]);

  const retryJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('intelligence_queue')
        .update({ 
          status: 'pending',
          attempts: 0,
          error_message: null,
        })
        .eq('id', jobId)
        .eq('user_id', user.id)
        .eq('status', 'failed');

      if (error) throw error;
      
      toast.success('Job queued for retry');
      fetchJobs();
      fetchStats();
      return true;
    } catch {
      return false;
    }
  }, [user?.id, fetchJobs, fetchStats]);

  const clearCompleted = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    await supabase
      .from('intelligence_queue')
      .delete()
      .eq('user_id', user.id)
      .in('status', ['completed', 'cancelled']);

    toast.success('Cleared completed jobs');
    fetchJobs();
    fetchStats();
  }, [user?.id, fetchJobs, fetchStats]);

  return {
    jobs,
    stats,
    isLoading,
    fetchJobs,
    fetchStats,
    addJob,
    cancelJob,
    retryJob,
    clearCompleted,
  };
}
