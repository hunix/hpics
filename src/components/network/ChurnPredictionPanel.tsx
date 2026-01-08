import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Clock, MessageSquare, RefreshCw, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface ChurnPrediction {
  profile_id: string;
  name: string;
  avatar_url?: string;
  relationship_type?: string;
  risk_score: number;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  days_to_critical: number;
  features: {
    days_since_contact: number;
    contact_frequency_trend: string;
    sentiment_trajectory: string;
    engagement_level: string;
  };
}

interface AIRecommendation {
  profile_id?: string;
  name?: string;
  action: string;
  urgency: string;
  expected_impact: string;
}

interface NetworkMetrics {
  total_analyzed: number;
  critical_risk: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
  average_risk: number;
}

export function ChurnPredictionPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['churn-predictions', user?.id],
    queryFn: async () => {
      const { data: result, error } = await supabase.functions.invoke('predict-churn', {
        body: { includeAllContacts: true },
      });

      if (error) throw error;
      return result as {
        predictions: ChurnPrediction[];
        recommendations: AIRecommendation[];
        network_metrics: NetworkMetrics;
        analyzed_at: string;
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const { data: result, error } = await supabase.functions.invoke('predict-churn', {
        body: { includeAllContacts: true },
      });
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churn-predictions'] });
      toast.success('Predictions refreshed with AI analysis');
    },
    onError: (error) => {
      toast.error('Failed to refresh: ' + (error as Error).message);
    },
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-amber-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive/10 border-destructive/20';
      case 'high': return 'bg-amber-500/10 border-amber-500/20';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-green-500/10 border-green-500/20';
    }
  };

  const predictions = data?.predictions?.filter(p => p.risk_score >= 20) || [];
  const recommendations = data?.recommendations || [];
  const metrics = data?.network_metrics;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-500" />
              AI Churn Prediction
            </CardTitle>
            <CardDescription>
              {metrics ? (
                <>
                  {metrics.critical_risk + metrics.high_risk} at risk • {metrics.total_analyzed} analyzed
                </>
              ) : (
                'AI-powered relationship health analysis'
              )}
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
        {/* Network Metrics Summary */}
        {metrics && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-xl font-bold text-destructive">{metrics.critical_risk}</div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">{metrics.high_risk}</div>
              <div className="text-xs text-muted-foreground">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">{metrics.medium_risk}</div>
              <div className="text-xs text-muted-foreground">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{metrics.low_risk}</div>
              <div className="text-xs text-muted-foreground">Low</div>
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">AI Intervention Recommendations</span>
            </div>
            <div className="space-y-2">
              {recommendations.slice(0, 3).map((rec, i) => (
                <div 
                  key={i} 
                  className="text-sm p-2 bg-background rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedRecommendation(rec)}
                >
                  <span className="font-medium">{rec.name || `Contact ${i + 1}`}:</span>{' '}
                  <span className="text-muted-foreground">{rec.action}</span>
                  {rec.urgency === 'immediate' && (
                    <Badge variant="destructive" className="ml-2 text-xs">Urgent</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : predictions.length > 0 ? (
          <ScrollArea className="h-[350px]">
            <div className="space-y-3">
              {predictions.map(prediction => (
                <div 
                  key={prediction.profile_id} 
                  className={`p-4 rounded-lg border ${getRiskBg(prediction.risk_level)}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={prediction.avatar_url} />
                      <AvatarFallback>{prediction.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{prediction.name}</span>
                        <Badge variant="outline" className={getRiskColor(prediction.risk_level)}>
                          {prediction.risk_level.charAt(0).toUpperCase() + prediction.risk_level.slice(1)} Risk
                        </Badge>
                        {prediction.relationship_type && (
                          <Badge variant="secondary" className="text-xs">
                            {prediction.relationship_type}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Risk Score Bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <Progress 
                          value={prediction.risk_score} 
                          className="h-2 flex-1"
                        />
                        <span className={`text-sm font-medium ${getRiskColor(prediction.risk_level)}`}>
                          {prediction.risk_score}%
                        </span>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {prediction.features.contact_frequency_trend} frequency
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {prediction.features.engagement_level} engagement
                        </Badge>
                        {prediction.features.sentiment_trajectory !== 'unknown' && (
                          <Badge variant="secondary" className="text-xs">
                            {prediction.features.sentiment_trajectory} sentiment
                          </Badge>
                        )}
                      </div>

                      {/* Last Contact */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {prediction.features.days_since_contact < 999 
                            ? `${prediction.features.days_since_contact} days since contact`
                            : 'No recorded contact'}
                        </span>
                        {prediction.days_to_critical > 0 && (
                          <span className="text-amber-600">
                            ~{prediction.days_to_critical} days to critical
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No churn risk detected</p>
            <p className="text-sm">Your relationships are healthy!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
