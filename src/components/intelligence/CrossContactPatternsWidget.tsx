import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Layers, 
  Building2, 
  Calendar, 
  Users, 
  MapPin,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { invokeFunction } from '@/lib/api';

interface Pattern {
  type: 'shared_employer' | 'event_overlap' | 'mutual_connection' | 'geographic_cluster' | 'same_industry';
  profiles: string[];
  profileNames: string[];
  evidence: string;
  confidence: number;
}

export function CrossContactPatternsWidget() {
  const queryClient = useQueryClient();

  const { data: patterns, isLoading, refetch } = useQuery({
    queryKey: ['cross-contact-patterns'],
    queryFn: async () => {
      const { data, error } = await invokeFunction('detect-cross-contact-patterns');
      if (error) throw error;
      return data.patterns as Pattern[];
    }
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('detect-cross-contact-patterns');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-contact-patterns'] });
      toast.success("Patterns refreshed!");
    },
    onError: (error) => {
      toast.error("Failed to detect patterns: " + (error as Error).message);
    }
  });

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'shared_employer': return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'event_overlap': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'mutual_connection': return <Users className="h-4 w-4 text-purple-500" />;
      case 'geographic_cluster': return <MapPin className="h-4 w-4 text-orange-500" />;
      default: return <Layers className="h-4 w-4" />;
    }
  };

  const getPatternLabel = (type: string) => {
    switch (type) {
      case 'shared_employer': return 'Same Company';
      case 'event_overlap': return 'Event Overlap';
      case 'mutual_connection': return 'Connected';
      case 'geographic_cluster': return 'Same Area';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Cross-Contact Patterns
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
        <div>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Cross-Contact Patterns
          </CardTitle>
          <CardDescription>
            Hidden connections discovered across your network
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          {refreshMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="ml-2">Detect</span>
        </Button>
      </CardHeader>
      <CardContent>
        {!patterns || patterns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2" />
            <p>No patterns detected yet</p>
            <p className="text-sm">Click Detect to analyze your contacts</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {patterns.map((pattern, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getPatternIcon(pattern.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {getPatternLabel(pattern.type)}
                        </Badge>
                        <Badge variant="outline">
                          {Math.round(pattern.confidence * 100)}%
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-1">
                        {pattern.evidence}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {pattern.profileNames.slice(0, 5).map((name, i) => (
                          <span 
                            key={i} 
                            className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                          >
                            {name}
                          </span>
                        ))}
                        {pattern.profileNames.length > 5 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                            +{pattern.profileNames.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
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
