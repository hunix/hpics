import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Database, Play, Pause, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface EnrichmentJob {
  id: string;
  profileId: string;
  profileName: string;
  jobType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt: Date | null;
  sources: string[];
}

export function EnrichmentOrchestrationPanel() {
  const queryClient = useQueryClient();

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['enrichment-jobs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { jobs: [], stats: { pending: 0, processing: 0, completed: 0, failed: 0 } };

      const { data: jobs } = await supabase
        .from('enrichment_jobs')
        .select('*, profiles(first_name, last_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const jobList = (jobs || []).map((j: any) => ({
        id: j.id,
        profileId: j.profile_id,
        profileName: j.profiles ? `${j.profiles.first_name || ''} ${j.profiles.last_name || ''}`.trim() : 'Unknown',
        jobType: j.job_type,
        status: j.status,
        progress: j.status === 'completed' ? 100 : j.status === 'processing' ? 50 : 0,
        createdAt: new Date(j.created_at),
        completedAt: j.completed_at ? new Date(j.completed_at) : null,
        sources: j.source_config?.sources || []
      }));

      const stats = {
        pending: jobList.filter(j => j.status === 'pending').length,
        processing: jobList.filter(j => j.status === 'processing').length,
        completed: jobList.filter(j => j.status === 'completed').length,
        failed: jobList.filter(j => j.status === 'failed').length
      };

      return { jobs: jobList, stats };
    },
    refetchInterval: 5000
  });

  const startBatchEnrichment = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get profiles that haven't been enriched recently
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: true })
        .limit(10);

      if (!profiles || profiles.length === 0) {
        throw new Error('No profiles to enrich');
      }

      const results = await Promise.allSettled(
        profiles.map(p => 
          supabase.functions.invoke('enrichment-orchestrator', {
            body: { profileId: p.id, sources: ['web', 'social', 'osint'] }
          })
        )
      );

      return results.filter(r => r.status === 'fulfilled').length;
    },
    onSuccess: (count) => {
      toast.success(`Started ${count} enrichment jobs`);
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to start enrichment');
    }
  });

  const retryJob = useMutation({
    mutationFn: async (jobId: string) => {
      const job = jobsData?.jobs.find(j => j.id === jobId);
      if (!job) throw new Error('Job not found');

      await supabase.functions.invoke('enrichment-orchestrator', {
        body: { profileId: job.profileId, sources: job.sources }
      });
    },
    onSuccess: () => {
      toast.success('Job restarted');
      queryClient.invalidateQueries({ queryKey: ['enrichment-jobs'] });
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };
    return variants[status] || 'outline';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { jobs, stats } = jobsData || { jobs: [], stats: { pending: 0, processing: 0, completed: 0, failed: 0 } };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Enrichment Orchestration
        </CardTitle>
        <Button
          size="sm"
          onClick={() => startBatchEnrichment.mutate()}
          disabled={startBatchEnrichment.isPending}
        >
          <Play className="h-4 w-4 mr-1" />
          Start Batch
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-muted/50 rounded">
            <div className="text-lg font-bold text-muted-foreground">{stats.pending}</div>
            <div className="text-xs">Pending</div>
          </div>
          <div className="text-center p-2 bg-blue-500/10 rounded">
            <div className="text-lg font-bold text-blue-500">{stats.processing}</div>
            <div className="text-xs">Processing</div>
          </div>
          <div className="text-center p-2 bg-green-500/10 rounded">
            <div className="text-lg font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs">Completed</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded">
            <div className="text-lg font-bold text-red-500">{stats.failed}</div>
            <div className="text-xs">Failed</div>
          </div>
        </div>

        {/* Job List */}
        <ScrollArea className="h-[280px]">
          <div className="space-y-2">
            {jobs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No enrichment jobs yet
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {getStatusIcon(job.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{job.profileName}</span>
                      <Badge variant={getStatusBadge(job.status)} className="text-xs">
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {job.jobType} · {formatDistanceToNow(job.createdAt, { addSuffix: true })}
                    </div>
                    {job.status === 'processing' && (
                      <Progress value={job.progress} className="h-1 mt-1" />
                    )}
                  </div>
                  {job.status === 'failed' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => retryJob.mutate(job.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
