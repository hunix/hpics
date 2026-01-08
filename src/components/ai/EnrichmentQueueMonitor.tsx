import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Play, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  MessageSquare,
  Eye,
  FileText,
  User,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface QueueItem {
  id: string;
  enrichment_type: string;
  source_type: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  profile_id: string | null;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

const itemTypeConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  message: { icon: MessageSquare, label: "Message", color: "bg-blue-500/10 text-blue-500" },
  observation: { icon: Eye, label: "Observation", color: "bg-purple-500/10 text-purple-500" },
  document: { icon: FileText, label: "Document", color: "bg-green-500/10 text-green-500" },
  osint: { icon: Search, label: "OSINT", color: "bg-orange-500/10 text-orange-500" },
  profile: { icon: User, label: "Profile", color: "bg-cyan-500/10 text-cyan-500" },
  embedding: { icon: Loader2, label: "Embedding", color: "bg-indigo-500/10 text-indigo-500" }
};

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-muted-foreground" },
  processing: { icon: Loader2, color: "text-yellow-500" },
  completed: { icon: CheckCircle2, color: "text-green-500" },
  failed: { icon: XCircle, color: "text-destructive" }
};

export function EnrichmentQueueMonitor() {
  const queryClient = useQueryClient();

  const { data: queueItems, isLoading } = useQuery({
    queryKey: ['enrichment-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrichment_queue')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as QueueItem[];
    },
    refetchInterval: 10000
  });

  const { data: stats } = useQuery({
    queryKey: ['enrichment-queue-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrichment_queue')
        .select('status');
      
      if (error) throw error;
      
      const stats: QueueStats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: data?.length || 0
      };
      
      data?.forEach(item => {
        if (item.status in stats) {
          stats[item.status as keyof Omit<QueueStats, 'total'>]++;
        }
      });
      
      return stats;
    },
    refetchInterval: 10000
  });

  const processNowMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-enrichment-queue', {
        body: { manual: true }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Processing queue`, {
        description: `${data?.processed || 0} items processed`
      });
      queryClient.invalidateQueries({ queryKey: ['enrichment-queue'] });
      queryClient.invalidateQueries({ queryKey: ['enrichment-queue-stats'] });
    },
    onError: (error) => {
      toast.error("Failed to process queue", {
        description: error.message
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const completionRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Enrichment Queue
          </CardTitle>
          <CardDescription>
            AI processing queue for messages, observations, and profiles
          </CardDescription>
        </div>
        <Button
          onClick={() => processNowMutation.mutate()}
          disabled={processNowMutation.isPending || (stats?.pending || 0) === 0}
          size="sm"
        >
          {processNowMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Process Now
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-muted-foreground">{stats?.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{stats?.processing || 0}</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>

        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Queue Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Queue Items</h4>
          <ScrollArea className="h-64">
            <div className="space-y-2 pr-4">
              {queueItems?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Queue is empty</p>
                </div>
              ) : (
                queueItems?.map((item) => {
                  const typeConfig = itemTypeConfig[item.enrichment_type] || itemTypeConfig.profile;
                  const StatusIcon = statusConfig[item.status]?.icon || Clock;
                  const TypeIcon = typeConfig.icon;
                  
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${typeConfig.color}`}>
                        <TypeIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{typeConfig.label}</span>
                          <Badge variant="outline" className="text-xs">
                            P{item.priority}
                          </Badge>
                          {item.attempts > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Attempt {item.attempts}/{item.max_attempts}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.source_type} • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </div>
                        {item.error_message && (
                          <div className="text-xs text-destructive truncate">
                            {item.error_message}
                          </div>
                        )}
                      </div>
                      <div className={statusConfig[item.status]?.color}>
                        <StatusIcon className={`h-4 w-4 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
