import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  Database, 
  Brain, 
  Search, 
  Shield,
  Network,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ScanFace,
  Grid3X3
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MosaicBatchScanner } from '@/components/biometrics/MosaicBatchScanner';

interface BatchJob {
  id: string;
  job_type: string;
  status: string;
  total_items: number | null;
  processed_items: number;
  failed_items: number;
  error_message: string | null;
  estimated_cost_cents: number | null;
  actual_cost_cents: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface DataStats {
  totalMessages: number;
  totalMedia: number;
  totalProfiles: number;
  embeddingsWithVectors: number;
  behavioralPredictions: number;
  relationshipScores: number;
  osintFindings: number;
  threatAssessments: number;
  biometricSamples: number;
  churnPredictions: number;
}

const JOB_TYPES = [
  {
    id: 'embeddings',
    label: 'Generate Embeddings',
    description: 'Create semantic vectors for all messages and documents',
    icon: Database,
    color: 'text-blue-500',
    costPerItem: 0.01,
  },
  {
    id: 'relationship_scores',
    label: 'Calculate Relationship Scores',
    description: 'Score all contact relationships based on interaction patterns',
    icon: TrendingUp,
    color: 'text-green-500',
    costPerItem: 0.02,
  },
  {
    id: 'behavioral_predictions',
    label: 'Train Behavioral Models',
    description: 'Generate behavioral predictions for all contacts',
    icon: Brain,
    color: 'text-purple-500',
    costPerItem: 0.05,
  },
  {
    id: 'osint_scan',
    label: 'OSINT Enrichment',
    description: 'Scan public data sources for all contacts',
    icon: Search,
    color: 'text-orange-500',
    costPerItem: 0.10,
  },
  {
    id: 'threat_assessment',
    label: 'Threat Assessment',
    description: 'Run security analysis on all contacts',
    icon: Shield,
    color: 'text-red-500',
    costPerItem: 0.08,
  },
  {
    id: 'relationship_inference',
    label: 'Infer Relationships',
    description: 'Discover hidden connections between contacts',
    icon: Network,
    color: 'text-cyan-500',
    costPerItem: 0.03,
  },
  {
    id: 'biometric_extraction',
    label: 'Extract Biometrics',
    description: 'Extract facial & voice biometrics from all media',
    icon: Database,
    color: 'text-pink-500',
    costPerItem: 0.04,
  },
  {
    id: 'churn_prediction',
    label: 'Predict Churn Risk',
    description: 'Analyze relationship health and predict churn for all contacts',
    icon: TrendingUp,
    color: 'text-amber-500',
    costPerItem: 0.03,
  },
];

export function BackfillJobsManager() {
  const queryClient = useQueryClient();
  const [selectedJobType, setSelectedJobType] = useState<string | null>(null);

  // Fetch data statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['backfill-stats'],
    queryFn: async (): Promise<DataStats> => {
      const [
        messagesRes,
        mediaRes,
        profilesRes,
        embeddingsRes,
        predictionsRes,
        scoresRes,
        osintRes,
        threatRes,
        biometricRes,
        churnRes,
      ] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('media').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('document_embeddings').select('id', { count: 'exact', head: true }).not('embedding', 'is', null),
        supabase.from('behavioral_predictions').select('id', { count: 'exact', head: true }),
        supabase.from('relationship_scores').select('id', { count: 'exact', head: true }),
        supabase.from('osint_findings').select('id', { count: 'exact', head: true }),
        supabase.from('threat_assessments').select('id', { count: 'exact', head: true }),
        supabase.from('biometric_samples').select('id', { count: 'exact', head: true }),
        supabase.from('churn_predictions').select('id', { count: 'exact', head: true }),
      ]);

