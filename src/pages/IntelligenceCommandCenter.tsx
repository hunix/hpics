import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Brain, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  Zap,
  Database,
  Shield,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { AnalysisEventStream } from "@/components/intelligence/AnalysisEventStream";
import { SystemHealthPanel } from "@/components/intelligence/SystemHealthPanel";
import { AggregateViewer } from "@/components/intelligence/AggregateViewer";
import { CaasProgressPanel } from "@/components/intelligence/CaasProgressPanel";
import { DataRetentionManager } from "@/components/intelligence/DataRetentionManager";
import { SourceAssetRegistry } from "@/components/intelligence/SourceAssetRegistry";
import { CrossModalCorrelationViewer } from "@/components/intelligence/CrossModalCorrelationViewer";

interface JobStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function IntelligenceCommandCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Fetch job statistics
  const { data: jobStats, isLoading: jobsLoading } = useQuery({
    queryKey: ["intelligence-jobs-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("orchestrator_jobs")
        .select("status")
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      const stats: JobStats = {
        total: data?.length || 0,
        pending: data?.filter(j => j.status === "registered" || j.status === "queued").length || 0,
        processing: data?.filter(j => j.status === "processing").length || 0,
        completed: data?.filter(j => j.status === "completed").length || 0,
        failed: data?.filter(j => j.status === "failed").length || 0,
      };
      
      return stats;
    },
    enabled: !!user?.id,
    refetchInterval: isAutoRefresh ? 5000 : false,
  });

  // Fetch recent events
  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["intelligence-recent-events", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("analysis_events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: isAutoRefresh ? 5000 : false,
  });

  // Fetch system health
  const { data: systemHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["intelligence-system-health", user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as Array<{ component: string; status: string | null; last_heartbeat: string | null; metrics: unknown }>;
      
       const { data, error } = await (supabase as any)
        .from("system_health")
        .select("component, status, last_heartbeat")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return ((data || []) as any[]).map((d: any) => ({ ...d, metrics: null }));
    },
    enabled: !!user?.id,
    refetchInterval: isAutoRefresh ? 10000 : false,
  });

  // Fetch aggregates summary
  const { data: aggregates, isLoading: aggregatesLoading } = useQuery({
    queryKey: ["intelligence-aggregates", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("analysis_aggregates")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "failed": return "bg-destructive/10 text-destructive border-destructive/20";
      case "queued": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-emerald-500";
      case "degraded": return "text-amber-500";
      case "down": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const completionRate = jobStats?.total 
    ? Math.round((jobStats.completed / jobStats.total) * 100) 
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Intelligence Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Centralized AI Analysis System - Real-time monitoring and control
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={isAutoRefresh ? "border-primary" : ""}
          >
            {isAutoRefresh ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["intelligence"] })}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {jobStats?.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {jobStats?.processing || 0}
            </div>
            <Progress 
              value={jobStats?.processing ? 100 : 0} 
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {completionRate}%
            </div>
            <Progress 
              value={completionRate} 
              className="h-1 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {jobStats?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Stream
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Health
          </TabsTrigger>
          <TabsTrigger value="aggregates" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Aggregates
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="fusion" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Fusion
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <AnalysisEventStream 
            events={recentEvents || []} 
            isLoading={eventsLoading}
          />
        </TabsContent>

        <TabsContent value="health" className="mt-4">
          <SystemHealthPanel 
            health={systemHealth || []} 
            isLoading={healthLoading}
          />
        </TabsContent>

        <TabsContent value="aggregates" className="mt-4">
          <AggregateViewer 
            aggregates={aggregates || []} 
            isLoading={aggregatesLoading}
          />
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <SourceAssetRegistry />
        </TabsContent>

        <TabsContent value="fusion" className="mt-4">
          <CrossModalCorrelationViewer />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <CaasProgressPanel />
            <DataRetentionManager />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
