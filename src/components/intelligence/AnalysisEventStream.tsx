import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  MessageSquare, 
  Image, 
  Video, 
  Mic, 
  FileText,
  Sparkles,
  Clock
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface AnalysisEvent {
  id: string;
  event_type: string;
  analysis_type: string;
  source_type: string | null;
  confidence_score: number | null;
  created_at: string;
  processing_duration_ms: number | null;
  cost_cents: number | null;
  key_insights: string[] | null;
}

interface AnalysisEventStreamProps {
  events: AnalysisEvent[];
  isLoading: boolean;
}

export function AnalysisEventStream({ events, isLoading }: AnalysisEventStreamProps) {
  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case "media": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "voice": return <Mic className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case "psychological": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "linguistic": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "behavioral": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "biometric": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "emotional": return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getConfidenceColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 0.8) return "text-emerald-500";
    if (score >= 0.6) return "text-amber-500";
    return "text-destructive";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live Event Stream
          </CardTitle>
          <CardDescription>Real-time analysis events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
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
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          Live Event Stream
        </CardTitle>
        <CardDescription>
          Real-time analysis events from the CAAS engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Brain className="h-12 w-12 mb-4 opacity-50" />
              <p>No analysis events yet</p>
              <p className="text-sm">Events will appear here as analyses are processed</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animation: index < 5 ? "fadeIn 0.3s ease-out forwards" : undefined
                  }}
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                    {getSourceIcon(event.source_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium capitalize">
                        {event.event_type.replace(/_/g, " ")}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={getAnalysisTypeColor(event.analysis_type)}
                      >
                        {event.analysis_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                      </span>
                      
                      {event.processing_duration_ms && (
                        <span>{event.processing_duration_ms}ms</span>
                      )}
                      
                      {event.cost_cents && (
                        <span>${(event.cost_cents / 100).toFixed(4)}</span>
                      )}
                    </div>
                    
                    {event.key_insights && event.key_insights.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.key_insights.slice(0, 3).map((insight, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {insight}
                          </Badge>
                        ))}
                        {event.key_insights.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{event.key_insights.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {event.confidence_score !== null && (
                      <span className={`text-sm font-medium ${getConfidenceColor(event.confidence_score)}`}>
                        {Math.round(event.confidence_score * 100)}%
                      </span>
                    )}
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
