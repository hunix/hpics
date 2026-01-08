import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, FileText, MessageSquare, Eye, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byType: Record<string, number>;
}

export function EnrichmentQueueStatus() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['enrichment-queue-stats', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrichment_queue')
        .select('status, source_type')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const result: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byType: {},
      };

      data?.forEach((item) => {
        if (item.status === 'pending') result.pending++;
        else if (item.status === 'processing') result.processing++;
        else if (item.status === 'completed') result.completed++;
        else if (item.status === 'failed') result.failed++;

        result.byType[item.source_type] = (result.byType[item.source_type] || 0) + 1;
      });

      return result;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const processMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-enrichment-queue');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrichment-queue-stats'] });
      toast.success(`Processed ${data.processed} items (${data.successCount} success)`);
    },
    onError: (error) => {
      toast.error(`Failed to process queue: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const total = (stats?.pending || 0) + (stats?.processing || 0) + (stats?.completed || 0) + (stats?.failed || 0);
  const completionRate = total > 0 ? ((stats?.completed || 0) / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Auto-Enrichment Pipeline
          </CardTitle>
          <CardDescription>
            Automatic embedding generation for new content
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => processMutation.mutate()}
          disabled={processMutation.isPending || (stats?.pending || 0) === 0}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${processMutation.isPending ? 'animate-spin' : ''}`} />
          Process Queue
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <RefreshCw className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <div className="text-2xl font-bold">{stats?.processing || 0}</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-red-500" />
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span>{completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* By Source Type */}
        {stats?.byType && Object.keys(stats.byType).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">By Content Type</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {type === 'messages' && <MessageSquare className="h-3 w-3" />}
                  {type === 'documents' && <FileText className="h-3 w-3" />}
                  {type === 'contact_observations' && <Eye className="h-3 w-3" />}
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Active Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${(stats?.pending || 0) > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
          {(stats?.pending || 0) > 0 ? 'Pipeline has pending items' : 'Pipeline idle'}
        </div>
      </CardContent>
    </Card>
  );
}
