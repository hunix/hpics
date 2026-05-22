import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ScanFace,
  Users,
  AlertTriangle,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { useFaceScanJob, useFaceScanJobs, FaceScanJob } from '@/hooks/useFaceScanJob';
import { formatDistanceToNow } from 'date-fns';

interface FaceScanJobMonitorProps {
  jobId: string;
  onClose?: () => void;
}

export function FaceScanJobMonitor({ jobId, onClose }: FaceScanJobMonitorProps) {
  const {
    job,
    isLoading,
    pauseJob,
    resumeJob,
    retryFailed,
    cancelJob,
    deleteJob,
  } = useFaceScanJob(jobId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!job) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Job not found</p>
        </CardContent>
      </Card>
    );
  }

  const progress = job.total_items > 0 
    ? (job.processed_items / job.total_items) * 100 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'paused': return 'bg-amber-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const canPause = job.status === 'running';
  const canResume = job.status === 'paused';
  const canRetry = job.failed_items > 0 && ['paused', 'completed', 'failed'].includes(job.status);
  const canCancel = ['running', 'paused', 'pending'].includes(job.status);
  const canDelete = ['completed', 'failed', 'cancelled'].includes(job.status);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ScanFace className="h-5 w-5" />
              {job.job_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </CardTitle>
            <CardDescription>
              Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(job.status)} text-white`}>
              {getStatusIcon(job.status)}
              <span className="ml-1 capitalize">{job.status}</span>
            </Badge>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {job.processed_items.toLocaleString()} / {job.total_items.toLocaleString()}
              {' '}({Math.round(progress)}%)
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-green-500/10 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xl font-bold">{job.successful_items}</span>
            </div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div className="p-3 bg-red-500/10 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-xl font-bold">{job.failed_items}</span>
            </div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <ScanFace className="h-4 w-4" />
              <span className="text-xl font-bold">{job.faces_detected}</span>
            </div>
            <div className="text-xs text-muted-foreground">Detected</div>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 text-purple-600">
              <Users className="h-4 w-4" />
              <span className="text-xl font-bold">{job.faces_matched}</span>
            </div>
            <div className="text-xs text-muted-foreground">Matched</div>
          </div>
        </div>

        {/* Additional stats */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-muted-foreground">Auto-tagged</span>
            <span className="font-medium">{job.faces_auto_tagged}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-muted-foreground">Pending review</span>
            <span className="font-medium">{job.faces_pending_review}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-muted-foreground">Skipped</span>
            <span className="font-medium">{job.skipped_items}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-muted rounded">
            <span className="text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Cost
            </span>
            <span className="font-medium">
              ${((job.actual_cost_cents || 0) / 100).toFixed(4)}
            </span>
          </div>
        </div>

        {/* Timing info */}
        {job.started_at && (
          <div className="text-sm text-muted-foreground">
            Started {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
            {job.completed_at && (
              <> • Completed {formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })}</>
            )}
            {job.last_progress_at && job.status === 'running' && (
              <> • Last update {formatDistanceToNow(new Date(job.last_progress_at), { addSuffix: true })}</>
            )}
          </div>
        )}

        {/* Error display */}
        {job.last_error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="text-red-600">Last Error</strong>
                <p className="text-muted-foreground">{job.last_error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Failed items list */}
        {job.failed_media_ids && job.failed_media_ids.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Failed Items ({job.failed_media_ids.length})</h4>
            <ScrollArea className="h-32 border rounded-lg p-2">
              {job.failed_media_ids.map((item: { mediaId: string; error: string; attempts: number }, index: number) => (
                <div key={index} className="text-xs py-1 border-b last:border-0">
                  <code className="text-muted-foreground">{item.mediaId.slice(0, 8)}...</code>
                  <span className="mx-2">-</span>
                  <span className="text-red-600">{item.error}</span>
                  <span className="text-muted-foreground ml-2">({item.attempts} attempts)</span>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {canPause && (
            <Button
              variant="outline"
              onClick={() => pauseJob.mutate(jobId)}
              disabled={pauseJob.isPending}
            >
              {pauseJob.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pause
            </Button>
          )}

          {canResume && (
            <Button
              onClick={() => resumeJob.mutate(jobId)}
              disabled={resumeJob.isPending}
            >
              {resumeJob.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Resume
            </Button>
          )}

          {canRetry && (
            <Button
              variant="outline"
              onClick={() => retryFailed.mutate(jobId)}
              disabled={retryFailed.isPending}
            >
              {retryFailed.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Retry Failed ({job.failed_items})
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={() => cancelJob.mutate(jobId)}
              disabled={cancelJob.isPending}
            >
              {cancelJob.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Cancel
            </Button>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => deleteJob.mutate({ jobIdToDelete: jobId })}
              disabled={deleteJob.isPending}
            >
              {deleteJob.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          )}
        </div>

        {/* Persistence note */}
        <p className="text-xs text-muted-foreground text-center">
          ✓ All progress is saved automatically. Jobs can be paused, resumed, or retried at any time.
        </p>
      </CardContent>
    </Card>
  );
}

// List view of all jobs
interface FaceScanJobListProps {
  onSelectJob?: (jobId: string) => void;
}

export function FaceScanJobList({ onSelectJob }: FaceScanJobListProps) {
  const { data: jobs, isLoading } = useFaceScanJobs({ limit: 20 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ScanFace className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No face scan jobs yet</p>
        <p className="text-sm">Create a job to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job: FaceScanJob) => {
        const progress = job.total_items > 0 
          ? (job.processed_items / job.total_items) * 100 
          : 0;

        return (
          <div
            key={job.id}
            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelectJob?.(job.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {job.job_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <Badge variant={job.status === 'running' ? 'default' : 'secondary'} className="text-xs">
                {job.status}
              </Badge>
            </div>
            <Progress value={progress} className="h-1 mb-1" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{job.processed_items} / {job.total_items}</span>
              <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
