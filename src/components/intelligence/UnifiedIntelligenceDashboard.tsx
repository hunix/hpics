import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Users, 
  RefreshCw,
  Lightbulb,
  Target,
  Clock,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ProactiveInsight {
  type: 'opportunity' | 'risk' | 'action' | 'milestone';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  affected_contacts: Array<{ id: string; name: string }>;
  suggested_action: string;
  deadline?: string;
  context: string;
}

export function UnifiedIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState("insights");
  const queryClient = useQueryClient();

  const { data: proactiveData, isLoading: insightsLoading } = useQuery({
    queryKey: ['proactive-insights'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('generate-proactive-insights', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: anomalies } = useQuery({
    queryKey: ['communication-anomalies'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await supabase.functions.invoke('detect-communication-anomalies', {
        body: { timeframeDays: 30 },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    staleTime: 15 * 60 * 1000,
  });

  const { data: networkHealth } = useQuery({
    queryKey: ['network-health-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [churnData, activityData] = await Promise.all([
        supabase
          .from('churn_predictions')
          .select('risk_level')
          .eq('user_id', user.id),
        supabase
          .from('contact_activity_feed')
          .select('activity_type')
          .eq('user_id', user.id)
          .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      const riskCounts = {
        low: churnData.data?.filter(c => c.risk_level === 'low').length || 0,
        medium: churnData.data?.filter(c => c.risk_level === 'medium').length || 0,
        high: churnData.data?.filter(c => c.risk_level === 'high').length || 0,
      };

      return {
        riskCounts,
        weeklyActivityCount: activityData.data?.length || 0,
        healthScore: anomalies?.networkHealthScore || 75,
      };
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      await supabase.functions.invoke('generate-proactive-insights', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proactive-insights'] });
      toast.success('Insights refreshed');
    },
    onError: () => {
      toast.error('Failed to refresh insights');
    },
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Lightbulb className="h-4 w-4 text-yellow-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'action': return <Target className="h-4 w-4 text-blue-500" />;
      case 'milestone': return <Calendar className="h-4 w-4 text-green-500" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Intelligence Hub
          </CardTitle>
          <CardDescription>
            Proactive insights and relationship intelligence
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Health Score</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {networkHealth?.healthScore || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-muted-foreground">At Risk</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {networkHealth?.riskCounts?.high || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Weekly Activity</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {networkHealth?.weeklyActivityCount || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Active Insights</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {proactiveData?.insights?.length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Focus */}
        {proactiveData?.dailyFocus && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Today's Focus</span>
            </div>
            <p className="text-sm">{proactiveData.dailyFocus}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <ScrollArea className="h-[400px]">
              {insightsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : proactiveData?.insights?.length > 0 ? (
                <div className="space-y-3">
                  {proactiveData.insights.map((insight: ProactiveInsight, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <span className="font-medium">{insight.title}</span>
                        </div>
                        <Badge variant={getPriorityVariant(insight.priority)}>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      {insight.affected_contacts?.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {insight.affected_contacts.map(c => c.name).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="bg-muted/50 rounded p-2">
                        <p className="text-xs font-medium">Suggested Action:</p>
                        <p className="text-xs text-muted-foreground">{insight.suggested_action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No active insights. Your relationships are in good shape!
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="anomalies">
            <ScrollArea className="h-[400px]">
              {anomalies?.anomalies?.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.anomalies.map((anomaly: any, idx: number) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium capitalize">
                          {anomaly.type.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={
                          anomaly.severity === 'high' ? 'destructive' : 
                          anomaly.severity === 'medium' ? 'default' : 'secondary'
                        }>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {anomaly.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pattern: {anomaly.detected_pattern}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No anomalies detected in your communication patterns.
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="actions">
            <ScrollArea className="h-[400px]">
              {proactiveData?.insights?.filter((i: ProactiveInsight) => i.type === 'action').length > 0 ? (
                <div className="space-y-3">
                  {proactiveData.insights
                    .filter((i: ProactiveInsight) => i.type === 'action')
                    .map((action: ProactiveInsight, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{action.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {action.suggested_action}
                        </p>
                        {action.deadline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(action.deadline).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No pending actions at this time.
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
