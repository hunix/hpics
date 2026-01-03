import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCentsToUSD } from '@/lib/aiPricing';
import { 
  AnalysisSession, 
  AnalysisJob, 
  JobStatus 
} from '@/hooks/useAnalysisSession';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Brain,
  Eye,
  Hand,
  AudioLines,
  DollarSign,
  Timer
} from 'lucide-react';

interface AnalysisMonitorProps {
  session: AnalysisSession | null;
  elapsedTime: number;
  currentCostEstimate: number;
  isRunning: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onSkipJob: (jobId: string) => void;
  onRetryJob: (jobId: string) => void;
  onReset: () => void;
}

const getJobIcon = (type: string) => {
  switch (type) {
    case 'behavioral': return Brain;
    case 'facial': return Eye;
    case 'body_language': return Hand;
    case 'vocal': return AudioLines;
    default: return Brain;
  }
};

const getStatusColor = (status: JobStatus): string => {
  switch (status) {
    case 'completed': return 'bg-green-500';
    case 'running': return 'bg-blue-500';
    case 'failed': return 'bg-red-500';
    case 'skipped': return 'bg-yellow-500';
    case 'paused': return 'bg-orange-500';
    default: return 'bg-muted';
  }
};

const getStatusIcon = (status: JobStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'running': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    case 'skipped': return <SkipForward className="h-4 w-4 text-yellow-500" />;
    case 'paused': return <Pause className="h-4 w-4 text-orange-500" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function AnalysisMonitor({
  session,
  elapsedTime,
  currentCostEstimate,
  isRunning,
  isPaused,
  onStart,
  onPause,
  onResume,
  onSkipJob,
  onRetryJob,
  onReset,
}: AnalysisMonitorProps) {
  if (!session) {
    return null;
  }

  const completedJobs = session.jobs.filter(j => j.status === 'completed').length;
  const totalJobs = session.jobs.length;
  const overallProgress = (completedJobs / totalJobs) * 100;
  const totalActualCost = session.jobs.reduce((sum, j) => sum + j.actualCostCents, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Analysis Monitor
            </CardTitle>
            <CardDescription>
              Real-time tracking of your analysis session
            </CardDescription>
          </div>
          <Badge variant={
            session.status === 'completed' ? 'default' :
            session.status === 'running' ? 'secondary' :
            session.status === 'paused' ? 'outline' :
            'destructive'
          }>
            {session.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer and Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              Elapsed Time
            </div>
            <p className="text-2xl font-mono font-bold">{formatTime(elapsedTime)}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              Cost
            </div>
            <p className="text-lg font-mono">
              <span className="font-bold">{formatCentsToUSD(totalActualCost)}</span>
              <span className="text-muted-foreground text-sm"> / {formatCentsToUSD(currentCostEstimate)} est.</span>
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{completedJobs}/{totalJobs} completed</span>
          </div>
          <Progress value={overallProgress} />
        </div>

        {/* Job List */}
        <div className="space-y-2">
          {session.jobs.map((job) => {
            const Icon = getJobIcon(job.type);
            return (
              <div 
                key={job.id} 
                className={`p-3 rounded-lg border ${
                  job.status === 'running' ? 'border-primary bg-primary/5' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getStatusColor(job.status)}/20`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {job.type.replace('_', ' ')} Analysis
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.modelKey}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {job.status === 'running' && (
                      <span className="text-xs text-muted-foreground">
                        {formatCentsToUSD(job.estimatedCostCents)} est.
                      </span>
                    )}
                    {job.status === 'completed' && (
                      <span className="text-xs text-green-600">
                        {formatCentsToUSD(job.actualCostCents)}
                      </span>
                    )}
                    {getStatusIcon(job.status)}
                    
                    {/* Action buttons for failed jobs */}
                    {job.status === 'failed' && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRetryJob(job.id)}
                          title="Retry"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onSkipJob(job.id)}
                          title="Skip"
                        >
                          <SkipForward className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Error message */}
                {job.errorMessage && (
                  <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-600 flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {job.errorMessage}
                  </div>
                )}
                
                {/* Progress bar for running jobs */}
                {job.status === 'running' && (
                  <div className="mt-2">
                    <Progress value={job.progress} className="h-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRunning && !isPaused && session.status !== 'completed' && (
            <Button onClick={onStart} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
          )}
          
          {isRunning && (
            <Button onClick={onPause} variant="outline" className="flex-1">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          )}
          
          {isPaused && (
            <Button onClick={onResume} className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
          )}
          
          {(session.status === 'completed' || session.status === 'failed') && (
            <Button onClick={onReset} variant="outline" className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              New Session
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
