import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Target, Users, Lightbulb, Link2, Building, Globe, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface GrowthSuggestion {
  type: 'diversity' | 'reactivation' | 'expansion' | 'relationship';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  action_items: string[];
}

interface NetworkSummary {
  total_contacts: number;
  active_contacts: number;
  inactive_contacts: number;
  industry_distribution: Record<string, number>;
  role_distribution: Record<string, number>;
  relationship_types: Record<string, number>;
  diversity_score: number;
}

interface GrowthData {
  suggestions: GrowthSuggestion[];
  network_health_score: number;
  key_insights: string[];
  network_summary: NetworkSummary;
  generated_at: string;
}

export function NetworkGrowthOptimizer() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['network-growth', user?.id],
    queryFn: async () => {
      const { data: result, error } = await invokeFunction('suggest-network-growth', {},);

      if (error) throw error;
      return result as GrowthData;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await invokeFunction('suggest-network-growth', {},);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-growth'] });
      toast.success('Network analysis refreshed');
    },
    onError: (error) => {
      toast.error('Failed to refresh: ' + (error as Error).message);
    },
  });

  const getImpactColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-green-600 bg-green-500/10';
      case 'medium': return 'text-amber-600 bg-amber-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diversity': return Building;
      case 'reactivation': return RefreshCw;
      case 'expansion': return TrendingUp;
      case 'relationship': return Users;
      default: return Lightbulb;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.network_summary;
  const suggestions = data?.suggestions || [];
  const healthScore = data?.network_health_score || 0;
  const insights = data?.key_insights || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              AI Network Growth Optimizer
            </CardTitle>
            <CardDescription>
              AI-powered analysis to strengthen your network
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList>
            <TabsTrigger value="metrics">Health Score</TabsTrigger>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            {/* Network Health Score */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Network Health Score</span>
                <span className="text-2xl font-bold text-primary">{healthScore}/100</span>
              </div>
              <Progress value={healthScore} className="h-3" />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Total Contacts</span>
                </div>
                <div className="text-3xl font-bold">{summary?.total_contacts || 0}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Active (90 days)</span>
                </div>
                <div className="text-3xl font-bold">{summary?.active_contacts || 0}</div>
              </div>
            </div>

            {/* Diversity Score */}
            {summary && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Network Diversity</span>
                  <span className="text-sm text-muted-foreground">{summary.diversity_score}%</span>
                </div>
                <Progress value={summary.diversity_score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {Object.keys(summary.industry_distribution).length} industries and {Object.keys(summary.role_distribution).length} roles
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-3">
            <ScrollArea className="h-[350px]">
              {suggestions.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {suggestions.map((suggestion, index) => {
                    const TypeIcon = getTypeIcon(suggestion.type);
                    return (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TypeIcon className="h-4 w-4 text-primary" />
                              <span className="font-medium">{suggestion.title}</span>
                              <Badge className={getImpactColor(suggestion.priority)}>
                                {suggestion.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {suggestion.description}
                            </p>
                            <div className="text-sm mb-2">
                              <span className="font-medium">Expected Impact:</span>{' '}
                              <span className="text-muted-foreground">{suggestion.impact}</span>
                            </div>
                            {suggestion.action_items?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium">Action Items:</span>
                                {suggestion.action_items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {item}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button size="sm" variant="outline">
                            <Link2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Your network is well-optimized!</p>
                  <p className="text-sm">Check back later for new suggestions</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="space-y-3">
            {insights.length > 0 ? (
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No insights available yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            {/* Industry Distribution */}
            {summary && Object.keys(summary.industry_distribution).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Top Industries
                </h4>
                <div className="space-y-2">
                  {Object.entries(summary.industry_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([industry, count]) => (
                      <div key={industry} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate">{industry}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <Progress value={(count / summary.total_contacts) * 100} className="h-1" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Relationship Types */}
            {summary && Object.keys(summary.relationship_types).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Relationship Types
                </h4>
                <div className="space-y-2">
                  {Object.entries(summary.relationship_types)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="truncate capitalize">{type}</span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <Progress value={(count / summary.total_contacts) * 100} className="h-1" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
