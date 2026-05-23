import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight,
  AlertTriangle, Target, Lightbulb, ArrowUp, ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { invokeFunction } from '@/lib/api';

interface TrajectoryPrediction {
  profileId: string;
  profileName: string;
  currentHealth: number;
  predictedHealth30Days: number;
  predictedHealth90Days: number;
  trajectory: 'growing' | 'stable' | 'declining' | 'at_risk';
  churnProbability: number;
  opportunityScore: number;
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  confidence: number;
}

const trajectoryConfig = {
  growing: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Growing' },
  stable: { icon: Minus, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Declining' },
  at_risk: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'At Risk' },
};

interface RelationshipTrajectoryPanelProps {
  profileId?: string;
}

export function RelationshipTrajectoryPanel({ profileId }: RelationshipTrajectoryPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('at_risk');

  const { data: predictions, isLoading, error } = useQuery({
    queryKey: ['relationship-trajectory', user?.id, profileId],
    queryFn: async () => {
      const { data, error } = await invokeFunction('predict-relationship-trajectory', profileId ? { profileId } : undefined);
      if (error) throw error;
      const results = data.predictions as TrajectoryPrediction[];
      // Filter by profileId if provided
      return profileId ? results.filter(p => p.profileId === profileId) : results;
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await invokeFunction('predict-relationship-trajectory');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-trajectory'] });
      toast.success('Trajectory predictions refreshed');
    },
    onError: (err) => {
      toast.error('Prediction failed: ' + (err as Error).message);
    },
  });

  const filteredPredictions = predictions?.filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'opportunities') return p.opportunityScore >= 60;
    return p.trajectory === activeTab;
  }) || [];

  const atRiskCount = predictions?.filter(p => p.trajectory === 'at_risk').length || 0;
  const decliningCount = predictions?.filter(p => p.trajectory === 'declining').length || 0;
  const opportunityCount = predictions?.filter(p => p.opportunityScore >= 60).length || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Relationship Trajectories
            </CardTitle>
            <CardDescription>
              Predictive health scores, churn risk, and opportunity analysis
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions && predictions.length > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-destructive/10 text-center">
                <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-destructive" />
                <div className="text-xl font-bold text-destructive">{atRiskCount}</div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
              <div className="p-3 rounded-lg border bg-yellow-500/10 text-center">
                <TrendingDown className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                <div className="text-xl font-bold text-yellow-600">{decliningCount}</div>
                <div className="text-xs text-muted-foreground">Declining</div>
              </div>
              <div className="p-3 rounded-lg border bg-green-500/10 text-center">
                <Target className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold text-green-600">{opportunityCount}</div>
                <div className="text-xs text-muted-foreground">Opportunities</div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="at_risk" className="text-xs">
                  At Risk ({atRiskCount})
                </TabsTrigger>
                <TabsTrigger value="declining" className="text-xs">
                  Declining ({decliningCount})
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="text-xs">
                  Opportunities
                </TabsTrigger>
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                <ScrollArea className="h-[300px]">
                  {filteredPredictions.length > 0 ? (
                    <div className="space-y-3">
                      {filteredPredictions.map((pred) => {
                        const config = trajectoryConfig[pred.trajectory];
                        const Icon = config.icon;
                        const healthChange = pred.predictedHealth90Days - pred.currentHealth;

                        return (
                          <div
                            key={pred.profileId}
                            className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/contacts/${pred.profileId}`)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${config.bg}`}>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium truncate">{pred.profileName}</span>
                                  <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                                    {config.label}
                                  </Badge>
                                </div>
                                
                                {/* Health Scores */}
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">Current</div>
                                    <div className="font-semibold">{pred.currentHealth}%</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">30 Days</div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">{pred.predictedHealth30Days}%</span>
                                      {pred.predictedHealth30Days > pred.currentHealth ? (
                                        <ArrowUp className="h-3 w-3 text-green-500" />
                                      ) : pred.predictedHealth30Days < pred.currentHealth ? (
                                        <ArrowDown className="h-3 w-3 text-destructive" />
                                      ) : null}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] text-muted-foreground">90 Days</div>
                                    <div className="flex items-center gap-1">
                                      <span className="font-semibold">{pred.predictedHealth90Days}%</span>
                                      <span className={`text-xs ${healthChange > 0 ? 'text-green-500' : healthChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                        ({healthChange > 0 ? '+' : ''}{healthChange})
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Risk & Opportunity Meters */}
                                <div className="flex gap-4 mb-2">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[10px] mb-1">
                                      <span className="text-muted-foreground">Churn Risk</span>
                                      <span className={pred.churnProbability > 50 ? 'text-destructive' : ''}>{pred.churnProbability}%</span>
                                    </div>
                                    <Progress 
                                      value={pred.churnProbability} 
                                      className="h-1.5 [&>div]:bg-destructive" 
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[10px] mb-1">
                                      <span className="text-muted-foreground">Opportunity</span>
                                      <span className={pred.opportunityScore > 60 ? 'text-green-500' : ''}>{pred.opportunityScore}%</span>
                                    </div>
                                    <Progress 
                                      value={pred.opportunityScore} 
                                      className="h-1.5 [&>div]:bg-green-500" 
                                    />
                                  </div>
                                </div>

                                {/* Factors */}
                                {(pred.factors.negative.length > 0 || pred.factors.positive.length > 0) && (
                                  <div className="flex flex-wrap gap-1 mb-2">
                                    {pred.factors.negative.slice(0, 2).map((f, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/30">
                                        {f}
                                      </Badge>
                                    ))}
                                    {pred.factors.positive.slice(0, 2).map((f, i) => (
                                      <Badge key={i} variant="outline" className="text-[10px] text-green-600 border-green-600/30">
                                        {f}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Recommendations */}
                                {pred.recommendations.length > 0 && (
                                  <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                    <Lightbulb className="h-3 w-3 mt-0.5 text-yellow-500 shrink-0" />
                                    <span>{pred.recommendations[0]}</span>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No contacts in this category</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No trajectory data available</p>
            <p className="text-sm mb-4">Add contacts with communication history for predictions</p>
            <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
              Generate Predictions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
