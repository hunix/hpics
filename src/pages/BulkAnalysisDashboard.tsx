import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  useBulkAnalysisSessions,
  useDeleteBulkSession,
  type BulkSession,
} from "@/hooks/bulk/useBulkAnalysisSessions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Pause, 
  Play,
  Trash2,
  RefreshCw,
  DollarSign,
  TrendingUp,
  FileStack,
  Users,
  Calendar
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { formatCost } from "@/lib/bulkAnalysisPrioritization";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  queued: "bg-blue-500/10 text-blue-500",
  running: "bg-primary/10 text-primary",
  paused: "bg-amber-500/10 text-amber-500",
  completed: "bg-green-500/10 text-green-500",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function BulkAnalysisDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const { data: sessions, isLoading } = useBulkAnalysisSessions();

  // Aggregate stats
  const stats = sessions ? {
    total: sessions.length,
    active: sessions.filter(s => ["running", "paused", "pending"].includes(s.status)).length,
    completed: sessions.filter(s => s.status === "completed").length,
    totalCost: sessions.reduce((sum, s) => sum + (s.current_cost_cents || 0), 0),
    totalItems: sessions.reduce((sum, s) => sum + (s.total_items || 0), 0),
    completedItems: sessions.reduce((sum, s) => sum + (s.completed_items || 0), 0),
  } : null;

  const deleteHook = useDeleteBulkSession();
  const deleteMutation = {
    mutate: (sessionId: string) =>
      deleteHook.mutate(sessionId, {
        onSuccess: () => toast.success("Session deleted"),
        onError: (error: Error) => toast.error(`Failed to delete: ${error.message}`),
      }),
  };

  // Resume session
  const handleResume = (sessionId: string) => {
    navigate(`/analysis?resume=${sessionId}`);
  };

  // Filter sessions by tab
  const filteredSessions = sessions?.filter(session => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return ["running", "paused", "pending"].includes(session.status);
    if (activeTab === "completed") return session.status === "completed";
    if (activeTab === "scheduled") return session.scheduled_for && session.status === "pending";
    return true;
  });

  return (
    <AppLayout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              Bulk Analysis Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage bulk analysis sessions
            </p>
          </div>
          <Button onClick={() => navigate("/analysis")}>
            <Play className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <FileStack className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Items Analyzed</p>
                    <p className="text-2xl font-bold">{stats.completedItems.toLocaleString()}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-bold">{formatCost(stats.totalCost)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Sessions</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions && filteredSessions.length > 0 ? (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredSessions.map((session) => {
                    const progress = session.total_items > 0 
                      ? ((session.completed_items + session.failed_items + session.skipped_items) / session.total_items) * 100
                      : 0;

                    return (
                      <div
                        key={session.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium truncate">
                                {session.name || `Session ${session.id.slice(0, 8)}`}
                              </h3>
                              <Badge className={statusColors[session.status]}>
                                {session.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                              </span>
                              {session.profile_ids && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.profile_ids.length} contact{session.profile_ids.length !== 1 ? 's' : ''}
                                </span>
                              )}
                              {session.scheduled_for && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Scheduled: {format(new Date(session.scheduled_for), "PPp")}
                                </span>
                              )}
                            </div>

                            {/* Progress */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span>
                                  {session.completed_items} / {session.total_items} items
                                  {session.failed_items > 0 && (
                                    <span className="text-destructive ml-1">
                                      ({session.failed_items} failed)
                                    </span>
                                  )}
                                </span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5" />
                            </div>

                            {/* Media types & modes */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.media_types?.map((type) => (
                                <Badge key={type} variant="outline" className="text-xs capitalize">
                                  {type}
                                </Badge>
                              ))}
                              {session.analysis_modes && session.analysis_modes.length > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {session.analysis_modes.length} modes
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Cost & Actions */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCost(session.current_cost_cents)}
                              </p>
                              {session.max_cost_cents && (
                                <p className="text-xs text-muted-foreground">
                                  of {formatCost(session.max_cost_cents)} budget
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {session.status === "paused" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResume(session.id)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Resume
                                </Button>
                              )}
                              {session.status === "completed" && session.aggregation_result && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/analysis?view=${session.id}`)}
                                >
                                  View Results
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(session.id)}
                                disabled={session.status === "running"}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileStack className="h-12 w-12 mb-4 opacity-50" />
                <p className="font-medium">No sessions found</p>
                <p className="text-sm">
                  {activeTab === "all" 
                    ? "Start a new bulk analysis to see sessions here"
                    : `No ${activeTab} sessions`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
