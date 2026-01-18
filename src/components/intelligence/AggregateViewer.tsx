import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Layers
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Json } from '@/types/database-helpers';

interface Aggregate {
  id: string;
  profile_id: string;
  aggregate_type: string;
  current_state: Json;
  version: number | null;
  total_events: number | null;
  first_analysis_at: string | null;
  last_analysis_at: string | null;
  average_confidence: number | null;
  updated_at: string;
}

interface AggregateViewerProps {
  aggregates: Aggregate[];
  isLoading: boolean;
}

export function AggregateViewer({ aggregates, isLoading }: AggregateViewerProps) {
  const getAggregateTypeColor = (type: string) => {
    switch (type) {
      case "psychological": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "linguistic": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "behavioral": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "biometric": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "emotional": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "personality": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Analysis Aggregates
          </CardTitle>
          <CardDescription>Computed intelligence states per contact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group aggregates by profile
  const groupedByProfile = aggregates.reduce((acc, agg) => {
    if (!acc[agg.profile_id]) {
      acc[agg.profile_id] = {
        aggregates: []
      };
    }
    acc[agg.profile_id].aggregates.push(agg);
    return acc;
  }, {} as Record<string, { aggregates: Aggregate[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Analysis Aggregates
        </CardTitle>
        <CardDescription>
          Computed intelligence states derived from {aggregates.reduce((sum, a) => sum + a.total_events, 0)} events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {Object.keys(groupedByProfile).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Layers className="h-12 w-12 mb-4 opacity-50" />
              <p>No aggregates yet</p>
              <p className="text-sm">Aggregates are built from analysis events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByProfile).map(([profileId, { aggregates: profileAggregates }]) => (
                <div key={profileId} className="rounded-lg border overflow-hidden">
                  {/* Profile Header */}
                  <div className="flex items-center gap-3 p-4 bg-accent/50">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {profileId.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">
                        Contact Profile
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {profileAggregates.length} aggregate{profileAggregates.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <span>
                        {profileAggregates.reduce((sum, a) => sum + (a.total_events || 0), 0)} events
                      </span>
                    </div>
                  </div>

                  {/* Aggregates List */}
                  <div className="divide-y">
                    {profileAggregates.map((agg) => (
                      <div key={agg.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant="outline" 
                            className={getAggregateTypeColor(agg.aggregate_type)}
                          >
                            {agg.aggregate_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            v{agg.version || 1}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Events</span>
                            <p className="font-medium">{agg.total_events || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confidence</span>
                            <p className="font-medium">
                              {agg.average_confidence 
                                ? `${Math.round(agg.average_confidence * 100)}%` 
                                : "N/A"}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Updated</span>
                            <p className="font-medium">
                              {formatDistanceToNow(new Date(agg.updated_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>

                        {agg.average_confidence && (
                          <div className="mt-3">
                            <Progress 
                              value={agg.average_confidence * 100} 
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Preview of current state */}
                        {agg.current_state && typeof agg.current_state === 'object' && !Array.isArray(agg.current_state) && Object.keys(agg.current_state).length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Current State Preview:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(agg.current_state as Record<string, unknown>).slice(0, 5).map((key) => (
                                <Badge key={key} variant="secondary" className="text-xs">
                                  {key}
                                </Badge>
                              ))}
                              {Object.keys(agg.current_state as Record<string, unknown>).length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{Object.keys(agg.current_state as Record<string, unknown>).length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