      return {
        totalMessages: messagesRes.count ?? 0,
        totalMedia: mediaRes.count ?? 0,
        totalProfiles: profilesRes.count ?? 0,
        embeddingsWithVectors: embeddingsRes.count ?? 0,
        behavioralPredictions: predictionsRes.count ?? 0,
        relationshipScores: scoresRes.count ?? 0,
        osintFindings: osintRes.count ?? 0,
        threatAssessments: threatRes.count ?? 0,
        biometricSamples: biometricRes.count ?? 0,
        churnPredictions: churnRes.count ?? 0,
      };
    },
    refetchInterval: 10000,
  });

  // Fetch active jobs
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as BatchJob[];
    },
    refetchInterval: 5000,
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: async (jobType: string) => {
      const { data, error } = await supabase.functions.invoke('batch-intelligence-init', {
        body: { jobType, action: 'start' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, jobType) => {
      toast.success(`Started ${jobType} backfill job`);
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
    },
    onError: (error) => {
      toast.error(`Failed to start job: ${error.message}`);
    },
  });

  // Cancel job mutation
  const cancelJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { data, error } = await supabase.functions.invoke('batch-intelligence-init', {
        body: { jobId, action: 'cancel' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
    },
    onError: (error) => {
      toast.error(`Failed to cancel job: ${error.message}`);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const calculateEstimatedCost = (jobType: string) => {
    if (!stats) return 0;
    const job = JOB_TYPES.find(j => j.id === jobType);
    if (!job) return 0;

    let itemCount = 0;
    switch (jobType) {
      case 'embeddings':
        itemCount = stats.totalMessages + stats.totalMedia - stats.embeddingsWithVectors;
        break;
      case 'relationship_scores':
      case 'behavioral_predictions':
      case 'osint_scan':
      case 'threat_assessment':
      case 'churn_prediction':
        itemCount = stats.totalProfiles;
        break;
      case 'relationship_inference':
        itemCount = Math.floor(stats.totalProfiles * 1.5); // Estimate pairs
        break;
      case 'biometric_extraction':
        itemCount = stats.totalMedia - stats.biometricSamples;
        break;
    }

    return Math.max(0, itemCount) * job.costPerItem;
  };

  const activeJob = jobs?.find(j => j.status === 'running');

  if (statsLoading || jobsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Intelligence Data Status
          </CardTitle>
          <CardDescription>
            Current state of AI-processed data across your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.embeddingsWithVectors.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Embeddings</div>
              <Progress 
                value={stats ? (stats.embeddingsWithVectors / Math.max(1, stats.totalMessages + stats.totalMedia)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.relationshipScores.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Rel. Scores</div>
              <Progress 
                value={stats ? (stats.relationshipScores / Math.max(1, stats.totalProfiles)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.behavioralPredictions.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Predictions</div>
              <Progress 
                value={stats ? (stats.behavioralPredictions / Math.max(1, stats.totalProfiles)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.biometricSamples.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Biometrics</div>
              <Progress 
                value={stats ? (stats.biometricSamples / Math.max(1, stats.totalMedia)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.churnPredictions.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Churn Preds</div>
              <Progress 
                value={stats ? (stats.churnPredictions / Math.max(1, stats.totalProfiles)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats?.threatAssessments.toLocaleString() ?? 0}</div>
              <div className="text-sm text-muted-foreground">Threat Scans</div>
              <Progress 
                value={stats ? (stats.threatAssessments / Math.max(1, stats.totalProfiles)) * 100 : 0} 
                className="mt-2 h-1.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface for Job Types */}
      <Tabs defaultValue="standard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="standard" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Standard Jobs
          </TabsTrigger>
          <TabsTrigger value="mosaic" className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Mosaic Biometric Scan
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Job History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Backfill Job
              </CardTitle>
              <CardDescription>
                Initialize AI processing for your data. Each job processes items in batches with rate limiting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {JOB_TYPES.map((job) => {
                  const Icon = job.icon;
                  const estimatedCost = calculateEstimatedCost(job.id);
                  const isRunning = activeJob?.job_type === job.id;

                  return (
                    <div
                      key={job.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        selectedJobType === job.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${job.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{job.label}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {job.description}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            Est. cost: <span className="font-medium">${estimatedCost.toFixed(2)}</span>
                          </div>
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            disabled={!!activeJob || startJobMutation.isPending}
                            onClick={() => startJobMutation.mutate(job.id)}
                          >
                            {isRunning ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running...
                              </>
                            ) : startJobMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Start
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mosaic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="h-5 w-5" />
                Mosaic Batch Biometric Scan
              </CardTitle>
              <CardDescription>
                Process multiple images in a single AI call using mosaic technology. Up to 96% more cost-efficient than individual scans.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MosaicBatchScanner />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {/* Active & Recent Jobs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Job History
              </CardTitle>
              <CardDescription>
                Monitor running and completed backfill operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const progress = job.total_items 
                      ? Math.round((job.processed_items / job.total_items) * 100) 
                      : 0;

                    return (
                      <div
                        key={job.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(job.status)}
                            <div>
                              <div className="font-medium capitalize">
                                {job.job_type.replace(/_/g, ' ')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {job.started_at 
                                  ? `Started ${formatDistanceToNow(new Date(job.started_at))} ago`
                                  : `Created ${formatDistanceToNow(new Date(job.created_at))} ago`
                                }
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(job.status)}
                            {job.status === 'running' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelJobMutation.mutate(job.id)}
                                disabled={cancelJobMutation.isPending}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {job.status === 'running' && job.total_items && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>{job.processed_items.toLocaleString()} / {job.total_items.toLocaleString()}</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}

                        {job.status === 'completed' && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            Processed {job.processed_items.toLocaleString()} items
                            {job.failed_items > 0 && ` (${job.failed_items} failed)`}
                            {job.actual_cost_cents > 0 && ` • Cost: $${(job.actual_cost_cents / 100).toFixed(2)}`}
                          </div>
                        )}

                        {job.error_message && (
                          <div className="mt-2 text-sm text-destructive">
                            {job.error_message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No jobs yet. Start a backfill job above to populate your intelligence data.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
