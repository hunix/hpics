import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, CheckCircle, Eye, RefreshCw, 
  TrendingDown, TrendingUp, Activity, MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BehavioralAnomaly {
  id: string;
  profile_id: string;
  anomaly_type: string;
  severity: string;
  description: string | null;
  detected_at: string;
  is_resolved: boolean | null;
  resolution_notes: string | null;
  deviation_score: number | null;
  expected_value: unknown;
  actual_value: unknown;
  profileName?: string;
}

export function BehavioralAnomalyDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAnomaly, setSelectedAnomaly] = useState<BehavioralAnomaly | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ["behavioral-anomalies", showResolved],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from("behavioral_anomalies")
        .select("*")
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(50);

      if (!showResolved) {
        query = query.eq("is_resolved", false);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get profile names
      const profileIds = [...new Set(data?.map(a => a.profile_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()]) || []);

      return (data || []).map(a => ({
        ...a,
        profileName: profileMap.get(a.profile_id) || "Unknown"
      })) as BehavioralAnomaly[];
    },
  });

  const resolveAnomaly = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("behavioral_anomalies")
        .update({
          is_resolved: true,
          resolution_notes: notes
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavioral-anomalies"] });
      setSelectedAnomaly(null);
      setResolutionNotes("");
      toast({
        title: "Anomaly Resolved",
        description: "The anomaly has been marked as resolved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resolve anomaly",
        variant: "destructive",
      });
    },
  });

  const getSeverityColor = (severity: string): "destructive" | "secondary" | "outline" => {
    switch (severity) {
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "outline";
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "sentiment_drop": return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "sentiment_spike": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "communication_gap": return <MessageSquare className="h-4 w-4 text-yellow-500" />;
      case "frequency_change": return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const unresolvedCount = anomalies?.filter(a => !a.is_resolved).length || 0;
  const highSeverityCount = anomalies?.filter(a => !a.is_resolved && a.severity === "high").length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Behavioral Anomalies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Behavioral Anomalies
            </CardTitle>
            {unresolvedCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unresolvedCount} unresolved
                {highSeverityCount > 0 && (
                  <span className="text-red-500 ml-1">
                    ({highSeverityCount} high severity)
                  </span>
                )}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? "Hide Resolved" : "Show Resolved"}
          </Button>
        </CardHeader>
        <CardContent>
          {!anomalies || anomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>No anomalies detected</p>
              <p className="text-sm mt-1">Behavioral patterns are normal</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      anomaly.is_resolved 
                        ? "bg-muted/30 opacity-60" 
                        : "bg-card hover:bg-accent/5"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getAnomalyIcon(anomaly.anomaly_type)}
                        <span className="font-medium">{anomaly.profileName}</span>
                        {anomaly.is_resolved && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(anomaly.severity)}>
                          {anomaly.severity}
                        </Badge>
                        {!anomaly.is_resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAnomaly(anomaly)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm mb-2">
                      {anomaly.description || anomaly.anomaly_type.replace(/_/g, " ")}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">
                        Type: {anomaly.anomaly_type.replace(/_/g, " ")}
                      </span>
                      {anomaly.deviation_score !== null && (
                        <span>
                          Deviation: {(anomaly.deviation_score * 100).toFixed(0)}%
                        </span>
                      )}
                      <span>
                        {format(new Date(anomaly.detected_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>

                    {anomaly.is_resolved && anomaly.resolution_notes && (
                      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                        <strong>Resolution:</strong> {anomaly.resolution_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedAnomaly} onOpenChange={() => setSelectedAnomaly(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Investigate Anomaly
            </DialogTitle>
          </DialogHeader>
          
          {selectedAnomaly && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedAnomaly.profileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Severity</p>
                  <Badge variant={getSeverityColor(selectedAnomaly.severity)}>
                    {selectedAnomaly.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="capitalize">{selectedAnomaly.anomaly_type.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Detected</p>
                  <p>{format(new Date(selectedAnomaly.detected_at), "PPpp")}</p>
                </div>
              </div>

              {selectedAnomaly.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{selectedAnomaly.description}</p>
                </div>
              )}

              {(selectedAnomaly.expected_value || selectedAnomaly.actual_value) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedAnomaly.expected_value && (
                    <div>
                      <p className="text-muted-foreground">Expected</p>
                      <p className="font-mono text-xs">
                        {JSON.stringify(selectedAnomaly.expected_value, null, 2)}
                      </p>
                    </div>
                  )}
                  {selectedAnomaly.actual_value && (
                    <div>
                      <p className="text-muted-foreground">Actual</p>
                      <p className="font-mono text-xs">
                        {JSON.stringify(selectedAnomaly.actual_value, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                <Textarea
                  placeholder="Describe your investigation findings or why this is not a concern..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAnomaly(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAnomaly) {
                  resolveAnomaly.mutate({
                    id: selectedAnomaly.id,
                    notes: resolutionNotes
                  });
                }
              }}
              disabled={resolveAnomaly.isPending}
            >
              {resolveAnomaly.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
