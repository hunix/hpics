import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  FileText,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface DeletionRequest {
  id: string;
  deletion_scope: string;
  status: string | null;
  requested_at: string | null;
  processed_at: string | null;
  reason: string | null;
}

export function DataRetentionManager() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("pending");

  const { data: deletionRequests, isLoading } = useQuery({
    queryKey: ["deletion-requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("deletion_requests")
        .select("id, deletion_scope, status, requested_at, processed_at, reason")
        .eq("user_id", user.id)
        .order("requested_at", { ascending: false });
      
      if (error) throw error;
      return (data || []) as DeletionRequest[];
    },
    enabled: !!user?.id,
  });

  const { data: sourceAssets } = useQuery({
    queryKey: ["source-assets", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await (supabase as any)
        .from("source_asset_registry")
        .select("id, asset_type, analysis_count, is_deleted, created_at")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createDeletionMutation = useMutation({
    mutationFn: async ({ targetType, targetId, reason }: { targetType: string; targetId: string; reason: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const { data, error } = await (supabase as any)
        .from("deletion_requests")
        .insert({
          user_id: user.id,
          deletion_scope: targetType,
          reason,
          status: "pending",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
      toast.success("Deletion request created", {
        description: "Intelligence data will be preserved. Asset scheduled for deletion.",
      });
    },
    onError: (error) => {
      toast.error("Failed to create deletion request", {
        description: error.message,
      });
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await (supabase as any)
        .from("deletion_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
      toast.success("Deletion cancelled");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      cancelled: "bg-muted text-muted-foreground border-border",
      failed: "bg-destructive/10 text-destructive border-destructive/20",
    };
    
    return (
      <Badge variant="outline" className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case "media": return <FileText className="h-4 w-4" />;
      case "message": return <FileText className="h-4 w-4" />;
      case "profile": return <Database className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
    }
  };

  const pendingRequests = deletionRequests?.filter((r) => r.status === "pending") || [];
  const completedRequests = deletionRequests?.filter((r) => r.status === "completed" || r.status === "cancelled") || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Data Retention Manager
            </CardTitle>
            <CardDescription>
              Manage data deletion while preserving intelligence insights
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">
            <Brain className="h-3 w-3 mr-1" />
            Intelligence Preserved
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending deletion requests</p>
                <p className="text-sm mt-1">All your data is safely retained</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getTargetIcon(request.deletion_scope)}
                        <div>
                          <p className="font-medium text-sm">
                            {request.deletion_scope}: {request.id.slice(0, 8)}...
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Requested: {request.requested_at 
                              ? formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })
                              : "N/A"
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status || "pending")}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Deletion?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel the scheduled deletion and keep the asset.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancelDeletionMutation.mutate(request.id)}
                              >
                                Cancel Deletion
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="assets" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sourceAssets?.map((asset: any) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getTargetIcon(asset.asset_type)}
                      <div>
                        <p className="font-medium text-sm">{asset.asset_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {asset.analysis_count || 0} analyses linked
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Delete Asset?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>
                              This will schedule the asset for deletion after a 7-day grace period.
                            </p>
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mt-3">
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                <span>All AI analysis insights will be preserved in the event store.</span>
                              </p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => createDeletionMutation.mutate({
                              targetType: asset.asset_type,
                              targetId: asset.id,
                              reason: "User requested deletion",
                            })}
                          >
                            Schedule Deletion
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                {(!sourceAssets || sourceAssets.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No source assets registered</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {completedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      {getTargetIcon(request.deletion_scope)}
                      <div>
                        <p className="font-medium text-sm">
                          {request.deletion_scope}: {request.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.processed_at 
                            ? format(new Date(request.processed_at), "PPp")
                            : request.requested_at 
                              ? format(new Date(request.requested_at), "PPp")
                              : "N/A"
                          }
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(request.status || "pending")}
                  </div>
                ))}
                {completedRequests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No deletion history</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
