import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, RefreshCw, Clock, MessageCircle, TrendingUp,
  Zap, Target, Calendar, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BehavioralPredictionsPanelProps {
  profileId: string;
  contactName: string;
}

interface BehavioralPrediction {
  id: string;
  prediction_type: string;
  prediction_value: any;
  confidence_score: number | null;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

const predictionTypeConfig: Record<string, { icon: any; label: string; color: string }> = {
  optimal_outreach_time: { icon: Clock, label: 'Best Contact Time', color: 'text-blue-600' },
  communication_style: { icon: MessageCircle, label: 'Communication Style', color: 'text-purple-600' },
  engagement_probability: { icon: TrendingUp, label: 'Engagement Likelihood', color: 'text-green-600' },
  churn_risk: { icon: AlertTriangle, label: 'Churn Risk', color: 'text-orange-600' },
  response_likelihood: { icon: Zap, label: 'Response Probability', color: 'text-yellow-600' },
  next_milestone: { icon: Target, label: 'Next Milestone', color: 'text-pink-600' },
};

export function BehavioralPredictionsPanel({ profileId, contactName }: BehavioralPredictionsPanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: predictions, isLoading } = useQuery({
    queryKey: ['behavioral-predictions', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('behavioral_predictions')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BehavioralPrediction[];
    },
    enabled: !!user && !!profileId,
  });

  const trainMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('train-behavior-model', {
        body: { profileId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['behavioral-predictions', profileId] });
      toast.success(`Generated ${data.predictions_count || 0} behavioral predictions`);
    },
    onError: (error) => {
      toast.error('Prediction failed: ' + error.message);
    },
  });

  // Group predictions by type and get the latest of each
  const latestPredictions = predictions?.reduce((acc, pred) => {
    if (!acc[pred.prediction_type] || new Date(pred.created_at) > new Date(acc[pred.prediction_type].created_at)) {
      acc[pred.prediction_type] = pred;
    }
    return acc;
  }, {} as Record<string, BehavioralPrediction>) || {};

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const predictionCount = Object.keys(latestPredictions).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Behavioral Predictions
            </CardTitle>
            <CardDescription>
              AI-powered behavioral forecasts for {contactName}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => trainMutation.mutate()}
            disabled={trainMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${trainMutation.isPending ? 'animate-spin' : ''}`} />
            {predictionCount > 0 ? 'Refresh' : 'Generate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictionCount > 0 ? (
          <div className="space-y-4">
            {/* Optimal Outreach Time */}
            {latestPredictions.optimal_outreach_time && (
              <PredictionCard
                prediction={latestPredictions.optimal_outreach_time}
                config={predictionTypeConfig.optimal_outreach_time}
                renderValue={(value) => (
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      {value.best_day || 'Tuesday'} at {value.best_time || '10:00 AM'}
                    </div>
                    {value.timezone && (
                      <div className="text-xs text-muted-foreground">
                        Timezone: {value.timezone}
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Communication Style */}
            {latestPredictions.communication_style && (
              <PredictionCard
                prediction={latestPredictions.communication_style}
                config={predictionTypeConfig.communication_style}
                renderValue={(value) => (
                  <div className="space-y-2">
                    <Badge className="capitalize">{value.preferred_channel || 'email'}</Badge>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Tone: </span>
                      <span className="capitalize">{value.preferred_tone || 'professional'}</span>
                    </div>
                    {value.message_length && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Length: </span>
                        <span className="capitalize">{value.message_length}</span>
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Engagement Probability */}
            {latestPredictions.engagement_probability && (
              <PredictionCard
                prediction={latestPredictions.engagement_probability}
                config={predictionTypeConfig.engagement_probability}
                renderValue={(value) => (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={typeof value === 'number' ? value * 100 : (value.score || 0) * 100} 
                        className="flex-1 h-3"
                      />
                      <span className="text-lg font-bold min-w-[60px]">
                        {Math.round((typeof value === 'number' ? value : (value.score || 0)) * 100)}%
                      </span>
                    </div>
                    {value.factors && (
                      <div className="flex flex-wrap gap-1">
                        {value.factors.slice(0, 3).map((f: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Churn Risk */}
            {latestPredictions.churn_risk && (
              <PredictionCard
                prediction={latestPredictions.churn_risk}
                config={predictionTypeConfig.churn_risk}
                renderValue={(value) => {
                  const riskLevel = typeof value === 'number' ? value : (value.score || 0);
                  const riskColor = riskLevel > 0.7 ? 'text-red-600' : riskLevel > 0.4 ? 'text-yellow-600' : 'text-green-600';
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={riskLevel * 100} 
                          className={`flex-1 h-3 ${riskLevel > 0.7 ? '[&>div]:bg-red-500' : riskLevel > 0.4 ? '[&>div]:bg-yellow-500' : ''}`}
                        />
                        <span className={`text-lg font-bold min-w-[60px] ${riskColor}`}>
                          {Math.round(riskLevel * 100)}%
                        </span>
                      </div>
                      {value.warning_signs && (
                        <div className="text-xs text-muted-foreground">
                          Warning: {value.warning_signs[0]}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            )}

            {/* Next Milestone */}
            {latestPredictions.next_milestone && (
              <PredictionCard
                prediction={latestPredictions.next_milestone}
                config={predictionTypeConfig.next_milestone}
                renderValue={(value) => (
                  <div className="space-y-1">
                    <div className="font-medium">
                      {value.event || value.description || 'Upcoming event'}
                    </div>
                    {value.predicted_date && (
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(value.predicted_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              />
            )}

            {/* Other predictions */}
            {Object.entries(latestPredictions)
              .filter(([type]) => !['optimal_outreach_time', 'communication_style', 'engagement_probability', 'churn_risk', 'next_milestone'].includes(type))
              .map(([type, prediction]) => {
                const config = predictionTypeConfig[type] || { 
                  icon: Brain, 
                  label: type.replace(/_/g, ' '), 
                  color: 'text-muted-foreground' 
                };
                return (
                  <PredictionCard
                    key={type}
                    prediction={prediction}
                    config={config}
                    renderValue={(value) => (
                      <div className="text-sm">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </div>
                    )}
                  />
                );
              })}

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Predictions based on {predictions?.length || 0} data points
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No behavioral predictions yet</p>
            <p className="text-sm mb-4">
              Train the model to predict optimal outreach times, communication styles, and more
            </p>
            <Button 
              onClick={() => trainMutation.mutate()} 
              disabled={trainMutation.isPending}
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Predictions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PredictionCardProps {
  prediction: BehavioralPrediction;
  config: { icon: any; label: string; color: string };
  renderValue: (value: any) => React.ReactNode;
}

function PredictionCard({ prediction, config, renderValue }: PredictionCardProps) {
  const Icon = config.icon;
  
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className="font-medium">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {prediction.confidence_score && (
            <Badge variant="secondary" className="text-xs">
              {Math.round(prediction.confidence_score * 100)}% confidence
            </Badge>
          )}
        </div>
      </div>
      {renderValue(prediction.prediction_value)}
      <div className="text-xs text-muted-foreground mt-2">
        Updated {formatDistanceToNow(new Date(prediction.created_at), { addSuffix: true })}
      </div>
    </div>
  );
}
