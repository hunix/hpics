import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Eye,
  Mic,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface CrossModalCorrelation {
  id: string;
  profile_id: string | null;
  primary_modality: string | null;
  secondary_modality: string | null;
  correlation_type: string | null;
  correlation_strength: number | null;
  temporal_offset_ms: number | null;
  confidence_score: number | null;
  insights: unknown;
  contradictions: unknown;
  supporting_evidence: unknown;
  created_at: string | null;
}

interface CrossModalCorrelationViewerProps {
  profileId?: string;
}

const getModalityIcon = (modality: string | null) => {
  switch (modality) {
    case "facial": return <Eye className="h-4 w-4" />;
    case "voice": return <Mic className="h-4 w-4" />;
    case "linguistic": return <MessageSquare className="h-4 w-4" />;
    case "behavioral": return <Brain className="h-4 w-4" />;
    default: return <Activity className="h-4 w-4" />;
  }
};

const getModalityColor = (modality: string | null) => {
  switch (modality) {
    case "facial": return "text-violet-500 bg-violet-500/10";
    case "voice": return "text-blue-500 bg-blue-500/10";
    case "linguistic": return "text-emerald-500 bg-emerald-500/10";
    case "behavioral": return "text-amber-500 bg-amber-500/10";
    default: return "text-muted-foreground bg-muted";
  }
};

const getCorrelationTypeLabel = (type: string | null) => {
  switch (type) {
    case "supporting": return { label: "Supporting", color: "text-emerald-500", icon: CheckCircle2 };
    case "contradicting": return { label: "Contradicting", color: "text-destructive", icon: AlertTriangle };
    case "neutral": return { label: "Neutral", color: "text-muted-foreground", icon: Activity };
    default: return { label: "Unknown", color: "text-muted-foreground", icon: Activity };
  }
};

export function CrossModalCorrelationViewer({ profileId }: CrossModalCorrelationViewerProps) {
  const { user } = useAuth();

  const { data: correlations, isLoading } = useQuery({
    queryKey: ["cross-modal-correlations", user?.id, profileId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from("cross_modal_correlations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (profileId) {
        query = query.eq("profile_id", profileId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as CrossModalCorrelation[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cross-Modal Correlations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const supportingCount = correlations?.filter((c) => c.correlation_type === "supporting").length || 0;
  const contradictingCount = correlations?.filter((c) => c.correlation_type === "contradicting").length || 0;
  const averageStrength = correlations?.length 
    ? correlations.reduce((sum, c) => sum + (c.correlation_strength || 0), 0) / correlations.length 
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Cross-Modal Correlations
            </CardTitle>
            <CardDescription>
              Multi-modal analysis fusion with contradiction detection
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {supportingCount} Supporting
            </Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {contradictingCount} Contradicting
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{correlations?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total Correlations</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{Math.round(averageStrength * 100)}%</p>
            <p className="text-xs text-muted-foreground">Avg Strength</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              {contradictingCount > 0 ? (
                <span className="text-destructive">{contradictingCount}</span>
              ) : (
                <span className="text-emerald-500">0</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">Contradictions</p>
          </div>
        </div>

        {!correlations || correlations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No cross-modal correlations detected</p>
            <p className="text-sm mt-1">Run multi-modal analysis to detect correlations</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {correlations.map((correlation) => {
                const typeInfo = getCorrelationTypeLabel(correlation.correlation_type);
                const TypeIcon = typeInfo.icon;
                const insights = correlation.insights as string[] | null;
                const contradictions = correlation.contradictions as string[] | null;
                
                return (
                  <div
                    key={correlation.id}
                    className="p-4 rounded-lg border bg-card space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Modality badges */}
                        <div className="flex items-center gap-1">
                          <span className={`p-1.5 rounded ${getModalityColor(correlation.primary_modality)}`}>
                            {getModalityIcon(correlation.primary_modality)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className={`p-1.5 rounded ${getModalityColor(correlation.secondary_modality)}`}>
                            {getModalityIcon(correlation.secondary_modality)}
                          </span>
                        </div>
                        <Badge variant="outline" className={typeInfo.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {correlation.created_at 
                          ? formatDistanceToNow(new Date(correlation.created_at), { addSuffix: true })
                          : "N/A"
                        }
                      </span>
                    </div>

                    {/* Correlation Strength */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Correlation Strength</span>
                        <span className="font-medium">
                          {Math.round((correlation.correlation_strength || 0) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(correlation.correlation_strength || 0) * 100} 
                        className="h-1.5"
                      />
                    </div>

                    {/* Confidence */}
                    {correlation.confidence_score !== null && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Confidence: {Math.round(correlation.confidence_score * 100)}%</span>
                        {correlation.temporal_offset_ms !== null && (
                          <>
                            <span>•</span>
                            <span>Temporal offset: {correlation.temporal_offset_ms}ms</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Insights */}
                    {insights && insights.length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        {insights.slice(0, 2).map((insight, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <TrendingUp className="h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contradictions */}
                    {contradictions && contradictions.length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        {contradictions.slice(0, 2).map((contradiction, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{contradiction}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
