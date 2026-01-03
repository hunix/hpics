import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, MessageSquare, Sparkles, RefreshCw, TrendingUp } from 'lucide-react';

interface OptimalOutreachProps {
  profileId: string;
  contactName: string;
}

interface OutreachTiming {
  profileId: string;
  profileName: string;
  totalInteractions: number;
  bestDays: Array<{
    day: string;
    dayIndex: number;
    score: number;
    count: number;
    avgSentiment: number;
  }>;
  bestHours: Array<{
    hour: number;
    hourFormatted: string;
    score: number;
    count: number;
    avgSentiment: number;
  }>;
  bestChannels: Array<{
    channel: string;
    score: number;
    count: number;
    avgSentiment: number;
  }>;
  aiRecommendation: string;
  analysisDate: string;
}

export function OptimalOutreach({ profileId, contactName }: OptimalOutreachProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: timing, isLoading, refetch } = useQuery<OutreachTiming>({
    queryKey: ['outreach-timing', profileId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('suggest-outreach-timing', {
        body: { profileId }
      });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.7) return 'text-green-600 dark:text-green-400';
    if (sentiment >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'video_call': return '📹';
      case 'in_person': return '🤝';
      case 'message': return '💬';
      case 'social_media': return '📱';
      default: return '💬';
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Optimal Outreach Timing
            </CardTitle>
            <CardDescription>
              Best times to reach {contactName} based on {timing?.totalInteractions || 0} past interactions
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {timing?.totalInteractions === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No communication history yet</p>
            <p className="text-sm">Log some interactions to see timing insights</p>
          </div>
        ) : (
          <>
            {/* AI Recommendation */}
            {timing?.aiRecommendation && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">AI Recommendation</p>
                    <p className="text-sm text-muted-foreground">{timing.aiRecommendation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Best Days */}
            {timing?.bestDays && timing.bestDays.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Best Days
                </h4>
                <div className="flex flex-wrap gap-2">
                  {timing.bestDays.map((day, idx) => (
                    <div 
                      key={day.day}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        idx === 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <span className="font-medium">{day.day}</span>
                      <Badge variant="secondary" className="text-xs">
                        {day.count} interactions
                      </Badge>
                      <span className={`text-xs ${getSentimentColor(day.avgSentiment)}`}>
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        {Math.round(day.avgSentiment * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Times */}
            {timing?.bestHours && timing.bestHours.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4" />
                  Best Times
                </h4>
                <div className="flex flex-wrap gap-2">
                  {timing.bestHours.map((hour, idx) => (
                    <div 
                      key={hour.hour}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        idx === 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <span className="font-medium">{hour.hourFormatted}</span>
                      <Badge variant="secondary" className="text-xs">
                        {hour.count} interactions
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Channels */}
            {timing?.bestChannels && timing.bestChannels.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Preferred Channels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {timing.bestChannels.map((channel, idx) => (
                    <div 
                      key={channel.channel}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        idx === 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <span className="text-lg">{getChannelIcon(channel.channel)}</span>
                      <span className="font-medium capitalize">{channel.channel.replace('_', ' ')}</span>
                      <Badge variant="secondary" className="text-xs">
                        {channel.count} uses
                      </Badge>
                      <span className={`text-xs ${getSentimentColor(channel.avgSentiment)}`}>
                        {Math.round(channel.avgSentiment * 100)}% positive
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
