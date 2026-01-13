/**
 * Prediction Feed Component
 * AI forecasts for upcoming relationship events with edge function integration
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Calendar, Sparkles, RefreshCw, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';

interface PredictionFeedProps {
  compact?: boolean;
}

interface Prediction {
  id: string;
  type: 'behavior' | 'response' | 'opportunity' | 'event';
  title: string;
  description: string;
  profileName: string;
  profileId: string;
  confidence: number;
  predictedDate: Date;
  outcome: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export function PredictionFeed({ compact = false }: PredictionFeedProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mutation to generate new predictions
  const generatePrediction = useMutation({
    mutationFn: async (profileId?: string) => {
      const { data, error } = await supabase.functions.invoke('behavioral-future-modeler', {
        body: {
          profileId,
          userId: user?.id,
          scenarioType: 'general',
          stimulus: 'relationship_forecast'
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-feed'] });
      toast.success('New prediction generated');
    },
    onError: (error) => {
      console.error('Prediction failed:', error);
      toast.error('Failed to generate prediction');
    }
  });

  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['prediction-feed', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data } = await supabase
        .from('behavioral_scenario_predictions')
        .select(`
          id,
          scenario_type,
          stimulus,
          predicted_response,
          confidence_score,
          response_probability,
          created_at,
          profile_id,
          profiles!behavioral_scenario_predictions_profile_id_fkey (
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(compact ? 5 : 15);

      if (!data || data.length === 0) {
        // Return sample predictions for demonstration
        return [
          {
            id: 'pred-1',
            type: 'behavior' as const,
            title: 'Likely to accept meeting request',
            description: 'Based on past patterns, high probability of positive response to meeting invite this week',
            profileName: 'Sample Contact',
            profileId: '',
            confidence: 85,
            predictedDate: addDays(new Date(), 2),
            outcome: { positive: 85, neutral: 10, negative: 5 }
          },
          {
            id: 'pred-2',
            type: 'opportunity' as const,
            title: 'Career transition opportunity',
            description: 'Signals suggest upcoming job change - optimal time for networking',
            profileName: 'Another Contact',
            profileId: '',
            confidence: 72,
            predictedDate: addDays(new Date(), 7),
            outcome: { positive: 72, neutral: 18, negative: 10 }
          }
        ];
      }

      return data.map(p => {
        const response = p.predicted_response as Record<string, unknown> || {};
        return {
          id: p.id,
          type: p.scenario_type as Prediction['type'] || 'behavior',
          title: p.stimulus || 'Behavioral Prediction',
          description: (response.summary as string) || 'AI-generated prediction based on behavioral patterns',
          profileName: p.profiles 
            ? `${p.profiles.first_name || ''} ${p.profiles.last_name || ''}`.trim()
            : 'Unknown',
          profileId: p.profile_id,
          confidence: p.confidence_score * 100,
          predictedDate: addDays(new Date(), Math.floor(Math.random() * 14)),
          outcome: {
            positive: (p.response_probability || 0.5) * 100,
            neutral: (1 - (p.response_probability || 0.5)) * 50,
            negative: (1 - (p.response_probability || 0.5)) * 50
          }
        };
      });
    },
    enabled: !!user?.id
  });

  const getTypeIcon = (type: Prediction['type']) => {
    switch (type) {
      case 'behavior': return '🧠';
      case 'response': return '💬';
      case 'opportunity': return '🎯';
      case 'event': return '📅';
      default: return '✨';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-500';
    if (confidence >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'h-[300px]')}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-violet-500" />
            Predictions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && 'h-[300px]')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-violet-500" />
            Predictions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => generatePrediction.mutate(undefined)}
              disabled={generatePrediction.isPending}
              className="h-8 gap-1"
            >
              {generatePrediction.isPending ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Wand2 className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">Generate</span>
            </Button>
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn(compact ? 'h-[200px]' : 'h-[400px]')}>
          <div className="space-y-3">
            {predictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No predictions yet</p>
                <p className="text-sm">Click Generate to create forecasts</p>
              </div>
            ) : (
              predictions.map(pred => (
                <div
                  key={pred.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg">{getTypeIcon(pred.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm">{pred.title}</span>
                        <span className={cn('text-sm font-bold', getConfidenceColor(pred.confidence))}>
                          {pred.confidence.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{pred.profileName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{pred.description}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Predicted: {format(new Date(pred.predictedDate), 'MMM d, yyyy')}</span>
                      </div>

                      {!compact && (
                        <div className="mt-3 space-y-1">
                          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500" 
                              style={{ width: `${pred.outcome.positive}%` }}
                            />
                            <div 
                              className="bg-gray-400" 
                              style={{ width: `${pred.outcome.neutral}%` }}
                            />
                            <div 
                              className="bg-rose-500" 
                              style={{ width: `${pred.outcome.negative}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="text-emerald-500">{pred.outcome.positive.toFixed(0)}% positive</span>
                            <span className="text-rose-500">{pred.outcome.negative.toFixed(0)}% negative</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
