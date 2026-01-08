import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Network, RefreshCw, Users, Building2, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { handleAIError } from "@/lib/aiErrorHandler";

interface CrossPattern {
  id: string;
  pattern_type: string;
  profile_a_id: string;
  profile_b_id: string;
  confidence_score: number;
  pattern_details: any;
  detected_at: string;
  profiles?: {
    a?: { first_name: string; last_name: string };
    b?: { first_name: string; last_name: string };
  };
}

interface SharedExperience {
  id: string;
  experience_type: string;
  title: string;
  experience_date: string;
  profile_id: string;
  location?: string;
}

export function CrossContactPatternPanel() {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch cross-contact patterns
  const { data: patterns, isLoading: patternsLoading } = useQuery({
    queryKey: ["cross-contact-patterns"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("cross_contact_detections")
        .select(`
          id, pattern_type, profile_a_id, profile_b_id, 
          confidence_score, pattern_details, detected_at
        `)
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profile names for each pattern
      const profileIds = new Set<string>();
      data?.forEach((p: any) => {
        if (p.profile_a_id) profileIds.add(p.profile_a_id);
        if (p.profile_b_id) profileIds.add(p.profile_b_id);
      });

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", Array.from(profileIds));

      const profileMap = new Map(profiles?.map((p: any) => [p.id, p]));

      return data?.map((p: any) => ({
        ...p,
        profiles: {
          a: profileMap.get(p.profile_a_id),
          b: profileMap.get(p.profile_b_id),
        },
      })) as CrossPattern[];
    },
  });

  // Fetch shared experiences from events table
  const { data: sharedExperiences, isLoading: experiencesLoading } = useQuery({
    queryKey: ["shared-experiences"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("events")
        .select("id, title, event_type, event_date, profile_id, location")
        .eq("user_id", user.id)
        .order("event_date", { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        experience_type: e.event_type,
        experience_date: e.event_date,
        profile_id: e.profile_id,
        location: e.location,
      })) as SharedExperience[];
    },
  });

  // Fetch connection intelligence
  const { data: connectionIntel, isLoading: intelLoading } = useQuery({
    queryKey: ["connection-intelligence"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("connection_intelligence")
        .select("*")
        .eq("user_id", user.id)
        .order("connection_strength", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      const { data, error } = await supabase.functions.invoke("detect-cross-contact-patterns");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Cross-contact analysis complete");
      queryClient.invalidateQueries({ queryKey: ["cross-contact-patterns"] });
      queryClient.invalidateQueries({ queryKey: ["shared-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["connection-intelligence"] });
    },
    onError: (error) => {
      const result = handleAIError(error);
      if (!result.handled) {
        toast.error("Analysis failed", { description: error.message });
      }
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

  const getPatternIcon = (type: string) => {
    switch (type) {
      case "shared_employer":
        return <Building2 className="h-4 w-4" />;
      case "co_attendance":
        return <Calendar className="h-4 w-4" />;
      case "mutual_connection":
        return <Users className="h-4 w-4" />;
      default:
        return <Network className="h-4 w-4" />;
    }
  };

  const getPatternColor = (type: string) => {
    switch (type) {
      case "shared_employer":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "co_attendance":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "mutual_connection":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isLoading = patternsLoading || experiencesLoading || intelLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Cross-Contact Patterns
          </CardTitle>
          <CardDescription>
            Automatically detected connections and shared experiences across your network
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runAnalysisMutation.mutate()}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Analyze
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Detected Patterns */}
            {patterns && patterns.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Detected Patterns</h4>
                <div className="space-y-2">
                  {patterns.slice(0, 5).map((pattern) => (
                    <div
                      key={pattern.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={getPatternColor(pattern.pattern_type)}
                        >
                          {getPatternIcon(pattern.pattern_type)}
                          <span className="ml-1 capitalize">
                            {pattern.pattern_type.replace(/_/g, " ")}
                          </span>
                        </Badge>
                        <span className="text-sm">
                          {pattern.profiles?.a
                            ? `${pattern.profiles.a.first_name} ${pattern.profiles.a.last_name}`
                            : "Unknown"}{" "}
                          ↔{" "}
                          {pattern.profiles?.b
                            ? `${pattern.profiles.b.first_name} ${pattern.profiles.b.last_name}`
                            : "Unknown"}
                        </span>
                      </div>
                      <Badge variant="secondary">
                        {Math.round((pattern.confidence_score || 0) * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Experiences */}
            {sharedExperiences && sharedExperiences.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Shared Experiences</h4>
                <div className="space-y-2">
                  {sharedExperiences.slice(0, 5).map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{exp.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {exp.experience_type}
                          </p>
                        </div>
                      </div>
                      {exp.experience_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(exp.experience_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connection Intelligence Summary */}
            {connectionIntel && connectionIntel.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Strong Connections</h4>
                <div className="grid grid-cols-2 gap-2">
                  {connectionIntel.slice(0, 4).map((intel: any) => (
                    <div
                      key={intel.id}
                      className="p-2 rounded-lg border bg-muted/50"
                    >
                      <p className="text-xs font-medium truncate">
                        {intel.connection_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Strength: {Math.round((intel.connection_strength || 0) * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {(!patterns || patterns.length === 0) &&
              (!sharedExperiences || sharedExperiences.length === 0) &&
              (!connectionIntel || connectionIntel.length === 0) && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No cross-contact patterns detected yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add more contacts and data to enable pattern detection.
                  </p>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
