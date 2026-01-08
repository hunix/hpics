import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, TrendingUp, TrendingDown, CheckCircle, XCircle, 
  Clock, RefreshCw, Brain, Lightbulb 
} from "lucide-react";
import { format } from "date-fns";

interface MethodologyOutcome {
  id: string;
  methodology_id: string | null;
  methodology_name: string;
  profile_id: string;
  approach_used: string | null;
  outcome: string;
  outcome_score: number | null;
  applied_at: string;
  lessons: string | null;
  profileName?: string;
}

interface MethodologyStats {
  methodology: string;
  totalActions: number;
  successRate: number;
  avgEffectiveness: number;
}

export function InfluenceActionTracker() {
  const [activeTab, setActiveTab] = useState("outcomes");

  const { data: outcomes, isLoading: outcomesLoading } = useQuery({
    queryKey: ["influence-outcomes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("methodology_outcomes")
        .select(`
          id,
          methodology_id,
          methodology_name,
          profile_id,
          approach_used,
          outcome,
          outcome_score,
          applied_at,
          lessons
        `)
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profile names
      const profileIds = [...new Set(data?.map(o => o.profile_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", profileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, `${p.first_name} ${p.last_name || ''}`.trim()]) || []);

      return (data || []).map(o => ({
        ...o,
        profileName: profileMap.get(o.profile_id) || "Unknown"
      })) as MethodologyOutcome[];
    },
  });

  const { data: methodologyStats, isLoading: statsLoading } = useQuery({
    queryKey: ["methodology-effectiveness-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all outcomes
      const { data: allOutcomes, error } = await supabase
        .from("methodology_outcomes")
        .select(`
          methodology_name,
          outcome,
          outcome_score
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Aggregate stats per methodology
      const statsMap = new Map<string, { total: number; success: number; effectivenessSum: number; count: number }>();

      allOutcomes?.forEach(o => {
        const name = o.methodology_name || "Other";
        const current = statsMap.get(name) || { total: 0, success: 0, effectivenessSum: 0, count: 0 };
        current.total++;
        if (o.outcome === "success" || o.outcome === "partial_success") {
          current.success++;
        }
        if (o.outcome_score !== null) {
          current.effectivenessSum += o.outcome_score;
          current.count++;
        }
        statsMap.set(name, current);
      });

      return Array.from(statsMap.entries()).map(([methodology, stats]) => ({
        methodology,
        totalActions: stats.total,
        successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
        avgEffectiveness: stats.count > 0 ? stats.effectivenessSum / stats.count : 0
      })).sort((a, b) => b.totalActions - a.totalActions) as MethodologyStats[];
    },
  });

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "partial_success": return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "failure": return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending": return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getOutcomeBadgeVariant = (outcome: string) => {
    switch (outcome) {
      case "success": return "default";
      case "partial_success": return "secondary";
      case "failure": return "destructive";
      default: return "outline";
    }
  };

  const isLoading = outcomesLoading || statsLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Influence Action Tracker
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Influence Action Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outcomes">Recent Outcomes</TabsTrigger>
            <TabsTrigger value="effectiveness">What Works</TabsTrigger>
          </TabsList>

          <TabsContent value="outcomes" className="mt-4">
            {!outcomes || outcomes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No influence actions recorded yet</p>
                <p className="text-sm mt-1">Record outcomes to track effectiveness</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-3">
                  {outcomes.map((outcome) => (
                    <div
                      key={outcome.id}
                      className="border rounded-lg p-3 bg-card hover:bg-accent/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getOutcomeIcon(outcome.outcome)}
                          <span className="font-medium">{outcome.profileName}</span>
                        </div>
                        <Badge variant={getOutcomeBadgeVariant(outcome.outcome)}>
                          {outcome.outcome.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {outcome.approach_used || outcome.methodology_name}
                      </p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Brain className="h-3 w-3" />
                          <span>{outcome.methodology_name}</span>
                        </div>
                        {outcome.outcome_score !== null && (
                          <div className="flex items-center gap-1">
                            <span>Score:</span>
                            <Progress 
                              value={outcome.outcome_score * 10} 
                              className="w-16 h-2" 
                            />
                            <span>{outcome.outcome_score}/10</span>
                          </div>
                        )}
                        <span>{format(new Date(outcome.applied_at), "MMM d, yyyy")}</span>
                      </div>

                      {outcome.lessons && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          "{outcome.lessons}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="effectiveness" className="mt-4">
            {!methodologyStats || methodologyStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Not enough data to show effectiveness</p>
                <p className="text-sm mt-1">Record more outcomes to see patterns</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-4">
                  {methodologyStats.map((stat, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-4 bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{stat.methodology}</h4>
                        <Badge variant="outline">{stat.totalActions} actions</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                          <div className="flex items-center gap-2">
                            <Progress value={stat.successRate} className="flex-1 h-2" />
                            <span className="text-sm font-medium">
                              {stat.successRate.toFixed(0)}%
                            </span>
                            {stat.successRate >= 70 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : stat.successRate < 40 ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : null}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Avg Effectiveness</p>
                          <div className="flex items-center gap-2">
                            <Progress value={stat.avgEffectiveness * 10} className="flex-1 h-2" />
                            <span className="text-sm font-medium">
                              {stat.avgEffectiveness.toFixed(1)}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {methodologyStats.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Insights
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {methodologyStats[0] && (
                          <p>
                            • <strong>{methodologyStats[0].methodology}</strong> is your most-used approach
                            {methodologyStats[0].successRate >= 70 && " and has a strong success rate"}
                          </p>
                        )}
                        {methodologyStats.find(s => s.successRate >= 80) && (
                          <p>
                            • <strong>{methodologyStats.find(s => s.successRate >= 80)?.methodology}</strong> shows 
                            exceptional effectiveness - consider using it more
                          </p>
                        )}
                        {methodologyStats.find(s => s.successRate < 40 && s.totalActions >= 3) && (
                          <p>
                            • <strong>{methodologyStats.find(s => s.successRate < 40 && s.totalActions >= 3)?.methodology}</strong> may 
                            need adjustment - review approach
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
