import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles, RefreshCw, ChevronRight, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  at_risk: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', label: 'At Risk' },
};

export function RelationshipForecastWidget() {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['relationship-trajectory', user?.id],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await invokeFunction('predict-relationship-trajectory', {}, { headers: { Authorization: `Bearer ${session.session.access_token}` } });

      if (response.error) throw response.error;
      return response.data as { predictions: TrajectoryPrediction[] };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Trajectory predictions updated');
    } catch (error) {
      toast.error('Failed to refresh predictions');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const predictions = data?.predictions || [];
  const atRisk = predictions.filter(p => p.trajectory === 'at_risk');
  const declining = predictions.filter(p => p.trajectory === 'declining');
  const growing = predictions.filter(p => p.trajectory === 'growing');

  const summary = {
    at_risk: atRisk.length,
    declining: declining.length,
    stable: predictions.filter(p => p.trajectory === 'stable').length,
    growing: growing.length,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Relationship Forecast
          </CardTitle>
          <CardDescription>30-day trajectory predictions</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(summary).map(([key, value]) => {
            const config = trajectoryConfig[key as keyof typeof trajectoryConfig];
            return (
              <div key={key} className={`p-2 rounded-lg ${config.bg} text-center`}>
                <div className={`text-lg font-bold ${config.color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Priority Alerts */}
        {(atRisk.length > 0 || declining.length > 0) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Needs Attention
            </h4>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {[...atRisk, ...declining].slice(0, 5).map((prediction) => {
                  const config = trajectoryConfig[prediction.trajectory];
                  const Icon = config.icon;
                  return (
                    <Link
                      key={prediction.profileId}
                      to={`/contacts/${prediction.profileId}`}
                      className="block"
                    >
                      <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{prediction.profileName}</span>
                          <Badge variant="outline" className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Now:</span>{' '}
                            <span className="font-medium">{prediction.currentHealth}%</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">30d:</span>{' '}
                            <span className={prediction.predictedHealth30Days < prediction.currentHealth ? 'text-destructive' : 'text-green-500'}>
                              {prediction.predictedHealth30Days}%
                            </span>
                          </div>
                        </div>

                        <Progress
                          value={prediction.currentHealth}
                          className="h-1.5 mt-2"
                        />

                        {prediction.factors.negative.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                            ⚠️ {prediction.factors.negative[0]}
                          </p>
                        )}

                        {prediction.recommendations.length > 0 && (
                          <p className="text-xs text-primary mt-1 line-clamp-1">
                            💡 {prediction.recommendations[0]}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* High Opportunity Contacts */}
        {growing.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Target className="h-4 w-4 text-green-500" />
              High Opportunity
            </h4>
            <div className="space-y-1">
              {growing.slice(0, 3).map((prediction) => (
                <Link
                  key={prediction.profileId}
                  to={`/contacts/${prediction.profileId}`}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm">{prediction.profileName}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {prediction.opportunityScore}%
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {predictions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No predictions available yet</p>
            <p className="text-xs">Add more contacts to see forecasts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
