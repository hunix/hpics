import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  Eye,
  Mic,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Link2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface AnalysisEvent {
  id: string;
  event_type: string;
  analysis_type: string;
  analysis_subtype: string | null;
  confidence_score: number | null;
  key_insights: string[] | null;
  source_type: string | null;
  created_at: string;
  tags: string[] | null;
}

interface AnalysisTimelineProps {
  profileId: string;
}

const getAnalysisIcon = (analysisType: string) => {
  switch (analysisType) {
    case "facial": return <Eye className="h-4 w-4" />;
    case "voice": return <Mic className="h-4 w-4" />;
    case "linguistic": return <MessageSquare className="h-4 w-4" />;
    case "behavioral": return <Brain className="h-4 w-4" />;
    case "psychological": return <Lightbulb className="h-4 w-4" />;
    default: return <Brain className="h-4 w-4" />;
  }
};

const getConfidenceTrend = (score: number | null, previousScore?: number | null) => {
  if (score === null) return null;
  if (previousScore === null || previousScore === undefined) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  if (score > previousScore) {
    return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  }
  if (score < previousScore) {
    return <TrendingDown className="h-3 w-3 text-destructive" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const getAnalysisColor = (analysisType: string) => {
  switch (analysisType) {
    case "facial": return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    case "voice": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "linguistic": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "behavioral": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "psychological": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    default: return "bg-muted text-muted-foreground border-border";
  }
};

export function AnalysisTimeline({ profileId }: AnalysisTimelineProps) {
  const { user } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ["analysis-timeline", profileId, user?.id],
    queryFn: async () => {
      if (!user?.id || !profileId) return [];
      
      const { data, error } = await supabase
        .from("analysis_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("profile_id", profileId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as AnalysisEvent[];
    },
    enabled: !!user?.id && !!profileId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Analysis Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Analysis Timeline
        </CardTitle>
        <CardDescription>
          Chronological history of AI analysis events for this contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!events || events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No analysis events yet</p>
            <p className="text-sm mt-1">Run an analysis to see insights here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-6">
                {events.map((event, index) => (
                  <div key={event.id} className="relative flex gap-4 pl-2">
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background ${getAnalysisColor(event.analysis_type)}`}>
                      {getAnalysisIcon(event.analysis_type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm capitalize">
                            {event.analysis_type} Analysis
                          </span>
                          {event.analysis_subtype && (
                            <Badge variant="outline" className="text-xs">
                              {event.analysis_subtype}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {/* Confidence score */}
                      {event.confidence_score !== null && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>Confidence: {Math.round(event.confidence_score * 100)}%</span>
                          {getConfidenceTrend(
                            event.confidence_score,
                            events[index + 1]?.confidence_score
                          )}
                        </div>
                      )}
                      
                      {/* Key insights */}
                      {event.key_insights && event.key_insights.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {event.key_insights.slice(0, 3).map((insight, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Source link */}
                      {event.source_type && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Link2 className="h-3 w-3" />
                          <span>Source: {event.source_type}</span>
                        </div>
                      )}
                      
                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
