import { useState } from "react";
import { useSharedExperiences } from "@/hooks/network/useSharedExperiences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Users, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { invokeFunction } from '@/lib/api';

interface ExperienceCluster {
  participants: string[];
  participantNames: string[];
  events: import('@/hooks/network/useSharedExperiences').SharedExperience[];
  count: number;
}

export function SharedExperiencesMap() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: experiences, isLoading, refetch } = useSharedExperiences();

  // Group experiences by participants to find networking clusters
  const participantClusters = experiences?.reduce((acc, exp) => {
    const key = (exp.related_contacts || []).sort().join(",");
    if (!acc[key]) {
      acc[key] = {
        participants: exp.related_contacts || [],
        participantNames: exp.participantNames || [],
        events: [],
        count: 0
      };
    }
    acc[key].events.push(exp);
    acc[key].count++;
    return acc;
  }, {} as Record<string, ExperienceCluster>) || {};

  const sortedClusters = Object.values(participantClusters).sort((a, b) => b.count - a.count);

  const analyzeNetworkingOpportunities = async () => {
    setIsAnalyzing(true);
    try {
      const { error } = await invokeFunction("detect-cross-contact-patterns", { includeSharedExperiences: true });

      if (error) throw error;

      toast({
        title: "Analysis Complete",
        description: "Networking opportunities have been analyzed",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMilestoneTypeBadgeVariant = (type: string) => {
    switch (type?.toLowerCase()) {
      case "professional": return "default";
      case "personal": return "secondary";
      case "social": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shared Experiences
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Shared Experiences Map
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeNetworkingOpportunities}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Find Opportunities
        </Button>
      </CardHeader>
      <CardContent>
        {sortedClusters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared experiences found</p>
            <p className="text-sm mt-1">Add milestones with multiple related contacts to see connections</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {sortedClusters.map((cluster, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap gap-1">
                      {cluster.participantNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {cluster.count} shared {cluster.count === 1 ? "event" : "events"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {cluster.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate flex-1">{event.title}</span>
                        <Badge variant={getMilestoneTypeBadgeVariant(event.milestone_type)} className="text-xs">
                          {event.milestone_type}
                        </Badge>
                        {event.event_date && (
                          <span className="text-xs">
                            {format(new Date(event.event_date), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    ))}
                    {cluster.events.length > 3 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        +{cluster.events.length - 3} more events
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
