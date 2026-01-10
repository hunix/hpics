import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FaceScanJob {
  id: string;
  user_id: string;
  job_type: 'detect_local' | 'detect_mosaic' | 'crop_faces' | 'analyze_faces' | 'match_faces' | 'full_pipeline';
  model_key: string | null;
  scan_mode: 'all' | 'tagged_only' | 'untagged_only';
  auto_tag_threshold: number;
  confirm_threshold: number;
  media_ids: string[] | null;
  profile_ids: string[] | null;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  skipped_items: number;
  processed_media_ids: string[];
  failed_media_ids: Array<{ mediaId: string; error: string; attempts: number }>;
  current_batch_index: number;
  faces_detected: number;
  faces_matched: number;
  faces_auto_tagged: number;
  faces_pending_review: number;
  estimated_cost_cents: number | null;
  actual_cost_cents: number;
  tokens_used: number;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  last_progress_at: string | null;
  last_error: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  job_type: FaceScanJob['job_type'];
  model_key?: string;
  scan_mode?: FaceScanJob['scan_mode'];
  auto_tag_threshold?: number;
  confirm_threshold?: number;
  media_ids?: string[];
  profile_ids?: string[];
  estimated_cost_cents?: number;
}

async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function useFaceScanJob(jobId?: string) {
  const queryClient = useQueryClient();

  // Fetch a specific job
  const { data: job, isLoading, error, refetch } = useQuery({
    queryKey: ['face-scan-job', jobId],
    queryFn: async () => {
      const user = await getUser();
      if (!jobId || !user) return null;

      const { data, error } = await supabase
        .from('face_scan_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as unknown as FaceScanJob;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      // Auto-refetch while job is running
      const job = query.state.data;
      if (job && ['running', 'pending'].includes(job.status)) {
        return 2000; // Refetch every 2 seconds
      }
      return false;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!jobId) return;

    const channel = supabase
      .channel(`face-scan-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'face_scan_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          queryClient.setQueryData(['face-scan-job', jobId], payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, queryClient]);

  // Create a new job
  const createJob = useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_scan_jobs')
        .insert({
          user_id: user.id,
          job_type: input.job_type,
          model_key: input.model_key || null,
          scan_mode: input.scan_mode || 'all',
          auto_tag_threshold: input.auto_tag_threshold ?? 0.85,
          confirm_threshold: input.confirm_threshold ?? 0.60,
          media_ids: input.media_ids || null,
          profile_ids: input.profile_ids || null,
          estimated_cost_cents: input.estimated_cost_cents || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FaceScanJob;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-jobs'] });
      toast.success('Job created');
      return data;
    },
    onError: (error) => {
      console.error('Failed to create job:', error);
      toast.error('Failed to create job');
    },
  });

  // Start a job
  const startJob = useMutation({
    mutationFn: async (jobIdToStart: string) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      // Update status to running
      const { data, error } = await supabase
        .from('face_scan_jobs')
        .update({
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .eq('id', jobIdToStart)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Trigger the edge function to process the job
      const { error: fnError } = await supabase.functions.invoke('execute-face-scan-job', {
        body: { jobId: jobIdToStart },
      });

      if (fnError) {
        // Revert status if edge function fails
        await supabase
          .from('face_scan_jobs')
          .update({ status: 'pending', started_at: null })
          .eq('id', jobIdToStart);
        throw fnError;
      }

      return data as unknown as FaceScanJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-job', jobId] });
      toast.success('Job started');
    },
    onError: (error) => {
      console.error('Failed to start job:', error);
      toast.error('Failed to start job');
    },
  });

  // Pause a job
  const pauseJob = useMutation({
    mutationFn: async (jobIdToPause: string) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_scan_jobs')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
        })
        .eq('id', jobIdToPause)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FaceScanJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-job', jobId] });
      toast.success('Job paused');
    },
    onError: (error) => {
      console.error('Failed to pause job:', error);
      toast.error('Failed to pause job');
    },
  });

  // Resume a job
  const resumeJob = useMutation({
    mutationFn: async (jobIdToResume: string) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      // Update status to running
      const { data, error } = await supabase
        .from('face_scan_jobs')
        .update({
          status: 'running',
          paused_at: null,
        })
        .eq('id', jobIdToResume)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Trigger the edge function to continue processing
      const { error: fnError } = await supabase.functions.invoke('execute-face-scan-job', {
        body: { jobId: jobIdToResume, resume: true },
      });

      if (fnError) {
        await supabase
          .from('face_scan_jobs')
          .update({ status: 'paused' })
          .eq('id', jobIdToResume);
        throw fnError;
      }

      return data as unknown as FaceScanJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-job', jobId] });
      toast.success('Job resumed');
    },
    onError: (error) => {
      console.error('Failed to resume job:', error);
      toast.error('Failed to resume job');
    },
  });

  // Retry failed items
  const retryFailed = useMutation({
    mutationFn: async (jobIdToRetry: string) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_scan_jobs')
        .update({
          status: 'running',
          retry_count: (job?.retry_count || 0) + 1,
        })
        .eq('id', jobIdToRetry)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Trigger the edge function to retry failed items
      const { error: fnError } = await supabase.functions.invoke('execute-face-scan-job', {
        body: { jobId: jobIdToRetry, retryFailedOnly: true },
      });

      if (fnError) throw fnError;

      return data as unknown as FaceScanJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-job', jobId] });
      toast.success('Retrying failed items');
    },
    onError: (error) => {
      console.error('Failed to retry:', error);
      toast.error('Failed to retry');
    },
  });

  // Cancel a job
  const cancelJob = useMutation({
    mutationFn: async (jobIdToCancel: string) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('face_scan_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobIdToCancel)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as FaceScanJob;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['face-scan-jobs'] });
      toast.success('Job cancelled');
    },
    onError: (error) => {
      console.error('Failed to cancel job:', error);
      toast.error('Failed to cancel job');
    },
  });

  // Delete a job
  const deleteJob = useMutation({
    mutationFn: async ({ jobIdToDelete, deleteData = false }: { jobIdToDelete: string; deleteData?: boolean }) => {
      const user = await getUser();
      if (!user) throw new Error('Not authenticated');

      if (deleteData) {
        // Delete face regions created by this job
        await supabase
          .from('face_regions')
          .delete()
          .eq('job_id', jobIdToDelete)
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('face_scan_jobs')
        .delete()
        .eq('id', jobIdToDelete)
        .eq('user_id', user.id);

      if (error) throw error;
      return jobIdToDelete;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['face-scan-jobs'] });
      toast.success('Job deleted');
    },
    onError: (error) => {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job');
    },
  });

  return {
    job,
    isLoading,
    error,
    refetch,
    createJob,
    startJob,
    pauseJob,
    resumeJob,
    retryFailed,
    cancelJob,
    deleteJob,
  };
}

// Hook for fetching all jobs
export function useFaceScanJobs(options?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['face-scan-jobs', options],
    queryFn: async () => {
      const user = await getUser();
      if (!user) return [];

      let query = supabase
        .from('face_scan_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as FaceScanJob[];
    },
  });
}
